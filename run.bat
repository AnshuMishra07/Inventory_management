@echo off
REM Inventory Management System - Application Launcher
REM Starts both backend and frontend servers

echo ========================================
echo  Inventory Management System
echo ========================================
echo.
echo Starting servers...
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Start Backend Server in new window
echo Starting Backend Server (Port 8000)...
start "Inventory Backend" cmd /k "cd /d %SCRIPT_DIR%backend && venv\Scripts\activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 5 /nobreak >nul

REM Start Frontend Server in new window
echo Starting Frontend Server (Port 5173)...
start "Inventory Frontend" cmd /k "cd /d %SCRIPT_DIR%frontend && npm run dev"

REM Wait for frontend to start
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo  Servers Started!
echo ========================================
echo.
echo Backend API:  http://localhost:8000
echo API Docs:     http://localhost:8000/docs
echo Frontend:     http://localhost:5173
echo.
echo Opening application in browser...
timeout /t 3 /nobreak >nul

REM Open browser to frontend
start http://localhost:5173

echo.
echo Application is running in separate windows.
echo Close those windows to stop the servers.
echo.
echo Default Login:
echo   Email: admin@test.com
echo   Password: admin123
echo.
pause
