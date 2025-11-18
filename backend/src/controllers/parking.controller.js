const supabase = require('../services/db');
const responseHandler = require('../utils/response.handler');

class ParkingHistoryController {
        // Admin check-in cho user bất kỳ
        async checkInForUser(req, res) {
            try {
                if (req.user.role !== 'ADMIN') return responseHandler.error(res, 'Không có quyền', 403);
                const { slot_id, user_id } = req.body;
                if (!slot_id || !user_id) {
                    return responseHandler.error(res, 'slot_id và user_id là bắt buộc', 400);
                }
                // Kiểm tra user có check-in tại chỗ nào khác không
                const { data: activeCheckin } = await supabase
                    .from('parking_history')
                    .select('id, parking_slots(slot_name)')
                    .eq('user_id', user_id)
                    .is('check_out_time', null)
                    .single();
                if (activeCheckin) {
                    return responseHandler.error(res, `User này đang đỗ xe tại ${activeCheckin.parking_slots.slot_name}. Vui lòng check-out trước khi check-in chỗ mới`, 400);
                }
                // Kiểm tra chỗ đỗ có tồn tại và available không
                const { data: slot, error: slotError } = await supabase
                    .from('parking_slots')
                    .select('*')
                    .eq('id', slot_id)
                    .single();
                if (slotError || !slot) {
                    return responseHandler.error(res, 'Không tìm thấy chỗ đỗ', 404);
                }
                if (slot.status !== 'available') {
                    return responseHandler.error(res, 'Chỗ đỗ không khả dụng', 400);
                }
                // Tạo lịch sử check-in
                const history = await require('../models/parkingHistory.model').checkInForUser({ slot_id, user_id });
                // Cập nhật trạng thái slot thành occupied
                await supabase
                    .from('parking_slots')
                    .update({ status: 'occupied' })
                    .eq('id', slot_id);
                responseHandler.success(res, {
                    history,
                    slot: { ...slot, status: 'occupied' }
                }, 'Check-in thành công', 201);
            } catch (error) {
                console.error('Admin check-in error:', error);
                responseHandler.error(res, 'Lỗi server nội bộ', 500);
            }
        }

