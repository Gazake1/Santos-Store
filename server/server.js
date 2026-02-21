/* =========================================
   Santos Store — API Server
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
const JWT_SECRET = process.env.JWT_SECRET || "santos-store-jwt-2026-secret-key";

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
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL,
    email            TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password         TEXT NOT NULL,
    nickname         TEXT DEFAULT '',
    cpf              TEXT DEFAULT '',
    phone            TEXT DEFAULT '',
    phone_verified   INTEGER DEFAULT 0,
    birth            TEXT DEFAULT '',
    gender           TEXT DEFAULT '',
    theme_preference TEXT DEFAULT 'light',
    avatar           TEXT DEFAULT '',
    cep              TEXT DEFAULT '',
    street           TEXT DEFAULT '',
    street_number    TEXT DEFAULT '',
    complement       TEXT DEFAULT '',
    neighborhood     TEXT DEFAULT '',
    city             TEXT DEFAULT '',
    state            TEXT DEFAULT '',
    token            TEXT,
    created_at       TEXT DEFAULT (datetime('now')),
    updated_at       TEXT DEFAULT (datetime('now'))
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

  CREATE TABLE IF NOT EXISTS phone_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    phone      TEXT NOT NULL,
    code       TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    verified   INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

/* ── Migration: add columns if they don't exist ── */
(function migrate() {
  const cols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  const toAdd = [
    { name: "nickname", type: "TEXT DEFAULT ''" },
    { name: "cpf", type: "TEXT DEFAULT ''" },
    { name: "phone", type: "TEXT DEFAULT ''" },
    { name: "phone_verified", type: "INTEGER DEFAULT 0" },
    { name: "birth", type: "TEXT DEFAULT ''" },
    { name: "gender", type: "TEXT DEFAULT ''" },
    { name: "theme_preference", type: "TEXT DEFAULT 'light'" },
    { name: "avatar", type: "TEXT DEFAULT ''" },
    { name: "cep", type: "TEXT DEFAULT ''" },
    { name: "street", type: "TEXT DEFAULT ''" },
    { name: "street_number", type: "TEXT DEFAULT ''" },
    { name: "complement", type: "TEXT DEFAULT ''" },
    { name: "neighborhood", type: "TEXT DEFAULT ''" },
    { name: "city", type: "TEXT DEFAULT ''" },
    { name: "state", type: "TEXT DEFAULT ''" },
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

/** Build a safe user response object (no password) */
function userResponse(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    nickname: u.nickname || "",
    cpf: u.cpf || "",
    phone: u.phone || "",
    phone_verified: u.phone_verified || 0,
    birth: u.birth || "",
    gender: u.gender || "",
    theme_preference: u.theme_preference || "light",
    avatar: u.avatar || "",
    cep: u.cep || "",
    street: u.street || "",
    street_number: u.street_number || "",
    complement: u.complement || "",
    neighborhood: u.neighborhood || "",
    city: u.city || "",
    state: u.state || "",
    created_at: u.created_at,
  };
}

/* ── CPF Validation (check digit algorithm) ── */
function validateCPF(cpf) {
  const digits = (cpf || "").replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;

  return true;
}

/* ── Age Validation ── */
function calculateAge(birthDateStr) {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
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
    if (!user) return res.status(401).json({ error: "Usuário não encontrado" });
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
  const {
    name, email, password, nickname, cpf, phone, birth, gender,
    cep, street, street_number, complement, neighborhood, city, state: uf,
    phone_code
  } = req.body;

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

  // CPF validation
  if (cpf) {
    if (!validateCPF(cpf)) {
      return res.status(400).json({ error: "CPF inválido. Verifique os dígitos." });
    }
  }

  // Birth date — must be 18+
  if (birth) {
    const age = calculateAge(birth);
    if (age === null) return res.status(400).json({ error: "Data de nascimento inválida" });
    if (age < 18) return res.status(400).json({ error: "Você deve ter pelo menos 18 anos para se cadastrar" });
  }

  // Phone validation
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      return res.status(400).json({ error: "Telefone inválido. Use DDD + número." });
    }
    if (phone_code) {
      const verified = db.prepare(
        "SELECT * FROM phone_codes WHERE phone = ? AND code = ? AND verified = 1 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1"
      ).get(cleanPhone, phone_code);
      if (!verified) {
        return res.status(400).json({ error: "Código de verificação do telefone inválido ou expirado" });
      }
    }
  }

  // CEP validation
  if (cep) {
    const cleanCep = (cep || "").replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      return res.status(400).json({ error: "CEP inválido. Deve ter 8 dígitos." });
    }
  }

  const existing = findUserByEmail(email);
  if (existing) return res.status(409).json({ error: "Este e-mail já está cadastrado" });

  const hash = bcrypt.hashSync(password, 10);
  const phoneVerified = phone_code ? 1 : 0;

  const stmt = db.prepare(
    `INSERT INTO users (name, email, password, nickname, cpf, phone, phone_verified, birth, gender,
      cep, street, street_number, complement, neighborhood, city, state)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const info = stmt.run(
    name.trim(),
    email.trim().toLowerCase(),
    hash,
    (nickname || "").trim(),
    (cpf || "").replace(/\D/g, ""),
    (phone || "").replace(/\D/g, ""),
    phoneVerified,
    (birth || "").trim(),
    (gender || "").trim(),
    (cep || "").replace(/\D/g, ""),
    (street || "").trim(),
    (street_number || "").trim(),
    (complement || "").trim(),
    (neighborhood || "").trim(),
    (city || "").trim(),
    (uf || "").trim()
  );

  const newUser = findUserById(info.lastInsertRowid);
  const token = generateToken(newUser);

  console.log(`[AUTH] New user registered: ${email} (id: ${newUser.id})`);

  res.status(201).json({
    message: "Conta criada com sucesso!",
    user: userResponse(newUser),
    token,
  });
});

/* ── POST /api/login ── */
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: "Preencha e-mail e senha" });

  const user = findUserByEmail(email.trim().toLowerCase());
  if (!user) return res.status(401).json({ error: "E-mail ou senha incorretos" });

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) return res.status(401).json({ error: "E-mail ou senha incorretos" });

  const token = generateToken(user);
  console.log(`[AUTH] User logged in: ${user.email}`);

  const cartItems = db.prepare("SELECT product_id, quantity, name, price, category FROM cart_items WHERE user_id = ?").all(user.id);

  res.json({
    message: "Login realizado com sucesso!",
    user: userResponse(user),
    token,
    cart: cartItems,
  });
});

/* ── GET /api/me ── */
app.get("/api/me", requireAuth, (req, res) => {
  const cartItems = db.prepare("SELECT product_id, quantity, name, price, category FROM cart_items WHERE user_id = ?").all(req.user.id);
  res.json({ user: userResponse(req.user), cart: cartItems });
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
   PHONE VERIFICATION
   ══════════════════════════════════════ */

/* ── POST /api/verify/send-code ── */
app.post("/api/verify/send-code", (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Telefone é obrigatório" });

  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return res.status(400).json({ error: "Telefone inválido" });
  }

  // Rate limit: 1 code per minute
  const recent = db.prepare(
    "SELECT * FROM phone_codes WHERE phone = ? AND created_at > datetime('now', '-1 minute') ORDER BY id DESC LIMIT 1"
  ).get(cleanPhone);
  if (recent) return res.status(429).json({ error: "Aguarde 1 minuto para reenviar o código" });

  const code = String(Math.floor(100000 + Math.random() * 900000));

  db.prepare(
    "INSERT INTO phone_codes (phone, code, expires_at) VALUES (?, ?, datetime('now', '+10 minutes'))"
  ).run(cleanPhone, code);

  // In production, send via SMS (Twilio, AWS SNS, etc.)
  console.log(`\n  📱 CÓDIGO DE VERIFICAÇÃO para ${cleanPhone}: ${code}\n`);

  res.json({ message: "Código de verificação enviado!", debug_code: code });
});

/* ── POST /api/verify/confirm-code ── */
app.post("/api/verify/confirm-code", (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: "Telefone e código são obrigatórios" });

  const cleanPhone = phone.replace(/\D/g, "");
  const record = db.prepare(
    "SELECT * FROM phone_codes WHERE phone = ? AND code = ? AND verified = 0 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1"
  ).get(cleanPhone, code);

  if (!record) return res.status(400).json({ error: "Código inválido ou expirado" });

  db.prepare("UPDATE phone_codes SET verified = 1 WHERE id = ?").run(record.id);
  console.log(`[VERIFY] Phone verified: ${cleanPhone}`);

  res.json({ message: "Telefone verificado com sucesso!", verified: true });
});

/* ══════════════════════════════════════
   PROFILE ROUTES
   ══════════════════════════════════════ */

/* ── PUT /api/profile ── */
app.put("/api/profile", requireAuth, (req, res) => {
  const {
    name, nickname, cpf, phone, birth, gender,
    theme_preference, avatar,
    cep, street, street_number, complement, neighborhood, city, state: uf
  } = req.body;

  if (name !== undefined && (!name || name.trim().length < 3)) {
    return res.status(400).json({ error: "Nome deve ter pelo menos 3 caracteres" });
  }
  if (cpf !== undefined && cpf && !validateCPF(cpf)) {
    return res.status(400).json({ error: "CPF inválido. Verifique os dígitos." });
  }
  if (birth !== undefined && birth) {
    const age = calculateAge(birth);
    if (age === null) return res.status(400).json({ error: "Data de nascimento inválida" });
    if (age < 18) return res.status(400).json({ error: "Você deve ter pelo menos 18 anos" });
  }

  const updates = [];
  const params = [];

  if (name !== undefined) { updates.push("name = ?"); params.push(name.trim()); }
  if (nickname !== undefined) { updates.push("nickname = ?"); params.push((nickname || "").trim()); }
  if (cpf !== undefined) { updates.push("cpf = ?"); params.push((cpf || "").replace(/\D/g, "")); }
  if (phone !== undefined) { updates.push("phone = ?"); params.push((phone || "").replace(/\D/g, "")); }
  if (birth !== undefined) { updates.push("birth = ?"); params.push((birth || "").trim()); }
  if (gender !== undefined) { updates.push("gender = ?"); params.push((gender || "").trim()); }
  if (theme_preference !== undefined) { updates.push("theme_preference = ?"); params.push((theme_preference || "light").trim()); }
  if (avatar !== undefined) { updates.push("avatar = ?"); params.push((avatar || "").trim()); }
  if (cep !== undefined) { updates.push("cep = ?"); params.push((cep || "").replace(/\D/g, "")); }
  if (street !== undefined) { updates.push("street = ?"); params.push((street || "").trim()); }
  if (street_number !== undefined) { updates.push("street_number = ?"); params.push((street_number || "").trim()); }
  if (complement !== undefined) { updates.push("complement = ?"); params.push((complement || "").trim()); }
  if (neighborhood !== undefined) { updates.push("neighborhood = ?"); params.push((neighborhood || "").trim()); }
  if (city !== undefined) { updates.push("city = ?"); params.push((city || "").trim()); }
  if (uf !== undefined) { updates.push("state = ?"); params.push((uf || "").trim()); }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  }

  const updated = findUserById(req.user.id);
  console.log(`[PROFILE] User updated profile: ${updated.email}`);
  res.json({ message: "Perfil atualizado", user: userResponse(updated) });
});

/* ── PUT /api/profile/theme ── */
app.put("/api/profile/theme", requireAuth, (req, res) => {
  const { theme } = req.body;
  if (!["light", "dark"].includes(theme)) return res.status(400).json({ error: "Tema inválido" });
  db.prepare("UPDATE users SET theme_preference = ?, updated_at = datetime('now') WHERE id = ?").run(theme, req.user.id);
  res.json({ message: "Tema atualizado", theme });
});

/* ── PUT /api/profile/email ── */
app.put("/api/profile/email", requireAuth, (req, res) => {
  const { newEmail, password } = req.body;
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return res.status(400).json({ error: "E-mail inválido" });
  }
  if (!password) return res.status(400).json({ error: "Senha atual é obrigatória" });

  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Senha incorreta" });

  const emailLower = newEmail.trim().toLowerCase();
  const existing = findUserByEmail(emailLower);
  if (existing && existing.id !== req.user.id) return res.status(409).json({ error: "Este e-mail já está em uso" });

  db.prepare("UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?").run(emailLower, req.user.id);
  const newToken = generateToken({ id: req.user.id, email: emailLower });
  console.log(`[PROFILE] Email changed for user ${req.user.id}: ${emailLower}`);
  res.json({ message: "E-mail alterado com sucesso", user: { id: req.user.id, name: user.name, email: emailLower }, token: newToken });
});

/* ── PUT /api/profile/password ── */
app.put("/api/profile/password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword) return res.status(400).json({ error: "Senha atual é obrigatória" });
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "Nova senha deve ter pelo menos 6 caracteres" });

  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
  if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: "Senha atual incorreta" });

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hash, req.user.id);
  const newToken = generateToken(user);
  console.log(`[PROFILE] Password changed for user ${req.user.id}`);
  res.json({ message: "Senha alterada com sucesso", token: newToken });
});

/* ── DELETE /api/profile ── */
app.delete("/api/profile", requireAuth, (req, res) => {
  db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.user.id);
  db.prepare("DELETE FROM users WHERE id = ?").run(req.user.id);
  console.log(`[PROFILE] Account deleted: user ${req.user.id}`);
  res.json({ message: "Conta excluída com sucesso" });
});

/* ══════════════════════════════════════
   CART ROUTES
   ══════════════════════════════════════ */

app.get("/api/cart", requireAuth, (req, res) => {
  const items = db.prepare("SELECT product_id, quantity, name, price, category FROM cart_items WHERE user_id = ?").all(req.user.id);
  res.json({ items });
});

app.put("/api/cart", requireAuth, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: "items deve ser um array" });

  const deleteStmt = db.prepare("DELETE FROM cart_items WHERE user_id = ?");
  const insertStmt = db.prepare("INSERT INTO cart_items (user_id, product_id, quantity, name, price, category) VALUES (?, ?, ?, ?, ?, ?)");

  const transaction = db.transaction(() => {
    deleteStmt.run(req.user.id);
    items.forEach(item => {
      if (item.product_id && item.quantity > 0) {
        insertStmt.run(req.user.id, item.product_id, item.quantity, item.name || "", item.price || 0, item.category || "");
      }
    });
  });

  transaction();
  res.json({ message: "Carrinho atualizado", count: items.length });
});

/* ── Fallback ── */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

/* ── Start server ── */
app.listen(PORT, () => {
  console.log(`\n  🏪 Santos Store API rodando em http://localhost:${PORT}\n`);
  console.log(`  Endpoints:`);
  console.log(`    POST   /api/register              — Criar conta (validação completa)`);
  console.log(`    POST   /api/login                 — Login (retorna carrinho + perfil)`);
  console.log(`    GET    /api/me                    — Dados do usuário + carrinho`);
  console.log(`    POST   /api/verify/send-code      — Enviar código verificação telefone`);
  console.log(`    POST   /api/verify/confirm-code   — Confirmar código verificação`);
  console.log(`    PUT    /api/profile                — Atualizar perfil`);
  console.log(`    PUT    /api/profile/theme          — Atualizar tema`);
  console.log(`    PUT    /api/profile/email          — Alterar e-mail`);
  console.log(`    PUT    /api/profile/password       — Alterar senha`);
  console.log(`    DELETE /api/profile                — Excluir conta`);
  console.log(`    GET    /api/cart                   — Obter carrinho`);
  console.log(`    PUT    /api/cart                   — Atualizar carrinho\n`);
  console.log(`  Validações: CPF (dígitos), 18+, Telefone (código), CEP\n`);
});
