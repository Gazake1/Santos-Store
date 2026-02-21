import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  const result = requireAuth(req);
  if (result instanceof Response) return result;
  return NextResponse.json({ message: "Logout realizado" });
}
