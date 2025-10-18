    const supabase = require('./db');
const moment = require('moment-timezone');

class ScheduleService {
    // Cập nhật trạng thái slot về available khi reservation bị cancelled và còn hiệu lực
    async updateSlotsToAvailableByCancelledReservation() {
        const nowLocal = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
        // Lấy các slot đang reserved
        const { data: slots, error: fetchError } = await supabase
            .from('parking_slots')
            .select('id')
            .eq('status', 'reserved');
        if (fetchError) throw new Error(fetchError.message);
        if (!slots || slots.length === 0) return 0;

        let updatedCount = 0;
        for (const slot of slots) {
            // Kiểm tra reservation cancelled còn hiệu lực cho slot này
            const { data: reservations, error: resError } = await supabase
                .from('parking_reservations')
                .select('*')
                .eq('slot_id', slot.id)
                .eq('status', 'cancelled')
                .gt('end_time', nowLocal);
            if (resError) throw new Error(resError.message);
            if (reservations && reservations.length > 0) {
                // Có reservation cancelled còn hiệu lực, cập nhật slot về available
                const { error: updateError } = await supabase
                    .from('parking_slots')
                    .update({ status: 'available', updated_at: nowLocal })
                    .eq('id', slot.id);
                if (updateError) throw new Error(updateError.message);
                updatedCount++;
            }
        }
        return updatedCount;
    }
    
    // Cập nhật trạng thái reservation về completed khi slot đã available và reservation đã kết thúc
    async completeReservationsBySlotAvailable() {
        const nowLocal = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
        // Lấy các reservation active đã kết thúc
        const { data: reservations, error: fetchError } = await supabase
            .from('parking_reservations')
            .select('id, slot_id')
            .eq('status', 'active')
            .lt('end_time', nowLocal);
        if (fetchError) throw new Error(fetchError.message);
        if (!reservations || reservations.length === 0) return 0;

        let updatedCount = 0;
        for (const reservation of reservations) {
            // Kiểm tra slot đã available
            const { data: slot, error: slotError } = await supabase
                .from('parking_slots')
                .select('status')
                .eq('id', reservation.slot_id)
                .eq('status', 'available')
                .single();
            if (slotError) continue;
            if (slot) {
                // Cập nhật reservation về completed
                const { error: updateError } = await supabase
                    .from('parking_reservations')
                    .update({ status: 'completed' })
                    .eq('id', reservation.id);
                if (updateError) throw new Error(updateError.message);
                updatedCount++;
            }
        }
        return updatedCount;
    }
    // Cập nhật trạng thái slot bằng query trực tiếp
    async updateSlotsStatusByReservation() {
        // Lấy giờ local (Asia/Ho_Chi_Minh)
        const nowLocal = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
        // Query trực tiếp bằng Supabase REST API: update từng slot
        // 1. Lấy các slot cần cập nhật
        const { data: slots, error: fetchError } = await supabase
            .from('parking_slots')
            .select('id')
            .neq('status', 'reserved');
        if (fetchError) throw new Error(fetchError.message);
        if (!slots || slots.length === 0) return 0;

        let updatedCount = 0;
        for (const slot of slots) {
            // Kiểm tra reservation active cho slot này
            const { data: reservations, error: resError } = await supabase
                .from('parking_reservations')
                .select('*')
                .eq('slot_id', slot.id)
                .eq('status', 'active')
                .lte('start_time', nowLocal)
                .gt('end_time', nowLocal);
            if (resError) throw new Error(resError.message);
            if (reservations && reservations.length > 0) {
                // Có reservation active, cập nhật slot
                const { error: updateError } = await supabase
                    .from('parking_slots')
                    .update({ status: 'reserved', updated_at: nowLocal })
                    .eq('id', slot.id);
                if (updateError) throw new Error(updateError.message);
                updatedCount++;
            }
        }
        return updatedCount;
    }

    // Cập nhật trạng thái slot về available khi reservation active đã kết thúc
    async updateSlotsToAvailableByReservationEnd() {
        const nowLocal = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
        // Lấy các slot đang reserved
        const { data: slots, error: fetchError } = await supabase
            .from('parking_slots')
            .select('id')
            .eq('status', 'reserved');
        if (fetchError) throw new Error(fetchError.message);
        if (!slots || slots.length === 0) return 0;

        let updatedCount = 0;
        for (const slot of slots) {
            // Kiểm tra reservation active đã kết thúc cho slot này
            const { data: reservations, error: resError } = await supabase
                .from('parking_reservations')
                .select('*')
                .eq('slot_id', slot.id)
                .eq('status', 'active')
                .lt('end_time', nowLocal);
            if (resError) throw new Error(resError.message);
            if (reservations && reservations.length > 0) {
                // Có reservation active đã kết thúc, cập nhật slot về available
                const { error: updateError } = await supabase
                    .from('parking_slots')
                    .update({ status: 'available', updated_at: nowLocal })
                    .eq('id', slot.id);
                if (updateError) throw new Error(updateError.message);
                updatedCount++;
            }
        }
        return updatedCount;
    }
}

module.exports = new ScheduleService();