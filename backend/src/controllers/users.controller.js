// Controller cơ bản cho users (có thể mở rộng sau)
const responseHandler = require('../utils/response.handler');

class UsersController {
    // GET /api/users - Lấy danh sách người dùng
    async getAllUsers(req, res) {
        try {
            // Tạm thời trả về dữ liệu mẫu
            const users = [
                { id: 1, name: 'Người dùng 1', email: 'user1@example.com' },
                { id: 2, name: 'Người dùng 2', email: 'user2@example.com' }
            ];
            responseHandler.success(res, users, 'Lấy danh sách người dùng thành công');
        } catch (error) {
            responseHandler.error(res, error.message, 500);
        }
    }

    // GET /api/users/:id - Lấy người dùng theo ID
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            // Tạm thời trả về dữ liệu mẫu
            const user = { id: parseInt(id), name: `Người dùng ${id}`, email: `user${id}@example.com` };
            responseHandler.success(res, user, 'Lấy thông tin người dùng thành công');
        } catch (error) {
            responseHandler.error(res, error.message, 500);
        }
    }

    // POST /api/users - Tạo người dùng mới
    async createUser(req, res) {
        try {
            const userData = req.body;
            // Tạm thời trả về dữ liệu mẫu
            const newUser = {
                id: Date.now(),
                ...userData,
                created_at: new Date().toISOString()
            };
            responseHandler.success(res, newUser, 'Tạo người dùng thành công', 201);
        } catch (error) {
            responseHandler.error(res, error.message, 400);
        }
    }
}

module.exports = new UsersController();