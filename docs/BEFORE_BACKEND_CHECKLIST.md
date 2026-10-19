# Что завершено до полноценного backend

## Выполнено

- долговечное локальное файловое хранилище данных;
- абстракция `PersistentStore`;
- постоянные аккаунты, сессии, лимиты и PlatformState;
- backup, verify, reset и maintenance;
- Docker Compose-заготовка PostgreSQL, Redis и MinIO;
- PostgreSQL-схема и OpenAPI;
- server-side cookies, роли, fal.ai quotas и email;
- переносимый экспорт/импорт с checksum и dry-run;
- безопасная политика загрузки файлов;
- локальный карантин и review;
- защищённые вложения чата;
- threat-model тесты ролей, URL и вредоносных файлов;
- постоянная очередь фоновых задач с retry и deduplication;
- таблицы будущих provider webhook events;
- API-контракты Files, Data portability и Jobs;
- runtime-тест object-level доступа двух аккаунтов.

## Рациональная точка остановки

Оставшиеся локальные «заготовки» без запущенных сервисов не дадут заметной работоспособности. Следующий этап следует начинать только вместе с реальными PostgreSQL/Redis/MinIO.

## Нельзя честно закончить без инфраструктуры

- общую многопользовательскую базу;
- распределённые rate limits и locks;
- безопасный production object storage;
- гарантированную доставку чата;
- production backup/restore;
- реальные webhooks GitHub/Resend;
- живые RLS и конкурентные транзакционные тесты;
- нагрузочный тест нескольких серверов.
