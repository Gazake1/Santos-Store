// Simple in-memory rate limiter for Next.js API routes
const store = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store) {
    if (value.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(
  identifier: string,
  maxRequests: number = 200,
  windowMs: number = 15 * 60 * 1000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: maxRequests - entry.count };
}

export function authRateLimit(ip: string) {
  return rateLimit(`auth:${ip}`, 10, 15 * 60 * 1000);
}

export function globalRateLimit(ip: string) {
  return rateLimit(`global:${ip}`, 200, 15 * 60 * 1000);
}

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
