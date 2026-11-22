// Catalogue des missions : atteignables, non résolues au départ, bornes respectées.
//   npx tsx scripts/missions.catalog.check.ts
import assert from 'node:assert';
import { getParamMetadataForPreset } from '../src/three/MathSceneEngine.ts';
import { ALL_MISSIONS, findMission, getMissionsForPreset } from '../src/missions/catalog/index.ts';
import type { MissionDef, MissionParams, MissionRound } from '../src/missions/types.ts';

const seeded = () => {
  let s = 42;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
};
const rounds = (m: MissionDef): MissionRound[] =>
  m.rounds ? m.rounds(seeded()) : [{ prompt: m.prompt, start: m.start, goal: m.goal, targetTag: m.targetTag, solution: m.solution }];

const PILOTS = ['fractions_3d', 'pc_optics_3d', 'svt_dna_3d', 'hg_timeline_3d', 'fr_narrative_3d', 'en_tense_3d'];
for (const preset of PILOTS) {
  const ms = getMissionsForPreset(preset);
  assert.deepEqual(ms.map((m) => m.level), [1, 2, 3], `${preset} : 3 niveaux attendus`);
}
assert.equal(new Set(ALL_MISSIONS.map((m) => m.id)).size, ALL_MISSIONS.length, 'ids uniques');
assert.equal(findMission('fractions-1')?.preset, 'fractions_3d');
assert.equal(findMission('inconnue'), null);

for (const m of ALL_MISSIONS) {
  const meta = getParamMetadataForPreset(m.preset);
  const bounds = { a: [meta.minA, meta.maxA], b: [meta.minB, meta.maxB], c: [meta.minC, meta.maxC] } as const;
  assert.ok(m.prompt && m.hint, `${m.id} : consigne et indice`);
  for (const c of m.controls ?? []) {
    const [lo, hi] = bounds[c.param];
    assert.ok(c.min >= lo - 1e-9 && c.max <= hi + 1e-9, `${m.id} : contrôle ${c.param} hors bornes [${lo}, ${hi}]`);
  }
  const rs = rounds(m);
  assert.ok(rs.length >= 1);
  if (m.level === 3) assert.ok(rs.length >= 3 && m.timeLimitS, `${m.id} : chrono = plusieurs manches + limite`);
  for (const rd of rs) {
    const base: MissionParams = { a: meta.minA, b: meta.minB, c: meta.minC, ...m.start, ...rd.start };
    if (m.kind === 'identify') {
      assert.ok(rd.targetTag, `${m.id} : cible à toucher`);
      continue;
    }
    assert.ok(rd.goal && rd.solution, `${m.id} : objectif et solution`);
    assert.equal(rd.goal!(base), false, `${m.id} « ${rd.prompt} » : déjà résolu au départ`);
    const solved = { ...base, ...rd.solution };
    assert.equal(rd.goal!(solved), true, `${m.id} « ${rd.prompt} » : la solution ne valide pas l'objectif`);
    for (const [k, v] of Object.entries(rd.solution!)) {
      const ctl = (m.controls ?? []).find((c) => c.param === k);
      assert.ok(ctl, `${m.id} : la solution modifie ${k} sans contrôle`);
      assert.ok(v >= ctl!.min && v <= ctl!.max, `${m.id} : solution ${k}=${v} hors du contrôle`);
    }
  }
}
console.log(`missions catalog OK (${ALL_MISSIONS.length} missions)`);
