export {};
process.env.PERSISTENCE_DRIVER = "memory";
process.env.AUTH_SECRET = "test-secret-that-is-longer-than-thirty-two-characters";
process.env.COOKIE_SECURE = "false";
process.env.APP_ORIGIN = "http://localhost:3000";
process.env.FAL_MAX_GENERATIONS_PER_DAY = "2";
process.env.FAL_MAX_ESTIMATED_DAILY_USD = "0.10";
process.env.FAL_ESTIMATED_COST_PER_GENERATION_USD = "0.05";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function main() {
  const { createSessionToken, verifySessionToken, sessionCookieOptions, authSecurityStatus } = await import("../lib/server/session");
  const { isSameOriginRequest, readJsonWithinLimit } = await import("../lib/server/request-security");
  const { validateUserExternalUrl, validateHttpsUrl } = await import("../lib/server/url-policy");
  const { reserveFalGeneration, rollbackFalGeneration, getFalQuota, claimFalIdempotency, saveIdempotentFalResult, getIdempotentFalResult } = await import("../lib/server/fal-quota");
  const { checkRateLimit } = await import("../lib/server/rate-limit");

  const token = await createSessionToken({ accountId: "security-user", email: "security@example.com", name: "Security User", roles: ["contributor"], status: "active", remember: false });
  const verified = await verifySessionToken(token);
  assert(verified?.accountId === "security-user", "Подписанная сессия должна проверяться");
  assert(await verifySessionToken(`${token.slice(0, -2)}xx`) === null, "Изменённая подпись должна отклоняться");
  const realNow = Date.now; Date.now = () => realNow() + 2 * 24 * 60 * 60 * 1000;
  assert(await verifySessionToken(token) === null, "Истёкшая сессия должна отклоняться");
  Date.now = realNow;
  assert(sessionCookieOptions(false).httpOnly && sessionCookieOptions(false).sameSite === "lax", "Cookie должна быть HttpOnly и SameSite");
  assert(authSecurityStatus().configuredSecret, "Тестовый AUTH_SECRET должен распознаваться");

  const same = new Request("http://localhost:3000/api/test", { method: "POST", headers: { origin: "http://localhost:3000", host: "localhost:3000" } });
  const foreign = new Request("http://localhost:3000/api/test", { method: "POST", headers: { origin: "https://evil.example", host: "localhost:3000" } });
  assert(isSameOriginRequest(same), "Свой origin должен приниматься");
  assert(!isSameOriginRequest(foreign), "Чужой origin должен отклоняться");

  const bodyRequest = new Request("http://localhost:3000", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) });
  assert((await readJsonWithinLimit<{ ok: boolean }>(bodyRequest, 64))?.ok, "Малое JSON-тело должно читаться");
  const largeRequest = new Request("http://localhost:3000", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "x".repeat(200) }) });
  assert(await readJsonWithinLimit(largeRequest, 32) === null, "Слишком большое тело должно отклоняться");

  assert(validateUserExternalUrl("example.com/path") === "https://example.com/path", "Публичный HTTPS URL должен нормализоваться");
  assert(validateUserExternalUrl("javascript:alert(1)") === null, "javascript URL должен блокироваться");
  assert(validateUserExternalUrl("http://127.0.0.1/admin") === null, "Приватный адрес должен блокироваться");
  assert(validateHttpsUrl("https://fal.media/image.png", ["fal.media"]) !== null, "Разрешённый fal host должен приниматься");
  assert(validateHttpsUrl("https://tracker.example/image.png", ["fal.media"]) === null, "Посторонний image host должен блокироваться");

  const account = `quota-${Date.now()}`;
  assert(reserveFalGeneration(account).ok, "Первая генерация должна резервироваться");
  assert(reserveFalGeneration(account).ok, "Вторая генерация должна резервироваться");
  assert(!reserveFalGeneration(account).ok, "Дневной лимит должен срабатывать");
  rollbackFalGeneration(account);
  assert(getFalQuota(account).remainingGenerations === 1, "Rollback должен возвращать квоту");
  assert(claimFalIdempotency(account, "unique-request-123").ok, "Первый idempotency key должен приниматься");
  assert(!claimFalIdempotency(account, "unique-request-123").ok, "Повторный выполняющийся запрос должен блокироваться");
  saveIdempotentFalResult(account, "unique-request-123", { ok: true });
  assert((getIdempotentFalResult(account, "unique-request-123") as { ok?: boolean })?.ok, "Готовый idempotent result должен повторно возвращаться");

  const rateKey = `test-rate-${Date.now()}`;
  const first = checkRateLimit(rateKey, 1, 60_000);
  const second = checkRateLimit(rateKey, 1, 60_000);
  assert(first.allowed && !second.allowed && second.retryAfterSeconds > 0, "Rate limit должен блокировать превышение");

  console.log(JSON.stringify({ signedSession: "ok", expiry: "ok", origin: "ok", bodyLimit: "ok", urlPolicy: "ok", falQuota: "ok", idempotency: "ok", rateLimit: "ok" }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
