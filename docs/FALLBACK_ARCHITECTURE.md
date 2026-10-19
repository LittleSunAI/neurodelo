# Fallback-архитектура шага 5

## Два независимых переключателя

```env
NEXT_PUBLIC_USE_FALLBACKS=true
NEXT_PUBLIC_USE_GAME_FALLBACKS=true
```

`NEXT_PUBLIC_USE_FALLBACKS` управляет профилем, задачами, благодарностями и локальным сохранением.

`NEXT_PUBLIC_USE_GAME_FALLBACKS` управляет классами, характеристиками и тренировочными боями.

Так можно подключить настоящий игровой движок, не отключая локальный прототип остальных функций.

## Хранилище

Текущая схема: `neurodelo-platform-state-v3`.

Автоматически читаются и мигрируются:

- `neurodelo-platform-state-v2`;
- `neurodelo-platform-state-v1`.

После миграции состояние сохраняется в ключ v3.

## API после отключения

Основные данные:

- `/api/v1/profile/state`;
- `/api/v1/recognition/kudos`;
- `/api/v1/skills/assess`;
- `/api/v1/ai/hero`.

Игровой слой:

- `/api/v1/game/class`;
- `/api/v1/game/stats/allocate`;
- `/api/v1/game/battle/training`.

## Контрактные тесты

- `tests/fallback-contract.ts`;
- `tests/game-fallback-contract.ts`;
- `RUN_FALLBACK_TESTS_WINDOWS.bat`.
