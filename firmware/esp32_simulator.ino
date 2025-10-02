/*
🎯 ESP32 Firmware Simulator for Arduino IDE
Mô phỏng hoạt động ESP32 + HC-SR04 trong Arduino IDE Serial Monitor
Không cần phần cứng thật - chỉ cần upload và chạy

⚠️ QUAN TRỌNG: File này CHỈ cho Arduino IDE!
- VS Code sẽ báo lỗi #include vì không có Arduino libraries
- Nếu dùng VS Code, sử dụng esp32_simulator.cpp thay vào
- Nếu muốn chạy trong VS Code: python simulator.py hoặc simulator_web.html

🔧 SETUP ARDUINO IDE:
1. File → Preferences → Additional Board URLs:
   https://dl.espressif.com/dl/package_esp32_index.json
2. Tools → Board → ESP32 Arduino → ESP32 Dev Module
3. Library Manager → Install "ArduinoJson"
4. Upload code này lên ESP32 (hoặc chỉ Verify để test)
*/

#include <WiFi.h>        // ESP32 WiFi library
#include <HTTPClient.h>  // ESP32 HTTP client
#include <ArduinoJson.h> // JSON parsing library
#include <time.h>        // Time functions

// ============================================================================
// 📋 CONFIGURATION - Thay đổi theo setup của bạn
// ============================================================================
#define WIFI_SSID "YourWiFiName"          // Tên WiFi
#define WIFI_PASSWORD "YourWiFiPassword"  // Password WiFi
#define API_BASE_URL "http://192.168.1.100:8888/api"  // URL Backend API
#define SLOT_ID 1                         // ID chỗ đỗ (thay đổi cho từng ESP32)

// ============================================================================
// 🎮 SIMULATION SETTINGS
// ============================================================================
#define SIMULATION_MODE 1                 // 0=Hardware, 1=Simulation
#define AUTO_MODE 1                       // 1=Auto pattern, 0=Manual control
#define MANUAL_DISTANCE 25.0              // Distance for manual mode (cm)
#define DISTANCE_THRESHOLD 10.0           // Threshold for occupied (cm)
#define MEASURE_INTERVAL 3000             // Measurement interval (ms)
#define DEBOUNCE_TIME 5000                // Debounce time (ms)

// Hardware pins (not used in simulation)
#define TRIG_PIN 4
#define ECHO_PIN 2
#define LED_PIN 5

// ============================================================================
// 🔄 GLOBAL VARIABLES
// ============================================================================
unsigned long lastMeasurement = 0;
unsigned long lastStatusChange = 0;
bool currentStatus = false;              // false = available, true = occupied
bool lastStatus = false;
bool isConnected = false;
int simulationStep = 0;                  // For auto pattern simulation

// ============================================================================
// 🚀 SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  printHeader();
  
  // Initialize pins (even in simulation for completeness)
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // Connect to WiFi
  connectWiFi();
  
  // Setup time for realistic patterns
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  
  Serial.println("✅ Setup complete!");
  Serial.println("📊 Simulation Status:");
  Serial.printf("   Mode: %s\n", SIMULATION_MODE ? "SIMULATION" : "HARDWARE");
  Serial.printf("   Pattern: %s\n", AUTO_MODE ? "AUTO" : "MANUAL");
  Serial.printf("   Slot ID: %d\n", SLOT_ID);
  Serial.printf("   Threshold: %.1f cm\n", DISTANCE_THRESHOLD);
  Serial.println("=" * 50);
}

// ============================================================================
// 🔄 MAIN LOOP
// ============================================================================
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected. Reconnecting...");
    connectWiFi();
    return;
  }
  
  // Measure distance every MEASURE_INTERVAL
  if (millis() - lastMeasurement >= MEASURE_INTERVAL) {
    float distance;
    
    if (SIMULATION_MODE) {
      distance = simulateDistance();
    } else {
      distance = measureDistance();
    }
    
    currentStatus = (distance <= DISTANCE_THRESHOLD);
    
    // Update LED
    digitalWrite(LED_PIN, currentStatus ? HIGH : LOW);
    
    // Print current status
    printStatus(distance, currentStatus);
    
    // Check for status change with debounce
    if (currentStatus != lastStatus) {
      if (millis() - lastStatusChange >= DEBOUNCE_TIME) {
        Serial.printf("🔄 Status changed: %s (distance: %.1fcm)\n", 
                     currentStatus ? "OCCUPIED" : "AVAILABLE", distance);
        
        // Send to API
        if (sendStatusUpdate(currentStatus, distance)) {
          lastStatus = currentStatus;
          lastStatusChange = millis();
        }
      }
    }
    
    lastMeasurement = millis();
    simulationStep++;
  }
  
  delay(100);
}

// ============================================================================
// 📡 WIFI CONNECTION
// ============================================================================
void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("📡 Connecting to WiFi '%s'", WIFI_SSID);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.printf("✅ WiFi connected! IP: %s\n", WiFi.localIP().toString().c_str());
    isConnected = true;
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    isConnected = false;
  }
}

