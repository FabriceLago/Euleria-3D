// Vérification minimale de la chaîne i18n : npx tsx scripts/i18n.check.ts
import assert from 'node:assert';
import { format, makeTextTranslator, reverseDict, translateDeep } from '../src/i18n/core.ts';
import enDict from '../src/i18n/locales/en.json' with { type: 'json' };
import nlDict from '../src/i18n/locales/nl.json' with { type: 'json' };
import { evaluateExerciseAnswer } from '../src/services/predictionEngine.ts';

const en = { 'Le quartier des affaires': 'The business district', 'Une zone rurale': 'A rural area', 'Quel quartier ?': 'Which district?' };
const exercise = { slug: 'hg-metropole', prompt: 'Quel quartier ?', options: ['Le quartier des affaires', 'Une zone rurale'], correctAnswer: 'Le quartier des affaires', subject: 'history_geography' };

// 1. Affichage : contenu traduit, identifiants intacts
const shown = translateDeep(exercise, en);
assert.equal(shown.prompt, 'Which district?');
assert.deepEqual(shown.options, ['The business district', 'A rural area']);
assert.equal(shown.slug, 'hg-metropole');
assert.equal(shown.subject, 'history_geography');

// 2. Correction : l'élève clique l'option anglaise → reconvertie en FR → validée
const toFr = reverseDict(en);
assert.ok(evaluateExerciseAnswer('quiz', toFr['The business district'], exercise.correctAnswer));
assert.ok(!evaluateExerciseAnswer('quiz', toFr['A rural area'], exercise.correctAnswer));
// Réponses numériques : indépendantes de la langue
assert.ok(evaluateExerciseAnswer('practice', toFr['6000'] ?? '6000', '6000'));

// 3. Interface : variables et repli sur le français
assert.equal(format({ 'Bonjour {name}': 'Hello {name}' }, 'Bonjour {name}', { name: 'Ana' }), 'Hello Ana');
assert.equal(format({}, 'Texte non traduit'), 'Texte non traduit');
// 4. Interface affichée (traducteur DOM) : exact, gabarit `${x}`, variable elle-même traduite, inconnu ignoré
const tr = makeTextTranslator({
  Envoyer: 'Send',
  'Moyenne d’examen blanc {0}/20 en {1}': 'Mock exam average {0}/20 in {1}',
  Mathématiques: 'Mathematics',
});
assert.equal(tr('  Envoyer\n '), 'Send');
assert.equal(tr('Moyenne d’examen blanc 14.5/20 en Mathématiques'), 'Mock exam average 14.5/20 in Mathematics');
assert.equal(tr('Texte libre d’un élève'), null);

// 5. Dictionnaires réels : chaque traduction garde les mêmes variables que la phrase source
for (const [lang, d] of Object.entries({ en: enDict, nl: nlDict }) as [string, Record<string, string>][])
  for (const [fr, t] of Object.entries(d)) {
    const v = (s: string) => (s.match(/\{\w+\}/g) || []).sort().join();
    assert.equal(v(t), v(fr), `${lang} : variables différentes pour « ${fr} »`);
  }
console.log('i18n OK');
