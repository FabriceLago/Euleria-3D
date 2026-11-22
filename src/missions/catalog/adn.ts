import type { MissionDef, MissionParams } from '../types.ts';
import { pickN, r } from './helpers.ts';

/** Règle de Chargaff : A = T et G = C, donc %G = 50 − %A. b = %A dans la scène. */
const guanine = (p: MissionParams) => 50 - r(p.b);

export const adnMissions: MissionDef[] = [
  {
    id: 'adn-1', preset: 'svt_dna_3d', level: 1, kind: 'adjust',
    prompt: 'Règle l’adénine pour que la guanine soit à 30 %',
    hint: 'A = T et G = C, donc A + G = 50 %.',
    start: { a: 10, b: 15, c: 1 }, solution: { b: 20 },
    controls: [{ param: 'b', gesture: 'drag-x', min: 15, max: 35, step: 1, pxPerStep: 20 }],
    goal: (p) => guanine(p) === 30,
  },
  {
    id: 'adn-2', preset: 'svt_dna_3d', level: 2, kind: 'adjust',
    prompt: 'Construis 10 paires de nucléotides avec 25 % d’adénine',
    hint: 'Glisse verticalement pour le nombre de paires, horizontalement pour l’adénine.',
    start: { a: 6, b: 15, c: 1 }, solution: { a: 10, b: 25 },
    controls: [
      { param: 'b', gesture: 'drag-x', min: 15, max: 35, step: 1, pxPerStep: 20 },
      { param: 'a', gesture: 'drag-y', min: 6, max: 16, step: 1, pxPerStep: 30 },
    ],
    goal: (p) => r(p.a) === 10 && r(p.b) === 25,
  },
  {
    id: 'adn-3', preset: 'svt_dna_3d', level: 3, kind: 'adjust',
    prompt: 'ADN chrono',
    hint: '%A = 50 − %G.',
    start: { a: 10, b: 25, c: 1 },
    controls: [{ param: 'b', gesture: 'drag-x', min: 15, max: 35, step: 1, pxPerStep: 20 }],
    timeLimitS: 45,
    rounds: (rand) =>
      pickN([18, 22, 27, 31, 34], 4, rand).map((g) => ({
        prompt: `Atteins ${g} % de guanine`,
        start: { b: 25 },
        solution: { b: 50 - g },
        goal: (p: MissionParams) => guanine(p) === g,
      })),
  },
];
