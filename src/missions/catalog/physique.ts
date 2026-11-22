// Missions des scènes de physique-chimie (hors optique, voir refraction.ts).
// Les objectifs reprennent les formules affichées par computeReadout (MathSceneEngine) pour chaque scène.
import type { MissionDef, MissionParams } from '../types.ts';
import { pickN, r } from './helpers.ts';

const fr = (x: number, digits: number) => x.toFixed(digits).replace('.', ',');
const near = (x: number, target: number, tol: number) => Math.abs(x - target) <= tol;
const toRad = (d: number) => (d * Math.PI) / 180;

// ---- États de la matière : a = T (°C), b = ρ (g/cm³), c = V (L) ; m = ρ × V (kg)
const mass = (p: MissionParams) => p.b * p.c;
const vControl = { param: 'c' as const, gesture: 'drag-x' as const, min: 1, max: 4, step: 0.2, pxPerStep: 16 };

const etatsMissions: MissionDef[] = [
  {
    id: 'etats-1', preset: 'pc_states_matter', level: 1, kind: 'adjust',
    prompt: 'Fais fondre la glace : passe à l’état liquide',
    hint: 'L’eau fond à 0 °C et bout à 100 °C.',
    start: { a: -15, b: 1, c: 2 }, solution: { a: 0 },
    controls: [{ param: 'a', gesture: 'drag-x', min: -20, max: 140, step: 5, pxPerStep: 10 }],
    goal: (p) => p.a >= 0 && p.a < 100,
  },
  {
    id: 'etats-2', preset: 'pc_states_matter', level: 2, kind: 'adjust',
    prompt: 'Obtiens une masse de 6 kg',
    hint: 'm = ρ × V : avec ρ en g/cm³ et V en L, la masse est en kg.',
    start: { a: 20, b: 1, c: 1 }, solution: { b: 2, c: 3 },
    controls: [vControl, { param: 'b', gesture: 'drag-y', min: 0.5, max: 3, step: 0.1, pxPerStep: 12 }],
    goal: (p) => near(mass(p), 6, 0.01),
  },
  {
    id: 'etats-3', preset: 'pc_states_matter', level: 3, kind: 'adjust',
    prompt: 'Masses chrono',
    hint: 'ρ = 1,5 g/cm³ : V = m ÷ 1,5.',
    start: { a: 20, b: 1.5, c: 1 },
    controls: [vControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([1.2, 2, 2.4, 3.2, 4], 4, rand).map((v) => ({
        prompt: `Obtiens une masse de ${fr(1.5 * v, 1)} kg`,
        start: { c: 1 },
        solution: { c: v },
        goal: (p: MissionParams) => near(mass(p), 1.5 * v, 0.01),
      })),
  },
];

// ---- Projectile : a = v₀ (m/s), b = α (°), c = g ; portée X = v₀² sin(2α) / g
const range = (p: MissionParams) => (p.a * p.a * Math.sin(toRad(2 * p.b))) / Math.max(1, p.c);
const v0Control = { param: 'a' as const, gesture: 'drag-x' as const, min: 6, max: 26, step: 1, pxPerStep: 14 };
const alphaControl = { param: 'b' as const, gesture: 'drag-y' as const, min: 15, max: 75, step: 1, pxPerStep: 6 };

const projectileMissions: MissionDef[] = [
  {
    id: 'projectile-1', preset: 'pc_projectile_3d', level: 1, kind: 'adjust',
    prompt: 'Règle l’angle de tir pour obtenir la portée maximale',
    hint: 'La portée v₀² sin(2α) / g est maximale quand sin(2α) = 1.',
    start: { a: 15, b: 20, c: 9.8 }, solution: { b: 45 },
    controls: [{ ...alphaControl, gesture: 'drag-x' }],
    goal: (p) => r(p.b) === 45,
  },
  {
    id: 'projectile-2', preset: 'pc_projectile_3d', level: 2, kind: 'adjust',
    prompt: 'Atteins une cible à 40 m (g = 10 m/s²)',
    hint: 'À 45°, X = v₀² / g : il faut v₀² = 400.',
    start: { a: 10, b: 30, c: 10 }, solution: { a: 20, b: 45 },
    controls: [v0Control, alphaControl],
    goal: (p) => near(range(p), 40, 0.5),
  },
  {
    id: 'projectile-3', preset: 'pc_projectile_3d', level: 3, kind: 'adjust',
    prompt: 'Projectile chrono',
    hint: 'α = 45° et g = 10 : X = v₀² / 10.',
    start: { a: 6, b: 45, c: 10 },
    controls: [v0Control],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([10, 14, 18, 20, 24], 4, rand).map((v) => ({
        prompt: `Atteins une cible à ${fr((v * v) / 10, 1)} m`,
        start: { a: 6 },
        solution: { a: v },
        goal: (p: MissionParams) => near(range(p), (v * v) / 10, 0.3),
      })),
  },
];

// ---- Circuit : a = U (V), b = R (Ω), c = 1 série / 2 dérivation ; I = U / R_eq
const current = (p: MissionParams) => p.a / Math.max(1, r(p.c) >= 2 ? p.b / 2 : p.b);
const uControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 1.5, max: 24, step: 0.5, pxPerStep: 10 };

