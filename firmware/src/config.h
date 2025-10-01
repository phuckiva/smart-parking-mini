// config.h - Cấu hình cho ESP32 Smart Parking
#ifndef CONFIG_H
#define CONFIG_H

// WiFi configuration
#define WIFI_SSID "YourWiFiName"
#define WIFI_PASSWORD "YourWiFiPassword"

// API configuration
#define API_BASE_URL "http://192.168.1.100:8888/api"
#define API_KEY "smart-parking-2025"  // Nếu backend yêu cầu API key

// Hardware pins
#define TRIG_PIN 4
#define ECHO_PIN 2
#define LED_PIN 5  // LED báo trạng thái (tùy chọn)

// Sensor settings
#define DISTANCE_THRESHOLD 10  // cm - khoảng cách nhận diện có xe
#define MEASURE_INTERVAL 2000  // ms - chu kỳ đo
#define DEBOUNCE_TIME 5000     // ms - thời gian chống nhiễu

// Parking slot ID (unique cho mỗi ESP32)
#define SLOT_ID 1  // Thay đổi cho từng chỗ đỗ

#endif