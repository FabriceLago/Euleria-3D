const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '';
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}

export function wsUrl(path = '/ws'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_URL) {
    const u = new URL(API_BASE_URL);
    const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${u.host}${normalized}`;
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}${normalized}`;
}
