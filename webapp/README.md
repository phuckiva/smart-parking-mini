# 🌐 Smart Parking Web Dashboard

Dashboard quản trị và giao diện người dùng cho hệ thống đỗ xe thông minh, được xây dựng bằng React + Vite.

## ✨ Tính năng

### 👨‍💼 Admin Dashboard
- **Quản lý người dùng**: Tạo/sửa/xóa tài khoản, gán role
- **Quản lý roles**: Tạo/xóa các vai trò trong hệ thống
- **Quản lý chỗ đỗ**: Cập nhật trạng thái (Available/Occupied/Reserved)
- **Theo dõi đặt chỗ**: Xem tất cả đặt chỗ của users theo thời gian
- **Lịch sử đậu xe**: Xem toàn bộ lịch sử check-in/check-out

### 👤 User Interface
- **Đăng nhập/Đăng ký**: Authentication với JWT
- **Xem chỗ đỗ**: Danh sách chỗ đỗ available/occupied
- **Đặt chỗ**: Đặt chỗ trước với thời gian check-in/check-out
- **Lịch sử cá nhân**: Xem lịch sử đỗ xe của bản thân
- **Quản lý hồ sơ**: Cập nhật thông tin cá nhân

## 🛠️ Công nghệ sử dụng

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **UI Framework**: Bootstrap 5
- **Routing**: React Router DOM
- **HTTP Client**: Fetch API
- **Authentication**: JWT Token + LocalStorage

## 📁 Cấu trúc project

```
webapp/
├── 📁 src/
│   ├── 📁 components/     # Shared components
│   │   └── BackButton.jsx
│   ├── 📁 models/         # API wrappers
│   │   ├── UserModel.js
│   │   ├── SlotModel.js
│   │   ├── ParkingModel.js
│   │   └── ReservationModel.js
│   ├── 📁 pages/          # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Profile.jsx
│   │   ├── Slots.jsx
│   │   ├── UserHistory.jsx
│   │   └── 📁 admin/      # Admin-only pages
│   │       ├── Users.jsx
│   │       ├── Roles.jsx
│   │       ├── Slots.jsx
│   │       ├── History.jsx
│   │       └── Reservations.jsx
│   ├── api.js             # HTTP client setup
│   ├── auth.js            # Authentication helpers
│   ├── App.jsx            # Main app component
│   └── main.jsx           # Entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md              # This file
```

## 🚀 Cài đặt và chạy

### Yêu cầu
- Node.js 18.x trở lên
- npm hoặc yarn
- Backend API đang chạy

### Các bước cài đặt

1. **Clone và di chuyển vào thư mục**
```bash
cd webapp
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình môi trường**
Tạo file `.env` (nếu cần):
```env
VITE_API_BASE=http://localhost:8888/api
```

4. **Chạy development server**
```bash
npm run dev
```

App sẽ chạy tại `http://localhost:5173`

5. **Build cho production**
```bash
npm run build
```

## 👤 Tài khoản demo

- **Admin**: `admin@smartparking.com` / `admin123`
- **User**: `nguyenvana@email.com` / `123456`

## 🔑 Các tính năng chính

### Authentication Flow
1. User đăng nhập qua `/login`
2. Sau khi đăng nhập thành công, JWT token được lưu vào localStorage
3. Navbar hiển thị email và menu Admin (nếu là admin)
4. Route protection dựa trên role (Admin/Driver)

### Admin Features
- **CRUD Users**: Tạo tài khoản mới, sửa thông tin, xóa user, gán role
- **CRUD Roles**: Tạo role mới (VD: MANAGER), xóa role không dùng
- **Quản lý Slots**: Thay đổi trạng thái chỗ đỗ thủ công
- **Monitor Reservations**: Xem tất cả đặt chỗ của users
- **System History**: Lịch sử đỗ xe toàn hệ thống

