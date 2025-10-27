const SlotEffectiveStat = require('../models/slotEffectiveStat.model');
const supabase = require('./db');

class SlotsService {
        // Lấy thống kê slot hiệu dụng thực tế (dựa trên truy vấn SQL phức tạp)
    async getEffectiveSlotStats() {
        // Gọi function get_effective_slot_stats từ Supabase
        const { data, error } = await supabase.rpc('get_effective_slot_stats');
        if (error || !data) {
            throw new Error('Không thể lấy thống kê slot hiệu dụng: ' + (error?.message || 'Unknown error'));
        }
        return data.map(row => new SlotEffectiveStat(row));
    }
    // Lấy tất cả chỗ đỗ xe với phân trang và lọc
    async getAllSlots(options = {}) {
        try {
            const { status, page = 1, limit = 10 } = options;
            const offset = (page - 1) * limit;

            // Base query
            let query = supabase
                .from('parking_slots')
                .select('*', { count: 'exact' });

            // Áp dụng filter nếu có
            if (status) {
                const norm = String(status).toLowerCase();
                query = query.eq('status', norm);
            }

            // Áp dụng phân trang và sắp xếp
            const { data: slots, error, count } = await query
                .range(offset, offset + limit - 1)
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(error.message);
            }

            const totalPages = Math.ceil(count / limit);

            return {
                slots,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages
                }
            };
        } catch (error) {
            throw new Error(`Lỗi khi lấy danh sách chỗ đỗ: ${error.message}`);
        }
    }

    // Lấy chỗ đỗ theo ID
    async getSlotById(id) {
        try {
            const { data: slot, error } = await supabase
                .from('parking_slots')
                .select('*')
                .eq('id', id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw new Error(error.message);
            }

            return slot;
        } catch (error) {
            throw new Error(`Lỗi khi lấy thông tin chỗ đỗ: ${error.message}`);
        }
    }

    // Tạo chỗ đỗ mới
    async createSlot(slotData) {
        try {
            const { slot_name, status = 'available' } = slotData;

            if (!slot_name) {
                throw new Error('Tên chỗ đỗ là bắt buộc');
            }

            // Kiểm tra tên chỗ đỗ đã tồn tại
            const { data: existingSlot } = await supabase
                .from('parking_slots')
                .select('id')
                .eq('slot_name', slot_name)
                .single();

            if (existingSlot) {
                throw new Error('Tên chỗ đỗ đã tồn tại');
            }

            const { data: newSlot, error } = await supabase
                .from('parking_slots')
                .insert([{
                    slot_name,
                    status: String(status).toLowerCase()
                }])
                .select()
                .single();

            if (error) {
                throw new Error(error.message);
            }

            return newSlot;
        } catch (error) {
            throw new Error(`Lỗi khi tạo chỗ đỗ: ${error.message}`);
        }
    }

    // Cập nhật trạng thái chỗ đỗ
    async updateSlotStatus(id, status) {
        try {
            const norm = String(status).toLowerCase();
            const allowed = ['available', 'occupied', 'reserved'];
            if (!allowed.includes(norm)) {
                throw new Error('Trạng thái không hợp lệ. Chỉ chấp nhận: available, occupied, reserved');
            }

            const { data: updatedSlot, error } = await supabase
                .from('parking_slots')
                .update({ status: norm })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Slot not found
                }
                throw new Error(error.message);
            }

            return updatedSlot;
        } catch (error) {
            throw new Error(`Lỗi khi cập nhật chỗ đỗ: ${error.message}`);
        }
    }

    // Xóa chỗ đỗ
    async deleteSlot(id) {
        try {
            // Kiểm tra xem có lịch sử đỗ xe nào đang active không
            const { data: activeHistory } = await supabase
                .from('parking_history')
                .select('id')
                .eq('slot_id', id)
                .is('check_out_time', null)
                .single();

            if (activeHistory) {
                throw new Error('Không thể xóa chỗ đỗ đang có xe');
            }

            const { data: deletedSlot, error } = await supabase
                .from('parking_slots')
                .delete()
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Slot not found
                }
                throw new Error(error.message);
            }

            return deletedSlot;
        } catch (error) {
            throw new Error(`Lỗi khi xóa chỗ đỗ: ${error.message}`);
        }
    }

    // Lấy chỗ đỗ trống
    async getAvailableSlots() {
        try {
            const { data: slots, error } = await supabase
                .from('parking_slots')
                .select('*')
                .eq('status', 'available')
                .order('slot_name', { ascending: true });

            if (error) {
                throw new Error(error.message);
            }

            return slots;
        } catch (error) {
            throw new Error(`Lỗi khi lấy chỗ đỗ trống: ${error.message}`);
        }
    }

    // Lấy chỗ đỗ có thể đặt trong khoảng thời gian
    async getAvailableSlotsByTimeRange(startTime, endTime) {
        try {
            if (!startTime || !endTime) {
                throw new Error('Thời gian bắt đầu và kết thúc là bắt buộc');
            }

            // Validate time format
            const start = new Date(startTime);
            const end = new Date(endTime);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw new Error('Định dạng thời gian không hợp lệ');
            }
            
            if (start >= end) {
                throw new Error('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc');
            }

            // Query để tìm slot có thể đặt
            const { data: availableSlots, error } = await supabase
                .rpc('get_available_slots_by_time_range', {
                    new_start: startTime,
                    new_end: endTime
                });

            if (error) {
                // Nếu RPC function không tồn tại, dùng raw query
                const query = `
                    SELECT s.id, s.slot_name, s.status, s.created_at, s.updated_at
                    FROM parking_slots s
                    WHERE s.status = 'available'
                      AND s.id NOT IN (
                          SELECT r.slot_id
                          FROM parking_reservations r
                          WHERE r.status IN ('active')
                            AND tstzrange(r.start_time, r.end_time) && tstzrange($1, $2)
                      )
                    ORDER BY s.slot_name ASC
                `;

                const { data: slots, error: queryError } = await supabase
                    .from('parking_slots')
                    .select(`
                        id,
                        slot_name,
                        status,
                        created_at,
                        updated_at
                    `)
                    .eq('status', 'available');

                if (queryError) {
                    throw new Error(queryError.message);
                }

                // Filter out conflicted slots manually
                const { data: conflictedReservations, error: reservationError } = await supabase
                    .from('parking_reservations')
                    .select('slot_id')
                    .in('status', ['active', 'completed'])
                    .lte('start_time', endTime)
                    .gte('end_time', startTime);

                if (reservationError) {
                    throw new Error(reservationError.message);
                }

                const conflictedSlotIds = conflictedReservations.map(r => r.slot_id);
                const filteredSlots = slots.filter(slot => !conflictedSlotIds.includes(slot.id));

                return filteredSlots.sort((a, b) => a.slot_name.localeCompare(b.slot_name));
            }

            return availableSlots;
        } catch (error) {
            throw new Error(`Lỗi khi tìm chỗ đỗ có thể đặt: ${error.message}`);
        }
    }

    // Lấy thống kê chỗ đỗ
    async getSlotStatistics() {
        try {
            const { data: all, error } = await supabase
                .from('parking_slots')
                .select('status');
            if (error) throw new Error(error.message);
            const total = all.length;
            const up = all.map(s => String(s.status || '').toUpperCase());
            const available = up.filter(x => x === 'AVAILABLE').length;
            const occupied = up.filter(x => x === 'OCCUPIED').length;
            const reserved = up.filter(x => x === 'RESERVED').length;
            const stats = {
                total,
                available,
                occupied,
                reserved,
                occupancy_rate: total > 0 ? Math.round(((occupied + reserved) / total) * 100) : 0
            };

            return stats;
        } catch (error) {
            throw new Error(`Lỗi khi lấy thống kê chỗ đỗ: ${error.message}`);
        }
    }
}

module.exports = new SlotsService();