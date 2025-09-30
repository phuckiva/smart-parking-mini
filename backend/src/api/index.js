const express = require('express');
const slotsRoutes = require('./slots.routes');
const usersRoutes = require('./users.routes');

const router = express.Router();

// Kết hợp tất cả routes
router.use('/slots', slotsRoutes);
router.use('/users', usersRoutes);

// Route health check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API đang hoạt động',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;