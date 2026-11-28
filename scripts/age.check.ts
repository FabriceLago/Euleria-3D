// Âge minimum de création de compte (15 ans) : npx tsx scripts/age.check.ts
import assert from 'node:assert';
import { hasMinimumAge, MIN_ACCOUNT_AGE } from '../src/db/age.ts';

assert.equal(MIN_ACCOUNT_AGE, 15);
const now = new Date(Date.UTC(2026, 10, 28)); // 28 novembre 2026

assert.equal(hasMinimumAge(2011, 10, now), true, 'né en octobre 2011 : 15 ans');
assert.equal(hasMinimumAge(2011, 11, now), false, 'né en novembre 2011 : anniversaire peut-être pas encore passé');
assert.equal(hasMinimumAge(2011, 12, now), false, 'né en décembre 2011 : 14 ans');
assert.equal(hasMinimumAge(2012, 1, now), false, '14 ans');
assert.equal(hasMinimumAge(1990, 6, now), true, 'adulte');
for (const bad of [[2011, 0], [2011, 13], [2030, 1], [1800, 1], [2010.5, 1]]) {
  assert.equal(hasMinimumAge(bad[0], bad[1], now), false, `entrée invalide refusée : ${bad}`);
}
console.log('age OK');
