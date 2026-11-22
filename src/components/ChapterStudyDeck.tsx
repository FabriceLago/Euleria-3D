import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  FileText,
  HelpCircle,
  Layers,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { ALL_SEED_CHAPTERS, SUBJECTS } from '../db/curriculumData.ts';
import {
  buildChapterFlashcards,
  buildChapterStudySheet,
  computeSm2NextState,
  formatIntervalLabel,
  formatStudySheetAsText,
  type ChapterFlashcardItem,
  type ChapterStudySheet,
  type FlashcardRating,
} from '../services/flashcardEngine.ts';
import type { AccentColor, BadgeItem, ChapterItem } from '../types/learning.ts';
import type { PrintableDocument } from '../utils/printExport.tsx';

interface ChapterStudyDeckProps {
  chapter: ChapterItem;
  padClass: string;
  accentColor: AccentColor;
  isAuthenticated: boolean;
  backendAvailable: boolean;
  onRequireSignIn: () => Promise<boolean>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onXpSynced?: (newTotalXp: number, newBadges: BadgeItem[]) => void;
  onPrintDocument?: (doc: PrintableDocument) => void;
}

const ACCENT_BTN_MAP: Record<AccentColor, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
  sky: 'bg-sky-600 hover:bg-sky-700 text-white',
};

const RATING_CONFIG: Array<{
  rating: FlashcardRating;
  label: string;
  toneClass: string;
}> = [
  {
    rating: 'again',
    label: 'À revoir',
    toneClass:
      'border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-950/50',
  },
  {
    rating: 'hard',
    label: 'Difficile',
    toneClass:
      'border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/50',
  },
  {
    rating: 'good',
    label: 'Bien',
    toneClass:
      'border-sky-200 dark:border-sky-900 bg-sky-50/70 dark:bg-sky-950/30 text-sky-800 dark:text-sky-200 hover:bg-sky-100 dark:hover:bg-sky-950/50',
  },
  {
    rating: 'easy',
    label: 'Facile',
    toneClass:
      'border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-950/50',
  },
];

function buildLocalDeck(chapter: ChapterItem): {
  studySheet: ChapterStudySheet;
  flashcards: ChapterFlashcardItem[];
} {
  const seed = ALL_SEED_CHAPTERS.find((s) => s.slug === chapter.slug);
  const exercises = (seed?.exercises || []).map((ex) => ({
    orderIndex: ex.orderIndex,
    prompt: ex.prompt,
    hint: ex.hint,
    correctAnswer: ex.correctAnswer,
    explanation: ex.explanation,
  }));
  return {
    studySheet: buildChapterStudySheet(chapter, exercises),
    flashcards: buildChapterFlashcards(chapter, exercises),
  };
}

