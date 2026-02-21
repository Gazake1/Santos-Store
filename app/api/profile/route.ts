export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, findUserById, userResponse } from "@/lib/auth";
import { validateCPF, calculateAge } from "@/lib/helpers";

export async function PUT(req: Request) {
  const result = requireAuth(req);
  if (result instanceof Response) return result;

  const body = await req.json();
  const { name, nickname, cpf, phone, birth, gender, theme_preference, avatar,
    cep, street, street_number, complement, neighborhood, city, state: uf } = body;

  if (name !== undefined && (!name || name.trim().length < 3)) {
    return NextResponse.json({ error: "Nome deve ter pelo menos 3 caracteres" }, { status: 400 });
  }
  if (cpf !== undefined && cpf && !validateCPF(cpf)) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
  }
  if (birth !== undefined && birth) {
    const age = calculateAge(birth);
    if (age === null) return NextResponse.json({ error: "Data de nascimento inválida" }, { status: 400 });
    if (age < 18) return NextResponse.json({ error: "Você deve ter pelo menos 18 anos" }, { status: 400 });
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  const fields: Record<string, (v: string) => string> = {
    name: v => v.trim(),
    nickname: v => (v || "").trim(),
    cpf: v => (v || "").replace(/\D/g, ""),
    phone: v => (v || "").replace(/\D/g, ""),
    birth: v => (v || "").trim(),
    gender: v => (v || "").trim(),
    theme_preference: v => (v || "light").trim(),
    avatar: v => (v || "").trim(),
    cep: v => (v || "").replace(/\D/g, ""),
    street: v => (v || "").trim(),
    street_number: v => (v || "").trim(),
    complement: v => (v || "").trim(),
    neighborhood: v => (v || "").trim(),
    city: v => (v || "").trim(),
  };

  Object.entries(fields).forEach(([key, transform]) => {
    const val = body[key];
    if (val !== undefined) {
      updates.push(`${key} = ?`);
      params.push(transform(val));
    }
  });

  if (uf !== undefined) {
    updates.push("state = ?");
    params.push((uf || "").trim());
  }

  if (updates.length > 0) {
    const db = getDb();
    updates.push("updated_at = datetime('now')");
    params.push(result.user.id);
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  }

  const updated = findUserById(result.user.id)!;
  return NextResponse.json({ message: "Perfil atualizado", user: userResponse(updated) });
}
