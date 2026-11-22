// Missions des scènes de mathématiques (lot 2) : volumes, angles, Pythagore, trigonométrie, sphère, intégrales.
// Les objectifs portent sur les paramètres a/b/c de chaque scène (mêmes conventions que MathSceneEngine).
import type { MissionDef, MissionParams } from '../types.ts';
import { pickN, r } from './helpers.ts';

const fr = (x: number, digits: number) => x.toFixed(digits).replace('.', ','); // affichage décimal français
const toRad = (d: number) => (d * Math.PI) / 180;
const near = (x: number, target: number, tol: number) => Math.abs(x - target) <= tol;

// ---- Volumes (6ᵉ) : a = L, b = l, c = h, volume = L × l × h (valeurs entières)
const volume = (p: MissionParams) => r(p.a) * r(p.b) * r(p.c);
const pairFor = (area: number): [number, number] => {
  for (let L = 1; L <= 6; L++) for (let l = 1; l <= 5; l++) if (L * l === area) return [L, l];
  throw new Error(`aire ${area} impossible`);
};

const volumesMissions: MissionDef[] = [
  {
    id: 'volumes-1', preset: 'volumes_6e', level: 1, kind: 'adjust',
    prompt: 'Construis un pavé de 24 cm³',
    hint: 'V = L × l × h : avec l = 4 et h = 3, il faut L × 12 = 24.',
    start: { a: 1, b: 4, c: 3 }, solution: { a: 2 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 1, max: 6, step: 1, pxPerStep: 40 }],
    goal: (p) => volume(p) === 24,
  },
  {
    id: 'volumes-2', preset: 'volumes_6e', level: 2, kind: 'adjust',
    prompt: 'Construis un pavé de 36 cm³ avec une hauteur de 3 cm',
    hint: 'L × l doit valoir 36 ÷ 3 = 12.',
    start: { a: 1, b: 1, c: 3 }, solution: { a: 4, b: 3 },
    controls: [
      { param: 'a', gesture: 'drag-x', min: 1, max: 6, step: 1, pxPerStep: 40 },
      { param: 'b', gesture: 'drag-y', min: 1, max: 5, step: 1, pxPerStep: 40 },
    ],
    goal: (p) => volume(p) === 36,
  },
  {
    id: 'volumes-3', preset: 'volumes_6e', level: 3, kind: 'adjust',
    prompt: 'Volumes chrono',
    hint: 'La hauteur vaut 2 cm : cherche L × l = V ÷ 2.',
    start: { a: 1, b: 1, c: 2 },
    controls: [
      { param: 'a', gesture: 'drag-x', min: 1, max: 6, step: 1, pxPerStep: 40 },
      { param: 'b', gesture: 'drag-y', min: 1, max: 5, step: 1, pxPerStep: 40 },
    ],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([8, 12, 18, 20, 24, 30], 4, rand).map((v) => {
        const [L, l] = pairFor(v / 2);
        return {
          prompt: `Construis un pavé de ${v} cm³`,
          start: { a: 1, b: 1 },
          solution: { a: L, b: l },
          goal: (p: MissionParams) => volume(p) === v,
        };
      }),
  },
];

// ---- Angles (5ᵉ) : a = α, b = β, troisième angle = 180 − α − β
const third = (p: MissionParams) => 180 - r(p.a) - r(p.b);

const anglesMissions: MissionDef[] = [
  {
    id: 'angles-1', preset: 'angles_5e', level: 1, kind: 'adjust',
    prompt: 'Règle α pour que le troisième angle mesure 60°',
    hint: 'La somme des angles d’un triangle vaut 180° : α = 180 − 60 − 60.',
    start: { a: 30, b: 60, c: 1 }, solution: { a: 60 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 15, max: 120, step: 1, pxPerStep: 3 }],
    goal: (p) => third(p) === 60,
  },
  {
    id: 'angles-2', preset: 'angles_5e', level: 2, kind: 'adjust',
    prompt: 'Construis un triangle rectangle',
    hint: 'Un angle droit mesure 90° : il faut α + β = 90°.',
    start: { a: 40, b: 80, c: 1 }, solution: { b: 50 },
    controls: [
      { param: 'a', gesture: 'drag-x', min: 15, max: 120, step: 1, pxPerStep: 3 },
      { param: 'b', gesture: 'drag-y', min: 15, max: 120, step: 1, pxPerStep: 3 },
    ],
    goal: (p) => third(p) === 90,
  },
  {
    id: 'angles-3', preset: 'angles_5e', level: 3, kind: 'adjust',
    prompt: 'Angles chrono',
    hint: 'β vaut 70° : α = 110 − l’angle demandé.',
    start: { a: 40, b: 70, c: 1 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 15, max: 120, step: 1, pxPerStep: 3 }],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([30, 45, 50, 60, 80], 4, rand).map((t) => ({
        prompt: `Obtiens un troisième angle de ${t}°`,
        start: { a: 40 },
        solution: { a: 110 - t },
        goal: (p: MissionParams) => third(p) === t,
      })),
  },
];

