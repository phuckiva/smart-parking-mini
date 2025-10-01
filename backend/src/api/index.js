const express = require('express');
const slotsRoutes = require('./slots.routes');
const usersRoutes = require('./users.routes');
const authRoutes = require('./auth.routes');
const parkingRoutes = require('./parking.routes');
const reservationsRoutes = require('./reservations.routes');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes (no auth)
router.use('/auth', authRoutes);
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API đang hoạt động',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Protect everything else under /api
router.use(authMiddleware.authenticate);

// Protected routes
router.use('/slots', slotsRoutes);
router.use('/users', usersRoutes);
router.use('/parking', parkingRoutes);
router.use('/reservations', reservationsRoutes);

module.exports = router;