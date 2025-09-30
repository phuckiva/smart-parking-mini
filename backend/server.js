// Nạp các biến môi trường từ file .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import routes
const apiRoutes = require('./src/api');

const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Route mặc định
app.get('/', (req, res) => {
    res.json({
        message: '🚗 Smart Parking API Server',
        status: 'Running',
        timestamp: new Date().toISOString()
    });
});

// Xử lý lỗi 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`🌐 API endpoints tại http://localhost:${PORT}/api`);
});

module.exports = app;