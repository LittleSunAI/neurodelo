import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/server/session";
import { getPersistentStore } from "@/lib/server/persistence";
import { isSameOriginRequest, readJsonWithinLimit, securityHeaders } from "@/lib/server/request-security";
import type { PlatformState } from "@/types/platform";

export const runtime = "nodejs";
const NS = "platform-state";
const MAX_BYTES = Math.max(256 * 1024, Number(process.env.LOCAL_STATE_MAX_BYTES || 4 * 1024 * 1024));

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: securityHeaders() });
}

function looksLikePlatformState(value: unknown): value is PlatformState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<PlatformState>;
  return Boolean(candidate.profile && candidate.preferences && Array.isArray(candidate.projects) && Array.isArray(candidate.notifications));
}

export async function GET(request: Request) {
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  const state = getPersistentStore().get<PlatformState>(NS, session.accountId);
  return json({ state, persistent: true });
}

export async function PUT(request: Request) {
  if (!isSameOriginRequest(request)) return json({ error: "Origin is not allowed" }, 403);
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  const body = await readJsonWithinLimit<PlatformState>(request, MAX_BYTES);
  if (!looksLikePlatformState(body)) return json({ error: "Invalid platform state" }, 422);
  getPersistentStore().set(NS, session.accountId, body);
  return json({ state: body, persistent: true });
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return json({ error: "Origin is not allowed" }, 403);
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  getPersistentStore().delete(NS, session.accountId);
  return json({ ok: true });
}
