import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

interface ProductRow {
  id: number;
  images: string;
  [key: string]: unknown;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const { id } = await params;
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("images") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "Nenhuma imagem enviada" }, { status: 400 });
  }

  if (files.length > 10) {
    return NextResponse.json({ error: "Máximo de 10 imagens por upload" }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });

  const existing = JSON.parse(product.images || "[]") as string[];
  const newPaths: string[] = [];

  for (const file of files) {
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif)$/)) {
      continue;
    }
    if (file.size > 5 * 1024 * 1024) continue;

    const ext = path.extname(file.name).toLowerCase() || ".jpg";
    const name = `product-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, name), buffer);
    newPaths.push(`/uploads/${name}`);
  }

  const all = [...existing, ...newPaths];
  db.prepare("UPDATE products SET images = ?, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(all), product.id);

  return NextResponse.json({ message: "Imagens enviadas", images: all });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const { id } = await params;
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const { imagePath } = await req.json();
  if (!imagePath) return NextResponse.json({ error: "imagePath é obrigatório" }, { status: 400 });

  const existing = JSON.parse(product.images || "[]") as string[];
  const filtered = existing.filter(img => img !== imagePath);

  db.prepare("UPDATE products SET images = ?, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(filtered), product.id);

  try {
    const fullPath = path.join(process.cwd(), "public", imagePath);
    if (existsSync(fullPath)) await unlink(fullPath);
  } catch { /* ignore */ }

  return NextResponse.json({ message: "Imagem removida", images: filtered });
}
