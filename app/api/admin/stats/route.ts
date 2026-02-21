import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const result = requireAdmin(req);
  if (result instanceof Response) return result;

  const db = getDb();
  const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
  const totalProducts = (db.prepare("SELECT COUNT(*) as c FROM products").get() as { c: number }).c;
  const activeProducts = (db.prepare("SELECT COUNT(*) as c FROM products WHERE active = 1").get() as { c: number }).c;
  const totalSold = (db.prepare("SELECT COALESCE(SUM(sold), 0) as c FROM products").get() as { c: number }).c;

  return NextResponse.json({ totalUsers, totalProducts, activeProducts, totalSold });
}
