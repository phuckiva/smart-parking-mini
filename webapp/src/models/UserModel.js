import { apiFetch } from '../api';

export const UserModel = {
  async profile() {
    const res = await apiFetch('/auth/profile');
    return res?.data || res;
  },
  async list({ page = 1, limit = 20 } = {}) {
    // backend supports pagination query? fallback simple
    const res = await apiFetch(`/users?page=${page}&limit=${limit}`);
    return res?.data || res;
  },
  async create({ full_name, email, password, license_plate }) {
    const res = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({ full_name, email, password, license_plate })
    });
    return res?.data || res;
  },
  async update(id, { full_name, license_plate }) {
    const res = await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ full_name, license_plate })
    });
    return res?.data || res;
  },
  async remove(id) {
    const res = await apiFetch(`/users/${id}`, { method: 'DELETE' });
    return res?.data || res;
  },
  async listRoles() {
    const res = await apiFetch('/users/admin/roles');
    return res?.data?.roles || res?.roles || [];
  },
  async createRole(role_name) {
    const res = await apiFetch('/users/admin/roles', { method: 'POST', body: JSON.stringify({ role_name }) });
    return res?.data || res;
  },
  async deleteRole(roleId) {
    const res = await apiFetch(`/users/admin/roles/${roleId}`, { method: 'DELETE' });
    return res?.data || res;
  },
  async setRole(userId, role_name) {
    const res = await apiFetch(`/users/${userId}/role`, { method: 'POST', body: JSON.stringify({ role_name }) });
    return res?.data || res;
  }
};
