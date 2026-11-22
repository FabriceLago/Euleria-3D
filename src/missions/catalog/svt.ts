// Missions des scènes de SVT (hors ADN, voir adn.ts).
// Les objectifs reprennent les formules affichées par computeReadout (MathSceneEngine) pour chaque scène.
import type { MissionDef, MissionParams } from '../types.ts';
import { pickN, r } from './helpers.ts';

const fr = (x: number, digits: number) => x.toFixed(digits).replace('.', ',');
const near = (x: number, target: number, tol: number) => Math.abs(x - target) <= tol;

// ---- Cellule : a = mitochondries, c = 1 animale / 2 végétale ; ATP = 32 × mitochondries
const atp = (p: MissionParams) => Math.max(2, r(p.a)) * 32;
const mitoControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 2, max: 10, step: 1, pxPerStep: 30 };

const celluleMissions: MissionDef[] = [
  {
    id: 'cellule-1', preset: 'svt_cell_3d', level: 1, kind: 'adjust',
    prompt: 'Produis 192 ATP par cycle',
    hint: 'Chaque mitochondrie fournit 32 ATP : 192 ÷ 32.',
    start: { a: 2, b: 2, c: 1 }, solution: { a: 6 },
    controls: [mitoControl], goal: (p) => atp(p) === 192,
  },
  {
    id: 'cellule-2', preset: 'svt_cell_3d', level: 2, kind: 'adjust',
    prompt: 'Passe en cellule végétale et produis 256 ATP par cycle',
    hint: 'Une cellule végétale respire aussi : elle a des mitochondries en plus des chloroplastes.',
    start: { a: 2, b: 2, c: 1 }, solution: { a: 8, c: 2 },
    controls: [mitoControl, { param: 'c', gesture: 'drag-y', min: 1, max: 2, step: 1, pxPerStep: 40 }],
    goal: (p) => r(p.c) === 2 && atp(p) === 256,
  },
  {
    id: 'cellule-3', preset: 'svt_cell_3d', level: 3, kind: 'adjust',
    prompt: 'Cellule chrono',
    hint: 'ATP = 32 × nombre de mitochondries.',
    start: { a: 2, b: 2, c: 1 },
    controls: [mitoControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([3, 5, 7, 9, 10], 4, rand).map((m) => ({
        prompt: `Produis ${32 * m} ATP par cycle`,
        start: { a: 2 },
        solution: { a: m },
        goal: (p: MissionParams) => atp(p) === 32 * m,
      })),
  },
];

// ---- Écosystème : a = niveaux trophiques, b = biomasse des producteurs (kg) ; sommet = b × 0,1^(niveaux − 1)
const top = (p: MissionParams) => Math.max(200, r(p.b)) / Math.pow(10, Math.max(2, Math.min(4, r(p.a))) - 1);
const bioControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 200, max: 2000, step: 100, pxPerStep: 10 };

const ecosystemeMissions: MissionDef[] = [
  {
    id: 'ecosysteme-1', preset: 'svt_ecosystem_3d', level: 1, kind: 'adjust',
    prompt: 'Avec 3 niveaux, obtiens 10 kg de biomasse au sommet',
    hint: 'Règle des 10 % : sommet = producteurs × 0,1 × 0,1.',
    start: { a: 3, b: 200, c: 1 }, solution: { b: 1000 },
    controls: [bioControl], goal: (p) => near(top(p), 10, 0.01),
  },
  {
    id: 'ecosysteme-2', preset: 'svt_ecosystem_3d', level: 2, kind: 'adjust',
    prompt: 'Obtiens 1,5 kg de biomasse au sommet de la pyramide',
    hint: 'Avec 4 niveaux, le sommet reçoit 1 000 fois moins que les producteurs.',
    start: { a: 2, b: 500, c: 1 }, solution: { a: 4, b: 1500 },
    controls: [bioControl, { param: 'a', gesture: 'drag-y', min: 2, max: 4, step: 1, pxPerStep: 40 }],
    goal: (p) => near(top(p), 1.5, 0.01),
  },
  {
    id: 'ecosysteme-3', preset: 'svt_ecosystem_3d', level: 3, kind: 'adjust',
    prompt: 'Pyramides chrono',
    hint: '3 niveaux : producteurs = sommet × 100.',
    start: { a: 3, b: 200, c: 1 },
    controls: [bioControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([3, 5, 8, 12, 17], 4, rand).map((t) => ({
        prompt: `Obtiens ${t} kg au sommet d’une pyramide à 3 niveaux`,
        start: { b: 200 },
        solution: { b: t * 100 },
        goal: (p: MissionParams) => near(top(p), t, 0.01),
      })),
  },
];

// ---- Climat : a = CO₂ (ppm), b = albédo (%) ; P_abs = (1 − albédo) × 340 ; T = 15 + 0,75·5,35·ln(CO₂/280) + (30 − albédo)·0,35
const albedoOf = (p: MissionParams) => Math.max(10, Math.min(60, r(p.b)));
const pAbs = (p: MissionParams) => r(340 * (1 - albedoOf(p) / 100));
const tMean = (p: MissionParams) =>
  15 + 5.35 * Math.log(Math.max(200, r(p.a)) / 280) * 0.75 + (30 - albedoOf(p)) * 0.35;
const albedoControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 10, max: 60, step: 1, pxPerStep: 8 };

