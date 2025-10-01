const supabase = require('../services/db');

const TABLE = 'parking_history';

const ParkingHistory = {
  async activeForUser(user_id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, parking_slots(*)')
      .eq('user_id', user_id)
      .is('check_out_time', null)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // not found is ok
    return data || null;
  },

  async checkIn({ slot_id, user_id }) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([{ slot_id, user_id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async checkOut(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ check_out_time: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

module.exports = ParkingHistory;
