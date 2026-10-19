# План перехода с файлового хранилища на PostgreSQL

Интерфейс и API уже не должны знать, где физически лежат данные. Переход выполняется по слоям.

## Этап 1. Инфраструктура

1. Запустить PostgreSQL из `infrastructure/docker-compose.local.yml`.
2. Применить существующие SQL-миграции.
3. Создать отдельные роли `migrator`, `runtime`, `worker`, `analytics_readonly`.
4. Запретить доступ `PUBLIC` и включить RLS-тесты.

## Этап 2. Репозитории

Заменить файловые namespace на таблицы:

| File namespace | PostgreSQL область |
|---|---|
| `auth-users` | `accounts`, `account_credentials`, `account_roles` |
| `auth-sessions` | `auth_sessions` |
| `auth-reset-tokens` | `password_reset_tokens` |
| `platform-state` | нормализованные profile/project/community/game таблицы |
| `fal-usage` | `ai_usage_daily`, `idempotency_keys` |
| `rate-limits` | Redis |
| `email-deliveries` | `email_deliveries` |
| `security-audit` | `security_audit_events` |

## Этап 3. Двойная запись

На тестовом стенде временно включить:

1. запись в PostgreSQL;
2. резервную запись в файловый store;
3. сравнение чтений;
4. отчёт о несовпадениях;
5. переключение чтения на PostgreSQL после успешной проверки.

## Этап 4. Отключение файлового режима

Файловый драйвер остаётся только для локальных демо и тестов. Production требует `PERSISTENCE_DRIVER=postgres` и валидный `DATABASE_URL`.
