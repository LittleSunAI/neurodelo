import { authGateway } from "../services/auth-gateway";
import { fallbackConfig } from "../lib/fallback-config";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

const storage = new MemoryStorage();
(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = { localStorage: storage };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  assert(authGateway.mode === "fallback", "Auth gateway должен работать в fallback-режиме");
  const empty = await authGateway.load();
  assert(!empty.session.authenticated, "Без входа сессия должна быть закрыта");

  const invalid = await authGateway.login({ email: "wrong@example.com", password: "wrong", remember: false });
  assert(!invalid.ok && invalid.error === "invalid_credentials", "Неверные данные должны отклоняться");

  const blocked = await authGateway.login({ email: "blocked@neurodelo.local", password: "Demo123!", remember: false });
  assert(!blocked.ok && blocked.error === "blocked", "Должен существовать fallback заблокированного аккаунта");

  const registered = await authGateway.register({ name: "New User", email: "new@neurodelo.local", password: "NewDemo123!", remember: false });
  assert(registered.ok && registered.session?.authenticated, "Регистрация должна создавать fallback-сессию");
  await authGateway.logout();

  const loggedIn = await authGateway.login({ email: authGateway.demoCredentials.email, password: authGateway.demoCredentials.password, remember: true });
  assert(loggedIn.ok && loggedIn.session?.authenticated, "Демо-вход должен создавать сессию");
  const restored = await authGateway.load();
  assert(restored.session.email === authGateway.demoCredentials.email, "Сессия должна восстанавливаться");

  const badChange = await authGateway.changePassword("wrong", "NewDemo123!");
  assert(!badChange.ok, "Неверный текущий пароль должен отклоняться");
  const changed = await authGateway.changePassword("Demo123!", "NewDemo123!");
  assert(changed.ok, "Смена пароля должна проходить в fallback");

  const reset = await authGateway.requestPasswordReset(authGateway.demoCredentials.email);
  assert(reset.ok, "Запрос восстановления должен проходить");
  const verified = await authGateway.verifyEmail("4821");
  assert(verified.ok, "Код подтверждения должен приниматься");

  const devices = await authGateway.revokeOtherDevices();
  assert(devices.length === 1 && devices[0].current, "Должна остаться только текущая сессия");

  await authGateway.logout();
  const loggedOut = await authGateway.load();
  assert(!loggedOut.session.authenticated, "Выход должен закрывать сессию");

  await authGateway.reset();
  assert(storage.getItem(fallbackConfig.authStorageKey) === null, "Сброс должен удалять auth storage");

  console.log(JSON.stringify({ mode: authGateway.mode, registration: "ok", login: "ok", restore: "ok", password: "ok", verification: "ok", devices: "ok", logout: "ok" }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
