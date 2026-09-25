import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function supabaseConfigApiPlugin(): Plugin {
  const configFilePath = path.resolve(__dirname, 'supabase-config.json');

  const handler = (req: any, res: any, next: () => void) => {
    const url = req.url || '';
    if (url === '/api/supabase-config' || url.startsWith('/api/supabase-config?')) {
      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        try {
          if (fs.existsSync(configFilePath)) {
            const raw = fs.readFileSync(configFilePath, 'utf-8');
            res.writeHead(200);
            res.end(raw);
            return;
          }
        } catch {}
        res.writeHead(200);
        res.end(JSON.stringify({ url: '', anonKey: '' }));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const cleanUrl = String(parsed.url || '').trim();
            const cleanKey = String(parsed.anonKey || '').trim();
            fs.writeFileSync(configFilePath, JSON.stringify({ url: cleanUrl, anonKey: cleanKey }, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: err?.message || 'Invalid JSON' }));
          }
        });
        return;
      }
    }
    next();
  };

  return {
    name: 'supabase-config-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

function databaseApiPlugin(): Plugin {
  const dataDir = path.resolve(__dirname, 'data');
  const dbFilePath = path.resolve(dataDir, 'database.json');

  const handler = (req: any, res: any, next: () => void) => {
    const url = req.url || '';
    if (url === '/api/database' || url.startsWith('/api/database?')) {
      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'application/json');
        try {
          if (fs.existsSync(dbFilePath)) {
            const raw = fs.readFileSync(dbFilePath, 'utf-8');
            const parsed = JSON.parse(raw);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, data: parsed }));
            return;
          }
        } catch {}
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: null }));
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body || '{}');
            if (!fs.existsSync(dataDir)) {
              fs.mkdirSync(dataDir, { recursive: true });
            }

            let current: any = {};
            if (fs.existsSync(dbFilePath)) {
              try {
                current = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
              } catch {}
            }

            const merged = {
              ...current,
              ...incoming,
              updatedAt: Date.now(),
            };

            fs.writeFileSync(dbFilePath, JSON.stringify(merged, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, timestamp: merged.updatedAt }));
          } catch (err: any) {
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, error: err?.message || 'Invalid JSON' }));
          }
        });
        return;
      }
    }

    if (url.startsWith('/api/public/proposal/')) {
      const parts = url.split('?')[0].split('/');
      const targetId = decodeURIComponent(parts[4] || '').trim().toLowerCase();
      const isDecision = parts[5] === 'decision';

      if (req.method === 'GET' && targetId) {
        res.setHeader('Content-Type', 'application/json');
        try {
          if (fs.existsSync(dbFilePath)) {
            const raw = fs.readFileSync(dbFilePath, 'utf-8');
            const data = JSON.parse(raw);
            const proposals = Array.isArray(data?.proposals) ? data.proposals : [];
            const clients = Array.isArray(data?.clients) ? data.clients : [];
            const found = proposals.find(
              (p: any) =>
                p.id?.toLowerCase() === targetId ||
                p.code?.toLowerCase() === targetId ||
                (p.shareToken && p.shareToken?.toLowerCase() === targetId)
            );
            if (found) {
              const client = clients.find(
                (c: any) =>
                  (found.clientId && c.id === found.clientId) ||
                  c.companyName?.toLowerCase() === found.clientName?.toLowerCase() ||
                  c.name?.toLowerCase() === found.clientName?.toLowerCase()
              );
              res.writeHead(200);
              res.end(JSON.stringify({ success: true, proposal: found, client }));
              return;
            }
          }
        } catch {}
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Orçamento não localizado' }));
        return;
      }

      if (req.method === 'POST' && isDecision && targetId) {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const { action, signerName, signerRole, signerEmail, signerPhone, notes, reason, feedback } = JSON.parse(body || '{}');
            if (fs.existsSync(dbFilePath)) {
              const raw = fs.readFileSync(dbFilePath, 'utf-8');
              const data = JSON.parse(raw);
              const proposals = Array.isArray(data?.proposals) ? data.proposals : [];
              let updatedProp: any = null;
              const now = new Date();
              const dateTime = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

              data.proposals = proposals.map((p: any) => {
                if (
                  p.id?.toLowerCase() === targetId ||
                  p.code?.toLowerCase() === targetId ||
                  (p.shareToken && p.shareToken?.toLowerCase() === targetId)
                ) {
                  if (action === 'Aprovado') {
                    updatedProp = {
                      ...p,
                      status: 'Aprovado',
                      approvedAt: dateTime,
                      clientSignerName: signerName || p.contactName || 'Cliente',
                      clientSignerRole: signerRole || 'Responsável',
                      clientSignerEmail: signerEmail || p.clientEmail,
                      clientSignerPhone: signerPhone || p.clientPhone,
                      clientDecisionNote: notes,
                    };
                  } else if (action === 'Recusado') {
                    updatedProp = {
                      ...p,
                      status: 'Recusado',
                      rejectedAt: dateTime,
                      clientDecisionNote: reason || 'Proposta recusada pelo cliente.',
                    };
                  } else {
                    updatedProp = {
                      ...p,
                      clientDecisionNote: feedback || 'Cliente solicitou readequação de escopo.',
                    };
                  }
                  return updatedProp;
                }
                return p;
              });

              if (updatedProp) {
                data.updatedAt = Date.now();
                fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                res.end(JSON.stringify({ success: true, proposal: updatedProp }));
                return;
              }
            }
          } catch {}
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(404);
          res.end(JSON.stringify({ success: false, error: 'Erro ao processar decisão' }));
        });
        return;
      }
    }
    next();
  };

  return {
    name: 'database-api',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

function httpsHstsPlugin(): Plugin {
  return {
    name: 'https-hsts-protocol',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Enforce HSTS (HTTP Strict Transport Security - RFC 6797)
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');

        const proto = req.headers['x-forwarded-proto'];
        const host = req.headers['host'];
        // If forwarded protocol is HTTP and not localhost, send 301 Permanent Redirect to HTTPS
        if (proto === 'http' && host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          res.writeHead(301, {
            Location: `https://${host}${req.url || '/'}`,
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
          });
          res.end();
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        const proto = req.headers['x-forwarded-proto'];
        const host = req.headers['host'];
        if (proto === 'http' && host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
          res.writeHead(301, {
            Location: `https://${host}${req.url || '/'}`,
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
          });
          res.end();
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), httpsHstsPlugin(), supabaseConfigApiPlugin(), databaseApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
