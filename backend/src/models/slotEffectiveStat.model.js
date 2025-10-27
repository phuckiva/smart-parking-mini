// Model cho output thống kê slot hiệu dụng
class SlotEffectiveStat {
	constructor({ total_slots, occupied_now, future_active_reservations, available_effective }) {
		this.total_slots = total_slots;
		this.occupied_now = occupied_now;
		this.future_active_reservations = future_active_reservations;
		this.available_effective = available_effective;
	}
}

module.exports = SlotEffectiveStat;
