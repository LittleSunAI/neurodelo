import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { clientIp, checkRateLimit } from "@/lib/server/rate-limit";
import { isSameOriginRequest, readJsonWithinLimit, securityHeaders } from "@/lib/server/request-security";
import {
  createSessionToken,
  getRequestSession,
  listActiveSessions,
  revokeOtherSessions,
  revokeRequestSession,
  revokeSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/server/session";
import { sendTransactionalEmail } from "@/lib/server/email";
import {
  authenticateLocalUser,
  changeLocalPassword,
  createLocalPasswordReset,
  registerLocalUser,
  resetLocalPassword,
  validatePasswordPolicy,
} from "@/lib/server/local-auth-store";
import { appendSecurityAudit, listSecurityAudit } from "@/lib/server/security-audit";

export const runtime = "nodejs";
type Context = { params: Promise<{ path: string[] }> };

function json(body: unknown, status = 200, extra?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: securityHeaders(extra) });
}
async function readBody(request: Request) { return readJsonWithinLimit<Record<string, unknown>>(request, 16 * 1024); }
function hash(value: string) { return createHash("sha256").update(value).digest("base64url"); }
function requestFingerprint(request: Request) {
  return {
    ipHash: hash(clientIp(request)),
    userAgent: (request.headers.get("user-agent") || "unknown").slice(0, 300),
  };
}
function sessionDevices(accountId: string, currentSessionId?: string) {
  return listActiveSessions(accountId).map((item) => ({
    id: item.sessionId,
    name: item.sessionId === currentSessionId ? "Текущее устройство" : "Активная сессия",
    browser: item.userAgent || "Неизвестный браузер",
    location: "Локальная среда",
    lastActiveAt: new Date(item.lastSeenAt).toISOString(),
    current: item.sessionId === currentSessionId,
  }));
}
function loginHistory(accountId: string) {
  return listSecurityAudit(300)
    .filter((event) => event.actorAccountId === accountId && ["auth.login", "auth.login.failed"].includes(event.type))
    .slice(0, 30)
    .map((event) => ({
      id: event.id,
      device: String(event.metadata?.userAgent || "Неизвестное устройство"),
      location: "Локальная среда",
      createdAt: event.createdAt,
      result: event.outcome === "success" ? "success" : "failed",
    }));
}

export async function GET(request: Request, context: Context) {
  const path = (await context.params).path.join("/");
  if (path !== "session") return json({ error: "Not found" }, 404);
  const session = await getRequestSession(request);
  if (!session) return json({ session: { authenticated: false, status: "active", remembered: false }, devices: [], history: [] });
  return json({
    session: {
      authenticated: true,
      accountId: session.accountId,
      email: session.email,
      status: session.status,
      remembered: session.expiresAt - session.issuedAt > 2 * 24 * 60 * 60 * 1000,
      expiresAt: new Date(session.expiresAt).toISOString(),
      lastLoginAt: new Date(session.issuedAt).toISOString(),
      roles: session.roles,
    },
    devices: sessionDevices(session.accountId, session.sessionId),
    history: loginHistory(session.accountId),
  });
}

