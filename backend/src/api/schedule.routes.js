const express = require('express');
const { updateParkingSlotsStatus } = require('../controllers/schedule.controller');
const router = express.Router();

// API trigger thủ công
router.patch('/', updateParkingSlotsStatus);
router.patch('/available', require('../controllers/schedule.controller').updateSlotsToAvailable);
router.patch('/complete-reservations', require('../controllers/schedule.controller').completeReservations);
router.patch('/available-by-cancelled', require('../controllers/schedule.controller').updateSlotsToAvailableByCancelled);

module.exports = router;
