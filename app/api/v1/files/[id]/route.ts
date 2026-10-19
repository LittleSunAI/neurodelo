import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/server/session";
import { deleteStoredObject, getStoredObject, readStoredObject } from "@/lib/server/object-storage";
import { isSameOriginRequest, securityHeaders } from "@/lib/server/request-security";
import { appendSecurityAudit } from "@/lib/server/security-audit";

type Context = { params: Promise<{ id: string }> };

function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: securityHeaders() }); }

export async function GET(request: Request, context: Context) {
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  const { id } = await context.params;
  const metadata = getStoredObject(id);
  if (!metadata || metadata.ownerAccountId !== session.accountId) return json({ error: "Not found" }, 404);
  if (new URL(request.url).searchParams.get("download") !== "1") return json({ file: metadata });
  if (metadata.status !== "approved") return json({ error: "Файл ещё не одобрен" }, 409);
  try {
    const bytes = readStoredObject(metadata);
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        ...securityHeaders({
          "Content-Type": metadata.mimeType,
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(metadata.safeName)}`,
          "Content-Length": String(bytes.byteLength),
        }),
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return json({ error: "Stored object is unavailable" }, 410);
  }
}

export async function DELETE(request: Request, context: Context) {
  if (!isSameOriginRequest(request)) return json({ error: "Origin is not allowed" }, 403);
  const session = await getRequestSession(request);
  if (!session) return json({ error: "Unauthorized" }, 401);
  const { id } = await context.params;
  const metadata = getStoredObject(id);
  if (!metadata || metadata.ownerAccountId !== session.accountId) return json({ error: "Not found" }, 404);
  deleteStoredObject(id);
  appendSecurityAudit({ type: "file.delete", outcome: "success", actorAccountId: session.accountId, targetId: id });
  return json({ ok: true });
}
