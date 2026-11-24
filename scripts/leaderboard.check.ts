// Classement public : seule la forme { rank, pseudonym, xp } peut sortir.
//   npx tsx scripts/leaderboard.check.ts
import assert from 'node:assert';
import { makePseudonym, toPublicLeaderboard } from '../src/db/leaderboard.ts';

// Une ligne « polluée » (champs privés en trop, comme une ligne brute de la table users) ne doit rien laisser passer
const polluted = [
  { pseudonym: 'Renard Curieux 42', xp: 230, displayName: 'Prénom Nom', avatarUrl: 'https://x/photo', gradeLevel: '6e', id: 91 },
  { pseudonym: null, xp: 180, displayName: 'Sans opt-in' },
  { pseudonym: 'Hibou Calme 17', xp: 125, lastActiveAt: '2026-11-24T00:00:00Z' },
] as unknown as Array<{ pseudonym: string | null; xp: number }>;

const out = toPublicLeaderboard(polluted);
assert.deepEqual(out, [
  { rank: 1, pseudonym: 'Renard Curieux 42', xp: 230 },
  { rank: 2, pseudonym: 'Hibou Calme 17', xp: 125 },
]);
for (const e of out) assert.deepEqual(Object.keys(e).sort(), ['pseudonym', 'rank', 'xp'], 'aucun champ privé');

// Pseudonyme tiré au sort : « Animal Adjectif NN », jamais vide, déterministe pour une graine donnée
let s = 7;
const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 200; i++) assert.match(makePseudonym(rand), /^\p{Lu}\p{Ll}+ \p{Lu}\p{Ll}+ \d{2}$/u);
assert.equal(makePseudonym(() => 0), 'Renard Curieux 10');

console.log('leaderboard OK');