        // Admin check-out cho user bất kỳ
        async checkOutForUser(req, res) {
            try {
                if (req.user.role !== 'ADMIN') return responseHandler.error(res, 'Không có quyền', 403);
                const { user_id } = req.body;
                if (!user_id) {
                    return responseHandler.error(res, 'user_id là bắt buộc', 400);
                }
                // Tìm phiên check-in đang hoạt động
                const parkingHistoryModel = require('../models/parkingHistory.model');
                let updatedHistory;
                try {
                    updatedHistory = await parkingHistoryModel.checkOutForUser({ user_id });
                } catch (err) {
                    return responseHandler.error(res, err.message || 'Không có phiên đỗ xe nào đang hoạt động', 400);
                }
                // Cập nhật trạng thái slot thành available
                await supabase
                    .from('parking_slots')
                    .update({ status: 'available' })
                    .eq('id', updatedHistory.slot_id);
                responseHandler.success(res, {
                    history: updatedHistory,
                    slot_id: updatedHistory.slot_id
                }, 'Check-out thành công');
            } catch (error) {
                console.error('Admin check-out error:', error);
                responseHandler.error(res, 'Lỗi server nội bộ', 500);
            }
        }
    /**
     * @swagger
     * /api/parking/checkin:
     *   post:
     *     summary: Check-in vào chỗ đỗ xe
     *     tags: [Parking History]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - slot_id
     *             properties:
     *               slot_id:
     *                 type: integer
     *                 description: ID của chỗ đỗ xe
     *           example:
     *             slot_id: 1
     *     responses:
     *       201:
     *         description: Check-in thành công
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       400:
     *         description: Chỗ đỗ không khả dụng hoặc đã có xe
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
    async checkIn(req, res) {
        try {
            const { slot_id, user_id, license_plate } = req.body;
            // Sử dụng user_id từ body nếu có, không thì dùng từ JWT
            const userId = user_id || req.user.userId;

            if (!slot_id) {
                return responseHandler.error(res, 'ID chỗ đỗ là bắt buộc', 400);
            }

            if (!userId) {
                return responseHandler.error(res, 'User ID là bắt buộc', 400);
            }

            // Kiểm tra user có check-in tại chỗ nào khác không
            const { data: activeCheckin } = await supabase
                .from('parking_history')
                .select('id, parking_slots(slot_name)')
                .eq('user_id', userId)
                .is('check_out_time', null)
                .single();

            if (activeCheckin) {
                return responseHandler.error(res, `Bạn đang đỗ xe tại ${activeCheckin.parking_slots.slot_name}. Vui lòng check-out trước khi check-in chỗ mới`, 400);
            }

            // Kiểm tra chỗ đỗ có tồn tại và available không
            const { data: slot, error: slotError } = await supabase
                .from('parking_slots')
                .select('*')
                .eq('id', slot_id)
                .single();

            if (slotError || !slot) {
                return responseHandler.error(res, 'Không tìm thấy chỗ đỗ', 404);
            }

            if (slot.status !== 'available') {
                return responseHandler.error(res, 'Chỗ đỗ không khả dụng', 400);
            }

            // Tạo lịch sử check-in (tạm thời không bao gồm license_plate)
            const insertData = {
                slot_id,
                user_id: userId
            };
            
            // TODO: Thêm license_plate khi đã update database schema
            // if (license_plate) {
            //     insertData.license_plate = license_plate;
            // }
            
            const { data: history, error: historyError } = await supabase
                .from('parking_history')
                .insert([insertData])
                .select()
                .single();

            if (historyError) {
                console.error('Check-in error:', historyError);
                return responseHandler.error(res, 'Không thể thực hiện check-in', 500);
            }

            // Cập nhật trạng thái slot thành occupied
            await supabase
                .from('parking_slots')
                .update({ status: 'occupied' })
                .eq('id', slot_id);

            responseHandler.success(res, {
                history,
                slot: { ...slot, status: 'occupied' }
            }, 'Check-in thành công', 201);

        } catch (error) {
            console.error('Check-in error:', error);
            responseHandler.error(res, 'Lỗi server nội bộ', 500);
        }
    }

    /**
     * @swagger
     * /api/parking/checkout:
     *   post:
     *     summary: Check-out khỏi chỗ đỗ xe
     *     tags: [Parking History]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Check-out thành công
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       400:
     *         description: Không có phiên đỗ xe nào đang hoạt động
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
    async checkOut(req, res) {
        try {
            const userId = req.user.userId;

            // Tìm phiên check-in đang hoạt động
            const { data: activeHistory, error: historyError } = await supabase
                .from('parking_history')
                .select('*, parking_slots(*)')
                .eq('user_id', userId)
                .is('check_out_time', null)
                .single();

            if (historyError || !activeHistory) {
                return responseHandler.error(res, 'Không có phiên đỗ xe nào đang hoạt động', 400);
            }

            // Cập nhật check-out time
            const { data: updatedHistory, error: updateError } = await supabase
                .from('parking_history')
                .update({ check_out_time: new Date().toISOString() })
                .eq('id', activeHistory.id)
                .select()
                .single();

            if (updateError) {
                console.error('Check-out error:', updateError);
                return responseHandler.error(res, 'Không thể thực hiện check-out', 500);
            }

            // Cập nhật trạng thái slot thành available
            await supabase
                .from('parking_slots')
                .update({ status: 'available' })
                .eq('id', activeHistory.slot_id);

            // Tính thời gian đỗ xe
            const checkInTime = new Date(activeHistory.check_in_time);
            const checkOutTime = new Date(updatedHistory.check_out_time);
            const duration = Math.floor((checkOutTime - checkInTime) / (1000 * 60)); // phút

            responseHandler.success(res, {
                history: updatedHistory,
                slot: { ...activeHistory.parking_slots, status: 'available' },
                duration_minutes: duration,
                message: `Bạn đã đỗ xe ${duration} phút tại ${activeHistory.parking_slots.slot_name}`
            }, 'Check-out thành công');

        } catch (error) {
            console.error('Check-out error:', error);
            responseHandler.error(res, 'Lỗi server nội bộ', 500);
        }
    }

    /**
     * @swagger
     * /api/parking/history:
     *   get:
     *     summary: Lấy lịch sử đỗ xe của người dùng
     *     tags: [Parking History]
     *     security:
     *       - bearerAuth: []
     *     parameters:
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
     *         description: Lịch sử đỗ xe
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       401:
     *         description: Chưa được xác thực
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    async getMyHistory(req, res) {
        try {
            const userId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;

            // Đếm tổng số records
            const { count, error: countError } = await supabase
                .from('parking_history')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (countError) {
                console.error('Count history error:', countError);
                return responseHandler.error(res, 'Lỗi khi đếm lịch sử', 500);
            }

            // Lấy lịch sử với thông tin slot
            const { data: history, error } = await supabase
                .from('parking_history')
                .select(`
                    *,
                    parking_slots(slot_name)
                `)
                .eq('user_id', userId)
                .range(offset, offset + limit - 1)
                .order('check_in_time', { ascending: false });

            if (error) {
                console.error('Get history error:', error);
                return responseHandler.error(res, 'Lỗi khi lấy lịch sử', 500);
            }

            // Tính toán duration cho mỗi record
            const formattedHistory = history.map(record => {
                let duration_minutes = null;
                if (record.check_out_time) {
                    const checkInTime = new Date(record.check_in_time);
                    const checkOutTime = new Date(record.check_out_time);
                    duration_minutes = Math.floor((checkOutTime - checkInTime) / (1000 * 60));
                }

                return {
                    ...record,
                    duration_minutes,
                    status: record.check_out_time ? 'completed' : 'active'
                };
            });

            const totalPages = Math.ceil(count / limit);

            responseHandler.success(res, {
                history: formattedHistory,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages
                }
            }, 'Lấy lịch sử đỗ xe thành công');

        } catch (error) {
            console.error('Get my history error:', error);
            responseHandler.error(res, 'Lỗi server nội bộ', 500);
        }
    }

    /**
     * @swagger
     * /api/parking/current:
     *   get:
     *     summary: Lấy thông tin phiên đỗ xe hiện tại
     *     tags: [Parking History]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Thông tin phiên đỗ xe hiện tại
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ApiResponse'
     *       404:
     *         description: Không có phiên đỗ xe nào đang hoạt động
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
    async getCurrentSession(req, res) {
        try {
            const userId = req.user.userId;

            const { data: currentSession, error } = await supabase
                .from('parking_history')
                .select(`
                    *,
                    parking_slots(*)
                `)
                .eq('user_id', userId)
                .is('check_out_time', null)
                .single();

            if (error || !currentSession) {
                return responseHandler.error(res, 'Không có phiên đỗ xe nào đang hoạt động', 404);
            }

            // Tính thời gian đã đỗ
            const checkInTime = new Date(currentSession.check_in_time);
            const now = new Date();
            const duration_minutes = Math.floor((now - checkInTime) / (1000 * 60));

            responseHandler.success(res, {
                ...currentSession,
                duration_minutes,
                status: 'active'
            }, 'Lấy thông tin phiên đỗ xe hiện tại thành công');

        } catch (error) {
            console.error('Get current session error:', error);
            responseHandler.error(res, 'Lỗi server nội bộ', 500);
        }
    }

    // Admin: list all history with user and slot info
    async adminListHistory(req, res) {
        try {
            if (req.user.role !== 'ADMIN') return responseHandler.error(res, 'Không có quyền', 403);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            const { count, error: countError } = await supabase
                .from('parking_history')
                .select('*', { count: 'exact', head: true });
            if (countError) return responseHandler.error(res, countError.message, 400);
            const { data, error } = await supabase
                .from('parking_history')
                .select(`*, users(full_name, email), parking_slots(slot_name)`) 
                .range(offset, offset + limit - 1)
                .order('check_in_time', { ascending: false });
            if (error) return responseHandler.error(res, error.message, 400);
            return responseHandler.success(res, { items: data, pagination: { page, limit, total: count, totalPages: Math.ceil(count/limit) } }, 'OK');
        } catch (e) {
            return responseHandler.error(res, e.message || 'Lỗi server', 500);
        }
    }
}

module.exports = new ParkingHistoryController();