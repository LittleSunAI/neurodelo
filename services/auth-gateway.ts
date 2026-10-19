import { fallbackConfig, runtimeMode } from "../lib/fallback-config";
import type { AuthSession, LoginEvent, SecurityDevice } from "../types/platform";

export interface AuthSnapshot {
  session: AuthSession;
  devices: SecurityDevice[];
  history: LoginEvent[];
}

export interface LoginInput {
  email: string;
  password: string;
  remember: boolean;
}

export interface AuthResult {
  ok: boolean;
  session?: AuthSession;
  error?: "invalid_credentials" | "blocked" | "unverified" | "rate_limited";
}

const emptySession: AuthSession = {
  authenticated: false,
  status: "active",
  remembered: false,
};

const defaultDevices: SecurityDevice[] = [
  {
    id: "device-current",
    name: "Windows 11 — текущий компьютер",
    browser: "Chrome",
    location: "Москва, Россия",
    lastActiveAt: "сейчас",
    current: true,
  },
  {
    id: "device-phone",
    name: "Android-смартфон",
    browser: "ChatGPT WebView",
    location: "Москва, Россия",
    lastActiveAt: "2 дня назад",
    current: false,
  },
];

const defaultHistory: LoginEvent[] = [
  { id: "login-1", device: "Windows 11 · Chrome", location: "Москва, Россия", createdAt: "сегодня, 10:14", result: "success" },
  { id: "login-2", device: "Android · WebView", location: "Москва, Россия", createdAt: "15 июля, 22:08", result: "success" },
  { id: "login-3", device: "Неизвестное устройство", location: "Берлин, Германия", createdAt: "14 июля, 03:11", result: "failed" },
];

function wait(ms: number = fallbackConfig.artificialDelayMs) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readSnapshot(): AuthSnapshot {
  if (typeof window === "undefined") return { session: emptySession, devices: clone(defaultDevices), history: clone(defaultHistory) };
  const raw = window.localStorage.getItem(fallbackConfig.authStorageKey);
  if (!raw) return { session: emptySession, devices: clone(defaultDevices), history: clone(defaultHistory) };
  try {
    const parsed = JSON.parse(raw) as Partial<AuthSnapshot>;
    return {
      session: parsed.session?.authenticated && (!parsed.session.expiresAt || new Date(parsed.session.expiresAt).getTime() > Date.now()) ? parsed.session : emptySession,
      devices: Array.isArray(parsed.devices) ? parsed.devices : clone(defaultDevices),
      history: Array.isArray(parsed.history) ? parsed.history : clone(defaultHistory),
    };
  } catch {
    return { session: emptySession, devices: clone(defaultDevices), history: clone(defaultHistory) };
  }
}

