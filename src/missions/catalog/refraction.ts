import type { MissionControl, MissionDef, MissionParams } from '../types.ts';
import { pickN, r } from './helpers.ts';

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (x: number) => (x * 180) / Math.PI;

/** Angle réfracté (°) par Snell-Descartes, null si réflexion totale. Mêmes conventions que la scène : a = i₁, b = n₁, c = n₂. */
export function refractedDeg(i1: number, n1: number, n2: number): number | null {
  const s = (n1 / n2) * Math.sin(toRad(i1));
  return s > 1 ? null : toDeg(Math.asin(s));
}
export const limitDeg = (n1: number, n2: number) => toDeg(Math.asin(n2 / n1));

const dial: MissionControl = { param: 'a', gesture: 'dial', min: 5, max: 80, step: 1 };
const refractsTo = (target: number) => (p: MissionParams) => {
  const i2 = refractedDeg(p.a, p.b, p.c);
  return i2 !== null && Math.abs(i2 - target) <= 1;
};
const incidenceFor = (target: number, n1: number, n2: number) => r(toDeg(Math.asin((n2 / n1) * Math.sin(toRad(target)))));

export const refractionMissions: MissionDef[] = [
  {
    id: 'refraction-1', preset: 'pc_optics_3d', level: 1, kind: 'adjust',
    prompt: 'Règle le laser pour que le rayon réfracté fasse 30° (air → eau)',
    hint: 'n₁·sin(i₁) = n₂·sin(i₂) : sin(i₁) = 1,33 × sin(30°).',
    start: { a: 10, b: 1, c: 1.33 }, solution: { a: incidenceFor(30, 1, 1.33) },
    controls: [dial], goal: refractsTo(30),
  },
  {
    id: 'refraction-2', preset: 'pc_optics_3d', level: 2, kind: 'adjust',
    prompt: 'Trouve l’angle limite eau → air : le rayon doit tout juste se réfléchir totalement',
    hint: 'Angle limite : sin(i_lim) = n₂ / n₁ = 1 / 1,33.',
    start: { a: 20, b: 1.33, c: 1 }, solution: { a: Math.ceil(limitDeg(1.33, 1)) },
    controls: [dial],
    goal: (p) => p.a >= limitDeg(p.b, p.c) && p.a <= limitDeg(p.b, p.c) + 1.5,
  },
  {
    id: 'refraction-3', preset: 'pc_optics_3d', level: 3, kind: 'adjust',
    prompt: 'Réfraction chrono',
    hint: 'Plus le verre est réfringent, plus le rayon se rapproche de la normale.',
    start: { a: 5, b: 1, c: 1.5 }, controls: [dial], timeLimitS: 60,
    rounds: (rand) =>
      pickN([20, 25, 30, 35, 40], 4, rand).map((t) => ({
        prompt: `Obtiens un rayon réfracté de ${t}° (air → verre)`,
        start: { a: 5, b: 1, c: 1.5 },
        solution: { a: incidenceFor(t, 1, 1.5) },
        goal: refractsTo(t),
      })),
  },
];
