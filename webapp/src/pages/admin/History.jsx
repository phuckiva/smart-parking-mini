import React, { useEffect, useMemo, useState } from 'react';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';

export default function AdminHistoryPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const limit = 20;

  async function load(p = 1) {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/parking/admin/all?page=${p}&limit=${limit}`);
      const data = res?.data || res || {};
      setItems(data.items || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setPage(p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <BackButton />
          <h2 className="mb-0">Lịch sử đậu xe (Admin)</h2>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary btn-sm" disabled={!canPrev} onClick={() => load(page - 1)}>Trang trước</button>
          <span className="text-muted small">Trang {page}/{totalPages}</span>
          <button className="btn btn-outline-secondary btn-sm" disabled={!canNext} onClick={() => load(page + 1)}>Trang sau</button>
        </div>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="text-muted">Đang tải...</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Người dùng</th>
                    <th>Chỗ</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Thời lượng</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => {
                    const checkIn = r.check_in_time ? new Date(r.check_in_time) : null;
                    const checkOut = r.check_out_time ? new Date(r.check_out_time) : null;
                    let duration = '';
                    if (checkIn && checkOut) {
                      const mins = Math.floor((checkOut - checkIn) / 60000);
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
                    } else if (checkIn && !checkOut) {
                      duration = 'Đang đỗ';
                    }
                    return (
                      <tr key={r.id}>
                        <td>{r.users?.full_name} ({r.users?.email})</td>
                        <td>{r.parking_slots?.slot_name || r.slot_id}</td>
                        <td>{checkIn ? checkIn.toLocaleString() : '-'}</td>
                        <td>{checkOut ? checkOut.toLocaleString() : '-'}</td>
                        <td>{duration || '-'}</td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-muted py-4">Không có dữ liệu</td></tr>
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
