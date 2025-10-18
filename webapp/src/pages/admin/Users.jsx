import React, { useEffect, useState } from 'react';
import { UserModel } from '../../models/UserModel';
import BackButton from '../../components/BackButton';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', license_plate: '' });
  const [editing, setEditing] = useState(null);
  const [roleByUser, setRoleByUser] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;
  const totalPages = Math.max(Math.ceil(allUsers.length / itemsPerPage), 1);

  useEffect(() => {
    (async () => {
      try {
        const res = await UserModel.list();
        const list = Array.isArray(res?.users) ? res.users : (Array.isArray(res) ? res : []);
        setAllUsers(list);
        
        // Phân trang local
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setUsers(list.slice(startIndex, endIndex));
        
        const r = await UserModel.listRoles();
        setRoles(r);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Effect để cập nhật users khi currentPage thay đổi
  useEffect(() => {
    if (allUsers.length > 0) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setUsers(allUsers.slice(startIndex, endIndex));
    }
  }, [currentPage, allUsers]);

  const refresh = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await UserModel.list();
      const list = Array.isArray(res?.users) ? res.users : (Array.isArray(res) ? res : []);
      setAllUsers(list);
      
      // Phân trang local
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setUsers(list.slice(startIndex, endIndex));
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
    <div className="container-fluid px-4 py-3" style={{ maxWidth: '1200px', margin: '0 auto', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header Section */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <button 
            onClick={() => window.history.back()} 
            className="btn btn-dark rounded-pill px-4 py-2 d-flex align-items-center gap-2"
            style={{ fontSize: '14px' }}
          >
            <i className="bi bi-arrow-left"></i>
            Quay lại
          </button>
          <div>
            <h1 className="h4 mb-1 fw-bold text-dark">Quản lý người dùng</h1>
            <p className="text-muted mb-0 small">Quản lý và phân quyền người dùng trong hệ thống</p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark fs-6 px-3 py-2">
            Tổng: {allUsers.length} người dùng
          </span>
          <button 
            className="btn btn-dark rounded-pill px-4 py-2 d-flex align-items-center gap-2" 
            onClick={refresh}
            style={{ fontSize: '14px' }}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <h5 className="text-muted">Đang tải dữ liệu...</h5>
        </div>
      ) : (
          <>
        {/* Create User Card */}
        <div className="card shadow-sm border-0 mb-4">
         
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <input 
                  className="form-control" 
                  placeholder="Họ tên *" 
                  value={form.full_name} 
                  onChange={e=>setForm({...form, full_name:e.target.value})}
                />
              </div>
              <div className="col-md-3">
                <input 
                  className="form-control" 
                  placeholder="Email *" 
                  type="email" 
                  value={form.email} 
                  onChange={e=>setForm({...form, email:e.target.value})}
                />
              </div>
              <div className="col-md-2">
                <input 
                  className="form-control" 
                  placeholder="Mật khẩu *" 
                  type="password" 
                  value={form.password} 
                  onChange={e=>setForm({...form, password:e.target.value})}
                />
              </div>
              <div className="col-md-2">
                <input 
                  className="form-control" 
                  placeholder="Biển số" 
                  value={form.license_plate} 
                  onChange={e=>setForm({...form, license_plate:e.target.value})}
                />
              </div>
              <div className="col-md-2">
                <button 
                  className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={onCreate}
                >
                  <i className="bi bi-person-plus"></i>
                  Tạo
                </button>
              </div>
            </div>
           
          </div>
        </div>

        {/* Users Table Card */}
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th className="border-0 fw-semibold text-muted py-3 ps-4">Họ tên</th>
                    <th className="border-0 fw-semibold text-muted py-3">Email</th>
                    <th className="border-0 fw-semibold text-muted py-3">Biển số</th>
                    <th className="border-0 fw-semibold text-muted py-3">Role</th>
                    <th className="border-0 fw-semibold text-muted py-3 text-center" style={{ width: '25%' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u.id} className={idx % 2 === 0 ? '' : 'table-light'}>
                      <td className="py-3 ps-4">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '40px', height: '40px', fontSize: '16px', fontWeight: 'bold' }}>
                            {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            {editing?.id === u.id ? (
                              <input 
                                className="form-control form-control-sm" 
                                value={editing.full_name} 
                                onChange={e=>setEditing({...editing, full_name:e.target.value})}
                              />
                            ) : (
                              <div>
                                <div className="fw-semibold text-dark">{u.full_name}</div>
                                <small className="text-muted">ID: #{u.id}</small>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-muted">{u.email}</span>
                      </td>
                      <td className="py-3">
                        {editing?.id === u.id ? (
                          <input 
                            className="form-control form-control-sm" 
                            value={editing.license_plate || ''} 
                            onChange={e=>setEditing({...editing, license_plate:e.target.value})}
                            style={{ maxWidth: '150px' }}
                          />
                        ) : (
                          <code className="text-muted fw-medium">
                            {u.license_plate || '-'}
                          </code>
                        )}
                      </td>
                      <td className="py-3">
                        <select 
                          className="form-select form-select-sm fw-medium" 
                          value={roleByUser[u.id] || (u.role || 'UNASSIGNED')} 
                          onChange={e => onSetRole(u.id, e.target.value)}
                          style={{ maxWidth: '160px' }}
                        >
                            {!((roleByUser[u.id] || u.role) && (roleByUser[u.id] || u.role) !== 'UNASSIGNED') && (
                              <option value="UNASSIGNED">UNASSIGNED</option>
                            )}
                            {roles.map(r => (
                              <option key={r.id} value={r.role_name}>{r.role_name}</option>
                            ))}
                          </select>
                        </td>
                      <td className="py-3 text-center">
                        {editing?.id === u.id ? (
                          <div className="d-flex gap-2 justify-content-center">
                            <button 
                              onClick={() => onSave(u.id)}
                              className="btn btn-success btn-sm d-flex align-items-center gap-1"
                              title="Lưu"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Lưu
                              </button>
                            <button 
                              onClick={() => setEditing(null)}
                              className="btn btn-secondary btn-sm d-flex align-items-center gap-1"
                              title="Hủy"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Hủy
                              </button>
                            </div>
                        ) : (
                          <div className="d-flex gap-2 justify-content-center">
                            <button 
                              onClick={() => setEditing({ id: u.id, full_name: u.full_name, license_plate: u.license_plate })}
                              className="btn btn-outline-primary btn-sm"
                              title="Sửa"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button 
                              onClick={() => onDelete(u.id)}
                              className="btn btn-outline-danger btn-sm"
                              title="Xóa"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-25 mb-3">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                          <circle cx="8.5" cy="7" r="4"></circle>
                          <line x1="20" y1="8" x2="20" y2="14"></line>
                          <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        <div className="fw-medium">Không có dữ liệu</div>
                        <small className="text-muted mt-1">Tạo người dùng mới để bắt đầu</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination - Always show */}
          <div className="card-footer bg-white border-0 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted" style={{ fontSize: '14px' }}>
                Hiển thị {allUsers.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, allUsers.length)} của {allUsers.length} kết quả
              </span>
              
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link rounded-0 border-0 px-3 py-2 text-muted"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      style={{ backgroundColor: 'transparent' }}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                      <button 
                        className={`page-link rounded-0 border-0 px-3 py-2 fw-medium ${
                          currentPage === page 
                            ? 'bg-primary text-white' 
                            : 'text-dark'
                        }`}
                        onClick={() => setCurrentPage(page)}
                        style={{ 
                          backgroundColor: currentPage === page ? '#0d6efd' : 'transparent'
                        }}
                      >
                        {page}
                      </button>
                    </li>
                  ))}
                  
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link rounded-0 border-0 px-3 py-2 text-muted"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      style={{ backgroundColor: 'transparent' }}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}