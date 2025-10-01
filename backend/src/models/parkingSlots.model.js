const supabase = require('../services/db');

const TABLE = 'parking_slots';

const ParkingSlots = {
  async list({ status, from = 0, to = 9 } = {}) {
    let q = supabase.from(TABLE).select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (status) {
      const norm = String(status).toLowerCase();
      q = q.eq('status', norm);
    }
    const { data, error, count } = await q.range(from, to);
    if (error) throw error;
    return { data, count };
  },

  async findById(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async create({ slot_name, status = 'available' }) {
    const norm = String(status).toLowerCase();
    const { data, error } = await supabase.from(TABLE).insert([{ slot_name, status: norm }]).select().single();
    if (error) throw error;
    return data;
  },

  async setStatus(id, status) {
    const norm = String(status).toLowerCase();
    const { data, error } = await supabase.from(TABLE).update({ status: norm }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { data, error } = await supabase.from(TABLE).delete().eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};

module.exports = ParkingSlots;
