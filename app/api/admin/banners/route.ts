export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const db = getDb();
  const banners = db.prepare("SELECT * FROM banners ORDER BY sort_order ASC").all();
  return NextResponse.json({ banners });
}

export async function POST(req: Request) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const body = await req.json();
  const { image_url, alt_text, link_url, bg1, bg2, sort_order, active } = body;

  if (!image_url) {
    return NextResponse.json({ error: "URL da imagem é obrigatória" }, { status: 400 });
  }

  const db = getDb();
  const info = db.prepare(
    `INSERT INTO banners (image_url, alt_text, link_url, bg1, bg2, sort_order, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    image_url,
    alt_text || "",
    link_url || "",
    bg1 || "rgba(197,30,48,.20)",
    bg2 || "rgba(255,255,255,.06)",
    sort_order ?? 0,
    active !== undefined ? (active ? 1 : 0) : 1
  );

  const banner = db.prepare("SELECT * FROM banners WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json({ banner }, { status: 201 });
}
