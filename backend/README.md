
# 🚀 Smart Parking Backend API

## Lý thuyết kiến trúc & triển khai

### 1. Kiến trúc tổng quan
- Backend xây dựng theo mô hình RESTful API, sử dụng Node.js (Express) làm framework chính.
- Dữ liệu lưu trữ trên PostgreSQL, quản lý qua Supabase (cloud database, có dashboard, API, bảo mật RLS).
- Phân tầng rõ ràng: routes (định nghĩa endpoint), controllers (xử lý logic), models (mapping DB), services (business logic), middlewares (xác thực, bảo vệ), utils (hàm tiện ích).
- Authentication dùng JWT, phân quyền theo role (Admin/Driver).
- Lịch trình tự động (cron) xử lý các tác vụ định kỳ như auto-cancel reservation.

### 2. Kết nối Supabase
- Supabase là backend-as-a-service, cung cấp Postgres, API, authentication, storage, realtime...
- Kết nối từ Node.js qua thư viện `pg` (truy vấn SQL) hoặc `@supabase/supabase-js` (truy vấn API).
- Biến môi trường cần thiết:
  - SUPABASE_URL: URL dự án Supabase
  - SUPABASE_ANON_KEY: key public cho client
  - SUPABASE_SERVICE_ROLE_KEY: key server-side (bảo mật, dùng cho backend)
  - database_url: chuỗi kết nối Postgres
- Đảm bảo bật Row Level Security (RLS) trên Supabase để bảo vệ dữ liệu.

### 3. Quy trình triển khai API
1. Chuẩn bị môi trường: Node.js >= 18, npm, Supabase project, database đã setup.
2. Clone repo, cài dependencies (`npm install`).
3. Tạo file `.env` và điền các biến môi trường cần thiết (không commit lên repo public).
4. Chạy script SQL tạo bảng nếu cần (`psql <database_url> -f reservations_setup.sql`).
5. Chạy server (`npm run dev` hoặc `npm start`).
6. Kiểm tra API qua Swagger (`/api-docs`) hoặc Postman.
7. Deploy production bằng Docker hoặc Render.com (chỉ cần trỏ Dockerfile path đúng, set env vars trên dashboard).

### 4. Bảo mật & best practices
- Không commit file `.env` thật lên repo public.
- Chỉ commit `.env.example` (mẫu, không chứa secret).
- Đặt secrets trong dashboard Render hoặc server thật.
- Sử dụng JWT cho xác thực, bcryptjs cho password.
- Kiểm tra log khi build/deploy để xác định lỗi.
- Đảm bảo RLS Supabase luôn bật, chỉ dùng service role key cho backend.

### 5. Lý thuyết các thành phần chính
- **Routes**: Định nghĩa endpoint, nhận request từ client.
- **Controllers**: Xử lý logic cho từng endpoint, gọi service/model.
- **Models**: Mapping bảng DB sang JS object, định nghĩa schema.
- **Services**: Business logic, truy vấn DB, xử lý nghiệp vụ.
- **Middlewares**: Xác thực JWT, phân quyền, xử lý lỗi.
- **Utils**: Hàm tiện ích chung (format response, validate...).
- **Schedule**: Cron job tự động (node-cron), ví dụ auto-cancel reservation.

### 6. Quy trình debug & kiểm tra
- Kiểm tra kết nối DB: testConnection trong db.js
- Kiểm tra biến môi trường: log ra các biến khi khởi động server
- Kiểm tra API qua Swagger hoặc Postman
- Đọc log khi build/deploy để xác định nguyên nhân lỗi

