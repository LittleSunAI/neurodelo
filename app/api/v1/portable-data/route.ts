import { NextResponse } from "next/server";
import { appendSecurityAudit } from "@/lib/server/security-audit";
import { getRequestSession } from "@/lib/server/session";
import { isSameOriginRequest, readJsonWithinLimit, securityHeaders } from "@/lib/server/request-security";
import { createPortableData, importPortableData, validatePortableData } from "@/lib/server/portable-data";

export const runtime = "nodejs";
function json(body: unknown, status = 200, extra?: Record<string, string>) { return NextResponse.json(body, { status, headers: securityHeaders(extra) }); }

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  const envelope = createPortableData(session.accountId);
  if (!envelope) return json({ error: "Сохраняемые данные ещё не созданы" }, 404);
  appendSecurityAudit({ type: "data.export", outcome: "success", actorAccountId: session.accountId });
  if (new URL(request.url).searchParams.get("download") === "1") {
    return json(envelope, 200, { "Content-Disposition": `attachment; filename="neurodelo-export-${new Date().toISOString().slice(0, 10)}.json"` });
  }
  return json({ envelope });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return json({ error: "Origin is not allowed" }, 403);
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  const body = await readJsonWithinLimit<{ envelope?: unknown; dryRun?: boolean }>(request, 5 * 1024 * 1024);
  if (!body) return json({ error: "Invalid import request" }, 400);
  const result = validatePortableData(body.envelope);
  if (!result.ok) {
    appendSecurityAudit({ type: "data.import", outcome: "blocked", actorAccountId: session.accountId, metadata: { reason: result.error } });
    return json({ error: result.error }, 422);
  }
  if (!body.dryRun) importPortableData(session.accountId, result.envelope);
  appendSecurityAudit({ type: "data.import", outcome: "success", actorAccountId: session.accountId, metadata: { dryRun: Boolean(body.dryRun) } });
  return json({ ok: true, dryRun: Boolean(body.dryRun), summary: { projects: result.envelope.state.projects.length, notifications: result.envelope.state.notifications.length, nickname: result.envelope.state.profile.nickname } });
}
