/* =========================================
   Santos Gamer — API Server
   Express + SQLite (better-sqlite3) + JWT
   ========================================= */

const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "santos-gamer-jwt-2026-secret-key";

/* ── Middleware ── */
app.use(cors());
app.use(express.json({ limit: "2mb" }));

/* Serve static files from project root */
app.use(express.static(path.join(__dirname, "..")));

/* ── Database setup ── */
const dbPath = path.join(__dirname, "database.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password   TEXT NOT NULL,
    nickname   TEXT DEFAULT '',
    cpf        TEXT DEFAULT '',
    phone      TEXT DEFAULT '',
    birth      TEXT DEFAULT '',
    gender     TEXT DEFAULT '',
    token      TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cart_items (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    quantity   INTEGER NOT NULL DEFAULT 1,
    name       TEXT DEFAULT '',
    price      REAL DEFAULT 0,
    category   TEXT DEFAULT '',
    UNIQUE(user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

/* ── Migration: add columns if they don't exist ── */
(function migrate() {
  const cols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  const toAdd = [
    { name: "nickname", type: "TEXT DEFAULT ''" },
    { name: "cpf", type: "TEXT DEFAULT ''" },
    { name: "phone", type: "TEXT DEFAULT ''" },
    { name: "birth", type: "TEXT DEFAULT ''" },
    { name: "gender", type: "TEXT DEFAULT ''" },
  ];
  toAdd.forEach(col => {
    if (!cols.includes(col.name)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
      console.log(`[DB] Added column users.${col.name}`);
    }
  });
})();

console.log("[DB] SQLite initialized at", dbPath);

/* ── Helpers ── */
function generateToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
}

function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

function findUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

/* ── Auth middleware (JWT) ── */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

/* ================================================
   ROUTES
   ================================================ */

/* ── POST /api/register ── */
app.post("/api/register", (req, res) => {
  const { name, email, password, nickname, cpf, phone, birth, gender } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Preencha nome, e-mail e senha" });
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

  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "Este e-mail já está cadastrado" });
  }

  const hash = bcrypt.hashSync(password, 10);

  const stmt = db.prepare(
    `INSERT INTO users (name, email, password, nickname, cpf, phone, birth, gender)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    name.trim(),
    email.trim().toLowerCase(),
    hash,
    (nickname || "").trim(),
    (cpf || "").trim(),
    (phone || "").trim(),
    (birth || "").trim(),
    (gender || "").trim()
  );

  const user = { id: info.lastInsertRowid, name: name.trim(), email: email.trim().toLowerCase() };
  const token = generateToken(user);

  console.log(`[AUTH] New user registered: ${email} (id: ${user.id})`);

  res.status(201).json({
    message: "Conta criada com sucesso!",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      nickname: (nickname || "").trim(),
      cpf: (cpf || "").trim(),
      phone: (phone || "").trim(),
      birth: (birth || "").trim(),
      gender: (gender || "").trim(),
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

  const token = generateToken(user);

  console.log(`[AUTH] User logged in: ${user.email}`);

  // Return cart items along with login
  const cartItems = db.prepare("SELECT product_id, quantity, name, price, category FROM cart_items WHERE user_id = ?").all(user.id);

  res.json({
    message: "Login realizado com sucesso!",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      nickname: user.nickname || "",
      cpf: user.cpf || "",
      phone: user.phone || "",
      birth: user.birth || "",
      gender: user.gender || "",
    },
    token,
    cart: cartItems,
  });
});

/* ── GET /api/me ── */
app.get("/api/me", requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      nickname: u.nickname || "",
      cpf: u.cpf || "",
      phone: u.phone || "",
      birth: u.birth || "",
      gender: u.gender || "",
      created_at: u.created_at,
    },
  });
});

/* ── POST /api/logout ── */
app.post("/api/logout", requireAuth, (req, res) => {
  res.json({ message: "Logout realizado" });
});

/* ── GET /api/users (admin/debug) ── */
app.get("/api/users", (req, res) => {
  const users = db.prepare("SELECT id, name, email, nickname, cpf, phone, created_at FROM users ORDER BY created_at DESC").all();
  res.json({ users, total: users.length });
});

/* ══════════════════════════════════════
   PROFILE ROUTES
   ══════════════════════════════════════ */

/* ── PUT /api/profile — Update profile fields ── */
app.put("/api/profile", requireAuth, (req, res) => {
  const { name, nickname, cpf, phone, birth, gender } = req.body;

  if (name !== undefined) {
    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: "Nome deve ter pelo menos 3 caracteres" });
    }
  }

  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push("name = ?"); params.push(name.trim()); }
  if (nickname !== undefined) { updates.push("nickname = ?"); params.push((nickname || "").trim()); }
  if (cpf !== undefined) { updates.push("cpf = ?"); params.push((cpf || "").trim()); }
  if (phone !== undefined) { updates.push("phone = ?"); params.push((phone || "").trim()); }
  if (birth !== undefined) { updates.push("birth = ?"); params.push((birth || "").trim()); }
  if (gender !== undefined) { updates.push("gender = ?"); params.push((gender || "").trim()); }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  }

  const updated = db.prepare("SELECT id, name, email, nickname, cpf, phone, birth, gender, created_at FROM users WHERE id = ?").get(req.user.id);
  console.log(`[PROFILE] User updated profile: ${updated.email}`);

  res.json({ message: "Perfil atualizado", user: updated });
});

/* ── PUT /api/profile/email — Change email ── */
app.put("/api/profile/email", requireAuth, (req, res) => {
  const { newEmail, password } = req.body;

  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return res.status(400).json({ error: "E-mail inválido" });
  }
  if (!password) {
    return res.status(400).json({ error: "Senha atual é obrigatória" });
  }

  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Senha incorreta" });
  }

  const emailLower = newEmail.trim().toLowerCase();
  const existing = findUserByEmail(emailLower);
  if (existing && existing.id !== req.user.id) {
    return res.status(409).json({ error: "Este e-mail já está em uso" });
  }

  db.prepare("UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?")
    .run(emailLower, req.user.id);

  const newToken = generateToken({ id: req.user.id, email: emailLower });

  console.log(`[PROFILE] Email changed for user ${req.user.id}: ${emailLower}`);

  res.json({
    message: "E-mail alterado com sucesso",
    user: { id: req.user.id, name: user.name, email: emailLower },
    token: newToken,
  });
});

/* ── PUT /api/profile/password — Change password ── */
app.put("/api/profile/password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) {
    return res.status(400).json({ error: "Senha atual é obrigatória" });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Nova senha deve ter pelo menos 6 caracteres" });
  }

  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const validPassword = bcrypt.compareSync(currentPassword, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Senha atual incorreta" });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?")
    .run(hash, req.user.id);

  const newToken = generateToken(user);

  console.log(`[PROFILE] Password changed for user ${req.user.id}`);

  res.json({ message: "Senha alterada com sucesso", token: newToken });
});

/* ── DELETE /api/profile — Delete account ── */
app.delete("/api/profile", requireAuth, (req, res) => {
  db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.user.id);
  db.prepare("DELETE FROM users WHERE id = ?").run(req.user.id);
  console.log(`[PROFILE] Account deleted: user ${req.user.id}`);
  res.json({ message: "Conta excluída com sucesso" });
});

/* ══════════════════════════════════════
   CART ROUTES
   ══════════════════════════════════════ */

/* ── GET /api/cart — Get user's cart ── */
app.get("/api/cart", requireAuth, (req, res) => {
  const items = db.prepare(
    "SELECT product_id, quantity, name, price, category FROM cart_items WHERE user_id = ?"
  ).all(req.user.id);
  res.json({ items });
});

/* ── PUT /api/cart — Bulk replace cart ── */
app.put("/api/cart", requireAuth, (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items deve ser um array" });
  }

  const deleteStmt = db.prepare("DELETE FROM cart_items WHERE user_id = ?");
  const insertStmt = db.prepare(
    "INSERT INTO cart_items (user_id, product_id, quantity, name, price, category) VALUES (?, ?, ?, ?, ?, ?)"
  );

  const transaction = db.transaction(() => {
    deleteStmt.run(req.user.id);
    items.forEach(item => {
      if (item.product_id && item.quantity > 0) {
        insertStmt.run(
          req.user.id, item.product_id, item.quantity,
          item.name || "", item.price || 0, item.category || ""
        );
      }
    });
  });

  transaction();
  res.json({ message: "Carrinho atualizado", count: items.length });
});

/* ── Fallback: serve index.html ── */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

/* ── Start server ── */
app.listen(PORT, () => {
  console.log(`\n  🎮 Santos Gamer API rodando em http://localhost:${PORT}\n`);
  console.log(`  Endpoints:`);
  console.log(`    POST   /api/register          — Criar conta (campos expandidos)`);
  console.log(`    POST   /api/login             — Fazer login (retorna carrinho)`);
  console.log(`    GET    /api/me                — Dados do usuário logado`);
  console.log(`    POST   /api/logout            — Fazer logout`);
  console.log(`    PUT    /api/profile            — Atualizar perfil`);
  console.log(`    PUT    /api/profile/email      — Alterar e-mail`);
  console.log(`    PUT    /api/profile/password   — Alterar senha`);
  console.log(`    DELETE /api/profile            — Excluir conta`);
  console.log(`    GET    /api/cart               — Obter carrinho`);
  console.log(`    PUT    /api/cart               — Atualizar carrinho`);
  console.log(`    GET    /api/users              — Listar usuários (debug)\n`);
  console.log(`  Auth: JWT\n`);
});
