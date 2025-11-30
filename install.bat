@echo off
REM Inventory Management System - Installation Launcher
REM This batch file checks for admin privileges and launches the PowerShell setup script

echo ========================================
echo  Inventory Management System Installer
echo ========================================
echo.

REM Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Administrator privileges required!
    echo.
    echo Please right-click this file and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

echo Starting automated installation...
echo.
echo This will install:
echo   - Chocolatey Package Manager
echo   - Python 3.11
echo   - Node.js 18
echo   - MySQL 8.0
echo   - Application dependencies
echo.
echo Installation will take 10-15 minutes depending on your internet speed.
echo.
pause

REM Run PowerShell setup script
PowerShell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

if %errorLevel% neq 0 (
    echo.
    echo ERROR: Installation failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo You can now start the application using: run.bat
echo.
pause
