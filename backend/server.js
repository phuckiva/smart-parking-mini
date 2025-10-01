// Nạp các biến môi trường từ file .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { swaggerUi, specs } = require('./src/config/swagger');

// Import routes
const apiRoutes = require('./src/api');

const app = express();
const PORT = process.env.PORT || 8888;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Smart Parking API Documentation"
}));

// Routes
app.use('/api', apiRoutes);

// Route mặc định
app.get('/', (req, res) => {
    res.json({
        message: '🚗 Smart Parking API Server',
        status: 'Running',
        timestamp: new Date().toISOString(),
        documentation: `${req.protocol}://${req.get('host')}/api-docs`,
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            users: '/api/users',
            slots: '/api/slots'
        }
    });
});

// Xử lý lỗi 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        suggestion: 'Vui lòng kiểm tra API documentation tại /api-docs'
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`🌐 API endpoints tại http://localhost:${PORT}/api`);
    console.log(`📚 API Documentation tại http://localhost:${PORT}/api-docs`);
});

module.exports = app;