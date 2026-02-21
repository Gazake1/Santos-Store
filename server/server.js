/* =========================================
   Santos Store — API Server (Production)
   Express + SQLite + JWT + Helmet + Rate Limit
   Admin panel, product CRUD, WhatsApp codes
   ========================================= */

require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const rateLimit  = require("express-rate-limit");
const path       = require("path");
const fs         = require("fs");
const Database   = require("better-sqlite3");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const multer     = require("multer");
const crypto     = require("crypto");

/* ── Config ── */
const PORT          = process.env.PORT || 3000;
const NODE_ENV      = process.env.NODE_ENV || "development";
const JWT_SECRET    = process.env.JWT_SECRET || "santos-store-jwt-2026-secret-key";
const ADMIN_EMAIL   = process.env.ADMIN_EMAIL || "admin@santosstore.com";
const ADMIN_PASSWORD= process.env.ADMIN_PASSWORD || "admin123";
const WA_API_URL    = process.env.WA_API_URL || "";
const WA_API_KEY    = process.env.WA_API_KEY || "";
const WA_INSTANCE   = process.env.WA_INSTANCE || "";

const app = express();

/* ══════════════════════════════════════
   SECURITY MIDDLEWARE
   ══════════════════════════════════════ */

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: NODE_ENV === "production"
    ? [/santosstore/, /localhost/]
    : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

/* Global rate limit: 200 req / 15 min */
app.use("/api/", rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
}));

/* Strict auth limiter: 10 req / 15 min */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Muitas tentativas de login. Aguarde 15 minutos." },
});

/* Upload limiter: 30 req / 15 min */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Muitos uploads. Aguarde alguns minutos." },
});

app.use(express.json({ limit: "5mb" }));

/* Serve static files */
app.use(express.static(path.join(__dirname, ".."), {
  maxAge: NODE_ENV === "production" ? "1d" : 0,
}));

/* Serve uploaded files */
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir, {
  maxAge: NODE_ENV === "production" ? "7d" : 0,
}));

/* ══════════════════════════════════════
   MULTER — Image Upload
   ══════════════════════════════════════ */

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `product-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Apenas imagens (jpg, png, webp, gif) são permitidas."));
    }
  },
});

/* ══════════════════════════════════════
   DATABASE
   ══════════════════════════════════════ */

const dbPath = path.join(__dirname, "database.db");
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/* ── Tables ── */
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT NOT NULL,
    email            TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password         TEXT NOT NULL,
    role             TEXT DEFAULT 'user',
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

  CREATE TABLE IF NOT EXISTS products (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    title             TEXT NOT NULL,
    slug              TEXT NOT NULL UNIQUE,
    description       TEXT DEFAULT '',
    short_description TEXT DEFAULT '',
    category          TEXT DEFAULT '',
    price             REAL NOT NULL DEFAULT 0,
    original_price    REAL DEFAULT 0,
    installment_count INTEGER DEFAULT 0,
    accepts_card      INTEGER DEFAULT 1,
    accepts_pix       INTEGER DEFAULT 1,
    accepts_boleto    INTEGER DEFAULT 0,
    stock             INTEGER DEFAULT 0,
    sold              INTEGER DEFAULT 0,
    tag               TEXT DEFAULT '',
    images            TEXT DEFAULT '[]',
    specs             TEXT DEFAULT '{}',
    active            INTEGER DEFAULT 1,
    featured          INTEGER DEFAULT 0,
    created_by        INTEGER,
    created_at        TEXT DEFAULT (datetime('now')),
    updated_at        TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
`);

/* ── Migration: add columns if missing ── */
(function migrate() {
  const userCols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
  const toAdd = [
    { name: "role", type: "TEXT DEFAULT 'user'" },
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
    if (!userCols.includes(col.name)) {
      db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
      console.log(`[DB] Added column users.${col.name}`);
    }
  });
})();

/* ── Seed admin account ── */
(function seedAdmin() {
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(ADMIN_EMAIL.toLowerCase());
  if (!existing) {
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
    db.prepare(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')`
    ).run("Admin Santos Store", ADMIN_EMAIL.toLowerCase(), hash);
    console.log(`[ADMIN] Admin account created: ${ADMIN_EMAIL}`);
  } else {
    /* Ensure role is admin */
    db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(ADMIN_EMAIL.toLowerCase());
  }
})();

