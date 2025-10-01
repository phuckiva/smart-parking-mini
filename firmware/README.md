# 🔧 Smart Parking Firmware (ESP32)

Firmware cho ESP32 với cảm biến siêu âm HC-SR04 để phát hiện xe.

## 📦 Phần cứng cần thiết

- ESP32 Dev Board
- Cảm biến siêu âm HC-SR04
- LED báo trạng thái (tùy chọn)
- Breadboard + dây jumper

## 🔌 Sơ đồ kết nối

```
ESP32        HC-SR04
-----------------------
D2    <-->   Echo
D4    <-->   Trig
3.3V  <-->   VCC
GND   <-->   GND
```

## ⚙️ Cài đặt

### Option 1: Arduino IDE
1. Cài đặt [Arduino IDE](https://www.arduino.cc/en/software)
2. Thêm ESP32 board: File > Preferences > Additional Board URLs: 
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
3. Tools > Board > ESP32 Arduino > ESP32 Dev Module
4. Cài thư viện: WiFi, HTTPClient, ArduinoJson

### Option 2: PlatformIO
1. Cài đặt [VS Code](https://code.visualstudio.com/) + [PlatformIO extension](https://platformio.org/install/ide?install=vscode)
2. Mở folder này trong VS Code
3. PlatformIO sẽ tự động cài đặt dependencies

## 🚀 Chức năng

1. **Kết nối WiFi** - Connect ESP32 vào mạng
2. **Đo khoảng cách** - HC-SR04 phát hiện xe (< 10cm = có xe)
3. **Gửi API** - POST trạng thái lên backend khi có thay đổi
4. **LED báo hiệu** - Xanh = trống, Đỏ = có xe

## 📝 Cấu hình

Sửa file `config.h`:
```cpp
#define WIFI_SSID "TenWiFi"
#define WIFI_PASSWORD "MatKhauWiFi"
#define API_BASE_URL "http://192.168.1.100:8888/api"
#define SLOT_ID 1  // ID chỗ đỗ trong database
```