const circuitMissions: MissionDef[] = [
  {
    id: 'circuit-1', preset: 'pc_circuit_3d', level: 1, kind: 'adjust',
    prompt: 'Règle la tension pour obtenir I = 0,5 A',
    hint: 'Loi d’Ohm : U = R × I = 12 × 0,5.',
    start: { a: 1.5, b: 12, c: 1 }, solution: { a: 6 },
    controls: [uControl], goal: (p) => near(current(p), 0.5, 0.005),
  },
  {
    id: 'circuit-2', preset: 'pc_circuit_3d', level: 2, kind: 'adjust',
    prompt: 'Obtiens I = 2 A avec deux résistances de 12 Ω',
    hint: 'En dérivation, deux résistances R donnent R_eq = R / 2.',
    start: { a: 6, b: 12, c: 1 }, solution: { a: 12, c: 2 },
    controls: [uControl, { param: 'c', gesture: 'drag-y', min: 1, max: 2, step: 1, pxPerStep: 40 }],
    goal: (p) => near(current(p), 2, 0.005),
  },
  {
    id: 'circuit-3', preset: 'pc_circuit_3d', level: 3, kind: 'adjust',
    prompt: 'Circuit chrono',
    hint: 'R = 10 Ω : U = 10 × I.',
    start: { a: 1.5, b: 10, c: 1 },
    controls: [uControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([0.3, 0.5, 0.8, 1.2, 1.5, 2], 4, rand).map((i) => ({
        prompt: `Obtiens une intensité de ${fr(i, 1)} A`,
        start: { a: 1.5 },
        solution: { a: 10 * i },
        goal: (p: MissionParams) => near(current(p), i, 0.005),
      })),
  },
];

// ---- Molécules : a = 1 H₂O, 2 CO₂, 3 CH₄ ; b = angle de liaison (°)
const angleControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 95, max: 180, step: 0.5, pxPerStep: 4 };
const MOLECULES = [
  { a: 1, angle: 104.5, prompt: 'Règle l’angle de liaison de l’eau (H₂O)' },
  { a: 2, angle: 180, prompt: 'Règle l’angle de liaison du dioxyde de carbone (CO₂)' },
  { a: 3, angle: 109.5, prompt: 'Règle l’angle de liaison du méthane (CH₄)' },
];

const moleculeMissions: MissionDef[] = [
  {
    id: 'molecule-1', preset: 'pc_molecule_3d', level: 1, kind: 'adjust',
    prompt: 'Donne à la molécule d’eau son angle réel de 104,5°',
    hint: 'Les deux doublets non liants de l’oxygène resserrent l’angle H–O–H.',
    start: { a: 1, b: 120, c: 1.2 }, solution: { b: 104.5 },
    controls: [angleControl], goal: (p) => r(p.a) === 1 && near(p.b, 104.5, 0.01),
  },
  {
    id: 'molecule-2', preset: 'pc_molecule_3d', level: 2, kind: 'adjust',
    prompt: 'Choisis la molécule linéaire et donne-lui son angle',
    hint: 'Le CO₂ est linéaire : O=C=O fait 180°.',
    start: { a: 1, b: 104.5, c: 1.2 }, solution: { a: 2, b: 180 },
    controls: [angleControl, { param: 'a', gesture: 'drag-y', min: 1, max: 3, step: 1, pxPerStep: 40 }],
    goal: (p) => r(p.a) === 2 && near(p.b, 180, 0.01),
  },
  {
    id: 'molecule-3', preset: 'pc_molecule_3d', level: 3, kind: 'adjust',
    prompt: 'Molécules chrono',
    hint: 'H₂O : 104,5° · CH₄ : 109,5° · CO₂ : 180°.',
    start: { a: 1, b: 140, c: 1.2 },
    controls: [angleControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN(MOLECULES, 3, rand).map((m) => ({
        prompt: m.prompt,
        start: { a: m.a, b: 140 },
        solution: { b: m.angle },
        goal: (p: MissionParams) => near(p.b, m.angle, 0.01),
      })),
  },
];

// ---- Ondes : f = 200·a (Hz), c = v (m/s) ; λ = v / f
const lambda = (p: MissionParams) => p.c / Math.max(1, Math.round(p.a * 200));
const fControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 1, max: 4.5, step: 0.1, pxPerStep: 8 };

