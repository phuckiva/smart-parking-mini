const ScheduleService = require('../services/schedule.service');

// Hàm cập nhật slot về available khi reservation bị cancelled
async function updateSlotsToAvailableByCancelled(req, res) {
  try {
    const updatedCount = await ScheduleService.updateSlotsToAvailableByCancelledReservation();
    if (res) {
      res.json({ success: true, message: `Parking slots set to available by cancelled reservation`, updatedCount });
    } else {
      console.log(`[SCHEDULE] Parking slots set to available by cancelled reservation, count: ${updatedCount}`);
    }
  } catch (error) {
    if (res) {
      res.status(500).json({ success: false, error: error.message });
    } else {
      console.error('Schedule update error:', error);
    }
  }
}

// Hàm cập nhật reservation về completed khi slot đã available
async function completeReservations(req, res) {
  try {
    const updatedCount = await ScheduleService.completeReservationsBySlotAvailable();
    if (res) {
      res.json({ success: true, message: `Reservations set to completed`, updatedCount });
    } else {
      console.log(`[SCHEDULE] Reservations set to completed, count: ${updatedCount}`);
    }
  } catch (error) {
    if (res) {
      res.status(500).json({ success: false, error: error.message });
    } else {
      console.error('Schedule update error:', error);
    }
  }
}

// Hàm cập nhật slot về available khi reservation active đã kết thúc
async function updateSlotsToAvailable(req, res) {
  try {
    const updatedCount = await ScheduleService.updateSlotsToAvailableByReservationEnd();
    if (res) {
      res.json({ success: true, message: `Parking slots set to available`, updatedCount });
    } else {
      console.log(`[SCHEDULE] Parking slots set to available, count: ${updatedCount}`);
    }
  } catch (error) {
    if (res) {
      res.status(500).json({ success: false, error: error.message });
    } else {
      console.error('Schedule update error:', error);
    }
  }
}

// Hàm cập nhật trạng thái slot, gọi service
async function updateParkingSlotsStatus(req, res) {
  try {
    const updatedCount = await ScheduleService.updateSlotsStatusByReservation();
    if (res) {
      res.json({ success: true, message: `Parking slots updated`, updatedCount });
    } else {    
      console.log(`[SCHEDULE] Parking slots updated, count: ${updatedCount}`);
    }
  } catch (error) {
    if (res) {
      res.status(500).json({ success: false, error: error.message });
    } else {
      console.error('Schedule update error:', error);
    }
  }
}

module.exports = {
  updateParkingSlotsStatus,
  updateSlotsToAvailable,
  completeReservations,
  updateSlotsToAvailableByCancelled,
};
