import { getPersistentStore } from "./persistence";

const encoder = new TextEncoder();
const USERS_NS = "auth-users";
const RESET_NS = "auth-reset-tokens";
const META_NS = "auth-meta";

type LocalUser = {
  accountId: string;
  email: string;
  name: string;
  roles: string[];
  status: "active" | "unverified" | "blocked";
  salt: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

type ResetToken = {
  accountId: string;
  tokenHash: string;
  expiresAt: number;
  used: boolean;
  createdAt: string;
};

function bytesToBase64(bytes: Uint8Array) { return Buffer.from(bytes).toString("base64url"); }
function base64ToBytes(value: string) { return new Uint8Array(Buffer.from(value, "base64url")); }
function randomBytes(size = 16) { const bytes = new Uint8Array(size); crypto.getRandomValues(bytes); return bytes; }
async function derivePassword(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const safeSalt = new Uint8Array(salt.byteLength); safeSalt.set(salt);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: safeSalt, iterations: 210_000 }, key, 256);
  return new Uint8Array(bits);
}
async function sha256(value: string) { return bytesToBase64(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)))); }
function equalBytes(a: Uint8Array, b: Uint8Array) { if (a.byteLength !== b.byteLength) return false; let mismatch = 0; for (let index = 0; index < a.byteLength; index += 1) mismatch |= a[index] ^ b[index]; return mismatch === 0; }
async function makeCredentials(password: string) { const salt = randomBytes(); return { salt: bytesToBase64(salt), passwordHash: bytesToBase64(await derivePassword(password, salt)) }; }

async function seedDemo() {
  // Known demo passwords are strictly for local development and isolated smoke tests.
  // Never create privileged example users in an ordinary production deployment.
  if (process.env.NODE_ENV === "production" && process.env.NEURODELO_TEST_DEMO_USERS !== "true") return;
  const store = getPersistentStore();
  if (store.get<boolean>(META_NS, "demo-seeded")) return;
  const now = new Date().toISOString();
  const demos = [
    { email: "demo@neurodelo.local", password: "Demo123!", accountId: "demo-user-tbv", name: "Тимур", roles: ["contributor", "maintainer", "moderator", "admin"], status: "active" as const },
    { email: "blocked@neurodelo.local", password: "Blocked123!", accountId: "blocked-demo", name: "Blocked", roles: ["contributor"], status: "blocked" as const },
    { email: "unverified@neurodelo.local", password: "Unverified123!", accountId: "unverified-demo", name: "Unverified", roles: ["contributor"], status: "unverified" as const },
  ];
  for (const demo of demos) {
    if (store.get<LocalUser>(USERS_NS, demo.email)) continue;
    const { password, ...profile } = demo;
    const credentials = await makeCredentials(password);
    store.set<LocalUser>(USERS_NS, demo.email, { ...profile, ...credentials, createdAt: now, updatedAt: now });
  }
  store.set(META_NS, "demo-seeded", true);
}

export function validatePasswordPolicy(password: string) {
  if (password.length < 10 || password.length > 128) return false;
  if (!/[a-zа-я]/.test(password) || !/[A-ZА-Я]/.test(password) || !/[0-9]/.test(password)) return false;
  return !["password123", "qwerty12345", "1234567890", "пароль12345"].includes(password.toLowerCase());
}

export async function registerLocalUser(input: { email: string; name: string; password: string }) {
  await seedDemo();
  const store = getPersistentStore();
  const email = input.email.trim().toLowerCase();
  if (store.get<LocalUser>(USERS_NS, email)) return { ok: false as const, error: "email_exists" };
  if (!validatePasswordPolicy(input.password)) return { ok: false as const, error: "weak_password" };
  const now = new Date().toISOString();
  const user: LocalUser = {
    accountId: `local-${crypto.randomUUID()}`,
    email,
    name: input.name.trim(),
    roles: ["contributor"],
    status: "active",
    ...(await makeCredentials(input.password)),
    createdAt: now,
    updatedAt: now,
  };
  const created = store.transact<LocalUser, boolean>(USERS_NS, (records) => {
    if (records[email]) return false;
    records[email] = user;
    return true;
  });
  return created ? { ok: true as const, user } : { ok: false as const, error: "email_exists" };
}

