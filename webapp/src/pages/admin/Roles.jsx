import React, { useEffect, useState } from 'react';
import BackButton from '../../components/BackButton';
import { UserModel } from '../../models/UserModel';

export default function AdminRolesPage() {
  const [roles, setRoles] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleName, setRoleName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;
  const totalPages = Math.max(Math.ceil(allRoles.length / itemsPerPage), 1);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const list = await UserModel.listRoles();
      setAllRoles(list);
      
      // Phân trang local
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setRoles(list.slice(startIndex, endIndex));
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  // Effect để cập nhật roles khi currentPage thay đổi
  useEffect(() => {
    if (allRoles.length > 0) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setRoles(allRoles.slice(startIndex, endIndex));
    }
  }, [currentPage, allRoles]);

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
            <h1 className="h4 mb-1 fw-bold text-dark">Quản lý Roles</h1>
            <p className="text-muted mb-0 small">Quản lý và tạo các vai trò trong hệ thống</p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark fs-6 px-3 py-2">
            Tổng: {allRoles.length} roles
          </span>
          <button 
            className="btn btn-dark rounded-pill px-4 py-2 d-flex align-items-center gap-2" 
            onClick={load}
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
        {/* Create Role Card */}
        <div className="card shadow-sm border-0 mb-4">
        
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-8">
                <input
                  className="form-control"
                  placeholder="Tên role (VD: ADMIN, DRIVER, MANAGER)"
                  value={roleName}
                  onChange={e => setRoleName(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && create()}
                />
              </div>
              <div className="col-md-4">
                <button
                  className="btn btn-dark w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={create}
                >
                  <i className="bi bi-shield-plus"></i>
                  Tạo role
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Table Card */}
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th className="border-0 fw-semibold text-muted py-3 ps-4">ID</th>
                    <th className="border-0 fw-semibold text-muted py-3">Tên role</th>
                    <th className="border-0 fw-semibold text-muted py-3 pe-4 text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((r, index) => (
                    <tr key={r.id} className={index % 2 === 0 ? '' : 'table-light'}>
                      <td className="py-3 ps-4">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '32px', height: '32px', fontSize: '12px', fontWeight: 'bold' }}>
                            {r.id}
                          </div>
                          <small className="text-muted">ID: #{r.id}</small>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="badge bg-primary fs-6 px-3 py-2">
                          {r.role_name}
                        </span>
                      </td>
                      <td className="py-3 text-end pe-4">
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => remove(r.id)}
                          title="Xoá role"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {roles.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-5 text-muted">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-25 mb-3">
                          <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <div className="fw-medium">Không có dữ liệu</div>
                        <small className="text-muted mt-1">Tạo role mới để bắt đầu</small>
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
                Hiển thị {allRoles.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, allRoles.length)} của {allRoles.length} kết quả
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