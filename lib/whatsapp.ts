/**
 * Envia código de verificação via:
 * 1) WhatsApp (Evolution API) — preferência
 * 2) SMS (Twilio) — fallback
 * 3) Console log — dev / quando nenhum serviço configurado
 */
export async function sendWhatsAppCode(phone: string, code: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const message = `🔐 *Santos Store*\n\nSeu código de verificação é: *${code}*\n\nEle é válido por 10 minutos.\nSe você não solicitou, ignore esta mensagem.`;

  // ── 1) Tentar WhatsApp via Evolution API ──────────────────
  const waResult = await trySendWhatsApp(cleanPhone, message);
  if (waResult) return waResult;

  // ── 2) Fallback: SMS via Twilio ───────────────────────────
  const smsResult = await trySendTwilioSMS(cleanPhone, message.replace(/\*/g, ""));
  if (smsResult) return smsResult;

  // ── 3) Dev fallback: console ──────────────────────────────
  console.log(`\n  📱 CÓDIGO DE VERIFICAÇÃO para ${cleanPhone}: ${code}\n`);
  return { sent: false, method: "console", debug_code: code };
}

/* ─── WhatsApp via Evolution API ───────────────────────────── */
async function trySendWhatsApp(phone: string, text: string) {
  const WA_API_URL = process.env.WA_API_URL || "";
  const WA_API_KEY = process.env.WA_API_KEY || "";
  const WA_INSTANCE = process.env.WA_INSTANCE || "";

  if (!WA_API_URL || !WA_API_KEY || !WA_INSTANCE) return null;

  try {
    const res = await fetch(`${WA_API_URL}/message/sendText/${WA_INSTANCE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: WA_API_KEY },
      body: JSON.stringify({
        number: `55${phone}@s.whatsapp.net`,
        text,
      }),
    });
    if (res.ok) {
      console.log(`[WA] Código enviado via WhatsApp para ${phone}`);
      return { sent: true, method: "whatsapp" };
    }
    throw new Error(`Status ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error(`[WA] Falha ao enviar WhatsApp: ${(err as Error).message}`);
    return null;
  }
}

/* ─── SMS via Twilio ───────────────────────────────────────── */
async function trySendTwilioSMS(phone: string, text: string) {
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || "";
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
  const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER || "";

  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) return null;

  try {
    const to = `+55${phone}`;
    const body = new URLSearchParams({ To: to, From: TWILIO_FROM, Body: text });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64"),
        },
        body: body.toString(),
      }
    );
    if (res.ok) {
      console.log(`[SMS] Código enviado via Twilio SMS para ${to}`);
      return { sent: true, method: "sms" };
    }
    throw new Error(`Status ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error(`[SMS] Falha ao enviar SMS: ${(err as Error).message}`);
    return null;
  }
}
