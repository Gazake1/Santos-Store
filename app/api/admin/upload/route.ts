export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

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
