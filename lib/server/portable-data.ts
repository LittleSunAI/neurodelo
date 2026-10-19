import { createHash } from "node:crypto";
import { getPersistentStore } from "./persistence";
import type { PlatformState } from "@/types/platform";

const NS = "platform-state";
export const PORTABLE_FORMAT = "neurodelo-portable-data";

export type PortableDataEnvelope = {
  format: typeof PORTABLE_FORMAT;
  version: 1;
  exportedAt: string;
  sourceRelease: string;
  state: PlatformState;
  checksum: string;
};

function stateLooksValid(value: unknown): value is PlatformState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<PlatformState>;
  return Boolean(candidate.profile && candidate.preferences && Array.isArray(candidate.projects) && Array.isArray(candidate.notifications));
}

function digestPayload(value: Omit<PortableDataEnvelope, "checksum">) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function createPortableData(accountId: string) {
  const state = getPersistentStore().get<PlatformState>(NS, accountId);
  if (!state) return null;
  const payload: Omit<PortableDataEnvelope, "checksum"> = {
    format: PORTABLE_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    sourceRelease: "prebackend-final-0.23.0",
    state,
  };
  return { ...payload, checksum: digestPayload(payload) } satisfies PortableDataEnvelope;
}

export function validatePortableData(value: unknown): { ok: true; envelope: PortableDataEnvelope } | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "Invalid portable data envelope" };
  const envelope = value as Partial<PortableDataEnvelope>;
  if (envelope.format !== PORTABLE_FORMAT || envelope.version !== 1 || !envelope.exportedAt || !envelope.sourceRelease || !envelope.checksum) return { ok: false, error: "Unsupported portable data format" };
  if (!stateLooksValid(envelope.state)) return { ok: false, error: "Portable state is invalid" };
  const payload = { format: envelope.format, version: envelope.version, exportedAt: envelope.exportedAt, sourceRelease: envelope.sourceRelease, state: envelope.state } as const;
  if (digestPayload(payload) !== envelope.checksum) return { ok: false, error: "Portable data checksum mismatch" };
  return { ok: true, envelope: envelope as PortableDataEnvelope };
}

export function importPortableData(accountId: string, envelope: PortableDataEnvelope) {
  getPersistentStore().set(NS, accountId, envelope.state);
  return envelope.state;
}
