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
        <nav className="navbar navbar-dark bg-dark">
          <div className="container d-flex align-items-center">
            <Link className="navbar-brand mb-0 h1" to="/">Smart Parking</Link>
            {isDashboard && (
              <div className="flex-grow-1 text-center text-light small">
                hồ sơ cá nhân có thể cập nhật
              </div>
            )}
            <div className="ms-auto d-flex align-items-center gap-3">
              <span className="text-light small d-none d-sm-inline">{JSON.parse(localStorage.getItem('user')||'{}')?.email || ''}</span>
              {getRole() === 'ADMIN' && (
                <div className="btn-group">
                  <button className="btn btn-outline-light btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    Admin
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li><Link className="dropdown-item" to="/admin/users">Người dùng</Link></li>
                    <li><Link className="dropdown-item" to="/admin/roles">Roles</Link></li>
                    <li><Link className="dropdown-item" to="/admin/slots">Chỗ đỗ</Link></li>
                    <li><Link className="dropdown-item" to="/admin/reservations">Đặt chỗ</Link></li>
                    <li><Link className="dropdown-item" to="/admin/history">Lịch sử đậu</Link></li>
                  </ul>
                </div>
              )}
              <button className="btn btn-outline-light btn-sm" onClick={() => { logout(); window.location.href = '/login'; }}>Logout</button>
            </div>
          </div>
        </nav>
      )}
      <div className="container py-4">
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
    </div>
  );
}

export default App;
