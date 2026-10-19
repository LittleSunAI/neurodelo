import { NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/lib/server/email";
import { clientIp, checkRateLimit } from "@/lib/server/rate-limit";
import { isSameOriginRequest, readJsonWithinLimit, securityHeaders } from "@/lib/server/request-security";
import { getRequestSession } from "@/lib/server/session";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ ok: false, error: "Origin is not allowed" }, { status: 403, headers: securityHeaders() });
  }

  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: securityHeaders() });
  }

  const body = await readJsonWithinLimit<{ email?: string }>(request, 8 * 1024);
  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400, headers: securityHeaders() });
  }

  const to = body.email?.trim() || session.email;
  if (to.toLowerCase() !== session.email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "Можно отправлять тест только на почту текущего аккаунта" },
      { status: 403, headers: securityHeaders() },
    );
  }

  // Проверяем получателя до расходования rate-limit. Неверный адрес не должен
  // уменьшать квоту текущего пользователя и не должен маскироваться ответом 429.
  const rate = checkRateLimit(`email-test:${session.accountId}:${clientIp(request)}`, 3, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { ok: false, error: "Слишком много тестовых писем" },
      { status: 429, headers: securityHeaders({ "Retry-After": String(rate.retryAfterSeconds) }) },
    );
  }

  const result = await sendTransactionalEmail({
    to,
    template: "test",
    variables: {
      name: session.name,
      actionUrl: new URL("/", request.url).toString(),
      message: "Серверный канал уведомлений работает.",
    },
    idempotencyKey: `test-${session.accountId}-${Math.floor(Date.now() / 3_600_000)}`,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502, headers: securityHeaders() });
}
