@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules call npm ci
if errorlevel 1 goto error
call npm run lint
if errorlevel 1 goto error
call npx tsc --noEmit
if errorlevel 1 goto error
call npm run build
if errorlevel 1 goto error
call npm audit
if errorlevel 1 goto error
echo.
echo Проверка завершена успешно.
pause
exit /b 0
:error
echo.
echo Обнаружена ошибка проверки.
pause
exit /b 1
