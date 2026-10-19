# Persistent Storage Foundation 0.21.0 — изменения

- Добавлен единый `PersistentStore`.
- Добавлены file и memory драйверы.
- Аккаунты и PBKDF2-хеши перенесены из process memory в `.data/`.
- Токены восстановления стали долговечными и одноразовыми.
- Сессии получили `sessionId`, хранение, отзыв и список устройств.
- Локальный HMAC-secret сохраняется на диске, если `AUTH_SECRET` не задан.
- Rate limits сохраняются между перезапусками.
- Quota и idempotency fal.ai сохраняются между перезапусками.
- Email delivery events и security audit сохраняются на диске.
- Полный `PlatformState` сохраняется через `/api/v1/local-state`.
- Browser localStorage оставлен только как резервный fallback.
- Добавлены backup/verify/reset скрипты.
- Добавлена Docker Compose-заготовка PostgreSQL, Redis и MinIO.
- OpenAPI расширен до 59 путей и 74 операций.
- Добавлены тесты повторного открытия store и полного перезапуска Node.js.
