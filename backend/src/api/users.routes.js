const express = require('express');
const usersController = require('../controllers/users.controller');

const router = express.Router();

// Routes cho users
router.get('/', usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.post('/', usersController.createUser);

module.exports = router;