import { apiFetch } from '../api';

export const SlotModel = {
  async list() {
    const res = await apiFetch('/slots');
    return Array.isArray(res?.data?.slots) ? res.data.slots : (Array.isArray(res) ? res : res?.data || []);
  },
  async available() {
    const res = await apiFetch('/slots/available');
    return Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
  },
  async updateStatus(id, status) {
    const value = String(status).toLowerCase();
    const res = await apiFetch(`/slots/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: value }),
    });
    return res?.data || res;
  },
  async reserve(id) {
    return this.updateStatus(id, 'reserved');
  },
};
