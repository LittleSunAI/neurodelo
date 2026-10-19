import { NextResponse } from "next/server";
import { appendSecurityAudit } from "@/lib/server/security-audit";
import { getRequestSession } from "@/lib/server/session";
import { clientIp, checkRateLimit } from "@/lib/server/rate-limit";
import { isSameOriginRequest, securityHeaders } from "@/lib/server/request-security";
import { listStoredObjects, storeUploadedObject } from "@/lib/server/object-storage";

export const runtime = "nodejs";

function json(body: unknown, status = 200, extra?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: securityHeaders(extra) });
}

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  return json({ files: listStoredObjects(session.accountId) });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return json({ error: "Origin is not allowed" }, 403);
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);

  const declared = Number(request.headers.get("content-length") || 0);
  const absoluteMax = Math.max(512 * 1024, Number(process.env.UPLOAD_MAX_BYTES || 8 * 1024 * 1024)) + 128 * 1024;
  if (Number.isFinite(declared) && declared > absoluteMax) return json({ error: "Payload too large" }, 413);

  const minute = checkRateLimit(`upload-minute:${session.accountId}:${clientIp(request)}`, 5, 60_000);
  if (!minute.allowed) return json({ error: "Слишком много загрузок", retryAfterSeconds: minute.retryAfterSeconds }, 429, { "Retry-After": String(minute.retryAfterSeconds) });
  const day = checkRateLimit(`upload-day:${session.accountId}`, Math.max(1, Number(process.env.UPLOAD_MAX_FILES_PER_DAY || 20)), 24 * 60 * 60 * 1000);
  if (!day.allowed) return json({ error: "Дневной лимит загрузок исчерпан", retryAfterSeconds: day.retryAfterSeconds }, 429, { "Retry-After": String(day.retryAfterSeconds) });

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return json({ error: "Файл не передан" }, 400);
    if (file.size > absoluteMax) return json({ error: "Payload too large" }, 413);
    const scope = String(form.get("scope") || "attachment");
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = storeUploadedObject({ ownerAccountId: session.accountId, scope, originalName: file.name, buffer });
    appendSecurityAudit({ type: "file.upload", outcome: "success", actorAccountId: session.accountId, targetId: result.metadata.id, metadata: { mimeType: result.metadata.mimeType, size: result.metadata.size, deduplicated: result.deduplicated } });
    return json(result, result.deduplicated ? 200 : 201);
  } catch (error) {
    appendSecurityAudit({ type: "file.upload", outcome: "blocked", actorAccountId: session.accountId, metadata: { reason: error instanceof Error ? error.message.slice(0, 180) : "unknown" } });
    return json({ error: error instanceof Error ? error.message : "Не удалось сохранить файл" }, 422);
  }
}
