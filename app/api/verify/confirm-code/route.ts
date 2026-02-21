import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { authRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = authRateLimit(ip);
  if (!rl.success) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 });
  }

  const { phone, code } = await req.json();
  if (!phone || !code) return NextResponse.json({ error: "Telefone e código são obrigatórios" }, { status: 400 });

  const cleanPhone = phone.replace(/\D/g, "");
  const db = getDb();
  const record = db.prepare(
    "SELECT * FROM phone_codes WHERE phone = ? AND code = ? AND verified = 0 AND expires_at > datetime('now') ORDER BY id DESC LIMIT 1"
  ).get(cleanPhone, code) as { id: number } | undefined;

  if (!record) return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });

  db.prepare("UPDATE phone_codes SET verified = 1 WHERE id = ?").run(record.id);
  return NextResponse.json({ message: "Telefone verificado com sucesso!", verified: true });
}
