import { apiFetch } from '../api';

export const ParkingModel = {
  async history({ page = 1, limit = 20 } = {}) {
    const res = await apiFetch(`/parking/history?page=${page}&limit=${limit}`);
    return res?.data || res;
  },
  async current() {
    const res = await apiFetch('/parking/current');
    return res?.data || res;
  },
  async checkin(slot_id) {
    const res = await apiFetch('/parking/checkin', {
      method: 'POST',
      body: JSON.stringify({ slot_id }),
    });
    return res?.data || res;
  },
  async checkout(history_id) {
    const res = await apiFetch('/parking/checkout', {
      method: 'POST',
      body: JSON.stringify({ id: history_id }),
    });
    return res?.data || res;
  },
};
