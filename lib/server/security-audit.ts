import { getPersistentStore } from "./persistence";

export type SecurityAuditEvent = {
  id: string;
  type: string;
  outcome: "success" | "failure" | "blocked";
  actorAccountId?: string;
  actorEmailHash?: string;
  ipHash?: string;
  targetId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
};

const NS = "security-audit";

export function appendSecurityAudit(input: Omit<SecurityAuditEvent, "id" | "createdAt">) {
  const event: SecurityAuditEvent = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...input };
  getPersistentStore().set(NS, event.id, event);
  return event;
}

export function listSecurityAudit(limit = 200) {
  return getPersistentStore().entries<SecurityAuditEvent>(NS)
    .map(([, event]) => event)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.max(1, Math.min(limit, 1000)));
}
