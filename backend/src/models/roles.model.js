const supabase = require('../services/db');

const TABLE = 'roles';

const Roles = {
  async findByName(role_name) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('role_name', role_name)
      .single();
    if (error) throw error;
    return data;
  },
  async list() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('role_name', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async create(role_name) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([{ role_name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async remove(id) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { id };
  }
};

module.exports = Roles;
