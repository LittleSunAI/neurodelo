import { createHash } from "node:crypto";
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getPersistentStore } from "../persistence";
import { sanitizeUploadName, validateUploadedBuffer } from "./file-validation";
import type { ObjectStorageHealth, StoredObjectMetadata, StoredObjectScope, StoredObjectStatus } from "./types";

const NS = "stored-files";
const VALID_SCOPES = new Set<StoredObjectScope>(["avatar", "project", "chat", "attachment", "document"]);

function dataRoot() {
  const store = getPersistentStore();
  const baseDirectory = store.driver === "file" ? store.location : path.join(process.cwd(), ".data");
  return path.resolve(baseDirectory, "objects");
}

function ensureDirectory(directory: string) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  try { chmodSync(directory, 0o700); } catch { /* Windows */ }
}

function statusDirectory(status: StoredObjectStatus) {
  const directory = path.join(dataRoot(), status);
  ensureDirectory(directory);
  return directory;
}

function objectPath(metadata: StoredObjectMetadata) {
  const root = statusDirectory(metadata.status);
  const resolved = path.resolve(root, metadata.storedName);
  if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) throw new Error("Unsafe object path");
  return resolved;
}

function maxBytesForMime(mimeType: string) {
  const globalMax = Math.max(256 * 1024, Number(process.env.UPLOAD_MAX_BYTES || 8 * 1024 * 1024));
  if (mimeType.startsWith("text/")) return Math.min(globalMax, 2 * 1024 * 1024);
  if (mimeType === "application/pdf") return Math.min(globalMax, 8 * 1024 * 1024);
  return Math.min(globalMax, 6 * 1024 * 1024);
}

export function storeUploadedObject(input: { ownerAccountId: string; scope: string; originalName: string; buffer: Buffer }) {
  const scope = VALID_SCOPES.has(input.scope as StoredObjectScope) ? input.scope as StoredObjectScope : "attachment";
  if (!input.buffer.length) throw new Error("Пустой файл не разрешён");
  const safeName = sanitizeUploadName(input.originalName);
  const validated = validateUploadedBuffer(input.buffer, safeName);
  if (input.buffer.byteLength > maxBytesForMime(validated.mimeType)) throw new Error("Файл превышает допустимый размер для этого типа");
  const sha256 = createHash("sha256").update(input.buffer).digest("hex");
  const existing = getPersistentStore().entries<StoredObjectMetadata>(NS)
    .map(([, value]) => value)
    .find((item) => item.ownerAccountId === input.ownerAccountId && item.sha256 === sha256 && item.status !== "rejected");
  if (existing) return { metadata: existing, deduplicated: true };

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const storedName = `${id}${validated.extension}`;
  const metadata: StoredObjectMetadata = {
    id,
    ownerAccountId: input.ownerAccountId,
    scope,
    originalName: input.originalName.slice(0, 255),
    safeName,
    storedName,
    extension: validated.extension,
    mimeType: validated.mimeType,
    size: input.buffer.byteLength,
    sha256,
    status: "quarantined",
    width: validated.width,
    height: validated.height,
    createdAt: now,
    updatedAt: now,
    scan: { passed: true, checks: validated.checks, warnings: validated.warnings, scannedAt: now },
  };

  const quarantinePath = objectPath(metadata);
  writeFileSync(quarantinePath, input.buffer, { flag: "wx", mode: 0o600 });
  try { chmodSync(quarantinePath, 0o600); } catch { /* Windows */ }
  getPersistentStore().set(NS, id, metadata);

  if (process.env.OBJECT_AUTO_APPROVE_SAFE !== "false") return { metadata: reviewStoredObject(id, "approved", "local-scanner"), deduplicated: false };
  return { metadata, deduplicated: false };
}

export function getStoredObject(id: string) {
  return getPersistentStore().get<StoredObjectMetadata>(NS, id);
}

export function listStoredObjects(ownerAccountId: string) {
  return getPersistentStore().entries<StoredObjectMetadata>(NS)
    .map(([, value]) => value)
    .filter((item) => item.ownerAccountId === ownerAccountId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function readStoredObject(metadata: StoredObjectMetadata) {
  const file = objectPath(metadata);
  if (!existsSync(file)) throw new Error("Файл отсутствует в локальном object storage");
  return readFileSync(file);
}

export function reviewStoredObject(id: string, nextStatus: "approved" | "rejected", reviewerAccountId: string, reason?: string) {
  const current = getStoredObject(id);
  if (!current) throw new Error("Файл не найден");
  if (current.status === nextStatus) return current;
  const source = objectPath(current);
  const updated: StoredObjectMetadata = {
    ...current,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    reviewedByAccountId: reviewerAccountId,
    rejectionReason: nextStatus === "rejected" ? (reason || "Отклонено проверяющим").slice(0, 500) : undefined,
  };
  const destination = objectPath(updated);
  if (existsSync(source)) renameSync(source, destination);
  getPersistentStore().set(NS, id, updated);
  return updated;
}

export function deleteStoredObject(id: string) {
  const current = getStoredObject(id);
  if (!current) return false;
  rmSync(objectPath(current), { force: true });
  getPersistentStore().delete(NS, id);
  return true;
}

export function cleanupStoredObjects(retentionDays = Number(process.env.OBJECT_RETENTION_DAYS || 30)) {
  const threshold = Date.now() - Math.max(1, retentionDays) * 24 * 60 * 60 * 1000;
  let deleted = 0;
  for (const [, item] of getPersistentStore().entries<StoredObjectMetadata>(NS)) {
    if (item.status === "approved") continue;
    if (Date.parse(item.updatedAt) < threshold && deleteStoredObject(item.id)) deleted += 1;
  }
  return deleted;
}

export function objectStorageHealth(): ObjectStorageHealth {
  ensureDirectory(dataRoot());
  const items = getPersistentStore().entries<StoredObjectMetadata>(NS).map(([, value]) => value);
  const probe = path.join(dataRoot(), `.probe-${process.pid}-${Date.now()}`);
  let writable = false;
  try { writeFileSync(probe, "ok", { flag: "wx", mode: 0o600 }); writable = statSync(probe).isFile(); } finally { rmSync(probe, { force: true }); }
  return {
    driver: "local-file",
    location: dataRoot(),
    writable,
    objects: items.length,
    quarantined: items.filter((item) => item.status === "quarantined").length,
    approved: items.filter((item) => item.status === "approved").length,
    rejected: items.filter((item) => item.status === "rejected").length,
    warning: "Локальный файловый object storage предназначен для одного процесса. Для публичного запуска замените его MinIO/S3 и антивирусным сканером.",
  };
}