const ondesMissions: MissionDef[] = [
  {
    id: 'ondes-1', preset: 'pc_wave_3d', level: 1, kind: 'adjust',
    prompt: 'Son dans l’air (340 m/s) : obtiens une longueur d’onde de 1 m',
    hint: 'λ = v / f : il faut f = 340 Hz.',
    start: { a: 1, b: 0.6, c: 340 }, solution: { a: 1.7 },
    controls: [fControl], goal: (p) => near(lambda(p), 1, 0.005),
  },
  {
    id: 'ondes-2', preset: 'pc_wave_3d', level: 2, kind: 'adjust',
    prompt: 'Obtiens une longueur d’onde de 5 m',
    hint: 'λ = v / f : à 300 Hz il faut v = 1 500 m/s, la vitesse du son dans l’eau.',
    start: { a: 1.5, b: 0.6, c: 340 }, solution: { c: 1500 },
    controls: [fControl, { param: 'c', gesture: 'drag-y', min: 100, max: 1500, step: 20, pxPerStep: 4 }],
    goal: (p) => near(lambda(p), 5, 0.01),
  },
  {
    id: 'ondes-3', preset: 'pc_wave_3d', level: 3, kind: 'adjust',
    prompt: 'Ondes chrono',
    hint: 'v = 340 m/s : f = 340 ÷ λ.',
    start: { a: 1, b: 0.6, c: 340 },
    controls: [fControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([340, 400, 500, 680], 4, rand).map((f) => {
        const t = 340 / f;
        return {
          prompt: `Obtiens une longueur d’onde de ${fr(t, 2)} m`,
          start: { a: 1 },
          solution: { a: f / 200 },
          goal: (p: MissionParams) => near(lambda(p), t, 0.006),
        };
      }),
  },
];

// ---- Atome : a = Z, b = N, c = demi-vies écoulées ; noyaux restants = 100 × 0,5^c (%)
const remaining = (p: MissionParams) => r(100 * Math.pow(0.5, Math.max(0, p.c)));

const atomeMissions: MissionDef[] = [
  {
    id: 'atome-1', preset: 'pc_atom_3d', level: 1, kind: 'adjust',
    prompt: 'Construis un atome de carbone',
    hint: 'Le numéro atomique Z est le nombre de protons : le carbone a Z = 6.',
    start: { a: 1, b: 6, c: 0 }, solution: { a: 6 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 1, max: 10, step: 1, pxPerStep: 30 }],
    goal: (p) => r(p.a) === 6,
  },
  {
    id: 'atome-2', preset: 'pc_atom_3d', level: 2, kind: 'adjust',
    prompt: 'Construis le noyau d’oxygène 16',
    hint: 'A = Z + N : l’oxygène a Z = 8, donc N = 16 − 8.',
    start: { a: 1, b: 0, c: 0 }, solution: { a: 8, b: 8 },
    controls: [
      { param: 'a', gesture: 'drag-x', min: 1, max: 10, step: 1, pxPerStep: 30 },
      { param: 'b', gesture: 'drag-y', min: 0, max: 12, step: 1, pxPerStep: 30 },
    ],
    goal: (p) => r(p.a) === 8 && r(p.b) === 8,
  },
  {
    id: 'atome-3', preset: 'pc_atom_3d', level: 3, kind: 'adjust',
    prompt: 'Radioactivité chrono',
    hint: 'À chaque demi-vie, la moitié des noyaux restants se désintègre.',
    start: { a: 6, b: 8, c: 0 },
    controls: [{ param: 'c', gesture: 'drag-x', min: 0, max: 4, step: 0.25, pxPerStep: 20 }],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([0.5, 1, 1.5, 2, 3], 4, rand).map((h) => {
        const t = r(100 * Math.pow(0.5, h));
        return {
          prompt: `Laisse passer le temps jusqu’à ${t} % de noyaux restants`,
          start: { c: 0 },
          solution: { c: h },
          goal: (p: MissionParams) => remaining(p) === t,
        };
      }),
  },
];

