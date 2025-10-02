# 🔧 Makefile for ESP32 Simulator
# Compile và chạy ESP32 simulator như C++ program

CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2
TARGET = esp32_simulator
SOURCE = esp32_simulator.cpp

# Platform specific settings
ifeq ($(OS),Windows_NT)
    LIBS = -lwininet -lws2_32
    TARGET_EXT = .exe
else
    LIBS = -lcurl -lpthread
    TARGET_EXT = 
endif

# Build rules
all: $(TARGET)$(TARGET_EXT)

$(TARGET)$(TARGET_EXT): $(SOURCE)
	@echo "🔨 Compiling ESP32 Simulator..."
	$(CXX) $(CXXFLAGS) -o $(TARGET)$(TARGET_EXT) $(SOURCE) $(LIBS)
	@echo "✅ Build complete!"

run: $(TARGET)$(TARGET_EXT)
	@echo "🚀 Starting ESP32 Simulator..."
	./$(TARGET)$(TARGET_EXT)

clean:
	@echo "🧹 Cleaning build files..."
	rm -f $(TARGET)$(TARGET_EXT)

install-deps:
	@echo "📦 Installing dependencies..."
ifeq ($(OS),Windows_NT)
	@echo "Windows: Using built-in WinINet"
else
	@echo "Linux/Mac: Install libcurl-dev"
	sudo apt-get update && sudo apt-get install libcurl4-openssl-dev
endif

help:
	@echo "🎯 ESP32 Simulator Build System"
	@echo "Available targets:"
	@echo "  all          - Build the simulator"
	@echo "  run          - Build and run simulator"
	@echo "  clean        - Remove build files"
	@echo "  install-deps - Install system dependencies"
	@echo "  help         - Show this help"

.PHONY: all run clean install-deps help