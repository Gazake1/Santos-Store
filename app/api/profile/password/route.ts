import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { requireAuth, findUserById, generateToken } from "@/lib/auth";

export async function PUT(req: Request) {
  const result = requireAuth(req);
  if (result instanceof Response) return result;

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword) return NextResponse.json({ error: "Senha atual é obrigatória" }, { status: 400 });
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
  }

  const user = findUserById(result.user.id)!;
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
  }

  const db = getDb();
  const hash = bcrypt.hashSync(newPassword, 12);
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?")
    .run(hash, result.user.id);

  const newToken = generateToken(user);
  return NextResponse.json({ message: "Senha alterada com sucesso", token: newToken });
}
