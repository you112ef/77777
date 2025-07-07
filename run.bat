@echo off
echo 🧬 Starting Sperm Analyzer AI - Complete Application
echo ==================================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python 3 is required but not installed.
    echo Please install Python 3.8+ and try again.
    pause
    exit /b 1
)

REM Check if the startup script exists
if not exist "start_complete_app.py" (
    echo ❌ start_complete_app.py not found!
    echo Please make sure you're in the correct directory.
    pause
    exit /b 1
)

REM Run the application
echo 🚀 Launching application...
python start_complete_app.py

echo.
echo 👋 Thank you for using Sperm Analyzer AI!
pause