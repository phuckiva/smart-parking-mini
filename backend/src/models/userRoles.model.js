const supabase = require('../services/db');

const TABLE = 'user_roles';

const UserRoles = {
  async getRolesForUser(user_id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('roles(role_name)')
      .eq('user_id', user_id);
    if (error) throw error;
    return data || [];
  },

  async addRole(user_id, role_id) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([{ user_id, role_id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async setSingleRole(user_id, role_id) {
    // Xóa role cũ
    const { error: delErr } = await supabase
      .from(TABLE)
      .delete()
      .eq('user_id', user_id);
    if (delErr) throw delErr;
    // Gán role mới
    const { data, error } = await supabase
      .from(TABLE)
      .insert([{ user_id, role_id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

module.exports = UserRoles;
