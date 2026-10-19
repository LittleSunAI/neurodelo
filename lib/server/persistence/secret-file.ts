import { getPersistentStore } from "./index";

const SECRET_NAMESPACE = "runtime-secrets";

export function getOrCreatePersistentSecret(name: string, bytes = 48) {
  const store = getPersistentStore();
  const existing = store.get<string>(SECRET_NAMESPACE, name);
  if (existing && existing.length >= 32) return existing;
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  const created = Buffer.from(buffer).toString("base64url");
  store.set(SECRET_NAMESPACE, name, created);
  return created;
}
