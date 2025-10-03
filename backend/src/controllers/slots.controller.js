const slotsService = require('../services/slots.service');
const responseHandler = require('../utils/response.handler');

class SlotsController {
    /**
     * @swagger
     * /api/slots:
     *   get:
     *     summary: Lấy danh sách tất cả chỗ đỗ xe
     *     tags: [Parking Slots]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
    *           enum: [AVAILABLE, OCCUPIED, RESERVED]
     *         description: Lọc theo trạng thái chỗ đỗ
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
     *         description: Danh sách chỗ đỗ xe
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
     *                     slots:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/ParkingSlot'
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
    async getAllSlots(req, res) {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const slots = await slotsService.getAllSlots({ status, page: parseInt(page), limit: parseInt(limit) });
            responseHandler.success(res, slots, 'Lấy danh sách chỗ đỗ thành công');
        } catch (error) {
            console.error('Get all slots error:', error);
            responseHandler.error(res, error.message, 500);
        }
    }

    /**
     * @swagger
     * /api/slots/{id}:
     *   get:
     *     summary: Lấy thông tin chỗ đỗ xe theo ID
     *     tags: [Parking Slots]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID của chỗ đỗ xe
     *     responses:
     *       200:
     *         description: Thông tin chỗ đỗ xe
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
     *                   $ref: '#/components/schemas/ParkingSlot'
     *       404:
     *         description: Không tìm thấy chỗ đỗ xe
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
    async getSlotById(req, res) {
        try {
            const { id } = req.params;
            const slot = await slotsService.getSlotById(id);
            
            if (!slot) {
                return responseHandler.error(res, 'Không tìm thấy chỗ đỗ', 404);
            }
            
            responseHandler.success(res, slot, 'Lấy thông tin chỗ đỗ thành công');
        } catch (error) {
            console.error('Get slot by ID error:', error);
            responseHandler.error(res, error.message, 500);
        }
    }

    /**
     * @swagger
     * /api/slots:
     *   post:
     *     summary: Tạo chỗ đỗ xe mới (chỉ dành cho admin)
     *     tags: [Parking Slots]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - slot_name
     *             properties:
     *               slot_name:
     *                 type: string
     *                 description: Tên chỗ đỗ xe
    *               status:
    *                 type: string
    *                 enum: [AVAILABLE, OCCUPIED, RESERVED]
    *                 default: AVAILABLE
     *                 description: Trạng thái ban đầu
     *           example:
     *             slot_name: "C-01"
    *             status: "AVAILABLE"
     *     responses:
     *       201:
     *         description: Tạo chỗ đỗ xe thành công
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
    async createSlot(req, res) {
        try {
            const slotData = req.body;
            const newSlot = await slotsService.createSlot(slotData);
            responseHandler.success(res, newSlot, 'Tạo chỗ đỗ thành công', 201);
        } catch (error) {
            console.error('Create slot error:', error);
            responseHandler.error(res, error.message, 400);
        }
    }

    /**
     * @swagger
     * /api/slots/{id}/status:
     *   put:
     *     summary: Cập nhật trạng thái chỗ đỗ xe
     *     tags: [Parking Slots]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID của chỗ đỗ xe
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - status
     *             properties:
    *               status:
    *                 type: string
    *                 enum: [AVAILABLE, OCCUPIED, RESERVED]
     *                 description: Trạng thái mới của chỗ đỗ xe
     *           example:
    *             status: "OCCUPIED"
     *     responses:
     *       200:
     *         description: Cập nhật trạng thái thành công
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
     *       404:
     *         description: Không tìm thấy chỗ đỗ xe
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
    async updateSlotStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            if (!status) {
                return responseHandler.error(res, 'Trạng thái là bắt buộc', 400);
            }
            
            const updatedSlot = await slotsService.updateSlotStatus(id, status);
            
            if (!updatedSlot) {
                return responseHandler.error(res, 'Không tìm thấy chỗ đỗ', 404);
            }
            
            responseHandler.success(res, updatedSlot, 'Cập nhật trạng thái thành công');
        } catch (error) {
            console.error('Update slot status error:', error);
            responseHandler.error(res, error.message, 500);
        }
    }

    /**
     * @swagger
     * /api/slots/{id}:
     *   delete:
     *     summary: Xóa chỗ đỗ xe (chỉ dành cho admin)
     *     tags: [Parking Slots]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: ID của chỗ đỗ xe
     *     responses:
     *       200:
     *         description: Xóa chỗ đỗ xe thành công
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       404:
     *         description: Không tìm thấy chỗ đỗ xe
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
    async deleteSlot(req, res) {
        try {
            const { id } = req.params;
            const deletedSlot = await slotsService.deleteSlot(id);
            
            if (!deletedSlot) {
                return responseHandler.error(res, 'Không tìm thấy chỗ đỗ', 404);
            }
            
            responseHandler.success(res, deletedSlot, 'Xóa chỗ đỗ thành công');
        } catch (error) {
            console.error('Delete slot error:', error);
            responseHandler.error(res, error.message, 500);
        }
    }

    /**
     * @swagger
     * /api/slots/available:
     *   get:
     *     summary: Lấy danh sách chỗ đỗ xe trống
     *     tags: [Parking Slots]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Danh sách chỗ đỗ xe trống
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
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/ParkingSlot'
     *       401:
     *         description: Chưa được xác thực
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async getAvailableSlots(req, res) {
        try {
            const availableSlots = await slotsService.getAvailableSlots();
            responseHandler.success(res, availableSlots, 'Lấy danh sách chỗ đỗ trống thành công');
        } catch (error) {
            console.error('Get available slots error:', error);
            responseHandler.error(res, error.message, 500);
        }
    }

    /**
     * @swagger
     * /api/slots/available-by-time:
     *   get:
     *     summary: Lấy danh sách chỗ đỗ có thể đặt trong khoảng thời gian
     *     tags: [Parking Slots]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: start_time
     *         required: true
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Thời gian bắt đầu (ISO 8601)
     *         example: "2025-10-05T10:00:00Z"
     *       - in: query
     *         name: end_time
     *         required: true
     *         schema:
     *           type: string
     *           format: date-time
     *         description: Thời gian kết thúc (ISO 8601)
     *         example: "2025-10-05T13:00:00Z"
     *     responses:
     *       200:
     *         description: Danh sách chỗ đỗ có thể đặt
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
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/ParkingSlot'
     *       400:
     *         description: Tham số thời gian không hợp lệ
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
    async getAvailableSlotsByTimeRange(req, res) {
        try {
            const { start_time, end_time } = req.query;
            
            if (!start_time || !end_time) {
                return responseHandler.error(res, 'Tham số start_time và end_time là bắt buộc', 400);
            }

            const availableSlots = await slotsService.getAvailableSlotsByTimeRange(start_time, end_time);
            responseHandler.success(res, availableSlots, 'Lấy danh sách chỗ đỗ có thể đặt thành công');
        } catch (error) {
            console.error('Get available slots by time range error:', error);
            responseHandler.error(res, error.message, 400);
        }
    }
}

module.exports = new SlotsController();