### User Features  
- **Browse Slots**: Xem danh sách chỗ đỗ với filter "chỉ hiển thị chỗ trống"
- **Make Reservations**: Đặt chỗ với form chọn thời gian check-in/check-out
- **Constraints**: Tối đa 3 đặt chỗ active, không được đặt trùng thời gian
- **Cancel Reservations**: Hủy đặt chỗ trước thời gian check-in
- **Personal History**: Xem lịch sử đỗ xe cá nhân với phân trang

## 🔒 Bảo mật

- **JWT Authentication**: Tất cả API calls có Bearer token
- **Role-based Access**: Admin/Driver routes được bảo vệ
- **Input Validation**: Form validation ở client và server
- **XSS Protection**: Sử dụng textContent thay vì innerHTML

## 📱 Responsive Design

- **Mobile-first**: Bootstrap responsive grid
- **Adaptive UI**: Navbar collapse trên mobile
- **Touch-friendly**: Buttons và forms thân thiện với touch

## 🎨 UI/UX Features

- **Loading States**: Spinner khi đang fetch data
- **Error Handling**: Alert messages cho lỗi API
- **Success Feedback**: Thông báo khi thao tác thành công
- **Confirmation Dialogs**: Confirm trước khi xóa
- **Back Navigation**: Back button trên mọi page

## 🔌 API Integration

Web app kết nối với backend qua REST API:

### Authentication Endpoints
- `POST /auth/login` - Đăng nhập
- `GET /auth/profile` - Lấy thông tin user hiện tại

### Users Management (Admin)
- `GET /users` - Danh sách users
- `POST /users` - Tạo user mới
- `PUT /users/:id` - Cập nhật user
- `DELETE /users/:id` - Xóa user
- `POST /users/:id/role` - Gán role

### Roles Management (Admin)
- `GET /users/admin/roles` - Danh sách roles
- `POST /users/admin/roles` - Tạo role
- `DELETE /users/admin/roles/:id` - Xóa role

### Parking Slots
- `GET /slots` - Tất cả chỗ đỗ
- `GET /slots/available` - Chỗ đỗ trống
- `PUT /slots/:id/status` - Cập nhật trạng thái (Admin)

### Reservations
- `GET /reservations` - Đặt chỗ của user hiện tại
- `POST /reservations` - Tạo đặt chỗ mới
- `DELETE /reservations/:id` - Hủy đặt chỗ
- `GET /reservations/admin/all` - Tất cả đặt chỗ (Admin)

### Parking History
- `GET /parking/history` - Lịch sử của user hiện tại
- `GET /parking/admin/all` - Lịch sử toàn hệ thống (Admin)

## 🐛 Troubleshooting

### Common Issues

1. **Không load được data**
   - Kiểm tra backend có đang chạy không
   - Xem Network tab trong DevTools
   - Kiểm tra CORS settings

2. **Login thất bại**
   - Verify email/password đúng chưa
   - Kiểm tra JWT_SECRET trong backend .env
   - Clear localStorage và thử lại

3. **Admin features không hiện**
   - Kiểm tra role trong localStorage.user
   - Đảm bảo user có role ADMIN trong database
   - Logout/login lại để refresh token

4. **Đặt chỗ bị lỗi**
   - Kiểm tra bảng parking_reservations đã được tạo chưa
   - Verify constraints: max 3 active, no overlap
   - Xem Console để debug error messages

### Debug Tips

```javascript
// Check current user info
console.log('User:', JSON.parse(localStorage.getItem('user')));
console.log('Token:', localStorage.getItem('token'));

// Test API manually
fetch('http://localhost:8888/api/auth/profile', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.json()).then(console.log);
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repo to Vercel
2. Set environment variables
3. Deploy automatically on push

### Manual Build
```bash
npm run build
# Upload dist/ folder to web server
```

## 📝 Development Notes

- Component structure follows feature-based organization
- API calls are abstracted in Model classes
- Authentication state is managed globally
- Bootstrap components provide consistent styling
- React Router handles client-side routing
- Vite provides fast hot-reload development

## 🤝 Contributing

1. Follow existing code style
2. Add PropTypes for new components  
3. Test on both admin and user accounts
4. Ensure responsive design
5. Update README for new features