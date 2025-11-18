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

/**
 * @swagger
 * /api/parking/admin/checkin:
 *   post:
 *     summary: Admin - Check-in cho user bất kỳ
 *     tags: [Parking History]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slot_id, user_id]
 *             properties:
 *               slot_id:
 *                 type: integer
 *               user_id:
 *                 type: string
 *                 format: uuid
 *           example:
 *             slot_id: 1
 *             user_id: "uuid-user"
 *     responses:
 *       201:
 *         description: Check-in thành công
 *       400:
 *         description: Lỗi đầu vào hoặc user đã check-in
 *       403:
 *         description: Không có quyền
 *
 * /api/parking/admin/checkout:
 *   post:
 *     summary: Admin - Check-out cho user bất kỳ
 *     tags: [Parking History]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id]
 *             properties:
 *               user_id:
 *                 type: string
 *                 format: uuid
 *           example:
 *             user_id: "uuid-user"
 *     responses:
 *       200:
 *         description: Check-out thành công
 *       400:
 *         description: Không có phiên đỗ xe nào đang hoạt động
 *       403:
 *         description: Không có quyền
 */
// Admin thao tác check-in/check-out cho user bất kỳ
router.post('/admin/checkin', authMiddleware.requireAdmin, parkingController.checkInForUser);
router.post('/admin/checkout', authMiddleware.requireAdmin, parkingController.checkOutForUser);

// Admin history
router.get('/admin/all', authMiddleware.requireAdmin, parkingController.adminListHistory);

module.exports = router;