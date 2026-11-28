import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const CHECK_EVERY_MS = 60 * 60 * 1000; // vérifie s'il existe une nouvelle version toutes les heures

// Mise à jour de l'app (audit 3.9) : une nouvelle version attend l'accord de l'élève au lieu de rester bloquée
export const UpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => void registration.update(), CHECK_EVERY_MS);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 p-4 shadow-lg flex items-center gap-3"
    >
      <RefreshCw className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
      <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">Mise à jour disponible</p>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
      >
        Plus tard
      </button>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
      >
        Recharger
      </button>
    </div>
  );
};
