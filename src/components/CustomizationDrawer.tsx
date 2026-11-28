import React, { useEffect, useState } from 'react';
import { LogOut, Moon, SlidersHorizontal, Sun, X } from 'lucide-react';
import { GRADE_LEVELS } from '../db/curriculumData.ts';
import type {
  AccentColor,
  GradeLevel,
  LayoutDensity,
  ThemeMode,
  UserProfile,
} from '../types/learning.ts';
import { PWAInstallButton } from './PWAInstallPrompt.tsx';

interface CustomizationDrawerProps {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  layoutDensity: LayoutDensity;
  show3DHints: boolean;
  gradeLevel: GradeLevel;
  onUpdatePreferences: (prefs: {
    displayName?: string;
    gradeLevel?: GradeLevel;
    themeMode?: ThemeMode;
    accentColor?: AccentColor;
    layoutDensity?: LayoutDensity;
    show3DHints?: boolean;
  }) => Promise<void>;
  onSignIn: () => void;
  onLogout: () => void;
  onDeleteAccount: () => Promise<boolean>;
}

export const CustomizationDrawer: React.FC<CustomizationDrawerProps> = ({
  open,
  onClose,
  profile,
  themeMode,
  accentColor,
  layoutDensity,
  show3DHints,
  gradeLevel,
  onUpdatePreferences,
  onSignIn,
  onLogout,
  onDeleteAccount,
}) => {
  const [nameInput, setNameInput] = useState(profile?.displayName || '');
  const [saving, setSaving] = useState(false);
  // Suppression du compte (audit 2.4) : confirmation tapée, pas de boîte de dialogue du navigateur
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);
    const ok = await onDeleteAccount();
    setDeleting(false);
    if (ok) {
      setDeleteOpen(false);
      setDeleteConfirm('');
      onClose();
    } else {
      setDeleteError('La suppression a échoué. Réessaie dans un instant.');
    }
  };

  useEffect(() => {
    setNameInput(profile?.displayName || '');
  }, [profile?.displayName]);

  if (!open) return null;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !profile) return;
    setSaving(true);
    try {
      await onUpdatePreferences({ displayName: nameInput.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Personnalisation & Profil
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {profile ? (
            <div className="mt-5 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200">
                    {profile.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {profile.displayName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {profile.email}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveName} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nom d'affichage"
                  maxLength={40}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </form>
            </div>
          ) : (
            <div className="mt-5 pb-5 border-b border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Connectez-vous avec Google pour sauvegarder vos préférences et votre progression.
              </p>
              <button
                type="button"
                onClick={onSignIn}
                className="mt-3 w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
              >
                Connexion Google
              </button>
            </div>
          )}

          {/* Niveau scolaire */}
          <div className="mt-6">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Niveau académique actif
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {GRADE_LEVELS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onUpdatePreferences({ gradeLevel: g.id })}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    gradeLevel === g.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Apparence Clair / Sombre */}
          <div className="mt-6">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Thème d’affichage
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdatePreferences({ themeMode: 'light' })}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  themeMode === 'light'
                    ? 'border-slate-900 bg-slate-100 text-slate-900'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Clair</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdatePreferences({ themeMode: 'dark' })}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  themeMode === 'dark'
                    ? 'border-white bg-slate-800 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Sombre</span>
              </button>
            </div>
          </div>

          {/* Couleur d'accentuation */}
          <div className="mt-6">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Couleur d’accentuation (interface & modèles 3D)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'indigo', label: 'Indigo Académique', swatch: 'bg-indigo-600' },
                  { id: 'emerald', label: 'Émeraude Sciences', swatch: 'bg-emerald-600' },
                  { id: 'amber', label: 'Ambre Géométrie', swatch: 'bg-amber-600' },
                  { id: 'sky', label: 'Azur Analyse', swatch: 'bg-sky-600' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onUpdatePreferences({ accentColor: c.id })}
                  className={`flex items-center gap-2.5 py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    accentColor === c.id
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-sm shrink-0 ${c.swatch}`} />
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Densité & Axes 3D */}
          <div className="mt-6 space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Densité de mise en page
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'comfortable', label: 'Confort' },
                    { id: 'compact', label: 'Compacte' },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onUpdatePreferences({ layoutDensity: d.id })}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      layoutDensity === d.id
                        ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-sm text-slate-700 dark:text-slate-200">
                Afficher le repère orthonormé 3D (X, Y, Z)
              </span>
              <input
                type="checkbox"
                checked={show3DHints}
                onChange={(e) => onUpdatePreferences({ show3DHints: e.target.checked })}
                className="w-4 h-4 accent-indigo-600"
              />
            </label>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Application hors-ligne (PWA)
              </div>
              <PWAInstallButton variant="drawer" />
            </div>
          </div>
        </div>

        {profile && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>

            <div className="mt-6 rounded-lg border border-rose-200 dark:border-rose-900 p-4">
              <h3 className="text-xs font-semibold text-rose-700 dark:text-rose-400">Supprimer mon compte</h3>
              {!deleteOpen ? (
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-400 underline underline-offset-2 cursor-pointer"
                >
                  Supprimer mon compte et toutes mes données…
                </button>
              ) : (
                <div className="mt-2 space-y-2">
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    Ton compte, ta progression, tes réponses, tes examens, tes badges et tes messages seront définitivement effacés.
                    Cette action est irréversible. Les sauvegardes chiffrées disparaissent d’elles-mêmes sous 30 jours.
                  </p>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Pour confirmer, tape SUPPRIMER
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value)}
                      autoComplete="off"
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </label>
                  {deleteError && (
                    <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                      {deleteError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteOpen(false);
                        setDeleteConfirm('');
                      }}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={deleteConfirm.trim().toUpperCase() !== 'SUPPRIMER' || deleting}
                      onClick={handleDeleteAccount}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {deleting ? 'Suppression…' : 'Supprimer définitivement'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
