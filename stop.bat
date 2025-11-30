@echo off
REM Inventory Management System - Stop Servers
REM Stops both backend and frontend servers gracefully

echo ========================================
echo  Stopping Inventory Management System
echo ========================================
echo.

REM Kill Node.js processes (Frontend)
echo Stopping Frontend Server...
taskkill /F /IM node.exe /T 2>nul
if %errorLevel% equ 0 (
    echo Frontend stopped.
) else (
    echo No Frontend server running.
)

REM Kill Python/Uvicorn processes (Backend)
echo Stopping Backend Server...
taskkill /F /IM python.exe /T 2>nul
if %errorLevel% equ 0 (
    echo Backend stopped.
) else (
    echo No Backend server running.
)

echo.
echo ========================================
echo  Servers Stopped
echo ========================================
echo.
pause
