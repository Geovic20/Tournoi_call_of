import { createServer as createViteServer } from "vite";
import pkg from "pg";
const { Pool } = pkg;
import path from "path";
import { fileURLToPath } from "url";
import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Initialize database
await pool.query(`
  CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    teamName TEXT NOT NULL,
    player1Pseudo TEXT NOT NULL,
    player1Email TEXT NOT NULL,
    player1Whatsapp TEXT NOT NULL,
    player2Pseudo TEXT NOT NULL,
    player2Email TEXT NOT NULL,
    player2Whatsapp TEXT NOT NULL,
    isPaid BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS match_winners (
    id TEXT PRIMARY KEY,
    winnerId INTEGER REFERENCES registrations(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/register", async (req: Request, res: Response) => {
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
      const countResult = await pool.query(
      "SELECT COUNT(*) FROM registrations"
    );

    const count = Number(countResult.rows[0].count);

    if (count >= 16) {
      return res.status(400).json({
        error: "Tournament is full! (Max 16 teams)",
      });
    }

      await pool.query(
      `INSERT INTO registrations (
        teamName, player1Pseudo, player1Email, player1Whatsapp,
        player2Pseudo, player2Email, player2Whatsapp
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        teamName,
        player1Pseudo,
        player1Email,
        player1Whatsapp,
        player2Pseudo,
        player2Email,
        player2Whatsapp,
      ]
    );

      res.json({ success: true, message: "Inscription réussie ! Vous allez être ajouté au groupe WhatsApp pour le paiement des 2000 FCFA." });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register team." });
    }
  });

  app.get("/api/registrations", async (req: Request, res: Response) => {
    try {
      // Postgres folds unquoted identifiers to lowercase, so columns
      // end up as teamname, player1pseudo, etc.  We alias them back
      // to camelCase for the frontend convenience.
      const result = await pool.query(
        `SELECT
           id,
           teamname AS "teamName",
           player1pseudo AS "player1Pseudo",
           player1email AS "player1Email",
           player1whatsapp AS "player1Whatsapp",
           player2pseudo AS "player2Pseudo",
           player2email AS "player2Email",
           player2whatsapp AS "player2Whatsapp",
           ispaid AS "isPaid",
           createdat AS "createdAt"
         FROM registrations
         ORDER BY createdat ASC`
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ error: "Failed to fetch registrations." });
    }
  });

  // Admin Routes
  const ADMIN_PASSWORD = "admin_jei_2026";

  app.patch("/api/admin/teams/:id/paid", async (req: Request, res: Response) => {
    try {
      if (req.headers["admin-password"] !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
      const { isPaid } = req.body;
      await pool.query("UPDATE registrations SET isPaid = $1 WHERE id = $2", [isPaid, req.params.id]);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ error: "Failed to update team." });
    }
  });

  app.delete("/api/admin/teams/:id", async (req: Request, res: Response) => {
    try {
      if (req.headers["admin-password"] !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
      await pool.query("DELETE FROM registrations WHERE id = $1", [req.params.id]);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(500).json({ error: "Failed to delete team." });
    }
  });

  app.get("/api/matches", async (req: Request, res: Response) => {
    try {
      // alias winnerid to winnerId so the client code can use camelCase
      const result = await pool.query(
        `SELECT id, winnerid AS "winnerId" FROM match_winners`
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ error: "Failed to fetch matches." });
    }
  });

  app.post("/api/admin/matches", async (req: Request, res: Response) => {
    try {
      if (req.headers["admin-password"] !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
      const { matchId, winnerId } = req.body;
      await pool.query("INSERT INTO match_winners (id, winnerId) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET winnerId = $2", [matchId, winnerId]);
      res.json({ success: true });
    } catch (error) {
      console.error("Error creating match:", error);
      res.status(500).json({ error: "Failed to create match." });
    }
  });

  app.delete("/api/admin/matches", async (req: Request, res: Response) => {
    try {
      if (req.headers["admin-password"] !== ADMIN_PASSWORD) return res.status(401).json({ error: "Unauthorized" });
      await pool.query("DELETE FROM match_winners");
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting matches:", error);
      res.status(500).json({ error: "Failed to delete matches." });
    }
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

    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, "index.html"));
    });
  }

  // Start the server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  //UptimeRobot ping every 5 minutes
  app.get("/api/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });
}

startServer();
