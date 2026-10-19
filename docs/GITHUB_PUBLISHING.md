# Публикация NEURODELO на GitHub

Репозиторий: [LittleSunAI/neurodelo](https://github.com/LittleSunAI/neurodelo). Владелец — LittleSunAI, доступ — Public, основная ветка — main, лицензия — Apache-2.0.

## Исходники и лицензия

Проект подготовлен из neurodelo-github-audited.zip. Файлы вложенной папки NEURODELO размещены прямо в корне репозитория. Исходный ZIP хранится отдельно.

Владелец выбрал Apache License 2.0. Полный официальный текст находится в [LICENSE](../LICENSE), сведения об авторстве — в [NOTICE](../NOTICE), сведения о зависимостях — в [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). Собственная лицензия проекта не заменяет лицензии сторонних компонентов.

Датированные отчёты исходного архива сохранены как история. Актуальные результаты проверки находятся в [CHECK_REPORT.md](../CHECK_REPORT.md).

## Подготовка и проверки

Для проверки использованы Node.js 24 и npm 11:

```bash
npm ci
npm run build
npm run test:release
npm run test:http
npm run test:prebackend-runtime
npm run test:persistence:runtime
```

В PowerShell при запрете запуска npm.ps1 используйте npm.cmd вместо npm, без изменения политики выполнения сценариев.

Перед коммитом проверьте git status и git diff --cached --name-only. В репозиторий не должны попадать .env, .data/, backups/, ключи, токены, личные файлы, node_modules/ и .next/.

## Работа с репозиторием

Клонирование:

```bash
git clone https://github.com/LittleSunAI/neurodelo.git
cd neurodelo
```

Для отправки изменений нужна авторизация в аккаунте с правами записи. Имя и подтверждённый noreply-адрес автора настраиваются локально для этого репозитория. Предложения сторонних участников принимаются через fork и pull request; см. [CONTRIBUTING.md](../CONTRIBUTING.md).

При первичной публикации файлы LICENSE, README и .gitignore были подготовлены локально; дополнительные начальные файлы на GitHub не создавались. После отправки проверены открытый доступ, владелец, ветка main, распознавание Apache-2.0 и совпадение файлов с локальным коммитом.

## Границы публикации

Публикация кода не запускает сайт. Это локальный прототип: внешние службы, PostgreSQL и целевое шифрование требуют интеграции и проверки. Демонстрационные учётные записи предназначены только для локальных испытаний. Не используйте NEURODELO_TEST_DEMO_USERS=true на реальном сервере.
