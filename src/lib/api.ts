const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '';
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, '');

// Langue de l'élève, ajoutée à chaque requête : le serveur traduit ses réponses en conséquence
let apiLang = 'fr';
export function setApiLang(lang: string) {
  apiLang = lang;
}

function withLang(path: string): string {
  if (apiLang === 'fr') return path;
  return `${path}${path.includes('?') ? '&' : '?'}lang=${apiLang}`;
}

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${withLang(normalized)}`;
}

export function wsUrl(path = '/ws'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_URL) {
    try {
      const u = new URL(API_BASE_URL);
      const proto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${u.host}${withLang(normalized)}`;
    } catch {
      // Fallback sur l'origine courante si VITE_API_BASE_URL est mal formé
    }
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}${withLang(normalized)}`;
}
