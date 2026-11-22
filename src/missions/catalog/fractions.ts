import type { MissionControl, MissionDef, MissionParams } from '../types.ts';
import { pickN, r } from './helpers.ts';

const isFrac = (n: number, d: number) => (p: MissionParams) => r(p.a) === n && r(p.b) === d;
const tapSlices: MissionControl = { param: 'a', gesture: 'tap', tagPrefix: 'slice-', offset: 1, min: 1, max: 12, step: 1 };

export const fractionsMissions: MissionDef[] = [
  {
    id: 'fractions-1', preset: 'fractions_3d', level: 1, kind: 'adjust',
    prompt: 'Montre 3/4 du bloc',
    hint: 'Le dénominateur (4) compte les tranches ; colores-en 3.',
    start: { a: 1, b: 4, c: 1 }, solution: { a: 3 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 1, max: 4, step: 1, pxPerStep: 40 }, tapSlices],
    goal: isFrac(3, 4),
  },
  {
    id: 'fractions-2', preset: 'fractions_3d', level: 2, kind: 'adjust',
    prompt: 'Représente 2/3 avec 12 tranches',
    hint: '2/3 = 8/12 : multiplie le numérateur et le dénominateur par 4.',
    start: { a: 1, b: 12, c: 1 }, solution: { a: 8 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 1, max: 12, step: 1, pxPerStep: 28 }, tapSlices],
    goal: isFrac(8, 12),
  },
  {
    id: 'fractions-3', preset: 'fractions_3d', level: 3, kind: 'adjust',
    prompt: 'Fractions chrono',
    hint: 'Glisse horizontalement pour le numérateur, verticalement pour le dénominateur.',
    start: { a: 1, b: 12, c: 1 },
    controls: [
      { param: 'a', gesture: 'drag-x', min: 1, max: 12, step: 1, pxPerStep: 28 },
      { param: 'b', gesture: 'drag-y', min: 2, max: 12, step: 1, pxPerStep: 28 },
      tapSlices,
    ],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([[1, 2], [3, 4], [5, 6], [3, 8], [2, 5], [7, 10]], 4, rand).map(([n, d]) => ({
        prompt: `Montre ${n}/${d}`,
        start: { a: 1, b: 12 },
        solution: { a: n, b: d },
        goal: isFrac(n, d),
      })),
  },
];
