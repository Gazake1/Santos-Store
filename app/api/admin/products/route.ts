import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/helpers";

interface ProductRow {
  images: string;
  specs: string;
  [key: string]: unknown;
}

export async function GET(req: Request) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const db = getDb();
  const products = db.prepare("SELECT * FROM products ORDER BY created_at DESC").all() as ProductRow[];
  const parsed = products.map(p => ({
    ...p,
    images: JSON.parse(p.images || "[]"),
    specs: JSON.parse(p.specs || "{}"),
  }));

  return NextResponse.json({ products: parsed, total: parsed.length });
}

export async function POST(req: Request) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const body = await req.json();
  const {
    title, description, short_description, category, price, original_price,
    installment_count, accepts_card, accepts_pix, accepts_boleto,
    stock, tag, specs, active, featured,
  } = body;

  if (!title || price === undefined) {
    return NextResponse.json({ error: "Título e preço são obrigatórios" }, { status: 400 });
  }

  const db = getDb();
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
    JSON.stringify(specs || {}), active !== false ? 1 : 0, featured ? 1 : 0, result.user.id
  );

  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(Number(info.lastInsertRowid)) as ProductRow;

  return NextResponse.json({
    message: "Produto criado com sucesso!",
    product: { ...product, images: JSON.parse(product.images), specs: JSON.parse(product.specs) },
  }, { status: 201 });
}
