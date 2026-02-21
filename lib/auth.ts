import jwt from "jsonwebtoken";
import { getDb } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "santos-store-jwt-2026-secret-key";

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  nickname: string;
  cpf: string;
  phone: string;
  phone_verified: number;
  birth: string;
  gender: string;
  theme_preference: string;
  avatar: string;
  cep: string;
  street: string;
  street_number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  token: string;
  created_at: string;
  updated_at: string;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export function generateToken(user: Pick<UserRow, "id" | "email" | "role">) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role || "user" },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
}

export function findUserById(id: number): UserRow | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function userResponse(u: UserRow) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || "user",
    nickname: u.nickname || "",
    cpf: u.cpf || "",
    phone: u.phone || "",
    phone_verified: u.phone_verified || 0,
    birth: u.birth || "",
    gender: u.gender || "",
    theme_preference: u.theme_preference || "light",
    avatar: u.avatar || "",
    cep: u.cep || "",
    street: u.street || "",
    street_number: u.street_number || "",
    complement: u.complement || "",
    neighborhood: u.neighborhood || "",
    city: u.city || "",
    state: u.state || "",
    created_at: u.created_at,
  };
}

/** Extract user from Authorization header, returns null if invalid */
export function getUserFromRequest(req: Request): UserRow | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const decoded = verifyToken(authHeader.slice(7));
    const user = findUserById(decoded.userId);
    return user || null;
  } catch {
    return null;
  }
}

/** Require authenticated user or return 401 response */
export function requireAuth(req: Request): { user: UserRow } | Response {
  const user = getUserFromRequest(req);
  if (!user) {
    return Response.json({ error: "Token não fornecido ou inválido" }, { status: 401 });
  }
  return { user };
}

/** Require admin user or return 403 response */
export function requireAdmin(req: Request): { user: UserRow } | Response {
  const result = requireAuth(req);
  if (result instanceof Response) return result;
  if (result.user.role !== "admin") {
    return Response.json({ error: "Acesso negado. Apenas administradores." }, { status: 403 });
  }
  return result;
}
