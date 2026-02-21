export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function PUT(req: Request) {
  const result = requireAuth(req);
  if (result instanceof Response) return result;

  const { theme } = await req.json();
  if (!["light", "dark"].includes(theme)) {
    return NextResponse.json({ error: "Tema inválido" }, { status: 400 });
  }

  const db = getDb();
  db.prepare("UPDATE users SET theme_preference = ?, updated_at = datetime('now') WHERE id = ?")
    .run(theme, result.user.id);

  return NextResponse.json({ message: "Tema atualizado", theme });
}
