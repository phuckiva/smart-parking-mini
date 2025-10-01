# 🚀 Smart Parking Backend API

RESTful API server cho hệ thống đỗ xe thông minh, được xây dựng bằng Node.js + Express + Supabase PostgreSQL.

## ✨ Tính năng

### 🔐 Authentication & Authorization
- **JWT Authentication**: Secure login với Bearer token
- **Role-based Access Control**: Admin/Driver permissions
- **Password Hashing**: bcryptjs cho bảo mật password
- **Profile Management**: Cập nhật thông tin user

### 👥 User Management (Admin Only)
- **CRUD Users**: Tạo/sửa/xóa tài khoản người dùng
- **Role Assignment**: Gán role cho users
- **User Listing**: Phân trang và tìm kiếm users
- **Profile Access**: Admin xem được profile tất cả users

### 🏷️ Roles Management (Admin Only)
- **CRUD Roles**: Tạo/xóa các vai trò trong hệ thống
- **Role Validation**: Kiểm tra role tồn tại khi gán
- **System Roles**: ADMIN, DRIVER roles được bảo vệ

### 🅿️ Parking Slots Management
- **Real-time Status**: Available/Occupied/Reserved/Maintenance
- **Admin Control**: Cập nhật trạng thái slots thủ công
- **Location Tracking**: floor_number, slot_number để định vị
- **Availability API**: Endpoints riêng cho slots trống

### 📅 Reservations System
- **Time-based Booking**: Đặt chỗ với check-in/check-out time
- **Business Rules**: Max 3 active reservations per user
- **Overlap Prevention**: Không cho đặt trùng thời gian
- **Auto-cancellation**: Hủy đặt chỗ khi quá thời gian
- **Admin Monitoring**: Admin xem tất cả reservations

### 📊 Parking History
- **Activity Logging**: Ghi lại mọi check-in/check-out
- **User History**: Lịch sử cá nhân với phân trang
- **System Analytics**: Admin xem toàn bộ lịch sử
- **Time Tracking**: Duration tính toán tự động

## 🛠️ Công nghệ sử dụng

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL via Supabase
- **Authentication**: JSON Web Tokens (JWT)
- **Password Security**: bcryptjs hashing
- **Validation**: Express built-in validators
- **Documentation**: Swagger/OpenAPI 3.0
- **Environment**: dotenv config

## 📁 Cấu trúc project

```
backend/
├── 📁 src/
│   ├── 📁 api/                    # Route definitions
│   │   ├── index.js               # Main router
│   │   ├── auth.routes.js         # Authentication routes
│   │   ├── users.routes.js        # User management routes
│   │   ├── slots.routes.js        # Parking slots routes
│   │   ├── reservations.routes.js # Reservation routes
│   │   └── parking.routes.js      # Parking history routes
│   ├── 📁 controllers/            # Business logic
│   │   ├── auth.controller.js     # Login/profile logic
│   │   ├── users.controller.js    # User CRUD logic
│   │   ├── roles.controller.js    # Role management logic
│   │   ├── slots.controller.js    # Parking slots logic
│   │   ├── reservations.controller.js # Booking logic
│   │   └── parking.controller.js  # History tracking logic
│   ├── 📁 models/                 # Database models
│   │   ├── index.js               # Models registry
│   │   ├── users.model.js         # User model
│   │   ├── roles.model.js         # Role model
│   │   ├── userRoles.model.js     # User-Role junction
│   │   ├── parkingSlots.model.js  # Parking slot model
│   │   ├── reservations.model.js  # Reservation model
│   │   └── parkingHistory.model.js # History model
│   ├── 📁 middlewares/            # Custom middlewares
│   │   └── auth.middleware.js     # JWT verification
│   ├── 📁 services/               # External services
│   │   ├── db.js                  # Supabase client
│   │   └── slots.service.js       # Slot business logic
│   ├── 📁 utils/                  # Helper utilities
│   │   └── response.handler.js    # Standardized responses
│   └── 📁 config/                 # Configuration
│       └── swagger.js             # API documentation
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── db.js                          # Database connection
├── server.js                      # Express server setup
├── package.json                   # Dependencies
└── README.md                      # This file
```

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 18.x trở lên
- npm hoặc yarn
- Tài khoản Supabase
- PostgreSQL database đã setup

### Các bước cài đặt

