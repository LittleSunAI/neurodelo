import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/security/permissions";
import { listLocalJobs } from "@/lib/server/jobs";
import { getRequestSession } from "@/lib/server/session";
import { securityHeaders } from "@/lib/server/request-security";

export const runtime = "nodejs";
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: securityHeaders() }); }

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  if (!hasPermission(session.roles, "securityAudit.view")) return json({ error: "Forbidden" }, 403);
  const limit = Number(new URL(request.url).searchParams.get("limit") || 100);
  return json({ jobs: listLocalJobs(limit) });
}
