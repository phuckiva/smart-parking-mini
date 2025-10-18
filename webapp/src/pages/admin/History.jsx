import React, { useEffect, useMemo, useState } from 'react';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';

export default function AdminHistoryPage() {
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;
  const totalPages = Math.max(Math.ceil(allItems.length / itemsPerPage), 1);

  async function loadAllData() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/parking/admin/all?limit=1000'); // Load tất cả dữ liệu
      const data = res?.data || res || {};
      const allData = data.items || [];
      setAllItems(allData);
      
      // Phân trang local
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setItems(allData.slice(startIndex, endIndex));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Effect để load dữ liệu khi component mount
  useEffect(() => { 
    loadAllData(); 
  }, []);

  // Effect để cập nhật items khi currentPage thay đổi
  useEffect(() => {
    if (allItems.length > 0) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setItems(allItems.slice(startIndex, endIndex));
    }
  }, [currentPage, allItems]);

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
            <h1 className="h4 mb-1 fw-bold text-dark">Lịch sử đậu xe</h1>
            <p className="text-muted mb-0 small">Quản lý và theo dõi tất cả hoạt động đậu xe</p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark fs-6 px-3 py-2">
            Tổng: {allItems.length} đặt chỗ
          </span>
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
                      <th className="border-0 fw-semibold text-muted py-3 ps-4">Người dùng</th>
                      <th className="border-0 fw-semibold text-muted py-3">Vị trí</th>
                      <th className="border-0 fw-semibold text-muted py-3">Thời gian bắt đầu</th>
                      <th className="border-0 fw-semibold text-muted py-3">Thời gian kết thúc</th>
                      <th className="border-0 fw-semibold text-muted py-3 pe-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r, index) => {
                      const checkIn = r.check_in_time ? new Date(r.check_in_time) : null;
                      const checkOut = r.check_out_time ? new Date(r.check_out_time) : null;
                      let duration = '';
                      let status = 'Cancelled';
                      let statusClass = 'bg-danger';
                      
                      if (checkIn && checkOut) {
                        const mins = Math.floor((checkOut - checkIn) / 60000);
                        const h = Math.floor(mins / 60);
                        const m = mins % 60;
                        duration = h > 0 ? `${h}h ${m}m` : `${m}m`;
                        status = 'Completed';
                        statusClass = 'bg-primary';
                      } else if (checkIn && !checkOut) {
                        duration = 'Đang đỗ';
                        status = 'In Progress';
                        statusClass = 'bg-warning';
                      }
                      
                      // Tạo avatar từ tên
                      const userName = r.users?.full_name || 'Unknown';
                      const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                      
                      return (
                        <tr key={r.id} className={index % 2 === 0 ? '' : 'table-light'}>
                          <td className="py-3 ps-4">
                            <div className="d-flex align-items-center">
                              <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" 
                                   style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold' }}>
                                {initials}
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{userName}</div>
                                <small className="text-muted">{r.users?.email || 'N/A'}</small>
                              </div>
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="badge bg-info text-white px-3 py-2 fs-6">
                              {r.parking_slots?.slot_name || r.slot_id}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="text-dark">
                              {checkIn ? checkIn.toLocaleDateString('vi-VN') + ' ' + checkIn.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="text-dark">
                              {checkOut ? checkOut.toLocaleDateString('vi-VN') + ' ' + checkOut.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </div>
                          </td>
                          <td className="py-3 pe-4">
                            <span className={`badge ${statusClass} text-white px-3 py-2`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">Không có dữ liệu</td>
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
                  Hiển thị {allItems.length === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, allItems.length)} - {Math.min(currentPage * itemsPerPage, allItems.length)} của {allItems.length} kết quả
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
