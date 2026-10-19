# NEURODELO — Prebackend Final

Версия: **0.23.0**  
Статус: **финальный локальный prebackend-прототип перед PostgreSQL/Redis/MinIO**  
Дата выпуска: **18 июля 2026 года**

NEURODELO — прототип open-source платформы, где участники находят открытые проекты, выполняют задачи, подтверждают вклад, развивают профессиональные навыки и прокачивают игрового героя.

Проект работает локально на fallback-данных, но критические серверные данные больше не живут только в памяти. Аккаунты, сессии, восстановление пароля, rate limits, квоты fal.ai, email-события, журнал безопасности и полный PlatformState сохраняются в атомарных файлах внутри `.data/`. Этот слой скрыт за единым `PersistentStore`, поэтому позднее его можно заменить PostgreSQL/Redis без переделки интерфейса.

## Что входит в итоговую версию

- регистрация, вход, восстановление и реальная смена пароля в локальном серверном режиме;
- подписанные HttpOnly-сессии, проверка срока и серверные роли;
- постоянное файловое серверное хранилище аккаунтов без открытых паролей;
- постоянные сессии, rate limits, fal.ai quota, email log и security audit;
- серверное сохранение полного состояния пользователя через `/api/v1/local-state`;
- backup, проверка и безопасный сброс локальных данных;
- fal.ai: дневной лимит генераций, приблизительный бюджет, rate limit и idempotency;
- центр уведомлений, браузерные уведомления и защищённый Resend/preview email;

- личная и публичная страницы пользователя;
- настройки аккаунта, приватности, уведомлений и доступности;
- визуальный герой, изображения, классы, характеристики и игра;
- каталог open-source проектов;
- создание и редактирование проектов;
- roadmap, задачи, роли, новости, релизы и документация;
- Git fallback: repositories, issues, Pull Request, CI и merge;
- подтверждённые вклады, XP-журнал и благодарности;
- форум, личные, проектные и командные чаты;
- переводы сообщений в fallback-режиме;
- административная панель и модерация;
- адаптивный интерфейс и настройки доступности;
- PostgreSQL-схема из 78 таблиц;
- 7 миграций, RLS-политики и seed-данные;
- OpenAPI 3.1: 64 пути и 82 операции;
- безопасное локальное файловое хранилище с карантином и проверкой magic bytes;
- переносимый экспорт/импорт с контрольной суммой;
- долговечная локальная очередь фоновых задач с retry и deduplication;
- единый финальный аудит исходников и архива.

## Быстрый запуск на Windows

1. Распакуйте архив.
2. Запустите `START_WINDOWS.bat`.
3. Дождитесь установки зависимостей и открытия браузера.

Адрес:

```text
http://localhost:3000
```

Демо-вход:

```text
Почта: demo@neurodelo.local
Пароль: Demo123!
```

## Запуск через терминал

```bash
npm ci
npm run dev
```

Production-проверка:

```bash
npm run lint
npm run typecheck
npm run test:contracts
npm run test:security
npm run test:notifications
npm run test:a11y
npm run test:ui
npm run test:final
npm run test:storage
npm run build
npm run test:prebackend-runtime
npm run start
```

## Финальный локальный аудит

На Windows:

```text
RUN_FINAL_AUDIT_WINDOWS.bat
```

Через терминал:

```bash
npm run test:release
```

Финальный аудит проверяет:

- структуру проекта;
- отсутствие приватных `.env` и явных секретов;
- отсутствие внутренних адресов песочницы;
- package-lock и публичный npm-реестр;
- контрольные суммы миграций;
- базу, OpenAPI и RLS-контракты;
- доступность интерфейса;
- опасные паттерны в исходниках;
- наличие API-заглушек и health-маршрута;
- отсутствие сборочных папок в исходном архиве.

## Fallback-режимы

По умолчанию все локальные режимы включены:

```env
NEXT_PUBLIC_USE_FALLBACKS=true
NEXT_PUBLIC_USE_GAME_FALLBACKS=true
NEXT_PUBLIC_USE_HERO_IMAGE_FALLBACKS=true
NEXT_PUBLIC_USE_GIT_FALLBACKS=true
NEXT_PUBLIC_USE_COMMUNITY_FALLBACKS=true
NEXT_PUBLIC_USE_MODERATION_FALLBACKS=true
NEXT_PUBLIC_USE_DURABLE_LOCAL_STATE=true
```

При установке `false` интерфейс обращается к подготовленным маршрутам `/api/v1`. Пока backend не подключён, маршруты предсказуемо возвращают HTTP 503 с описанием требуемой конфигурации.

Проверка состояния локального прототипа:

```text
GET /api/v1/health
```

## Безопасность локального прототипа

