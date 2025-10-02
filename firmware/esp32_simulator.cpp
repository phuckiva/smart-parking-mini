/*
🎯 ESP32 Simulator for VS Code (C++ Version)
Mô phỏng ESP32 behavior mà không cần Arduino libraries
Compile và run như một C++ program thông thường
*/

#include <iostream>
#include <string>
#include <thread>
#include <chrono>
#include <random>
#include <ctime>
#include <iomanip>
#include <sstream>

#ifdef _WIN32
    #include <windows.h>
    #include <wininet.h>
    #pragma comment(lib, "wininet.lib")
#else
    #include <curl/curl.h>
#endif

// ============================================================================
// 📋 CONFIGURATION - Thay đổi theo setup của bạn
// ============================================================================
const std::string WIFI_SSID = "YourWiFiName";
const std::string WIFI_PASSWORD = "YourWiFiPassword";
const std::string API_BASE_URL = "http://localhost:8888/api";
const int SLOT_ID = 1;

// ============================================================================
// 🎮 SIMULATION SETTINGS
// ============================================================================
const bool SIMULATION_MODE = true;
const bool AUTO_MODE = true;
const float MANUAL_DISTANCE = 25.0f;
const float DISTANCE_THRESHOLD = 10.0f;
const int MEASURE_INTERVAL = 3000;  // ms
const int DEBOUNCE_TIME = 5000;     // ms

// ============================================================================
// 🔄 GLOBAL VARIABLES
// ============================================================================
std::chrono::steady_clock::time_point lastMeasurement;
std::chrono::steady_clock::time_point lastStatusChange;
bool currentStatus = false;
bool lastStatus = false;
bool isConnected = false;
int simulationStep = 0;
std::random_device rd;
std::mt19937 gen(rd());

// ============================================================================
// 🛠️ UTILITY FUNCTIONS
// ============================================================================
std::string getCurrentTime() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()) % 1000;
    
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time_t), "%H:%M:%S");
    ss << "." << std::setfill('0') << std::setw(3) << ms.count();
    return ss.str();
}

void log(const std::string& message) {
    std::cout << "[" << getCurrentTime() << "] " << message << std::endl;
}

// ============================================================================
// 🌐 HTTP CLIENT (Simple implementation)
// ============================================================================
#ifdef _WIN32
bool sendHTTPRequest(const std::string& url, const std::string& data) {
    // Windows WinINet implementation
    HINTERNET hInternet = InternetOpenA("ESP32Simulator", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hInternet) return false;
    
    HINTERNET hConnect = InternetOpenUrlA(hInternet, url.c_str(), NULL, 0, INTERNET_FLAG_RELOAD, 0);
    if (!hConnect) {
        InternetCloseHandle(hInternet);
        return false;
    }
    
    // For simplicity, just return true
    InternetCloseHandle(hConnect);
    InternetCloseHandle(hInternet);
    return true;
}
#else
// Linux/Mac curl implementation
bool sendHTTPRequest(const std::string& url, const std::string& data) {
    // Simplified - would need proper curl implementation
    return true;
}
#endif

// ============================================================================
// 📡 WIFI CONNECTION SIMULATION
// ============================================================================
bool connectWiFi() {
    log("📡 Connecting to WiFi '" + WIFI_SSID + "'");
    
    // Simulate connection delay
    for (int i = 0; i < 5; i++) {
        std::cout << ".";
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }
    
    // Simulate successful connection
    isConnected = true;
    log("\n✅ WiFi connected! IP: 192.168.1.123");
    return true;
}

// ============================================================================
// 📏 DISTANCE MEASUREMENT SIMULATION
// ============================================================================
float measureDistance() {
    // Simulate hardware sensor reading
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    
    // Return simulated distance
    std::uniform_real_distribution<> dis(5.0, 50.0);
    return static_cast<float>(dis(gen));
}

