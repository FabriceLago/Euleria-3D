import React from 'react';
import type { ChapterStudySheet } from '../services/flashcardEngine.ts';
import type { StudyPlanData, UserProfile } from '../types/learning.ts';

export interface PrintableGrandOralBrief {
  title: string;
  specialtiesLabel: string;
  problemStatement: string;
  hook: string;
  outline: Array<{ part: string; details: string }>;
  keyConcepts: string[];
  juryQuestions: string[];
  selfEvalScoreOn20: number | null;
}

export type PrintableDocument =
  | {
      kind: 'study-sheet';
      sheet: ChapterStudySheet;
      subjectLabel: string;
      generatedAt: string;
    }
  | {
      kind: 'progress-bulletin';
      plan: StudyPlanData;
      profile: UserProfile | null;
      generatedAt: string;
    }
  | {
      kind: 'grand-oral-brief';
      brief: PrintableGrandOralBrief;
      generatedAt: string;
    };

export const PrintDocumentPortal: React.FC<{ document: PrintableDocument | null }> = ({
  document,
}) => {
  if (!document) {
    return <div id="euleria-print-root" aria-hidden="true" />;
  }

  return (
    <div id="euleria-print-root" className="text-slate-900 bg-white">
      {document.kind === 'study-sheet' && (
        <article className="space-y-6">
          <header className="pb-4 border-b-2 border-slate-900 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-700">
                Euleria 3D · Fiche de révision officielle · {document.subjectLabel} · Niveau {document.sheet.gradeLevel}
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {document.sheet.chapterTitle}
              </h1>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Éditée le {document.generatedAt}
            </div>
          </header>

          <section className="p-4 rounded-lg border border-slate-300 bg-slate-50">
            <h2 className="text-xs font-bold text-slate-600">L’essentiel à retenir</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
              {document.sheet.summary}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="text-xs font-bold text-slate-600">Formule / Règle de référence</div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-900">
                {document.sheet.formulaDisplay}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-900 pb-1.5 border-b border-slate-200">
              Points clés du programme
            </h2>
            <ol className="mt-3 space-y-2 list-decimal list-inside text-sm leading-relaxed text-slate-800">
              {document.sheet.keyPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ol>
          </section>

          {document.sheet.methodsAndTips.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-900 pb-1.5 border-b border-slate-200">
                Méthodes & réflexes d’examen
              </h2>
              <div className="mt-3 space-y-3">
                {document.sheet.methodsAndTips.map((m, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-200">
                    <div className="text-xs font-semibold text-slate-900">
                      Réflexe {i + 1} · {m.tip}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700">{m.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>
      )}

      {document.kind === 'progress-bulletin' && (
        <article className="space-y-6">
          <header className="pb-4 border-b-2 border-slate-900 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-700">
                Euleria 3D · Bulletin de progression académique
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {document.profile ? document.profile.displayName : 'Élève en mode découverte'} — Niveau {document.plan.gradeLevel}
              </h1>
            </div>
            <div className="text-xs font-mono text-slate-500">
              Généré le {document.generatedAt}
            </div>
          </header>

          <section className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg border border-slate-300">
              <div className="text-xs text-slate-500">XP cette semaine</div>
              <div className="mt-1 text-lg font-bold font-mono tabular-nums">
                {document.plan.weeklyXpEarned} / {document.plan.weeklyXpGoal}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-slate-300">
              <div className="text-xs text-slate-500">Actions 7 jours</div>
              <div className="mt-1 text-lg font-bold font-mono tabular-nums">
                {document.plan.weeklyActionsCount}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-slate-300">
              <div className="text-xs text-slate-500">Flashcards maîtrisées</div>
              <div className="mt-1 text-lg font-bold font-mono tabular-nums">
                {document.plan.masteredFlashcardsCount}
              </div>
            </div>
            <div className="p-3 rounded-lg border border-slate-300">
              <div className="text-xs text-slate-500">Dernier examen blanc</div>
              <div className="mt-1 text-lg font-bold font-mono tabular-nums">
                {document.plan.latestExam
                  ? `${document.plan.latestExam.scoreOn20.toFixed(1).replace('.', ',')}/20`
                  : '—'}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-900 pb-1.5 border-b border-slate-200">
              Bilan par matière du tronc commun
            </h2>
            <table className="mt-3 w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-slate-600">
                  <th className="py-2 pr-3 font-semibold">Matière</th>
                  <th className="py-2 pr-3 font-semibold">Chapitres validés</th>
                  <th className="py-2 pr-3 font-semibold">Maîtrise BKT</th>
                  <th className="py-2 pr-3 font-semibold">Moyenne examen blanc</th>
                  <th className="py-2 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {document.plan.subjectSummaries.map((s) => (
                  <tr key={s.subject}>
                    <td className="py-2 pr-3 font-semibold text-slate-900">{s.label}</td>
                    <td className="py-2 pr-3 font-mono tabular-nums">
                      {s.gradeCompletedChapters}/{s.gradeTotalChapters}
                    </td>
                    <td className="py-2 pr-3 font-mono tabular-nums">{s.avgMasteryPct}%</td>
                    <td className="py-2 pr-3 font-mono tabular-nums">
                      {s.avgExamScoreOn20 !== null
                        ? `${s.avgExamScoreOn20.toFixed(1).replace('.', ',')}/20`
                        : '—'}
                    </td>
                    <td className="py-2 capitalize">{s.status.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {document.plan.priorityChapters.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-slate-900 pb-1.5 border-b border-slate-200">
                Plan d’action prioritaire recommandé
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-slate-800">
                {document.plan.priorityChapters.map((ch) => (
                  <li key={ch.chapterId} className="p-2.5 rounded border border-slate-200">
                    <strong>
                      {ch.title} ({ch.subjectLabel} · {ch.gradeLevel})
                    </strong>{' '}
                    — {ch.reason}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      )}

      {document.kind === 'grand-oral-brief' && (
        <article className="space-y-5">
          <header className="pb-4 border-b-2 border-slate-900 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-700">
                Euleria 3D · Fiche de préparation Grand Oral · {document.brief.specialtiesLabel}
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{document.brief.title}</h1>
            </div>
            <div className="text-xs font-mono text-slate-500">
              {document.brief.selfEvalScoreOn20 !== null
                ? `Auto-évaluation : ${document.brief.selfEvalScoreOn20}/20 · `
                : ''}
              {document.generatedAt}
            </div>
          </header>

          <section className="p-4 rounded-lg border border-slate-300 bg-slate-50">
            <div className="text-xs font-bold text-slate-600">Problématique officielle</div>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {document.brief.problemStatement}
            </p>
            <div className="mt-3 text-xs text-slate-700">
              <strong>Accroche conseillée :</strong> {document.brief.hook}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-900 pb-1.5 border-b border-slate-200">
              Plan détaillé de l’exposé (10 minutes)
            </h2>
            <div className="mt-3 space-y-2.5">
              {document.brief.outline.map((item, idx) => (
                <div key={idx} className="p-3 rounded border border-slate-200">
                  <div className="text-xs font-bold text-slate-900">{item.part}</div>
                  <p className="mt-1 text-xs text-slate-700">{item.details}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-900 pb-1.5 border-b border-slate-200">
              Questions probables du jury (10 minutes d’échange)
            </h2>
            <ul className="mt-2.5 space-y-1.5 list-disc list-inside text-xs text-slate-800">
              {document.brief.juryQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </section>
        </article>
      )}
    </div>
  );
};
