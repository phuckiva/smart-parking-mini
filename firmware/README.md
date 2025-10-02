# 🔧 Smart Parking Firmware (ESP32)

## 🤔 **MÔ PHỎNG LÀ GÌ?**

### **Vấn đề cần giải quyết:**
- ESP32 + cảm biến HC-SR04 tốn tiền (~260k VNĐ)
- Cần kiến thức điện tử để hàn mạch
- Debug hardware phức tạp

### **Giải pháp: SIMULATOR**
- **Simulator** = phần mềm giả lập ESP32 thật
- Backend nhận cùng data format → không phân biệt được!
- Perfect cho học tập, demo, testing

```
Real Hardware:           Simulator:
🔧 HC-SR04 → 8cm        💻 Python → 8cm  
📡 WiFi → API           🌐 HTTP → API
🚗 Status: occupied     📊 Status: occupied
```

---

## 🎯 **2 LỰA CHỌN**

### 🤖 **SIMULATOR** (Khuyến nghị)
**Dùng cho:** Học tập, đồ án, demo, testing
- ✅ Miễn phí - không cần mua linh kiện
- ✅ Chạy ngay trên laptop  
- ✅ Control dễ dàng (auto/manual modes)
- ✅ Debug nhanh

### 🔧 **HARDWARE** 
**Dùng cho:** Production, hệ thống thực tế
- 💰 Chi phí ~260k VNĐ
- 🔧 Cần kiến thức điện tử
- 🐛 Debug phức tạp hơn

---

## 🚀 **CÁCH CHẠY SIMULATOR**

### **1. 🌐 Web Browser** (Dễ nhất)
```bash
# Double-click file: simulator_web.html
# Không cần cài gì!
```

### **2. 🐍 Python GUI** (Professional)
```bash
pip install requests customtkinter
python simulator_gui.py
```

### **3. 💻 Command Line** (Developers)
```bash
pip install requests
python simulator.py
```

### **4. 🚀 Windows Launcher** (User-friendly)
```bash
# Double-click: start_simulator.bat
```

### **5. 🔧 Arduino IDE** (Hardware-like)
```bash
# Open: esp32_simulator.ino
# Tools → Board → ESP32 Dev Module
```

---

## 🔧 **HARDWARE SETUP** (Nếu muốn ESP32 thật)

### **Shopping List (~260k VNĐ):**
- ESP32 Dev Board (150k)
- HC-SR04 Sensor (50k)  
- Breadboard + Jumpers (30k)
- LED + Resistor (10k)
- USB Cable (20k)

### **Wiring:**
```
ESP32    HC-SR04
D2   →   Echo
D4   →   Trig  
3.3V →   VCC
GND  →   GND
```

### **Config (file config.h):**
```cpp
#define WIFI_SSID "TenWiFi"
#define WIFI_PASSWORD "MatKhau"  
#define API_BASE_URL "http://192.168.1.100:8888/api"
#define SLOT_ID 1
```

---

## 🔄 **API INTEGRATION**

**Format (giống nhau cho Simulator & Hardware):**
```http
PUT /api/slots/{slot_id}/status
{
  "status": "occupied|available",
  "sensor_id": "ESP32_SLOT_1",
  "timestamp": 1696204800000,
  "distance": 8.5
}
```

---

## 🎯 **QUICK START**

### **Demo ngay (3 bước):**
```bash
# 1. Start backend
cd backend && npm start

# 2. Start frontend  
cd webapp && npm start

# 3. Start simulator
cd firmware && python simulator_gui.py
# Hoặc double-click: simulator_web.html

# → Mở http://localhost:3000 để xem!
```

---

## 🏆 **KHUYẾN NGHỊ**