const climatMissions: MissionDef[] = [
  {
    id: 'climat-1', preset: 'svt_climate_3d', level: 1, kind: 'adjust',
    prompt: 'Règle l’albédo pour que la Terre absorbe 238 W/m²',
    hint: 'P_abs = (1 − albédo) × 340 : il faut absorber 70 % du rayonnement.',
    start: { a: 420, b: 10, c: 23.4 }, solution: { b: 30 },
    controls: [albedoControl], goal: (p) => pAbs(p) === 238,
  },
  {
    id: 'climat-2', preset: 'svt_climate_3d', level: 2, kind: 'adjust',
    prompt: 'Reviens au climat préindustriel : 280 ppm de CO₂ et 15 °C',
    hint: 'À 280 ppm, le forçage du CO₂ est nul : T = 15 + (30 − albédo) × 0,35.',
    start: { a: 420, b: 20, c: 23.4 }, solution: { a: 280, b: 30 },
    controls: [albedoControl, { param: 'a', gesture: 'drag-y', min: 200, max: 600, step: 10, pxPerStep: 8 }],
    goal: (p) => r(p.a) === 280 && near(tMean(p), 15, 0.05),
  },
  {
    id: 'climat-3', preset: 'svt_climate_3d', level: 3, kind: 'adjust',
    prompt: 'Bilan radiatif chrono',
    hint: 'Plus l’albédo est fort, moins la Terre absorbe d’énergie.',
    start: { a: 420, b: 10, c: 23.4 },
    controls: [albedoControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([20, 25, 35, 40, 50], 4, rand).map((alb) => {
        const t = r(340 * (1 - alb / 100));
        return {
          prompt: `Fais absorber ${t} W/m² à la Terre`,
          start: { b: 10 },
          solution: { b: alb },
          goal: (p: MissionParams) => pAbs(p) === t,
        };
      }),
  },
];

// ---- Cœur (c = 1) : a = FC (bpm), b = VES (mL) ; Qc = FC × VES / 1 000 (L/min)
const qc = (p: MissionParams) => (Math.max(40, Math.min(180, r(p.a))) * Math.max(40, Math.min(120, r(p.b)))) / 1000;
const fcControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 40, max: 180, step: 2, pxPerStep: 6 };

const coeurMissions: MissionDef[] = [
  {
    id: 'coeur-1', preset: 'svt_organ_3d', level: 1, kind: 'adjust',
    prompt: 'Au repos, obtiens un débit cardiaque de 5,6 L/min',
    hint: 'Qc = FC × VES : 5 600 mL/min ÷ 70 mL.',
    start: { a: 60, b: 70, c: 1 }, solution: { a: 80 },
    controls: [fcControl], goal: (p) => near(qc(p), 5.6, 0.001),
  },
  {
    id: 'coeur-2', preset: 'svt_organ_3d', level: 2, kind: 'adjust',
    prompt: 'Pendant un effort, atteins un débit de 15 L/min',
    hint: 'À l’effort, le cœur bat plus vite et éjecte plus de sang à chaque battement.',
    start: { a: 70, b: 70, c: 1 }, solution: { a: 150, b: 100 },
    controls: [fcControl, { param: 'b', gesture: 'drag-y', min: 40, max: 120, step: 5, pxPerStep: 10 }],
    goal: (p) => near(qc(p), 15, 0.001),
  },
  {
    id: 'coeur-3', preset: 'svt_organ_3d', level: 3, kind: 'adjust',
    prompt: 'Débit cardiaque chrono',
    hint: 'VES = 80 mL : FC = débit ÷ 0,08.',
    start: { a: 180, b: 80, c: 1 },
    controls: [fcControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([50, 60, 90, 120, 150], 4, rand).map((fc) => {
        const t = (fc * 80) / 1000;
        return {
          prompt: `Obtiens un débit de ${fr(t, 1)} L/min`,
          start: { a: 180 },
          solution: { a: fc },
          goal: (p: MissionParams) => near(qc(p), t, 0.001),
        };
      }),
  },
];

// ---- Tectonique : a = vitesse (cm/an), b = durée (Ma) ; d = v × 10 × t (km)
const drift = (p: MissionParams) => r(Math.max(1, p.a) * 10 * Math.max(5, r(p.b)));
const speedControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 1, max: 10, step: 0.5, pxPerStep: 14 };
const timeControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 5, max: 40, step: 1, pxPerStep: 10 };

