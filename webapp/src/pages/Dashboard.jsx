import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProfile } from '../api';
import { getRole } from '../auth';

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [currentRole, setCurrentRole] = useState(getRole());

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
        const profileData = res?.data || null;
        setProfile(profileData);
        // Update role from profile if available
        if (profileData?.role) {
          setCurrentRole(profileData.role);
        }
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  const isAdmin = currentRole === 'ADMIN';

  // Debug log để kiểm tra
  console.log('[Dashboard] currentRole:', currentRole, 'isAdmin:', isAdmin, 'profile:', profile?.role);

  return (
    <div>
      <h2 className="mb-3">Dashboard</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Profile quick access */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between">
          <div className="me-md-3">
            <h5 className="card-title mb-1">Hồ sơ cá nhân</h5>
            <p className="text-muted mb-0">Cập nhật họ tên, biển số và xem thông tin tài khoản.</p>
          </div>
          <Link to="/profile" className="btn btn-outline-primary mt-3 mt-md-0">Đi tới hồ sơ</Link>
        </div>
      </div>

      {isAdmin ? (
        <div className="row g-3">
          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Quản lý người dùng</h5>
                <p className="text-muted flex-grow-1">Xem danh sách, kiểm tra thông tin và vai trò người dùng.</p>
                <div className="text-end">
                  <Link to="/admin/users" className="btn btn-primary">Mở trang người dùng</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Quản lý Roles</h5>
                <p className="text-muted flex-grow-1">Thêm/xoá các role và dùng để gán cho người dùng.</p>
                <div className="text-end">
                  <Link to="/admin/roles" className="btn btn-outline-primary">Mở trang roles</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Quản lý chỗ đỗ</h5>
                <p className="text-muted flex-grow-1">Cập nhật trạng thái AVAILABLE/RESERVED/OCCUPIED cho từng chỗ.</p>
                <div className="text-end">
                  <Link to="/admin/slots" className="btn btn-primary">Mở trang chỗ đỗ</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Đặt chỗ</h5>
                <p className="text-muted flex-grow-1">Theo dõi tất cả các đặt chỗ theo thời gian và trạng thái.</p>
                <div className="text-end">
                  <Link to="/admin/reservations" className="btn btn-primary">Mở trang đặt chỗ</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Lịch sử đậu</h5>
                <p className="text-muted flex-grow-1">Xem lịch sử check-in/check-out toàn hệ thống.</p>
                <div className="text-end">
                  <Link to="/admin/history" className="btn btn-primary">Mở lịch sử đậu</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm">
          <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between">
            <div className="me-md-3">
              <h5 className="card-title mb-1">Tác vụ nhanh cho người dùng</h5>
              <p className="text-muted mb-0">Đặt chỗ đậu và xem lịch sử của bạn.</p>
            </div>
            <div className="d-flex gap-2 mt-3 mt-md-0">
              <Link to="/slots" className="btn btn-primary">Đặt chỗ</Link>
              <Link to="/history" className="btn btn-outline-secondary">Lịch sử đậu</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
