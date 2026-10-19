@echo off
cd /d "%~dp0"
call npm run data:verify
pause
