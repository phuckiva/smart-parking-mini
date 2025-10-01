import React, { useEffect, useState } from 'react';
import BackButton from '../../components/BackButton';
import { UserModel } from '../../models/UserModel';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleName, setRoleName] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const list = await UserModel.listRoles();
      setRoles(list);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const create = async () => {
    setError('');
    try {
      if (!roleName) throw new Error('Nhập tên role');
      await UserModel.createRole(roleName.toUpperCase());
      setRoleName('');
      await load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!confirm('Xoá role này?')) return;
    setError('');
    try {
      await UserModel.deleteRole(id);
      await load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <BackButton />
        <h2 className="mb-0">Quản lý Roles</h2>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="text-muted">Đang tải...</div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="p-3 border-bottom">
              <div className="row g-2">
                <div className="col-md-4">
                  <input className="form-control" placeholder="Tên role (VD: ADMIN, DRIVER)" value={roleName} onChange={e=>setRoleName(e.target.value)} />
                </div>
                <div className="col-md-2">
                  <button className="btn btn-primary w-100" onClick={create}>Tạo role</button>
                </div>
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-striped mb-0">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Tên role</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map(r => (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.role_name}</td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => remove(r.id)}>Xoá</button>
                      </td>
                    </tr>
                  ))}
                  {roles.length === 0 && (
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