// ============================================================================
// 📏 DISTANCE MEASUREMENT (Hardware)
// ============================================================================
float measureDistance() {
  // Send trigger pulse
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo pulse
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  
  if (duration == 0) {
    return 999; // No echo received
  }
  
  // Calculate distance (speed of sound = 343 m/s)
  float distance = (duration * 0.034) / 2;
  
  return distance;
}

// ============================================================================
// 🎮 DISTANCE SIMULATION
// ============================================================================
float simulateDistance() {
  if (!AUTO_MODE) {
    return MANUAL_DISTANCE;
  }
  
  // Auto mode - realistic parking patterns
  time_t now;
  struct tm timeinfo;
  time(&now);
  localtime_r(&now, &timeinfo);
  
  int hour = timeinfo.tm_hour;
  int minute = timeinfo.tm_min;
  
  // Create realistic patterns
  float distance;
  
  // Rush hours (7-9 AM, 5-7 PM) - more occupied
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    // 70% chance of occupied during rush hour
    if ((simulationStep % 10) < 7) {
      distance = random(30, 80) / 10.0;  // 3-8 cm (car present)
    } else {
      distance = random(150, 400) / 10.0; // 15-40 cm (no car)
    }
  }
  // Normal hours - less occupied
  else {
    // 30% chance of occupied during normal hours
    if ((simulationStep % 10) < 3) {
      distance = random(30, 80) / 10.0;   // 3-8 cm (car present)
    } else {
      distance = random(150, 400) / 10.0; // 15-40 cm (no car)
    }
  }
  
  // Add some noise for realism
  distance += random(-20, 20) / 10.0;
  
  return max(0.0, distance);
}

// ============================================================================
// 📤 SEND API UPDATE
// ============================================================================
bool sendStatusUpdate(bool occupied, float distance) {
  if (!isConnected) {
    Serial.println("📡 Offline mode - status not sent");
    return false;
  }
  
  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/slots/" + String(SLOT_ID) + "/status");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", "smart-parking-2025");
  
  // Create JSON payload
  DynamicJsonDocument doc(300);
  doc["status"] = occupied ? "occupied" : "available";
  doc["sensor_id"] = "ESP32_SLOT_" + String(SLOT_ID);
  doc["timestamp"] = millis();
  doc["distance"] = distance;
  doc["simulation"] = SIMULATION_MODE ? true : false;
  
  String payload;
  serializeJson(doc, payload);
  
  Serial.printf("📤 Sending: %s\n", payload.c_str());
  
  int httpCode = http.PUT(payload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("📥 Response [%d]: %s\n", httpCode, response.c_str());
    
    if (httpCode == 200) {
      Serial.println("✅ Status updated successfully!");
      http.end();
      return true;
    }
  } else {
    Serial.printf("❌ HTTP error: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
  return false;
}

// ============================================================================
// 🖨️ PRINT FUNCTIONS
// ============================================================================
void printHeader() {
  Serial.println();
  Serial.println("🚗 Smart Parking ESP32 Simulator");
  Serial.println("==================================");
  Serial.printf("📍 Slot ID: %d\n", SLOT_ID);
  Serial.printf("🎮 Mode: %s\n", SIMULATION_MODE ? "SIMULATION" : "HARDWARE");
  Serial.printf("🤖 Pattern: %s\n", AUTO_MODE ? "AUTO" : "MANUAL");
  Serial.printf("🌐 API: %s\n", API_BASE_URL);
  Serial.println("==================================");
}

void printStatus(float distance, bool occupied) {
  String statusIcon = occupied ? "🚗" : "🅿️";
  String statusText = occupied ? "OCCUPIED" : "AVAILABLE";
  
  Serial.printf("%s [%s] Distance: %.1fcm | Slot %d\n", 
                statusIcon.c_str(), statusText.c_str(), distance, SLOT_ID);
}

// ============================================================================
// 📝 UTILITY FUNCTIONS
// ============================================================================

// Print memory info
void printMemoryInfo() {
  Serial.printf("💾 Free Heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("📊 Heap Size: %d bytes\n", ESP.getHeapSize());
}

// Print system info
void printSystemInfo() {
  Serial.println("🔧 System Information:");
  Serial.printf("   Chip Model: %s\n", ESP.getChipModel());
  Serial.printf("   CPU Freq: %d MHz\n", ESP.getCpuFreqMHz());
  Serial.printf("   Flash Size: %d bytes\n", ESP.getFlashChipSize());
  Serial.printf("   Free Heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("   Uptime: %lu ms\n", millis());
}

// Handle serial commands for manual control
void handleSerialCommands() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command == "info") {
      printSystemInfo();
    } else if (command == "memory") {
      printMemoryInfo();
    } else if (command.startsWith("distance ")) {
      float newDistance = command.substring(9).toFloat();
      // This would be used in manual mode
      Serial.printf("🔧 Manual distance set to %.1f cm\n", newDistance);
    } else if (command == "help") {
      Serial.println("📝 Available commands:");
      Serial.println("   info     - System information");
      Serial.println("   memory   - Memory usage");
      Serial.println("   distance X - Set manual distance to X cm");
      Serial.println("   help     - This help message");
    }
  }
}