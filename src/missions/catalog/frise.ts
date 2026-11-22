import type { MissionDef, MissionParams } from '../types.ts';
import { pickN, r } from './helpers.ts';

// Libellés déjà présents dans les dictionnaires EN/NL (quiz dynamique) : traduits automatiquement.
const EVENTS: Array<[string, number]> = [
  ['la Révolution française', 1789],
  ['l’abolition de l’esclavage en France', 1848],
  ['le déclenchement de la Première Guerre mondiale', 1914],
  ['la fin de la Seconde Guerre mondiale', 1945],
  ['le traité de Rome (CEE)', 1957],
  ['la chute du mur de Berlin', 1989],
];

export const friseMissions: MissionDef[] = [
  {
    id: 'frise-1', preset: 'hg_timeline_3d', level: 1, kind: 'adjust',
    prompt: 'Place la fin de la frise sur la Révolution française (1789)',
    hint: 'La prise de la Bastille a lieu le 14 juillet 1789.',
    start: { a: 1750, b: 1600, c: 1 }, solution: { a: 1789 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 1600, max: 2025, step: 1, pxPerStep: 4 }],
    goal: (p) => r(p.a) === 1789,
  },
  {
    id: 'frise-2', preset: 'hg_timeline_3d', level: 2, kind: 'adjust',
    prompt: 'Mesure la durée entre 1789 et 1848 : règle le début et la fin',
    hint: 'Début = 1789 (glisse verticalement), fin = 1848 (glisse horizontalement).',
    start: { a: 1900, b: 1700, c: 2 }, solution: { a: 1848, b: 1789 },
    controls: [
      { param: 'a', gesture: 'drag-x', min: 1600, max: 2025, step: 1, pxPerStep: 4 },
      { param: 'b', gesture: 'drag-y', min: 1600, max: 2000, step: 1, pxPerStep: 4 },
    ],
    goal: (p) => r(p.a) === 1848 && r(p.b) === 1789,
  },
  {
    id: 'frise-3', preset: 'hg_timeline_3d', level: 3, kind: 'adjust',
    prompt: 'Frise chrono',
    hint: 'Les flèches du clavier ajustent l’année une par une.',
    start: { a: 1850, b: 1600, c: 3 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 1600, max: 2025, step: 1, pxPerStep: 2 }],
    timeLimitS: 90,
    rounds: (rand) =>
      pickN(EVENTS, 4, rand).map(([label, year]) => ({
        prompt: `Place la fin de la frise sur ${label}`,
        start: { a: 1850 },
        solution: { a: year },
        goal: (p: MissionParams) => r(p.a) === year,
      })),
  },
];
