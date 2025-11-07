const express = require('express');
const parkingController = require('../controllers/parking.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parking History
 *   description: API quản lý lịch sử đỗ xe
 */

// Tất cả routes parking đều cần xác thực và quyền driver trở lên
router.use(authMiddleware.authenticate);

// Middleware cho admin để có thể thao tác thay mặt user khác
const adminOverrideMiddleware = (req, res, next) => {
    // Nếu là admin và có user_id trong body, cho phép override
    if (req.user.role === 'ADMIN' && req.body.user_id) {
        return next();
    }
    // Nếu không phải admin, yêu cầu quyền driver
    return authMiddleware.requireDriver(req, res, next);
};

router.use(adminOverrideMiddleware);

// Routes cho parking history
router.post('/checkin', parkingController.checkIn);
router.post('/checkout', parkingController.checkOut);
router.get('/history', parkingController.getMyHistory);
router.get('/current', parkingController.getCurrentSession);

// Admin history
router.get('/admin/all', authMiddleware.requireAdmin, parkingController.adminListHistory);

module.exports = router;