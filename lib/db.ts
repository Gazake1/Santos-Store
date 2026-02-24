import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = path.join(DATA_DIR, "database.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initTables(_db);
    seedAdmin(_db);
  }
  return _db;
}

function initTables(db: Database.Database) {
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
      product_type      TEXT DEFAULT '',
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

    CREATE TABLE IF NOT EXISTS banners (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url  TEXT NOT NULL,
      alt_text   TEXT DEFAULT '',
      link_url   TEXT DEFAULT '',
      bg1        TEXT DEFAULT 'rgba(197,30,48,.20)',
      bg2        TEXT DEFAULT 'rgba(255,255,255,.06)',
      sort_order INTEGER DEFAULT 0,
      active     INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Seed default banners if table is empty
  const bannerCount = (db.prepare("SELECT COUNT(*) as c FROM banners").get() as { c: number }).c;
  if (bannerCount === 0) {
    const defaultBanners = [
      { image_url: "/assets/img/sla.webp", alt_text: "Promoção 1", bg1: "rgba(197,30,48,.20)", bg2: "rgba(255,255,255,.06)", sort_order: 0 },
      { image_url: "/assets/img/sla2.webp", alt_text: "Promoção 2", bg1: "rgba(255,255,255,.08)", bg2: "rgba(197,30,48,.14)", sort_order: 1 },
      { image_url: "/assets/img/sla3.webp", alt_text: "Promoção 3", bg1: "rgba(197,30,48,.16)", bg2: "rgba(0,0,0,.10)", sort_order: 2 },
    ];
    const insert = db.prepare("INSERT INTO banners (image_url, alt_text, bg1, bg2, sort_order) VALUES (?, ?, ?, ?, ?)");
    for (const b of defaultBanners) {
      insert.run(b.image_url, b.alt_text, b.bg1, b.bg2, b.sort_order);
    }
  }

  // Migration: add columns if missing
  const userCols = (db.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map(c => c.name);
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
    }
  });

  // Migration: add product_type column to products if missing
  const prodCols = (db.prepare("PRAGMA table_info(products)").all() as { name: string }[]).map(c => c.name);
  if (!prodCols.includes("product_type")) {
    db.exec(`ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT ''`);
  }
}

function seedAdmin(db: Database.Database) {
  const email = (process.env.ADMIN_EMAIL || "tanjiroyt2011@gmail.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "IRANILDOlimaS2";
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
  if (!existing) {
    const hash = bcrypt.hashSync(password, 12);
    db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')")
      .run("Gazake", email, hash);
  } else {
    db.prepare("UPDATE users SET role = 'admin' WHERE email = ?").run(email);
  }
}
