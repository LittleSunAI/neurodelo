import path from "node:path";
import { FilePersistentStore } from "./file-store";
import { MemoryPersistentStore } from "./memory-store";
import type { PersistentStore, PersistenceDriver, PersistenceHealth } from "./types";

const globalStore = globalThis as typeof globalThis & { __neurodeloPersistentStore?: PersistentStore };

function configuredDriver(): PersistenceDriver {
  return process.env.PERSISTENCE_DRIVER === "memory" ? "memory" : "file";
}

function dataDirectory() {
  return process.env.NEURODELO_DATA_DIR?.trim() || path.join(process.cwd(), ".data");
}

export function getPersistentStore(): PersistentStore {
  if (globalStore.__neurodeloPersistentStore) return globalStore.__neurodeloPersistentStore;
  globalStore.__neurodeloPersistentStore = configuredDriver() === "memory"
    ? new MemoryPersistentStore()
    : new FilePersistentStore(dataDirectory());
  return globalStore.__neurodeloPersistentStore;
}

export function resetPersistentStoreForTests() {
  delete globalStore.__neurodeloPersistentStore;
}

export function persistenceHealth(): PersistenceHealth {
  const store = getPersistentStore();
  const implementation = store as PersistentStore & { namespaceCount?: () => number; writableProbe?: () => boolean };
  const writable = implementation.writableProbe?.() ?? true;
  return {
    driver: store.driver,
    location: store.location,
    writable,
    namespaces: implementation.namespaceCount?.() ?? 0,
    warning: store.driver === "file"
      ? "Файловый драйвер предназначен для одного локального Node.js процесса. Для нескольких серверов используйте PostgreSQL/Redis."
      : "Memory-драйвер теряет данные после перезапуска.",
  };
}

export type { PersistentStore, PersistenceDriver, PersistenceHealth } from "./types";
