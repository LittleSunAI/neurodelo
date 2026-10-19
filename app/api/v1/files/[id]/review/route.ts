import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/security/permissions";
import { getRequestSession } from "@/lib/server/session";
import { isSameOriginRequest, readJsonWithinLimit, securityHeaders } from "@/lib/server/request-security";
import { getStoredObject, reviewStoredObject } from "@/lib/server/object-storage";
import { appendSecurityAudit } from "@/lib/server/security-audit";

type Context = { params: Promise<{ id: string }> };
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: securityHeaders() }); }

export async function POST(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return json({ error: "Origin is not allowed" }, 403);
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  if (!hasPermission(session.roles, "moderation.decide")) return json({ error: "Forbidden" }, 403);
  const { id } = await context.params;
  if (!getStoredObject(id)) return json({ error: "Not found" }, 404);
  const body = await readJsonWithinLimit<{ status?: string; reason?: string }>(request, 8 * 1024);
  if (!body || !["approved", "rejected"].includes(body.status || "")) return json({ error: "Invalid review status" }, 422);
  const file = reviewStoredObject(id, body.status as "approved" | "rejected", session.accountId, body.reason);
  appendSecurityAudit({ type: "file.review", outcome: "success", actorAccountId: session.accountId, targetId: id, metadata: { status: file.status } });
  return json({ file });
}
