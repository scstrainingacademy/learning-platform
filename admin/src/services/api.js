import { clearAdminToken, getAdminToken } from '../auth/adminSession.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function resolveApiUrl(url) {
  if (/^https?:\/\//i.test(url)) return url;
  if (!API_BASE_URL) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}

function authHeaders(initial = {}) {
  const headers = new Headers(initial);
  const token = getAdminToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

export async function apiRequest(url, options) {
  const response = await fetch(resolveApiUrl(url), { ...options, headers: authHeaders(options?.headers || {}) });
  if (response.status === 401) {
    clearAdminToken();
    window.dispatchEvent(new Event('admin-session-expired'));
  }
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || 'The request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function downloadAdminFile(url, suggestedName) {
  const response = await fetch(resolveApiUrl(url), { headers: authHeaders() });
  if (!response.ok) {
    let message = 'The download could not be completed.';
    try {
      const data = await response.json();
      message = data.error || message;
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
    }
    throw new Error(message);
  }
  const disposition = response.headers.get('Content-Disposition') || '';
  const filename = disposition.match(/filename="([^"]+)"/i)?.[1] || suggestedName;
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
