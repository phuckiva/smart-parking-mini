# 📱 Smart Parking Mobile App

Mobile app cho người dùng (tài xế) xem chỗ đỗ và đặt chỗ.

## 🚀 Tính năng

- Đăng nhập/đăng ký
- Xem danh sách chỗ đỗ available
- Đặt chỗ trước (với thời gian)
- Xem lịch sử đỗ xe của bản thân
- Check-in/Check-out

## 🛠️ Cài đặt

```bash
# Tạo Flutter project
flutter create smart_parking_mobile
cd smart_parking_mobile

# Cài đặt dependencies
flutter pub add http
flutter pub add shared_preferences
flutter pub add provider

# Run app
flutter run
```

## 📱 Màn hình chính

1. **Login/Register** - Đăng nhập tài khoản
2. **Dashboard** - Tổng quan chỗ đỗ
3. **Slots List** - Danh sách chỗ đỗ + đặt chỗ
4. **My History** - Lịch sử đỗ xe
5. **Profile** - Thông tin cá nhân

## 🔌 API Integration

App kết nối với backend qua HTTP API:
- Base URL: `http://localhost:8888/api` (dev)
- Authentication: Bearer JWT token