console.log(`[DB] SQLite initialized at ${dbPath}`);

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */

function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role || "user" },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

function findUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

function userResponse(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || "user",
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

function calculateAge(birthDateStr) {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function slugify(text) {
  return text
    .toString().toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ── WhatsApp code sending ── */
async function sendWhatsAppCode(phone, code) {
  const cleanPhone = phone.replace(/\D/g, "");

  if (WA_API_URL && WA_API_KEY) {
    try {
      const response = await fetch(`${WA_API_URL}/message/sendText/${WA_INSTANCE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: WA_API_KEY,
        },
        body: JSON.stringify({
          number: `55${cleanPhone}@s.whatsapp.net`,
          text: `🔐 *Santos Store*\n\nSeu código de verificação é: *${code}*\n\nEle é válido por 10 minutos.\nSe você não solicitou, ignore esta mensagem.`,
        }),
      });
      if (response.ok) {
        console.log(`[WA] Code sent to ${cleanPhone} via WhatsApp`);
        return { sent: true, method: "whatsapp" };
      }
      throw new Error(`Status ${response.status}`);
    } catch (err) {
      console.error(`[WA] Failed: ${err.message}. Falling back to console.`);
    }
  }

  /* Fallback: log to console */
  console.log(`\n  📱 CÓDIGO DE VERIFICAÇÃO para ${cleanPhone}: ${code}\n`);
  return { sent: false, method: "console", debug_code: code };
}

/* ══════════════════════════════════════
   AUTH MIDDLEWARE
   ══════════════════════════════════════ */

function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token não fornecido" });
  }
  try {
    const decoded = jwt.verify(h.slice(7), JWT_SECRET);
    const user = findUserById(decoded.userId);
    if (!user) return res.status(401).json({ error: "Usuário não encontrado" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores." });
  }
  next();
}

/* ══════════════════════════════════════
   AUTH ROUTES
   ══════════════════════════════════════ */

/* ── POST /api/register ── */
app.post("/api/register", authLimiter, (req, res) => {
  const {
    name, email, password, nickname, cpf, phone, birth, gender,
    cep, street, street_number, complement, neighborhood, city, state: uf,
    phone_code,
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Preencha nome, e-mail e senha" });
  }
  if (name.trim().length < 3) return res.status(400).json({ error: "Nome deve ter pelo menos 3 caracteres" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "E-mail inválido" });
  if (password.length < 6) return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });

  if (cpf && !validateCPF(cpf)) return res.status(400).json({ error: "CPF inválido. Verifique os dígitos." });

  if (birth) {
    const age = calculateAge(birth);
    if (age === null) return res.status(400).json({ error: "Data de nascimento inválida" });
    if (age < 18) return res.status(400).json({ error: "Você deve ter pelo menos 18 anos para se cadastrar" });
  }

  if (phone) {
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10 || clean.length > 11) return res.status(400).json({ error: "Telefone inválido" });
    if (phone_code) {
      const verified = db.prepare(
        "SELECT * FROM phone_codes WHERE phone = ? AND code = ? AND verified = 1 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1"
      ).get(clean, phone_code);
      if (!verified) return res.status(400).json({ error: "Código de verificação inválido ou expirado" });
    }
  }

  if (cep && (cep.replace(/\D/g, "")).length !== 8) return res.status(400).json({ error: "CEP inválido" });

  const existing = findUserByEmail(email.trim().toLowerCase());
  if (existing) return res.status(409).json({ error: "Este e-mail já está cadastrado" });

  const hash = bcrypt.hashSync(password, 12);
  const phoneVerified = phone_code ? 1 : 0;

  const info = db.prepare(
    `INSERT INTO users (name,email,password,role,nickname,cpf,phone,phone_verified,birth,gender,cep,street,street_number,complement,neighborhood,city,state)
     VALUES (?,?,?,'user',?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    name.trim(), email.trim().toLowerCase(), hash,
    (nickname || "").trim(), (cpf || "").replace(/\D/g, ""),
    (phone || "").replace(/\D/g, ""), phoneVerified,
    (birth || "").trim(), (gender || "").trim(),
    (cep || "").replace(/\D/g, ""), (street || "").trim(),
    (street_number || "").trim(), (complement || "").trim(),
    (neighborhood || "").trim(), (city || "").trim(), (uf || "").trim()
  );

  const newUser = findUserById(info.lastInsertRowid);
  const token = generateToken(newUser);
  console.log(`[AUTH] User registered: ${email} (id: ${newUser.id})`);

  res.status(201).json({ message: "Conta criada com sucesso!", user: userResponse(newUser), token });
});

/* ── POST /api/login ── */
app.post("/api/login", authLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Preencha e-mail e senha" });

  const user = findUserByEmail(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "E-mail ou senha incorretos" });
  }

  const token = generateToken(user);
  const cartItems = db.prepare(
    "SELECT product_id, quantity, name, price, category FROM cart_items WHERE user_id = ?"
  ).all(user.id);

  console.log(`[AUTH] Login: ${user.email} (role: ${user.role || "user"})`);

  res.json({
    message: "Login realizado com sucesso!",
    user: userResponse(user),
    token,
    cart: cartItems,
  });
});

/* ── GET /api/me ── */
app.get("/api/me", requireAuth, (req, res) => {
  const cartItems = db.prepare(
    "SELECT product_id, quantity, name, price, category FROM cart_items WHERE user_id = ?"
  ).all(req.user.id);
  res.json({ user: userResponse(req.user), cart: cartItems });
});

/* ── POST /api/logout ── */
app.post("/api/logout", requireAuth, (_req, res) => {
  res.json({ message: "Logout realizado" });
});

/* ══════════════════════════════════════
   PHONE VERIFICATION
   ══════════════════════════════════════ */

app.post("/api/verify/send-code", authLimiter, async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Telefone é obrigatório" });

  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return res.status(400).json({ error: "Telefone inválido" });
  }

  const recent = db.prepare(
    "SELECT * FROM phone_codes WHERE phone = ? AND created_at > datetime('now', '-1 minute') ORDER BY id DESC LIMIT 1"
  ).get(cleanPhone);
  if (recent) return res.status(429).json({ error: "Aguarde 1 minuto para reenviar o código" });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.prepare(
    "INSERT INTO phone_codes (phone, code, expires_at) VALUES (?, ?, datetime('now', '+10 minutes'))"
  ).run(cleanPhone, code);

  const result = await sendWhatsAppCode(cleanPhone, code);
  const response = { message: "Código de verificação enviado!" };

  /* In dev, return the code for testing */
  if (NODE_ENV !== "production" || !result.sent) {
    response.debug_code = code;
  }

  res.json(response);
});

