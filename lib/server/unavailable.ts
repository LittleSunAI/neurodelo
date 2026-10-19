import { NextResponse } from "next/server";
import { securityHeaders } from "@/lib/server/request-security";
export function backendUnavailable(module: string, path: string[]) { return NextResponse.json({ error: "backend_not_configured", module, message: "Серверный модуль ещё не подключён. Включите локальный fallback или настройте backend.", path: path.join("/") }, { status: 503, headers: securityHeaders({ "Retry-After": "60" }) }); }