function writeSnapshot(snapshot: AuthSnapshot) {
  if (typeof window !== "undefined") window.localStorage.setItem(fallbackConfig.authStorageKey, JSON.stringify(snapshot));
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/auth${path}`, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({ ok: false, error: `http_${response.status}` })) as T & { error?: string };
  if (!response.ok && !(payload && typeof payload === "object" && "ok" in payload)) throw new Error(payload.error || `Auth API недоступен: ${response.status}`);
  return payload;
}

function shouldUseServerAuth() {
  return (typeof window !== "undefined" && typeof window.document !== "undefined") || runtimeMode === "api";
}

function createSession(email: string, remember: boolean): AuthSession {
  const now = new Date();
  const expires = new Date(now.getTime() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000);
  return {
    authenticated: true,
    accountId: "demo-user-tbv",
    email,
    status: "active",
    remembered: remember,
    lastLoginAt: now.toISOString(),
    roles: ["contributor"],
    expiresAt: expires.toISOString(),
  };
}

export const authGateway = {
  mode: runtimeMode,
  demoCredentials: { email: "demo@neurodelo.local", password: "Demo123!" },

  async load(): Promise<AuthSnapshot> {
    if (shouldUseServerAuth()) return apiRequest<AuthSnapshot>("/session");
    await wait(120);
    return readSnapshot();
  },

  async login(input: LoginInput): Promise<AuthResult> {
    if (shouldUseServerAuth()) return apiRequest<AuthResult>("/login", { method: "POST", body: JSON.stringify(input) });
    await wait(430);
    const email = input.email.trim().toLowerCase();
    if (email === "blocked@neurodelo.local") return { ok: false, error: "blocked" };
    if (email === "unverified@neurodelo.local") return { ok: false, error: "unverified" };
    if (email !== "demo@neurodelo.local" || input.password !== "Demo123!") {
      const current = readSnapshot();
      const next: AuthSnapshot = {
        ...current,
        history: [{ id: `login-${Date.now()}`, device: "Windows 11 · Chrome", location: "Локальный fallback", createdAt: "только что", result: "failed" as const }, ...current.history].slice(0, 12),
      };
      writeSnapshot(next);
      return { ok: false, error: "invalid_credentials" };
    }
    const current = readSnapshot();
    const session = createSession(email, input.remember);
    writeSnapshot({
      session,
      devices: current.devices,
      history: [{ id: `login-${Date.now()}`, device: "Windows 11 · Chrome", location: "Локальный fallback", createdAt: "только что", result: "success" as const }, ...current.history].slice(0, 12),
    });
    return { ok: true, session };
  },


  async register(input: { name: string; email: string; password: string; remember: boolean }): Promise<AuthResult> {
    if (shouldUseServerAuth()) return apiRequest<AuthResult>("/register", { method: "POST", body: JSON.stringify(input) });
    await wait(480);
    if (input.name.trim().length < 2 || input.email.trim().length < 4 || input.password.length < 10) return { ok: false, error: "invalid_credentials" };
    const current = readSnapshot();
    const session = createSession(input.email.trim().toLowerCase(), input.remember);
    writeSnapshot({
      session,
      devices: current.devices,
      history: [{ id: `login-${Date.now()}`, device: "Windows 11 · Chrome", location: "Регистрация через fallback", createdAt: "только что", result: "success" as const }, ...current.history].slice(0, 12),
    });
    return { ok: true, session };
  },

  async logout(): Promise<void> {
    if (shouldUseServerAuth()) {
      await apiRequest<void>("/logout", { method: "POST" });
      return;
    }
    await wait(120);
    const current = readSnapshot();
    writeSnapshot({ ...current, session: emptySession });
  },

  async requestPasswordReset(email: string): Promise<{ ok: true; delivery: string }> {
    if (shouldUseServerAuth()) return apiRequest<{ ok: true; delivery: string; preview?: string }>("/password/request", { method: "POST", body: JSON.stringify({ email }) });
    await wait(520);
    return { ok: true, delivery: email.trim() || "указанная почта" };
  },

  async resetPassword(token: string, password: string): Promise<{ ok: boolean }> {
    if (shouldUseServerAuth()) return apiRequest<{ ok: boolean }>("/password/reset", { method: "POST", body: JSON.stringify({ token, password }) });
    await wait(460);
    return { ok: token.length > 2 && password.length >= 10 };
  },

  async changePassword(currentPassword: string, nextPassword: string): Promise<{ ok: boolean; error?: string }> {
    if (shouldUseServerAuth()) return apiRequest<{ ok: boolean; error?: string }>("/password/change", { method: "POST", body: JSON.stringify({ currentPassword, nextPassword }) });
    await wait(420);
    if (currentPassword !== "Demo123!") return { ok: false, error: "Текущий пароль не совпадает с демо-паролем." };
    if (nextPassword.length < 10) return { ok: false, error: "Новый пароль должен содержать не менее 10 символов, заглавную и строчную буквы и цифру." };
    return { ok: true };
  },

  async verifyEmail(code: string): Promise<{ ok: boolean }> {
    if (shouldUseServerAuth()) return apiRequest<{ ok: boolean }>("/verify-email", { method: "POST", body: JSON.stringify({ code }) });
    await wait(380);
    return { ok: code.trim().length >= 4 };
  },

  async revokeDevice(deviceId: string): Promise<SecurityDevice[]> {
    if (shouldUseServerAuth()) return apiRequest<SecurityDevice[]>(`/sessions/${deviceId}`, { method: "DELETE" });
    await wait(220);
    const current = readSnapshot();
    const devices = current.devices.filter((item) => item.id !== deviceId || item.current);
    writeSnapshot({ ...current, devices });
    return devices;
  },

  async revokeOtherDevices(): Promise<SecurityDevice[]> {
    if (shouldUseServerAuth()) return apiRequest<SecurityDevice[]>("/sessions/others", { method: "DELETE" });
    await wait(260);
    const current = readSnapshot();
    const devices = current.devices.filter((item) => item.current);
    writeSnapshot({ ...current, devices });
    return devices;
  },

  async reset(): Promise<void> {
    if (shouldUseServerAuth()) {
      await apiRequest<void>("/reset", { method: "POST" });
      return;
    }
    if (typeof window !== "undefined") window.localStorage.removeItem(fallbackConfig.authStorageKey);
  },
};