app.post("/api/verify/confirm-code", authLimiter, (req, res) => {
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

app.put("/api/profile", requireAuth, (req, res) => {
  const {
    name, nickname, cpf, phone, birth, gender,
    theme_preference, avatar,
    cep, street, street_number, complement, neighborhood, city, state: uf,
  } = req.body;

  if (name !== undefined && (!name || name.trim().length < 3)) {
    return res.status(400).json({ error: "Nome deve ter pelo menos 3 caracteres" });
  }
  if (cpf !== undefined && cpf && !validateCPF(cpf)) {
    return res.status(400).json({ error: "CPF inválido" });
  }
  if (birth !== undefined && birth) {
    const age = calculateAge(birth);
    if (age === null) return res.status(400).json({ error: "Data de nascimento inválida" });
    if (age < 18) return res.status(400).json({ error: "Você deve ter pelo menos 18 anos" });
  }

  const updates = [];
  const params = [];

  const fields = {
    name: v => v.trim(),
    nickname: v => (v || "").trim(),
    cpf: v => (v || "").replace(/\D/g, ""),
    phone: v => (v || "").replace(/\D/g, ""),
    birth: v => (v || "").trim(),
    gender: v => (v || "").trim(),
    theme_preference: v => (v || "light").trim(),
    avatar: v => (v || "").trim(),
    cep: v => (v || "").replace(/\D/g, ""),
    street: v => (v || "").trim(),
    street_number: v => (v || "").trim(),
    complement: v => (v || "").trim(),
    neighborhood: v => (v || "").trim(),
    city: v => (v || "").trim(),
  };

  Object.entries(fields).forEach(([key, transform]) => {
    const val = req.body[key];
    if (val !== undefined) {
      updates.push(`${key} = ?`);
      params.push(transform(val));
    }
  });

  if (uf !== undefined) {
    updates.push("state = ?");
    params.push((uf || "").trim());
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  }

  const updated = findUserById(req.user.id);
  res.json({ message: "Perfil atualizado", user: userResponse(updated) });
});

app.put("/api/profile/theme", requireAuth, (req, res) => {
  const { theme } = req.body;
  if (!["light", "dark"].includes(theme)) return res.status(400).json({ error: "Tema inválido" });
  db.prepare("UPDATE users SET theme_preference = ?, updated_at = datetime('now') WHERE id = ?").run(theme, req.user.id);
  res.json({ message: "Tema atualizado", theme });
});

app.put("/api/profile/email", requireAuth, (req, res) => {
  const { newEmail, password } = req.body;
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return res.status(400).json({ error: "E-mail inválido" });
  }
  if (!password) return res.status(400).json({ error: "Senha atual é obrigatória" });

  const user = findUserById(req.user.id);
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: "Senha incorreta" });

  const emailLower = newEmail.trim().toLowerCase();
  const existing = findUserByEmail(emailLower);
  if (existing && existing.id !== req.user.id) return res.status(409).json({ error: "Este e-mail já está em uso" });

  db.prepare("UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?").run(emailLower, req.user.id);
  const newToken = generateToken({ ...user, email: emailLower });
  res.json({ message: "E-mail alterado com sucesso", user: { id: req.user.id, name: user.name, email: emailLower }, token: newToken });
});

