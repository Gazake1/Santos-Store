export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface ProductRow {
  images: string;
  specs: string;
  [key: string]: unknown;
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE slug = ?").get(slug) as ProductRow | undefined;
  if (!product) return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });

  return NextResponse.json({
    product: {
      ...product,
      images: JSON.parse(product.images || "[]"),
      specs: JSON.parse(product.specs || "{}"),
    },
  });
}