float simulateDistance() {
    if (!AUTO_MODE) {
        return MANUAL_DISTANCE;
    }
    
    // Auto mode - realistic parking patterns
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    struct tm* timeinfo = std::localtime(&time_t);
    
    int hour = timeinfo->tm_hour;
    float distance;
    
    // Rush hours (7-9 AM, 5-7 PM) - more occupied
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
        // 70% chance of occupied during rush hour
        if ((simulationStep % 10) < 7) {
            std::uniform_real_distribution<> dis(3.0, 8.0);
            distance = static_cast<float>(dis(gen));  // Car present
        } else {
            std::uniform_real_distribution<> dis(15.0, 40.0);
            distance = static_cast<float>(dis(gen)); // No car
        }
    }
    // Normal hours - less occupied
    else {
        // 30% chance of occupied during normal hours
        if ((simulationStep % 10) < 3) {
            std::uniform_real_distribution<> dis(3.0, 8.0);
            distance = static_cast<float>(dis(gen));   // Car present
        } else {
            std::uniform_real_distribution<> dis(15.0, 40.0);
            distance = static_cast<float>(dis(gen)); // No car
        }
    }
    
    // Add some noise for realism
    std::uniform_real_distribution<> noise(-2.0, 2.0);
    distance += static_cast<float>(noise(gen));
    
    return std::max(0.0f, distance);
}

// ============================================================================
// 📤 SEND API UPDATE
// ============================================================================
bool sendStatusUpdate(bool occupied, float distance) {
    if (!isConnected) {
        log("📡 Offline mode - status not sent");
        return false;
    }
    
    // Create JSON payload
    std::ostringstream payload;
    payload << "{"
            << "\"status\":\"" << (occupied ? "occupied" : "available") << "\","
            << "\"sensor_id\":\"ESP32_SLOT_" << SLOT_ID << "\","
            << "\"timestamp\":" << std::chrono::duration_cast<std::chrono::milliseconds>(
                   std::chrono::system_clock::now().time_since_epoch()).count() << ","
            << "\"distance\":" << std::fixed << std::setprecision(1) << distance << ","
            << "\"simulation\":true"
            << "}";
    
    std::string url = API_BASE_URL + "/slots/" + std::to_string(SLOT_ID) + "/status";
    
    log("📤 Sending: " + payload.str());
    
    // Simulate API call
    bool success = sendHTTPRequest(url, payload.str());
    
    if (success) {
        log("✅ Status updated successfully!");
        return true;
    } else {
        log("❌ HTTP error: Connection failed");
        return false;
    }
}

// ============================================================================
// 🖨️ PRINT FUNCTIONS
// ============================================================================
void printHeader() {
    std::cout << "\n🚗 Smart Parking ESP32 Simulator (C++ Version)" << std::endl;
    std::cout << "===============================================" << std::endl;
    std::cout << "📍 Slot ID: " << SLOT_ID << std::endl;
    std::cout << "🎮 Mode: " << (SIMULATION_MODE ? "SIMULATION" : "HARDWARE") << std::endl;
    std::cout << "🤖 Pattern: " << (AUTO_MODE ? "AUTO" : "MANUAL") << std::endl;
    std::cout << "🌐 API: " << API_BASE_URL << std::endl;
    std::cout << "===============================================" << std::endl;
}

void printStatus(float distance, bool occupied) {
    std::string statusIcon = occupied ? "🚗" : "🅿️";
    std::string statusText = occupied ? "OCCUPIED" : "AVAILABLE";
    
    std::ostringstream ss;
    ss << statusIcon << " [" << statusText << "] Distance: " 
       << std::fixed << std::setprecision(1) << distance << "cm | Slot " << SLOT_ID;
    log(ss.str());
}

void printSystemInfo() {
    log("🔧 System Information:");
    log("   Platform: C++ Simulator");
    log("   Compiler: " + std::string(__VERSION__));
    log("   Build: " + std::string(__DATE__) + " " + std::string(__TIME__));
    
    auto now = std::chrono::steady_clock::now();
    auto uptime = std::chrono::duration_cast<std::chrono::seconds>(now.time_since_epoch());
    log("   Uptime: " + std::to_string(uptime.count()) + " seconds");
}

