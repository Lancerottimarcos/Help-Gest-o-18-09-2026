import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const CONFIG_FILE = path.join(process.cwd(), "supabase-config.json");
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

// Garante que o diretório de dados exista
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Erro ao criar pasta data:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // ==================================================================
  // MIDDLEWARE DE CABEÇALHOS DE SEGURANÇA (OWASP Compliant)
  // ==================================================================
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  // ==================================================================
  // ROTAS DE API (Executadas antes de qualquer middleware de frontend)
  // ==================================================================

  // Headers de controle de cache para rotas de API
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Supabase Config (compartilha chaves entre todos os computadores)
  app.get("/api/supabase-config", (_req, res) => {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return res.json(parsed);
      }
    } catch (e) {
      console.error("Erro ao ler supabase-config.json:", e);
    }

    // Retorna credenciais padrão do projeto
    res.json({
      url: "https://pniiwmpxtvckivufrqhn.supabase.co",
      anonKey: "sb_publishable_VaKxwO3n2CZWMmYUyGUVrA_ZD7H83RB",
    });
  });

  app.post("/api/supabase-config", (req, res) => {
    try {
      const { url, anonKey } = req.body || {};

      // Validação estrita de segurança da URL
      if (!url || typeof url !== "string") {
        return res.status(400).json({ success: false, error: "A URL do Supabase é obrigatória." });
      }

      const cleanUrl = url.trim();
      if (!cleanUrl.startsWith("https://") && !cleanUrl.startsWith("http://localhost")) {
        return res.status(400).json({ success: false, error: "A URL deve iniciar obrigatoriamente com https:// ou http://localhost" });
      }

      if (cleanUrl.length > 500) {
        return res.status(400).json({ success: false, error: "URL excede o limite máximo permitido." });
      }

      // Validação da Chave Anônima
      if (!anonKey || typeof anonKey !== "string") {
        return res.status(400).json({ success: false, error: "A chave anônima do Supabase é obrigatória." });
      }

      const cleanKey = anonKey.trim();
      if (cleanKey.length < 20 || cleanKey.length > 2500) {
        return res.status(400).json({ success: false, error: "Tamanho de chave de autenticação inválido." });
      }

      const data = {
        url: cleanUrl,
        anonKey: cleanKey,
        updatedAt: new Date().toISOString(),
      };

      // Gravação segura no arquivo de configuração
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
      res.json({ success: true });
    } catch (e: any) {
      console.error("Erro ao salvar supabase-config.json:", e);
      res.status(500).json({ success: false, error: "Falha interna ao persistir configuração." });
    }
  });

  // Central Database (compartilha clientes, demandas e finanças entre todos os computadores)
  app.get("/api/database", (_req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        return res.json({
          success: true,
          data: parsed,
          timestamp: Date.now(),
        });
      }
    } catch (e: any) {
      console.error("Erro ao ler data/database.json:", e);
    }

    res.json({
      success: true,
      data: null,
      timestamp: Date.now(),
    });
  });

  app.post("/api/database", (req, res) => {
    try {
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({ success: false, error: "Payload inválido. Objeto esperado." });
      }

      // Whitelist de campos permitidos na base central para evitar injeção de lixo ou dados espúrios
      const ALLOWED_COLLECTIONS = [
        "clients",
        "demands",
        "services",
        "proposals",
        "invoices",
        "activities",
        "teamMembers",
        "kanbanColumns",
        "updatedAt",
      ];

      // Mescla com os dados existentes se houver
      let currentData: any = {};
      if (fs.existsSync(DB_FILE)) {
        try {
          currentData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        } catch {}
      }

      const sanitizedUpdate: Record<string, any> = {};
      for (const key of Object.keys(body)) {
        if (ALLOWED_COLLECTIONS.includes(key)) {
          sanitizedUpdate[key] = body[key];
        }
      }

      const merged = {
        ...currentData,
        ...sanitizedUpdate,
        updatedAt: Date.now(),
      };

      fs.writeFileSync(DB_FILE, JSON.stringify(merged, null, 2), "utf-8");
      res.json({ success: true, timestamp: Date.now() });
    } catch (e: any) {
      console.error("Erro ao salvar data/database.json:", e);
      res.status(500).json({ success: false, error: "Erro ao persistir dados no banco central." });
    }
  });

  // ==================================================================
  // ROTAS PÚBLICAS DE ORÇAMENTOS (Acesso direto pelo cliente via link)
  // ==================================================================

  // Endpoint de busca direta de orçamento público para o cliente
  app.get("/api/public/proposal/:id", (req, res) => {
    try {
      const targetId = (req.params.id || "").trim().toLowerCase();
      if (!targetId) {
        return res.status(400).json({ success: false, error: "Identificador de orçamento inválido." });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        const proposals = Array.isArray(parsed?.proposals) ? parsed.proposals : [];
        const clients = Array.isArray(parsed?.clients) ? parsed.clients : [];

        const found = proposals.find(
          (p: any) =>
            p.id?.toLowerCase() === targetId ||
            p.code?.toLowerCase() === targetId ||
            (p.shareToken && p.shareToken?.toLowerCase() === targetId)
        );

        if (found) {
          let client = null;
          if (clients.length > 0) {
            client = clients.find(
              (c: any) =>
                (found.clientId && c.id === found.clientId) ||
                c.companyName?.toLowerCase() === found.clientName?.toLowerCase() ||
                c.name?.toLowerCase() === found.clientName?.toLowerCase()
            );
          }
          return res.json({ success: true, proposal: found, client });
        }
      }
    } catch (e) {
      console.error("Erro ao buscar proposta pública:", e);
    }

    res.status(404).json({ success: false, error: "Orçamento não localizado ou expirado." });
  });

  // Decisão do cliente no orçamento público (Aprovar / Recusar / Ajuste)
  app.post("/api/public/proposal/:id/decision", (req, res) => {
    try {
      const targetId = (req.params.id || "").trim().toLowerCase();
      const { action, signerName, signerRole, signerEmail, signerPhone, notes, reason, feedback } = req.body || {};

      if (!targetId || !action) {
        return res.status(400).json({ success: false, error: "Dados incompletos para processar decisão." });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        const proposals = Array.isArray(parsed?.proposals) ? parsed.proposals : [];

        const now = new Date();
        const dateNow = now.toLocaleDateString("pt-BR");
        const timeNow = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const dateTime = `${dateNow} ${timeNow}`;

        let targetFound = false;
        let updatedProposal: any = null;

        const updatedProposals = proposals.map((p: any) => {
          if (
            p.id?.toLowerCase() === targetId ||
            p.code?.toLowerCase() === targetId ||
            (p.shareToken && p.shareToken?.toLowerCase() === targetId)
          ) {
            targetFound = true;
            if (action === "Aprovado") {
              updatedProposal = {
                ...p,
                status: "Aprovado",
                approvedAt: dateTime,
                clientSignerName: signerName || p.contactName || "Cliente",
                clientSignerRole: signerRole || "Responsável",
                clientSignerEmail: signerEmail || p.clientEmail,
                clientSignerPhone: signerPhone || p.clientPhone,
                clientDecisionNote: notes,
              };
            } else if (action === "Recusado") {
              updatedProposal = {
                ...p,
                status: "Recusado",
                rejectedAt: dateTime,
                clientDecisionNote: reason || "Proposta recusada pelo cliente.",
              };
            } else {
              updatedProposal = {
                ...p,
                clientDecisionNote: feedback || "Cliente solicitou readequação de escopo.",
              };
            }
            return updatedProposal;
          }
          return p;
        });

        if (targetFound && updatedProposal) {
          parsed.proposals = updatedProposals;
          parsed.updatedAt = Date.now();
          fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
          return res.json({ success: true, proposal: updatedProposal });
        }
      }
    } catch (e) {
      console.error("Erro ao registrar decisão do orçamento:", e);
    }

    res.status(404).json({ success: false, error: "Orçamento não localizado para atualização." });
  });

  // ==================================================================
  // VITE MIDDLEWARE (Development & Production)
  // ==================================================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Help Ideias Server] Rodando com sucesso na porta ${PORT}`);
  });
}

startServer();