| Mục đích | Phương pháp | Lý do |
|----------|-------------|-------|
| 🎓 Học tập/Đồ án | `python simulator_gui.py` | Professional, miễn phí |
| 🎭 Demo/Presentation | `simulator_web.html` | Impressive, cross-platform |  
| 👨‍� Development | `python simulator.py` | Debug nhanh, control tốt |
| 🔧 Production | Hardware ESP32 | Độ tin cậy cao, real sensors |

**🎯 Kết luận: Simulator perfect cho 99% use cases, chỉ production mới cần hardware!** 🚀

---

## 🚀 **CHI TIẾT: SIMULATOR OPTIONS**

### 🎮 **Option A: Python Command Line** (Cho developers)

#### **Cách chạy:**
```bash
# Bước 1: Cài Python (nếu chưa có)
# Download từ: https://python.org

# Bước 2: Cài thư viện cần thiết
pip install requests

# Bước 3: Chạy simulator
cd firmware
python simulator.py

# Hoặc chạy với tham số tùy chỉnh:
python simulator.py 1 http://localhost:8888/api
#                   ^slot_id  ^api_url
```

#### **Giao diện sẽ như thế này:**
```
🚗 Smart Parking ESP32 Simulator v1.0
==================================================
🎯 Simulating Slot ID: 1
🌐 API URL: http://localhost:8888/api
==================================================
✅ API connection OK
🔄 Starting main simulation loop...

📏 Distance: 25.3cm | Status: 🅿️ AVAILABLE
📏 Distance: 8.1cm  | Status: 🚗 OCCUPIED
🔄 Status changed: 🚗 OCCUPIED
� Sending: {"status":"occupied","sensor_id":"ESP32_SLOT_1"...}
✅ Status updated successfully!

🎮 Commands (auto/manual/random/set XX/status/quit):
```

#### **Interactive Commands:**
```bash
🎮 Command: auto        # Chế độ tự động (giả lập patterns thực tế)
🎮 Command: manual      # Chế độ thủ công  
🎮 Command: set 15      # Set khoảng cách = 15cm
🎮 Command: random      # Chế độ ngẫu nhiên
🎮 Command: status      # Xem trạng thái hiện tại
🎮 Command: quit        # Thoát
```

### 🖥️ **Option B: Python GUI** (Cho presentations)

#### **Cách chạy:**
```bash
# Cài thêm thư viện cho giao diện đẹp (tùy chọn)
pip install customtkinter

# Chạy GUI
python simulator_gui.py
```

#### **Giao diện GUI gồm:**
```
┌─────────────────────────────────────────────┐
│ 🚗 Smart Parking ESP32 Simulator           │
├─────────────────────────────────────────────┤
│ 🔧 Configuration:                           │
│ API URL: [http://localhost:8888/api] [Test] │
│ [▶️ Start All] [⏹️ Stop All] [➕ Add Slot]   │
├─────────────────────────────────────────────┤
│ 🅿️ Parking Slots:                          │
│ ┌─────────────┐ ┌─────────────┐             │
│ │🅿️ Slot 1    │ │🚗 Slot 2    │             │
│ │✅ AVAILABLE │ │🚗 OCCUPIED  │             │
│ │📏 25.3cm    │ │📏 7.8cm     │             │
│ │[Auto][Manual][Random]       │             │
│ └─────────────┘ └─────────────┘             │
├─────────────────────────────────────────────┤
│ 📝 Log:                                     │
│ [10:15:23] ✅ API connection successful!    │
│ [10:15:25] 📡 Slot 1: 🅿️ AVAILABLE         │
│ [10:15:28] 🔄 Status changed: 🚗 OCCUPIED   │
└─────────────────────────────────────────────┘
```

### 🌐 **Option C: Web Browser** (Không cần cài gì)

#### **Cách chạy:**
```bash
# Chỉ cần double-click file:
simulator_web.html

# Hoặc trong browser:
# Ctrl+O → chọn file simulator_web.html
```

#### **Tính năng Web version:**
- ✅ Responsive design (chạy trên phone/tablet)
- ✅ Real-time updates
- ✅ Multi-slot management  
- ✅ Dark theme professional
- ✅ Không cần cài Python

