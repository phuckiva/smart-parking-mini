
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import { setAuth } from '../auth';


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(email, password);
      const data = res?.data || {};
      const { token, user, role } = data;
      if (!token) throw new Error('Không nhận được token');
      const userWithRole = { ...user, role: role || user?.role || 'DRIVER' };
      setAuth(token, userWithRole);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fb', width: '100vw', display: 'flex', flexDirection: 'column', margin: 0, padding: 0, boxSizing: 'border-box' }}>
      {/* Black header bar at the top */}
      <div style={{ width: '100%', height: 60, background: '#111', position: 'fixed', top: 0, left: 0, zIndex: 100 }} />
      {/* Header giống dashboard */}

      {/* Nội dung chính */}
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'translateY(-40px)' }}>
          <div className="card shadow-sm" style={{ borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.07)', padding: 0, width: '100%', background: '#fff' }}>
            <div className="card-body p-4" style={{ borderRadius: 20, padding: '36px 32px 28px 32px' }}>
              <h2 className="mb-4 text-center fw-bold" style={{ fontSize: 28, letterSpacing: 0.5, color: '#222' }}>Đăng nhập</h2>
              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <div>
                  <label className="form-label fw-semibold" style={{ fontSize: 15, marginBottom: 6 }}>Email</label>
                  <input
                    className="form-control"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      borderRadius: 12,
                      height: 40,
                      fontSize: 15,
                      border: '1.5px solid #e5e7eb',
                      padding: '0 16px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                      transition: 'border 0.2s, box-shadow 0.2s',
                      outline: 'none',
                      background: '#fff',
                    }}
                    onFocus={e => e.target.style.border = '1.5px solid #2563eb'}
                    onBlur={e => e.target.style.border = '1.5px solid #e5e7eb'}
                  />
                </div>
                <div>
                  <label className="form-label fw-semibold" style={{ fontSize: 15, marginBottom: 6 }}>Mật khẩu</label>
                  <input
                    className="form-control"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      borderRadius: 12,
                      height: 40,
                      fontSize: 15,
                      border: '1.5px solid #e5e7eb',
                      padding: '0 16px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                      transition: 'border 0.2s, box-shadow 0.2s',
                      outline: 'none',
                      background: '#fff',
                    }}
                    onFocus={e => e.target.style.border = '1.5px solid #2563eb'}
                    onBlur={e => e.target.style.border = '1.5px solid #e5e7eb'}
                  />
                </div>
                <button
                  type="submit"
                  className="btn fw-semibold"
                  style={{
                    background: '#111',
                    color: '#fff',
                    borderRadius: 12,
                    height: 42,
                    fontSize: 16,
                    letterSpacing: 0.5,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'background 0.2s',
                    fontWeight: 600,
                    marginTop: 2
                  }}
                  onMouseOver={e => e.target.style.background = '#222'}
                  onMouseOut={e => e.target.style.background = '#111'}
                >
                  Đăng nhập
                </button>
                {error && <div className="alert alert-danger mb-0 text-center" role="alert" style={{ borderRadius: 10, fontSize: 15 }}>{error}</div>}
              </form>
            </div>
          </div>
          <div className="text-muted small text-center" style={{ fontSize: 13, color: '#888', marginTop: 18, width: '100%' }}>
            <span style={{ fontWeight: 500 }}>Mẹo test nhanh:</span> admin@smartparking.com / admin123<br />hoặc nguyenvana@email.com / 123456
          </div>
        </div>
      </div>
    </div>
  );
}
