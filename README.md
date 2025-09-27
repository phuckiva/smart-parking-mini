# Smart Parking System Mini

Hệ thống bãi đỗ xe thông minh mini sử dụng ESP32, Node.js, React và Flutter.

## Cấu trúc Monorepo

```
smart-parking-mini/
├── backend/          # Node.js Express API Server
├── webapp/           # React Web Application (Vite)
├── mobileapp/        # Flutter Mobile Application
├── firmware/         # ESP32/Arduino Firmware Code
└── README.md         # Tài liệu chính
```

## Thành phần hệ thống

### 🖥️ Backend API (`/backend`)
- **Technology**: Node.js với Express.js
- **Features**: 
  - REST API endpoint `/api/slots` để quản lý chỗ đỗ xe
  - CORS support cho web frontend
  - Sample data với 8 chỗ đỗ xe
- **Port**: 3001
- **Endpoints**:
  - `GET /api/slots` - Lấy thông tin tất cả chỗ đỗ
  - `GET /api/slots/:id` - Lấy thông tin một chỗ đỗ cụ thể
  - `GET /health` - Health check

### 🌐 Web Application (`/webapp`)
- **Technology**: React với Vite
- **Features**:
  - Giao diện lưới hiển thị trạng thái chỗ đỗ xe
  - Real-time update mỗi 5 giây
  - Responsive design cho mobile/desktop
  - Dashboard thống kê tổng quan
- **Port**: 5173 (development)
- **UI Components**:
  - Parking grid với status indicators
  - Statistics dashboard
  - Refresh functionality

### 📱 Mobile Application (`/mobileapp`)
- **Technology**: Flutter (Dart)
- **Features**:
  - Màn hình chính hiển thị số chỗ trống
  - Grid view các chỗ đỗ xe
  - Auto-refresh mỗi 5 giây
  - Material Design UI
- **Platforms**: Android, iOS, Web
- **Dependencies**: http package cho API calls

### 🔧 Firmware (`/firmware`)
- **Technology**: C++ cho ESP32/Arduino
- **Features**:
  - Đọc cảm biến siêu âm HC-SR04 (4 slots)
  - Kết nối WiFi tự động
  - Gửi dữ liệu lên backend mỗi 5 giây
  - LED indicators cho trạng thái slot
- **Hardware**: ESP32, HC-SR04 sensors, LEDs
- **Communication**: HTTP POST requests

## Hướng dẫn chạy hệ thống

### 1. Backend API
```bash
cd backend
npm install
npm start
```
API sẽ chạy tại: http://localhost:3001

### 2. Web Application
```bash
cd webapp
npm install
npm run dev
```
Web app sẽ chạy tại: http://localhost:5173

### 3. Mobile Application
```bash
cd mobileapp
flutter pub get
flutter run
```
> **Lưu ý**: Cần cài đặt Flutter SDK trước

### 4. Firmware
1. Mở `firmware/smart_parking.ino` trong Arduino IDE
2. Cấu hình WiFi credentials và backend URL
3. Cài đặt thư viện ArduinoJson
4. Upload code lên ESP32

## API Documentation

### GET /api/slots
Trả về thông tin tất cả chỗ đỗ xe:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "isOccupied": false,
      "sensorValue": 0
    }
  ],
  "totalSlots": 8,
  "availableSlots": 5,
  "occupiedSlots": 3
}
```

## Screenshots

### Web Application
- Dashboard với thống kê tổng quan
- Grid view trạng thái chỗ đỗ
- Responsive design cho mobile

### Mobile Application
- Stats card hiển thị tổng quan
- Grid layout các parking slots
- Real-time status updates

## Hardware Requirements

- ESP32 Development Board
- 4x HC-SR04 Ultrasonic Sensors
- 4x LEDs với điện trở 220Ω
- Breadboard và dây jumper

## Technology Stack

- **Backend**: Node.js, Express.js, CORS
- **Frontend**: React, Vite, Modern CSS
- **Mobile**: Flutter, Dart, Material Design
- **Firmware**: C++, Arduino, ESP32, WiFi
- **Communication**: REST API, HTTP, JSON

## Tính năng chính

✅ **Real-time monitoring**: Cập nhật trạng thái chỗ đỗ theo thời gian thực  
✅ **Multi-platform**: Web app, mobile app, và hardware integration  
✅ **RESTful API**: Backend API chuẩn REST  
✅ **Responsive UI**: Giao diện responsive cho mọi thiết bị  
✅ **Hardware integration**: Kết nối với ESP32 và sensors  
✅ **Auto-refresh**: Tự động cập nhật dữ liệu  

## Development Notes

- Backend API chạy ở development mode với sample data
- Web app sử dụng Vite cho hot-reload nhanh
- Mobile app có thể chạy trên Android/iOS/Web
- Firmware có thể mở rộng để hỗ trợ nhiều sensors hơn

## License

MIT License - Xem file LICENSE để biết thêm chi tiết.
