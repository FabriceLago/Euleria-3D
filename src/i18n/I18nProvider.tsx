import React, { createContext, useContext } from 'react';
import { format, parseLang, type Dict, type Lang } from './core.ts';

const STORAGE_KEY = 'euleria.lang';

/** Choix mémorisé, sinon langue du navigateur (nl/en/fr), sinon français. */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return parseLang(saved);
  } catch {
    // Stockage indisponible (navigation privée) : on retombe sur le navigateur
  }
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language || 'fr'];
  for (const tag of prefs) {
    const base = tag.slice(0, 2).toLowerCase();
    if (base === 'fr' || base === 'en' || base === 'nl') return base;
  }
  return 'fr';
}

export async function loadDict(lang: Lang): Promise<Dict> {
  if (lang === 'en') return (await import('./locales/en.json')).default as Dict;
  if (lang === 'nl') return (await import('./locales/nl.json')).default as Dict;
  return {};
}

/** Changer de langue recharge la page : le contenu des cours est re-téléchargé dans la bonne langue. */
export function setLang(lang: Lang) {
  const url = new URL(window.location.href);
  url.searchParams.delete('lang');
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Sans stockage, le choix passe par l'URL
    url.searchParams.set('lang', lang);
  }
  window.location.href = url.toString();
}

interface I18nValue {
  lang: Lang;
  dict: Dict;
  t: (source: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue>({ lang: 'fr', dict: {}, t: (s) => s });

export const I18nProvider: React.FC<{ lang: Lang; dict: Dict; children: React.ReactNode }> = ({
  lang,
  dict,
  children,
}) => (
  <I18nContext.Provider value={{ lang, dict, t: (s, vars) => format(dict, s, vars) }}>
    {children}
  </I18nContext.Provider>
);

export const useI18n = () => useContext(I18nContext);