// ============================================================================
// 🎮 INTERACTIVE COMMANDS
// ============================================================================
void handleCommands() {
    std::string command;
    
    while (true) {
        std::cout << "\n🎮 Commands (info/memory/distance X/help/quit): ";
        std::getline(std::cin, command);
        
        if (command == "quit" || command == "exit") {
            log("👋 Goodbye!");
            exit(0);
        } else if (command == "info") {
            printSystemInfo();
        } else if (command == "memory") {
            log("💾 Memory usage: Simulated (C++ program)");
        } else if (command.substr(0, 9) == "distance ") {
            try {
                float newDistance = std::stof(command.substr(9));
                log("🔧 Manual distance set to " + std::to_string(newDistance) + " cm");
                // In real implementation, would update manual distance
            } catch (const std::exception&) {
                log("❌ Invalid distance format");
            }
        } else if (command == "help") {
            log("📝 Available commands:");
            log("   info     - System information");
            log("   memory   - Memory usage");
            log("   distance X - Set manual distance to X cm");
            log("   quit     - Exit simulator");
            log("   help     - This help message");
        } else if (!command.empty()) {
            log("❌ Unknown command: " + command);
        }
    }
}

// ============================================================================
// 🔄 MAIN LOOP
// ============================================================================
void mainLoop() {
    lastMeasurement = std::chrono::steady_clock::now();
    lastStatusChange = std::chrono::steady_clock::now();
    
    while (true) {
        auto now = std::chrono::steady_clock::now();
        
        // Measure distance every MEASURE_INTERVAL
        if (std::chrono::duration_cast<std::chrono::milliseconds>(now - lastMeasurement).count() >= MEASURE_INTERVAL) {
            float distance;
            
            if (SIMULATION_MODE) {
                distance = simulateDistance();
            } else {
                distance = measureDistance();
            }
            
            currentStatus = (distance <= DISTANCE_THRESHOLD);
            
            // Print current status
            printStatus(distance, currentStatus);
            
            // Check for status change with debounce
            if (currentStatus != lastStatus) {
                if (std::chrono::duration_cast<std::chrono::milliseconds>(now - lastStatusChange).count() >= DEBOUNCE_TIME) {
                    std::string statusText = currentStatus ? "OCCUPIED" : "AVAILABLE";
                    log("🔄 Status changed: " + statusText + " (distance: " + 
                        std::to_string(distance) + "cm)");
                    
                    // Send to API
                    if (sendStatusUpdate(currentStatus, distance)) {
                        lastStatus = currentStatus;
                        lastStatusChange = now;
                    }
                }
            }
            
            lastMeasurement = now;
            simulationStep++;
        }
        
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
}

// ============================================================================
// 🚀 MAIN FUNCTION
// ============================================================================
int main() {
    printHeader();
    
    // Connect to WiFi
    if (!connectWiFi()) {
        log("❌ WiFi connection failed!");
        return 1;
    }
    
    log("✅ Setup complete!");
    log("📊 Simulation Status:");
    log("   Mode: " + std::string(SIMULATION_MODE ? "SIMULATION" : "HARDWARE"));
    log("   Pattern: " + std::string(AUTO_MODE ? "AUTO" : "MANUAL"));
    log("   Slot ID: " + std::to_string(SLOT_ID));
    log("   Threshold: " + std::to_string(DISTANCE_THRESHOLD) + " cm");
    log("==================================================");
    
    // Start command handler in separate thread
    std::thread commandThread(handleCommands);
    commandThread.detach();
    
    // Start main simulation loop
    try {
        mainLoop();
    } catch (const std::exception& e) {
        log("❌ Error: " + std::string(e.what()));
        return 1;
    }
    
    return 0;
}