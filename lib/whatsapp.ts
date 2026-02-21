export async function sendWhatsAppCode(phone: string, code: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const WA_API_URL = process.env.WA_API_URL || "";
  const WA_API_KEY = process.env.WA_API_KEY || "";
  const WA_INSTANCE = process.env.WA_INSTANCE || "";

  if (WA_API_URL && WA_API_KEY) {
    try {
      const response = await fetch(`${WA_API_URL}/message/sendText/${WA_INSTANCE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: WA_API_KEY },
        body: JSON.stringify({
          number: `55${cleanPhone}@s.whatsapp.net`,
          text: `🔐 *Santos Store*\n\nSeu código de verificação é: *${code}*\n\nEle é válido por 10 minutos.\nSe você não solicitou, ignore esta mensagem.`,
        }),
      });
      if (response.ok) {
        return { sent: true, method: "whatsapp" };
      }
      throw new Error(`Status ${response.status}`);
    } catch (err) {
      console.error(`[WA] Failed: ${(err as Error).message}. Falling back to console.`);
    }
  }

  console.log(`\n  📱 CÓDIGO DE VERIFICAÇÃO para ${cleanPhone}: ${code}\n`);
  return { sent: false, method: "console", debug_code: code };
}
