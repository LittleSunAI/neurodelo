# NEURODELO — глубокий аудит продукта и безопасности

Дата: 18 июля 2026 года
Проверяемая версия: `neuro-platform-final-design-audited.zip`, версия приложения 0.18.2

## Итоговый вердикт

- Для локальной демонстрации и обсуждения продукта: пригодно.
- Для публичного тестового стенда без реальных данных: допустимо только после отключения/защиты платных внешних API и явной маркировки демо.
- Для регистрации реальных пользователей и публикации в интернете: не готово.
- Для хранения персональных данных, реального Git-доступа, fal.ai-ключа, модераторских действий и начисления XP: требуется серверная реализация контроля доступа.

## Что уже хорошо

1. Зависимости: `npm audit --omit=dev` — 0 известных уязвимостей.
2. TypeScript, ESLint и production-сборка проходят.
3. Не обнаружены `dangerouslySetInnerHTML`, `eval` и `new Function`.
4. React экранирует отображаемый пользовательский текст.
5. Есть базовые заголовки: `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, COOP, Permissions-Policy.
6. Секреты fal.ai и GitHub запланированы как серверные переменные.
7. В базе предусмотрены хеши сессий и токенов, а не хранение исходных токенов.
8. Есть начальный набор RLS-политик и `search_path` для SECURITY DEFINER функций.
9. Публичные черновики проекта скрываются от пользователя, который не считается владельцем.
10. Загрузка аватара локально перекодируется canvas, что удаляет большую часть метаданных.

## Критические проблемы перед публикацией

### SEC-01. Авторизация существует только в браузере

Сессия находится в localStorage. Любой пользователь может изменить JSON и установить `authenticated: true`. Проверка показала, что даже сессия с `expiresAt` в 2000 году принимается как действующая.

Нужно:
- серверная сессия;
- cookie `HttpOnly`, `Secure`, `SameSite=Lax/Strict`;
- проверка срока, статуса пользователя и отзыва сессии на сервере;
- ротация сессии после входа и изменения прав;
- невозможность использовать localStorage как источник авторизации.

### SEC-02. Защита маршрута `/` выполняется только клиентским редиректом

Страница сначала загружается, затем React читает localStorage и перенаправляет на `/login`. Это не серверная защита.

Нужно:
- `proxy.ts` для раннего редиректа;
- обязательная проверка сессии в server layout/page;
- повторная проверка в каждом Route Handler / Server Action / DAL;
- нельзя считать Proxy единственной защитой.

### SEC-03. Административные права определяются интерфейсом

Админка показывается, если email равен демо-email или локально выбранная роль — `maintainer`. Роль переключается в UI.

Нужно:
- серверная роль `admin/moderator` из БД;
- запрет клиенту передавать итоговую роль;
- проверка function-level authorization в каждом административном endpoint;
- отдельные разрешения: review_report, suspend_user, reverse_xp, manage_flags;
- критичные действия — повторная аутентификация и аудит.

### SEC-04. fal.ai endpoint станет публичным платным ресурсом

`POST /api/v1/hero-images/generate` при наличии ключа не проверяет пользователя, лимит, квоту, CSRF/Origin или стоимость. Любой посетитель сможет расходовать баланс fal.ai.

Нужно:
- обязательная сессия;
- rate limit на IP и account;
- дневная/месячная квота;
- idempotency key;
- очередь;
- ограничение размера body;
- модерация prompt/output;
- аудит стоимости;
- allowlist модели;
- серверное сохранение результата в собственное хранилище.

### SEC-05. Нет серверной object-level authorization

API содержит ID проектов, задач, вкладов, бесед и модерационных дел. Для каждого объекта сервер обязан отдельно проверять владельца или членство. UI-проверки недостаточны.

Нужно:
- единый DAL/policy engine;
- `canReadProject`, `canEditProject`, `canReadConversation`, `canAcceptContribution`;
- тесты BOLA/IDOR: пользователь A не может читать/изменять объект пользователя B;
- разрешённые поля для PATCH/PUT, защита от mass assignment.

## Высокий приоритет

### SEC-06. Настройки приватности публичного профиля соблюдаются не полностью

Публичная страница использует `showThanks`, но не блокирует прямой просмотр при `profileVisibility=private`, не скрывает активность при `showActivity=false`, не учитывает `searchable`, а кнопки сообщения/приглашения не учитывают contact permissions.

Нужно применять приватность на сервере и возвращать DTO только с разрешёнными полями.

### SEC-07. Публичные страницы и действия используют локальные данные

`/u/*`, `/p/*`, `/contributions/*` загружают состояние текущего браузера. Они не являются настоящими публичными страницами. На странице проекта незалогиненный посетитель может локально нажать «Присоединиться»/«Следить», а на карточке вклада — отправить жалобу.

Нужно:
- публичные GET — серверные и кэшируемые только для опубликованных данных;
- любые мутации — 401 без сессии;
- серверный контроль published/accepted/public;
- отдельный публичный DTO.

### SEC-08. Нет CSP и HSTS

Есть полезные базовые заголовки, но отсутствуют `Content-Security-Policy` и `Strict-Transport-Security`.

Нужно:
- nonce-based CSP;
- `default-src 'self'`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`;
- точный `img-src` для собственного хранилища и data/blob при необходимости;
- CSP сначала в Report-Only;
- HSTS только после полного HTTPS, включая поддомены.

### SEC-09. Не выбрана окончательная модель сессий и CSRF

OpenAPI описывает Bearer JWT, но UI планировался также вокруг server sessions. Нужно выбрать один согласованный вариант.

Рекомендуется для веб-сайта:
- непрозрачный session ID в `__Host-` HttpOnly cookie;
- серверное хранение хеша session ID;
- SameSite=Lax/Strict;
- Origin/Referer validation и CSRF token для опасных действий, если архитектура требует;
- короткая обычная сессия и отдельный remember-device механизм.

### SEC-10. RLS покрывает только 16 из 73 таблиц и нет модели DB-ролей

Без RLS остались auth sessions, reset/verification tokens, user roles/skills, Git tokens, forum content, reports, moderation, sanctions, battle data и другие таблицы. Может быть допустимо для server-only таблиц, но в SQL нет GRANT/REVOKE, ролей migrator/runtime и FORCE RLS.

Нужно:
- миграционная роль — владелец схемы;
- runtime-роль без BYPASSRLS и без владения таблицами;
- REVOKE ALL FROM PUBLIC;
- разрешения по таблицам/операциям;
- FORCE ROW LEVEL SECURITY там, где требуется;
- отдельные server-only таблицы, недоступные обычному runtime;
- тест RLS под разными реальными DB-ролями.

### SEC-11. Идентификатор пользователя для RLS задаётся custom GUC

`current_setting('app.current_account_id')` безопасен только если значение выставляет доверенный backend в транзакции. Клиент не должен иметь прямого подключения к БД или возможности передавать произвольный GUC.

Нужно:
- `SET LOCAL` только после серверной проверки сессии;
- connection pooling с обязательным сбросом контекста;
- тест отсутствия утечки account_id между запросами;
- запрет прямого доступа пользователей к PostgreSQL.

### SEC-12. Внешние URL требуют строгой проверки

Сайт, Telegram, GitHub и URL проекта формируются из пользовательского текста. Сейчас часть ссылок автоматически дополняется `https://`, но нет единой серверной allowlist-проверки.

Нужно:
- только `https:`;
- запрет `javascript:`, `data:`, `file:`, localhost, private IP и похожих схем;
- нормализация punycode/IDN;
- предупреждение перед внешним переходом;
- безопасный redirect endpoint;
- модерация ссылок.

### SEC-13. Remote hero image URL принимается без проверки

fal.ai может вернуть произвольный URL, который браузер затем загрузит как фон. Это создаёт риск трекинга и неконтролируемого внешнего контента.

Нужно:
- принимать только `https` и разрешённые хосты;
- скачать изображение сервером;
- проверить magic bytes, размер, dimensions;
- перекодировать;
- сохранить в S3/MinIO;
- отдавать через собственный домен.

## Средний приоритет

### SEC-14. Нет реального rate limiting и anti-bot

В OpenAPI ни одна из 64 операций не описывает HTTP 429. Нет лимитов входа, регистрации, восстановления, постов, сообщений, жалоб, генераций и боёв.

### SEC-15. Нет idempotency для денежных/дорогих/необратимых операций

Нужен `Idempotency-Key` для генерации изображения, принятия вклада, reverse XP, merge, claim reward, модерационных решений и отправки внешних уведомлений.

### SEC-16. Восстановление и подтверждение аккаунта пока демонстрационные

Нужны одноразовые хешированные токены, TTL, consumed_at, привязка к account, отмена старых токенов и одинаковый ответ для существующей/несуществующей почты.

### SEC-17. Парольная защита неполная

Минимум 8 символов недостаточен как полная политика. Нужны Argon2id, поддержка длинных паролей, проверка утечек, отсутствие искусственных требований к символам, rate limiting, MFA/passkeys.

### SEC-18. Design Lab должен быть dev-only

`/design-lab` имеет noindex, но всё равно доступен в production. Нужно исключать маршрут из production или разрешать только администратору.

### SEC-19. Нет серверной проверки файлов

Проверка MIME/размера выполнена в браузере. Для реальных файлов нужны magic bytes, лимит dimensions/pixels, antivirus, quarantine, безопасные имена, object storage и signed URLs.

### SEC-20. Будущий Markdown/README требует sanitization

Сейчас HTML не вставляется напрямую — это хорошо. При добавлении Markdown нельзя включать raw HTML без строгой очистки.

### SEC-21. Логи и аудит ещё не production-grade

Нужны структурированные события, correlation ID, защита от изменения, redaction паролей/токенов, ограниченный доступ, retention и alerting.

### SEC-22. Feature flags не являются авторизацией

Они могут скрывать функцию, но endpoint всё равно обязан проверять право и статус флага на сервере.

## Маршруты

### Разрешённые публичные маршруты

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password` — только с валидным одноразовым токеном
- `/verify-email` — только с валидным токеном/кодом
- `/blocked`
- `/session-expired`
- `/u/{slug}` — только с учётом privacy DTO
- `/p/{slug}` — только published
- `/contributions/{id}` — только accepted/verified и разрешённые поля
- `/api/v1/health` — минимальный ответ без внутренней информации

### Обязательно защищённые маршруты

- `/` и все внутренние вкладки
- создание/редактирование проекта
- join/follow/claim/submit
- сообщения и форумные мутации
- профиль и настройки
- Git integration
- hero image generation
- game mutations
- notifications
- moderation/admin
- recognition/XP mutation

### Служебный маршрут

- `/design-lab` — только development или admin.

## Что ещё не хватает продукту

1. Настоящий backend и общее состояние для всех пользователей.
2. Настоящий полнотекстовый поиск проектов, людей, задач и форума.
3. Реальные уведомления: in-app, email, push.
4. Realtime chat/WebSocket, presence и гарантированная доставка.
5. Центр помощи, FAQ, правила сообщества и onboarding подсказки.
6. Управление организацией проекта: передача ownership, co-maintainers, fork, archive, succession.
7. Security-раздел проекта: SECURITY.md, disclosure, advisories, secret/dependency/license scanning.
8. Anti-abuse для XP: Sybil detection, взаимные накрутки, лимиты, второй reviewer.
9. Governance и апелляции для удаления вкладов/блокировок.
10. Полная интернационализация и серверный перевод.
11. Object storage для изображений и вложений.
12. Фоновые очереди и retries.
13. Наблюдаемость: metrics, traces, error tracking, alerts.
14. Backup/restore и disaster recovery.
15. Условия использования, privacy policy, лицензии, возрастные правила и процесс удаления данных.
16. Мобильный PWA/offline режим — необязательно, но логично позднее.

## Проверки, которых ещё не было

1. Полный E2E с реальной сессией и backend.
2. Матрица доступа: anonymous/user/maintainer/moderator/admin × каждый endpoint.
3. BOLA/IDOR: доступ к чужим объектам.
4. DAST через OWASP ZAP/Burp на тестовом стенде.
5. SAST через CodeQL/Semgrep.
6. Fuzzing API и property-based tests.
7. Live PostgreSQL migrations, rollback и RLS под несколькими DB-ролями.
8. Race/concurrency: два человека берут одну задачу, два merge, двойное XP.
9. Load testing для каталога, чата, форума и fal.ai queue.
10. File upload attacks: polyglot, decompression/image bomb, fake MIME, malware.
11. Webhook replay/signature tests для GitHub.
12. CSRF, session fixation, session theft/revocation.
13. CSP Report-Only и XSS regression tests.
14. Cross-browser: Firefox, Safari/WebKit, Android/iOS.
15. Backup restore drill.
16. Dependency SBOM, license audit, secret scanning и signed release.
17. Abuse/Spam tests и массовая регистрация.
18. Privacy tests: private profile, blocked user, hidden activity, deleted account.

## Рекомендуемая последовательность следующей работы

### Security Step A — локальные исправления без backend

1. Проверять expiresAt/status в fallback-сессии.
2. Закрыть `/design-lab` в production.
3. Полностью применять privacy на публичных страницах.
4. Запретить unauthenticated мутации в public fallback.
5. Ввести единый URL validator.
6. Валидировать remote image URL.
7. Добавить security test suite и route access matrix.
8. Расширить OpenAPI: 429, idempotency, scopes, CSRF/session model.
9. Расширить SQL: DB roles, GRANT/REVOKE, server-only tables, FORCE RLS.
10. Добавить CSP Report-Only дизайн.

### Security Step B — первая серверная основа

1. Auth library/Keycloak/Auth.js.
2. HttpOnly session cookie.
3. DAL и server authorization.
4. PostgreSQL и реальные RLS integration tests.
5. Rate limiter.
6. Audit log.
7. Object storage.
8. Email verification/password reset.

### Security Step C — внешние интеграции

1. GitHub App least privilege и webhook signature/replay protection.
2. fal.ai queue, quotas, moderation и cost controls.
3. Translation provider с privacy filters.
4. Background jobs, idempotency и retries.

## Оценка готовности

- Интерфейс и локальная демонстрация: 8/10.
- Архитектурная подготовка: 7/10.
- Безопасность локального прототипа: 6/10.
- Безопасность для публичного production: 2/10.
- Главная причина: реальные доверительные границы пока отсутствуют — браузер одновременно является пользователем, сервером и хранилищем.
