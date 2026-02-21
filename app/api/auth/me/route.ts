import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, userResponse } from "@/lib/auth";

export async function GET(req: Request) {
  const result = requireAuth(req);
  if (result instanceof Response) return result;

  const db = getDb();
  const cartItems = db.prepare(
    "SELECT product_id, quantity, name, price, category FROM cart_items WHERE user_id = ?"
  ).all(result.user.id);

  return NextResponse.json({ user: userResponse(result.user), cart: cartItems });
}
