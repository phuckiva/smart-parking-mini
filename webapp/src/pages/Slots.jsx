import React, { useEffect, useMemo, useState } from 'react';
import { getAvailableSlots, getSlots } from '../api';
import { SlotModel } from '../models/SlotModel';
import { ReservationModel } from '../models/ReservationModel';
import BackButton from '../components/BackButton';

export default function SlotsPage() {
  const [data, setData] = useState(null);
  const [onlyAvailable, setOnlyAvailable] = useState(true);
  const [error, setError] = useState('');
  const [myReservations, setMyReservations] = useState([]);
  const [showFormFor, setShowFormFor] = useState(null); // slot id for reserve form
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Tính tự động thời lượng dựa trên thời gian nhập
  const durationText = useMemo(() => {
    if (!startTime || !endTime) return '';
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start) || isNaN(end) || end <= start) return '';
    const diffMs = end - start;
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    if (hours > 0 && rem > 0) return `${hours} giờ ${rem} phút`;
    if (hours > 0) return `${hours} giờ`;
    return `${rem} phút`;
  }, [startTime, endTime]);

  useEffect(() => {
    (async () => {
      try {
        const res = onlyAvailable ? await getAvailableSlots() : await getSlots();
        setData(res?.data || res);
        try {
          const mine = await ReservationModel.mine();
          setMyReservations(mine);
        } catch (e) {
          // Nếu API trả 501 do chưa tạo bảng, chỉ hiển thị cảnh báo nhẹ, không fail trang
          if (!String(e.message || '').includes('chưa bật')) setError(e.message);
        }
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [onlyAvailable]);

  const slots = Array.isArray(data?.slots) ? data.slots : Array.isArray(data) ? data : [];

  const reserve = async (id) => {
    setError('');
    try {
      if (myReservations.length >= 3) {
        throw new Error('Bạn đã đạt tối đa 3 đặt chỗ đang hiệu lực');
      }
      if (!startTime || !endTime) throw new Error('Vui lòng nhập thời gian bắt đầu và kết thúc');
      const s = new Date(startTime);
      const e = new Date(endTime);
      if (isNaN(s) || isNaN(e) || e <= s) {
        throw new Error('Khoảng thời gian không hợp lệ');
      }
      const payload = { slot_id: id, start_time: s.toISOString(), end_time: e.toISOString() };
      await ReservationModel.create(payload);
      setShowFormFor(null);
      setStartTime('');
      setEndTime('');
      const [res1, mine] = await Promise.all([
        onlyAvailable ? getAvailableSlots() : getSlots(),
        ReservationModel.mine()
      ]);
      setData(res1?.data || res1);
      setMyReservations(mine);
    } catch (e) {
      setError(e.message);
    }
  };

  const cancelReservation = async (reservationId) => {
    setError('');
    try {
      await ReservationModel.cancel(reservationId);
      const [res1, mine] = await Promise.all([
        onlyAvailable ? getAvailableSlots() : getSlots(),
        ReservationModel.mine()
      ]);
      setData(res1?.data || res1);
      setMyReservations(mine);
    } catch (e) {
      setError(e.message);
    }
  };

  const myReservationForSlot = (slotId) => myReservations.find(r => r.slot_id === slotId && r.status === 'active');

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <BackButton />
          <h2 className="mb-0">Danh sách chỗ đỗ</h2>
        </div>
        <div className="form-check form-switch">
          <input className="form-check-input" type="checkbox" id="onlyAvailable" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
          <label className="form-check-label" htmlFor="onlyAvailable">Chỉ hiển thị chỗ trống</label>
        </div>
      </div>
  {error && <div className="alert alert-danger">{error}</div>}
      {showFormFor && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h5 className="card-title">Đặt chỗ cho {slots.find(x => x.id === showFormFor)?.slot_name}</h5>
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Check-in</label>
                <input type="datetime-local" className="form-control" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Check-out</label>
                <input type="datetime-local" className="form-control" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
              <div className="col-md-4 text-end">
                <button className="btn btn-secondary me-2" onClick={() => { setShowFormFor(null); setStartTime(''); setEndTime(''); }}>Hủy</button>
                <button className="btn btn-primary" onClick={() => reserve(showFormFor)} disabled={myReservations.length >= 3} title={myReservations.length >= 3 ? 'Bạn đã có 3 đặt chỗ đang hiệu lực' : ''}>Xác nhận đặt chỗ</button>
              </div>
            </div>
            {durationText && (
              <div className="mt-3 text-muted">
                Thời lượng: <strong>{durationText}</strong>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{width: '40%'}}>Tên chỗ</th>
                  <th style={{width: '20%'}}>Trạng thái</th>
                  <th className="text-end" style={{width: '40%'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => {
                  const st = (s.status || '').toString().toUpperCase();
                  const badge = st === 'AVAILABLE' ? 'bg-success' : st === 'OCCUPIED' ? 'bg-danger' : st === 'RESERVED' ? 'bg-warning text-dark' : 'bg-secondary';
                  const mine = myReservationForSlot(s.id);
                  return (
                    <tr key={s.id}>
                      <td className="fw-medium">{s.slot_name}</td>
                      <td><span className={`badge ${badge}`}>{st || s.status}</span></td>
                      <td className="text-end">
                        {mine ? (
                          <button className="btn btn-sm btn-outline-danger" onClick={() => cancelReservation(mine.id)}>Hủy đặt chỗ</button>
                        ) : (
                          st === 'AVAILABLE' ? (
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => setShowFormFor(s.id)}
                              disabled={myReservations.length >= 3}
                              title={myReservations.length >= 3 ? 'Bạn đã có 3 đặt chỗ đang hiệu lực' : ''}
                            >
                              Đặt chỗ
                            </button>
                          ) : null
                        )}
                      </td>
                    </tr>
                  );
                })}
                {slots.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-muted py-4">Không có dữ liệu</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