export const ChapterStudyDeck: React.FC<ChapterStudyDeckProps> = ({
  chapter,
  padClass,
  accentColor,
  isAuthenticated,
  backendAvailable,
  onRequireSignIn,
  apiFetch,
  onXpSynced,
  onPrintDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'course' | 'sheet' | 'flashcards'>('course');
  const [studySheet, setStudySheet] = useState<ChapterStudySheet | null>(null);
  const [flashcards, setFlashcards] = useState<ChapterFlashcardItem[]>([]);
  const [loadingDeck, setLoadingDeck] = useState<boolean>(false);

  // Flashcards interaction state
  const [cardFilter, setCardFilter] = useState<'all' | 'due'>('all');
  const [cardIdx, setCardIdx] = useState<number>(0);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [showCardHint, setShowCardHint] = useState<boolean>(false);
  const [savingRating, setSavingRating] = useState<boolean>(false);
  const [lastFeedback, setLastFeedback] = useState<{
    message: string;
    badgeTitles: string[];
  } | null>(null);

  // Study sheet copy confirmation
  const [copiedSheet, setCopiedSheet] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setCardIdx(0);
    setRevealed(false);
    setShowCardHint(false);
    setLastFeedback(null);
    setCopiedSheet(false);

    async function loadChapterDeck() {
      if (!backendAvailable) {
        const local = buildLocalDeck(chapter);
        if (mounted) {
          setStudySheet(local.studySheet);
          setFlashcards(local.flashcards);
        }
        return;
      }

      setLoadingDeck(true);
      try {
        const res = await apiFetch(`/api/chapters/${chapter.id}/flashcards`);
        if (!res.ok) throw new Error('HTTP_ERROR');
        const data = await res.json();
        if (!mounted) return;
        setStudySheet(data.studySheet || buildLocalDeck(chapter).studySheet);
        setFlashcards(
          Array.isArray(data.flashcards) ? data.flashcards : buildLocalDeck(chapter).flashcards
        );
      } catch {
        if (!mounted) return;
        const local = buildLocalDeck(chapter);
        setStudySheet(local.studySheet);
        setFlashcards(local.flashcards);
      } finally {
        if (mounted) setLoadingDeck(false);
      }
    }

    loadChapterDeck();
    return () => {
      mounted = false;
    };
  }, [chapter, backendAvailable, isAuthenticated, apiFetch]);

  const visibleCards = useMemo(() => {
    if (cardFilter === 'due') {
      const due = flashcards.filter((c) => c.sm2.isDue);
      return due.length > 0 ? due : flashcards;
    }
    return flashcards;
  }, [flashcards, cardFilter]);

  const safeIdx = Math.min(cardIdx, Math.max(0, visibleCards.length - 1));
  const currentCard = visibleCards[safeIdx] || null;
  const masteredCount = flashcards.filter((c) => c.sm2.isMastered).length;
  const dueCount = flashcards.filter((c) => c.sm2.isDue).length;

  const handleCopySheet = async () => {
    if (!studySheet) return;
    try {
      await navigator.clipboard.writeText(formatStudySheetAsText(studySheet));
      setCopiedSheet(true);
      window.setTimeout(() => setCopiedSheet(false), 2000);
    } catch {
      // Clipboard indisponible dans certains contextes iframe restreints
    }
  };

  const handleRateCard = async (rating: FlashcardRating) => {
    if (!currentCard || savingRating) return;
    setSavingRating(true);

    try {
      let updatedSm2 = currentCard.sm2;
      let xpEarned = 0;
      let badgeTitles: string[] = [];

      if (backendAvailable) {
        const res = await apiFetch(`/api/chapters/${chapter.id}/flashcards/review`, {
          method: 'POST',
          body: JSON.stringify({
            cardKey: currentCard.cardKey,
            rating,
            currentState: {
              easeFactor: currentCard.sm2.easeFactor,
              intervalDays: currentCard.sm2.intervalDays,
              repetitions: currentCard.sm2.repetitions,
            },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.sm2) updatedSm2 = data.sm2;
          xpEarned = Number(data.xpEarned) || 0;
          if (Array.isArray(data.newlyUnlockedBadges) && data.newlyUnlockedBadges.length > 0) {
            badgeTitles = data.newlyUnlockedBadges.map((b: BadgeItem) => b.title);
          }
          if (typeof data.userXp === 'number' && onXpSynced) {
            onXpSynced(data.userXp, data.newlyUnlockedBadges || []);
          }
        }
      } else {
        const next = computeSm2NextState(currentCard.sm2, rating);
        updatedSm2 = {
          easeFactor: next.easeFactor,
          intervalDays: next.intervalDays,
          repetitions: next.repetitions,
          lastRating: next.lastRating,
          nextReviewAt: next.nextReviewAt.toISOString(),
          lastReviewedAt: next.lastReviewedAt.toISOString(),
          isDue: next.isDue,
          isMastered: next.isMastered,
        };
      }

      setFlashcards((prev) =>
        prev.map((c) => (c.cardKey === currentCard.cardKey ? { ...c, sm2: updatedSm2 } : c))
      );

      const nextIntervalText = formatIntervalLabel(updatedSm2.intervalDays);
      setLastFeedback({
        message:
          xpEarned > 0
            ? `Prochaine révision dans ${nextIntervalText} · +${xpEarned} XP`
            : `Prochaine révision programmée dans ${nextIntervalText}`,
        badgeTitles,
      });

      setRevealed(false);
      setShowCardHint(false);
      if (visibleCards.length > 1) {
        setCardIdx((idx) => (idx + 1) % visibleCards.length);
      }
    } finally {
      setSavingRating(false);
    }
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${padClass} space-y-4`}
    >
      {/* Barre d'onglets : Cours | Fiche synthétique | Flashcards SM-2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('course')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'course'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cours</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'sheet'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Fiche synthétique</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flashcards')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'flashcards'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flashcards</span>
            {flashcards.length > 0 && (
              <span className="font-mono tabular-nums text-[11px] opacity-75">
                {masteredCount}/{flashcards.length}
              </span>
            )}
          </button>
        </div>

        <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md max-w-full truncate">
          {chapter.formulaDisplay}
        </span>
      </div>

      {/* ==================== ONGLET 1 : COURS ==================== */}
      {activeTab === 'course' && (
        <div className="space-y-2.5">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Fondements théoriques · {chapter.gradeLevel}
          </div>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {chapter.theoryContent}
          </p>
        </div>
      )}

      {/* ==================== ONGLET 2 : FICHE SYNTHÉTIQUE ==================== */}
      {activeTab === 'sheet' && (
        <div className="space-y-5">
          {loadingDeck || !studySheet ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
              Génération de la fiche de révision...
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Fiche de révision express · {studySheet.chapterTitle} ({studySheet.gradeLevel})
                </div>
                <div className="flex items-center gap-2">
                  {onPrintDocument && (
                    <button
                      type="button"
                      onClick={() => {
                        const subjLabel =
                          SUBJECTS.find((s) => s.id === (chapter.subject || 'mathematics'))
                            ?.label || 'Mathématiques';
                        onPrintDocument({
                          kind: 'study-sheet',
                          sheet: studySheet,
                          subjectLabel: subjLabel,
                          generatedAt: new Date().toLocaleDateString(document.documentElement.lang),
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer / PDF</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopySheet}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                  >
                    {copiedSheet ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Fiche copiée</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier la fiche</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bloc L'essentiel + Formule */}
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  L’essentiel à retenir
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {studySheet.summary}
                </p>
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 text-xs font-mono text-slate-800 dark:text-slate-200">
                  Formule / Règle clé : {studySheet.formulaDisplay}
                </div>
              </div>

              {/* Points clés numérotés */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Points essentiels du cours
                </div>
                <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {studySheet.keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="font-mono tabular-nums text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5 shrink-0">
                        0{i + 1}.
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Méthodes & Réflexes d'examen */}
              {studySheet.methodsAndTips.length > 0 && (
                <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Méthodes & réflexes d’application
                  </div>
                  <div className="space-y-2.5">
                    {studySheet.methodsAndTips.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs space-y-1"
                      >
                        <div className="font-semibold text-slate-900 dark:text-white">
                          Réflexe {idx + 1} · {item.tip}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ==================== ONGLET 3 : FLASHCARDS SM-2 ==================== */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          {loadingDeck ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
              Chargement des cartes de répétition espacée...
            </p>
          ) : !currentCard ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
              Aucune flashcard disponible pour ce chapitre.
            </p>
          ) : (
            <>
              {/* En-tête de progression SM-2 */}
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-slate-600 dark:text-slate-400 tabular-nums">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Carte {safeIdx + 1} / {visibleCards.length}
                  </span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>
                    {masteredCount > 1 ? `${masteredCount} maîtrisées` : `${masteredCount} maîtrisée`}
                  </span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>
                    {dueCount} à réviser aujourd’hui
                  </span>
                </div>

                <div className="inline-flex items-center gap-1 p-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setCardFilter('all');
                      setCardIdx(0);
                      setRevealed(false);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap cursor-pointer ${
                      cardFilter === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Toutes ({flashcards.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardFilter('due');
                      setCardIdx(0);
                      setRevealed(false);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap cursor-pointer ${
                      cardFilter === 'due'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    À réviser ({dueCount})
                  </button>
                </div>
              </div>

              {/* Carte Recto / Verso */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {currentCard.categoryLabel}
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>
                      {currentCard.sm2.isMastered
                        ? `Acquise (intervalle ${formatIntervalLabel(currentCard.sm2.intervalDays)})`
                        : 'En cours de mémorisation'}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {revealed ? 'Verso' : 'Recto'}
                  </span>
                </div>

                {/* Question (Recto) */}
                <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-white leading-relaxed">
                  {currentCard.front}
                </p>

                {/* Indice optionnel avant révélation */}
                {!revealed && currentCard.hint && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowCardHint((h) => !h)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{showCardHint ? 'Masquer l’indice' : 'Voir un indice'}</span>
                    </button>
                    {showCardHint && (
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                        {currentCard.hint}
                      </div>
                    )}
                  </div>
                )}

                {/* Réponse (Verso) ou Bouton Révéler */}
                {!revealed ? (
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCardIdx((i) => (i - 1 + visibleCards.length) % visibleCards.length);
                          setRevealed(false);
                          setShowCardHint(false);
                        }}
                        aria-label="Carte précédente"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCardIdx((i) => (i + 1) % visibleCards.length);
                          setRevealed(false);
                          setShowCardHint(false);
                        }}
                        aria-label="Carte suivante"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRevealed(true)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Afficher la réponse</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {currentCard.back}
                    </div>

                    {/* Auto-évaluation SM-2 avec prévisualisation exacte du prochain intervalle */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Comment avez-vous mémorisé cette carte ?</span>
                        <button
                          type="button"
                          onClick={() => setRevealed(false)}
                          className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Masquer</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {RATING_CONFIG.map((btn) => {
                          const preview = computeSm2NextState(currentCard.sm2, btn.rating);
                          return (
                            <button
                              key={btn.rating}
                              type="button"
                              disabled={savingRating}
                              onClick={() => handleRateCard(btn.rating)}
                              className={`px-3 py-2 rounded-lg border text-center transition-colors disabled:opacity-50 cursor-pointer ${btn.toneClass}`}
                            >
                              <div className="text-xs font-semibold">{btn.label}</div>
                              <div className="text-[11px] font-mono tabular-nums opacity-80 mt-0.5">
                                {formatIntervalLabel(preview.intervalDays)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback de planification SM-2 / XP / Badge */}
              {lastFeedback && (
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
                  <span>{lastFeedback.message}</span>
                  {lastFeedback.badgeTitles.length > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300">
                      <Brain className="w-3.5 h-3.5" />
                      Badge débloqué : {lastFeedback.badgeTitles.join(', ')}
                    </span>
                  )}
                </div>
              )}

              {!isAuthenticated && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Connectez-vous pour sauvegarder votre calendrier SM-2 en base, gagner +5 XP par carte et débloquer « Mémoire durable ».
                  </span>
                  <button
                    type="button"
                    onClick={onRequireSignIn}
                    className="font-semibold text-slate-900 dark:text-white underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Connexion Google
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
