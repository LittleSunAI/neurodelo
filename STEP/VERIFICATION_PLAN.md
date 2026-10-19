# Проверка публикации

Все проверки относятся к BATCH-PUBLISH.

| CHECK | FIX | Процедура | Ожидаемый результат |
|---|---|---|---|
| CHECK-PUB-001 | FIX-PUB-001 | Проверить официальный LICENSE, метаданные пакетов, локальные ссылки документации и сведения о зависимостях | Apache-2.0, согласованные манифесты, существующие ссылки |
| CHECK-PUB-002 | FIX-PUB-002 | npm ci; npm audit --json | Воспроизводимая установка; состояние уязвимостей полностью отражено в отчёте |
| CHECK-PUB-003 | FIX-PUB-003 | npm run build из рабочей папки Windows | Успешная сборка и генерация маршрутов |
| CHECK-PUB-004 | FIX-PUB-004 | npm run test:release; npm run test:http; npm run test:prebackend-runtime; npm run test:persistence:runtime | Все существующие проверки проходят; runtime использует временные данные |
| CHECK-PUB-005 | FIX-PUB-005 | git diff --cached --check; просмотр путей и поиск форматов секретов в staged-содержимом; сравнение с архивом | Нет секретов, локальных данных, зависимостей, сборки или необъяснённых удалений |
| CHECK-PUB-006 | FIX-PUB-005 | Сверить origin, удалённый SHA main, публичный GitHub API и LICENSE | Владелец LittleSunAI, Public, Apache-2.0, SHA совпадает |
