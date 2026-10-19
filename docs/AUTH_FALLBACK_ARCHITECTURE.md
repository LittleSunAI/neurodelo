# Архитектура аккаунта и fallback-сессии

## Назначение

Локальный прототип должен позволять проверить полный пользовательский путь без backend, но не создавать ложное ощущение настоящей безопасности.

## Слои

```text
Страницы аккаунта
        ↓
authGateway
        ↓
Fallback provider  или  /api/v1/auth
```

Интерфейс не обращается к `localStorage` напрямую. Все операции проходят через `services/auth-gateway.ts`.

## Что хранится локально

- искусственный идентификатор аккаунта;
- почта демо-пользователя;
- статус сессии;
- срок действия;
- флаг «Запомнить меня»;
- тестовые устройства;
- тестовая история входов.

## Что не хранится локально

- пароль;
- хеш пароля;
- токен восстановления;
- секрет двухфакторной авторизации;
- резервные коды;
- реальные cookie или refresh token.

## Подготовленные API-контракты

- `POST /api/v1/auth/register`;
- `POST /api/v1/auth/login`;
- `POST /api/v1/auth/logout`;
- `GET /api/v1/auth/session`;
- `POST /api/v1/auth/password/request`;
- `POST /api/v1/auth/password/reset`;
- `POST /api/v1/auth/password/change`;
- `POST /api/v1/auth/verify-email`;
- `DELETE /api/v1/auth/sessions/:id`;
- `DELETE /api/v1/auth/sessions/others`.

## Замена fallback

```env
NEXT_PUBLIC_USE_FALLBACKS=false
```

После переключения `authGateway` перестаёт использовать локальную имитацию и обращается к API. Компоненты страниц менять не требуется.

## Будущие требования backend

- Argon2id для паролей;
- короткоживущая серверная сессия;
- защищённые HttpOnly cookie;
- CSRF-защита;
- ротация refresh token;
- ограничение попыток входа;
- подтверждение почты одноразовым токеном;
- журнал безопасности;
- WebAuthn или TOTP для 2FA;
- отзыв сессий;
- уведомление о новых устройствах.
