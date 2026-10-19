import { getPersistentStore } from "../persistence";
import type { LocalJob } from "./types";

const NS = "background-jobs";
const MAX_PAYLOAD_BYTES = 64 * 1024;

function sizeOf(value: unknown) { return new TextEncoder().encode(JSON.stringify(value)).byteLength; }

export function enqueueLocalJob<T>(input: { type: string; payload: T; deduplicationKey?: string; maxAttempts?: number; delayMs?: number }) {
  if (!/^[a-z0-9][a-z0-9._-]{1,80}$/i.test(input.type)) throw new Error("Invalid job type");
  if (sizeOf(input.payload) > MAX_PAYLOAD_BYTES) throw new Error("Job payload is too large");
  const now = Date.now();
  return getPersistentStore().transact<LocalJob, LocalJob>(NS, (records) => {
    if (input.deduplicationKey) {
      const existing = Object.values(records).find((job) => job.type === input.type && job.deduplicationKey === input.deduplicationKey && ["queued", "processing", "completed"].includes(job.status));
      if (existing) return structuredClone(existing);
    }
    const job: LocalJob<T> = {
      id: crypto.randomUUID(), type: input.type, payload: structuredClone(input.payload), deduplicationKey: input.deduplicationKey,
      status: "queued", attempts: 0, maxAttempts: Math.max(1, Math.min(input.maxAttempts ?? 3, 10)),
      availableAt: now + Math.max(0, input.delayMs ?? 0), createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
    };
    records[job.id] = job;
    return structuredClone(job);
  });
}

export function claimLocalJob(workerId: string, lockMs = 60_000) {
  const now = Date.now();
  return getPersistentStore().transact<LocalJob, LocalJob | null>(NS, (records) => {
    const job = Object.values(records)
      .filter((item) => item.status === "queued" && item.availableAt <= now && (!item.lockedUntil || item.lockedUntil <= now))
      .sort((a, b) => a.availableAt - b.availableAt || a.createdAt.localeCompare(b.createdAt))[0];
    if (!job) return null;
    const updated: LocalJob = { ...job, status: "processing", attempts: job.attempts + 1, lockedUntil: now + Math.max(5_000, lockMs), lockedBy: workerId.slice(0, 120), updatedAt: new Date(now).toISOString(), result: undefined, error: undefined };
    records[job.id] = updated;
    return structuredClone(updated);
  });
}

export function completeLocalJob<TResult>(id: string, result: TResult) {
  return getPersistentStore().transact<LocalJob, LocalJob | null>(NS, (records) => {
    const job = records[id]; if (!job || job.status !== "processing") return null;
    const now = new Date().toISOString();
    const updated: LocalJob = { ...job, status: "completed", result: structuredClone(result), completedAt: now, updatedAt: now, lockedUntil: undefined, lockedBy: undefined };
    records[id] = updated; return structuredClone(updated);
  });
}

export function failLocalJob(id: string, error: string, retryDelayMs = 5_000) {
  return getPersistentStore().transact<LocalJob, LocalJob | null>(NS, (records) => {
    const job = records[id]; if (!job || job.status !== "processing") return null;
    const retry = job.attempts < job.maxAttempts;
    const now = Date.now();
    const updated: LocalJob = { ...job, status: retry ? "queued" : "failed", error: error.slice(0, 1000), availableAt: retry ? now + Math.max(0, retryDelayMs) : job.availableAt, updatedAt: new Date(now).toISOString(), lockedUntil: undefined, lockedBy: undefined };
    records[id] = updated; return structuredClone(updated);
  });
}

export function listLocalJobs(limit = 100) {
  return getPersistentStore().entries<LocalJob>(NS).map(([, job]) => job).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, Math.max(1, Math.min(limit, 1000)));
}

export function cleanupLocalJobs(retentionDays = 14) {
  const threshold = Date.now() - Math.max(1, retentionDays) * 24 * 60 * 60 * 1000;
  return getPersistentStore().transact<LocalJob, number>(NS, (records) => {
    let deleted = 0;
    for (const [id, job] of Object.entries(records)) {
      if (["completed", "failed", "cancelled"].includes(job.status) && Date.parse(job.updatedAt) < threshold) { delete records[id]; deleted += 1; }
    }
    return deleted;
  });
}
