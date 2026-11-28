import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall.ts';
import { useDialog } from '../hooks/useDialog.ts';

interface PWAInstallButtonProps {
  variant?: 'inline' | 'drawer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'inline' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const guideRef = useDialog(showGuide, () => setShowGuide(false));

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  const showButton = isInstallable || isIOS || variant === 'drawer';
  if (!showButton) {
    return null;
  }

  return (
    <>
      {variant === 'drawer' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer whitespace-nowrap"
        >
          {isInstallable ? <Download className="w-4 h-4 shrink-0" /> : <Smartphone className="w-4 h-4 shrink-0" />}
          <span>{isInstallable ? 'Installer l’application Euleria 3D' : 'Installer sur mobile / bureau (PWA)'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 font-medium text-indigo-700 dark:text-indigo-300 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>{isIOS ? 'Installer sur iOS' : 'Installer l’app'}</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div
            ref={guideRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
            className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 id="pwa-guide-title" className="text-base font-semibold text-slate-900 dark:text-white">
                {isIOS ? 'Installer sur iPhone / iPad' : 'Installer Euleria 3D (PWA)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Fermer"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {isIOS ? (
              <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>Appuyez sur le bouton <strong>Partager</strong> dans la barre de Safari.</li>
                <li>Faites défiler vers le bas puis touchez <strong>Sur l’écran d’accueil</strong>.</li>
                <li>Confirmez avec <strong>Ajouter</strong> pour réviser hors-ligne.</li>
              </ol>
            ) : (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Ouvrez le menu de votre navigateur (Chrome, Edge ou Brave) puis cliquez sur{' '}
                <strong>Installer Euleria 3D</strong> pour lancer la plateforme comme une application native avec accès hors-ligne.
              </p>
            )}
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-lg bg-slate-900 dark:bg-white py-2 text-xs font-semibold text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-3.5 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Mode hors-ligne actif · Fiches, flashcards et cours en cache disponibles</span>
    </div>
  );
};
