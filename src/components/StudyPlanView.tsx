import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  Layers,
  Printer,
  Sparkles,
  Target,
} from 'lucide-react';
import { GRADE_LEVELS, SUBJECTS } from '../db/curriculumData.ts';
import type {
  AccentColor,
  ChapterItem,
  GradeLevel,
  StudyPlanData,
  SubjectId,
  UserProfile,
} from '../types/learning.ts';
import type { PrintableDocument } from '../utils/printExport.tsx';

interface StudyPlanViewProps {
  chapters: ChapterItem[];
  selectedGrade: GradeLevel;
  profile: UserProfile | null;
  accentColor: AccentColor;
  backendAvailable: boolean;
  onSignIn: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onOpenChapter: (chapter: ChapterItem) => void;
  onLaunchDynamicQuiz: (chapterId: number) => void;
  onOpenMockExams: () => void;
  onUpdateWeeklyGoal: (goalXp: number) => Promise<void>;
  onPrintDocument?: (doc: PrintableDocument) => void;
}

const ACCENT_BTN_MAP: Record<AccentColor, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
  sky: 'bg-sky-600 hover:bg-sky-700 text-white',
};

const GOAL_PRESETS = [200, 400, 700, 1000];

const STATUS_META: Record<
  'prioritaire' | 'en_cours' | 'solide' | 'a_decouvrir',
  { label: string; className: string }
> = {
  prioritaire: {
    label: 'Prioritaire',
    className: 'text-amber-700 dark:text-amber-300',
  },
  en_cours: {
    label: 'En cours',
    className: 'text-sky-700 dark:text-sky-300',
  },
  solide: {
    label: 'Solide',
    className: 'text-emerald-700 dark:text-emerald-300',
  },
  a_decouvrir: {
    label: 'À découvrir',
    className: 'text-slate-500 dark:text-slate-400',
  },
};

