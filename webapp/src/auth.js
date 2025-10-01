export function isAuthenticated() {
  return Boolean(localStorage.getItem('token'));
}

export function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user || {}));
  // notify listeners that auth state changed
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-changed'));
  }
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export function getRole() {
  const user = getUser();
  // normalize to uppercase if present
  const role = (user?.role || '').toString().toUpperCase();
  return role || '';
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-changed'));
  }
}
