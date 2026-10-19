@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo  NEURODELO - full local security verification
echo ============================================================

where node >nul 2>nul || goto :node_error
where npm >nul 2>nul || goto :node_error

if not exist node_modules (
  echo [1/7] Installing dependencies from package-lock.json...
  call npm ci || goto :error
) else (
  echo [1/7] Dependencies are already installed.
)

echo [2/7] Running lint and TypeScript...
call npm run lint || goto :error
call npm run typecheck || goto :error

echo [3/7] Running fallback, security and API contracts...
call npm run test:contracts || goto :error
call npm run test:api-contracts || goto :error

echo [4/7] Running design and accessibility checks...
call npm run test:a11y || goto :error
call npm run test:ui || goto :error
call npm run test:design || goto :error
call npm run test:layout || goto :error
call npm run test:density || goto :error
call npm run test:contrast || goto :error
call npm run test:forms || goto :error
call npm run test:visual-metrics || goto :error
call npm run test:final || goto :error

echo [5/7] Building the production version...
call npm run build || goto :error

echo [6/7] Running HTTP authentication and provider checks...
call npm run test:http || goto :error

echo [7/7] Auditing production dependencies...
call npm audit --omit=dev --audit-level=high || goto :error

echo.
echo FULL SECURITY VERIFICATION: PASSED
pause
exit /b 0

:node_error
echo.
echo Node.js and npm are required. Install Node.js 24 LTS and run this file again.
pause
exit /b 1

:error
echo.
echo FULL SECURITY VERIFICATION: FAILED
pause
exit /b 1
