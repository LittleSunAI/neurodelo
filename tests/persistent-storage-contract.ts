export {};
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function main() {
  const directory = mkdtempSync(path.join(os.tmpdir(), "neurodelo-persistence-"));
  process.env.PERSISTENCE_DRIVER = "file";
  process.env.NEURODELO_DATA_DIR = directory;
  process.env.AUTH_SECRET = "persistent-storage-test-secret-longer-than-32-characters";
  process.env.APP_ORIGIN = "http://localhost:3000";
  process.env.COOKIE_SECURE = "false";
  try {
    const persistence = await import("../lib/server/persistence");
    const { registerLocalUser, authenticateLocalUser, createLocalPasswordReset, resetLocalPassword } = await import("../lib/server/local-auth-store");
    const sessionModule = await import("../lib/server/session");
    const quota = await import("../lib/server/fal-quota");
    const rate = await import("../lib/server/rate-limit");
    const localStateRoute = await import("../app/api/v1/local-state/route");
    const { appendSecurityAudit, listSecurityAudit } = await import("../lib/server/security-audit");
    const { sendTransactionalEmail, listEmailDeliveryEvents } = await import("../lib/server/email");

    const email = `persistent-${Date.now()}@example.com`;
    const registered = await registerLocalUser({ email, name: "Persistent User", password: "StrongPersistent123" });
    assert(registered.ok, "Пользователь должен зарегистрироваться");
    persistence.resetPersistentStoreForTests();
    assert((await authenticateLocalUser(email, "StrongPersistent123")).ok, "Пользователь должен входить после повторного открытия файлового store");

    const resetToken = await createLocalPasswordReset(email);
    persistence.resetPersistentStoreForTests();
    assert((await resetLocalPassword(resetToken, "ResetPersistent456")).ok, "Reset token должен переживать повторное открытие store");

    const token = await sessionModule.createSessionToken({ accountId: registered.user.accountId, email, name: "Persistent User", roles: ["contributor"], status: "active", remember: true });
    persistence.resetPersistentStoreForTests();
    assert((await sessionModule.verifySessionToken(token))?.accountId === registered.user.accountId, "Сессия должна сохраняться на диске");

    const account = `fal-${Date.now()}`;
    assert(quota.reserveFalGeneration(account).ok, "Квота должна резервироваться");
    persistence.resetPersistentStoreForTests();
    assert(quota.getFalQuota(account).usedGenerations === 1, "Квота fal.ai должна сохраняться после повторного открытия store");

    const rateKey = `persistent-rate-${Date.now()}`;
    assert(rate.checkRateLimit(rateKey, 1, 60_000).allowed, "Первый rate-limit запрос должен пройти");
    persistence.resetPersistentStoreForTests();
    assert(!rate.checkRateLimit(rateKey, 1, 60_000).allowed, "Rate limit должен сохраняться на диске");

    const state = { profile: { name: "Persistent" }, preferences: {}, projects: [], notifications: [] };
    const cookie = `${sessionModule.SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`;
    const putRequest = new Request("http://localhost:3000/api/v1/local-state", { method: "PUT", headers: { cookie, origin: "http://localhost:3000", "content-type": "application/json" }, body: JSON.stringify(state) });
    const put = await localStateRoute.PUT(putRequest);
    assert(put.status === 200, "Durable local state PUT должен работать");
    persistence.resetPersistentStoreForTests();
    const get = await localStateRoute.GET(new Request("http://localhost:3000/api/v1/local-state", { headers: { cookie } }));
    const payload = await get.json() as { state?: { profile?: { name?: string } } };
    assert(get.status === 200 && payload.state?.profile?.name === "Persistent", "PlatformState должен сохраняться между повторными открытиями store");

    appendSecurityAudit({ type: "test.persistence", outcome: "success", actorAccountId: registered.user.accountId });
    await sendTransactionalEmail({ to: email, template: "test", variables: { name: "Persistent User", message: "Stored", actionUrl: "http://localhost:3000" }, idempotencyKey: `persistent-email-${registered.user.accountId}` });
    persistence.resetPersistentStoreForTests();
    assert(listSecurityAudit().some((event) => event.type === "test.persistence"), "Security audit должен сохраняться на диске");
    assert(listEmailDeliveryEvents().some((event) => event.template === "test"), "Email delivery log должен сохраняться на диске");

    const health = persistence.persistenceHealth();
    assert(health.driver === "file" && health.writable && health.namespaces >= 7, "Health должен подтверждать файловое хранилище");
    console.log(JSON.stringify({ accounts: "persistent", sessions: "persistent", passwordReset: "persistent", falQuota: "persistent", rateLimit: "persistent", platformState: "persistent", securityAudit: "persistent", emailEvents: "persistent", atomicFiles: "ok" }, null, 2));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
