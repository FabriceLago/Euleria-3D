import type { MissionControl, MissionDef } from '../types.ts';
import { pickN, r } from './helpers.ts';

// a : 1 Present Simple · 2 BE+ing · 3 Past · 4 Present Perfect · 5 Future · 6 Past Perfect — poteaux étiquetés tense-1 … tense-6
const tapTense: MissionControl = { param: 'a', gesture: 'tap', tagPrefix: 'tense-', offset: 0, min: 1, max: 6, step: 1 };
const dragTense: MissionControl = { param: 'a', gesture: 'drag-x', min: 1, max: 6, step: 1, pxPerStep: 50 };

const SENTENCES: Array<[string, number]> = [
  ['He plays football every Saturday.', 1],
  ['She is reading a book right now.', 2],
  ['They visited London last year.', 3],
  ['I have lived here since 2010.', 4],
  ['I will call you tomorrow.', 5],
  ['When we arrived, the film had already started.', 6],
];

export const tempsMissions: MissionDef[] = [
  {
    id: 'temps-1', preset: 'en_tense_3d', level: 1, kind: 'adjust',
    prompt: 'Montre le temps d’une action en cours (BE + V-ing)',
    hint: 'Present Continuous : am/is/are + verbe en -ing.',
    start: { a: 1, b: 8, c: 1 }, solution: { a: 2 },
    controls: [dragTense, tapTense], goal: (p) => r(p.a) === 2,
  },
  {
    id: 'temps-2', preset: 'en_tense_3d', level: 2, kind: 'adjust',
    prompt: 'Sphère du passé : montre l’action antérieure à une autre action passée',
    hint: 'Past Perfect : had + participe passé, dans la sphère du passé.',
    start: { a: 1, b: 8, c: 1 }, solution: { a: 6, c: 2 },
    controls: [dragTense, tapTense, { param: 'c', gesture: 'drag-y', min: 1, max: 3, step: 1, pxPerStep: 60 }],
    goal: (p) => r(p.a) === 6 && r(p.c) === 2,
  },
  {
    id: 'temps-3', preset: 'en_tense_3d', level: 3, kind: 'identify',
    prompt: 'Temps anglais chrono',
    hint: 'Cherche les marqueurs : every, now, last, since, tomorrow, already.',
    start: { a: 1, b: 8, c: 1 }, timeLimitS: 60,
    rounds: (rand) =>
      pickN(SENTENCES, 4, rand).map(([s, n]) => ({
        prompt: `Quel temps ? « ${s} »`,
        start: { a: 1 },
        targetTag: `tense-${n}`,
      })),
  },
];
