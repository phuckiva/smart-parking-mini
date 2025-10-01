import React, { useEffect, useState } from 'react';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';

export default function AdminReservationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/reservations/admin/all');
        setItems(res?.data?.items || res?.items || []);
      } catch (e) { setError(e.message); }
    })();
  }, []);
  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <BackButton />
        <h2 className="mb-0">Quản lý đặt chỗ (Admin)</h2>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped mb-0">
              <thead className="table-light">
                <tr>
                  <th>User</th>
                  <th>Slot</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id}>
                    <td>{it.users?.full_name} ({it.users?.email})</td>
                    <td>{it.parking_slots?.slot_name || it.slot_id}</td>
                    <td>{new Date(it.start_time).toLocaleString()}</td>
                    <td>{new Date(it.end_time).toLocaleString()}</td>
                    <td><span className={`badge ${it.status==='active'?'bg-success':'bg-secondary'}`}>{it.status}</span></td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-muted py-4">Không có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
