const API_BASE = '';

export function getAdminToken() {
  return sessionStorage.getItem('rks_admin_token') || localStorage.getItem('rks_admin_token');
}

export function setAdminToken(token) {
  sessionStorage.setItem('rks_admin_token', token);
}

export function clearAdminToken() {
  sessionStorage.removeItem('rks_admin_token');
}

function authHeaders(auth = false) {
  const headers = {};
  if (auth) {
    const token = getAdminToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok && data.error) {
    const err = new Error(data.error);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function apiGet(path, { auth = false } = {}) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders(auth) });
  return parseJson(res);
}

export async function apiPost(path, body, { auth = false } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(auth) },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function apiPut(path, body, { auth = false } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders(auth) },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function apiPatch(path, body, { auth = false } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders(auth) },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function apiDelete(path, { auth = false } = {}) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: authHeaders(auth) });
  return parseJson(res);
}

export async function uploadFile(file, { publicUpload = false } = {}) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}${publicUpload ? '/api/upload/public' : '/api/upload'}`, {
    method: 'POST',
    headers: authHeaders(!publicUpload),
    body: formData,
  });
  return parseJson(res);
}

export const ALL_PRICE_TIER = { id: 'all', title: 'All Prices', desc: 'Full catalogue', min: 0, max: 999999 };

export const DEFAULT_PRICE_TIERS = [
  { id: 'r1', title: '₹500 – ₹1,500', desc: 'Daily & festive', min: 500, max: 1500 },
  { id: 'r2', title: '₹1,501 – ₹3,000', desc: 'Party wear', min: 1501, max: 3000 },
  { id: 'r3', title: '₹3,001 – ₹5,000', desc: 'Designer', min: 3001, max: 5000 },
  { id: 'r4', title: '₹5,001 – ₹10,000', desc: 'Pattu & premium', min: 5001, max: 10000 },
  { id: 'r5', title: '₹10,001 – ₹20,000', desc: 'Bridal luxury', min: 10001, max: 20000 },
];

export function parsePriceTiers(value) {
  if (Array.isArray(value) && value.length) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      /* use defaults */
    }
  }
  return DEFAULT_PRICE_TIERS;
}

export function orderStatusMeta(status) {
  const key = String(status || 'Pending').trim().toLowerCase();
  if (key === 'confirmed') return { key: 'confirmed', label: 'Confirmed' };
  if (key === 'delivered') return { key: 'delivered', label: 'Delivered' };
  if (key === 'cancelled') return { key: 'cancelled', label: 'Cancelled' };
  return { key: 'pending', label: 'Pending' };
}

export function slugifyCategory(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'category';
}