app.put("/api/profile/password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword) return res.status(400).json({ error: "Senha atual é obrigatória" });
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: "Nova senha deve ter pelo menos 6 caracteres" });

  const user = findUserById(req.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: "Senha atual incorreta" });

  const hash = bcrypt.hashSync(newPassword, 12);
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hash, req.user.id);
  const newToken = generateToken(user);
  res.json({ message: "Senha alterada com sucesso", token: newToken });
});

app.delete("/api/profile", requireAuth, (req, res) => {
  db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(req.user.id);
  db.prepare("DELETE FROM users WHERE id = ?").run(req.user.id);
  res.json({ message: "Conta excluída com sucesso" });
});

/* ══════════════════════════════════════
   CART ROUTES
   ══════════════════════════════════════ */

app.get("/api/cart", requireAuth, (req, res) => {
  const items = db.prepare(
    "SELECT product_id, quantity, name, price, category FROM cart_items WHERE user_id = ?"
  ).all(req.user.id);
  res.json({ items });
});

app.put("/api/cart", requireAuth, (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: "items deve ser um array" });

  const del = db.prepare("DELETE FROM cart_items WHERE user_id = ?");
  const ins = db.prepare(
    "INSERT INTO cart_items (user_id, product_id, quantity, name, price, category) VALUES (?,?,?,?,?,?)"
  );

  db.transaction(() => {
    del.run(req.user.id);
    items.forEach(item => {
      if (item.product_id && item.quantity > 0) {
        ins.run(req.user.id, item.product_id, item.quantity, item.name || "", item.price || 0, item.category || "");
      }
    });
  })();

  res.json({ message: "Carrinho atualizado", count: items.length });
});

/* ══════════════════════════════════════
   PRODUCT ROUTES (Public)
   ══════════════════════════════════════ */

app.get("/api/products", (_req, res) => {
  const products = db.prepare(
    "SELECT * FROM products WHERE active = 1 ORDER BY featured DESC, created_at DESC"
  ).all();

  const parsed = products.map(p => ({
    ...p,
    images: JSON.parse(p.images || "[]"),
    specs: JSON.parse(p.specs || "{}"),
  }));

  res.json({ products: parsed, total: parsed.length });
});

app.get("/api/products/:slug", (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE slug = ?").get(req.params.slug);
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });

  res.json({
    product: {
      ...product,
      images: JSON.parse(product.images || "[]"),
      specs: JSON.parse(product.specs || "{}"),
    },
  });
});

/* ══════════════════════════════════════
   ADMIN ROUTES
   ══════════════════════════════════════ */

/* ── Dashboard stats ── */
app.get("/api/admin/stats", requireAuth, requireAdmin, (_req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
  const totalProducts = db.prepare("SELECT COUNT(*) as c FROM products").get().c;
  const activeProducts = db.prepare("SELECT COUNT(*) as c FROM products WHERE active = 1").get().c;
  const totalSold = db.prepare("SELECT COALESCE(SUM(sold), 0) as c FROM products").get().c;
  res.json({ totalUsers, totalProducts, activeProducts, totalSold });
});

