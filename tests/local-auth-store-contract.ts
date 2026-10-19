export {};
process.env.PERSISTENCE_DRIVER = "memory";
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
async function main() {
  const { registerLocalUser, authenticateLocalUser, changeLocalPassword, createLocalPasswordReset, resetLocalPassword, validatePasswordPolicy } = await import("../lib/server/local-auth-store");
  const email = `person-${Date.now()}@example.com`;
  assert(!validatePasswordPolicy("weak"), "Слабый пароль должен отклоняться");
  assert(validatePasswordPolicy("StrongPass123"), "Сильный пароль должен приниматься");
  const registered = await registerLocalUser({ email, name: "Local Person", password: "StrongPass123" });
  assert(registered.ok && !registered.user.passwordHash.includes("StrongPass123"), "Пароль должен храниться только как хеш");
  assert(!(await registerLocalUser({ email, name: "Duplicate", password: "StrongPass123" })).ok, "Повторная почта должна отклоняться");
  assert((await authenticateLocalUser(email, "StrongPass123")).ok, "Зарегистрированный пользователь должен входить");
  assert(!(await authenticateLocalUser(email, "WrongPass123")).ok, "Неверный пароль должен отклоняться");
  assert(!(await changeLocalPassword(registered.user.accountId, "WrongPass123", "NextStrong456")).ok, "Неверный текущий пароль должен отклоняться");
  assert((await changeLocalPassword(registered.user.accountId, "StrongPass123", "NextStrong456")).ok, "Пароль должен реально меняться");
  assert((await authenticateLocalUser(email, "NextStrong456")).ok, "Новый пароль должен работать");
  const token = await createLocalPasswordReset(email);
  assert((await resetLocalPassword(token, "ResetStrong789")).ok, "Одноразовый reset token должен работать");
  assert(!(await resetLocalPassword(token, "OtherStrong789")).ok, "Reset token нельзя использовать дважды");
  assert((await authenticateLocalUser(email, "ResetStrong789")).ok, "Сброшенный пароль должен работать");
  console.log(JSON.stringify({ registration: "ok", pbkdf2: "ok", login: "ok", passwordChange: "ok", resetOnce: "ok" }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
