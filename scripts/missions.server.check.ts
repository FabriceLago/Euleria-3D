// Validation serveur d'un résultat de mission (anti-triche : XP recalculés et plafonnés).
//   npx tsx scripts/missions.server.check.ts
import assert from 'node:assert';
import { validateMissionCompletion } from '../src/missions/serverValidation.ts';

assert.deepEqual(validateMissionCompletion({ missionId: 'fractions-3', stars: 3, timeMs: 20000 }), { ok: true, xp: 40 });
assert.deepEqual(validateMissionCompletion({ missionId: 'fractions-1', stars: 2, timeMs: 5000 }), { ok: true, xp: 15 });
assert.deepEqual(validateMissionCompletion({ missionId: 'fractions-1', stars: 3, timeMs: 400 }), { ok: true, xp: 20 });
for (const bad of [
  { missionId: 'inconnue', stars: 3, timeMs: 5000 },
  { missionId: 'fractions-1', stars: 4, timeMs: 5000 },
  { missionId: 'fractions-1', stars: 0, timeMs: 5000 },
  { missionId: 'fractions-1', stars: 2.5, timeMs: 5000 },
  { missionId: 'fractions-1', stars: 3, timeMs: 200 },
  { missionId: 42, stars: 3, timeMs: 5000 },
  null,
]) assert.equal(validateMissionCompletion(bad).ok, false, JSON.stringify(bad));
console.log('missions server validation OK');
