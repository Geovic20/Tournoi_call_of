import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

const dbPath = isProduction
  ? "/opt/render/project/src/tournament.db"
  : path.join(__dirname, "tournament.db");
  
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teamName TEXT NOT NULL,
    player1Pseudo TEXT NOT NULL,
    player1Email TEXT NOT NULL,
    player1Whatsapp TEXT NOT NULL,
    player2Pseudo TEXT NOT NULL,
    player2Email TEXT NOT NULL,
    player2Whatsapp TEXT NOT NULL,
    isPaid INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS match_winners (
    id TEXT PRIMARY KEY, -- e.g. "ALPHA-R1-M1"
    winnerId INTEGER,
    FOREIGN KEY(winnerId) REFERENCES registrations(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/register", (req, res) => {
    try {
      const {
        teamName,
        player1Pseudo,
        player1Email,
        player1Whatsapp,
        player2Pseudo,
        player2Email,
        player2Whatsapp,
      } = req.body;

      // Check if we already have 16 teams
      const count = db.prepare("SELECT COUNT(*) as count FROM registrations").get() as { count: number };
      if (count.count >= 16) {
        return res.status(400).json({ error: "Tournament is full! (Max 16 teams)" });
      }

      const stmt = db.prepare(`
        INSERT INTO registrations (
          teamName, player1Pseudo, player1Email, player1Whatsapp,
          player2Pseudo, player2Email, player2Whatsapp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        teamName,
        player1Pseudo,
        player1Email,
        player1Whatsapp,
        player2Pseudo,
        player2Email,
        player2Whatsapp
      );

      res.json({ success: true, message: "Inscription réussie ! Vous allez être ajouté au groupe WhatsApp pour le paiement des 2000 FCFA." });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register team." });
    }
  });

  app.get("/api/registrations", (req, res) => {
    const rows = db.prepare("SELECT * FROM registrations ORDER BY createdAt ASC").all();
    res.json(rows);
  });

  // Admin Routes
  const ADMIN_PASSWORD = "admin_jei_2026";

  app.patch("/api/admin/teams/:id/paid", (req, res) => {
    if (req.headers["admin-password"] !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    const { isPaid } = req.body;
    db.prepare("UPDATE registrations SET isPaid = ? WHERE id = ?").run(isPaid ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/teams/:id", (req, res) => {
    if (req.headers["admin-password"] !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    db.prepare("DELETE FROM registrations WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/matches", (req, res) => {
    const rows = db.prepare("SELECT * FROM match_winners").all();
    res.json(rows);
  });

  app.post("/api/admin/matches", (req, res) => {
    if (req.headers["admin-password"] !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    const { matchId, winnerId } = req.body;
    db.prepare("INSERT OR REPLACE INTO match_winners (id, winnerId) VALUES (?, ?)").run(matchId, winnerId);
    res.json({ success: true });
  });

  app.delete("/api/admin/matches", (req, res) => {
    if (req.headers["admin-password"] !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
    db.prepare("DELETE FROM match_winners").run();
    res.json({ success: true });
  });

  // Vite middleware for development
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname)));

    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
