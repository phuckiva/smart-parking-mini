const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../services/db');
const { Users, Roles, UserRoles } = require('../models');
// Debug one-time at module load
if (process.env.NODE_ENV !== 'production') {
    try {
        // Log a minimal fingerprint to avoid leaking secrets
        console.log('[Debug] Supabase client type:', typeof supabase);
        console.log('[Debug] Supabase has from():', typeof supabase?.from);
        console.log('[Debug] SUPABASE_URL present:', !!process.env.SUPABASE_URL);
    } catch (e) {
        // no-op
    }
}
const responseHandler = require('../utils/response.handler');

class AuthController {
    /**
     * @swagger
     * /api/auth/login:
     *   post:
     *     summary: Đăng nhập người dùng
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *           example:
     *             email: "nguyenvana@email.com"
     *             password: "123456"
     *     responses:
     *       200:
     *         description: Đăng nhập thành công
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/LoginResponse'
     *       401:
     *         description: Thông tin đăng nhập không chính xác
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       400:
     *         description: Dữ liệu đầu vào không hợp lệ
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                return responseHandler.error(res, 'Email và mật khẩu là bắt buộc', 400);
            }

            // Chuẩn hoá email để tránh lỗi do khoảng trắng/hoa thường
            const emailNorm = String(email).trim().toLowerCase();

            // Tìm user theo email (đã chuẩn hoá) - thử so khớp chính xác trước, nếu không có thử không phân biệt hoa thường
            let user = await Users.findByEmail(emailNorm);
            let userError = null;

            if (process.env.NODE_ENV !== 'production') {
                console.log('[Auth.login] emailNorm=', emailNorm, 'foundUser=', !!user, 'err=', userError?.message);
            }

            if (userError || !user) {
                return responseHandler.error(res, 'Email hoặc mật khẩu không chính xác', 401);
            }

            // Kiểm tra mật khẩu
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Auth.login] user found:', !!user, 'email:', user?.email, 'pwd_valid:', isPasswordValid);
            }
            if (!isPasswordValid) {
                return responseHandler.error(res, 'Email hoặc mật khẩu không chính xác', 401);
            }

            // Lấy role của user (lấy 1 role đầu tiên nếu có nhiều)
            let roleName = 'DRIVER';
            const userRoles = await UserRoles.getRolesForUser(user.id);
            if (Array.isArray(userRoles) && userRoles.length > 0) {
                roleName = userRoles[0]?.roles?.role_name || roleName;
            }

            // Tạo JWT token
            const token = jwt.sign(
                { 
                    userId: user.id,
                    email: user.email,
                    role: roleName
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );

            // Xóa password_hash khỏi response
            const { password_hash, ...userWithoutPassword } = user;

            responseHandler.success(res, {
                user: userWithoutPassword,
                token,
                role: roleName
            }, 'Đăng nhập thành công');

        } catch (error) {
            console.error('Login error:', error);
            responseHandler.error(res, 'Lỗi server nội bộ', 500);
        }
    }

    /**
     * @swagger
     * /api/auth/register:
     *   post:
     *     summary: Đăng ký tài khoản mới
     *     tags: [Authentication]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterRequest'
     *           example:
     *             full_name: "Nguyễn Văn C"
     *             email: "nguyenvanc@email.com"
     *             password: "123456"
     *             license_plate: "51C-11111"
     *     responses:
     *       201:
     *         description: Đăng ký thành công
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       400:
     *         description: Dữ liệu đầu vào không hợp lệ hoặc email đã tồn tại
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async register(req, res) {
        try {
            const { full_name, email, password, license_plate } = req.body;

            // Validation
            if (!full_name || !email || !password) {
                return responseHandler.error(res, 'Họ tên, email và mật khẩu là bắt buộc', 400);
            }

            if (password.length < 6) {
                return responseHandler.error(res, 'Mật khẩu phải có ít nhất 6 ký tự', 400);
            }

            // Kiểm tra email đã tồn tại
            const existingUser = await Users.findByEmail(email);

            if (existingUser) {
                return responseHandler.error(res, 'Email đã được sử dụng', 400);
            }

            // Kiểm tra biển số xe đã tồn tại (nếu có)
            if (license_plate) {
                const existingPlate = await Users.findByLicensePlate(license_plate);
                if (existingPlate) {
                    return responseHandler.error(res, 'Biển số xe đã được sử dụng', 400);
                }
            }

            // Hash password
            const saltRounds = 12;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Tạo user mới
            let newUser;
            try {
                newUser = await Users.create({ full_name, email, password_hash, license_plate: license_plate || null });
            } catch (createError) {
                console.error('Create user error:', createError);
                return responseHandler.error(res, 'Không thể tạo tài khoản', 500);
            }

            // Gán role DRIVER cho user mới
            let driverRole;
            try {
                driverRole = await Roles.findByName('DRIVER');
                if (driverRole) {
                    await UserRoles.addRole(newUser.id, driverRole.id);
                }
            } catch (e) {
                console.error('Assign role error:', e);
            }

            // Xóa password_hash khỏi response
            const { password_hash: _, ...userWithoutPassword } = newUser;

            responseHandler.success(res, userWithoutPassword, 'Đăng ký thành công', 201);

        } catch (error) {
            console.error('Register error:', error);
            responseHandler.error(res, 'Lỗi server nội bộ', 500);
        }
    }

    /**
     * @swagger
     * /api/auth/profile:
     *   get:
     *     summary: Lấy thông tin profile người dùng hiện tại
     *     tags: [Authentication]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Thông tin profile
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       401:
     *         description: Chưa đăng nhập hoặc token không hợp lệ
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async getProfile(req, res) {
        try {
            const userId = req.user.userId;

            const { data: user, error } = await supabase
                .from('users')
                .select('id, full_name, email, license_plate, created_at')
                .eq('id', userId)
                .single();

            if (error || !user) {
                return responseHandler.error(res, 'Không tìm thấy thông tin người dùng', 404);
            }

            // Lấy role của user
            let roleName = 'DRIVER';
            const userRoles = await UserRoles.getRolesForUser(userId);

            if (Array.isArray(userRoles) && userRoles.length > 0) {
                roleName = userRoles[0]?.roles?.role_name || roleName;
            }

            responseHandler.success(res, { ...user, role: roleName }, 'Lấy thông tin profile thành công');

        } catch (error) {
            console.error('Get profile error:', error);
            responseHandler.error(res, 'Lỗi server nội bộ', 500);
        }
    }
}

module.exports = new AuthController();