1. **Clone và di chuyển vào thư mục**
```bash
cd backend
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình môi trường**
```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration  
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=8888
NODE_ENV=development
```

4. **Setup Database**
- Đảm bảo đã chạy script `database/complete_setup.sql` trong Supabase
- Kiểm tra tất cả 6 tables đã được tạo

5. **Chạy development server**
```bash
npm start
```

Server sẽ chạy tại `http://localhost:8888`

6. **Kiểm tra API Documentation**
Truy cập `http://localhost:8888/api-docs` để xem Swagger documentation

## 📋 API Endpoints

### 🔐 Authentication
```http
POST   /api/auth/login          # Đăng nhập
GET    /api/auth/profile        # Lấy thông tin user hiện tại
PUT    /api/auth/profile        # Cập nhật thông tin cá nhân
```

### 👥 Users Management (Admin Only)
```http
GET    /api/users               # Danh sách users (với phân trang)
POST   /api/users               # Tạo user mới
GET    /api/users/:id           # Chi tiết user
PUT    /api/users/:id           # Cập nhật user
DELETE /api/users/:id           # Xóa user
POST   /api/users/:id/role      # Gán role cho user
```

### 🏷️ Roles Management (Admin Only)
```http
GET    /api/users/admin/roles   # Danh sách roles
POST   /api/users/admin/roles   # Tạo role mới
DELETE /api/users/admin/roles/:id # Xóa role
```

### 🅿️ Parking Slots
```http
GET    /api/slots               # Tất cả parking slots
GET    /api/slots/available     # Chỉ slots có sẵn
GET    /api/slots/:id           # Chi tiết slot
PUT    /api/slots/:id/status    # Cập nhật trạng thái (Admin)
```

### 📅 Reservations
```http
GET    /api/reservations        # Reservations của user hiện tại
POST   /api/reservations        # Tạo reservation mới
DELETE /api/reservations/:id    # Hủy reservation
GET    /api/reservations/admin/all # Tất cả reservations (Admin)
```

### 📊 Parking History
```http
GET    /api/parking/history     # Lịch sử của user hiện tại
GET    /api/parking/admin/all   # Lịch sử toàn hệ thống (Admin)
POST   /api/parking/checkin     # Check-in vào slot
POST   /api/parking/checkout    # Check-out khỏi slot
```

## 🗄️ Database Models

### Users Model
```javascript
{
  id: UUID,
  email: String (unique),
  password: String (hashed),
  full_name: String,
  phone: String,
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### Roles Model  
```javascript
{
  id: UUID,
  name: String (unique), // ADMIN, DRIVER, etc.
  description: String,
  created_at: Timestamp
}
```

### Parking Slots Model
```javascript
{
  id: UUID,
  slot_number: String,
  floor_number: Integer,
  status: Enum (Available, Occupied, Reserved, Maintenance),
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### Reservations Model
```javascript
{
  id: UUID,
  user_id: UUID (FK),
  slot_id: UUID (FK),
  check_in_time: Timestamp,
  check_out_time: Timestamp,
  status: Enum (Active, Completed, Cancelled),
  created_at: Timestamp
}
```

### Parking History Model
```javascript
{
  id: UUID,
  user_id: UUID (FK),
  slot_id: UUID (FK),
  check_in_time: Timestamp,
  check_out_time: Timestamp (nullable),
  duration_minutes: Integer (calculated),
  created_at: Timestamp
}
```

## 🔒 Security Features

### Authentication Security
- **JWT Tokens**: Stateless authentication
- **Token Expiration**: Configurable expire time
- **Password Hashing**: bcryptjs with salt rounds
- **Role-based Guards**: Middleware protection

### Input Validation
```javascript
// Example validation in controller
const { email, password } = req.body;
if (!email || !password) {
  return res.status(400).json({ error: 'Email and password required' });
}
```

### Error Handling
```javascript
// Standardized error responses
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-10-01T10:00:00Z"
}
```

### Database Security
- **Row Level Security (RLS)**: Enabled on all tables
- **Service Role Key**: Server-side only access
- **SQL Injection Prevention**: Parameterized queries
- **Foreign Key Constraints**: Data integrity

## 📊 Business Logic

### Reservation Constraints
```javascript
// Maximum 3 active reservations per user
const activeCount = await reservationModel.countActive(userId);
if (activeCount >= 3) {
  throw new Error('Maximum 3 active reservations allowed');
}

// No overlapping reservations for same user
const overlapping = await reservationModel.checkOverlap(
  userId, checkInTime, checkOutTime
);
if (overlapping.length > 0) {
  throw new Error('Cannot book overlapping time slots');
}
```

### Slot Status Management
```javascript
// Auto-update slot status based on reservations
const updateSlotStatus = async (slotId) => {
  const activeReservation = await reservationModel.getActiveForSlot(slotId);
  const newStatus = activeReservation ? 'Reserved' : 'Available';
  await slotModel.updateStatus(slotId, newStatus);
};
```

### History Tracking
```javascript
// Auto-calculate duration on checkout
const checkOut = async (userId, slotId) => {
  const history = await parkingModel.getActiveSession(userId, slotId);
  const duration = Date.now() - new Date(history.check_in_time);
  await parkingModel.completeSession(history.id, duration);
};
```

## 🔌 External Integrations

### Supabase Integration
```javascript
// Database client setup
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

### JWT Implementation
```javascript
// Token generation
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);
```

## 🧪 Testing

### Manual Testing
```bash
# Test authentication
curl -X POST http://localhost:8888/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartparking.com","password":"admin123"}'

