const express = require('express');
const router = express.Router();
const reservationsController = require('../controllers/reservations.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// List my active reservations
router.get('/', reservationsController.listMine.bind(reservationsController));
// Create a reservation
router.post('/', reservationsController.create.bind(reservationsController));
// Cancel a reservation
router.delete('/:id', reservationsController.cancel.bind(reservationsController));

// Admin list all reservations
router.get('/admin/all', authMiddleware.requireAdmin, reservationsController.listAll.bind(reservationsController));

module.exports = router;