// ---- Gravitation : a = M, b = d ; F ∝ 10·M / d² ; c = g, poids d'une masse de 10 kg = 10·g (N)
const force = (p: MissionParams) => (p.a * 10) / Math.max(0.5, p.b * p.b);
const gControl = { param: 'c' as const, gesture: 'drag-x' as const, min: 1.6, max: 15, step: 0.2, pxPerStep: 6 };
const PLANETS = [
  { g: 1.6, prompt: 'Règle g pour peser 16 N, comme sur la Lune' },
  { g: 3.8, prompt: 'Règle g pour peser 38 N, comme sur Mars' },
  { g: 8.8, prompt: 'Règle g pour peser 88 N, comme sur Vénus' },
  { g: 9.8, prompt: 'Règle g pour peser 98 N, comme sur Terre' },
  { g: 11.2, prompt: 'Règle g pour peser 112 N, comme sur Neptune' },
];

const graviteMissions: MissionDef[] = [
  {
    id: 'gravite-1', preset: 'pc_gravity_3d', level: 1, kind: 'adjust',
    prompt: 'Une masse de 10 kg doit peser 98 N : règle g comme sur Terre',
    hint: 'P = m × g : sur Terre g = 9,8 N/kg.',
    start: { a: 5, b: 2.5, c: 1.6 }, solution: { c: 9.8 },
    controls: [gControl], goal: (p) => near(10 * p.c, 98, 0.05),
  },
  {
    id: 'gravite-2', preset: 'pc_gravity_3d', level: 2, kind: 'adjust',
    prompt: 'Divise la force d’attraction par 4 en éloignant le satellite',
    hint: 'F ∝ M / d² : doubler la distance divise la force par 4.',
    start: { a: 4, b: 2, c: 9.8 }, solution: { b: 4 },
    controls: [{ param: 'b', gesture: 'drag-x', min: 1.8, max: 4, step: 0.1, pxPerStep: 12 }],
    goal: (p) => near(force(p), 2.5, 0.01),
  },
  {
    id: 'gravite-3', preset: 'pc_gravity_3d', level: 3, kind: 'adjust',
    prompt: 'Planètes chrono',
    hint: 'Poids d’une masse de 10 kg : P = 10 × g.',
    start: { a: 5, b: 2.5, c: 15 },
    controls: [gControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN(PLANETS, 4, rand).map((pl) => ({
        prompt: pl.prompt,
        start: { c: 15 },
        solution: { c: pl.g },
        goal: (p: MissionParams) => near(10 * p.c, 10 * pl.g, 0.05),
      })),
  },
];

// ---- Titrage : a = V_B versé (mL), b = pKa, c = V_E (mL)
const vbControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 0, max: 25, step: 0.5, pxPerStep: 8 };

const titrageMissions: MissionDef[] = [
  {
    id: 'titrage-1', preset: 'pc_titration_3d', level: 1, kind: 'adjust',
    prompt: 'Verse la base jusqu’à l’équivalence',
    hint: 'À l’équivalence, V_B = V_E : ici 12 mL.',
    start: { a: 0, b: 4.8, c: 12 }, solution: { a: 12 },
    controls: [vbControl], goal: (p) => near(p.a, p.c, 0.01),
  },
  {
    id: 'titrage-2', preset: 'pc_titration_3d', level: 2, kind: 'adjust',
    prompt: 'Place-toi à la demi-équivalence pour lire le pKa',
    hint: 'À la demi-équivalence, V_B = V_E / 2 et pH = pKa.',
    start: { a: 0, b: 4.8, c: 14 }, solution: { a: 7 },
    controls: [vbControl], goal: (p) => near(p.a, p.c / 2, 0.01),
  },
  {
    id: 'titrage-3', preset: 'pc_titration_3d', level: 3, kind: 'adjust',
    prompt: 'Titrage chrono',
    hint: 'Demi-équivalence : V_B = V_E ÷ 2.',
    start: { a: 0, b: 4.8, c: 12 },
    controls: [vbControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([9, 10, 12, 15, 16, 18], 4, rand).map((ve) => ({
        prompt: `Atteins la demi-équivalence (V_E = ${ve} mL)`,
        start: { a: 0, c: ve },
        solution: { a: ve / 2 },
        goal: (p: MissionParams) => near(p.a, p.c / 2, 0.01),
      })),
  },
];

export const physiqueMissions: MissionDef[] = [
  ...etatsMissions,
  ...projectileMissions,
  ...circuitMissions,
  ...moleculeMissions,
  ...ondesMissions,
  ...atomeMissions,
  ...graviteMissions,
  ...titrageMissions,
];