# Test protected endpoint
curl -X GET http://localhost:8888/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### API Testing với Postman
1. Import Swagger documentation
2. Set up environment variables
3. Test authentication flow
4. Validate all CRUD operations

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
```bash
Error: Invalid API key or URL
```
**Solution**: Kiểm tra SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env

2. **JWT Token Invalid**
```bash
Error: jwt malformed
```
**Solution**: Kiểm tra JWT_SECRET, đảm bảo token format đúng

3. **Permission Denied**
```bash
Error: Insufficient permissions
```
**Solution**: Kiểm tra user có đúng role không, verify middleware hoạt động

4. **Table Not Found**
```bash
Error: relation "parking_reservations" does not exist
```
**Solution**: Chạy lại database/complete_setup.sql script

### Debug Commands
```bash
# Check server logs
npm start

# Test database connection
node -e "require('./src/services/db.js').testConnection()"

# Validate JWT token
node -e "console.log(require('jsonwebtoken').verify('TOKEN', process.env.JWT_SECRET))"
```

### Environment Validation
```javascript
// Add to server.js for debugging
console.log('Environment Check:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Missing');
console.log('NODE_ENV:', process.env.NODE_ENV);
```

## 📈 Performance Optimization

### Database Optimization
- **Indexes**: Added on frequently queried columns
- **Pagination**: Implemented for large datasets
- **Connection Pooling**: Supabase handles automatically
- **Query Optimization**: Select only needed columns

### Caching Strategy
```javascript
// Example: Cache user roles
const userRolesCache = new Map();
const getUserRole = async (userId) => {
  if (userRolesCache.has(userId)) {
    return userRolesCache.get(userId);
  }
  const role = await userModel.getRole(userId);
  userRolesCache.set(userId, role);
  return role;
};
```

## 🚀 Deployment

### Production Setup
1. **Environment Variables**
```env
NODE_ENV=production
PORT=8888
SUPABASE_URL=https://production-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=production-key
JWT_SECRET=super-secure-production-secret
```

2. **Process Management**
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name smart-parking-api
pm2 startup
pm2 save
```

3. **Health Check Endpoint**
```javascript
// Add to server.js
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8888
CMD ["npm", "start"]
```

## 🤝 Development Guidelines

### Code Style
- Use async/await over Promises
- Consistent error handling patterns
- JSDoc comments for complex functions
- Modular architecture with clear separation

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-endpoint
git commit -m "feat: add new reservation endpoint"
git push origin feature/new-endpoint
```

### Adding New Endpoints
1. Create route in `src/api/`
2. Implement controller in `src/controllers/`
3. Add model if needed in `src/models/`
4. Update Swagger documentation
5. Test with Postman/curl

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Complete authentication system
- ✅ User and role management
- ✅ Parking slots CRUD
- ✅ Reservations system with constraints
- ✅ Parking history tracking
- ✅ Swagger documentation
- ✅ Role-based access control

### Future Enhancements
- [ ] Real-time WebSocket updates
- [ ] Email notifications
- [ ] Payment integration
- [ ] Advanced analytics
- [ ] Mobile push notifications
- [ ] Multi-tenant support