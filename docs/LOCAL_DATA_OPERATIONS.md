# Локальные данные: проверка, backup и сброс

## Проверка структуры файлов

```bash
npm run data:verify
```

## Резервная копия

```bash
npm run data:backup
```

Копия создаётся в `backups/neurodelo-data-<timestamp>`.

## Сброс

Linux/macOS:

```bash
CONFIRM_DATA_RESET=YES npm run data:reset
```

PowerShell:

```powershell
$env:CONFIRM_DATA_RESET="YES"
npm run data:reset
```

Перед сбросом рекомендуется сделать backup.

## Что нельзя публиковать

Не добавляйте в Git и не отправляйте другим людям:

- `.data/`;
- `backups/`;
- `.env`;
- приватные ключи и provider tokens.
