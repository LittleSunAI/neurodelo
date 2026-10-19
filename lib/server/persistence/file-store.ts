import {
  chmodSync,
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import type { PersistentStore, PersistenceEnvelope, PersistenceRecordMap } from "./types";

const NS_PATTERN = /^[a-z0-9][a-z0-9._-]{0,80}$/i;

function safeNamespace(namespace: string) {
  if (!NS_PATTERN.test(namespace)) throw new Error(`Invalid persistence namespace: ${namespace}`);
  return namespace;
}

function emptyEnvelope<T>(namespace: string): PersistenceEnvelope<T> {
  return { version: 1, namespace, updatedAt: new Date(0).toISOString(), records: {} };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class FilePersistentStore implements PersistentStore {
  readonly driver = "file" as const;
  readonly location: string;

  constructor(directory: string) {
    this.location = path.resolve(directory);
    mkdirSync(this.location, { recursive: true, mode: 0o700 });
    try { chmodSync(this.location, 0o700); } catch { /* Windows ignores POSIX mode */ }
  }

  private file(namespace: string) {
    return path.join(this.location, `${safeNamespace(namespace)}.json`);
  }

  private read<T>(namespace: string): PersistenceEnvelope<T> {
    const file = this.file(namespace);
    if (!existsSync(file)) return emptyEnvelope<T>(namespace);
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8")) as PersistenceEnvelope<T>;
      if (parsed.version !== 1 || parsed.namespace !== namespace || !parsed.records || typeof parsed.records !== "object" || Array.isArray(parsed.records)) {
        throw new Error("Invalid persistence envelope");
      }
      return parsed;
    } catch (error) {
      const corrupt = `${file}.corrupt-${Date.now()}`;
      try { renameSync(file, corrupt); } catch { /* keep original when rename is unavailable */ }
      throw new Error(`Persistence file is corrupted: ${file}`, { cause: error });
    }
  }

  private write<T>(namespace: string, records: PersistenceRecordMap<T>) {
    const file = this.file(namespace);
    const temporary = `${file}.tmp-${process.pid}-${crypto.randomUUID()}`;
    const envelope: PersistenceEnvelope<T> = {
      version: 1,
      namespace,
      updatedAt: new Date().toISOString(),
      records,
    };
    const payload = `${JSON.stringify(envelope, null, 2)}\n`;
    const descriptor = openSync(temporary, "wx", 0o600);
    try {
      writeFileSync(descriptor, payload, "utf8");
    } finally {
      closeSync(descriptor);
    }
    try { chmodSync(temporary, 0o600); } catch { /* Windows ignores POSIX mode */ }
    renameSync(temporary, file);
  }

  get<T>(namespace: string, key: string): T | null {
    const value = this.read<T>(namespace).records[key];
    return value === undefined ? null : clone(value);
  }

  set<T>(namespace: string, key: string, value: T): void {
    this.transact<T, void>(namespace, (records) => { records[key] = clone(value); });
  }

  delete(namespace: string, key: string): boolean {
    return this.transact<unknown, boolean>(namespace, (records) => {
      if (!(key in records)) return false;
      delete records[key];
      return true;
    });
  }

  entries<T>(namespace: string): Array<[string, T]> {
    return Object.entries(this.read<T>(namespace).records).map(([key, value]) => [key, clone(value)]);
  }

  clear(namespace: string): void {
    const file = this.file(namespace);
    if (existsSync(file)) rmSync(file, { force: true });
  }

  transact<T, R>(namespace: string, mutate: (records: PersistenceRecordMap<T>) => R): R {
    const envelope = this.read<T>(namespace);
    const records = clone(envelope.records);
    const result = mutate(records);
    this.write(namespace, records);
    return result;
  }

  namespaceCount() {
    if (!existsSync(this.location)) return 0;
    return readdirSync(this.location).filter((name) => name.endsWith(".json") && !name.includes(".corrupt-")).length;
  }

  writableProbe() {
    const probe = path.join(this.location, `.write-probe-${process.pid}-${Date.now()}`);
    try {
      writeFileSync(probe, "ok", { encoding: "utf8", mode: 0o600, flag: "wx" });
      return statSync(probe).isFile();
    } finally {
      rmSync(probe, { force: true });
    }
  }
}
