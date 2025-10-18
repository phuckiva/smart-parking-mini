import React, { useEffect, useState } from 'react';
import { ParkingModel } from '../models/ParkingModel';
import BackButton from '../components/BackButton';

function fmt(dt) {
  if (!dt) return '-';
  try { 
    return new Date(dt).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch { return dt; }
}

export default function UserHistoryPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAll, setShowAll] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const limit = showAll ? 1000 : itemsPerPage * 10; // Load nhiều hơn để phân trang local
      const res = await ParkingModel.history({ page: 1, limit });
      const list = Array.isArray(res?.history) ? res.history : (Array.isArray(res) ? res : []);
      setItems(list);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [showAll]);

  const getDurationDisplay = (minutes) => {
    if (!minutes) return 'Đang đỗ';
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h 0m`;
  };

  // Tính toán phân trang
  const totalPages = Math.max(Math.ceil(items.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = showAll ? items : items.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    // Hiển thị trang đầu
    if (currentPage > 3) {
      pages.push(
        <li key={1} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
        </li>
      );
      if (currentPage > 4) {
        pages.push(
          <li key="start-ellipsis" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
    }

    // Hiển thị các trang xung quanh trang hiện tại
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }

    // Hiển thị trang cuối
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push(
          <li key="end-ellipsis" className="page-item disabled">
            <span className="page-link">...</span>
          </li>
        );
      }
      pages.push(
        <li key={totalPages} className="page-item">
          <button className="page-link" onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </button>
        </li>
      );
    }

    return pages;
  };

  return (
    <div className="container-fluid px-4 py-3" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '2px'
          }}>
            <div style={{ 
              background: 'white',
              borderRadius: '10px',
              padding: '0'
            }}>
              <BackButton />
            </div>
          </div>
          <div>
            <h1 className="h3 mb-1 fw-bold text-dark">Lịch sử đậu xe</h1>
            <p className="text-muted mb-0 small">Người dùng - Lịch sử sử dụng chỗ đậu xe</p>
          </div>
        </div>
        <div className="badge bg-light text-dark fs-6 px-3 py-2">
          Tổng: {items.length} lần đậu xe | Trang {currentPage}/{totalPages}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {loading ? (
        <div className="card border-0 shadow-lg">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <h5 className="text-muted">Đang tải dữ liệu...</h5>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-lg">
          <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="d-flex align-items-center justify-content-between">
              <h5 className="card-title text-white mb-0 fw-semibold">
                <i className="bi bi-clock-history me-2"></i>
                Lịch sử đậu xe
              </h5>
              <div className="form-check form-switch">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  id="showAll" 
                  checked={showAll} 
                  onChange={e=>setShowAll(e.target.checked)} 
                />
                <label className="form-check-label text-white fw-medium" htmlFor="showAll">
                  Hiển thị tất cả
                </label>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            {items.length === 0 ? (
              <div className="text-center py-5">
                <div className="mb-3">
                  <i className="bi bi-clock-history display-1 text-muted"></i>
                </div>
                <h5 className="text-muted">Chưa có lịch sử</h5>
                <p className="text-muted small">Bạn chưa có lần đậu xe nào trong hệ thống</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 fw-semibold text-muted py-3 ps-4">
                        <i className="bi bi-geo-alt me-2"></i>Vị trí
                      </th>
                      <th className="border-0 fw-semibold text-muted py-3">
                        <i className="bi bi-box-arrow-in-right me-2"></i>Check-in
                      </th>
                      <th className="border-0 fw-semibold text-muted py-3">
                        <i className="bi bi-box-arrow-left me-2"></i>Check-out
                      </th>
                      <th className="border-0 fw-semibold text-muted py-3 pe-4">
                        <i className="bi bi-stopwatch me-2"></i>Thời lượng
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((h, index) => (
                      <tr key={h.id} className="border-bottom">
                        <td className="py-3 ps-4">
                          <div className="d-flex align-items-center">
                            <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                                 style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold' }}>
                              <i className="bi bi-car-front"></i>
                            </div>
                            <div>
                              <span className="badge bg-info text-dark px-3 py-2 fs-6">
                                {h.slot_id || h.parking_slots?.slot_name || '-'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="text-dark fw-medium">{fmt(h.check_in_time)}</div>
                        </td>
                        <td className="py-3">
                          <div className="text-dark fw-medium">{fmt(h.check_out_time)}</div>
                        </td>
                        <td className="py-3 pe-4">
                          <span className={`badge ${h.duration_minutes ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2`}>
                            {getDurationDisplay(h.duration_minutes)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination Footer - Luôn hiển thị */}
          <div className="card-footer bg-light border-0">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                Hiển thị {items.length === 0 ? 0 : showAll ? items.length : startIndex + 1} - {showAll ? items.length : Math.min(endIndex, items.length)} của {items.length} kết quả
              </div>
              {!showAll && (
                <nav aria-label="Phân trang">
                  <ul className="pagination pagination-sm mb-0">
                    {/* Nút Previous */}
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                    
                    {/* Các số trang */}
                    {renderPagination()}
                    
                    {/* Nút Next */}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
