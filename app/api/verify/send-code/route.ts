export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { authRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendWhatsAppCode } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = authRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

  const { phone } = await req.json();
  if (!phone) return NextResponse.json({ error: "Telefone é obrigatório" }, { status: 400 });

  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
  }

  const db = getDb();
  const recent = db.prepare(
    "SELECT * FROM phone_codes WHERE phone = ? AND created_at > datetime('now', '-1 minute') ORDER BY id DESC LIMIT 1"
  ).get(cleanPhone);
  if (recent) return NextResponse.json({ error: "Aguarde 1 minuto para reenviar o código" }, { status: 429 });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.prepare(
    "INSERT INTO phone_codes (phone, code, expires_at) VALUES (?, ?, datetime('now', '+10 minutes'))"
  ).run(cleanPhone, code);

  const result = await sendWhatsAppCode(cleanPhone, code);
  const response: Record<string, unknown> = { message: "Código de verificação enviado!" };

  if (process.env.NODE_ENV !== "production" || !result.sent) {
    response.debug_code = code;
  }

  return NextResponse.json(response);
}
