import type { PersistentStore, PersistenceRecordMap } from "./types";

const globalMemory = globalThis as typeof globalThis & {
  __neurodeloPersistentMemory?: Map<string, PersistenceRecordMap>;
};

export class MemoryPersistentStore implements PersistentStore {
  readonly driver = "memory" as const;
  readonly location = "process-memory";
  private readonly namespaces = globalMemory.__neurodeloPersistentMemory ??= new Map();

  private records<T>(namespace: string): PersistenceRecordMap<T> {
    const existing = this.namespaces.get(namespace);
    if (existing) return existing as PersistenceRecordMap<T>;
    const created: PersistenceRecordMap<T> = {};
    this.namespaces.set(namespace, created);
    return created;
  }

  get<T>(namespace: string, key: string): T | null {
    const value = this.records<T>(namespace)[key];
    return value === undefined ? null : structuredClone(value);
  }

  set<T>(namespace: string, key: string, value: T): void {
    this.records<T>(namespace)[key] = structuredClone(value);
  }

  delete(namespace: string, key: string): boolean {
    const records = this.records(namespace);
    if (!(key in records)) return false;
    delete records[key];
    return true;
  }

  entries<T>(namespace: string): Array<[string, T]> {
    return Object.entries(this.records<T>(namespace)).map(([key, value]) => [key, structuredClone(value)]);
  }

  clear(namespace: string): void {
    this.namespaces.delete(namespace);
  }

  transact<T, R>(namespace: string, mutate: (records: PersistenceRecordMap<T>) => R): R {
    const records = structuredClone(this.records<T>(namespace));
    const result = mutate(records);
    this.namespaces.set(namespace, records);
    return result;
  }

  namespaceCount() { return this.namespaces.size; }
  writableProbe() { return true; }
}