// ---- Pythagore (4ᵉ) : a et b = côtés de l'angle droit, hypoténuse = √(a² + b²)
const hyp = (p: MissionParams) => Math.hypot(p.a, p.b);

const pythagoreMissions: MissionDef[] = [
  {
    id: 'pythagore-1', preset: 'pythagore_4e', level: 1, kind: 'adjust',
    prompt: 'Obtiens une hypoténuse de 5 cm',
    hint: 'a = 3 : il faut b² = 25 − 9 = 16.',
    start: { a: 3, b: 1.5, c: 0 }, solution: { b: 4 },
    controls: [{ param: 'b', gesture: 'drag-x', min: 1.5, max: 4.5, step: 0.5, pxPerStep: 30 }],
    goal: (p) => near(hyp(p), 5, 0.01),
  },
  {
    id: 'pythagore-2', preset: 'pythagore_4e', level: 2, kind: 'adjust',
    prompt: 'Obtiens une hypoténuse de 2,5 cm',
    hint: '1,5² + 2² = 2,25 + 4 = 6,25 = 2,5².',
    start: { a: 3, b: 3, c: 0 }, solution: { a: 1.5, b: 2 },
    controls: [
      { param: 'a', gesture: 'drag-x', min: 1.5, max: 4.5, step: 0.5, pxPerStep: 30 },
      { param: 'b', gesture: 'drag-y', min: 1.5, max: 4.5, step: 0.5, pxPerStep: 30 },
    ],
    goal: (p) => near(hyp(p), 2.5, 0.01),
  },
  {
    id: 'pythagore-3', preset: 'pythagore_4e', level: 3, kind: 'adjust',
    prompt: 'Pythagore chrono',
    hint: 'a = 3 : b² = c² − 9.',
    start: { a: 3, b: 1.5, c: 0 },
    controls: [{ param: 'b', gesture: 'drag-x', min: 1.5, max: 4.5, step: 0.5, pxPerStep: 30 }],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([2, 2.5, 3, 3.5, 4.5], 4, rand).map((b) => {
        const t = Math.hypot(3, b);
        return {
          prompt: `Obtiens une hypoténuse d’environ ${fr(t, 1)} cm`,
          start: { b: 1.5 },
          solution: { b },
          goal: (p: MissionParams) => near(hyp(p), t, 0.06),
        };
      }),
  },
];

// ---- Trigonométrie (3ᵉ) : a = θ en degrés
const cosT = (p: MissionParams) => Math.cos(toRad(p.a));
const sinT = (p: MissionParams) => Math.sin(toRad(p.a));

const trigoMissions: MissionDef[] = [
  {
    id: 'trigo-1', preset: 'trigonometrie_3e', level: 1, kind: 'adjust',
    prompt: 'Règle θ pour que cos θ = 0,5',
    hint: 'cos 60° = 0,5.',
    start: { a: 20, b: 3, c: 1 }, solution: { a: 60 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 10, max: 80, step: 1, pxPerStep: 6 }],
    goal: (p) => near(cosT(p), 0.5, 0.01),
  },
  {
    id: 'trigo-2', preset: 'trigonometrie_3e', level: 2, kind: 'adjust',
    prompt: 'Règle θ pour que sin θ = cos θ',
    hint: 'Le sinus et le cosinus sont égaux pour un angle de 45°.',
    start: { a: 20, b: 3, c: 1 }, solution: { a: 45 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 10, max: 80, step: 1, pxPerStep: 6 }],
    goal: (p) => near(sinT(p), cosT(p), 0.02),
  },
  {
    id: 'trigo-3', preset: 'trigonometrie_3e', level: 3, kind: 'adjust',
    prompt: 'Trigonométrie chrono',
    hint: 'Plus θ grandit, plus cos θ diminue.',
    start: { a: 80, b: 3, c: 1 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 10, max: 80, step: 1, pxPerStep: 6 }],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([20, 30, 40, 50, 70], 4, rand).map((deg) => {
        const t = Math.round(Math.cos(toRad(deg)) * 100) / 100;
        return {
          prompt: `Règle θ pour que cos θ ≈ ${fr(t, 2)}`,
          start: { a: 80 },
          solution: { a: deg },
          goal: (p: MissionParams) => near(cosT(p), t, 0.008),
        };
      }),
  },
];

// ---- Sphère (3ᵉ) : a = R, b = distance d du plan au centre, section r = √(R² − d²) (comme la scène : d ≤ R − 0,05)
const section = (p: MissionParams) => {
  const d = Math.min(p.a - 0.05, p.b);
  return Math.sqrt(Math.max(0, p.a * p.a - d * d));
};

