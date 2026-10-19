@echo off
cd /d "%~dp0"
set /p "CONFIRM=Введите YES для удаления всех локальных аккаунтов и данных: "
if /I not "%CONFIRM%"=="YES" exit /b 1
set CONFIRM_DATA_RESET=YES
call npm run data:reset
pause
