const cron = require('node-cron');

const { updateParkingSlotsStatus, updateSlotsToAvailable } = require('../controllers/schedule.controller');


async function autoUpdateJob() {
  // Gọi hàm cập nhật trạng thái slot mỗi 10 giây tuần tự
  await updateSlotsToAvailable({}); // Không truyền res để chạy background
  await updateParkingSlotsStatus({}); // Không truyền res để chạy background
  await require('../controllers/schedule.controller').completeReservations({}); // Không truyền res để chạy background
  await require('../controllers/schedule.controller').updateSlotsToAvailableByCancelled({}); // Không truyền res để chạy background
}

function startSchedule() {
  cron.schedule('*/10 * * * * *', () => autoUpdateJob());
}

module.exports = {
  startSchedule,
};