const express = require('express');
const slotsController = require('../controllers/slots.controller');

const router = express.Router();

// Routes cho parking slots
router.get('/', slotsController.getAllSlots);
router.get('/available', slotsController.getAvailableSlots);
router.get('/:id', slotsController.getSlotById);
router.post('/', slotsController.createSlot);
router.put('/:id/status', slotsController.updateSlotStatus);
router.delete('/:id', slotsController.deleteSlot);

module.exports = router;