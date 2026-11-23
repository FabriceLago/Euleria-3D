// Missions des scènes d'histoire-géographie (hors frise, voir frise.ts).
// Les objectifs reprennent les valeurs affichées par computeReadout (MathSceneEngine) et des repères du programme.
import type { MissionDef, MissionParams } from '../types.ts';
import { pickN, r } from './helpers.ts';

const fr = (x: number, digits: number) => x.toFixed(digits).replace('.', ',');
const near = (x: number, target: number, tol: number) => Math.abs(x - target) <= tol;

// ---- Monuments : a = colonnes / degrés / tours, c = 1 pyramide, 2 temple, 3 château
const unitsControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 3, max: 8, step: 1, pxPerStep: 30 };
const MONUMENTS = [
  { c: 2, a: 8, prompt: 'Le Parthénon : donne 8 colonnes à la façade du temple' },
  { c: 2, a: 6, prompt: 'Le temple d’Héphaïstos : donne 6 colonnes à la façade' },
  { c: 1, a: 6, prompt: 'La pyramide de Djéser : construis ses 6 degrés' },
  { c: 3, a: 4, prompt: 'Un château fort : place ses 4 tours d’angle' },
];

const monumentMissions: MissionDef[] = [
  {
    id: 'monument-1', preset: 'hg_monument_3d', level: 1, kind: 'adjust',
    prompt: 'Construis la façade du Parthénon : 8 colonnes',
    hint: 'Le Parthénon (Athènes, Ve siècle av. J.-C.) est un temple octostyle : 8 colonnes en façade.',
    start: { a: 4, b: 20, c: 2 }, solution: { a: 8 },
    controls: [unitsControl], goal: (p) => r(p.c) === 2 && r(p.a) === 8,
  },
  {
    id: 'monument-2', preset: 'hg_monument_3d', level: 2, kind: 'adjust',
    prompt: 'Bâtis la pyramide à degrés de Djéser',
    hint: 'La pyramide de Djéser (Saqqarah, vers 2650 av. J.-C.) compte 6 degrés.',
    start: { a: 3, b: 20, c: 3 }, solution: { a: 6, c: 1 },
    controls: [unitsControl, { param: 'c', gesture: 'drag-y', min: 1, max: 3, step: 1, pxPerStep: 40 }],
    goal: (p) => r(p.c) === 1 && r(p.a) === 6,
  },
  {
    id: 'monument-3', preset: 'hg_monument_3d', level: 3, kind: 'adjust',
    prompt: 'Monuments chrono',
    hint: 'Temples grecs : 6 ou 8 colonnes en façade ; Djéser : 6 degrés.',
    start: { a: 3, b: 20, c: 2 },
    controls: [unitsControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN(MONUMENTS, 4, rand).map((m) => ({
        prompt: m.prompt,
        start: { a: 3, c: m.c },
        solution: { a: m.a },
        goal: (p: MissionParams) => r(p.a) === m.a,
      })),
  },
];

// ---- Villes : a = tours du CBD, b = taux d'urbanisation (%), c = rang (1 ville, 2 métropole, 3 mondiale)
const urbanControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 30, max: 95, step: 1, pxPerStep: 6 };
const URBAN = [
  { pct: 36, prompt: 'Règle le taux d’urbanisation de l’Inde (≈ 36 %)' },
  { pct: 54, prompt: 'Règle le taux d’urbanisation du Nigeria (≈ 54 %)' },
  { pct: 65, prompt: 'Règle le taux d’urbanisation de la Chine (≈ 65 %)' },
  { pct: 88, prompt: 'Règle le taux d’urbanisation du Brésil (≈ 88 %)' },
  { pct: 92, prompt: 'Règle le taux d’urbanisation du Japon (≈ 92 %)' },
];

const villeMissions: MissionDef[] = [
  {
    id: 'ville-1', preset: 'hg_city_urban_3d', level: 1, kind: 'adjust',
    prompt: 'Règle le taux d’urbanisation de la France (≈ 81 %)',
    hint: 'En France, environ 8 habitants sur 10 vivent en ville.',
    start: { a: 6, b: 50, c: 2 }, solution: { b: 81 },
    controls: [urbanControl], goal: (p) => r(p.b) === 81,
  },
  {
    id: 'ville-2', preset: 'hg_city_urban_3d', level: 2, kind: 'adjust',
    prompt: 'Transforme la ville en ville mondiale avec un CBD de 12 tours',
    hint: 'Les villes mondiales (New York, Londres, Tokyo) concentrent sièges sociaux et tours dans leur CBD.',
    start: { a: 4, b: 80, c: 1 }, solution: { a: 12, c: 3 },
    controls: [
      { param: 'a', gesture: 'drag-x', min: 3, max: 12, step: 1, pxPerStep: 20 },
      { param: 'c', gesture: 'drag-y', min: 1, max: 3, step: 1, pxPerStep: 40 },
    ],
    goal: (p) => r(p.c) === 3 && r(p.a) === 12,
  },
  {
    id: 'ville-3', preset: 'hg_city_urban_3d', level: 3, kind: 'adjust',
    prompt: 'Urbanisation chrono',
    hint: 'Pays émergents : urbanisation encore partielle ; pays riches : souvent plus de 80 %.',
    start: { a: 6, b: 30, c: 2 },
    controls: [urbanControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN(URBAN, 4, rand).map((u) => ({
        prompt: u.prompt,
        start: { b: 30 },
        solution: { b: u.pct },
        goal: (p: MissionParams) => r(p.b) === u.pct,
      })),
  },
];

// ---- Routes maritimes : b = vitesse (km/h), c = 1 Atlantique (6 500 km) / 2 Asie–Europe (18 500 km) ; t = d / (v × 24) jours
const days = (p: MissionParams) => (r(p.c) >= 2 ? 18500 : 6500) / (Math.max(10, r(p.b)) * 24);
const shipControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 10, max: 50, step: 2, pxPerStep: 12 };

