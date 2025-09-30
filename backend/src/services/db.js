// Di chuyển file db.js gốc vào services và cải tiến
require('dotenv').config();

const { Client } = require('pg');

// Tạo một pool connection để tái sử dụng
class DatabaseService {
    constructor() {
        this.client = new Client({
            connectionString: process.env.database_url,
            ssl: {
                rejectUnauthorized: false
            }
        });
        this.isConnected = false;
    }

    async connect() {
        try {
            if (!this.isConnected) {
                await this.client.connect();
                this.isConnected = true;
                console.log('✅ Kết nối database thành công!');
            }
            return this.client;
        } catch (error) {
            console.error('❌ Lỗi kết nối database:', error.message);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.isConnected) {
                await this.client.end();
                this.isConnected = false;
                console.log('🔚 Đã đóng kết nối database');
            }
        } catch (error) {
            console.error('⚠️ Lỗi khi đóng kết nối:', error.message);
        }
    }

    async query(text, params) {
        try {
            await this.connect();
            const result = await this.client.query(text, params);
            return result;
        } catch (error) {
            console.error('❌ Lỗi thực thi query:', error.message);
            throw error;
        }
    }
}

// Tạo instance duy nhất (Singleton pattern)
const db = new DatabaseService();

module.exports = db;