import { lazy, type ComponentType } from 'react';

const RELOAD_FLAG = 'euleria:chunk-reload';

/**
 * React.lazy qui survit à un déploiement : une page restée ouverte (ou servie par le service worker)
 * peut réclamer un fichier d'écran qui n'existe plus. Au premier échec, on recharge une seule fois
 * pour récupérer la nouvelle version ; si l'échec persiste, l'erreur remonte (pas de boucle).
 */
export function lazyWithReload<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await load();
      try {
        sessionStorage.removeItem(RELOAD_FLAG);
      } catch {
        // stockage indisponible : sans conséquence
      }
      return mod;
    } catch (error) {
      let alreadyReloaded = true; // sans stockage, on ne recharge pas (évite toute boucle)
      try {
        alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1';
        sessionStorage.setItem(RELOAD_FLAG, '1');
      } catch {
        // stockage indisponible
      }
      if (!alreadyReloaded) {
        window.location.reload();
        return new Promise<never>(() => {}); // la page se recharge
      }
      throw error;
    }
  });
}
