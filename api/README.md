# API-контракты NeuroDelo Platform

`openapi.json` описывает HTTP API версии 1.0. Часть маршрутов уже работает в локальном серверном режиме, остальные остаются контрактами будущего backend.

## Формат

- OpenAPI 3.1.0.
- Базовый путь: `/api/v1`.
- Авторизация: bearer access token и серверная refresh-session cookie.
- Ошибки: единый `ApiError` с кодом, сообщением, деталями и request id.
- Списки: `items + PageMeta`.
- Идентификаторы: UUID, кроме slug и справочных игровых id.

## Модули

- Auth;
- Users;
- Projects;
- Contributions;
- Git;
- Community;
- Recognition;
- Hero images;
- Game;
- Moderation;
- Notifications;
- Files;
- Data portability;
- Jobs.

`endpoint-registry.json` — компактный список методов, путей и operationId. Он пригодится для генерации клиента, route handlers и тестовых заглушек.

Проверка:

```bash
npm run test:openapi
```

Типовые интерфейсы клиента находятся в `types/api.ts`.

Текущий контракт: **64 пути, 82 операции, 31 схема данных**.
