import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { findUserByEmail, generateToken, userResponse } from "@/lib/auth";
import { authRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = authRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json({ error: "Muitas tentativas de login. Aguarde 15 minutos." }, { status: 429 });
  }

  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Preencha e-mail e senha" }, { status: 400 });

  const user = findUserByEmail(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
  }

  const token = generateToken(user);
  const db = getDb();
  const cartItems = db.prepare(
    "SELECT product_id, quantity, name, price, category FROM cart_items WHERE user_id = ?"
  ).all(user.id);

  return NextResponse.json({
    message: "Login realizado com sucesso!",
    user: userResponse(user),
    token,
    cart: cartItems,
  });
}