### 🚀 **Option D: Windows Launcher** (User-friendly)

#### **Cách chạy:**
```bash
# Double-click file:
start_simulator.bat

# Menu sẽ hiện ra:
🚗 Smart Parking ESP32 Simulator Launcher
==========================================
🎯 Choose simulator mode:
1. GUI Simulator (Recommended)
2. Command Line Simulator  
3. Exit

Enter your choice (1-3): 1
```

### 🔧 **Option E: Arduino IDE** (Giống hardware thật)

#### **Cách setup:**
```bash
# 1. Cài Arduino IDE từ: https://arduino.cc
# 2. Thêm ESP32 board:
#    File → Preferences → Additional Board URLs:
#    https://dl.espressif.com/dl/package_esp32_index.json
# 3. Tools → Board → ESP32 Arduino → ESP32 Dev Module
# 4. Library Manager → Install "ArduinoJson"
# 5. Open file: esp32_simulator.ino
# 6. Upload (hoặc Verify để test)
```

---

## 🔧 **CHI TIẾT: HARDWARE ESP32 THẬT**

### 📦 **Shopping List:**
```
🛒 Cần mua:
├── ESP32 Dev Board         ~150k VNĐ
├── HC-SR04 Ultrasonic      ~50k VNĐ  
├── Breadboard + Jumpers    ~30k VNĐ
├── LED + Resistor          ~10k VNĐ
└── USB Cable               ~20k VNĐ
                     Total: ~260k VNĐ
```

### 🔌 **Wiring Diagram:**
```
ESP32 Board:          HC-SR04 Sensor:
┌─────────────┐      ┌──────────────┐
│ D2 ←──────→ │      │ ←──────→ Echo│
│ D4 ←──────→ │      │ ←──────→ Trig│  
│ 3.3V ←────→ │      │ ←──────→ VCC │
│ GND ←─────→ │      │ ←──────→ GND │
└─────────────┘      └──────────────┘

LED Circuit:
ESP32 D5 → [220Ω] → LED → GND
```

### 🔧 **Arduino IDE Setup:**
```cpp
// File: config.h - Cấu hình WiFi và API
#define WIFI_SSID "TenWiFiNhaKhach"      // ← Thay tên WiFi
#define WIFI_PASSWORD "MatKhauWiFi"     // ← Thay password  
#define API_BASE_URL "http://192.168.1.100:8888/api"  // ← IP máy chạy backend
#define SLOT_ID 1                       // ← ID chỗ đỗ (1,2,3...)

// Hardware pins (đã wiring ở trên)
#define TRIG_PIN 4    // Chân Trigger HC-SR04
#define ECHO_PIN 2    // Chân Echo HC-SR04  
#define LED_PIN 5     // LED báo trạng thái
```

### 📡 **Test Hardware:**
```bash
# 1. Upload code lên ESP32
# 2. Mở Serial Monitor (115200 baud)
# 3. Xem output:

🚗 Smart Parking ESP32 starting...
📡 Connecting to WiFi 'TenWiFiNhaKhach'....
✅ WiFi connected! IP: 192.168.1.50
🅿️ [AVAILABLE] Distance: 25.3cm | Slot 1
🚗 [OCCUPIED] Distance: 8.1cm | Slot 1  
📤 Sending: {"status":"occupied"...}
✅ Status updated successfully!
```

---

## 🔄 **BACKEND INTEGRATION CHI TIẾT**

### **API Format (giống nhau cho cả Simulator và Hardware):**
```http
PUT /api/slots/{slot_id}/status
Content-Type: application/json
X-API-Key: smart-parking-2025

{
  "status": "occupied",           // "occupied" hoặc "available"
  "sensor_id": "ESP32_SLOT_1",   // ID duy nhất cho ESP32
  "timestamp": 1696204800000,     // Unix timestamp  
  "distance": 8.5,               // Khoảng cách (cm)
  "simulation": true             // true nếu từ simulator
}
```

