@echo off
echo 🚗 Smart Parking ESP32 Simulator Launcher
echo ==========================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.7+ from https://python.org
    pause
    exit /b 1
)

REM Check if requests module is available
python -c "import requests" >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing required packages...
    pip install requests
    if %errorlevel% neq 0 (
        echo ❌ Failed to install requirements
        pause
        exit /b 1
    )
)

echo.
echo 🎯 Choose simulator mode:
echo 1. GUI Simulator (Recommended)
echo 2. Command Line Simulator  
echo 3. Exit
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🖥️ Starting GUI Simulator...
    python simulator_gui.py
) else if "%choice%"=="2" (
    echo.
    echo 💻 Starting Command Line Simulator...
    set /p slot_id="Enter Slot ID (default 1): "
    if "%slot_id%"=="" set slot_id=1
    
    set /p api_url="Enter API URL (default http://localhost:8888/api): "
    if "%api_url%"=="" set api_url=http://localhost:8888/api
    
    echo.
    echo 🚀 Starting simulator for Slot %slot_id%...
    python simulator.py %slot_id% "%api_url%"
) else if "%choice%"=="3" (
    echo 👋 Goodbye!
    exit /b 0
) else (
    echo ❌ Invalid choice
    pause
    goto start
)

echo.
echo 🛑 Simulator stopped
pause