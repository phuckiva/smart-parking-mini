const supabase = require('../services/db');

const TABLE = 'parking_reservations';

function overlapWhere(q, slot_id, start_time, end_time) {
  return q
    .eq('slot_id', slot_id)
    .lt('start_time', end_time)
    .gt('end_time', start_time)
    .eq('status', 'active');
}

const Reservations = {
  async myActive(user_id) {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, parking_slots(slot_name)')
      .eq('user_id', user_id)
      .in('status', ['active', 'cancelled', 'completed'])
      //.gt('end_time', nowIso)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async activeCount(user_id) {
    const nowIso = new Date().toISOString();
    const { count, error } = await supabase
      .from(TABLE)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('status', 'active')
      .gt('end_time', nowIso);
    if (error) throw error;
    return count || 0;
  },

  async hasOverlap(slot_id, start_time, end_time) {
    const { data, error } = await overlapWhere(
      supabase.from(TABLE).select('id').limit(1),
      slot_id,
      start_time,
      end_time
    );
    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
  },

  async create({ slot_id, user_id, start_time, end_time }) {
    const payload = { slot_id, user_id, start_time, end_time, status: 'active' };
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*, parking_slots(slot_name)')
      .single();
    if (error) throw error;
    return data;
  },

  async cancel(id, user_id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  
  // Tạo reservation cho user bất kỳ (admin dùng)
  async createForUser({ slot_id, user_id, start_time, end_time }) {
    const payload = { slot_id, user_id, start_time, end_time, status: 'active' };
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select('*, parking_slots(slot_name)')
      .single();
    if (error) throw error;
    return data;
  },
};

module.exports = Reservations;
