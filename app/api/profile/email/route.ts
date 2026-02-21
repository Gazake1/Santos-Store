export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { requireAuth, findUserById, findUserByEmail, generateToken } from "@/lib/auth";

export async function PUT(req: Request) {
  const result = requireAuth(req);
  if (result instanceof Response) return result;

  const { newEmail, password } = await req.json();
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }
  if (!password) return NextResponse.json({ error: "Senha atual é obrigatória" }, { status: 400 });

  const user = findUserById(result.user.id)!;
  if (!bcrypt.compareSync(password, user.password)) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const emailLower = newEmail.trim().toLowerCase();
  const existing = findUserByEmail(emailLower);
  if (existing && existing.id !== result.user.id) {
    return NextResponse.json({ error: "Este e-mail já está em uso" }, { status: 409 });
  }

  const db = getDb();
  db.prepare("UPDATE users SET email = ?, updated_at = datetime('now') WHERE id = ?")
    .run(emailLower, result.user.id);

  const newToken = generateToken({ ...user, email: emailLower });
  return NextResponse.json({
    message: "E-mail alterado com sucesso",
    user: { id: result.user.id, name: user.name, email: emailLower },
    token: newToken,
  });
}