const sphereMissions: MissionDef[] = [
  {
    id: 'sphere-1', preset: 'sphere_3e', level: 1, kind: 'adjust',
    prompt: 'Coupe la sphère pour obtenir une section de rayon 2 cm',
    hint: 'R = 2,5 : d² = 2,5² − 2² = 2,25.',
    start: { a: 2.5, b: 0.5, c: 0.8 }, solution: { b: 1.5 },
    controls: [{ param: 'b', gesture: 'drag-x', min: 0, max: 3.2, step: 0.1, pxPerStep: 12 }],
    goal: (p) => near(section(p), 2, 0.02),
  },
  {
    id: 'sphere-2', preset: 'sphere_3e', level: 2, kind: 'adjust',
    prompt: 'Réalise un grand cercle de rayon 3 cm',
    hint: 'Un grand cercle passe par le centre (d = 0) et son rayon vaut R.',
    start: { a: 2, b: 1, c: 0.8 }, solution: { a: 3, b: 0 },
    controls: [
      { param: 'b', gesture: 'drag-x', min: 0, max: 3.2, step: 0.1, pxPerStep: 12 },
      { param: 'a', gesture: 'drag-y', min: 1.5, max: 3.5, step: 0.1, pxPerStep: 12 },
    ],
    goal: (p) => near(p.a, 3, 0.01) && p.b < 0.01,
  },
  {
    id: 'sphere-3', preset: 'sphere_3e', level: 3, kind: 'adjust',
    prompt: 'Sphère chrono',
    hint: 'R = 3 : plus le plan s’éloigne du centre, plus la section rétrécit.',
    start: { a: 3, b: 0, c: 0.8 },
    controls: [{ param: 'b', gesture: 'drag-x', min: 0, max: 3.2, step: 0.1, pxPerStep: 12 }],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([1, 1.8, 2.2, 2.4, 2.8], 4, rand).map((d) => {
        const t = Math.round(Math.sqrt(9 - d * d) * 100) / 100;
        return {
          prompt: `Obtiens une section de rayon ≈ ${fr(t, 2)} cm`,
          start: { b: 0 },
          solution: { b: d },
          goal: (p: MissionParams) => near(section(p), t, 0.02),
        };
      }),
  },
];

// ---- Intégrales (Terminale) : a = n rectangles, b = amplitude, c = borne ; mêmes calculs que la scène (point milieu)
export function riemannError(n: number, amp: number, upper: number): number {
  const N = Math.max(3, Math.round(n));
  const U = Math.max(1, upper);
  const dx = U / N;
  let sum = 0;
  for (let i = 0; i < N; i++) {
    const x = (i + 0.5) * dx;
    sum += amp * (0.3 * x * x + 0.4) * dx;
  }
  const exact = amp * (0.1 * Math.pow(U, 3) + 0.4 * U);
  return Math.abs(exact - sum);
}
const err = (p: MissionParams) => riemannError(p.a, p.b, p.c);
const nControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 3, max: 24, step: 1, pxPerStep: 20 };

const integralesMissions: MissionDef[] = [
  {
    id: 'integrales-1', preset: 'integrales_term', level: 1, kind: 'adjust',
    prompt: 'Ajoute des rectangles jusqu’à une erreur inférieure à 0,01',
    hint: 'Plus il y a de rectangles, plus la somme de Riemann approche l’intégrale.',
    start: { a: 3, b: 1, c: 3 }, solution: { a: 9 },
    controls: [nControl], goal: (p) => err(p) < 0.01,
  },
  {
    id: 'integrales-2', preset: 'integrales_term', level: 2, kind: 'adjust',
    prompt: 'Erreur inférieure à 0,005 avec le moins de rectangles possible',
    hint: 'L’erreur du point milieu diminue comme 1 / n².',
    start: { a: 3, b: 1, c: 3 }, solution: { a: 12 },
    controls: [nControl],
    goal: (p) => err(p) < 0.005 && riemannError(p.a - 1, p.b, p.c) >= 0.005,
  },
  {
    id: 'integrales-3', preset: 'integrales_term', level: 3, kind: 'adjust',
    prompt: 'Intégrales chrono',
    hint: 'Pour diviser l’erreur par 4, double le nombre de rectangles.',
    start: { a: 3, b: 1, c: 4 },
    controls: [nControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([0.02, 0.01, 0.005, 0.003], 3, rand).map((t) => {
        let n = 3;
        while (riemannError(n, 1, 4) >= t) n++;
        return {
          prompt: `Obtiens une erreur inférieure à ${fr(t, 3).replace(/0+$/, '')}`,
          start: { a: 3 },
          solution: { a: n },
          goal: (p: MissionParams) => err(p) < t,
        };
      }),
  },
];

export const mathsMissions: MissionDef[] = [
  ...volumesMissions,
  ...anglesMissions,
  ...pythagoreMissions,
  ...trigoMissions,
  ...sphereMissions,
  ...integralesMissions,
];