const routesMissions: MissionDef[] = [
  {
    id: 'routes-1', preset: 'hg_globe_routes_3d', level: 1, kind: 'adjust',
    prompt: 'Traverse l’Atlantique (6 500 km) en environ 13,5 jours',
    hint: 't = d / (v × 24) : v = 6 500 ÷ (13,5 × 24) ≈ 20 km/h.',
    start: { a: 4, b: 10, c: 1 }, solution: { b: 20 },
    controls: [shipControl], goal: (p) => r(p.c) === 1 && near(days(p), 13.5, 0.06),
  },
  {
    id: 'routes-2', preset: 'hg_globe_routes_3d', level: 2, kind: 'adjust',
    prompt: 'Porte-conteneurs : relie l’Asie à l’Europe en environ 25,7 jours',
    hint: 'Passe à l’époque des conteneurs (18 500 km) : v = 18 500 ÷ (25,7 × 24) ≈ 30 km/h.',
    start: { a: 4, b: 10, c: 1 }, solution: { b: 30, c: 2 },
    controls: [shipControl, { param: 'c', gesture: 'drag-y', min: 1, max: 2, step: 1, pxPerStep: 40 }],
    goal: (p) => r(p.c) === 2 && near(days(p), 25.7, 0.06),
  },
  {
    id: 'routes-3', preset: 'hg_globe_routes_3d', level: 3, kind: 'adjust',
    prompt: 'Routes maritimes chrono',
    hint: '18 500 km : plus le navire est rapide, plus le trajet est court.',
    start: { a: 6, b: 10, c: 2 },
    controls: [shipControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([20, 24, 30, 36, 40, 46], 4, rand).map((v) => {
        const t = Math.round((18500 / (v * 24)) * 10) / 10;
        return {
          prompt: `Relie l’Asie à l’Europe en ${fr(t, 1)} jours`,
          start: { b: 10 },
          solution: { b: v },
          goal: (p: MissionParams) => near(days(p), t, 0.06),
        };
      }),
  },
];

// ---- Démographie : a = natalité (‰), b = mortalité (‰) ; accroissement naturel = N − M
const growth = (p: MissionParams) => Math.max(8, r(p.a)) - Math.max(4, r(p.b));
const mortControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 4, max: 30, step: 1, pxPerStep: 12 };

const demographieMissions: MissionDef[] = [
  {
    id: 'demographie-1', preset: 'hg_demography_3d', level: 1, kind: 'adjust',
    prompt: 'Obtiens un accroissement naturel nul',
    hint: 'Accroissement naturel = natalité − mortalité : il faut autant de naissances que de décès.',
    start: { a: 12, b: 4, c: 4 }, solution: { b: 12 },
    controls: [mortControl], goal: (p) => growth(p) === 0,
  },
  {
    id: 'demographie-2', preset: 'hg_demography_3d', level: 2, kind: 'adjust',
    prompt: 'Explosion démographique : natalité de 40 ‰ et accroissement de +25 ‰',
    hint: 'En phase 2, la mortalité chute alors que la natalité reste forte : M = 40 − 25.',
    start: { a: 20, b: 20, c: 2 }, solution: { a: 40, b: 15 },
    controls: [mortControl, { param: 'a', gesture: 'drag-y', min: 8, max: 45, step: 1, pxPerStep: 10 }],
    goal: (p) => r(p.a) === 40 && growth(p) === 25,
  },
  {
    id: 'demographie-3', preset: 'hg_demography_3d', level: 3, kind: 'adjust',
    prompt: 'Démographie chrono',
    hint: 'Natalité 30 ‰ : mortalité = 30 − accroissement.',
    start: { a: 30, b: 30, c: 2 },
    controls: [mortControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([5, 10, 15, 20, 22], 4, rand).map((t) => ({
        prompt: `Obtiens un accroissement naturel de +${t} ‰`,
        start: { b: 30 },
        solution: { b: 30 - t },
        goal: (p: MissionParams) => growth(p) === t,
      })),
  },
];

// ---- Industrie : b = part du tertiaire (%), c = 1 usine XIXᵉ / 2 technopôle ; secondaire = (100 − tertiaire) × 0,72
const secondary = (p: MissionParams) => Math.max(5, r((100 - Math.max(20, Math.min(90, r(p.b)))) * 0.72));
const tertControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 20, max: 90, step: 2, pxPerStep: 10 };

