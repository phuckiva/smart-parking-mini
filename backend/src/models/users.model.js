const supabase = require('../services/db');

const TABLE = 'users';

const Users = {
  async findByEmail(email) {
    const emailNorm = String(email || '').trim().toLowerCase();
    // Try exact match first
    let { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('email', emailNorm)
      .limit(1);
    if (error) throw error;
    if (Array.isArray(data) && data.length) return data[0];
    // Fallback to case-insensitive if not found
    const res2 = await supabase
      .from(TABLE)
      .select('*')
      .ilike('email', emailNorm)
      .limit(1);
    if (res2.error) throw res2.error;
    return Array.isArray(res2.data) && res2.data.length ? res2.data[0] : null;
  },

  async create({ full_name, email, password_hash, license_plate = null }) {
    const payload = {
      full_name,
      email: String(email || '').trim().toLowerCase(),
      password_hash,
      license_plate,
    };
    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async findByLicensePlate(license_plate) {
    const plate = license_plate ? String(license_plate).trim() : null;
    if (!plate) return null;
    const { data, error } = await supabase
      .from(TABLE)
      .select('id')
      .eq('license_plate', plate)
      .limit(1);
    if (error) throw error;
    return Array.isArray(data) && data.length ? data[0] : null;
  }
};

module.exports = Users;
