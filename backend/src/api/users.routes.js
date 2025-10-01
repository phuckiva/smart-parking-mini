const express = require('express');
const usersController = require('../controllers/users.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API quản lý người dùng
 */

// Tất cả routes users đều cần xác thực
router.use(authMiddleware.authenticate);

// Routes cho users
router.get('/', usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.post('/', authMiddleware.requireAdmin, usersController.createUser);
router.put('/me', usersController.updateMe);
// Admin: update/delete any user, set role
router.put('/:id', authMiddleware.requireAdmin, usersController.updateUserByAdmin);
router.delete('/:id', authMiddleware.requireAdmin, usersController.deleteUserByAdmin);
router.post('/:id/role', authMiddleware.requireAdmin, usersController.setUserRole);

// Admin: roles CRUD
const rolesController = require('../controllers/roles.controller');
router.get('/admin/roles', authMiddleware.requireAdmin, rolesController.listRoles);
router.post('/admin/roles', authMiddleware.requireAdmin, rolesController.createRole);
router.delete('/admin/roles/:roleId', authMiddleware.requireAdmin, rolesController.deleteRole);

module.exports = router;