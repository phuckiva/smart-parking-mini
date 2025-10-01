#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "config.h"

// Variables
unsigned long lastMeasurement = 0;
unsigned long lastStatusChange = 0;
bool currentStatus = false;  // false = available, true = occupied
bool lastStatus = false;
bool isConnected = false;

void setup() {
  Serial.begin(115200);
  Serial.println("🚗 Smart Parking ESP32 starting...");
  
  // Initialize pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("✅ Setup complete!");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected. Reconnecting...");
    connectWiFi();
    return;
  }
  
  // Measure distance every MEASURE_INTERVAL
  if (millis() - lastMeasurement >= MEASURE_INTERVAL) {
    float distance = measureDistance();
    currentStatus = (distance <= DISTANCE_THRESHOLD);
    
    // Update LED
    digitalWrite(LED_PIN, currentStatus ? HIGH : LOW);
    
    // Check for status change with debounce
    if (currentStatus != lastStatus) {
      if (millis() - lastStatusChange >= DEBOUNCE_TIME) {
        Serial.printf("🔄 Status changed: %s (distance: %.1fcm)\n", 
                     currentStatus ? "OCCUPIED" : "AVAILABLE", distance);
        
        // Send to API
        if (sendStatusUpdate(currentStatus)) {
          lastStatus = currentStatus;
          lastStatusChange = millis();
        }
      }
    }
    
    lastMeasurement = millis();
  }
  
  delay(100);
}

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

bool sendStatusUpdate(bool occupied) {
  if (!isConnected) return false;
  
  HTTPClient http;
  http.begin(String(API_BASE_URL) + "/slots/" + String(SLOT_ID) + "/status");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  
  // Create JSON payload
  DynamicJsonDocument doc(200);
  doc["status"] = occupied ? "occupied" : "available";
  doc["sensor_id"] = "ESP32_SLOT_" + String(SLOT_ID);
  doc["timestamp"] = millis();
  
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