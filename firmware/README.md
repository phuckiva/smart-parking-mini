# Smart Parking Firmware - ESP32

This directory contains the Arduino/ESP32 firmware for the Smart Parking System.

## Hardware Requirements

- ESP32 Development Board
- 4x HC-SR04 Ultrasonic Sensors (for parking slot detection)
- 4x LEDs (for visual slot status indication)
- 4x 220Ω Resistors (for LEDs)
- Breadboard and jumper wires

## Wiring Diagram

### Ultrasonic Sensors (HC-SR04)
| Sensor | ESP32 Trig Pin | ESP32 Echo Pin |
|--------|---------------|---------------|
| Slot 1 | GPIO 2        | GPIO 3        |
| Slot 2 | GPIO 4        | GPIO 5        |
| Slot 3 | GPIO 16       | GPIO 18       |
| Slot 4 | GPIO 17       | GPIO 19       |

### Status LEDs
| LED    | ESP32 Pin |
|--------|-----------|
| Slot 1 | GPIO 12   |
| Slot 2 | GPIO 13   |
| Slot 3 | GPIO 14   |
| Slot 4 | GPIO 15   |

### Power Connections
- VCC (HC-SR04) → 5V (ESP32)
- GND (HC-SR04) → GND (ESP32)
- LED Cathode (-) → GND through 220Ω resistor
- LED Anode (+) → ESP32 GPIO pin

## Configuration

Before uploading the code, modify these settings in `smart_parking.ino`:

```cpp
// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend API endpoint
const char* serverURL = "http://YOUR_BACKEND_IP:3001/api/slots";
```

## Features

- **Ultrasonic Sensor Reading**: Measures distance to detect vehicle presence
- **WiFi Connectivity**: Connects to local WiFi network
- **Real-time Data Transmission**: Sends sensor data to backend every 5 seconds
- **LED Status Indicators**: Visual feedback for each parking slot
- **Automatic Reconnection**: Handles WiFi disconnections gracefully

## Installation

1. Install the Arduino IDE
2. Install ESP32 board support
3. Install required libraries:
   - WiFi (built-in)
   - HTTPClient (built-in)
   - ArduinoJson
4. Open `smart_parking.ino` in Arduino IDE
5. Configure WiFi credentials and backend URL
6. Select your ESP32 board and port
7. Upload the code

## How It Works

1. **Initialization**: Sets up pins, connects to WiFi
2. **Sensor Reading**: Continuously measures distance for each slot
3. **Status Determination**: Slot is occupied if distance < 10cm
4. **LED Updates**: Updates status LEDs in real-time
5. **Data Transmission**: Sends JSON data to backend API every 5 seconds

## Troubleshooting

- **WiFi Connection Issues**: Check SSID and password
- **Sensor Not Working**: Verify wiring and power connections
- **Backend Communication**: Ensure backend server is running and accessible
- **Serial Monitor**: Use 115200 baud rate to view debug messages

## Sample JSON Output

```json
{
  "slots": [
    {"id": 1, "isOccupied": false, "sensorValue": 0, "distance": 25},
    {"id": 2, "isOccupied": true, "sensorValue": 1, "distance": 8},
    {"id": 3, "isOccupied": false, "sensorValue": 0, "distance": 30},
    {"id": 4, "isOccupied": true, "sensorValue": 1, "distance": 5}
  ]
}
```