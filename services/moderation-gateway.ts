import { moderationConfig, moderationRuntimeMode } from "../lib/moderation-config";
import type { ExternalLinkReview, ExternalLinkReviewStatus, FeatureFlag, ModerationAction, ModerationAppeal, ModerationAuditEvent, ModerationCase, ModerationDecision } from "../types/platform";

const wait = (ms: number = moderationConfig.artificialDelayMs) => new Promise((resolve) => setTimeout(resolve, ms));
async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/moderation${path}`, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error(`Moderation API недоступен: ${response.status}`);
  return response.json() as Promise<T>;
}
const now = () => "только что";

export const moderationGateway = {
  mode: moderationRuntimeMode,
  async assignCase(input: { item: ModerationCase; reviewer: string }): Promise<{ item: ModerationCase; audit: ModerationAuditEvent }> {
    if (moderationRuntimeMode === "api") return apiRequest("/cases/assign", { method: "POST", body: JSON.stringify(input) });
    await wait();
    return { item: { ...input.item, assignedTo: input.reviewer, status: "reviewing" }, audit: { id: `mod-audit-${Date.now()}`, action: "case-assigned", targetId: input.item.id, actorName: input.reviewer, details: "Дело взято на проверку", createdAt: now() } };
  },
  async resolveCase(input: { item: ModerationCase; action: ModerationAction; reason: string; actorName: string }): Promise<{ item: ModerationCase; decision: ModerationDecision; audit: ModerationAuditEvent }> {
    if (moderationRuntimeMode === "api") return apiRequest("/cases/resolve", { method: "POST", body: JSON.stringify(input) });
    await wait();
    const decision: ModerationDecision = { id: `mod-decision-${Date.now()}`, caseId: input.item.id, action: input.action, reason: input.reason, actorName: input.actorName, createdAt: now(), expiresAt: input.action === "suspend" ? "через 7 дней" : undefined };
    const status = input.action === "dismiss" || input.action === "approve" || input.action === "restore" ? "dismissed" : "resolved";
    return { item: { ...input.item, status, decisionId: decision.id, assignedTo: input.actorName }, decision, audit: { id: `mod-audit-${Date.now()}`, action: `decision-${input.action}`, targetId: input.item.id, actorName: input.actorName, details: input.reason, createdAt: now() } };
  },
  async createAppeal(input: { caseId: string; submittedBy: string; reason: string }): Promise<ModerationAppeal> {
    if (moderationRuntimeMode === "api") return apiRequest("/appeals", { method: "POST", body: JSON.stringify(input) });
    await wait();
    return { id: `appeal-${Date.now()}`, ...input, status: "open", createdAt: now() };
  },
  async reviewAppeal(input: { appeal: ModerationAppeal; outcome: "upheld" | "overturned" | "rejected"; reason: string; reviewerName: string }): Promise<{ appeal: ModerationAppeal; audit: ModerationAuditEvent }> {
    if (moderationRuntimeMode === "api") return apiRequest("/appeals/review", { method: "POST", body: JSON.stringify(input) });
    await wait();
    return { appeal: { ...input.appeal, status: input.outcome, reviewedAt: now(), reviewerName: input.reviewerName, resolution: input.reason }, audit: { id: `mod-audit-${Date.now()}`, action: `appeal-${input.outcome}`, targetId: input.appeal.id, actorName: input.reviewerName, details: input.reason, createdAt: now() } };
  },
  async reviewExternalLink(input: { link: ExternalLinkReview; status: ExternalLinkReviewStatus; note: string; reviewerName: string }): Promise<{ link: ExternalLinkReview; audit: ModerationAuditEvent }> {
    if (moderationRuntimeMode === "api") return apiRequest("/links/review", { method: "POST", body: JSON.stringify(input) });
    await wait();
    return { link: { ...input.link, status: input.status, note: input.note, reviewerName: input.reviewerName, reviewedAt: now() }, audit: { id: `mod-audit-${Date.now()}`, action: `link-${input.status}`, targetId: input.link.id, actorName: input.reviewerName, details: input.note, createdAt: now() } };
  },
  async toggleFeatureFlag(input: { flag: FeatureFlag; actorName: string }): Promise<{ flag: FeatureFlag; audit: ModerationAuditEvent }> {
    if (moderationRuntimeMode === "api") return apiRequest("/feature-flags/toggle", { method: "POST", body: JSON.stringify(input) });
    await wait(90);
    const flag = { ...input.flag, enabled: !input.flag.enabled, updatedAt: now(), updatedBy: input.actorName };
    return { flag, audit: { id: `mod-audit-${Date.now()}`, action: flag.enabled ? "feature-enabled" : "feature-disabled", targetId: flag.id, actorName: input.actorName, details: flag.label, createdAt: now() } };
  },
};
