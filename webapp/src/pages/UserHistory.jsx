import React, { useEffect, useState } from 'react';
import { ParkingModel } from '../models/ParkingModel';
import BackButton from '../components/BackButton';

function fmt(dt) {
  if (!dt) return '-';
  try { return new Date(dt).toLocaleString(); } catch { return dt; }
}

export default function UserHistoryPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const limit = showAll ? 1000 : 20;

  async function load(p=1) {
    setLoading(true);
    setError('');
    try {
      const res = await ParkingModel.history({ page: p, limit });
      const list = Array.isArray(res?.history) ? res.history : (Array.isArray(res) ? res : []);
      setItems(list);
      setTotalPages(res?.pagination?.totalPages || 1);
      setPage(p);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(1); }, [showAll]);

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <BackButton />
        <h2 className="mb-0">Lịch sử đậu xe</h2>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="text-muted">Đang tải...</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="d-flex align-items-center justify-content-between p-2 border-bottom">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="showAll" checked={showAll} onChange={e=>setShowAll(e.target.checked)} />
                <label className="form-check-label" htmlFor="showAll">Hiển thị tất cả</label>
              </div>
              <div className="d-flex align-items-center gap-2">
                {!showAll && (
                  <>
                    <button className="btn btn-sm btn-outline-secondary" disabled={page<=1} onClick={()=>load(page-1)}>Trang trước</button>
                    <span className="small text-muted">Trang {page}/{totalPages}</span>
                    <button className="btn btn-sm btn-outline-secondary" disabled={page>=totalPages} onClick={()=>load(page+1)}>Trang sau</button>
                  </>
                )}
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-striped mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Chỗ</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Thời lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(h => (
                    <tr key={h.id}>
                      <td>{h.slot_id || h.parking_slots?.slot_name || '-'}</td>
                      <td>{fmt(h.check_in_time)}</td>
                      <td>{fmt(h.check_out_time)}</td>
                      <td>{h.duration_minutes ? `${h.duration_minutes} phút` : '-'}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={4} className="text-center text-muted py-4">Chưa có lịch sử</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
