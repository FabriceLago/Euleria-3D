// Meilleures étoiles par mission, propres à l'appareil (confort local, pas une donnée de référence).
const KEY = 'euleria.missions.best';

export function loadBest(): Record<string, number> {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

export function saveBest(id: string, stars: number): Record<string, number> {
  const cur = loadBest();
  if ((cur[id] ?? 0) < stars) {
    cur[id] = stars;
    try {
      localStorage.setItem(KEY, JSON.stringify(cur));
    } catch {
      // stockage indisponible : affichage seulement pour la session
    }
  }
  return cur;
}
