// Le moteur expose les points d'accroche et étiquette les objets des scènes pilotes.
//   npx tsx scripts/missions.engine.check.ts
import assert from 'node:assert';
import fs from 'node:fs';

const src = fs.readFileSync('src/three/MathSceneEngine.ts', 'utf8');
for (const api of ['public pick(', 'public findByTag(', 'public listTags(', 'public setOrbitEnabled(', 'public onFrame(', 'public projectToScreen(', 'public getFxContext(', 'export interface FxContext'])
  assert.ok(src.includes(api), `API manquante : ${api}`);
for (const tag of ['`slice-${i}`', "'normal'", '`step-${i}`', '`tense-${i + 1}`'])
  assert.ok(src.includes(`userData.tag = ${tag}`), `étiquette manquante : ${tag}`);
assert.ok(src.includes('this.frameListeners.forEach'), 'boucle de rendu : rappels par image');
assert.ok(/addEventListener\(\s*'wheel'[\s\S]{0,200}ctrlKey/.test(src), 'molette : zoom seulement avec Ctrl');
console.log('missions engine hooks OK');
