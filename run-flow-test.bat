@echo off
REM Flow test script for GroupChatProject (Windows version)
REM Creates 50 test students, 6 groups, fills them, and sends 50 conversational messages per group

setlocal enabledelayedexpansion

set BASE_URL=http://localhost:3000
set TEST_PREFIX=[TEST]

echo Checking if server is running at %BASE_URL%...
curl -s --head %BASE_URL%/api/health >nul 2>&1
if errorlevel 1 (
    echo Error: Server not running at %BASE_URL%
    echo Please start the server with: npm run dev
    exit /b 1
)
echo Server is running

echo.
echo Running flow test...
node scripts\flow-test.js

echo.
echo Flow test complete
echo.
echo Note: Test data has been kept. Run cleanup script to remove it.

endlocal

