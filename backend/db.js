// Nạp các biến môi trường từ file .env
require('dotenv').config();

// Import thư viện pg
const { Client } = require('pg');

// Tạo một kết nối mới tới CSDL bằng chuỗi kết nối trong file .env
// Sử dụng SSL để kết nối an toàn đến Supabase
const client = new Client({
    connectionString: process.env.database_url,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    try {
        // Bắt đầu kết nối
        await client.connect();
        console.log('✅ Kết nối tới Supabase thành công!');

        // Chạy một câu lệnh SQL đơn giản để kiểm tra
        const res = await client.query('SELECT NOW()');
        console.log('🕒 Thời gian hiện tại từ CSDL:', res.rows[0].now);

    } catch (err) {
        console.error('❌ Lỗi kết nối CSDL:', err.stack);
    } finally {
        // Đóng kết nối dù thành công hay thất bại
        await client.end();
    }
}

// Chạy hàm kiểm tra
testConnection();