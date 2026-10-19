export {};
process.env.PERSISTENCE_DRIVER = "memory";
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
async function main() {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM;
  const { sendTransactionalEmail } = await import("../lib/server/email");
  const preview = await sendTransactionalEmail({ to: "person@example.com", template: "test", variables: { name: "Test", message: "Hello", actionUrl: "https://example.com" }, idempotencyKey: "preview-test" });
  assert(preview.ok && preview.provider === "preview", "Без ключа должен использоваться безопасный preview");
  assert(!(await sendTransactionalEmail({ to: "bad", template: "test", variables: {}, idempotencyKey: "bad" })).ok, "Некорректный email должен отклоняться");

  let capturedBody = ""; let capturedIdempotency = "";
  process.env.RESEND_API_KEY = "re_test_key"; process.env.EMAIL_FROM = "NEURODELO <noreply@example.com>";
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    capturedBody = String(init?.body ?? ""); capturedIdempotency = new Headers(init?.headers).get("Idempotency-Key") ?? "";
    return new Response(JSON.stringify({ id: "email-123" }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  const delivery = await sendTransactionalEmail({ to: "person@example.com", template: "security-alert", variables: { name: "<script>x</script>", message: "<img src=x>", actionUrl: "https://example.com" }, idempotencyKey: "event-security-123" });
  assert(delivery.ok && delivery.provider === "resend", "Настроенный provider должен использовать Resend");
  assert(capturedIdempotency === "event-security-123", "Idempotency-Key должен передаваться provider");
  assert(!capturedBody.includes("<script>x</script>") && capturedBody.includes("&lt;script&gt;"), "HTML пользователя должен экранироваться");
  globalThis.fetch = originalFetch;
  if (originalKey) process.env.RESEND_API_KEY = originalKey; else delete process.env.RESEND_API_KEY;
  if (originalFrom) process.env.EMAIL_FROM = originalFrom; else delete process.env.EMAIL_FROM;
  console.log(JSON.stringify({ preview: "ok", validation: "ok", resend: "ok", idempotency: "ok", htmlEscaping: "ok" }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
