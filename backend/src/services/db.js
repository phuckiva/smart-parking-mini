// Supabase client cho server-side (thay vì dùng pg Client trực tiếp)
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
// Ưu tiên SERVICE_ROLE_KEY trên server để không bị RLS chặn khi cần thiết
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  // Log cảnh báo rõ ràng khi thiếu cấu hình
  console.warn('[Supabase] Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY/ANON_KEY trong .env');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '', {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

module.exports = supabase;