import { getPersistentStore } from "./persistence";

type IdempotencyEntry = { expiresAt: number; state: "pending" | "ready"; payload?: unknown };
type Usage = { day: string; generations: number; estimatedUsd: number; idempotency: Record<string, IdempotencyEntry> };
const NS = "fal-usage";

function settings() {
  return {
    maxGenerations: Math.max(1, Number(process.env.FAL_MAX_GENERATIONS_PER_DAY || 5)),
    maxEstimatedUsd: Math.max(.01, Number(process.env.FAL_MAX_ESTIMATED_DAILY_USD || 1)),
    estimatedCostUsd: Math.max(.001, Number(process.env.FAL_ESTIMATED_COST_PER_GENERATION_USD || .08)),
  };
}

function fresh(day: string): Usage { return { day, generations: 0, estimatedUsd: 0, idempotency: {} }; }

function normalize(usage: Usage | null) {
  const day = new Date().toISOString().slice(0, 10);
  const current = !usage || usage.day !== day ? fresh(day) : structuredClone(usage);
  const now = Date.now();
  for (const [key, value] of Object.entries(current.idempotency)) if (value.expiresAt <= now) delete current.idempotency[key];
  return current;
}

function quota(usage: Usage) {
  const config = settings();
  return {
    day: usage.day,
    usedGenerations: usage.generations,
    maxGenerations: config.maxGenerations,
    remainingGenerations: Math.max(0, config.maxGenerations - usage.generations),
    estimatedSpentUsd: Number(usage.estimatedUsd.toFixed(4)),
    estimatedDailyLimitUsd: config.maxEstimatedUsd,
    estimatedCostPerGenerationUsd: config.estimatedCostUsd,
    remainingEstimatedUsd: Number(Math.max(0, config.maxEstimatedUsd - usage.estimatedUsd).toFixed(4)),
    persistent: true,
  };
}

export function getFalQuota(accountId: string) {
  const store = getPersistentStore();
  const usage = normalize(store.get<Usage>(NS, accountId));
  store.set(NS, accountId, usage);
  return quota(usage);
}

export function reserveFalGeneration(accountId: string) {
  const config = settings();
  return getPersistentStore().transact<Usage, { ok: true; quota: ReturnType<typeof quota> } | { ok: false; reason: "generation_limit" | "budget_limit"; quota: ReturnType<typeof quota> }>(NS, (records) => {
    const usage = normalize(records[accountId] ?? null);
    if (usage.generations >= config.maxGenerations) { records[accountId] = usage; return { ok: false, reason: "generation_limit", quota: quota(usage) }; }
    if (usage.estimatedUsd + config.estimatedCostUsd > config.maxEstimatedUsd + 1e-9) { records[accountId] = usage; return { ok: false, reason: "budget_limit", quota: quota(usage) }; }
    usage.generations += 1;
    usage.estimatedUsd += config.estimatedCostUsd;
    records[accountId] = usage;
    return { ok: true, quota: quota(usage) };
  });
}

export function rollbackFalGeneration(accountId: string) {
  const config = settings();
  getPersistentStore().transact<Usage, void>(NS, (records) => {
    const usage = normalize(records[accountId] ?? null);
    usage.generations = Math.max(0, usage.generations - 1);
    usage.estimatedUsd = Math.max(0, usage.estimatedUsd - config.estimatedCostUsd);
    records[accountId] = usage;
  });
}

export function getIdempotentFalResult(accountId: string, key: string) {
  const usage = normalize(getPersistentStore().get<Usage>(NS, accountId));
  getPersistentStore().set(NS, accountId, usage);
  const entry = usage.idempotency[key];
  return entry?.state === "ready" ? entry.payload ?? null : null;
}

export function claimFalIdempotency(accountId: string, key: string) {
  return getPersistentStore().transact<Usage, { ok: true } | { ok: false; state: "pending" | "ready" }>(NS, (records) => {
    const usage = normalize(records[accountId] ?? null);
    const existing = usage.idempotency[key];
    if (existing) { records[accountId] = usage; return { ok: false, state: existing.state }; }
    usage.idempotency[key] = { expiresAt: Date.now() + 10 * 60 * 1000, state: "pending" };
    records[accountId] = usage;
    return { ok: true };
  });
}

export function releaseFalIdempotency(accountId: string, key: string) {
  getPersistentStore().transact<Usage, void>(NS, (records) => {
    const usage = normalize(records[accountId] ?? null);
    if (usage.idempotency[key]?.state === "pending") delete usage.idempotency[key];
    records[accountId] = usage;
  });
}

export function saveIdempotentFalResult(accountId: string, key: string, payload: unknown) {
  getPersistentStore().transact<Usage, void>(NS, (records) => {
    const usage = normalize(records[accountId] ?? null);
    usage.idempotency[key] = { expiresAt: Date.now() + 24 * 60 * 60 * 1000, state: "ready", payload };
    records[accountId] = usage;
  });
}
