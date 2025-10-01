import React, { useEffect, useState } from 'react';
import { SlotModel } from '../../models/SlotModel';
import BackButton from '../../components/BackButton';

export default function AdminSlotsPage() {
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const list = await SlotModel.list();
      setSlots(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try {
      await SlotModel.updateStatus(id, status);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <BackButton />
          <h2 className="mb-0">Quản lý chỗ đỗ</h2>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={load}>Làm mới</button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="text-muted">Đang tải...</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Tên chỗ</th>
                    <th>Trạng thái</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map(s => (
                    <tr key={s.id}>
                      <td className="fw-medium">{s.slot_name}</td>
                      <td><span className={`badge ${s.status?.toUpperCase() === 'AVAILABLE' ? 'bg-success' : s.status?.toUpperCase() === 'OCCUPIED' ? 'bg-danger' : s.status?.toUpperCase() === 'RESERVED' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{s.status}</span></td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-success" onClick={() => setStatus(s.id, 'AVAILABLE')}>Available</button>
                          <button className="btn btn-outline-warning" onClick={() => setStatus(s.id, 'RESERVED')}>Reserve</button>
                          <button className="btn btn-outline-danger" onClick={() => setStatus(s.id, 'OCCUPIED')}>Occupied</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {slots.length === 0 && (
                    <tr><td colSpan={3} className="text-center text-muted py-4">Không có dữ liệu</td></tr>
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
