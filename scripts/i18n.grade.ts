// Pour chaque exercice et chaque langue : l'option correcte traduite, renvoyée par l'élève, doit être validée.
//   npx tsx scripts/i18n.grade.ts
import { ALL_SEED_CHAPTERS } from '../src/db/curriculumData.ts';
import { reverseDict, translateDeep, type Dict } from '../src/i18n/core.ts';
import { evaluateExerciseAnswer } from '../src/services/predictionEngine.ts';
import en from '../src/i18n/locales/en.json' with { type: 'json' };
import nl from '../src/i18n/locales/nl.json' with { type: 'json' };

let bad = 0, total = 0;
for (const [lang, dict] of [['en', en], ['nl', nl]] as [string, Dict][]) {
  const rev = reverseDict(dict);
  for (const ch of ALL_SEED_CHAPTERS) for (const ex of ch.exercises) {
    total++;
    const shown = translateDeep(ex, dict);
    // quiz : l'élève clique l'option affichée correspondant à la bonne réponse ; practice : il tape la traduction
    const idx = ex.options?.indexOf(ex.correctAnswer) ?? -1;
    const typed = idx >= 0 ? shown.options![idx] : (dict[ex.correctAnswer] ?? ex.correctAnswer);
    const ok = evaluateExerciseAnswer(ex.exerciseType, rev[typed] ?? typed, ex.correctAnswer);
    // une mauvaise option ne doit pas devenir correcte (collision de traduction)
    const wrong = ex.options?.find((o) => o !== ex.correctAnswer);
    const wrongShown = wrong ? shown.options![ex.options!.indexOf(wrong)] : null;
    const leak = wrongShown != null && evaluateExerciseAnswer(ex.exerciseType, rev[wrongShown] ?? wrongShown, ex.correctAnswer);
    if (!ok || leak) { bad++; if (bad <= 10) console.log(`✗ ${lang} ${ch.slug} : « ${typed} » ${leak ? '(mauvaise option acceptée)' : 'refusée'}`); }
  }
}
console.log(`${total - bad}/${total} exercices corrigés correctement en EN/NL`);
process.exit(bad ? 1 : 0);