/* ── List all products (admin view — includes inactive) ── */
app.get("/api/admin/products", requireAuth, requireAdmin, (_req, res) => {
  const products = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
  const parsed = products.map(p => ({
    ...p,
    images: JSON.parse(p.images || "[]"),
    specs: JSON.parse(p.specs || "{}"),
  }));
  res.json({ products: parsed, total: parsed.length });
});

/* ── Create product ── */
app.post("/api/admin/products", requireAuth, requireAdmin, (req, res) => {
  const {
    title, description, short_description, category, price, original_price,
    installment_count, accepts_card, accepts_pix, accepts_boleto,
    stock, tag, specs, active, featured,
  } = req.body;

  if (!title || price === undefined) {
    return res.status(400).json({ error: "Título e preço são obrigatórios" });
  }

  let slug = slugify(title);
  const existingSlug = db.prepare("SELECT id FROM products WHERE slug = ?").get(slug);
  if (existingSlug) slug += `-${Date.now().toString(36)}`;

  const info = db.prepare(
    `INSERT INTO products (title,slug,description,short_description,category,price,original_price,
      installment_count,accepts_card,accepts_pix,accepts_boleto,stock,sold,tag,images,specs,active,featured,created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?,'[]',?,?,?,?)`
  ).run(
    title.trim(), slug, (description || "").trim(), (short_description || "").trim(),
    (category || "").trim(), Number(price) || 0, Number(original_price) || 0,
    Number(installment_count) || 0, accepts_card ? 1 : 0, accepts_pix !== false ? 1 : 0,
    accepts_boleto ? 1 : 0, Number(stock) || 0, (tag || "").trim(),
    JSON.stringify(specs || {}), active !== false ? 1 : 0, featured ? 1 : 0, req.user.id
  );

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(info.lastInsertRowid);
  console.log(`[ADMIN] Product created: "${title}" (id: ${product.id})`);

  res.status(201).json({
    message: "Produto criado com sucesso!",
    product: { ...product, images: JSON.parse(product.images), specs: JSON.parse(product.specs) },
  });
});

/* ── Update product ── */
app.put("/api/admin/products/:id", requireAuth, requireAdmin, (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });

  const {
    title, description, short_description, category, price, original_price,
    installment_count, accepts_card, accepts_pix, accepts_boleto,
    stock, sold, tag, specs, active, featured,
  } = req.body;

  const updates = [];
  const params = [];

  if (title !== undefined)             { updates.push("title = ?"); params.push(title.trim()); }
  if (description !== undefined)       { updates.push("description = ?"); params.push(description.trim()); }
  if (short_description !== undefined) { updates.push("short_description = ?"); params.push(short_description.trim()); }
  if (category !== undefined)          { updates.push("category = ?"); params.push(category.trim()); }
  if (price !== undefined)             { updates.push("price = ?"); params.push(Number(price)); }
  if (original_price !== undefined)    { updates.push("original_price = ?"); params.push(Number(original_price)); }
  if (installment_count !== undefined) { updates.push("installment_count = ?"); params.push(Number(installment_count)); }
  if (accepts_card !== undefined)      { updates.push("accepts_card = ?"); params.push(accepts_card ? 1 : 0); }
  if (accepts_pix !== undefined)       { updates.push("accepts_pix = ?"); params.push(accepts_pix ? 1 : 0); }
  if (accepts_boleto !== undefined)    { updates.push("accepts_boleto = ?"); params.push(accepts_boleto ? 1 : 0); }
  if (stock !== undefined)             { updates.push("stock = ?"); params.push(Number(stock)); }
  if (sold !== undefined)              { updates.push("sold = ?"); params.push(Number(sold)); }
  if (tag !== undefined)               { updates.push("tag = ?"); params.push(tag.trim()); }
  if (specs !== undefined)             { updates.push("specs = ?"); params.push(JSON.stringify(specs)); }
  if (active !== undefined)            { updates.push("active = ?"); params.push(active ? 1 : 0); }
  if (featured !== undefined)          { updates.push("featured = ?"); params.push(featured ? 1 : 0); }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    params.push(product.id);
    db.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  }

  const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(product.id);
  res.json({
    message: "Produto atualizado",
    product: { ...updated, images: JSON.parse(updated.images), specs: JSON.parse(updated.specs) },
  });
});

