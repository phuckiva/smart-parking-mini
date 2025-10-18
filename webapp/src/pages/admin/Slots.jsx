import React, { useEffect, useState } from 'react';
import { SlotModel } from '../../models/SlotModel';
import BackButton from '../../components/BackButton';

export default function AdminSlotsPage() {
  const [slots, setSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;
  const totalPages = Math.max(Math.ceil(allSlots.length / itemsPerPage), 1);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const list = await SlotModel.list();
      setAllSlots(list);
      
      // Phân trang local
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setSlots(list.slice(startIndex, endIndex));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Effect để cập nhật slots khi currentPage thay đổi
  useEffect(() => {
    if (allSlots.length > 0) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setSlots(allSlots.slice(startIndex, endIndex));
    }
  }, [currentPage, allSlots]);

  const setStatus = async (id, status) => {
    try {
      await SlotModel.updateStatus(id, status);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toUpperCase();
    if (s === 'AVAILABLE') return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
    if (s === 'OCCUPIED') return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
    if (s === 'RESERVED') return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
    return { bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' };
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
            <h1 className="h4 mb-1 fw-bold text-dark">Quản lý chỗ đỗ</h1>
            <p className="text-muted mb-0 small">Quản lý và cập nhật trạng thái chỗ đỗ xe</p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark fs-6 px-3 py-2">
            Tổng: {allSlots.length} chỗ đỗ
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
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th className="border-0 fw-semibold text-muted py-3 ps-4">Tên chỗ đỗ</th>
                    <th className="border-0 fw-semibold text-muted py-3">Trạng thái</th>
                    <th className="border-0 fw-semibold text-muted py-3 pe-4" style={{ width: '40%' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {slots.map((s, index) => {
                    const getStatusInfo = (status) => {
                      const s = status?.toUpperCase();
                      if (s === 'AVAILABLE') return { class: 'bg-success text-white', text: 'Available' };
                      if (s === 'OCCUPIED') return { class: 'bg-danger text-white', text: 'Occupied' };
                      if (s === 'RESERVED') return { class: 'bg-warning text-dark', text: 'Reserved' };
                      return { class: 'bg-secondary text-white', text: status };
                    };
                    
                    const statusInfo = getStatusInfo(s.status);
                    return (
                      <tr key={s.id} className={index % 2 === 0 ? '' : 'table-light'}>
                        <td className="py-3 ps-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                                 style={{ width: '40px', height: '40px', fontSize: '16px', fontWeight: 'bold' }}>
                              {s.slot_name ? s.slot_name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">{s.slot_name}</div>
                              <small className="text-muted">Chỗ đỗ xe #{s.id}</small>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`badge ${statusInfo.class} px-3 py-2`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="py-3 pe-4">
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              className="btn btn-success btn-sm d-flex align-items-center gap-1"
                              onClick={() => setStatus(s.id, 'AVAILABLE')}
                            >
                              <i className="bi bi-check-circle"></i>
                              Available
                            </button>
                            <button
                              className="btn btn-warning btn-sm d-flex align-items-center gap-1"
                              onClick={() => setStatus(s.id, 'RESERVED')}
                            >
                              <i className="bi bi-clock"></i>
                              Reserved
                            </button>
                            <button
                              className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                              onClick={() => setStatus(s.id, 'OCCUPIED')}
                            >
                              <i className="bi bi-x-circle"></i>
                              Occupied
                            </button>
                          </div>
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
          
          {/* Pagination Footer */}
          <div className="card-footer bg-light border-0 py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                Hiển thị {allSlots.length === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, allSlots.length)} - {Math.min(currentPage * itemsPerPage, allSlots.length)} của {allSlots.length} kết quả
              </div>
              <nav aria-label="Phân trang">
                <ul className="pagination pagination-sm mb-0">
                  {/* Nút Previous */}
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  
                  {/* Các số trang */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <li key={pageNum} className={`page-item ${pageNum === currentPage ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}
                  
                  {/* Nút Next */}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}