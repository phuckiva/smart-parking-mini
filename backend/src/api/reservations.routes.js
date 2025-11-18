const express = require('express');
const router = express.Router();
const reservationsController = require('../controllers/reservations.controller');
const authMiddleware = require('../middlewares/auth.middleware');


/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Lấy danh sách đặt chỗ của tôi
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đặt chỗ
 *   post:
 *     summary: Tạo đặt chỗ mới (người dùng)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slot_id, start_time, end_time]
 *             properties:
 *               slot_id:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Đặt chỗ thành công
 *
 * /api/reservations/{id}:
 *   delete:
 *     summary: Hủy đặt chỗ
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID đặt chỗ
 *     responses:
 *       200:
 *         description: Đã hủy đặt chỗ
 *
 * /api/reservations/admin/all:
 *   get:
 *     summary: Admin - Lấy tất cả đặt chỗ
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số lượng mỗi trang
 *     responses:
 *       200:
 *         description: Danh sách đặt chỗ (admin)
 *
 * /api/reservations/admin/create-user-reservation:
 *   post:
 *     summary: Admin - Tạo đặt chỗ cho user bất kỳ
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [slot_id, user_id, start_time, end_time]
 *             properties:
 *               slot_id:
 *                 type: integer
 *               user_id:
 *                 type: string
 *                 format: uuid
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Đặt chỗ thành công (admin)
 */

// List my active reservations
router.get('/', reservationsController.listMine.bind(reservationsController));
// Create a reservation
router.post('/', reservationsController.create.bind(reservationsController));
// Cancel a reservation
router.delete('/:id', reservationsController.cancel.bind(reservationsController));

// Admin list all reservations
router.get('/admin/all', authMiddleware.requireAdmin, reservationsController.listAll.bind(reservationsController));

// Admin tạo reservation cho user bất kỳ
router.post('/admin/create-user-reservation', authMiddleware.requireAdmin, reservationsController.createForUser.bind(reservationsController));

module.exports = router;
