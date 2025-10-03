const express = require('express');
const slotsController = require('../controllers/slots.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Parking Slots
 *   description: API quản lý chỗ đỗ xe
 */

// Tất cả routes slots đều cần xác thực
router.use(authMiddleware.authenticate);

// Routes công khai (cho tất cả user đã đăng nhập)
router.get('/available', slotsController.getAvailableSlots);
router.get('/available-by-time', slotsController.getAvailableSlotsByTimeRange);
router.get('/', slotsController.getAllSlots);
router.get('/:id', slotsController.getSlotById);

// Routes cần quyền driver trở lên (driver có thể cập nhật trạng thái khi checkin/checkout)
router.put('/:id/status', authMiddleware.requireDriver, slotsController.updateSlotStatus);

// Routes chỉ dành cho admin
router.post('/', authMiddleware.requireAdmin, slotsController.createSlot);
router.delete('/:id', authMiddleware.requireAdmin, slotsController.deleteSlot);

module.exports = router;