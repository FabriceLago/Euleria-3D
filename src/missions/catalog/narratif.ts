import type { MissionDef } from '../types.ts';
import { pickN, r } from './helpers.ts';

// Piliers étiquetés step-0 … step-4 dans la scène (Task 4)
const EXTRACTS: Array<[string, number]> = [
  ['« Il était une fois une princesse qui vivait heureuse dans un château. »', 0],
  ['« Un jour, une sorcière jeta un sort sur tout le royaume. »', 1],
  ['« Le prince affronta le dragon au cœur de la forêt sombre. »', 2],
  ['« Grâce à une fée, le sort fut enfin brisé. »', 3],
  ['« Ils vécurent heureux et eurent beaucoup d’enfants. »', 4],
];

export const narratifMissions: MissionDef[] = [
  {
    id: 'narratif-1', preset: 'fr_narrative_3d', level: 1, kind: 'adjust',
    prompt: 'Construis un schéma narratif complet',
    hint: 'Situation initiale, élément perturbateur, péripéties, élément de résolution, situation finale : 5 étapes.',
    start: { a: 3, b: 4, c: 1 }, solution: { a: 5 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 3, max: 6, step: 1, pxPerStep: 50 }],
    goal: (p) => r(p.a) === 5,
  },
  {
    id: 'narratif-2', preset: 'fr_narrative_3d', level: 2, kind: 'identify',
    prompt: 'Touche l’élément perturbateur',
    hint: 'C’est l’événement qui rompt l’équilibre du début.',
    start: { a: 5, b: 4, c: 1 }, targetTag: 'step-1',
  },
  {
    id: 'narratif-3', preset: 'fr_narrative_3d', level: 3, kind: 'identify',
    prompt: 'Schéma narratif chrono',
    hint: 'Début, rupture, aventures, solution, fin.',
    start: { a: 5, b: 4, c: 1 }, timeLimitS: 60,
    rounds: (rand) =>
      pickN(EXTRACTS, 4, rand).map(([extract, i]) => ({
        prompt: `À quelle étape appartient cet extrait ? ${extract}`,
        start: { a: 5 },
        targetTag: `step-${i}`,
      })),
  },
];
