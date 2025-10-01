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
      // Đảm bảo role được lưu vào user object
      const userWithRole = { ...user, role: role || user?.role || 'DRIVER' };
      setAuth(token, userWithRole);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-sm-10 col-md-8 col-lg-5">
        <div className="card shadow-sm mt-5">
          <div className="card-body">
            <h3 className="card-title mb-4 text-center">Đăng nhập</h3>
            <form onSubmit={handleSubmit} className="d-grid gap-3">
              <div>
                <label className="form-label">Email</label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="form-label">Mật khẩu</label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Đăng nhập</button>
              {error && <div className="alert alert-danger mb-0" role="alert">{error}</div>}
            </form>
            <p className="text-muted small mt-3 mb-0">
              Mẹo test nhanh: admin@smartparking.com / admin123 hoặc nguyenvana@email.com / 123456
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
