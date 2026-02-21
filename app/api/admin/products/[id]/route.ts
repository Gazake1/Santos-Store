export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import fs from "fs";
import path from "path";

interface ProductRow {
  id: number;
  title: string;
  images: string;
  specs: string;
  [key: string]: unknown;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const { id } = params;
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const body = await req.json();
  const updates: string[] = [];
  const dbParams: unknown[] = [];

  const fieldMap: Record<string, (v: unknown) => unknown> = {
    title: v => (v as string).trim(),
    description: v => (v as string).trim(),
    short_description: v => (v as string).trim(),
    category: v => (v as string).trim(),
    price: v => Number(v),
    original_price: v => Number(v),
    installment_count: v => Number(v),
    accepts_card: v => v ? 1 : 0,
    accepts_pix: v => v ? 1 : 0,
    accepts_boleto: v => v ? 1 : 0,
    stock: v => Number(v),
    sold: v => Number(v),
    tag: v => (v as string).trim(),
    specs: v => JSON.stringify(v),
    active: v => v ? 1 : 0,
    featured: v => v ? 1 : 0,
  };

  Object.entries(fieldMap).forEach(([key, transform]) => {
    if (body[key] !== undefined) {
      updates.push(`${key} = ?`);
      dbParams.push(transform(body[key]));
    }
  });

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    dbParams.push(product.id);
    db.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`).run(...dbParams);
  }

  const updated = db.prepare("SELECT * FROM products WHERE id = ?").get(product.id) as ProductRow;
  return NextResponse.json({
    message: "Produto atualizado",
    product: { ...updated, images: JSON.parse(updated.images), specs: JSON.parse(updated.specs) },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const { id } = params;
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  const images = JSON.parse(product.images || "[]") as string[];
  images.forEach(img => {
    try {
      const fullPath = path.join(process.cwd(), "public", img);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch { /* ignore */ }
  });

  db.prepare("DELETE FROM products WHERE id = ?").run(product.id);
  return NextResponse.json({ message: "Produto excluído" });
}
