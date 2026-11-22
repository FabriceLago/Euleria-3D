// Effets : courbes d'animation, tweens, particules, nettoyage.
//   npx tsx scripts/missions.fx.check.ts
import assert from 'node:assert';
import * as THREE from 'three';
import { ease, MissionFx } from '../src/missions/fx.ts';
import type { FxContext } from '../src/three/MathSceneEngine.ts';

for (const f of Object.values(ease)) {
  assert.ok(Math.abs(f(0)) < 1e-9 && Math.abs(f(1) - 1) < 1e-9, 'courbe de 0 à 1');
}
assert.ok([0.6, 0.7, 0.8].some((t) => ease.outBack(t) > 1), 'outBack dépasse puis revient');

const subs = new Set<(dt: number) => void>();
const scene = new THREE.Scene();
const box = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
box.userData.tag = 'slice-0';
const group = new THREE.Group();
group.add(box);
const ctx: FxContext = {
  scene, camera: new THREE.PerspectiveCamera(), modelGroup: group, isSoftwareGl: false,
  onFrame: (cb) => (subs.add(cb), () => subs.delete(cb)),
  findByTag: (t) => (t === 'slice-0' ? box : null),
};
const fx = new MissionFx(ctx, false, '#4f46e5');
const run = (seconds: number) => {
  for (let t = 0; t < seconds; t += 1 / 60) for (const cb of [...subs]) cb(1 / 60);
};

let last = -1;
let finished = false;
fx.tween(0.5, (k) => (last = k), ease.outCubic, () => (finished = true));
run(0.6);
assert.ok(finished && Math.abs(last - 1) < 1e-9, 'tween terminé à 1');

fx.burst({ x: 0, y: 1, z: 0 });
assert.ok(fx.aliveOrbs() > 0);
run(1.2);
assert.equal(fx.aliveOrbs(), 0, 'particules éteintes après ~1 s');

const original = box.material;
fx.highlight('slice-0', '#f59e0b');
assert.notEqual(box.material, original, 'matériau cloné (pas de surbrillance partagée)');
fx.clearHighlights();
assert.equal(box.material, original);

fx.bounce('slice-0');
run(0.8);
assert.ok(Math.abs(box.scale.x - 1) < 1e-9, 'échelle restaurée après le rebond');

// Rebonds qui se chevauchent : l'échelle de base ne doit pas être capturée deux fois.
fx.bounce('slice-0');
run(0.1);
fx.bounce('slice-0');
run(1.0);
assert.ok(Math.abs(box.scale.x - 1) < 1e-9, 'rebonds superposés : échelle revenue à 1');

const reduced = new MissionFx(ctx, true, '#4f46e5');
assert.equal(subs.size, 2, 'deux abonnés à la boucle');
reduced.burst({ x: 0, y: 0, z: 0 });
assert.equal(reduced.aliveOrbs(), 0, 'mouvement réduit : pas de particules');
reduced.punchZoom();
run(0.6);
assert.equal(ctx.camera.zoom, 1, 'mouvement réduit : pas de zoom');
reduced.dispose();
assert.equal(subs.size, 1, 'mouvement réduit désabonné');

// Dispose en plein rebond : l'échelle d'origine est restaurée.
fx.bounce('slice-0');
run(0.2);
assert.ok(box.scale.x > 1, 'rebond en cours');
const before = scene.children.length;
fx.dispose();
assert.ok(Math.abs(box.scale.x - 1) < 1e-9, 'dispose en plein rebond : échelle restaurée');
assert.equal(scene.children.length, before - 1, 'particules retirées de la scène');
assert.equal(subs.size, 0, 'désabonné de la boucle');
console.log('missions fx OK');
