const jwt = require('jsonwebtoken');
const responseHandler = require('../utils/response.handler');

class AuthMiddleware {
    // Middleware kiểm tra API key đơn giản
    validateApiKey(req, res, next) {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            return responseHandler.error(res, 'API key is required', 401);
        }
        
        // Kiểm tra API key (tạm thời dùng giá trị cố định)
        const validApiKey = process.env.API_KEY || 'smart-parking-2025';
        
        if (apiKey !== validApiKey) {
            return responseHandler.error(res, 'Invalid API key', 401);
        }
        
        next();
    }

    // Middleware xác thực token JWT
    authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return responseHandler.error(res, 'Token không được cung cấp', 401);
            }

            const token = authHeader.substring(7); // Bỏ "Bearer " ở đầu
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            req.user = decoded;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return responseHandler.error(res, 'Token đã hết hạn', 401);
            } else if (error.name === 'JsonWebTokenError') {
                return responseHandler.error(res, 'Token không hợp lệ', 401);
            }
            return responseHandler.error(res, 'Lỗi xác thực', 401);
        }
    }

    // Middleware xác thực token JWT (backward compatibility)
    validateToken(req, res, next) {
        return this.authenticate(req, res, next);
    }

    // Middleware kiểm tra quyền admin
    requireAdmin(req, res, next) {
        try {
            if (!req.user) {
                return responseHandler.error(res, 'Chưa được xác thực', 401);
            }

            if (req.user.role !== 'ADMIN') {
                return responseHandler.error(res, 'Không có quyền truy cập', 403);
            }

            next();
        } catch (error) {
            return responseHandler.error(res, 'Lỗi kiểm tra quyền', 500);
        }
    }

    // Middleware kiểm tra quyền driver hoặc admin
    requireDriver(req, res, next) {
        try {
            if (!req.user) {
                return responseHandler.error(res, 'Chưa được xác thực', 401);
            }

            if (req.user.role !== 'DRIVER' && req.user.role !== 'ADMIN') {
                return responseHandler.error(res, 'Không có quyền truy cập', 403);
            }

            next();
        } catch (error) {
            return responseHandler.error(res, 'Lỗi kiểm tra quyền', 500);
        }
    }
}

module.exports = new AuthMiddleware();