Добавлены подписанные серверные сессии, минимальные permission-роли, same-origin/body/rate-limit проверки и HTTP-заголовки:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Cross-Origin-Opener-Policy: same-origin`;
- ограниченный `Permissions-Policy`;
- `Content-Security-Policy-Report-Only`;
- опциональный HSTS после готовности HTTPS;
- отключён `X-Powered-By`.

Ключи fal.ai, Resend, GitHub App, игровой системы и будущей базы хранятся только на сервере. В `.env.example` секреты оставлены пустыми. По умолчанию fal.ai ограничен пятью генерациями и приблизительно одним долларом в день на аккаунт.

## Постоянные локальные данные

По умолчанию:

```env
PERSISTENCE_DRIVER=file
NEURODELO_DATA_DIR=.data
NEXT_PUBLIC_USE_DURABLE_LOCAL_STATE=true
```

Проверка структуры:

```bash
npm run data:verify
```

Резервная копия:

```bash
npm run data:backup
```

На Windows доступны `VERIFY_DATA_WINDOWS.bat`, `BACKUP_DATA_WINDOWS.bat` и `RESET_DATA_WINDOWS.bat`. Каталоги `.data/` и `backups/` нельзя публиковать или добавлять в Git.

## Безопасные локальные файлы

Маршрут `/api/v1/files` принимает только PNG, JPEG, WebP, PDF и безопасный UTF-8 текст. Файл проходит проверку magic bytes, размера, разрешения изображения, безопасного имени и сохраняется в карантин. По умолчанию локальный сканер автоматически одобряет прошедшие проверки файлы; для ручной модерации установите `OBJECT_AUTO_APPROVE_SAFE=false`.

Вложения чата теперь действительно загружаются в защищённое локальное хранилище и скачиваются только владельцем через подписанную сессию.

## Переносимость и фоновые задачи

- `/api/v1/portable-data` — экспорт и импорт полного состояния с SHA-256 контрольной суммой и предварительной проверкой dry-run;
- настройки аккаунта содержат кнопки экспорта и импорта;
- локальная очередь хранит задания на диске, поддерживает retry, lock и deduplication;
- `npm run data:cleanup` удаляет просроченные сессии, токены, карантинные файлы и завершённые задания.

Полный prebackend-прогон:

```bash
npm run test:prebackend
```

## Главные документы

- `docs/PREBACKEND_FINAL_ANALYSIS.md` — почему локальный этап завершён и что требует реальных сервисов;
- `docs/PREBACKEND_FINAL_IMPLEMENTATION.md` — состав версии 0.23.0;
- `docs/SAFE_LOCAL_OBJECT_STORAGE.md` — карантин и политика файлов;
- `docs/PORTABLE_DATA_AND_JOB_QUEUE.md` — экспорт, импорт и очередь;
- `docs/PERSISTENT_STORAGE_FOUNDATION.md` — устройство постоянного локального хранилища;
- `docs/POSTGRES_MIGRATION_PLAN.md` — переход с файлового драйвера на PostgreSQL;
- `docs/LOCAL_DATA_OPERATIONS.md` — backup, verify и reset;
- `docs/BEFORE_BACKEND_CHECKLIST.md` — что ещё можно сделать до backend;
- `docs/FINAL_LOCAL_RELEASE.md` — состав итогового прототипа;
- `docs/STEP_18_FINAL_CHECK.json` — результаты финальной проверки;
- `docs/STEP_18_AUDIT_LOG.txt` — журнал автоматического аудита;
- `docs/KNOWN_LIMITATIONS.md` — текущие ограничения;
- `docs/NEXT_SERVER_PHASE.md` — дальнейший серверный этап;
- `docs/LOCAL_DEVELOPMENT_PLAN.md` — завершённый план шагов 1–18;
- `database/` — схема, миграции и seed;
- `api/openapi.json` — API-контракт;
- `RELEASE_MANIFEST.json` — состав итогового выпуска.

## Важные ограничения

Это не готовый публичный сервис. В локальном прототипе:

- нет настоящего backend;
- нет живой PostgreSQL;
- email работает через preview без ключа или через Resend после настройки;
- файловый драйвер рассчитан только на один локальный Node.js процесс;
- данные переживают перезапуск, но не поддерживают несколько серверов одновременно;
- нет подключения к GitHub App;
- нет реальных денежных переводов;
- нет подключённого fal.ai без серверного ключа;
- browser `localStorage` остаётся резервной копией, а основное состояние вошедшего пользователя сохраняется сервером в `.data/`.

Перед публичным запуском требуется PostgreSQL/Redis/object storage и полноценный серверный этап. См. `docs/SECURITY_FOUNDATION.md`, `docs/FAL_AI_LIMITS.md`, `docs/NOTIFICATIONS_EMAIL.md` и `docs/REMAINING_PRODUCT_GAPS.md`.


## Документация

- `docs/FINAL_FUNCTIONAL_RECHECK.md` — повторная проверка работоспособности и исправления.
- `docs/CLEAN_ARCHIVE_VERIFICATION.md` — проверка установки и сборки непосредственно из итогового архива.

## Расширенная проверка дизайна

В проект добавлена внутренняя страница:

```text
/design-lab
```

Она предназначена для стресс-проверки карточек, форм, окон, вкладок, длинных текстов и широких таблиц. В основную навигацию страница не добавлена.

Запуск полного дизайн-QA на Windows:

```text
RUN_EXTENDED_QA_WINDOWS.bat
```

Отдельные команды:

```bash
npm run test:design
npm run test:layout
npm run test:density
npm run test:contrast
npm run test:forms
npm run test:visual-metrics
npm run test:http
```

Фактические Chromium-снимки на ширинах 320, 390, 768 и 1440 px находятся в `docs/design-qa-snapshots/`. Полный отчёт: `docs/EXTENDED_DESIGN_QA.md`.


## Заготовка инфраструктуры

`infrastructure/docker-compose.local.yml` содержит PostgreSQL 18, Redis и MinIO. Файл подготовлен заранее, но запускать его необязательно до начала серверной стадии.
