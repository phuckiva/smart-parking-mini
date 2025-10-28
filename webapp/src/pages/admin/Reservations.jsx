import React, { useEffect, useState } from 'react';
import BackButton from '../../components/BackButton';
import { apiFetch } from '../../api';

export default function AdminReservationsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(0);
  // Bộ lọc
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('none'); // 'none' | 'date' | 'status'
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Khi chọn ngày, tự động chuyển tuần trên lịch đến tuần chứa ngày đó
  useEffect(() => {
    if (filterType === 'date' && filterDate) {
      const today = new Date();
      const selected = new Date(filterDate);
      // Tính số tuần lệch giữa ngày chọn và hôm nay
      const getMonday = (d) => {
        const day = d.getDay();
        const monday = new Date(d);
        monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
        monday.setHours(0,0,0,0);
        return monday;
      };
      const mondayToday = getMonday(today);
      const mondaySelected = getMonday(selected);
      const diffDays = Math.round((mondaySelected - mondayToday) / (1000 * 60 * 60 * 24));
      const weekOffset = Math.floor(diffDays / 7);
      setCurrentWeek(weekOffset);
    }
  }, [filterType, filterDate]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/reservations/admin/all');
        setItems(res?.data?.items || res?.items || []);
      } catch (e) { setError(e.message); }
    })();
  }, []);

  const getWeekDates = (weekOffset = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1) + (weekOffset * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeek);

  // Lọc danh sách đặt chỗ theo searchText, filterType (áp dụng cho tất cả items)
  const filterReservations = (reservations) => {
    let filtered = reservations;
    if (searchText) {
      filtered = filtered.filter(item =>
        (item.users?.full_name || '').toLowerCase().includes(searchText.toLowerCase())
      );
    }
    if (filterType === 'date' && filterDate) {
      filtered = filtered.filter(item => {
        const d = new Date(item.start_time);
        // So sánh yyyy-mm-dd
        const dStr = d.toISOString().slice(0, 10);
        return dStr === filterDate;
      });
    }
    if (filterType === 'status' && filterStatus) {
      filtered = filtered.filter(item => item.status === filterStatus);
    }
    return filtered;
  };

  // Nếu có bộ lọc (trừ filterType === 'date'), lấy tất cả đặt chỗ phù hợp
  const isFiltering = !!(searchText || (filterType === 'status' && filterStatus));
  const filteredAllReservations = isFiltering ? filterReservations(items) : [];

  // Lấy danh sách đặt chỗ cho từng ngày (không chia theo giờ)
  const getReservationsForDay = (dayIndex) => {
    const targetDate = weekDates[dayIndex];
    let dayReservations = items.filter(item => {
      const startTime = new Date(item.start_time);
      return startTime.toDateString() === targetDate.toDateString();
    });
    // Nếu lọc trạng thái hoặc tìm kiếm, không hiển thị theo tuần
    return isFiltering ? [] : dayReservations;
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#28a745',
      'completed': '#007bff',
      'cancelled': '#dc3545',
      'expired': '#ffc107'
    };
    return colors[status] || '#6c757d';
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateHeader = (date) => {
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDayName = (index) => {
    const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    return days[index];
  };

  return (
  <div className="container" style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 0' }}>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3" style={{gap: 0}}>
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
            <p className="text-muted mb-0 small">Quản trị viên - Thời gian biểu đặt chỗ</p>
          </div>
        </div>
        {/* Thanh tìm kiếm, bộ lọc và nút tuần cùng hàng ngang, căn trái đẹp mắt */}
  <div className="d-flex align-items-center" style={{maxWidth: 1200, marginLeft: 0, gap: 16, paddingLeft: 16, height: 54}}>
          <input
            type="text"
            className="form-control shadow-sm custom-search-input"
            style={{
              minWidth: 220,
              width: 240,
              height: 40,
              fontSize: 15,
              borderRadius: 14,
              border: '1.5px solid #e5e7eb',
              padding: '0 16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'border 0.2s, box-shadow 0.2s',
              outline: 'none',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
            }}
            placeholder="Tìm theo tên người dùng..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onFocus={e => e.target.style.border = '1.5px solid #2563eb'}
            onBlur={e => e.target.style.border = '1.5px solid #e5e7eb'}
          />
          <select
            className="form-select shadow-sm custom-select-input"
            style={{
              minWidth: 170,
              width: 180,
              height: 48,
              fontSize: 16,
              borderRadius: 16,
              border: '1.5px solid #e5e7eb',
              padding: '0 22px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'border 0.2s, box-shadow 0.2s',
              outline: 'none',
              background: '#fff',
              appearance: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
            value={filterType}
            onChange={e => {
              setFilterType(e.target.value);
              setFilterDate('');
              setFilterStatus('');
            }}
            onFocus={e => e.target.style.border = '1.5px solid #2563eb'}
            onBlur={e => e.target.style.border = '1.5px solid #e5e7eb'}
          >
            <option value="none">-- Bộ lọc --</option>
            <option value="date">Ngày</option>
            <option value="status">Trạng thái</option>
          </select>
          {filterType === 'date' && (
            <input
              type="date"
              className="form-control shadow-sm custom-date-input"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{
                minWidth: 150,
                width: 160,
                height: 48,
                fontSize: 16,
                borderRadius: 16,
                border: '1.5px solid #e5e7eb',
                padding: '0 22px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'border 0.2s, box-shadow 0.2s',
                outline: 'none',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
              }}
              onFocus={e => e.target.style.border = '1.5px solid #2563eb'}
              onBlur={e => e.target.style.border = '1.5px solid #e5e7eb'}
            />
          )}
          {filterType === 'status' && (
            <select
              className="form-select shadow-sm custom-status-input"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{
                minWidth: 150,
                width: 160,
                height: 48,
                fontSize: 16,
                borderRadius: 16,
                border: '1.5px solid #e5e7eb',
                padding: '0 22px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'border 0.2s, box-shadow 0.2s',
                outline: 'none',
                background: '#fff',
                appearance: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
              onFocus={e => e.target.style.border = '1.5px solid #2563eb'}
              onBlur={e => e.target.style.border = '1.5px solid #e5e7eb'}
            >
              <option value="">-- Chọn trạng thái --</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          )}
          {/* Nút chuyển tuần */}
          <div className="d-flex gap-2 align-items-center ms-2">
            <button
              className="btn btn-outline-secondary btn-circle d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40, borderRadius: '50%' }}
              onClick={() => setCurrentWeek(currentWeek - 1)}
              title="Tuần trước"
            >
              <i className="bi bi-chevron-left"></i>
            </button>
            <button
              className="btn fw-semibold d-flex align-items-center justify-content-center"
              style={{
                minWidth: 110,
                height: 40,
                fontSize: 15,
                background: '#111',
                color: '#fff',
                borderRadius: '20px',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                padding: '0 24px',
                fontWeight: 600
              }}
              onClick={() => setCurrentWeek(0)}
            >
              Tuần này
            </button>
            <button
              className="btn btn-outline-secondary btn-circle d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40, borderRadius: '50%' }}
              onClick={() => setCurrentWeek(currentWeek + 1)}
              title="Tuần sau"
            >
              <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger border-0 shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

  {/* Nếu lọc trạng thái hoặc tìm kiếm, hiển thị bảng tất cả kết quả phù hợp */}
  {isFiltering ? (
        <div className="card border-0 shadow-lg" style={{ maxWidth: '1200px', margin: '0 auto', borderRadius: 20, overflow: 'hidden' }}>
          <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <h5 className="card-title text-white mb-0 fw-semibold">
              <i className="bi bi-funnel me-2"></i>
              Kết quả lọc đặt chỗ
            </h5>
          </div>
          <div className="card-body p-0" style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
            <table className="table mb-0" style={{ minWidth: '900px', maxWidth: '1150px', margin: '0 auto', background: 'white', borderRadius: 16, overflow: 'hidden', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ background: '#f3f4f6' }}>
                <tr style={{ borderRadius: 16 }}>
                  <th className="text-center" style={{ fontWeight: 700, fontSize: 15, padding: '14px 0', borderTopLeftRadius: 16 }}>#</th>
                  <th style={{ fontWeight: 700, fontSize: 15, padding: '14px 0' }}>Người đặt</th>
                  <th style={{ fontWeight: 700, fontSize: 15, padding: '14px 0' }}>Slot</th>
                  <th style={{ fontWeight: 700, fontSize: 15, padding: '14px 0' }}>Thời gian</th>
                  <th style={{ fontWeight: 700, fontSize: 15, padding: '14px 0', borderTopRightRadius: 16 }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredAllReservations.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 24 }}>Không có kết quả phù hợp</td></tr>
                ) : (
                  filteredAllReservations.map((reservation, idx) => (
                    <tr key={reservation.id} style={{ transition: 'background 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseOut={e => e.currentTarget.style.background = ''}
                    >
                      <td className="text-center" style={{ verticalAlign: 'middle', fontWeight: 500 }}>{idx + 1}</td>
                      <td style={{ verticalAlign: 'middle' }}>{reservation.users?.full_name || 'N/A'}</td>
                      <td style={{ verticalAlign: 'middle' }}>{reservation.parking_slots?.slot_name || reservation.slot_id}</td>
                      <td style={{ verticalAlign: 'middle' }}>{formatDateHeader(new Date(reservation.start_time))} {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}</td>
                      <td style={{ verticalAlign: 'middle' }}>
                        <span className="badge" style={{
                          backgroundColor: getStatusColor(reservation.status),
                          fontSize: '12px',
                          padding: '5px 14px',
                          borderRadius: 12,
                          color: '#fff',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          letterSpacing: 0.5,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                        }}>{reservation.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="card-footer bg-light border-0" style={{ borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">Tổng: {filteredAllReservations.length} đặt chỗ</div>
              <div className="d-flex gap-3 small">
                <div><span style={{ width: '12px', height: '12px', backgroundColor: '#28a745', display: 'inline-block', marginRight: '4px', borderRadius: 3 }}></span> Active</div>
                <div><span style={{ width: '12px', height: '12px', backgroundColor: '#007bff', display: 'inline-block', marginRight: '4px', borderRadius: 3 }}></span> Completed</div>
                <div><span style={{ width: '12px', height: '12px', backgroundColor: '#dc3545', display: 'inline-block', marginRight: '4px', borderRadius: 3 }}></span> Cancelled</div>
                <div><span style={{ width: '12px', height: '12px', backgroundColor: '#ffc107', display: 'inline-block', marginRight: '4px', borderRadius: 3 }}></span> Expired</div>
              </div>
            </div>
          </div>
        </div>
  ) : (
  <div className="card border-0 shadow-lg" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="card-header bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <h5 className="card-title text-white mb-0 fw-semibold">
              <i className="bi bi-calendar-week me-2"></i>
              Thời gian biểu đặt chỗ
            </h5>
          </div>
          <div className="card-body p-0" style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
            <table className="table table-bordered mb-0" style={{ minWidth: '1150px', maxWidth: '1150px', margin: '0 auto', background: 'white' }}>
              <thead className="bg-light sticky-top" style={{ top: 0, zIndex: 10 }}>
                <tr>
                  {weekDates.map((date, index) => {
                    // Highlight nếu là ngày được chọn
                    let highlight = false;
                    if (filterType === 'date' && filterDate) {
                      const d = new Date(filterDate);
                      highlight = d.toDateString() === date.toDateString();
                    }
                    return (
                      <th
                        key={index}
                        className={`text-center fw-semibold${highlight ? ' bg-primary text-white' : ''}`}
                        style={{ minWidth: '120px', transition: 'background 0.2s' }}
                      >
                        <div>{getDayName(index)}</div>
                        <div className="small text-muted">{formatDateHeader(date)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {weekDates.map((date, dayIndex) => {
                    const reservations = getReservationsForDay(dayIndex);
                    // Highlight border nếu là ngày được chọn
                    let highlight = false;
                    if (filterType === 'date' && filterDate) {
                      const d = new Date(filterDate);
                      highlight = d.toDateString() === date.toDateString();
                    }
                    return (
                      <td
                        key={dayIndex}
                        className="p-2 align-top"
                        style={{
                          verticalAlign: 'top',
                          minHeight: '120px',
                          border: highlight ? '2px solid #2563eb' : undefined,
                          background: highlight ? '#e0e7ff' : undefined,
                          transition: 'background 0.2s, border 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {reservations.length === 0 && (
                            <span className="text-muted small">Không có đặt chỗ</span>
                          )}
                          {reservations.map(reservation => (
                            <div
                              key={reservation.id}
                              className="p-2 rounded"
                              style={{
                                backgroundColor: `${getStatusColor(reservation.status)}15`,
                                borderLeft: `3px solid ${getStatusColor(reservation.status)}`,
                                fontSize: '12px',
                                lineHeight: '1.3'
                              }}
                            >
                              <div className="fw-bold text-truncate" title={reservation.users?.full_name}>
                                {reservation.users?.full_name || 'N/A'}
                              </div>
                              <div className="text-muted small text-truncate">
                                <i className="bi bi-geo-alt"></i> {reservation.parking_slots?.slot_name || reservation.slot_id}
                              </div>
                              <div className="small">
                                <i className="bi bi-clock"></i> {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                              </div>
                              <div className="mt-1">
                                <span 
                                  className="badge" 
                                  style={{ 
                                    backgroundColor: getStatusColor(reservation.status),
                                    fontSize: '9px',
                                    padding: '2px 6px'
                                  }}
                                >
                                  {reservation.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card-footer bg-light border-0">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                Tổng: {items.length} đặt chỗ
              </div>
              <div className="d-flex gap-3 small">
                <div><span style={{ width: '12px', height: '12px', backgroundColor: '#28a745', display: 'inline-block', marginRight: '4px' }}></span> Active</div>
                <div><span style={{ width: '12px', height: '12px', backgroundColor: '#007bff', display: 'inline-block', marginRight: '4px' }}></span> Completed</div>
                <div><span style={{ width: '12px', height: '12px', backgroundColor: '#dc3545', display: 'inline-block', marginRight: '4px' }}></span> Cancelled</div>
                <div><span style={{ width: '12px', height: '12px', backgroundColor: '#ffc107', display: 'inline-block', marginRight: '4px' }}></span> Expired</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}