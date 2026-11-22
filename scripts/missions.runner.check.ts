// Machine à états des missions : transitions, chrono, étoiles, XP.
//   npx tsx scripts/missions.runner.check.ts
import assert from 'node:assert';
import { findMission } from '../src/missions/catalog/index.ts';
import { computeStars, createRun, elapsedMs, MAX_MISSION_XP, missionXp, step } from '../src/missions/runner.ts';

const single = findMission('fractions-1')!;
const chrono = findMission('fractions-3')!;
const rand = () => 0.3;

// Mission simple : intro → jeu → réussite du premier coup = 3 étoiles
let s = createRun(single, rand);
assert.equal(s.phase, 'intro');
assert.equal(step(s, { type: 'solved', now: 0 }).phase, 'intro', 'rien avant begin');
s = step(s, { type: 'begin', now: 1000 });
assert.equal(s.phase, 'playing');
s = step(s, { type: 'solved', now: 4000 });
assert.equal(s.phase, 'done');
assert.equal(elapsedMs(s, 99999), 3000, 'chrono figé à la fin');
assert.equal(computeStars(s), 3);

// Erreur → démonstration → retour en jeu (même manche), puis réussite = 2 étoiles
s = step(createRun(single, rand), { type: 'begin', now: 0 });
s = step(s, { type: 'wrong', now: 100 });
assert.equal(s.phase, 'demo');
s = step(s, { type: 'demoDone', now: 200 });
assert.equal(s.phase, 'playing');
assert.equal(s.round, 0);
s = step(s, { type: 'solved', now: 300 });
assert.equal(computeStars(s), 2);

// Indice sans erreur = 2 étoiles ; deux erreurs = 1 étoile
s = step(step(createRun(single, rand), { type: 'begin', now: 0 }), { type: 'hint' });
assert.equal(computeStars(step(s, { type: 'solved', now: 1 })), 2);
s = step(createRun(single, rand), { type: 'begin', now: 0 });
for (let i = 0; i < 2; i++) s = step(step(s, { type: 'wrong', now: 1 }), { type: 'demoDone', now: 2 });
assert.equal(computeStars(step(s, { type: 'solved', now: 3 })), 1);

// Pause : le chrono s'arrête puis reprend
s = step(createRun(single, rand), { type: 'begin', now: 0 });
s = step(s, { type: 'pause', now: 1000 });
assert.equal(s.phase, 'paused');
assert.equal(elapsedMs(s, 50000), 1000);
s = step(s, { type: 'resume', now: 50000 });
assert.equal(s.phase, 'playing');
assert.equal(elapsedMs(s, 50500), 1500);

// Chrono : chaque manche gagnée avance ; une erreur passe à la manche suivante après la démo
s = step(createRun(chrono, rand), { type: 'begin', now: 0 });
assert.equal(s.rounds.length, 4);
s = step(s, { type: 'solved', now: 1 });
assert.equal(s.round, 1);
s = step(step(s, { type: 'wrong', now: 2 }), { type: 'demoDone', now: 3 });
assert.equal(s.round, 2);
s = step(step(s, { type: 'solved', now: 4 }), { type: 'solved', now: 5 });
assert.equal(s.phase, 'done');
assert.equal(s.roundsWon, 3);
assert.equal(computeStars(s), 2, '3/4 = 2 étoiles');

// Temps écoulé sans manche gagnée = 0 étoile ; abandon
s = step(step(createRun(chrono, rand), { type: 'begin', now: 0 }), { type: 'timeUp', now: 60000 });
assert.equal(s.phase, 'done');
assert.equal(computeStars(s), 0);
assert.equal(step(createRun(single, rand), { type: 'abort' }).phase, 'aborted');

// XP : plafonné, proportionnel au niveau et aux étoiles
assert.equal(missionXp(3, 3), MAX_MISSION_XP);
assert.equal(missionXp(1, 3), 20);
assert.equal(missionXp(2, 2), 23);
assert.equal(missionXp(1, 0), 0);
assert.equal(missionXp(3, 9), MAX_MISSION_XP, 'étoiles hors bornes plafonnées');
assert.equal(missionXp(2, NaN), 0, 'étoiles NaN = 0');
assert.equal(missionXp(2, Infinity), 0, 'étoiles non finies = 0');
assert.equal(missionXp(4 as 1, 3), 0, 'niveau inconnu = 0');
assert.equal(missionXp(0 as 1, 3), 0, 'niveau inconnu = 0');
console.log('missions runner OK');