### **Backend Response:**
```json
{
  "success": true,
  "message": "Slot status updated",
  "slot": {
    "id": 1,
    "status": "occupied", 
    "updated_at": "2025-10-02T10:15:30Z"
  }
}
```

### **Test API Connection:**
```bash
# Method 1: Dùng simulator (auto test)
python simulator.py

# Method 2: Test manual với curl
curl -X GET http://localhost:8888/api/slots
curl -X PUT http://localhost:8888/api/slots/1/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: smart-parking-2025" \
  -d '{"status":"occupied","distance":8.5}'

# Method 3: Test với Postman
# GET http://localhost:8888/api/slots
# PUT http://localhost:8888/api/slots/1/status
```

---

## 🎯 **HƯỚNG DẪN STEP-BY-STEP**

### 🚀 **Scenario 1: Demo/Học tập (Simulator)**

#### **Bước 1: Setup Backend**
```bash
# Terminal 1: Start backend server
cd backend  
npm install
npm start

# Đợi thấy: "Server running on port 8888"
```

#### **Bước 2: Chạy Frontend** 
```bash
# Terminal 2: Start frontend
cd webapp
npm install  
npm start

# Mở browser: http://localhost:3000
```

#### **Bước 3: Chạy IoT Simulator**
```bash
# Terminal 3: Start ESP32 simulator
cd firmware

# Option A: GUI (khuyến nghị)
python simulator_gui.py

# Option B: Web browser  
# Double-click: simulator_web.html

# Option C: Command line
python simulator.py
```

#### **Bước 4: Xem kết quả**
```bash
# 1. Trong frontend browser: http://localhost:3000
#    → Sẽ thấy slots realtime update

# 2. Trong simulator:
#    → Control mode: auto/manual/random
#    → Xem log API calls

# 3. Demo thành công! 🎉
```

### 🔧 **Scenario 2: Production (Hardware)**

#### **Bước 1: Mua linh kiện** (xem Shopping List ở trên)

#### **Bước 2: Wiring theo sơ đồ**

#### **Bước 3: Setup Arduino IDE**
```bash
# Cài ESP32 board package + ArduinoJson library
```

#### **Bước 4: Config firmware**
```cpp
// Sửa config.h với thông tin thật:
#define WIFI_SSID "WiFi_Bai_Xe"
#define WIFI_PASSWORD "password123"  
#define API_BASE_URL "http://192.168.1.100:8888/api"
#define SLOT_ID 1  // Chỗ đỗ số 1
```

#### **Bước 5: Upload & Test**
```bash
# Upload firmware, mở Serial Monitor
# Test với tay che cảm biến → status change
```

---

## 🎊 **TỔNG KẾT & KHUYẾN NGHỊ**

### **🎮 Cho Demo/Học tập:**
```bash
Recommended: Python GUI Simulator
→ python simulator_gui.py

Why? Professional, impressive, không tốn tiền
```

### **👨‍💻 Cho Development:**
```bash  
Recommended: Command Line Simulator
→ python simulator.py

Why? Nhanh, debug dễ, control tốt
```

### **🌐 Cho Presentation:**
```bash
Recommended: Web Browser Simulator  
→ simulator_web.html

Why? Cross-platform, responsive, modern UI
```

### **🔧 Cho Production:**
```bash
Required: Hardware ESP32
→ esp32_simulator.ino trong Arduino IDE  

Why? Cảm biến vật lý thật, độ tin cậy cao
```

### **📱 Multi-platform:**
- ✅ **Windows**: start_simulator.bat
- ✅ **Mac/Linux**: python simulator_gui.py  
- ✅ **Mobile**: simulator_web.html trong mobile browser
- ✅ **Arduino**: esp32_simulator.ino