const tectoniqueMissions: MissionDef[] = [
  {
    id: 'tectonique-1', preset: 'svt_tectonics_3d', level: 1, kind: 'adjust',
    prompt: 'À 2 cm/an, laisse la dorsale ouvrir un océan de 400 km',
    hint: '1 cm/an pendant 1 Ma = 10 km : à 2 cm/an, il faut 20 Ma.',
    start: { a: 2, b: 5, c: 1 }, solution: { b: 20 },
    controls: [timeControl], goal: (p) => drift(p) === 400,
  },
  {
    id: 'tectonique-2', preset: 'svt_tectonics_3d', level: 2, kind: 'adjust',
    prompt: 'Ouvre un océan de 1 500 km en 30 Ma',
    hint: 'v = d / t : 1 500 km ÷ 30 Ma = 50 km/Ma, soit 5 cm/an.',
    start: { a: 2, b: 10, c: 1 }, solution: { a: 5, b: 30 },
    controls: [speedControl, { ...timeControl, gesture: 'drag-y' }],
    goal: (p) => r(p.b) === 30 && drift(p) === 1500,
  },
  {
    id: 'tectonique-3', preset: 'svt_tectonics_3d', level: 3, kind: 'adjust',
    prompt: 'Tectonique chrono',
    hint: 'Durée 20 Ma : d = v × 200 km.',
    start: { a: 10, b: 20, c: 1 },
    controls: [speedControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([1, 1.5, 2.5, 4, 6, 8], 4, rand).map((v) => ({
        prompt: `Déplace la plaque de ${r(v * 200)} km en 20 Ma`,
        start: { a: 10 },
        solution: { a: v },
        goal: (p: MissionParams) => drift(p) === r(v * 200),
      })),
  },
];

// ---- Neurone : a = vitesse (m/s), b = longueur de l'axone (m), c = fréquence (×20 Hz) ; t = L / v (ms)
const delayMs = (p: MissionParams) => (Math.max(0.4, p.b) / Math.max(20, r(p.a))) * 1000;
const speedNerve = { param: 'a' as const, gesture: 'drag-x' as const, min: 20, max: 120, step: 5, pxPerStep: 8 };

const neuroneMissions: MissionDef[] = [
  {
    id: 'neurone-1', preset: 'svt_neuron_3d', level: 1, kind: 'adjust',
    prompt: 'Fais parcourir 1 m d’axone au message nerveux en 10 ms',
    hint: 'v = d / t = 1 m ÷ 0,010 s.',
    start: { a: 20, b: 1, c: 1 }, solution: { a: 100 },
    controls: [speedNerve], goal: (p) => near(delayMs(p), 10, 0.01),
  },
  {
    id: 'neurone-2', preset: 'svt_neuron_3d', level: 2, kind: 'adjust',
    prompt: 'Message intense : influx en 20 ms sur 1 m, à 80 Hz',
    hint: 'v = 1 m ÷ 0,020 s ; l’intensité du message est codée par la fréquence des potentiels d’action.',
    start: { a: 20, b: 1, c: 1 }, solution: { a: 50, c: 4 },
    controls: [speedNerve, { param: 'c', gesture: 'drag-y', min: 1, max: 4, step: 1, pxPerStep: 30 }],
    goal: (p) => near(delayMs(p), 20, 0.01) && r(p.c) * 20 === 80,
  },
  {
    id: 'neurone-3', preset: 'svt_neuron_3d', level: 3, kind: 'adjust',
    prompt: 'Influx nerveux chrono',
    hint: 'Axone de 1,2 m : v = 1 200 ÷ t (ms).',
    start: { a: 20, b: 1.2, c: 1 },
    controls: [speedNerve],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([30, 40, 60, 80, 120], 4, rand).map((v) => {
        const t = 1200 / v;
        return {
          prompt: `Fais parcourir 1,2 m en ${r(t)} ms`,
          start: { a: 20 },
          solution: { a: v },
          goal: (p: MissionParams) => near(delayMs(p), t, 0.01),
        };
      }),
  },
];

export const svtMissions: MissionDef[] = [
  ...celluleMissions,
  ...ecosystemeMissions,
  ...climatMissions,
  ...coeurMissions,
  ...tectoniqueMissions,
  ...neuroneMissions,
];
