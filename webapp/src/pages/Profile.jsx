import React, { useEffect, useState } from 'react';
import { getProfile, apiFetch } from '../api';
import BackButton from '../components/BackButton';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [license, setLicense] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getProfile();
  const data = res?.data || null;
  setProfile(data);
  setFullName(data?.full_name || '');
  setLicense(data?.license_plate || '');
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <BackButton />
        <h2 className="mb-0">Hồ sơ</h2>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}
      {profile ? (
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-6">
                <div className="mb-2"><span className="text-muted">Email:</span> {profile.email}</div>
                <div className="mb-2"><span className="text-muted">Vai trò:</span> {Array.isArray(profile.roles) ? profile.roles.map(r => (
                  <span key={r} className="badge bg-info text-dark me-1">{r}</span>
                )) : (<span className="badge bg-info text-dark">{profile.role || 'N/A'}</span>)}
                </div>
                <hr />
                <h6 className="mb-3">Cập nhật thông tin</h6>
                <div className="mb-3">
                  <label className="form-label">Họ tên</label>
                  <input className="form-control" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Biển số</label>
                  <input className="form-control" value={license} onChange={e => setLicense(e.target.value)} />
                </div>
                <button disabled={saving} className="btn btn-primary" onClick={async () => {
                  try {
                    setSaving(true);
                    const res = await apiFetch('/users/me', { method: 'PUT', body: JSON.stringify({ full_name: fullName, license_plate: license }) });
                    setProfile(res?.data || res);
                  } catch (e) {
                    setError(e.message);
                  } finally {
                    setSaving(false);
                  }
                }}>Lưu</button>
              </div>
              
            </div>
          </div>
        </div>
      ) : (
        <div className="text-muted">Đang tải...</div>
      )}
    </div>
  );
}
