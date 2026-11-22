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

let frame: ((dt: number) => void) | null = null;
const scene = new THREE.Scene();
const box = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial());
box.userData.tag = 'slice-0';
const group = new THREE.Group();
group.add(box);
const ctx: FxContext = {
  scene, camera: new THREE.PerspectiveCamera(), modelGroup: group, isSoftwareGl: false,
  onFrame: (cb) => ((frame = cb), () => (frame = null)),
  findByTag: (t) => (t === 'slice-0' ? box : null),
};
const fx = new MissionFx(ctx, false, '#4f46e5');
const run = (seconds: number) => { for (let t = 0; t < seconds; t += 1 / 60) frame!(1 / 60); };

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

const reduced = new MissionFx(ctx, true, '#4f46e5');
reduced.burst({ x: 0, y: 0, z: 0 });
assert.equal(reduced.aliveOrbs(), 0, 'mouvement réduit : pas de particules');
reduced.dispose();

const before = scene.children.length;
fx.dispose();
assert.equal(scene.children.length, before - 1, 'particules retirées de la scène');
assert.equal(frame, null, 'désabonné de la boucle');
console.log('missions fx OK');
