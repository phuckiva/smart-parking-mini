const responseHandler = require('../utils/response.handler');
const Roles = require('../models/roles.model');

class RolesController {
  async listRoles(req, res) {
    try {
      const items = await Roles.list();
      return responseHandler.success(res, { roles: items }, 'OK');
    } catch (e) {
      return responseHandler.error(res, e.message || 'Lỗi khi lấy roles', 500);
    }
  }
  async createRole(req, res) {
    try {
      const { role_name } = req.body || {};
      if (!role_name) return responseHandler.error(res, 'role_name là bắt buộc', 400);
      const created = await Roles.create(role_name.toUpperCase());
      return responseHandler.success(res, created, 'Tạo role thành công', 201);
    } catch (e) {
      return responseHandler.error(res, e.message || 'Lỗi khi tạo role', 500);
    }
  }
  async deleteRole(req, res) {
    try {
      const { roleId } = req.params;
      if (!roleId) return responseHandler.error(res, 'Thiếu roleId', 400);
      await Roles.remove(roleId);
      return responseHandler.success(res, { id: roleId }, 'Đã xóa role');
    } catch (e) {
      return responseHandler.error(res, e.message || 'Lỗi khi xóa role', 500);
    }
  }
}

module.exports = new RolesController();