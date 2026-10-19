export type PersistenceDriver = "file" | "memory";

export type PersistenceRecordMap<T = unknown> = Record<string, T>;

export type PersistenceEnvelope<T = unknown> = {
  version: 1;
  namespace: string;
  updatedAt: string;
  records: PersistenceRecordMap<T>;
};

export interface PersistentStore {
  readonly driver: PersistenceDriver;
  readonly location: string;
  get<T>(namespace: string, key: string): T | null;
  set<T>(namespace: string, key: string, value: T): void;
  delete(namespace: string, key: string): boolean;
  entries<T>(namespace: string): Array<[string, T]>;
  clear(namespace: string): void;
  transact<T, R>(namespace: string, mutate: (records: PersistenceRecordMap<T>) => R): R;
}

export type PersistenceHealth = {
  driver: PersistenceDriver;
  location: string;
  writable: boolean;
  namespaces: number;
  warning?: string;
};
