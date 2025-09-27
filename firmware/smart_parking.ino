#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend API endpoint
const char* serverURL = "http://YOUR_BACKEND_IP:3001/api/slots";

// Sensor pins (ultrasonic sensors for each parking slot)
const int trigPins[] = {2, 4, 16, 17};  // Trig pins for 4 slots
const int echoPins[] = {3, 5, 18, 19};  // Echo pins for 4 slots
const int numSlots = 4;

// LED pins to indicate slot status
const int ledPins[] = {12, 13, 14, 15};  // LED pins for 4 slots

// Distance threshold (cm) - below this means slot is occupied
const int OCCUPIED_THRESHOLD = 10;

// Timing variables
unsigned long lastUpdate = 0;
const unsigned long updateInterval = 5000; // Update every 5 seconds

// Slot status array
bool slotOccupied[numSlots];

void setup() {
  Serial.begin(115200);
  
  // Initialize sensor pins
  for (int i = 0; i < numSlots; i++) {
    pinMode(trigPins[i], OUTPUT);
    pinMode(echoPins[i], INPUT);
    pinMode(ledPins[i], OUTPUT);
    slotOccupied[i] = false;
  }
  
  // Connect to WiFi
  connectToWiFi();
  
  Serial.println("Smart Parking System Initialized");
  Serial.println("Monitoring " + String(numSlots) + " parking slots");
}

void loop() {
  // Read sensors and update slot status
  readSensors();
  
  // Update LEDs based on slot status
  updateLEDs();
  
  // Send data to backend every updateInterval
  if (millis() - lastUpdate >= updateInterval) {
    if (WiFi.status() == WL_CONNECTED) {
      sendDataToBackend();
    } else {
      Serial.println("WiFi disconnected, attempting to reconnect...");
      connectToWiFi();
    }
    lastUpdate = millis();
  }
  
  delay(100); // Small delay for stability
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("Failed to connect to WiFi");
  }
}

void readSensors() {
  for (int i = 0; i < numSlots; i++) {
    long distance = measureDistance(trigPins[i], echoPins[i]);
    
    // Update slot status based on distance
    bool previousStatus = slotOccupied[i];
    slotOccupied[i] = (distance > 0 && distance <= OCCUPIED_THRESHOLD);
    
    // Print status change
    if (previousStatus != slotOccupied[i]) {
      Serial.println("Slot " + String(i + 1) + " status changed: " + 
                    (slotOccupied[i] ? "OCCUPIED" : "AVAILABLE") + 
                    " (Distance: " + String(distance) + "cm)");
    }
  }
}

long measureDistance(int trigPin, int echoPin) {
  // Clear the trigPin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  
  // Trigger the sensor
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  // Read the echoPin, returns the sound wave travel time in microseconds
  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
  
  // Calculate distance in cm
  if (duration == 0) {
    return -1; // Sensor error
  }
  
  long distance = duration * 0.034 / 2;
  return distance;
}

void updateLEDs() {
  for (int i = 0; i < numSlots; i++) {
    if (slotOccupied[i]) {
      digitalWrite(ledPins[i], HIGH); // Red LED on for occupied
    } else {
      digitalWrite(ledPins[i], LOW);  // LED off for available
    }
  }
}

void sendDataToBackend() {
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload with sensor data
  DynamicJsonDocument doc(1024);
  JsonArray slots = doc.createNestedArray("slots");
  
  for (int i = 0; i < numSlots; i++) {
    JsonObject slot = slots.createNestedObject();
    slot["id"] = i + 1;
    slot["isOccupied"] = slotOccupied[i];
    slot["sensorValue"] = slotOccupied[i] ? 1 : 0;
    slot["distance"] = measureDistance(trigPins[i], echoPins[i]);
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send POST request
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Data sent successfully. Response: " + response);
  } else {
    Serial.println("Error sending data. HTTP response code: " + String(httpResponseCode));
  }
  
  http.end();
}

void printSlotStatus() {
  Serial.println("=== Parking Slot Status ===");
  int availableCount = 0;
  
  for (int i = 0; i < numSlots; i++) {
    Serial.print("Slot " + String(i + 1) + ": ");
    if (slotOccupied[i]) {
      Serial.println("OCCUPIED");
    } else {
      Serial.println("AVAILABLE");
      availableCount++;
    }
  }
  
  Serial.println("Available slots: " + String(availableCount) + "/" + String(numSlots));
  Serial.println("===========================");
}