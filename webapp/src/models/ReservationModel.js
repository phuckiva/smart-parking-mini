import { apiFetch } from '../api';

export const ReservationModel = {
  async mine() {
    const res = await apiFetch('/reservations');
    // returns { reservations: [...] }
    return res?.data?.reservations || res?.reservations || [];
  },
  async create({ slot_id, start_time, end_time }) {
    const res = await apiFetch('/reservations', {
      method: 'POST',
      body: JSON.stringify({ slot_id, start_time, end_time }),
    });
    return res?.data || res;
  },
  async cancel(id) {
    const res = await apiFetch(`/reservations/${id}`, { method: 'DELETE' });
    return res?.data || res;
  },
};