export async function authenticateLocalUser(emailInput: string, password: string) {
  await seedDemo();
  const user = getPersistentStore().get<LocalUser>(USERS_NS, emailInput.trim().toLowerCase());
  if (!user) {
    await derivePassword(password || "invalid", randomBytes());
    return { ok: false as const, error: "invalid_credentials" };
  }
  const supplied = await derivePassword(password, base64ToBytes(user.salt));
  if (!equalBytes(base64ToBytes(user.passwordHash), supplied)) return { ok: false as const, error: "invalid_credentials" };
  if (user.status === "blocked") return { ok: false as const, error: "blocked" };
  if (user.status === "unverified") return { ok: false as const, error: "unverified" };
  return { ok: true as const, user };
}

function findUser(accountId: string) {
  return getPersistentStore().entries<LocalUser>(USERS_NS).map(([, user]) => user).find((user) => user.accountId === accountId) ?? null;
}

export async function changeLocalPassword(accountId: string, currentPassword: string, nextPassword: string) {
  await seedDemo();
  const user = findUser(accountId);
  if (!user) return { ok: false as const, error: "not_found" };
  if (!equalBytes(base64ToBytes(user.passwordHash), await derivePassword(currentPassword, base64ToBytes(user.salt)))) return { ok: false as const, error: "invalid_current" };
  if (!validatePasswordPolicy(nextPassword)) return { ok: false as const, error: "weak_password" };
  const updated: LocalUser = { ...user, ...(await makeCredentials(nextPassword)), updatedAt: new Date().toISOString() };
  getPersistentStore().set(USERS_NS, user.email, updated);
  return { ok: true as const };
}

export async function createLocalPasswordReset(emailInput: string) {
  await seedDemo();
  const token = crypto.randomUUID() + crypto.randomUUID();
  const user = getPersistentStore().get<LocalUser>(USERS_NS, emailInput.trim().toLowerCase());
  if (user) {
    const tokenHash = await sha256(token);
    const record: ResetToken = { accountId: user.accountId, tokenHash, expiresAt: Date.now() + 15 * 60 * 1000, used: false, createdAt: new Date().toISOString() };
    getPersistentStore().set(RESET_NS, tokenHash, record);
  }
  return token;
}

export async function resetLocalPassword(token: string, password: string) {
  await seedDemo();
  if (!validatePasswordPolicy(password)) return { ok: false as const, error: "weak_password" };
  const tokenHash = await sha256(token);
  const record = getPersistentStore().get<ResetToken>(RESET_NS, tokenHash);
  if (!record || record.used || record.expiresAt <= Date.now()) return { ok: false as const, error: "invalid_token" };
  const user = findUser(record.accountId);
  if (!user) return { ok: false as const, error: "invalid_token" };
  getPersistentStore().set(USERS_NS, user.email, { ...user, ...(await makeCredentials(password)), updatedAt: new Date().toISOString() });
  getPersistentStore().set(RESET_NS, tokenHash, { ...record, used: true });
  return { ok: true as const };
}

export function cleanupLocalAuthTokens() {
  const now = Date.now();
  return getPersistentStore().transact<ResetToken, number>(RESET_NS, (records) => {
    let deleted = 0;
    for (const [key, token] of Object.entries(records)) {
      if (token.expiresAt <= now || (token.used && token.createdAt < new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString())) { delete records[key]; deleted += 1; }
    }
    return deleted;
  });
}

export function localAuthPersistenceStatus() {
  return {
    users: getPersistentStore().entries<LocalUser>(USERS_NS).length,
    pendingResetTokens: getPersistentStore().entries<ResetToken>(RESET_NS).filter(([, item]) => !item.used && item.expiresAt > Date.now()).length,
  };
}
