import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface ProductRow {
  images: string;
  specs: string;
  [key: string]: unknown;
}

export async function GET() {
  const db = getDb();
  const products = db.prepare(
    "SELECT * FROM products WHERE active = 1 ORDER BY featured DESC, created_at DESC"
  ).all() as ProductRow[];

  const parsed = products.map(p => ({
    ...p,
    images: JSON.parse(p.images || "[]"),
    specs: JSON.parse(p.specs || "{}"),
  }));

  return NextResponse.json({ products: parsed, total: parsed.length });
}
