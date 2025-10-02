@echo off
echo 🔨 ESP32 Simulator - Windows Builder
echo =====================================

REM Check if g++ compiler is available
g++ --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ g++ compiler not found!
    echo 💡 Please install MinGW-w64 or Visual Studio Build Tools
    echo 🔗 Download: https://www.mingw-w64.org/downloads/
    pause
    exit /b 1
)

echo ✅ Compiler found, building simulator...

REM Compile the simulator
g++ -std=c++17 -Wall -Wextra -O2 -o esp32_simulator.exe esp32_simulator.cpp -lwininet -lws2_32

if %errorlevel% neq 0 (
    echo ❌ Build failed!
    echo 🔧 Check the source code for errors
    pause
    exit /b 1
)

echo ✅ Build successful!
echo 🚀 Starting simulator...
echo.

REM Run the simulator
esp32_simulator.exe

echo.
echo 🛑 Simulator stopped
pause