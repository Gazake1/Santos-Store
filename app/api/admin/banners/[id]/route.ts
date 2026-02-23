export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const id = parseInt(params.id);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const body = await req.json();
  const { image_url, alt_text, link_url, bg1, bg2, sort_order, active } = body;

  const db = getDb();
  const existing = db.prepare("SELECT id FROM banners WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Banner não encontrado" }, { status: 404 });

  db.prepare(
    `UPDATE banners SET
       image_url = COALESCE(?, image_url),
       alt_text = COALESCE(?, alt_text),
       link_url = COALESCE(?, link_url),
       bg1 = COALESCE(?, bg1),
       bg2 = COALESCE(?, bg2),
       sort_order = COALESCE(?, sort_order),
       active = COALESCE(?, active)
     WHERE id = ?`
  ).run(
    image_url ?? null,
    alt_text ?? null,
    link_url ?? null,
    bg1 ?? null,
    bg2 ?? null,
    sort_order ?? null,
    active !== undefined ? (active ? 1 : 0) : null,
    id
  );

  const banner = db.prepare("SELECT * FROM banners WHERE id = ?").get(id);
  return NextResponse.json({ banner });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const id = parseInt(params.id);
  if (!id) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const db = getDb();
  const existing = db.prepare("SELECT id FROM banners WHERE id = ?").get(id);
  if (!existing) return NextResponse.json({ error: "Banner não encontrado" }, { status: 404 });

  db.prepare("DELETE FROM banners WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
