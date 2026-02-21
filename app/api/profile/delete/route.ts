export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE(req: Request) {
  const result = requireAuth(req);
  if (result instanceof Response) return result;

  const db = getDb();
  db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(result.user.id);
  db.prepare("DELETE FROM users WHERE id = ?").run(result.user.id);

  return NextResponse.json({ message: "Conta excluída com sucesso" });
}
