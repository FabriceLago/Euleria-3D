// Missions des scènes de mathématiques : volumes, angles, Pythagore, trigonométrie, sphère, intégrales,
// prisme, parabole, produit scalaire, probabilités, prédiction.
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

// ---- Prisme (5ᵉ) : a = r, b = n côtés de la base, c = h ; V = B × h (même calcul que la scène)
// Même formule que prismBaseArea (MathSceneEngine) : polygone régulier à n côtés inscrit dans le cercle de rayon r
const prismBaseArea = (rad: number, n: number) => (n / 2) * rad * rad * Math.sin((2 * Math.PI) / n);
const prismVol = (p: MissionParams) => prismBaseArea(p.a, Math.max(3, r(p.b))) * p.c;
const hControl = { param: 'c' as const, gesture: 'drag-x' as const, min: 1, max: 8, step: 0.25, pxPerStep: 16 };

const prismeMissions: MissionDef[] = [
  {
    id: 'prisme-1', preset: 'prisme_5e', level: 1, kind: 'adjust',
    prompt: 'Règle la hauteur pour obtenir un prisme de 24 cm³',
    hint: 'La base est un carré d’aire B = 8 cm² : h = 24 ÷ 8.',
    start: { a: 2, b: 4, c: 1 }, solution: { c: 3 },
    controls: [hControl], goal: (p) => near(prismVol(p), 24, 0.01),
  },
  {
    id: 'prisme-2', preset: 'prisme_5e', level: 2, kind: 'adjust',
    prompt: 'Ajoute des côtés jusqu’à ce que le prisme atteigne 99 % du volume du cylindre',
    hint: 'Plus la base a de côtés, plus le prisme ressemble au cylindre.',
    start: { a: 2, b: 4, c: 3 }, solution: { b: 26 },
    controls: [{ param: 'b', gesture: 'drag-x', min: 3, max: 40, step: 1, pxPerStep: 10 }],
    goal: (p) => prismVol(p) >= 0.99 * Math.PI * p.a * p.a * p.c,
  },
  {
    id: 'prisme-3', preset: 'prisme_5e', level: 3, kind: 'adjust',
    prompt: 'Prismes chrono',
    hint: 'Base carrée d’aire 8 cm² : h = V ÷ 8.',
    start: { a: 2, b: 4, c: 1 },
    controls: [hControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([2, 2.5, 4, 5, 6], 4, rand).map((h) => ({
        prompt: `Obtiens un prisme de ${8 * h} cm³`,
        start: { c: 1 },
        solution: { c: h },
        goal: (p: MissionParams) => near(prismVol(p), 8 * h, 0.01),
      })),
  },
];

// ---- Parabole (2nde) : f(x) = ax² + bx + c, sommet α = −b / 2a, β = f(α)
const vertexX = (p: MissionParams) => (Math.abs(p.a) < 0.05 ? NaN : -p.b / (2 * p.a));
const vertexY = (p: MissionParams) => p.c - (p.b * p.b) / (4 * p.a);
const bControl = { param: 'b' as const, gesture: 'drag-x' as const, min: -4, max: 4, step: 0.1, pxPerStep: 8 };
const decimal = (x: number) => fr(x, 2).replace(/0$/, '').replace(/,0$/, '');

const paraboleMissions: MissionDef[] = [
  {
    id: 'parabole-1', preset: 'parabole_2nde', level: 1, kind: 'adjust',
    prompt: 'Déplace le sommet de la parabole en x = 2',
    hint: 'α = −b / (2a) : avec a = 1, il faut b = −4.',
    start: { a: 1, b: 0, c: 0 }, solution: { b: -4 },
    controls: [bControl], goal: (p) => near(vertexX(p), 2, 0.01),
  },
  {
    id: 'parabole-2', preset: 'parabole_2nde', level: 2, kind: 'adjust',
    prompt: 'Retourne la parabole pour qu’elle ait un maximum égal à 2',
    hint: 'a < 0 donne un maximum ; avec b = 0, le sommet est en (0 ; c).',
    start: { a: 1, b: 0, c: -1 }, solution: { a: -1, c: 2 },
    controls: [
      { param: 'a', gesture: 'drag-y', min: -3, max: 3, step: 0.1, pxPerStep: 8 },
      { param: 'c', gesture: 'drag-x', min: -4, max: 4, step: 0.1, pxPerStep: 8 },
    ],
    goal: (p) => p.a <= -0.05 && near(vertexY(p), 2, 0.01),
  },
  {
    id: 'parabole-3', preset: 'parabole_2nde', level: 3, kind: 'adjust',
    prompt: 'Paraboles chrono',
    hint: 'a = 1 : b = −2 × l’abscisse demandée.',
    start: { a: 1, b: 0, c: 0 },
    controls: [bControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([-1.5, -1, -0.5, 0.5, 1, 1.5], 4, rand).map((t) => ({
        prompt: `Place le sommet en x = ${decimal(t)}`,
        start: { b: 0 },
        solution: { b: -2 * t },
        goal: (p: MissionParams) => near(vertexX(p), t, 0.01),
      })),
  },
];

// ---- Produit scalaire (1re) : a = θ en degrés, b = ‖u‖, c = ‖v‖
const dot = (p: MissionParams) => p.b * p.c * Math.cos(toRad(p.a));
const thetaControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 0, max: 180, step: 5, pxPerStep: 8 };

const scalaireMissions: MissionDef[] = [
  {
    id: 'scalaire-1', preset: 'produit_scalaire_1ere', level: 1, kind: 'adjust',
    prompt: 'Rends les vecteurs u et v orthogonaux',
    hint: 'u · v = 0 quand cos θ = 0, c’est-à-dire θ = 90°.',
    start: { a: 30, b: 3, c: 2.5 }, solution: { a: 90 },
    controls: [thetaControl], goal: (p) => near(dot(p), 0, 0.01),
  },
  {
    id: 'scalaire-2', preset: 'produit_scalaire_1ere', level: 2, kind: 'adjust',
    prompt: 'Obtiens u · v = 6',
    hint: 'À 60°, cos θ = 0,5 : il faut ‖u‖ × ‖v‖ = 12.',
    start: { a: 60, b: 3, c: 1.5 }, solution: { c: 4 },
    controls: [thetaControl, { param: 'c', gesture: 'drag-y', min: 1, max: 6, step: 0.25, pxPerStep: 16 }],
    goal: (p) => near(dot(p), 6, 0.01),
  },
  {
    id: 'scalaire-3', preset: 'produit_scalaire_1ere', level: 3, kind: 'adjust',
    prompt: 'Produit scalaire chrono',
    hint: '‖u‖ × ‖v‖ = 8 : u · v = 8 cos θ.',
    start: { a: 30, b: 4, c: 2 },
    controls: [thetaControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([0, 60, 90, 120, 180], 4, rand).map((deg) => {
        const t = Math.round(8 * Math.cos(toRad(deg)));
        return {
          prompt: `Obtiens u · v = ${t}`,
          start: { a: 30 },
          solution: { a: deg },
          goal: (p: MissionParams) => near(dot(p), t, 0.01),
        };
      }),
  },
];

// ---- Probabilités (1re) : a = P(A), b = P(B|A), c = P(B|¬A) ; P(A|B) par la formule de Bayes
const posterior = (p: MissionParams) => (p.b * p.a) / (p.b * p.a + p.c * (1 - p.a));
const fpControl = { param: 'c' as const, gesture: 'drag-x' as const, min: 0.05, max: 0.95, step: 0.05, pxPerStep: 14 };

const bayesMissions: MissionDef[] = [
  {
    id: 'bayes-1', preset: 'probabilites_1ere', level: 1, kind: 'adjust',
    prompt: 'Obtiens P(A | B) = 50 %',
    hint: 'Si P(B | ¬A) = P(B | A), observer B n’apprend rien : P(A | B) = P(A).',
    start: { a: 0.5, b: 0.8, c: 0.4 }, solution: { c: 0.8 },
    controls: [fpControl], goal: (p) => near(posterior(p), 0.5, 0.005),
  },
  {
    id: 'bayes-2', preset: 'probabilites_1ere', level: 2, kind: 'adjust',
    prompt: 'Maladie rare (P(A) = 10 %) : fais dépasser 60 % à P(A | B)',
    hint: 'Avec un prior faible, ce sont les faux positifs P(B | ¬A) qu’il faut réduire.',
    start: { a: 0.1, b: 0.9, c: 0.5 }, solution: { c: 0.05 },
    controls: [fpControl, { param: 'b', gesture: 'drag-y', min: 0.05, max: 0.95, step: 0.05, pxPerStep: 14 }],
    goal: (p) => posterior(p) > 0.6,
  },
  {
    id: 'bayes-3', preset: 'probabilites_1ere', level: 3, kind: 'adjust',
    prompt: 'Bayes chrono',
    hint: 'P(A) = 0,5 et P(B | A) = 0,8 : moins de faux positifs, P(A | B) plus grand.',
    start: { a: 0.5, b: 0.8, c: 0.95 },
    controls: [fpControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([0.1, 0.2, 0.4, 0.6, 0.8], 4, rand).map((fp) => {
        const t = 0.4 / (0.4 + 0.5 * fp);
        return {
          prompt: `Obtiens P(A | B) ≈ ${Math.round(t * 100)} %`,
          start: { c: 0.95 },
          solution: { c: fp },
          goal: (p: MissionParams) => near(posterior(p), t, 0.005),
        };
      }),
  },
];

// ---- Prédiction (Terminale) : a = w, b = biais ; σ(w·x + b), seuil 50 % en x = −b / w
const threshold = (p: MissionParams) => -p.b / p.a;
const sigmoidAt1 = (p: MissionParams) => 1 / (1 + Math.exp(-(p.a + p.b)));
const biasControl = { param: 'b' as const, gesture: 'drag-x' as const, min: -1.5, max: 1.5, step: 0.1, pxPerStep: 10 };

const predictionMissions: MissionDef[] = [
  {
    id: 'prediction-1', preset: 'prediction_term', level: 1, kind: 'adjust',
    prompt: 'Place le seuil de décision en x = 0',
    hint: 'Le seuil vaut x = −b / w : il faut un biais b = 0.',
    start: { a: 1.8, b: 0.4, c: 0.38 }, solution: { b: 0 },
    controls: [biasControl], goal: (p) => near(threshold(p), 0, 0.01),
  },
  {
    id: 'prediction-2', preset: 'prediction_term', level: 2, kind: 'adjust',
    prompt: 'Obtiens une prédiction de 50 % en x = 1',
    hint: 'σ(z) = 0,5 quand z = 0 : il faut w + b = 0.',
    start: { a: 1.8, b: 0.4, c: 0.38 }, solution: { a: 1, b: -1 },
    controls: [
      { param: 'a', gesture: 'drag-y', min: 0.5, max: 4, step: 0.1, pxPerStep: 10 },
      biasControl,
    ],
    goal: (p) => near(sigmoidAt1(p), 0.5, 0.005),
  },
  {
    id: 'prediction-3', preset: 'prediction_term', level: 3, kind: 'adjust',
    prompt: 'Prédiction chrono',
    hint: 'w = 2 : b = −2 × la position du seuil.',
    start: { a: 2, b: 0, c: 0.38 },
    controls: [biasControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([-0.5, -0.25, 0.25, 0.5, 0.75], 4, rand).map((t) => ({
        prompt: `Place le seuil 50 % en x = ${decimal(t)}`,
        start: { b: 0 },
        solution: { b: -2 * t },
        goal: (p: MissionParams) => near(threshold(p), t, 0.01),
      })),
  },
];

// ---- Pyramides et cônes (4ᵉ) : a = côté / rayon, b = h, c = 1 pyramide / 2 cône ; V = (1/3) × B × h (comme computeReadout)
const pyrVol = (p: MissionParams) => ((r(p.c) >= 2 ? Math.PI * p.a * p.a : p.a * p.a) * p.b) / 3;
const pyrHControl = { param: 'b' as const, gesture: 'drag-y' as const, min: 1, max: 10, step: 0.5, pxPerStep: 14 };

const pyramideMissions: MissionDef[] = [
  {
    id: 'pyramide-1', preset: 'pyramide_4e', level: 1, kind: 'adjust',
    prompt: 'Base carrée de 6 cm : règle la hauteur pour obtenir une pyramide de 60 cm³',
    hint: 'V = (1/3) × 6 × 6 × h = 12 × h.',
    start: { a: 6, b: 2, c: 1 }, solution: { b: 5 },
    controls: [pyrHControl], goal: (p) => r(p.c) === 1 && near(pyrVol(p), 60, 0.01),
  },
  {
    id: 'pyramide-2', preset: 'pyramide_4e', level: 2, kind: 'adjust',
    prompt: 'Construis un cône de volume 12π ≈ 37,70 cm³ et de génératrice 5 cm',
    hint: 'r² × h = 36 et r² + h² = 25 (Pythagore) : cherche un triangle 3-4-5.',
    start: { a: 2, b: 6, c: 2 }, solution: { a: 3, b: 4 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 1, max: 6, step: 0.5, pxPerStep: 16 }, pyrHControl],
    goal: (p) => r(p.c) === 2 && near(pyrVol(p), 12 * Math.PI, 0.01) && near(Math.hypot(p.a, p.b), 5, 0.01),
  },
  {
    id: 'pyramide-3', preset: 'pyramide_4e', level: 3, kind: 'adjust',
    prompt: 'Pyramides chrono',
    hint: 'Base carrée de 3 cm : B = 9 cm², donc V = 3 × h.',
    start: { a: 3, b: 1, c: 1 },
    controls: [pyrHControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([2, 4, 5, 6, 8, 10], 4, rand).map((h) => ({
        prompt: `Base carrée de 3 cm : obtiens une pyramide de ${3 * h} cm³`,
        start: { b: 1 },
        solution: { b: h },
        goal: (p: MissionParams) => near(pyrVol(p), 3 * h, 0.01),
      })),
  },
];

// ---- Vecteurs (2nde) : u(a ; b), v(c ; 2) ; det(u, v) = 2a − bc (comme computeReadout)
const det = (p: MissionParams) => r(p.a) * 2 - r(p.b) * r(p.c);
const uControls = [
  { param: 'a' as const, gesture: 'drag-x' as const, min: -5, max: 5, step: 1, pxPerStep: 24 },
  { param: 'b' as const, gesture: 'drag-y' as const, min: -5, max: 5, step: 1, pxPerStep: 24 },
];
const SUMS: Array<[number, number]> = [[4, 6], [2, 5], [6, 3], [5, 7], [3, 4], [1, 6]];

const vecteursMissions: MissionDef[] = [
  {
    id: 'vecteurs-1', preset: 'vecteurs_2nde', level: 1, kind: 'adjust',
    prompt: 'Donne au vecteur u une norme de 5',
    hint: '‖u‖ = √(x² + y²) : pense au triangle 3-4-5.',
    start: { a: 1, b: 1, c: 2 }, solution: { a: 3, b: 4 },
    controls: uControls, goal: (p) => Math.hypot(r(p.a), r(p.b)) === 5,
  },
  {
    id: 'vecteurs-2', preset: 'vecteurs_2nde', level: 2, kind: 'adjust',
    prompt: 'Rends u colinéaire à v(3 ; 2), sans le rendre nul',
    hint: 'det(u, v) = x × 2 − y × 3 doit valoir 0.',
    start: { a: 1, b: 3, c: 3 }, solution: { a: 3, b: 2 },
    controls: uControls, goal: (p) => r(p.c) === 3 && det(p) === 0 && (r(p.a) !== 0 || r(p.b) !== 0),
  },
  {
    id: 'vecteurs-3', preset: 'vecteurs_2nde', level: 3, kind: 'adjust',
    prompt: 'Vecteurs chrono',
    hint: 'v(1 ; 2) : u = (u + v) − v.',
    start: { a: 0, b: 0, c: 1 },
    controls: uControls,
    timeLimitS: 60,
    rounds: (rand) =>
      pickN(SUMS, 4, rand).map(([sx, sy]) => ({
        prompt: `Avec v(1 ; 2), obtiens u + v = (${sx} ; ${sy})`,
        start: { a: 0, b: 0 },
        solution: { a: sx - 1, b: sy - 2 },
        goal: (p: MissionParams) => r(p.c) === 1 && r(p.a) + 1 === sx && r(p.b) + 2 === sy,
      })),
  },
];

export const mathsMissions: MissionDef[] = [
  ...pyramideMissions,
  ...vecteursMissions,
  ...prismeMissions,
  ...paraboleMissions,
  ...scalaireMissions,
  ...bayesMissions,
  ...predictionMissions,
  ...volumesMissions,
  ...anglesMissions,
  ...pythagoreMissions,
  ...trigoMissions,
  ...sphereMissions,
  ...integralesMissions,
];
