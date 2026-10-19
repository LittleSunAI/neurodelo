# Что ещё не хватает проекту

## До закрытого тестирования

1. Живая PostgreSQL и выполнение миграций.
2. Постоянное серверное хранилище аккаунтов, сессий, rate limits и fal-квот.
3. Объектное хранилище для изображений и вложений.
4. Настоящий GitHub App и webhook verification.
5. Очередь фоновых задач для email, fal.ai, переводов и Git-синхронизации.
6. Полная server-side privacy projection: сервер отдаёт только разрешённые поля.
7. Permission-check для каждого project/conversation/contribution ID.
8. Удаление и экспорт аккаунта на сервере.
9. Наблюдаемость: error tracking, audit logs, метрики и алерты.
10. Terms, Privacy Policy, правила сообщества и SECURITY.md.

## До публичного запуска

- passkeys/2FA и резервные коды;
- email verification перед значимыми действиями;
- Redis rate limiting и session revocation;
- антивирус и content validation файлов;
- CSP Enforcement после периода Report-Only;
- CodeQL/Semgrep, secret scanning, dependency review и SBOM;
- OWASP ZAP/Burp DAST;
- BOLA/IDOR-тесты всех объектных маршрутов;
- нагрузочное тестирование и backup restore drill;
- антифрод XP, взаимных благодарностей и фиктивных проектов;
- полноценная локализация русского и английского интерфейса.
