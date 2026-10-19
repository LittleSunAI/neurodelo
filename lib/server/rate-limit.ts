import { createHash } from "node:crypto";
import { getPersistentStore } from "./persistence";

type Bucket = { count: number; resetAt: number; updatedAt: number };
const NS = "rate-limits";

function keyHash(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hashed = keyHash(key);
  return getPersistentStore().transact<Bucket, { allowed: boolean; limit: number; remaining: number; resetAt: number; retryAfterSeconds: number }>(NS, (records) => {
    for (const [recordKey, record] of Object.entries(records)) {
      if (record.resetAt <= now - 24 * 60 * 60 * 1000) delete records[recordKey];
    }
    const current = records[hashed];
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs, updatedAt: now } : current;
    bucket.count += 1;
    bucket.updatedAt = now;
    records[hashed] = bucket;
    return {
      allowed: bucket.count <= limit,
      limit,
      remaining: Math.max(0, limit - bucket.count),
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  });
}

export function clientIp(request: Request) {
  if (process.env.TRUST_PROXY !== "true") return "untrusted-direct";
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return (forwarded || realIp || "unknown-proxy").slice(0, 128);
}

export function clearExpiredRateLimits() {
  const now = Date.now();
  return getPersistentStore().transact<Bucket, number>(NS, (records) => {
    let deleted = 0;
    for (const [key, bucket] of Object.entries(records)) {
      if (bucket.resetAt <= now) { delete records[key]; deleted += 1; }
    }
    return deleted;
  });
}
