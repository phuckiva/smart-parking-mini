# 🚗 Hệ thống Đỗ xe Thông minh Mini (Smart Parking Mini)

Dự án này là một mô hình mô phỏng hệ thống đỗ xe thông minh, được xây dựng với chi phí thấp nhằm mục đích học tập và nghiên cứu. Hệ thống cho phép người dùng và quản trị viên theo dõi trạng thái các chỗ đỗ xe (trống/có xe) theo thời gian thực.

-----

## ✨ Tính năng chính

  - \*\* giám sát thời gian thực\*\*: Cập nhật trạng thái của từng chỗ đỗ ngay lập tức khi có xe ra/vào.
  - **Giao diện quản trị (Web App)**: Cung cấp một dashboard trực quan cho quản trị viên để theo dõi tổng quan bãi xe, xem chi tiết từng vị trí.
  - **Ứng dụng người dùng (Mobile App)**: Giúp người dùng (tài xế) dễ dàng xem số lượng chỗ còn trống trước khi đến bãi.
  - **Quản lý người dùng và phân quyền**: Hệ thống phân biệt vai trò Admin và Driver với các chức năng tương ứng.
  - **Lưu trữ lịch sử**: Ghi lại lịch sử các lượt đỗ xe để phục vụ cho việc thống kê và phân tích.
  - **Tích hợp phần cứng**: Sử dụng vi điều khiển ESP32 và cảm biến siêu âm để phát hiện xe một cách tự động.

-----

## 🛠️ Công nghệ sử dụng

Dự án được xây dựng theo kiến trúc monorepo, bao gồm các thành phần sau:

| Thành phần     | Công nghệ                                                |
| :------------- | :------------------------------------------------------- |
| **Phần cứng** | ESP32, Cảm biến siêu âm HC-SR04                          |
| **Firmware** | C++ trên nền tảng Arduino / PlatformIO                    |
| **Backend** | Node.js, Express.js                                      |
| **Database** | PostgreSQL trên Supabase                                 |
| **Web App** | React.js, Vite                                           |
| **Mobile App** | Flutter                                                  |
| **DevOps** | Docker, Kubernetes, GitHub Actions, Terraform            |
| **Monitoring** | Prometheus, Grafana, Loki, AlertManager                  |
| **Infrastructure** | AWS EKS, RDS, VPC, ALB                               |

-----

## 📂 Cấu trúc dự án

Repo này được tổ chức theo cấu trúc monorepo để dễ dàng quản lý các thành phần khác nhau của dự án.

```
/
├── 📁 backend/             # Chứa code API server (Node.js)
├── 📁 webapp/              # Chứa code trang dashboard quản trị (React)
├── 📁 mobileapp/           # Chứa code ứng dụng cho người dùng (Flutter)
├── 📁 firmware/            # Chứa code cho vi điều khiển ESP32
├── 📁 database/            # Chứa các script SQL để thiết lập CSDL
├── 📁 k8s/                 # Kubernetes deployment manifests
├── 📁 infrastructure/      # Terraform Infrastructure as Code
├── 📁 monitoring/          # Prometheus, Grafana configurations
├── 📁 scripts/             # Deployment và automation scripts
├── 📁 .github/workflows/   # CI/CD pipeline definitions
├── 📄 docker-compose.*.yml # Docker orchestration files
└── 📄 README.md            # File hướng dẫn này
```

-----

## 🗄️ Thiết kế Cơ sở dữ liệu

CSDL được thiết kế với 6 bảng chính để quản lý toàn bộ hệ thống:

1.  **`parking_slots`**: Lưu trữ trạng thái của từng chỗ đỗ.
2.  **`users`**: Lưu thông tin của người dùng (Admin và Driver).
3.  **`roles`**: Định nghĩa các vai trò trong hệ thống.
4.  **`user_roles`**: Bảng trung gian kết nối `users` và `roles`.
5.  **`parking_history`**: Ghi lại nhật ký check-in/check-out của người dùng tại các chỗ đỗ.
6.  **`parking_reservations`**: Quản lý việc đặt chỗ trước của người dùng.

-----

## 🚀 Hướng dẫn cài đặt và chạy dự án

Để chạy dự án này trên máy của bạn, hãy làm theo các bước sau:

### **Yêu cầu:**

  - [Node.js](https://nodejs.org/) (phiên bản 18.x trở lên)
  - [Flutter SDK](https://flutter.dev/docs/get-started/install) (phiên bản 3.x trở lên)
  - [PlatformIO](https://platformio.org/) (extension cho VS Code) hoặc Arduino IDE
  - Tài khoản [Supabase](https://supabase.com/)

### **1. Cài đặt Database (Supabase)**

Đầu tiên, tạo database:

```bash
# 1. Đăng ký tài khoản tại https://supabase.com
# 2. Tạo project mới
# 3. Vào SQL Editor và chạy script:
```

Copy toàn bộ nội dung file `database/complete_setup.sql` và chạy trong Supabase SQL Editor.

### **2. Cài đặt Backend**

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt các thư viện cần thiết
npm install

# Sao chép file cấu hình môi trường
cp .env.example .env
```

Mở file `.env` và điền thông tin Supabase:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
```

Khởi động server:

```bash
npm start
```

Server backend sẽ chạy tại `http://localhost:8888`.

### **3. Cài đặt Web App (Dashboard)**

```bash
# Di chuyển vào thư mục webapp
cd webapp

# Cài đặt các thư viện cần thiết
npm install

# Chạy ứng dụng web
npm run dev
```

Trang dashboard sẽ chạy tại `http://localhost:5173`.

**Tài khoản test:**
- Admin: `admin@smartparking.com` / `admin123`
- User: `nguyenvana@email.com` / `123456`

### **4. Cài đặt Mobile App**

```bash
# Di chuyển vào thư mục mobileapp
cd mobileapp

# Cài đặt các thư viện cần thiết
flutter pub get

# Chạy ứng dụng trên máy ảo hoặc thiết bị thật
flutter run
```

### **5. Cài đặt Firmware**

1.  Mở thư mục `firmware` bằng VS Code đã cài đặt PlatformIO.
2.  Mở file `src/config.h` (hoặc tên tương tự) và điền thông tin WiFi của bạn cũng như địa chỉ IP của máy tính đang chạy server backend.
3.  Kết nối ESP32 với máy tính.
4.  Nhấn nút **Upload** trong PlatformIO để nạp code cho ESP32.

-----

## 👥 Thành viên nhóm

Dự án được thực hiện bởi Nhóm 10:

| STT | Vai trò                | Thành viên      |
| :-- | :---------------------- | :-------------- |
| 1   | Firmware Developer      | Nguyễn Quốc Tú |
| 2   | Backend Developer  | Lê Đăng Hoàng Tuấn |
| 3   | Database  & Firmware Developer    | Huỳnh Trọng Phúc |
| 4   | Web App Developer  & Tester   | Trần Thị Kiều Liêu |
| 5   | Mobile App Developer  & Tester  | Huỳnh Anh Tuấn |
