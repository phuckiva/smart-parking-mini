const supabase = require('../services/db');
const responseHandler = require('../utils/response.handler');

class UsersController {
    /**
     * @swagger
     * /api/users:
     *   get:
     *     summary: Lấy danh sách người dùng
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *         description: Số trang
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 10
     *         description: Số lượng bản ghi trên mỗi trang
     *     responses:
     *       200:
     *         description: Danh sách người dùng
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 data:
     *                   type: object
     *                   properties:
     *                     users:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/User'
     *                     pagination:
     *                       type: object
     *                       properties:
     *                         page:
     *                           type: integer
     *                         limit:
     *                           type: integer
     *                         total:
     *                           type: integer
     *                         totalPages:
     *                           type: integer
     *       401:
     *         description: Chưa được xác thực
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Đếm tổng số users
            const { count, error: countError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            if (countError) {
                console.error('Count users error:', countError);
                return responseHandler.error(res, 'Lỗi khi đếm số lượng người dùng', 500);
            }

            // Lấy danh sách users với phân trang và thông tin role
            const { data: users, error } = await supabase
                .from('users')
                .select(`
                    id, full_name, email, license_plate, created_at,
                    user_roles(
                        roles(role_name)
                    )
                `)
                .range(offset, offset + limit - 1)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Get users error:', error);
                return responseHandler.error(res, 'Lỗi khi lấy danh sách người dùng', 500);
            }

            // Format dữ liệu để trả về
            const formattedUsers = (users || []).map(user => {
                // user_roles có thể null hoặc array tuỳ join
                let roleName = null;
                if (user.user_roles && Array.isArray(user.user_roles)) {
                    roleName = user.user_roles[0]?.roles?.role_name || null;
                } else if (user.user_roles && typeof user.user_roles === 'object') {
                    roleName = user.user_roles.roles?.role_name || null;
                }
                return {
                    ...user,
                    role: roleName || 'UNASSIGNED',
                    user_roles: undefined,
                };
            });

            const totalPages = Math.ceil(count / limit);

            responseHandler.success(res, {
                users: formattedUsers,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages
                }
            }, 'Lấy danh sách người dùng thành công');

        } catch (error) {
            console.error('Get all users error:', error);
            responseHandler.error(res, 'Lỗi server nội bộ', 500);
        }
    }

    /**
     * @swagger
     * /api/users/{id}:
     *   get:
     *     summary: Lấy thông tin người dùng theo ID
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: ID của người dùng
     *     responses:
     *       200:
     *         description: Thông tin người dùng
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 message:
     *                   type: string
     *                 data:
     *                   $ref: '#/components/schemas/User'
     *       404:
     *         description: Không tìm thấy người dùng
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Chưa được xác thực
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async getUserById(req, res) {
        try {
            const { id } = req.params;

            const { data: user, error } = await supabase
                .from('users')
                .select(`
                    id, full_name, email, license_plate, created_at,
                    user_roles(
                        roles(role_name)
                    )
                `)
                .eq('id', id)
                .single();

            if (error || !user) {
                return responseHandler.error(res, 'Không tìm thấy người dùng', 404);
            }

            // Format dữ liệu để trả về
            let roleName = null;
            if (user.user_roles && Array.isArray(user.user_roles)) {
                roleName = user.user_roles[0]?.roles?.role_name || null;
            } else if (user.user_roles && typeof user.user_roles === 'object') {
                roleName = user.user_roles.roles?.role_name || null;
            }
            const formattedUser = {
                ...user,
                role: roleName || 'UNASSIGNED',
                user_roles: undefined
            };

            responseHandler.success(res, formattedUser, 'Lấy thông tin người dùng thành công');

        } catch (error) {
            console.error('Get user by ID error:', error);
            responseHandler.error(res, 'Lỗi server nội bộ', 500);
        }
    }

    /**
     * @swagger
     * /api/users:
     *   post:
     *     summary: Tạo người dùng mới (chỉ dành cho admin)
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RegisterRequest'
     *           example:
     *             full_name: "Nguyễn Văn D"
     *             email: "nguyenvand@email.com"
     *             password: "123456"
     *             license_plate: "51D-22222"
     *     responses:
     *       201:
     *         description: Tạo người dùng thành công
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       400:
     *         description: Dữ liệu đầu vào không hợp lệ
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Không có quyền truy cập
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       401:
     *         description: Chưa được xác thực
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async createUser(req, res) {
        try {
            // Chỉ admin mới có thể tạo user qua endpoint này
            if (req.user.role !== 'ADMIN') {
                return responseHandler.error(res, 'Không có quyền tạo người dùng', 403);
            }

            const { full_name, email, password, license_plate } = req.body;

            // Validation
            if (!full_name || !email || !password) {
                return responseHandler.error(res, 'Họ tên, email và mật khẩu là bắt buộc', 400);
            }

            if (password.length < 6) {
                return responseHandler.error(res, 'Mật khẩu phải có ít nhất 6 ký tự', 400);
            }

            // Kiểm tra email đã tồn tại
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (existingUser) {
                return responseHandler.error(res, 'Email đã được sử dụng', 400);
            }

            // Kiểm tra biển số xe đã tồn tại (nếu có)
            if (license_plate) {
                const { data: existingPlate } = await supabase
                    .from('users')
                    .select('id')
                    .eq('license_plate', license_plate)
                    .single();

                if (existingPlate) {
                    return responseHandler.error(res, 'Biển số xe đã được sử dụng', 400);
                }
            }

            // Hash password
            const bcrypt = require('bcryptjs');
            const saltRounds = 12;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Tạo user mới
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert([{
                    full_name,
                    email,
                    password_hash,
                    license_plate: license_plate || null
                }])
                .select()
                .single();

            if (createError) {
                console.error('Create user error:', createError);
                return responseHandler.error(res, 'Không thể tạo tài khoản', 500);
            }

            // Gán role DRIVER cho user mới
            const { data: driverRole } = await supabase
                .from('roles')
                .select('id')
                .eq('role_name', 'DRIVER')
                .single();

            if (driverRole) {
                await supabase
                    .from('user_roles')
                    .insert([{
                        user_id: newUser.id,
                        role_id: driverRole.id
                    }]);
            }

            // Xóa password_hash khỏi response
            const { password_hash: _, ...userWithoutPassword } = newUser;

            responseHandler.success(res, userWithoutPassword, 'Tạo người dùng thành công', 201);

        } catch (error) {
            console.error('Create user error:', error);
            responseHandler.error(res, 'Lỗi server nội bộ', 500);
        }
    }

    /**
     * @swagger
     * /api/users/me:
     *   put:
     *     summary: Cập nhật hồ sơ người dùng hiện tại
     *     tags: [Users]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               full_name:
     *                 type: string
     *               license_plate:
     *                 type: string
     *     responses:
     *       200:
     *         description: Cập nhật thành công
     */
    async updateMe(req, res) {
        try {
            const userId = req.user.userId;
            const { full_name, license_plate } = req.body || {};
            const payload = {};
            if (typeof full_name === 'string') payload.full_name = full_name;
            if (typeof license_plate === 'string') payload.license_plate = license_plate || null;
            if (Object.keys(payload).length === 0) {
                return responseHandler.error(res, 'Không có dữ liệu để cập nhật', 400);
            }
            const { data, error } = await supabase
                .from('users')
                .update(payload)
                .eq('id', userId)
                .select('id, full_name, email, license_plate')
                .single();
            if (error) return responseHandler.error(res, error.message, 400);
            return responseHandler.success(res, data, 'Cập nhật thành công');
        } catch (e) {
            return responseHandler.error(res, e.message || 'Lỗi khi cập nhật', 500);
        }
    }

