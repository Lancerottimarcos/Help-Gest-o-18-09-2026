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
  // ROTAS DE API (Executadas antes de qualquer middleware de frontend)
  // ==================================================================

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
      const { url, anonKey } = req.body;
      const data = {
        url: (url || "").trim(),
        anonKey: (anonKey || "").trim(),
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
      res.json({ success: true });
    } catch (e: any) {
      console.error("Erro ao salvar supabase-config.json:", e);
      res.status(500).json({ success: false, error: e.message });
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
      if (!body || typeof body !== "object") {
        return res.status(400).json({ success: false, error: "Payload inválido" });
      }

      // Mescla com os dados existentes se houver
      let currentData: any = {};
      if (fs.existsSync(DB_FILE)) {
        try {
          currentData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
        } catch {}
      }

      const merged = {
        ...currentData,
        ...body,
        updatedAt: Date.now(),
      };

      fs.writeFileSync(DB_FILE, JSON.stringify(merged, null, 2), "utf-8");
      res.json({ success: true, timestamp: Date.now() });
    } catch (e: any) {
      console.error("Erro ao salvar data/database.json:", e);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Help Ideias Server] Rodando com sucesso na porta ${PORT}`);
  });
}

startServer();
