import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import LoginPage from './pages/Login.jsx';
import DashboardPage from './pages/Dashboard.jsx';
import SlotsPage from './pages/Slots.jsx';
import ProfilePage from './pages/Profile.jsx';
import { isAuthenticated, logout, getRole } from './auth.js';
import AdminUsersPage from './pages/admin/Users.jsx';
import AdminSlotsPage from './pages/admin/Slots.jsx';
import AdminHistoryPage from './pages/admin/History.jsx';
import UserHistoryPage from './pages/UserHistory.jsx';
import AdminReservationsPage from './pages/admin/Reservations.jsx';
import AdminRolesPage from './pages/admin/Roles.jsx';

const Protected = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RequireRole = ({ role, children }) => {
  const current = getRole();
  // If user isn't logged in at all
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  // If role not yet available (e.g., first load), allow and let page fetch enforce
  if (!current) return children;
  // If role available and doesn't match, send to home
  if (role && current !== role.toUpperCase()) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isDashboard = location.pathname === '/';

  useEffect(() => {
    const onAuthChange = () => setAuthed(isAuthenticated());
    window.addEventListener('auth-changed', onAuthChange);
    return () => window.removeEventListener('auth-changed', onAuthChange);
  }, []);

  return (
    <div>
      {/* Hide navbar on the login page; show it only when authenticated */}
      {authed && !isLoginPage && (
        <nav className="modern-navbar">
          <div className="navbar-container">
            <Link className="brand-logo" to="/">
              <div className="logo-icon">
                <span className="logo-car-center">🚗</span>
              </div>
              <div className="brand-text">
                <span className="brand-name">Smart Parking</span>
                <span className="brand-subtitle">Quản lý thông minh</span>
              </div>
            </Link>
            
            {isDashboard && (
              <div className="status-indicator">
                <div className="status-badge">
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Hồ sơ cá nhân có thể cập nhật</span>
                </div>
              </div>
            )}
            
            <div className="navbar-actions">
              <div className="user-info">
                <div className="user-avatar">
                  <span className="user-emoji">👤</span>
                </div>
                <div className="user-details">
                  <span className="user-email">{JSON.parse(localStorage.getItem('user')||'{}')?.email || ''}</span>
                  <span className="user-role">{getRole() === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}</span>
                </div>
              </div>
              
              {getRole() === 'ADMIN' && (
                <div className="admin-dropdown">
                  <button className="admin-btn" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className="bi bi-person-gear"></i>
                    <i className="bi bi-gear-fill"></i>
                    <span>Admin</span>
                    <i className="bi bi-chevron-down dropdown-arrow"></i>
                  </button>
                  <ul className="dropdown-menu modern-dropdown">
                    <li>
                      <Link className="dropdown-item" to="/admin/users">
                        <i className="bi bi-people"></i>
                        <span>Người dùng</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/admin/roles">
                        <i className="bi bi-shield-lock"></i>
                        <span>Phân quyền</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/admin/slots">
                        <i className="bi bi-grid-3x3-gap"></i>
                        <span>Chỗ đỗ xe</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/admin/reservations">
                        <i className="bi bi-calendar-check"></i>
                        <span>Đặt chỗ</span>
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/admin/history">
                        <i className="bi bi-clock-history"></i>
                        <span>Lịch sử</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
              
              <button className="logout-btn" onClick={() => { logout(); window.location.href = '/login'; }}>
                <i className="bi bi-box-arrow-right"></i>
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </nav>
      )}
      
      <div className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Protected><DashboardPage /></Protected>} />
          <Route path="/slots" element={<Protected><SlotsPage /></Protected>} />
          <Route path="/profile" element={<Protected><ProfilePage /></Protected>} />
          {/* User-only */}
          <Route path="/history" element={<Protected><RequireRole role="DRIVER"><UserHistoryPage /></RequireRole></Protected>} />
          {/* Admin */}
          <Route path="/admin/users" element={<Protected><RequireRole role="ADMIN"><AdminUsersPage /></RequireRole></Protected>} />
          <Route path="/admin/roles" element={<Protected><RequireRole role="ADMIN"><AdminRolesPage /></RequireRole></Protected>} />
          <Route path="/admin/slots" element={<Protected><RequireRole role="ADMIN"><AdminSlotsPage /></RequireRole></Protected>} />
          <Route path="/admin/history" element={<Protected><RequireRole role="ADMIN"><AdminHistoryPage /></RequireRole></Protected>} />
          <Route path="/admin/reservations" element={<Protected><RequireRole role="ADMIN"><AdminReservationsPage /></RequireRole></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <style jsx>{`
        .modern-navbar {
          background: linear-gradient(135deg, #070707ff 0%, #0c0d0dff 100%);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1050;
          padding: 0;
        }

        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          gap: 1rem;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: white;
          transition: all 0.3s ease;
        }

        .brand-logo:hover {
          color: white;
          transform: scale(1.05);
        }

        .logo-icon {
          width: 45px;
          height: 45px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          color: white;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          position: relative;
        }

        .logo-car-center {
          font-size: 1.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-logo:hover .logo-icon {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(-5deg) scale(1.1);
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .brand-name {
          font-size: 1.3rem;
          font-weight: 700;
          letter-spacing: -0.5px;
        }

        .brand-subtitle {
          font-size: 0.75rem;
          opacity: 0.8;
          font-weight: 500;
        }

        .status-indicator {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .status-badge {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 6px 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: white;
          backdrop-filter: blur(10px);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        .status-badge i {
          color: #4ade80;
          font-size: 0.9rem;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          padding: 6px 10px;
          backdrop-filter: blur(10px);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
        }

        .user-emoji {
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .user-email {
          font-size: 0.8rem;
          color: white;
          font-weight: 500;
        }

        .user-role {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .admin-dropdown {
          position: relative;
        }

        .admin-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: white;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          position: relative;
        }

        .admin-btn .bi-person-gear {
          position: absolute;
          left: 8px;
          font-size: 0.75rem;
          color: #4ade80;
        }

        .admin-btn .bi-gear-fill {
          margin-left: 12px;
        }

        .admin-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);
        }

        .dropdown-arrow {
          font-size: 0.65rem;
          transition: transform 0.3s ease;
        }

        .admin-btn[aria-expanded="true"] .dropdown-arrow {
          transform: rotate(180deg);
        }

        .modern-dropdown {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(244, 241, 241, 0.2);
          border-radius: 10px;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          padding: 6px 0;
          margin-top: 8px;
          min-width: 180px;
          z-index: 1060;
          position: absolute;
          top: 100%;
          right: 0;
        }

        .modern-dropdown .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          color: #2c3150ff;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.3s ease;
          border-radius: 0;
        }

        .modern-dropdown .dropdown-item:hover {
          background: linear-gradient(135deg, #dddddfff 0%, #f8f6f6ff 100%);
          color: white;
          transform: translateX(3px);
        }

        .modern-dropdown .dropdown-item i {
          font-size: 0.9rem;
          width: 14px;
          text-align: center;
        }

        .logout-btn {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 8px;
          color: white;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2);
        }

        .main-content {
          margin-top: 70px;
          min-height: calc(100vh - 70px);
          background: #f8fafc;
          padding: 2rem 0;
        }

        @media (max-width: 991.98px) {
          .navbar-container {
            padding: 0.8rem 1rem;
            gap: 0.5rem;
          }

          .status-indicator {
            display: none;
          }

          .user-details {
            display: none;
          }

          .brand-subtitle {
            display: none;
          }

          .admin-btn span,
          .logout-btn span {
            display: none;
          }

          .admin-btn {
            padding: 6px 8px;
          }

          .logout-btn {
            padding: 6px 8px;
          }

          .user-info {
            padding: 4px 8px;
          }

          .logo-icon {
            width: 40px;
            height: 40px;
            font-size: 1.1rem;
          }

          .brand-name {
            font-size: 1.1rem;
          }
        }

        @media (max-width: 767.98px) {
          .navbar-container {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .user-info {
            order: 3;
            width: 100%;
            justify-content: center;
            margin-top: 0.5rem;
          }

          .user-details {
            display: flex;
          }

          .main-content {
            margin-top: 90px;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