/* ── Upload images ── */
app.post("/api/admin/products/:id/images", requireAuth, requireAdmin, uploadLimiter,
  upload.array("images", 10),
  (req, res) => {
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
    if (!product) return res.status(404).json({ error: "Produto não encontrado" });

    const existing = JSON.parse(product.images || "[]");
    const newPaths = (req.files || []).map(f => `/uploads/${f.filename}`);
    const all = [...existing, ...newPaths];

    db.prepare("UPDATE products SET images = ?, updated_at = datetime('now') WHERE id = ?")
      .run(JSON.stringify(all), product.id);

    console.log(`[ADMIN] ${newPaths.length} images uploaded for product ${product.id}`);
    res.json({ message: "Imagens enviadas", images: all });
  }
);

/* ── Delete image ── */
app.delete("/api/admin/products/:id/images", requireAuth, requireAdmin, (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });

  const { imagePath } = req.body;
  if (!imagePath) return res.status(400).json({ error: "imagePath é obrigatório" });

  const existing = JSON.parse(product.images || "[]");
  const filtered = existing.filter(img => img !== imagePath);

  db.prepare("UPDATE products SET images = ?, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(filtered), product.id);

  /* Try to delete file */
  try {
    const fullPath = path.join(__dirname, "..", imagePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch { /* ignore */ }

  res.json({ message: "Imagem removida", images: filtered });
});

/* ── Delete product ── */
app.delete("/api/admin/products/:id", requireAuth, requireAdmin, (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });

  /* Clean up images */
  const images = JSON.parse(product.images || "[]");
  images.forEach(img => {
    try {
      const fullPath = path.join(__dirname, "..", img);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch { /* ignore */ }
  });

  db.prepare("DELETE FROM products WHERE id = ?").run(product.id);
  console.log(`[ADMIN] Product deleted: "${product.title}" (id: ${product.id})`);
  res.json({ message: "Produto excluído" });
});

/* ── List users (admin) ── */
app.get("/api/admin/users", requireAuth, requireAdmin, (_req, res) => {
  const users = db.prepare(
    "SELECT id, name, email, role, nickname, cpf, phone, created_at FROM users ORDER BY created_at DESC"
  ).all();
  res.json({ users, total: users.length });
});

/* ══════════════════════════════════════
   FALLBACK & ERROR HANDLING
   ══════════════════════════════════════ */

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

/* Multer error handling */
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "Arquivo muito grande (máx 5MB)" });
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    console.error("[ERROR]", err.message);
    return res.status(500).json({ error: NODE_ENV === "production" ? "Erro interno" : err.message });
  }
});

/* ══════════════════════════════════════
   START SERVER
   ══════════════════════════════════════ */

app.listen(PORT, () => {
  console.log(`\n  🏪 Santos Store API — ${NODE_ENV}`);
  console.log(`  ➜  http://localhost:${PORT}\n`);
  console.log(`  Auth:`);
  console.log(`    POST   /api/register`);
  console.log(`    POST   /api/login`);
  console.log(`    GET    /api/me`);
  console.log(`    POST   /api/verify/send-code`);
  console.log(`    POST   /api/verify/confirm-code`);
  console.log(`  Profile:`);
  console.log(`    PUT    /api/profile`);
  console.log(`    PUT    /api/profile/theme`);
  console.log(`    PUT    /api/profile/email`);
  console.log(`    PUT    /api/profile/password`);
  console.log(`    DELETE /api/profile`);
  console.log(`  Cart:`);
  console.log(`    GET    /api/cart`);
  console.log(`    PUT    /api/cart`);
  console.log(`  Products:`);
  console.log(`    GET    /api/products`);
  console.log(`    GET    /api/products/:slug`);
  console.log(`  Admin:`);
  console.log(`    GET    /api/admin/stats`);
  console.log(`    GET    /api/admin/products`);
  console.log(`    POST   /api/admin/products`);
  console.log(`    PUT    /api/admin/products/:id`);
  console.log(`    DELETE /api/admin/products/:id`);
  console.log(`    POST   /api/admin/products/:id/images`);
  console.log(`    DELETE /api/admin/products/:id/images`);
  console.log(`    GET    /api/admin/users\n`);
  console.log(`  Admin: ${ADMIN_EMAIL}`);
  console.log(`  WhatsApp: ${WA_API_URL ? "✓ Configurado" : "✗ Console (dev)"}\n`);
});
