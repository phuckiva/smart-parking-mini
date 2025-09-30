const slotsService = require('../services/slots.service');
const responseHandler = require('../utils/response.handler');

class SlotsController {
    // GET /api/slots - Lấy tất cả chỗ đỗ
    async getAllSlots(req, res) {
        try {
            const slots = await slotsService.getAllSlots();
            responseHandler.success(res, slots, 'Lấy danh sách chỗ đỗ thành công');
        } catch (error) {
            responseHandler.error(res, error.message, 500);
        }
    }

    // GET /api/slots/:id - Lấy chỗ đỗ theo ID
    async getSlotById(req, res) {
        try {
            const { id } = req.params;
            const slot = await slotsService.getSlotById(id);
            
            if (!slot) {
                return responseHandler.error(res, 'Không tìm thấy chỗ đỗ', 404);
            }
            
            responseHandler.success(res, slot, 'Lấy thông tin chỗ đỗ thành công');
        } catch (error) {
            responseHandler.error(res, error.message, 500);
        }
    }

    // POST /api/slots - Tạo chỗ đỗ mới
    async createSlot(req, res) {
        try {
            const slotData = req.body;
            const newSlot = await slotsService.createSlot(slotData);
            responseHandler.success(res, newSlot, 'Tạo chỗ đỗ thành công', 201);
        } catch (error) {
            responseHandler.error(res, error.message, 400);
        }
    }

    // PUT /api/slots/:id/status - Cập nhật trạng thái chỗ đỗ
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
            responseHandler.error(res, error.message, 500);
        }
    }

    // DELETE /api/slots/:id - Xóa chỗ đỗ
    async deleteSlot(req, res) {
        try {
            const { id } = req.params;
            const deletedSlot = await slotsService.deleteSlot(id);
            
            if (!deletedSlot) {
                return responseHandler.error(res, 'Không tìm thấy chỗ đỗ', 404);
            }
            
            responseHandler.success(res, deletedSlot, 'Xóa chỗ đỗ thành công');
        } catch (error) {
            responseHandler.error(res, error.message, 500);
        }
    }

    // GET /api/slots/available - Lấy chỗ đỗ trống
    async getAvailableSlots(req, res) {
        try {
            const availableSlots = await slotsService.getAvailableSlots();
            responseHandler.success(res, availableSlots, 'Lấy danh sách chỗ đỗ trống thành công');
        } catch (error) {
            responseHandler.error(res, error.message, 500);
        }
    }
}

module.exports = new SlotsController();