export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const banners = db.prepare(
    "SELECT id, image_url, alt_text, link_url, bg1, bg2 FROM banners WHERE active = 1 ORDER BY sort_order ASC"
  ).all();

  return NextResponse.json({ banners });
}
