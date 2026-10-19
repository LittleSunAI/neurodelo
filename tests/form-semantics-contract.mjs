import fs from "node:fs";

const source = fs.readFileSync("components/auth/auth-page.tsx", "utf8");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(source.includes('type="email"') && source.includes('autoComplete="email"'), "Почтовые поля не используют email/autocomplete");
check(source.includes('autoComplete="name"'), "Поле имени не поддерживает автозаполнение");
check(source.includes('autoComplete="current-password"'), "Вход не помечает текущий пароль");
check((source.match(/autoComplete="new-password"/g) || []).length >= 2, "Регистрация/сброс не помечают новый пароль");
check(source.includes('autoComplete="one-time-code"') && source.includes('inputMode="numeric"'), "Код подтверждения не оптимизирован для телефона");
check(source.includes('aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}'), "Переключатель пароля не имеет доступного имени");
check(!/<button className="(?:primary-button auth-submit|ghost-button auth-demo)"/.test(source), "Кнопка формы не имеет явного type=button");

if (failures.length) {
  console.error("FORM SEMANTICS CONTRACT: FAILED\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("FORM SEMANTICS CONTRACT: OK");
console.log("- Email, name and password autocomplete: ok");
console.log("- Mobile verification code input: ok");
console.log("- Password visibility control: ok");
console.log("- Explicit button types: ok");