**🎯 Kết luận: Simulator giúp bạn build và test toàn bộ Smart Parking system mà không cần mua hardware, perfect cho học tập và demo!** 🚀

---

## 🔧 **HARDWARE - ESP32 thật**

### 📦 Phần cứng cần thiết
- ESP32 Dev Board
- Cảm biến siêu âm HC-SR04
- LED báo trạng thái (tùy chọn)
- Breadboard + dây jumper

### 🔌 Sơ đồ kết nối
```
ESP32        HC-SR04
-----------------------
D2    <-->   Echo
D4    <-->   Trig
3.3V  <-->   VCC
GND   <-->   GND
```

### ⚙️ Cài đặt Hardware

#### Option 1: Arduino IDE
1. Cài đặt [Arduino IDE](https://www.arduino.cc/en/software)
2. Thêm ESP32 board: File > Preferences > Additional Board URLs: 
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
3. Tools > Board > ESP32 Arduino > ESP32 Dev Module
4. Cài thư viện: WiFi, HTTPClient, ArduinoJson

#### Option 2: PlatformIO
1. Cài đặt [VS Code](https://code.visualstudio.com/) + [PlatformIO extension](https://platformio.org/install/ide?install=vscode)
2. Mở folder này trong VS Code
3. PlatformIO sẽ tự động cài đặt dependencies

### 📝 Cấu hình Hardware
Sửa file `config.h`:
```cpp
#define WIFI_SSID "TenWiFi"
#define WIFI_PASSWORD "MatKhauWiFi"
#define API_BASE_URL "http://192.168.1.100:8888/api"
#define SLOT_ID 1  // ID chỗ đỗ trong database
```

---

## 🚀 **Chức năng chung**

### **Simulator:**
1. **Mô phỏng khoảng cách** - Random/Manual/Auto patterns
2. **API Integration** - Gửi trạng thái real-time 
3. **Interactive Control** - Điều khiển qua command/GUI
4. **Multi-slot Support** - Nhiều ESP32 cùng lúc

### **Hardware:**
1. **Kết nối WiFi** - Connect ESP32 vào mạng
2. **Đo khoảng cách** - HC-SR04 phát hiện xe (< 10cm = có xe)
3. **Gửi API** - POST trạng thái lên backend khi có thay đổi
4. **LED báo hiệu** - Xanh = trống, Đỏ = có xe

---

## 🎯 **Khuyến nghị sử dụng**

### 🎮 **Cho Development & Testing:**
```bash
# Sử dụng Simulator - nhanh, dễ test, không cần hardware
python simulator_gui.py
```

### 🔧 **Cho Production:**
```bash
# Sử dụng Hardware ESP32 thật với cảm biến
# Upload firmware qua Arduino IDE/PlatformIO
```

### 📊 **Demo & Presentation:**
```bash
# GUI Simulator - trực quan, impressive
python simulator_gui.py
```

---

## 🔄 **Integration với Backend**

### API Endpoints sử dụng:
```http
PUT /api/slots/{slot_id}/status
Content-Type: application/json
X-API-Key: smart-parking-2025

{
  "status": "occupied|available",
  "sensor_id": "ESP32_SLOT_1", 
  "timestamp": 1696204800000,
  "distance": 8.5
}
```

### Test API Connection:
```bash
# Test với simulator
python simulator.py  # Tự động test connection

# Test manual
curl -X GET http://localhost:8888/api/slots
```

---

## 🎉 **Quick Start (Simulator)**

```bash
# 1. Đảm bảo backend đang chạy
cd backend && npm start

# 2. Chạy simulator
cd firmware
python simulator_gui.py

# 3. Trong GUI:
#    - Nhập API URL: http://localhost:8888/api
#    - Click "Test Connection" 
#    - Click "▶️ Start All"
#    - Watch magic happens! 🎯
```

**Perfect cho demo mà không cần hardware thật!** 🚀