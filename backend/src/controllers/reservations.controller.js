const responseHandler = require('../utils/response.handler');
const Reservations = require('../models/reservations.model');

class ReservationsController {
  async listMine(req, res) {
    try {
      const userId = req.user.userId;
      const items = await Reservations.myActive(userId);
      return responseHandler.success(res, { reservations: items }, 'Danh sách đặt chỗ');
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes("Could not find the table 'public.parking_reservations'")) {
        return responseHandler.success(res, { reservations: [] }, 'Tính năng đặt chỗ chưa bật', 200);
      }
      return responseHandler.error(res, msg || 'Lỗi khi lấy đặt chỗ', 500);
    }
  }

  async listAll(req, res) {
    try {
      if (req.user.role !== 'ADMIN') return responseHandler.error(res, 'Không có quyền', 403);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      const { count, error: countError } = await require('../services/db')
        .from('parking_reservations')
        .select('*', { count: 'exact', head: true });
      if (countError) return responseHandler.error(res, countError.message, 400);
      const { data, error } = await require('../services/db')
        .from('parking_reservations')
        .select('*, users(full_name, email), parking_slots(slot_name)')
        .range(offset, offset + limit - 1)
        .order('start_time', { ascending: false });
      if (error) return responseHandler.error(res, error.message, 400);
      return responseHandler.success(res, { items: data, pagination: { page, limit, total: count, totalPages: Math.ceil(count/limit) } }, 'OK');
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes("Could not find the table 'public.parking_reservations'")) {
        return responseHandler.success(res, { items: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0 } }, 'Tính năng đặt chỗ chưa bật');
      }
      return responseHandler.error(res, msg || 'Lỗi server', 500);
    }
  }

  async create(req, res) {
    try {
      const userId = req.user.userId;
      const { slot_id, start_time, end_time } = req.body || {};
      if (!slot_id || !start_time || !end_time) {
        return responseHandler.error(res, 'slot_id, start_time, end_time là bắt buộc', 400);
      }
      // Kiểm tra định dạng ISO: yyyy-MM-ddTHH:mm:ss hoặc yyyy-MM-ddTHH:mm:ss.sss
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?$/;
      if (!isoRegex.test(start_time) || !isoRegex.test(end_time)) {
        return responseHandler.error(res, 'Thời gian phải đúng định dạng ISO local, không có Z', 400);
      }
      // Kiểm tra logic thời gian
      if (end_time <= start_time) {
        return responseHandler.error(res, 'Khoảng thời gian không hợp lệ', 400);
      }
      // max 3 active per user
      const count = await Reservations.activeCount(userId);
      if (count >= 3) return responseHandler.error(res, 'Bạn đã đạt tối đa 3 đặt chỗ đang hiệu lực', 400);
      // overlap check
      const overlap = await Reservations.hasOverlap(slot_id, start_time, end_time);
      if (overlap) return responseHandler.error(res, 'Chỗ đỗ đã được đặt trong khoảng thời gian này', 400);
      // create
      const created = await Reservations.create({ slot_id, user_id: userId, start_time, end_time });
      return responseHandler.success(res, created, 'Đặt chỗ thành công', 201);
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes("Could not find the table 'public.parking_reservations'")) {
        return responseHandler.error(res, 'Tính năng đặt chỗ chưa bật: cần tạo bảng parking_reservations', 501);
      }
      return responseHandler.error(res, msg || 'Lỗi khi đặt chỗ', 500);
    }
  }

  async cancel(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      if (!id) return responseHandler.error(res, 'Thiếu id', 400);
      const cancelled = await Reservations.cancel(id, userId);
      return responseHandler.success(res, cancelled, 'Đã hủy đặt chỗ');
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes("Could not find the table 'public.parking_reservations'")) {
        return responseHandler.error(res, 'Tính năng đặt chỗ chưa bật: cần tạo bảng parking_reservations', 501);
      }
      return responseHandler.error(res, msg || 'Lỗi khi hủy đặt chỗ', 500);
    }
  }

  // Admin tạo reservation cho user bất kỳ
  async createForUser(req, res) {
    try {
      if (req.user.role !== 'ADMIN') return responseHandler.error(res, 'Không có quyền', 403);
      const { slot_id, user_id, start_time, end_time } = req.body || {};
      if (!slot_id || !user_id || !start_time || !end_time) {
        return responseHandler.error(res, 'slot_id, user_id, start_time, end_time là bắt buộc', 400);
      }
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?$/;
      if (!isoRegex.test(start_time) || !isoRegex.test(end_time)) {
        return responseHandler.error(res, 'Thời gian phải đúng định dạng ISO local, không có Z', 400);
      }
      if (end_time <= start_time) {
        return responseHandler.error(res, 'Khoảng thời gian không hợp lệ', 400);
      }
      // max 3 active per user
      const count = await Reservations.activeCount(user_id);
      if (count >= 3) return responseHandler.error(res, 'Người dùng đã đạt tối đa 3 đặt chỗ đang hiệu lực', 400);
      // overlap check
      const overlap = await Reservations.hasOverlap(slot_id, start_time, end_time);
      if (overlap) return responseHandler.error(res, 'Chỗ đỗ đã được đặt trong khoảng thời gian này', 400);
      // create
      const created = await Reservations.createForUser({ slot_id, user_id, start_time, end_time });
      return responseHandler.success(res, created, 'Đặt chỗ thành công', 201);
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes("Could not find the table 'public.parking_reservations'")) {
        return responseHandler.error(res, 'Tính năng đặt chỗ chưa bật: cần tạo bảng parking_reservations', 501);
      }
      return responseHandler.error(res, msg || 'Lỗi khi đặt chỗ', 500);
    }
  }
}

module.exports = new ReservationsController();
