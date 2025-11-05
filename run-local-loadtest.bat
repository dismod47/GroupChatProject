@echo off
REM Load test script for GroupChatProject (Windows version)
REM Seeds test data and runs load test

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
echo Seeding test data...
node scripts\loadtest-seed.js
if errorlevel 1 (
    echo Error seeding test data
    exit /b 1
)
echo Test data seeded

echo.
echo Running load test...
node scripts\loadtest-run.js

echo.
echo Load test complete
echo.
echo Note: Test data has been kept. Run cleanup script to remove it.

endlocal

