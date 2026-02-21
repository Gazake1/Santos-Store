import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { findUserByEmail, findUserById, generateToken, userResponse } from "@/lib/auth";
import { validateCPF, calculateAge } from "@/lib/helpers";
import { authRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = authRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

  const body = await req.json();
  const {
    name, email, password, nickname, cpf, phone, birth, gender,
    cep, street, street_number, complement, neighborhood, city, state: uf,
    phone_code,
  } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Preencha nome, e-mail e senha" }, { status: 400 });
  }
  if (name.trim().length < 3) return NextResponse.json({ error: "Nome deve ter pelo menos 3 caracteres" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres" }, { status: 400 });

  if (cpf && !validateCPF(cpf)) return NextResponse.json({ error: "CPF inválido. Verifique os dígitos." }, { status: 400 });

  if (birth) {
    const age = calculateAge(birth);
    if (age === null) return NextResponse.json({ error: "Data de nascimento inválida" }, { status: 400 });
    if (age < 18) return NextResponse.json({ error: "Você deve ter pelo menos 18 anos para se cadastrar" }, { status: 400 });
  }

  if (phone) {
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 10 || clean.length > 11) return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    if (phone_code) {
      const db = getDb();
      const verified = db.prepare(
        "SELECT * FROM phone_codes WHERE phone = ? AND code = ? AND verified = 1 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1"
      ).get(clean, phone_code);
      if (!verified) return NextResponse.json({ error: "Código de verificação inválido ou expirado" }, { status: 400 });
    }
  }

  if (cep && cep.replace(/\D/g, "").length !== 8) return NextResponse.json({ error: "CEP inválido" }, { status: 400 });

  const existing = findUserByEmail(email.trim().toLowerCase());
  if (existing) return NextResponse.json({ error: "Este e-mail já está cadastrado" }, { status: 409 });

  const db = getDb();
  const hash = bcrypt.hashSync(password, 12);
  const phoneVerified = phone_code ? 1 : 0;

  const info = db.prepare(
    `INSERT INTO users (name,email,password,role,nickname,cpf,phone,phone_verified,birth,gender,cep,street,street_number,complement,neighborhood,city,state)
     VALUES (?,?,?,'user',?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    name.trim(), email.trim().toLowerCase(), hash,
    (nickname || "").trim(), (cpf || "").replace(/\D/g, ""),
    (phone || "").replace(/\D/g, ""), phoneVerified,
    (birth || "").trim(), (gender || "").trim(),
    (cep || "").replace(/\D/g, ""), (street || "").trim(),
    (street_number || "").trim(), (complement || "").trim(),
    (neighborhood || "").trim(), (city || "").trim(), (uf || "").trim()
  );

  const newUser = findUserById(Number(info.lastInsertRowid))!;
  const token = generateToken(newUser);

  return NextResponse.json({
    message: "Conta criada com sucesso!",
    user: userResponse(newUser),
    token,
  }, { status: 201 });
}
