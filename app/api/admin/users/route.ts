import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const db = getDb();
  const users = db.prepare(
    "SELECT id, name, email, role, nickname, cpf, phone, created_at FROM users ORDER BY created_at DESC"
  ).all();

  return NextResponse.json({ users, total: users.length });
}
