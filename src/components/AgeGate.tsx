import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

// Écran d'âge (audit 2.3) : affiché après la connexion Google, avant toute création de compte.
// Le mois et l'année servent uniquement au calcul côté serveur ; ils ne sont jamais enregistrés.
const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

interface AgeGateProps {
  onConfirm: (birthYear: number, birthMonth: number) => Promise<'ok' | 'under_age' | 'error'>;
  onCancel: () => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({ onConfirm, onCancel }) => {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => thisYear - 5 - i);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'under_age' | 'error' | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month || !year) return;
    setBusy(true);
    const outcome = await onConfirm(Number(year), Number(month));
    setBusy(false);
    if (outcome !== 'ok') setResult(outcome);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl"
      >
        {result === 'under_age' ? (
          <>
            <h2 id="age-gate-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Pas de compte avant 15 ans
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Pour protéger tes données, il faut avoir au moins 15 ans pour créer un compte. Aucun compte n’a été créé et ta connexion
              Google a été effacée de notre côté.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Tu peux continuer à utiliser Euleria sans compte : cours, scènes 3D, quiz et missions restent accessibles. Seuls la
              sauvegarde de ta progression et le chat demandent un compte.
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="mt-5 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 cursor-pointer"
            >
              Continuer sans compte
            </button>
          </>
        ) : (
          <form onSubmit={submit}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <h2 id="age-gate-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Une dernière étape
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Pour créer ton compte, indique ton mois et ton année de naissance. Il faut avoir au moins 15 ans. Ces informations
              servent seulement à cette vérification : elles ne sont pas enregistrées.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Mois de naissance
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  <option value="">—</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Année de naissance
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  <option value="">—</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {result === 'error' && (
              <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                La vérification n’a pas abouti. Réessaie dans un instant.
              </p>
            )}
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={busy || !month || !year}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {busy ? 'Vérification…' : 'Créer mon compte'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
