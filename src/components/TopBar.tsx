import React from 'react';
import type { AccentColor, UserProfile } from '../types/learning.ts';

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
  const navItems: Array<{ id: AppSection; label: string }> = [
    { id: 'curriculum', label: 'Programme' },
    { id: 'quiz', label: 'Quiz Dynamique' },
    { id: 'studio3d', label: 'Atelier 3D' },
    { id: 'leaderboard', label: 'Classement' },
    { id: 'collaboration', label: 'Entraide' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1 : Wordmark unique */}
        <button
          type="button"
          onClick={() => onNavigate('curriculum')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          Euleria 3D
        </button>

        {/* Zone 2 : Liens de navigation texte */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3 : 1 action principale */}
        <div className="flex items-center shrink-0">
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
              {signingIn ? 'Connexion...' : 'Connexion Google'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation mobile compacte */}
      <nav className="flex md:hidden items-center justify-around border-t border-slate-200 dark:border-slate-800 px-2 py-2 text-xs font-medium">
        {navItems.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
