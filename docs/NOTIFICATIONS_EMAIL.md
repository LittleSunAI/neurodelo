# Уведомления и email

## Локальный центр уведомлений

В платформе есть отдельный раздел «Уведомления». Состояние сохраняется вместе с fallback-профилем. Можно:

- фильтровать события;
- отмечать одно или все прочитанными;
- удалять события;
- переходить к связанному разделу;
- разрешить браузерные уведомления.

Принятие вклада, merge Pull Request и благодарность создают настоящее локальное событие. При разрешении браузера событие может быть показано системным уведомлением.

## Email

Серверные маршруты:

- `POST /api/v1/notifications/email/test`;
- `POST /api/v1/notifications/email/digest`;
- `POST /api/v1/notifications/email/event`.

Если `RESEND_API_KEY` и `EMAIL_FROM` не заданы, используется безопасный preview и сеть не вызывается. При подключении Resend работают:

- timeout;
- idempotency;
- HTML-экранирование;
- отправка только на почту текущего аккаунта для тестового письма;
- rate limits;
- same-origin и session checks.

## Настройка

```env
RESEND_API_KEY=
EMAIL_FROM=NEURODELO <notifications@example.com>
EMAIL_REQUEST_TIMEOUT_MS=10000
```

Перед публичным запуском нужны подтверждённый домен отправителя, очередь повторных попыток, bounce/complaint webhooks и журнал доставки.
