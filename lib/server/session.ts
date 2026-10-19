import { getPersistentStore } from "./persistence";
import { getOrCreatePersistentSecret } from "./persistence/secret-file";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const SESSION_NAMESPACE = "auth-sessions";

export const SESSION_COOKIE_NAME = "neurodelo_session";

export type ServerSession = {
  sessionId: string;
  accountId: string;
  email: string;
  name: string;
  roles: string[];
  status: "active" | "unverified" | "blocked";
  issuedAt: number;
  expiresAt: number;
};

type SessionRecord = ServerSession & {
  revokedAt?: number;
  lastSeenAt: number;
  userAgent?: string;
  ipHash?: string;
};

function configuredSecret() {
  const value = process.env.AUTH_SECRET?.trim();
  return value && value.length >= 32 ? value : null;
}

function secret() {
  return configuredSecret() ?? getOrCreatePersistentSecret("auth-hmac-secret");
}

export function authSecurityStatus() {
  return {
    configuredSecret: Boolean(configuredSecret()),
    persistentLocalSecret: !configuredSecret(),
    ephemeralSecret: false,
    cookieSecure: process.env.COOKIE_SECURE === "true" || (process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production"),
    persistentSessions: true,
  };
}

function toBase64Url(bytes: Uint8Array) { return Buffer.from(bytes).toString("base64url"); }
function fromBase64Url(value: string) { return new Uint8Array(Buffer.from(value, "base64url")); }
async function signature(value: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function createSessionToken(input: Omit<ServerSession, "sessionId" | "issuedAt" | "expiresAt"> & { remember: boolean; userAgent?: string; ipHash?: string }) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + (input.remember ? 30 : 1) * 24 * 60 * 60 * 1000;
  const payload: ServerSession = {
    sessionId: crypto.randomUUID(),
    accountId: input.accountId,
    email: input.email,
    name: input.name,
    roles: input.roles,
    status: input.status,
    issuedAt,
    expiresAt,
  };
  const record: SessionRecord = { ...payload, lastSeenAt: issuedAt, userAgent: input.userAgent?.slice(0, 300), ipHash: input.ipHash };
  getPersistentStore().set(SESSION_NAMESPACE, payload.sessionId, record);
  const encoded = toBase64Url(encoder.encode(JSON.stringify(payload)));
  return `${encoded}.${toBase64Url(await signature(encoded))}`;
}

export async function verifySessionToken(token: string | undefined | null, options?: { skipPersistentCheck?: boolean }): Promise<ServerSession | null> {
  if (!token) return null;
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return null;
  const expected = await signature(payload);
  const supplied = fromBase64Url(suppliedSignature);
  if (expected.byteLength !== supplied.byteLength) return null;
  let mismatch = 0;
  for (let index = 0; index < expected.byteLength; index += 1) mismatch |= expected[index] ^ supplied[index];
  if (mismatch !== 0) return null;
  try {
    const parsed = JSON.parse(decoder.decode(fromBase64Url(payload))) as ServerSession;
    if (!parsed.sessionId || !parsed.accountId || !parsed.email || !Number.isFinite(parsed.expiresAt)) return null;
    if (parsed.expiresAt <= Date.now() || parsed.status !== "active") return null;
    if (options?.skipPersistentCheck) return parsed;
    const record = getPersistentStore().get<SessionRecord>(SESSION_NAMESPACE, parsed.sessionId);
    if (!record || record.revokedAt || record.expiresAt <= Date.now() || record.accountId !== parsed.accountId) return null;
    if (record.lastSeenAt + 5 * 60 * 1000 < Date.now()) getPersistentStore().set(SESSION_NAMESPACE, parsed.sessionId, { ...record, lastSeenAt: Date.now() });
    return parsed;
  } catch {
    return null;
  }
}

export function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  for (const item of cookie.split(";")) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return null;
}

export async function getRequestSession(request: Request) {
  return verifySessionToken(readCookie(request, SESSION_COOKIE_NAME));
}

export async function revokeRequestSession(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return false;
  return revokeSession(session.sessionId);
}

export function revokeSession(sessionId: string) {
  const store = getPersistentStore();
  const record = store.get<SessionRecord>(SESSION_NAMESPACE, sessionId);
  if (!record || record.revokedAt) return false;
  store.set(SESSION_NAMESPACE, sessionId, { ...record, revokedAt: Date.now() });
  return true;
}

export function revokeOtherSessions(accountId: string, currentSessionId: string) {
  let revoked = 0;
  for (const [sessionId, record] of getPersistentStore().entries<SessionRecord>(SESSION_NAMESPACE)) {
    if (record.accountId === accountId && sessionId !== currentSessionId && !record.revokedAt && record.expiresAt > Date.now()) {
      getPersistentStore().set(SESSION_NAMESPACE, sessionId, { ...record, revokedAt: Date.now() });
      revoked += 1;
    }
  }
  return revoked;
}

export function listActiveSessions(accountId: string) {
  return getPersistentStore().entries<SessionRecord>(SESSION_NAMESPACE)
    .map(([, value]) => value)
    .filter((record) => record.accountId === accountId && !record.revokedAt && record.expiresAt > Date.now())
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

export function cleanupExpiredSessions() {
  const now = Date.now();
  let deleted = 0;
  for (const [sessionId, record] of getPersistentStore().entries<SessionRecord>(SESSION_NAMESPACE)) {
    if (record.expiresAt <= now || (record.revokedAt && record.revokedAt < now - 30 * 24 * 60 * 60 * 1000)) {
      if (getPersistentStore().delete(SESSION_NAMESPACE, sessionId)) deleted += 1;
    }
  }
  return deleted;
}

export function sessionCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true" || (process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production"),
    sameSite: "lax" as const,
    path: "/",
    maxAge: (remember ? 30 : 1) * 24 * 60 * 60,
  };
}
