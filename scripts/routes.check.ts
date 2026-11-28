// Adresses de l'app (audit 3.5) : npx tsx scripts/routes.check.ts
import assert from 'node:assert';
import { APP_ROUTE_PATTERN, parsePath, toPath } from '../src/lib/routes.ts';

// Aller-retour état → adresse → état
const states = [
  { section: 'curriculum' as const },
  { section: 'curriculum' as const, subject: 'mathematics' as const, grade: '6e' as const },
  { section: 'curriculum' as const, subject: 'svt' as const, grade: 'terminale' as const, chapterSlug: 'term-genetique-evolution' },
  { section: 'quiz' as const },
  { section: 'studio3d' as const },
  { section: 'leaderboard' as const },
  { section: 'collaboration' as const },
];
for (const s of states) assert.deepEqual(parsePath(toPath(s)), s, `aller-retour ${JSON.stringify(s)}`);

assert.equal(toPath({ section: 'curriculum', subject: 'physics_chemistry', grade: '2nde' }), '/cours/physique-chimie/2nde');
assert.equal(toPath({ section: 'studio3d' }), '/atelier-3d');
assert.deepEqual(parsePath('/cours/maths/6e/'), { section: 'curriculum', subject: 'mathematics', grade: '6e' }, 'barre finale tolérée');

// Adresses étrangères à l'app : null (le serveur répond 404)
for (const bad of ['/nimporte-quoi', '/cours/latin/6e', '/cours/maths/7e', '/cours/maths', '/api/health', '/quiz/x']) {
  assert.equal(parsePath(bad), null, `refusée : ${bad}`);
}

// L'expression du serveur accepte exactement les mêmes adresses
for (const s of states) assert.ok(APP_ROUTE_PATTERN.test(toPath(s)), `serveur accepte ${toPath(s)}`);
for (const bad of ['/nimporte-quoi', '/api/x', '/robots.txt', '/cours/maths', '/quiz/x', '/cours/latin/6e', '/cours/maths/7e']) {
  assert.ok(!APP_ROUTE_PATTERN.test(bad), `serveur refuse ${bad}`);
}
console.log('routes OK');
