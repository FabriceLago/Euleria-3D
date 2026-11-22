// Gestes : glissé → cran, molette d'angle, toucher d'étiquette, clavier.
//   npx tsx scripts/missions.gestures.check.ts
import assert from 'node:assert';
import { digitTag, dialValue, dragValue, keyValue, snap, tapValue } from '../src/missions/gestures.ts';
import type { MissionControl } from '../src/missions/types.ts';

const dx: MissionControl = { param: 'a', gesture: 'drag-x', min: 1, max: 12, step: 1, pxPerStep: 20 };
const dy: MissionControl = { param: 'b', gesture: 'drag-y', min: 2, max: 12, step: 1, pxPerStep: 20 };
const dial: MissionControl = { param: 'a', gesture: 'dial', min: 5, max: 80, step: 1 };
const tap: MissionControl = { param: 'a', gesture: 'tap', tagPrefix: 'slice-', offset: 1, min: 1, max: 12, step: 1 };

assert.equal(snap(3.4, 1, 12, 1), 3);
assert.equal(snap(99, 1, 12, 1), 12);
assert.equal(snap(1.04, 1, 2, 0.05), 1.05);

assert.equal(dragValue(dx, 3, 41, 0), 5, '41 px → 2 crans');
assert.equal(dragValue(dx, 3, -200, 0), 1, 'borne basse');
assert.equal(dragValue(dx, 3, 0, 300), 3, 'drag-x ignore le vertical');
assert.equal(dragValue(dy, 4, 0, -40), 6, 'vers le haut = plus');

assert.equal(dialValue(dial, 100, 100, 100, 0), 5, 'droit vers le haut → 0° (borné à 5)');
assert.equal(dialValue(dial, 100, 100, 200, 0), 45);
assert.equal(dialValue(dial, 100, 100, 0, 0), 45, 'symétrique à gauche');
assert.equal(dialValue(dial, 100, 100, 200, 150), 80, 'sous le centre → borne haute');

assert.equal(tapValue(tap, 'slice-2'), 3);
assert.equal(tapValue(tap, 'step-1'), null);
assert.equal(tapValue(dx, 'slice-2'), null, 'contrôle sans préfixe');

assert.equal(keyValue(dx, 3, 'ArrowRight'), 4);
assert.equal(keyValue(dx, 1, 'ArrowLeft'), 1);
assert.equal(keyValue(dy, 4, 'ArrowUp'), 5);
assert.equal(keyValue(dy, 4, 'ArrowRight'), null);
assert.equal(keyValue(tap, 4, 'ArrowRight'), null);
assert.equal(digitTag('2', ['step-0', 'step-1']), 'step-1');
assert.equal(digitTag('3', ['a', 'b']), null);
assert.equal(digitTag('0', ['a']), null);
assert.equal(digitTag('x', ['a']), null);
console.log('missions gestures OK');
