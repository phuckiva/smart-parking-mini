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
router.use(authMiddleware.requireDriver);

// Routes cho parking history
router.post('/checkin', parkingController.checkIn);
router.post('/checkout', parkingController.checkOut);
router.get('/history', parkingController.getMyHistory);
router.get('/current', parkingController.getCurrentSession);

// Admin history
router.get('/admin/all', authMiddleware.requireAdmin, parkingController.adminListHistory);

module.exports = router;