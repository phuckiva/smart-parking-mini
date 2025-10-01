import React, { useEffect, useState } from 'react';
import { UserModel } from '../../models/UserModel';
import BackButton from '../../components/BackButton';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', license_plate: '' });
  const [editing, setEditing] = useState(null); // user id
  const [roleByUser, setRoleByUser] = useState({}); // cache selected role for each user

  useEffect(() => {
    (async () => {
      try {
        const res = await UserModel.list();
        const list = Array.isArray(res?.users) ? res.users : (Array.isArray(res) ? res : []);
        setUsers(list);
        // load roles
        const r = await UserModel.listRoles();
        setRoles(r);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await UserModel.list();
      const list = Array.isArray(res?.users) ? res.users : (Array.isArray(res) ? res : []);
      setUsers(list);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const onCreate = async () => {
    setError('');
    try {
      if (!form.full_name || !form.email || !form.password) throw new Error('Vui lòng nhập Họ tên, Email, Mật khẩu');
      await UserModel.create(form);
      setForm({ full_name: '', email: '', password: '', license_plate: '' });
      await refresh();
    } catch (e) { setError(e.message); }
  };

  const onSave = async (id) => {
    setError('');
    try {
      await UserModel.update(id, { full_name: editing.full_name, license_plate: editing.license_plate });
      setEditing(null);
      await refresh();
    } catch (e) { setError(e.message); }
  };

  const onDelete = async (id) => {
    if (!confirm('Xóa người dùng này?')) return;
    setError('');
    try {
      await UserModel.remove(id);
      await refresh();
    } catch (e) { setError(e.message); }
  };

  const onSetRole = async (id, role_name) => {
    setError('');
    try {
      await UserModel.setRole(id, role_name);
      setRoleByUser({ ...roleByUser, [id]: role_name });
      await refresh();
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <BackButton />
        <h2 className="mb-0">Quản lý người dùng</h2>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="text-muted">Đang tải...</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            {/* Create user */}
            <div className="p-3 border-bottom">
              <h5 className="mb-3">Tạo người dùng</h5>
              <div className="row g-2">
                <div className="col-md-3"><input className="form-control" placeholder="Họ tên" value={form.full_name} onChange={e=>setForm({...form, full_name:e.target.value})} /></div>
                <div className="col-md-3"><input className="form-control" placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
                <div className="col-md-3"><input className="form-control" placeholder="Mật khẩu" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} /></div>
                <div className="col-md-2"><input className="form-control" placeholder="Biển số (tuỳ chọn)" value={form.license_plate} onChange={e=>setForm({...form, license_plate:e.target.value})} /></div>
                <div className="col-md-1 text-end"><button className="btn btn-primary w-100" onClick={onCreate}>Tạo</button></div>
              </div>
              <div className="small text-muted mt-2">Mặc định role sẽ là DRIVER. Có thể đổi role ở bảng bên dưới.</div>
            </div>
            <div className="table-responsive">
              <table className="table table-striped mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Biển số</th>
                    <th>Role</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        {editing?.id === u.id ? (
                          <input className="form-control form-control-sm" value={editing.full_name} onChange={e=>setEditing({...editing, full_name:e.target.value})} />
                        ) : u.full_name}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        {editing?.id === u.id ? (
                          <input className="form-control form-control-sm" value={editing.license_plate || ''} onChange={e=>setEditing({...editing, license_plate:e.target.value})} />
                        ) : (u.license_plate || '-')}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <select className="form-select form-select-sm" value={roleByUser[u.id] || (u.role || 'UNASSIGNED')} onChange={e => onSetRole(u.id, e.target.value)}>
                            {!((roleByUser[u.id] || u.role) && (roleByUser[u.id] || u.role) !== 'UNASSIGNED') && (
                              <option value="UNASSIGNED">UNASSIGNED</option>
                            )}
                            {roles.map(r => (
                              <option key={r.id} value={r.role_name}>{r.role_name}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="text-end">
                        {editing?.id === u.id ? (
                          <>
                            <button className="btn btn-sm btn-success me-2" onClick={() => onSave(u.id)}>Lưu</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditing(null)}>Huỷ</button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setEditing({ id: u.id, full_name: u.full_name, license_plate: u.license_plate })}>Sửa</button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(u.id)}>Xoá</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
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
