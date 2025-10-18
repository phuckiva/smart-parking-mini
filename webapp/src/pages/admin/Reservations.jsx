import React, { useEffect, useState } from 'react';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';

export default function AdminReservationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Số item mỗi trang
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/reservations/admin/all');
        setItems(res?.data?.items || res?.items || []);
      } catch (e) { setError(e.message); }
    })();
  }, []);
  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'active': { class: 'bg-success', text: 'Active' },
      'completed': { class: 'bg-primary', text: 'Completed' },
      'cancelled': { class: 'bg-danger', text: 'Cancelled' },
      'expired': { class: 'bg-warning text-dark', text: 'Expired' }
    };
    const statusInfo = statusMap[status] || { class: 'bg-secondary', text: status };
    return <span className={`badge ${statusInfo.class} px-3 py-2`}>{statusInfo.text}</span>;
  };

  // Tính toán phân trang
  const totalPages = Math.max(Math.ceil(items.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

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
    <div className="container-fluid px-4 py-3" style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
            <h1 className="h3 mb-1 fw-bold text-dark">Quản lý đặt chỗ</h1>
            <p className="text-muted mb-0 small">Quản trị viên - Danh sách tất cả đặt chỗ</p>
          </div>
        </div>
        <div className="badge bg-light text-dark fs-6 px-3 py-2">
          Tổng: {items.length} đặt chỗ | Trang {currentPage}/{totalPages}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {/* Main Content Card */}
      <div className="card border-0 shadow-lg">
        <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <h5 className="card-title text-white mb-0 fw-semibold">
            <i className="bi bi-calendar-check me-2"></i>
            Danh sách đặt chỗ
          </h5>
        </div>
        <div className="card-body p-0">
          {items.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-3">
                <i className="bi bi-inbox display-1 text-muted"></i>
              </div>
              <h5 className="text-muted">Không có dữ liệu</h5>
              <p className="text-muted small">Chưa có đặt chỗ nào trong hệ thống</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 fw-semibold text-muted py-3 ps-4">
                      <i className="bi bi-person me-2"></i>Người dùng
                    </th>
                    <th className="border-0 fw-semibold text-muted py-3">
                      <i className="bi bi-geo-alt me-2"></i>Vị trí
                    </th>
                    <th className="border-0 fw-semibold text-muted py-3">
                      <i className="bi bi-clock me-2"></i>Thời gian bắt đầu
                    </th>
                    <th className="border-0 fw-semibold text-muted py-3">
                      <i className="bi bi-clock-fill me-2"></i>Thời gian kết thúc
                    </th>
                    <th className="border-0 fw-semibold text-muted py-3 pe-4">
                      <i className="bi bi-flag me-2"></i>Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((it, index) => (
                    <tr key={it.id} className="border-bottom">
                      <td className="py-3 ps-4">
                        <div className="d-flex align-items-center">
                          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                               style={{ width: '40px', height: '40px', fontSize: '16px', fontWeight: 'bold' }}>
                            {it.users?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="fw-medium text-dark">{it.users?.full_name || 'N/A'}</div>
                            <small className="text-muted">{it.users?.email || 'N/A'}</small>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="badge bg-info text-dark px-3 py-2 fs-6">
                          {it.parking_slots?.slot_name || it.slot_id}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="text-dark fw-medium">{formatDateTime(it.start_time)}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-dark fw-medium">{formatDateTime(it.end_time)}</div>
                      </td>
                      <td className="py-3 pe-4">
                        {getStatusBadge(it.status)}
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
              Hiển thị {items.length === 0 ? 0 : startIndex + 1} - {Math.min(endIndex, items.length)} của {items.length} kết quả
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
