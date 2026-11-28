import React from 'react';
import type { AccentColor, UserProfile } from '../types/learning.ts';
import { LANGS, LANG_LABELS, parseLang } from '../i18n/core.ts';
import { setLang, useI18n } from '../i18n/I18nProvider.tsx';
import { isPlainLeftClick, toPath } from '../lib/routes.ts';

export type AppSection = 'curriculum' | 'quiz' | 'studio3d' | 'leaderboard' | 'collaboration';

interface TopBarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  profile: UserProfile | null;
  accentColor: AccentColor;
  signingIn?: boolean;
  onOpenCustomization: () => void;
  onSignIn: () => void;
}

const ACCENT_BTN_MAP: Record<AccentColor, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
  sky: 'bg-sky-600 hover:bg-sky-700 text-white',
};

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onNavigate,
  profile,
  accentColor,
  signingIn = false,
  onOpenCustomization,
  onSignIn,
}) => {
  const { lang, t } = useI18n();
  // Vrais liens : Ctrl/⌘-clic ouvre un nouvel onglet, le clic simple reste dans l'app
  const linkProps = (id: AppSection) => ({
    href: toPath({ section: id }),
    onClick: (e: React.MouseEvent) => {
      if (!isPlainLeftClick(e)) return;
      e.preventDefault();
      onNavigate(id);
    },
  });
  const navItems: Array<{ id: AppSection; label: string }> = [
    { id: 'curriculum', label: t('Programme') },
    { id: 'quiz', label: t('Quiz & Examens') },
    { id: 'studio3d', label: t('Atelier 3D') },
    { id: 'leaderboard', label: t('Bilan & Rang') },
    { id: 'collaboration', label: t('Entraide') },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-8">
        {/* Zone 1 : Wordmark unique */}
        <a
          {...linkProps('curriculum')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          Euleria 3D
        </a>

        {/* Zone 2 : Liens de navigation texte */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <a
                key={item.id}
                {...linkProps(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3 : 1 action principale */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            aria-label={t('Langue')}
            value={lang}
            onChange={(e) => setLang(parseLang(e.target.value))}
            className="px-2 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()} · {LANG_LABELS[l]}
              </option>
            ))}
          </select>
          {profile ? (
            <button
              type="button"
              onClick={onOpenCustomization}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="truncate max-w-[140px] inline-block align-bottom">
                {profile.displayName}
              </span>
              <span className="mx-1.5 text-slate-400">·</span>
              <span className="font-mono tabular-nums">{profile.xp} XP</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={signingIn}
              onClick={onSignIn}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
            >
              {signingIn ? (
                t('Connexion...')
              ) : (
                <>
                  {/* 375 px : libellé court, sinon la barre déborde */}
                  <span className="sm:hidden">{t('Connexion')}</span>
                  <span className="hidden sm:inline">{t('Connexion Google')}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Navigation mobile compacte */}
      {/* 5 colonnes égales : les libellés longs passent sur deux lignes au lieu de déborder */}
      <nav className="grid grid-cols-5 gap-1 md:hidden border-t border-slate-200 dark:border-slate-800 px-1 py-1.5 text-[11px] leading-tight font-medium">
        {navItems.map((item) => {
          const active = activeSection === item.id;
          return (
            <a
              key={item.id}
              {...linkProps(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center justify-center min-h-11 px-1 py-1 rounded-md text-center ${
                active
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
};
