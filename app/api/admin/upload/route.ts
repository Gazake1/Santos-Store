export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

/* inline admin check to avoid alias issues in Docker */
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getDb } from "../../../../lib/db";

function getAdmin(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret") as { id: number };
    const db = getDb();
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.id) as Record<string, unknown> | undefined;
    if (!user || user.role !== "admin") return null;
    return user;
  } catch { return null; }
}

export async function POST(req: Request) {
  const admin = getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;

  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Envie uma imagem válida" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagem deve ter no máximo 5MB" }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name).toLowerCase() || ".webp";
  const name = `banner-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, name), buffer);

  return NextResponse.json({ url: `/uploads/${name}` });
}
