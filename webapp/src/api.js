const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8888/api';

export function getToken() {
  return localStorage.getItem('token') || '';
}

export async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.message || json?.error || json?.data || `HTTP ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return json;
}

export async function login(email, password) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
  });
  return res;
}

export async function getProfile() {
  return apiFetch('/auth/profile');
}

export async function getSlots() {
  return apiFetch('/slots');
}

export async function getAvailableSlots() {
  return apiFetch('/slots/available');
}
