/* =========================================
   Santos Gamer — API Server
   Express + SQLite (better-sqlite3) + bcrypt
   ========================================= */

const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ── */
app.use(cors());
app.use(express.json());

/* Serve static files from project root */
app.use(express.static(path.join(__dirname, "..")));

/* ── Database setup ── */
const dbPath = path.join(__dirname, "database.db");
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password   TEXT NOT NULL,
    token      TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

console.log("[DB] SQLite initialized at", dbPath);

/* ── Helpers ── */
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

function findUserByToken(token) {
  return db.prepare("SELECT id, name, email, created_at FROM users WHERE token = ?").get(token);
}

/* ── Auth middleware ── */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }
  const token = authHeader.slice(7);
  const user = findUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
  req.user = user;
  next();
}

/* ================================================
   ROUTES
   ================================================ */

/* ── POST /api/register ── */
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Preencha todos os campos" });
  }
  if (name.trim().length < 3) {
    return res.status(400).json({ error: "Nome deve ter pelo menos 3 caracteres" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "E-mail inválido" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
  }

  // Check if user exists
  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "Este e-mail já está cadastrado" });
  }

  // Hash password & create user
  const hash = bcrypt.hashSync(password, 10);
  const token = generateToken();

  const stmt = db.prepare(
    "INSERT INTO users (name, email, password, token) VALUES (?, ?, ?, ?)"
  );
  const info = stmt.run(name.trim(), email.trim().toLowerCase(), hash, token);

  console.log(`[AUTH] New user registered: ${email} (id: ${info.lastInsertRowid})`);

  res.status(201).json({
    message: "Conta criada com sucesso!",
    user: {
      id: info.lastInsertRowid,
      name: name.trim(),
      email: email.trim().toLowerCase(),
    },
    token,
  });
});

/* ── POST /api/login ── */
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Preencha e-mail e senha" });
  }

  const user = findUserByEmail(email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "E-mail ou senha incorretos" });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "E-mail ou senha incorretos" });
  }

  // Generate new token
  const token = generateToken();
  db.prepare("UPDATE users SET token = ?, updated_at = datetime('now') WHERE id = ?").run(token, user.id);

  console.log(`[AUTH] User logged in: ${user.email}`);

  res.json({
    message: "Login realizado com sucesso!",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  });
});

/* ── GET /api/me ── */
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

/* ── POST /api/logout ── */
app.post("/api/logout", requireAuth, (req, res) => {
  db.prepare("UPDATE users SET token = NULL WHERE id = ?").run(req.user.id);
  res.json({ message: "Logout realizado" });
});

/* ── GET /api/users (admin/debug) ── */
app.get("/api/users", (req, res) => {
  const users = db.prepare("SELECT id, name, email, created_at FROM users ORDER BY created_at DESC").all();
  res.json({ users, total: users.length });
});

/* ── Fallback: serve index.html for SPA-like navigation ── */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

/* ── Start server ── */
app.listen(PORT, () => {
  console.log(`\n  🎮 Santos Gamer API rodando em http://localhost:${PORT}\n`);
  console.log(`  Endpoints:`);
  console.log(`    POST /api/register  — Criar conta`);
  console.log(`    POST /api/login     — Fazer login`);
  console.log(`    GET  /api/me        — Dados do usuário logado`);
  console.log(`    POST /api/logout    — Fazer logout`);
  console.log(`    GET  /api/users     — Listar usuários (debug)\n`);
});
