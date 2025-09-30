// Middleware xác thực đơn giản
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

    // Middleware xác thực token JWT (có thể mở rộng sau)
    validateToken(req, res, next) {
        const token = req.headers['authorization'];
        
        if (!token) {
            return responseHandler.error(res, 'Token is required', 401);
        }
        
        // Tạm thời bypass xác thực token
        // TODO: Implement JWT validation
        next();
    }

    // Middleware kiểm tra quyền admin
    requireAdmin(req, res, next) {
        // Tạm thời cho phép tất cả
        // TODO: Implement role-based authorization
        next();
    }
}

module.exports = new AuthMiddleware();