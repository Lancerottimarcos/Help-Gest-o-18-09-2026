import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { isValidCnpj } from "./src/utils/cnpjValidator";

const CONFIG_FILE = path.join(process.cwd(), "supabase-config.json");
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");
const CHAT_FILE = path.join(DATA_DIR, "chat-messages.json");

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
        "masterPasswordHash",
        "securityConfig",
        "newMemberDefaultPermissions",
        "collaboratorRules",
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
  // ROTAS DE CONSULTA DE CNPJ (API Pública https://publica.cnpj.ws)
  // ==================================================================
  app.get("/api/cnpj/:cnpj", async (req, res) => {
    try {
      const rawCnpj = req.params.cnpj || "";
      const cleanCnpj = rawCnpj.replace(/\D/g, "");

      if (cleanCnpj.length !== 14) {
        return res.status(400).json({
          success: false,
          error: "CNPJ inválido. Digite os 14 dígitos numéricos.",
        });
      }

      if (!isValidCnpj(cleanCnpj)) {
        return res.status(400).json({
          success: false,
          error: "CNPJ inválido. Os dígitos verificadores não conferem com o cálculo oficial da Receita Federal.",
        });
      }

      // 1. Tenta a API publica.cnpj.ws solicitada pelo usuário
      try {
        const response = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`, {
          headers: {
            "User-Agent": "HelpIdeias/1.0",
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          return res.json({
            success: true,
            source: "publica.cnpj.ws",
            data,
          });
        }

        if (response.status === 429) {
          console.warn("[CNPJ] publica.cnpj.ws rate limit (3 req/min) atingido. Usando fallback de alta disponibilidade.");
        }
      } catch (err: any) {
        console.warn("[CNPJ] Erro na requisição publica.cnpj.ws:", err.message);
      }

      // 2. Fallback de alta disponibilidade via BrasilAPI
      try {
        const fallbackRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
        if (fallbackRes.ok) {
          const fb: any = await fallbackRes.json();
          return res.json({
            success: true,
            source: "brasilapi",
            data: {
              cnpj_raiz: cleanCnpj.substring(0, 8),
              razao_social: fb.razao_social,
              capital_social: String(fb.capital_social || "0"),
              porte: {
                id: fb.porte,
                descricao: fb.porte || "Não informado",
              },
              natureza_juridica: {
                codigo: fb.codigo_natureza_juridica,
                descricao: fb.natureza_juridica,
              },
              estabelecimento: {
                cnpj: cleanCnpj,
                nome_fantasia: fb.nome_fantasia || fb.razao_social,
                situacao_cadastral: fb.descricao_situacao_cadastral || "Ativa",
                data_situacao_cadastral: fb.data_situacao_cadastral || "",
                data_inicio_atividade: fb.data_inicio_atividade || "",
                tipo_logradouro: fb.descricao_tipo_de_logradouro || "",
                logradouro: fb.logradouro || "",
                numero: fb.numero || "S/N",
                complemento: fb.complemento || "",
                bairro: fb.bairro || "",
                cep: fb.cep || "",
                ddd1: fb.ddd_telefone_1 ? fb.ddd_telefone_1.substring(0, 2) : "",
                telefone1: fb.ddd_telefone_1 ? fb.ddd_telefone_1.substring(2) : "",
                email: fb.email || "",
                cidade: {
                  nome: fb.municipio,
                },
                estado: {
                  sigla: fb.uf,
                },
                atividade_principal: {
                  id: String(fb.cnae_fiscal || ""),
                  descricao: fb.cnae_fiscal_descricao || "Atividade Empresarial",
                },
                atividades_secundarias: (fb.cnaes_secundarios || []).map((c: any) => ({
                  id: String(c.codigo || ""),
                  descricao: c.descricao || "",
                })),
              },
              socios: (fb.qsa || []).map((s: any) => ({
                nome: s.nome_socio,
                qualificacao_socio: {
                  descricao: s.qualificacao_socio,
                },
              })),
            },
          });
        }
      } catch (fbErr: any) {
        console.warn("[CNPJ] Fallback BrasilAPI falhou:", fbErr.message);
      }

      return res.status(404).json({
        success: false,
        error: "CNPJ não encontrado na base pública da Receita Federal ou limite de requisições excedido temporariamente.",
      });
    } catch (e: any) {
      console.error("[CNPJ] Erro geral ao consultar CNPJ:", e);
      return res.status(500).json({
        success: false,
        error: "Falha ao processar consulta de CNPJ.",
      });
    }
  });

  // ==================================================================
  // ROTAS PÚBLICAS DE ORÇAMENTOS (Acesso direto pelo cliente via link)
  // ==================================================================

  // Endpoint de busca direta de orçamento público para o cliente
  app.get("/api/public/proposal/:id", (req, res) => {
    try {
      const rawParam = req.params.id || "";
      let targetId = rawParam.trim().toLowerCase();
      try {
        targetId = decodeURIComponent(rawParam).trim().toLowerCase();
      } catch {}

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
      const rawParam = req.params.id || "";
      let targetId = rawParam.trim().toLowerCase();
      try {
        targetId = decodeURIComponent(rawParam).trim().toLowerCase();
      } catch {}

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
  // ROTAS DO CHAT DE COMUNICAÇÃO DA EQUIPE
  // ==================================================================
  function getChatData() {
    try {
      if (fs.existsSync(CHAT_FILE)) {
        return JSON.parse(fs.readFileSync(CHAT_FILE, "utf-8"));
      }
    } catch (e) {
      console.error("Erro ao ler chat-messages.json:", e);
    }
    return {
      channels: [
        { id: "geral", name: "Geral da Agência", description: "Canal principal para comunicados e integração da equipe", icon: "Hash" },
        { id: "demandas", name: "Projetos & Demandas", description: "Alinhamentos operacionais e prazos de entrega", icon: "Kanban" },
        { id: "criacao", name: "Criação & Design", description: "Compartilhamento de referências e feedbacks visuais", icon: "Palette" },
        { id: "atendimento", name: "Atendimento & Clientes", description: "Atualizações de reuniões e briefings", icon: "Users" }
      ],
      messages: []
    };
  }

  function saveChatData(data: any) {
    try {
      fs.writeFileSync(CHAT_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Erro ao salvar chat-messages.json:", e);
    }
  }

  // Lista canais disponíveis
  app.get("/api/chat/channels", (_req, res) => {
    try {
      const data = getChatData();
      const channels = (data.channels || []).map((ch: any) => {
        const msgs = (data.messages || []).filter((m: any) => m.channelId === ch.id);
        const lastMsg = msgs[msgs.length - 1];
        return {
          ...ch,
          totalMessages: msgs.length,
          lastMessage: lastMsg ? {
            content: lastMsg.content,
            senderName: lastMsg.senderName,
            createdAt: lastMsg.createdAt,
            timestamp: lastMsg.timestamp,
          } : null,
        };
      });
      res.json({ success: true, channels });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Lista mensagens de um canal específico
  app.get("/api/chat/messages", (req, res) => {
    try {
      const channelId = String(req.query.channelId || "geral");
      const data = getChatData();
      const messages = (data.messages || []).filter((m: any) => m.channelId === channelId);
      res.json({ success: true, messages });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Cria canal ou DM
  app.post("/api/chat/channels", (req, res) => {
    try {
      const { id, name, description, isPrivate, memberIds } = req.body;
      if (!name) return res.status(400).json({ success: false, error: "Nome do canal é obrigatório" });
      const data = getChatData();
      const channelId = id || `channel-${Date.now()}`;
      if (!data.channels) data.channels = [];
      const existing = data.channels.find((c: any) => c.id === channelId);
      if (existing) {
        return res.json({ success: true, channel: existing });
      }
      const newChannel = {
        id: channelId,
        name,
        description: description || "",
        isPrivate: Boolean(isPrivate),
        memberIds: memberIds || [],
        icon: "Hash",
      };
      data.channels.push(newChannel);
      saveChatData(data);
      broadcast({ type: "channel:new", channel: newChannel });
      res.json({ success: true, channel: newChannel });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Envia nova mensagem
  app.post("/api/chat/messages", (req, res) => {
    try {
      const { channelId = "geral", senderId, senderName, senderAvatar, senderRole, content, replyTo, attachments } = req.body;
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: "Conteúdo da mensagem não pode ser vazio." });
      }
      const data = getChatData();
      if (!data.messages) data.messages = [];

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const createdAt = `Hoje às ${timeStr}`;

      const newMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        channelId,
        senderId: senderId || "usr-anon",
        senderName: senderName || "Colaborador",
        senderAvatar: senderAvatar || "",
        senderRole: senderRole || "Membro da Equipe",
        content: content.trim(),
        timestamp: Date.now(),
        createdAt,
        reactions: {},
        isPinned: false,
        replyTo: replyTo && replyTo.id ? replyTo : undefined,
        attachments: Array.isArray(attachments) ? attachments : undefined,
      };

      data.messages.push(newMessage);
      saveChatData(data);

      // Notifica via WebSocket
      broadcast({ type: "message:new", message: newMessage });

      res.json({ success: true, message: newMessage });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Alterna reação em mensagem
  app.post("/api/chat/messages/:id/reaction", (req, res) => {
    try {
      const msgId = req.params.id;
      const { emoji, userId } = req.body;
      if (!emoji || !userId) {
        return res.status(400).json({ success: false, error: "Emoji e userId são obrigatórios." });
      }
      const data = getChatData();
      const msg = (data.messages || []).find((m: any) => m.id === msgId);
      if (!msg) {
        return res.status(404).json({ success: false, error: "Mensagem não encontrada." });
      }
      if (!msg.reactions) msg.reactions = {};
      const currentList: string[] = msg.reactions[emoji] || [];
      const userIndex = currentList.indexOf(userId);
      if (userIndex >= 0) {
        currentList.splice(userIndex, 1);
        if (currentList.length === 0) {
          delete msg.reactions[emoji];
        } else {
          msg.reactions[emoji] = currentList;
        }
      } else {
        msg.reactions[emoji] = [...currentList, userId];
      }
      saveChatData(data);

      broadcast({
        type: "reaction:updated",
        messageId: msgId,
        channelId: msg.channelId,
        reactions: msg.reactions,
      });

      res.json({ success: true, reactions: msg.reactions });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Alterna fixação de mensagem
  app.post("/api/chat/messages/:id/pin", (req, res) => {
    try {
      const msgId = req.params.id;
      const data = getChatData();
      const msg = (data.messages || []).find((m: any) => m.id === msgId);
      if (!msg) {
        return res.status(404).json({ success: false, error: "Mensagem não encontrada." });
      }
      msg.isPinned = !msg.isPinned;
      saveChatData(data);

      broadcast({
        type: "message:pinned",
        messageId: msgId,
        channelId: msg.channelId,
        isPinned: msg.isPinned,
      });

      res.json({ success: true, isPinned: msg.isPinned });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Apaga mensagem
  app.delete("/api/chat/messages/:id", (req, res) => {
    try {
      const msgId = req.params.id;
      const data = getChatData();
      const index = (data.messages || []).findIndex((m: any) => m.id === msgId);
      if (index === -1) {
        return res.status(404).json({ success: false, error: "Mensagem não encontrada." });
      }
      const [removed] = data.messages.splice(index, 1);
      saveChatData(data);

      broadcast({
        type: "message:deleted",
        messageId: msgId,
        channelId: removed?.channelId,
      });

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
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

  // ==================================================================
  // WEBSOCKET SERVER COM PRESENÇA EM TEMPO REAL
  // ==================================================================
  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  const connectedClients = new Map<WebSocket, any>();

  function broadcast(data: any, excludeWs?: WebSocket) {
    const payload = JSON.stringify(data);
    for (const [client] of connectedClients.entries()) {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  function getOnlineUsers() {
    const unique = new Map<string, any>();
    for (const [_, info] of connectedClients.entries()) {
      if (info?.userId) {
        unique.set(info.userId, {
          userId: info.userId,
          name: info.name,
          role: info.role,
          avatar: info.avatar,
          activeChannel: info.activeChannel,
          online: true,
        });
      }
    }
    return Array.from(unique.values());
  }

  wss.on("connection", (ws) => {
    connectedClients.set(ws, { status: "anonymous" });
    ws.send(JSON.stringify({ type: "presence:sync", users: getOnlineUsers() }));

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === "client:join") {
          connectedClients.set(ws, {
            userId: data.userId,
            name: data.name,
            role: data.role,
            avatar: data.avatar,
            activeChannel: data.channelId || "geral",
          });
          broadcast({ type: "presence:sync", users: getOnlineUsers() });
        } else if (data.type === "typing:start") {
          broadcast({
            type: "user:typing",
            userId: data.userId,
            userName: data.userName,
            channelId: data.channelId,
            isTyping: true,
          }, ws);
        } else if (data.type === "typing:stop") {
          broadcast({
            type: "user:typing",
            userId: data.userId,
            userName: data.userName,
            channelId: data.channelId,
            isTyping: false,
          }, ws);
        }
      } catch (err) {
        console.error("Erro WebSocket:", err);
      }
    });

    ws.on("close", () => {
      connectedClients.delete(ws);
      broadcast({ type: "presence:sync", users: getOnlineUsers() });
    });

    ws.on("error", () => {
      connectedClients.delete(ws);
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Help Ideias Server] Rodando com sucesso na porta ${PORT} (HTTP & WebSocket)`);
  });
}

startServer();
