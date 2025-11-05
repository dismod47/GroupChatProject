@echo off
REM Cleanup script for load test data (Windows version)
REM Removes all [TEST] tagged data

echo Cleaning up test data...

node scripts\loadtest-cleanup.js

if errorlevel 1 (
    echo Error during cleanup
    exit /b 1
)

echo Cleanup complete