function buildGuestStudyPlan(chapters: ChapterItem[], gradeLevel: GradeLevel): StudyPlanData {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const subjectSummaries = SUBJECTS.map((subj) => {
    const gradeChs = chapters.filter(
      (c) => (c.subject || 'mathematics') === subj.id && c.gradeLevel === gradeLevel
    );
    return {
      subject: subj.id as SubjectId,
      label: subj.shortLabel,
      gradeCompletedChapters: 0,
      gradeTotalChapters: gradeChs.length,
      avgMasteryPct: 0,
      avgExamScoreOn20: null,
      dueCardsCount: 0,
      status: 'a_decouvrir' as const,
    };
  });

  const priorityChapters = SUBJECTS.map((subj) => {
    const firstCh = chapters.find(
      (c) => (c.subject || 'mathematics') === subj.id && c.gradeLevel === gradeLevel
    );
    if (!firstCh) return null;
    return {
      chapterId: firstCh.id,
      title: firstCh.title,
      subject: firstCh.subject,
      subjectLabel: subj.shortLabel,
      gradeLevel: firstCh.gradeLevel,
      masteryPct: 0,
      dueCardsCount: 0,
      reason: `Chapitre de départ recommandé en ${gradeLevel}`,
      priorityLevel: 'decouverte' as const,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    gradeLevel,
    weeklyXpGoal: 400,
    weeklyXpEarned: 0,
    weeklyActionsCount: 0,
    dailyActivity: days.map((dayLabel, idx) => ({
      dateIso: `day-${idx}`,
      dayLabel,
      actionsCount: 0,
      xpEarned: 0,
    })),
    dueFlashcardsCount: 0,
    masteredFlashcardsCount: 0,
    dueByChapter: [],
    subjectSummaries,
    priorityChapters,
    latestExam: null,
  };
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({
  chapters,
  selectedGrade,
  profile,
  accentColor,
  backendAvailable,
  onSignIn,
  apiFetch,
  onOpenChapter,
  onLaunchDynamicQuiz,
  onOpenMockExams,
  onUpdateWeeklyGoal,
  onPrintDocument,
}) => {
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [savingGoal, setSavingGoal] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    if (!profile || !backendAvailable) {
      setPlan(buildGuestStudyPlan(chapters, profile?.gradeLevel || selectedGrade));
      setLoading(false);
      return;
    }

    async function loadStudyPlan() {
      setLoading(true);
      try {
        const res = await apiFetch('/api/me/study-plan');
        if (!res.ok) throw new Error('HTTP_ERROR');
        const data = (await res.json()) as StudyPlanData;
        if (mounted) setPlan(data);
      } catch {
        if (mounted) {
          setPlan(buildGuestStudyPlan(chapters, profile?.gradeLevel || selectedGrade));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStudyPlan();
    return () => {
      mounted = false;
    };
  }, [profile, backendAvailable, apiFetch, chapters, selectedGrade]);

  const chapterById = useMemo(
    () => new Map<number, ChapterItem>(chapters.map((c) => [c.id, c])),
    [chapters]
  );

  const gradeLabelMap = useMemo(
    () => new Map<string, string>(GRADE_LEVELS.map((g) => [g.id, g.label])),
    []
  );

  const activePlan = plan || buildGuestStudyPlan(chapters, profile?.gradeLevel || selectedGrade);
  const goalPct = Math.min(
    100,
    Math.round((activePlan.weeklyXpEarned / Math.max(1, activePlan.weeklyXpGoal)) * 100)
  );
  const maxDayXp = Math.max(
    40,
    ...activePlan.dailyActivity.map((d) => Math.max(d.xpEarned, d.actionsCount * 15))
  );

  const handleSelectGoal = async (goalXp: number) => {
    if (!profile || savingGoal) return;
    setSavingGoal(true);
    setPlan((prev) => (prev ? { ...prev, weeklyXpGoal: goalXp } : prev));
    try {
      await onUpdateWeeklyGoal(goalXp);
    } finally {
      setSavingGoal(false);
    }
  };

  if (loading && !plan) {
    return (
      <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        Calcul de votre plan de révision personnalisé...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!profile && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Aperçu du parcours recommandé pour la classe de{' '}
            <strong className="text-slate-900 dark:text-white">
              {gradeLabelMap.get(activePlan.gradeLevel) || activePlan.gradeLevel}
            </strong>
            . Connectez-vous pour activer votre suivi hebdomadaire, vos flashcards SM-2 à revoir et vos priorités d’examen.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
          >
            Connexion Google
          </button>
        </div>
      )}

      {/* Bandeau supérieur : Objectif hebdomadaire & Rythme 7 jours */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Objectif hebdomadaire */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Target className="w-4 h-4 text-slate-500" />
                <span>Objectif de révision hebdomadaire</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Exercices, examens blancs et flashcards SM-2 cumulés sur les 7 derniers jours.
              </p>
            </div>
            <div className="flex items-start gap-3">
              {onPrintDocument && (
                <button
                  type="button"
                  onClick={() =>
                    onPrintDocument({
                      kind: 'progress-bulletin',
                      plan: activePlan,
                      profile,
                      generatedAt: new Date().toLocaleDateString(document.documentElement.lang),
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Bulletin PDF</span>
                </button>
              )}
              <div className="text-right">
                <div className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {activePlan.weeklyXpEarned}{' '}
                  <span className="text-sm font-medium text-slate-400">
                    / {activePlan.weeklyXpGoal} XP
                  </span>
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {activePlan.weeklyActionsCount > 1
                    ? `${goalPct}% atteint · ${activePlan.weeklyActionsCount} activités`
                    : `${goalPct}% atteint · ${activePlan.weeklyActionsCount} activité`}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-slate-900 dark:bg-white transition-all duration-300"
                style={{ width: `${goalPct}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {goalPct >= 100
                  ? 'Objectif hebdomadaire atteint — excellent rythme.'
                  : `Encore ${Math.max(0, activePlan.weeklyXpGoal - activePlan.weeklyXpEarned)} XP pour valider votre semaine.`}
              </span>

              {profile && (
                <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {GOAL_PRESETS.map((presetXp) => (
                    <button
                      key={presetXp}
                      type="button"
                      disabled={savingGoal}
                      onClick={() => handleSelectGoal(presetXp)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono tabular-nums font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        activePlan.weeklyXpGoal === presetXp
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {presetXp}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Rythme sur 7 jours */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <CalendarDays className="w-4 h-4 text-slate-500" />
              <span>Régularité sur 7 jours</span>
            </div>
            {profile && (
              <span className="inline-flex items-center gap-1 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                {profile.streakDays} j.
              </span>
            )}
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2">
            {activePlan.dailyActivity.map((day) => {
              const barScore = Math.max(day.xpEarned, day.actionsCount * 15);
              const heightPct =
                barScore === 0 ? 8 : Math.max(18, Math.round((barScore / maxDayXp) * 100));
              return (
                <div
                  key={day.dateIso}
                  className="flex flex-col items-center justify-end gap-1.5 h-full"
                  title={`${day.dayLabel} : ${day.actionsCount} activités · ${day.xpEarned} XP`}
                >
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-md transition-all ${
                        barScore > 0
                          ? 'bg-slate-900 dark:bg-white'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {day.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Corps principal : Chapitres prioritaires (7 cols) + SM-2 & Matières (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne gauche : Chapitres prioritaires à retravailler */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Chapitres prioritaires à réviser</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Classe : {gradeLabelMap.get(activePlan.gradeLevel) || activePlan.gradeLevel}
            </span>
          </div>

          {activePlan.priorityChapters.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Tous les chapitres de votre niveau sont à jour. Lancez un examen blanc pour tester votre maîtrise globale.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activePlan.priorityChapters.map((item) => {
                const chapterObj = chapterById.get(item.chapterId);
                return (
                  <div
                    key={item.chapterId}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.subjectLabel}
                        </span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{item.gradeLevel}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>Maîtrise {item.masteryPct}%</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p
                        className={`text-xs ${
                          item.priorityLevel === 'haute'
                            ? 'text-amber-700 dark:text-amber-300 font-medium'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onLaunchDynamicQuiz(item.chapterId)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Quiz</span>
                      </button>
                      {chapterObj && (
                        <button
                          type="button"
                          onClick={() => onOpenChapter(chapterObj)}
                          className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
                        >
                          <span>Ouvrir</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Colonne droite : Radar Flashcards SM-2 + Équilibre par matière */}
        <div className="lg:col-span-5 space-y-6">
          {/* Radar Flashcards SM-2 */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Répétition espacée (SM-2)</span>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {activePlan.masteredFlashcardsCount > 1
                  ? `${activePlan.masteredFlashcardsCount} maîtrisées`
                  : `${activePlan.masteredFlashcardsCount} maîtrisée`}
              </span>
            </div>

            {activePlan.dueByChapter.length === 0 ? (
              <div className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Aucune carte en attente aujourd’hui. Ouvrez l’onglet Flashcards d’un chapitre pour enrichir votre mémoire à long terme.
                </span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activePlan.dueByChapter.map((due) => {
                  const ch = chapterById.get(due.chapterId);
                  return (
                    <div
                      key={due.chapterId}
                      className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {due.chapterTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          {due.subjectLabel} · {due.dueCount > 1 ? `${due.dueCount} cartes à revoir` : `${due.dueCount} carte à revoir`}
                        </div>
                      </div>
                      {ch && (
                        <button
                          type="button"
                          onClick={() => onOpenChapter(ch)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Réviser
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Bilan des 6 matières & dernier examen blanc */}
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <ClipboardCheck className="w-4 h-4 text-slate-500" />
                <span>Équilibre des 6 matières</span>
              </div>
              {activePlan.latestExam && (
                <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  Dernier examen : {activePlan.latestExam.scoreOn20.toFixed(1).replace('.', ',')}/20
                </span>
              )}
            </div>

            <div className="space-y-3">
              {activePlan.subjectSummaries.map((subj) => {
                const statusInfo = STATUS_META[subj.status];
                return (
                  <div key={subj.subject} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {subj.label}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        <span className={`font-sans font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>
                          {subj.gradeCompletedChapters}/{subj.gradeTotalChapters} ch.
                        </span>
                        {subj.avgExamScoreOn20 !== null && (
                          <>
                            <span className="mx-1.5" aria-hidden="true">·</span>
                            <span>{subj.avgExamScoreOn20.toFixed(1).replace('.', ',')}/20</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-slate-900 dark:bg-white transition-all"
                        style={{
                          width: `${
                            subj.avgMasteryPct > 0
                              ? subj.avgMasteryPct
                              : subj.avgExamScoreOn20 !== null
                                ? Math.round((subj.avgExamScoreOn20 / 20) * 100)
                                : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Évaluez vos 6 matières en conditions réelles
              </span>
              <button
                type="button"
                onClick={onOpenMockExams}
                className="text-xs font-semibold text-slate-900 dark:text-white underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Passer un examen blanc
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
