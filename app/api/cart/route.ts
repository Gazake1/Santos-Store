import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const result = requireAuth(req);
  if (result instanceof Response) return result;

  const db = getDb();
  const items = db.prepare(
    "SELECT product_id, quantity, name, price, category FROM cart_items WHERE user_id = ?"
  ).all(result.user.id);

  return NextResponse.json({ items });
}

export async function PUT(req: Request) {
  const result = requireAuth(req);
  if (result instanceof Response) return result;

  const { items } = await req.json();
  if (!Array.isArray(items)) return NextResponse.json({ error: "items deve ser um array" }, { status: 400 });

  const db = getDb();
  const del = db.prepare("DELETE FROM cart_items WHERE user_id = ?");
  const ins = db.prepare(
    "INSERT INTO cart_items (user_id, product_id, quantity, name, price, category) VALUES (?,?,?,?,?,?)"
  );

  db.transaction(() => {
    del.run(result.user.id);
    items.forEach((item: { product_id?: string; quantity?: number; name?: string; price?: number; category?: string }) => {
      if (item.product_id && (item.quantity ?? 0) > 0) {
        ins.run(result.user.id, item.product_id, item.quantity, item.name || "", item.price || 0, item.category || "");
      }
    });
  })();

  return NextResponse.json({ message: "Carrinho atualizado", count: items.length });
}