const industrieMissions: MissionDef[] = [
  {
    id: 'industrie-1', preset: 'hg_industry_3d', level: 1, kind: 'adjust',
    prompt: 'Règle la part des emplois tertiaires en France (≈ 76 %)',
    hint: 'Aujourd’hui, environ 3 emplois sur 4 en France relèvent des services.',
    start: { a: 5, b: 40, c: 2 }, solution: { b: 76 },
    controls: [tertControl], goal: (p) => r(p.b) === 76,
  },
  {
    id: 'industrie-2', preset: 'hg_industry_3d', level: 2, kind: 'adjust',
    prompt: 'Passe au technopôle du XXIe siècle avec 80 % d’emplois tertiaires',
    hint: 'Le technopôle associe recherche, services et industries de haute technologie.',
    start: { a: 5, b: 40, c: 1 }, solution: { b: 80, c: 2 },
    controls: [tertControl, { param: 'c', gesture: 'drag-y', min: 1, max: 2, step: 1, pxPerStep: 40 }],
    goal: (p) => r(p.c) === 2 && r(p.b) === 80,
  },
  {
    id: 'industrie-3', preset: 'hg_industry_3d', level: 3, kind: 'adjust',
    prompt: 'Secteurs d’activité chrono',
    hint: 'Plus le tertiaire grandit, plus la part du secondaire diminue.',
    start: { a: 5, b: 90, c: 1 },
    controls: [tertControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([20, 30, 40, 50, 60, 70], 4, rand).map((t) => {
        const s = r((100 - t) * 0.72);
        return {
          prompt: `Obtiens ${s} % d’emplois dans le secondaire`,
          start: { b: 90 },
          solution: { b: t },
          goal: (p: MissionParams) => secondary(p) === s,
        };
      }),
  },
];

// ---- Géopolitique (c = 2 Union européenne) : a = États membres, b = année
const yearControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 1945, max: 2025, step: 1, pxPerStep: 3 };
const ENLARGEMENTS: Array<[number, number]> = [
  [9, 1973],
  [12, 1986],
  [15, 1995],
  [25, 2004],
  [28, 2013],
];

const geopolitiqueMissions: MissionDef[] = [
  {
    id: 'ue-1', preset: 'hg_geopolitics_3d', level: 1, kind: 'adjust',
    prompt: 'Règle le nombre d’États membres de l’Union européenne aujourd’hui',
    hint: 'Depuis le départ du Royaume-Uni en 2020, l’UE compte 27 États membres.',
    start: { a: 6, b: 2025, c: 2 }, solution: { a: 27 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 2, max: 27, step: 1, pxPerStep: 12 }],
    goal: (p) => r(p.c) === 2 && r(p.a) === 27,
  },
  {
    id: 'ue-2', preset: 'hg_geopolitics_3d', level: 2, kind: 'adjust',
    prompt: 'Reviens au traité de Rome : l’année et le nombre d’États fondateurs',
    hint: 'Le traité de Rome (1957) crée la CEE avec 6 États fondateurs.',
    start: { a: 27, b: 2025, c: 2 }, solution: { a: 6, b: 1957 },
    controls: [yearControl, { param: 'a', gesture: 'drag-y', min: 2, max: 27, step: 1, pxPerStep: 12 }],
    goal: (p) => r(p.a) === 6 && r(p.b) === 1957,
  },
  {
    id: 'ue-3', preset: 'hg_geopolitics_3d', level: 3, kind: 'adjust',
    prompt: 'Élargissements chrono',
    hint: '1973, 1986, 1995, 2004, 2013 : les grandes étapes de l’élargissement.',
    start: { a: 6, b: 1960, c: 2 },
    controls: [yearControl],
    timeLimitS: 90,
    rounds: (rand) =>
      pickN(ENLARGEMENTS, 4, rand).map(([n, year]) => ({
        prompt: `L’Europe passe à ${n} États membres : règle l’année`,
        start: { a: n, b: 1960 },
        solution: { b: year },
        goal: (p: MissionParams) => r(p.b) === year,
      })),
  },
];

export const histoireMissions: MissionDef[] = [
  ...monumentMissions,
  ...villeMissions,
  ...routesMissions,
  ...demographieMissions,
  ...industrieMissions,
  ...geopolitiqueMissions,
];
