@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==============================================
echo  NEURODELO - запуск кликабельного прототипа
echo ==============================================
where node >nul 2>nul
if errorlevel 1 (
  echo ОШИБКА: Node.js не найден.
  echo Установите Node.js LTS и повторите запуск.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Устанавливаю зависимости...
  call npm ci
  if errorlevel 1 (
    echo Не удалось установить зависимости.
    pause
    exit /b 1
  )
)
echo Запускаю локальный сервер...
start "NEURODELO Server" cmd /k "cd /d ""%~dp0"" && npm run dev"
echo Ожидаю готовность сайта...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$url='http://localhost:3000'; for($i=0;$i -lt 60;$i++){try{$r=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2;if($r.StatusCode -eq 200){exit 0}}catch{};Start-Sleep -Seconds 1};exit 1"
if errorlevel 1 (
  echo Сервер не ответил за 60 секунд. Проверьте окно NEURODELO Server.
  pause
  exit /b 1
)
start "" http://localhost:3000
echo Сайт открыт в браузере. Сервер работает в отдельном окне.
exit /b 0
