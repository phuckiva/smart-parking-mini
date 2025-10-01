const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: API quản lý xác thực người dùng
 */

// Routes công khai (không cần authentication)
router.post('/login', authController.login);
router.post('/register', authController.register);

// Routes cần authentication
router.get('/profile', authMiddleware.authenticate, authController.getProfile);

module.exports = router;