export async function POST(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return json({ error: "Origin is not allowed" }, 403);
  const path = (await context.params).path.join("/");
  const ip = clientIp(request);
  const body = await readBody(request);
  if (!body) return json({ error: "Invalid JSON request" }, 400);

  if (path === "login" || path === "register") {
    const rate = checkRateLimit(`auth:${path}:${ip}`, path === "login" ? 8 : 4, 10 * 60 * 1000);
    if (!rate.allowed) return json({ ok: false, error: "rate_limited" }, 429, { "Retry-After": String(rate.retryAfterSeconds) });
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const remember = Boolean(body.remember);
    const name = String(body.name ?? "Тимур").trim() || "Тимур";
    const fingerprint = requestFingerprint(request);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "invalid_credentials" }, 400);
    const auth = path === "login" ? await authenticateLocalUser(email, password) : await registerLocalUser({ email, name, password });
    if (!auth.ok) {
      appendSecurityAudit({ type: path === "login" ? "auth.login.failed" : "auth.register.failed", outcome: "failure", actorEmailHash: hash(email), ipHash: fingerprint.ipHash, metadata: { error: auth.error, userAgent: fingerprint.userAgent } });
      const status = auth.error === "blocked" || auth.error === "unverified" ? 403 : auth.error === "email_exists" ? 409 : auth.error === "weak_password" ? 400 : 401;
      return json({ ok: false, error: auth.error }, status);
    }
    const user = auth.user;
    const token = await createSessionToken({ accountId: user.accountId, email: user.email, name: user.name, roles: user.roles, status: user.status, remember, ...fingerprint });
    appendSecurityAudit({ type: path === "login" ? "auth.login" : "auth.register", outcome: "success", actorAccountId: user.accountId, actorEmailHash: hash(user.email), ipHash: fingerprint.ipHash, metadata: { userAgent: fingerprint.userAgent } });
    const response = json({ ok: true, session: { authenticated: true, accountId: user.accountId, email: user.email, status: user.status, remembered: remember, roles: user.roles } });
    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(remember));
    if (path === "register") void sendTransactionalEmail({ to: user.email, template: "welcome", variables: { name: user.name, actionUrl: new URL("/", request.url).toString(), message: "Ваш локальный аккаунт создан." }, idempotencyKey: `welcome-${user.accountId}` });
    return response;
  }

  if (path === "logout") {
    const session = await getRequestSession(request);
    await revokeRequestSession(request);
    if (session) appendSecurityAudit({ type: "auth.logout", outcome: "success", actorAccountId: session.accountId });
    const response = json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(false), maxAge: 0 });
    return response;
  }

  if (path === "password/request") {
    const rate = checkRateLimit(`password-reset:${ip}`, 4, 30 * 60 * 1000);
    if (!rate.allowed) return json({ ok: false, error: "rate_limited" }, 429, { "Retry-After": String(rate.retryAfterSeconds) });
    const email = String(body.email ?? "").trim().toLowerCase();
    const token = await createLocalPasswordReset(email);
    const actionUrl = new URL(`/reset-password?token=${encodeURIComponent(token)}`, request.url).toString();
    const delivery = await sendTransactionalEmail({ to: email, template: "password-reset", variables: { name: "участник", actionUrl }, idempotencyKey: `reset-${email}-${Math.floor(Date.now() / 300000)}` });
    appendSecurityAudit({ type: "auth.password-reset.requested", outcome: "success", actorEmailHash: hash(email), ipHash: hash(ip) });
    return json({ ok: true, delivery: delivery.provider === "resend" ? email : `preview: ${email}`, preview: delivery.preview });
  }

  if (path === "password/reset") {
    const result = await resetLocalPassword(String(body.token ?? ""), String(body.password ?? ""));
    appendSecurityAudit({ type: "auth.password-reset.completed", outcome: result.ok ? "success" : "failure" });
    return json(result, result.ok ? 200 : 400);
  }

  if (path === "password/change") {
    const session = await getRequestSession(request);
    if (!session) return json({ ok: false, error: "Требуется вход" }, 401);
    const currentPassword = String(body.currentPassword ?? ""), nextPassword = String(body.nextPassword ?? "");
    if (!validatePasswordPolicy(nextPassword)) return json({ ok: false, error: "Новый пароль должен содержать 10–128 символов, буквы разного регистра и цифру." }, 400);
    const changed = await changeLocalPassword(session.accountId, currentPassword, nextPassword);
    if (!changed.ok) {
      appendSecurityAudit({ type: "auth.password-change", outcome: "failure", actorAccountId: session.accountId, metadata: { error: changed.error } });
      return json({ ok: false, error: changed.error === "invalid_current" ? "Текущий пароль не совпадает." : "Не удалось сменить пароль." }, 400);
    }
    revokeOtherSessions(session.accountId, session.sessionId);
    appendSecurityAudit({ type: "auth.password-change", outcome: "success", actorAccountId: session.accountId });
    void sendTransactionalEmail({ to: session.email, template: "security-alert", variables: { name: session.name, actionUrl: new URL("/", request.url).toString(), message: "Пароль аккаунта был изменён. Остальные сессии закрыты." }, idempotencyKey: `password-change-${session.accountId}-${Math.floor(Date.now() / 60000)}` });
    return json({ ok: true });
  }

  if (path === "verify-email") return json({ ok: String(body.code ?? "").trim().length >= 4 });
  if (path === "reset") {
    await revokeRequestSession(request);
    const response = json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(false), maxAge: 0 });
    return response;
  }
  return json({ error: "Not found" }, 404);
}

export async function DELETE(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return json({ error: "Origin is not allowed" }, 403);
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  const path = (await context.params).path.join("/");
  if (path === "sessions/others") {
    revokeOtherSessions(session.accountId, session.sessionId);
    appendSecurityAudit({ type: "auth.sessions.revoke-others", outcome: "success", actorAccountId: session.accountId });
    return json(sessionDevices(session.accountId, session.sessionId));
  }
  if (path.startsWith("sessions/")) {
    const target = path.split("/").at(-1) || "";
    if (target === session.sessionId) return json({ error: "Use logout for the current session" }, 409);
    const owned = listActiveSessions(session.accountId).some((item) => item.sessionId === target);
    if (!owned) return json({ error: "Session not found" }, 404);
    revokeSession(target);
    appendSecurityAudit({ type: "auth.session.revoked", outcome: "success", actorAccountId: session.accountId, targetId: target });
    return json(sessionDevices(session.accountId, session.sessionId));
  }
  return json({ error: "Not found" }, 404);
}