    // Admin: cập nhật thông tin user bất kỳ (họ tên, biển số)
    async updateUserByAdmin(req, res) {
        try {
            if (req.user.role !== 'ADMIN') return responseHandler.error(res, 'Không có quyền', 403);
            const { id } = req.params;
            const { full_name, license_plate } = req.body || {};
            const payload = {};
            if (typeof full_name === 'string') payload.full_name = full_name;
            if (typeof license_plate === 'string') payload.license_plate = license_plate || null;
            if (Object.keys(payload).length === 0) return responseHandler.error(res, 'Không có dữ liệu để cập nhật', 400);
            const { data, error } = await supabase
                .from('users')
                .update(payload)
                .eq('id', id)
                .select('id, full_name, email, license_plate')
                .single();
            if (error) return responseHandler.error(res, error.message, 400);
            return responseHandler.success(res, data, 'Cập nhật người dùng thành công');
        } catch (e) {
            return responseHandler.error(res, e.message || 'Lỗi khi cập nhật người dùng', 500);
        }
    }

    // Admin: xóa user
    async deleteUserByAdmin(req, res) {
        try {
            if (req.user.role !== 'ADMIN') return responseHandler.error(res, 'Không có quyền', 403);
            const { id } = req.params;
            if (!id) return responseHandler.error(res, 'Thiếu id', 400);
            // Xóa mapping role trước
            await supabase.from('user_roles').delete().eq('user_id', id);
            const { error } = await supabase.from('users').delete().eq('id', id);
            if (error) return responseHandler.error(res, error.message, 400);
            return responseHandler.success(res, { id }, 'Đã xóa người dùng');
        } catch (e) {
            return responseHandler.error(res, e.message || 'Lỗi khi xóa người dùng', 500);
        }
    }

    // Admin: gán 1 role cho user (thay thế role cũ)
    async setUserRole(req, res) {
        try {
            if (req.user.role !== 'ADMIN') return responseHandler.error(res, 'Không có quyền', 403);
            const { id } = req.params;
            const { role_name } = req.body || {};
            if (!role_name) return responseHandler.error(res, 'role_name là bắt buộc', 400);
            // lấy role id
            const { data: role, error: roleErr } = await supabase.from('roles').select('id').eq('role_name', role_name.toUpperCase()).single();
            if (roleErr || !role) return responseHandler.error(res, 'Role không tồn tại', 400);
            // set mapping
            await supabase.from('user_roles').delete().eq('user_id', id);
            await supabase.from('user_roles').insert([{ user_id: id, role_id: role.id }]);
            return responseHandler.success(res, { user_id: id, role_name: role_name.toUpperCase() }, 'Đã cập nhật role');
        } catch (e) {
            return responseHandler.error(res, e.message || 'Lỗi khi cập nhật role', 500);
        }
    }
}

module.exports = new UsersController();