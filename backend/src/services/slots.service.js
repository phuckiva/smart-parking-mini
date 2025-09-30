const db = require('./db');

class SlotsService {
    // Lấy tất cả chỗ đỗ xe
    async getAllSlots() {
        try {
            const query = 'SELECT * FROM parking_slots ORDER BY slot_number';
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Lỗi khi lấy danh sách chỗ đỗ: ${error.message}`);
        }
    }

    // Lấy chỗ đỗ theo ID
    async getSlotById(id) {
        try {
            const query = 'SELECT * FROM parking_slots WHERE id = $1';
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Lỗi khi lấy thông tin chỗ đỗ: ${error.message}`);
        }
    }

    // Tạo chỗ đỗ mới
    async createSlot(slotData) {
        try {
            const { slot_number, status = 'available', location } = slotData;
            const query = `
                INSERT INTO parking_slots (slot_number, status, location, created_at, updated_at)
                VALUES ($1, $2, $3, NOW(), NOW())
                RETURNING *
            `;
            const result = await db.query(query, [slot_number, status, location]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Lỗi khi tạo chỗ đỗ: ${error.message}`);
        }
    }

    // Cập nhật trạng thái chỗ đỗ
    async updateSlotStatus(id, status) {
        try {
            const query = `
                UPDATE parking_slots 
                SET status = $1, updated_at = NOW()
                WHERE id = $2
                RETURNING *
            `;
            const result = await db.query(query, [status, id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Lỗi khi cập nhật chỗ đỗ: ${error.message}`);
        }
    }

    // Xóa chỗ đỗ
    async deleteSlot(id) {
        try {
            const query = 'DELETE FROM parking_slots WHERE id = $1 RETURNING *';
            const result = await db.query(query, [id]);
            return result.rows[0];
        } catch (error) {
            throw new Error(`Lỗi khi xóa chỗ đỗ: ${error.message}`);
        }
    }

    // Lấy chỗ đỗ trống
    async getAvailableSlots() {
        try {
            const query = "SELECT * FROM parking_slots WHERE status = 'available' ORDER BY slot_number";
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            throw new Error(`Lỗi khi lấy chỗ đỗ trống: ${error.message}`);
        }
    }
}

module.exports = new SlotsService();