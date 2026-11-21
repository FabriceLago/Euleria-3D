import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Code2,
  Pause,
  Play,
  Printer,
  RotateCcw,
  Scale,
  XCircle,
} from 'lucide-react';
import {
  GRAND_ORAL_CRITERIA,
  GRAND_ORAL_TOPICS,
  SPECIALTY_MODULES,
  type GrandOralTopic,
} from '../data/grandOralData.ts';
import type { AccentColor } from '../types/learning.ts';
import type { PrintableDocument } from '../utils/printExport.tsx';

interface GrandOralViewProps {
  accentColor: AccentColor;
  onPrintDocument: (doc: PrintableDocument) => void;
}

const ACCENT_BG_MAP: Record<AccentColor, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
  sky: 'bg-sky-600 hover:bg-sky-700 text-white',
};

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const GrandOralView: React.FC<GrandOralViewProps> = ({
  accentColor,
  onPrintDocument,
}) => {
  const [subTab, setSubTab] = useState<'oral' | 'specialties'>('oral');

  // Grand Oral simulator state
  const [pairFilter, setPairFilter] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(GRAND_ORAL_TOPICS[0].id);
  const [phase, setPhase] = useState<'expose' | 'jury'>('expose');
  const [remainingSec, setRemainingSec] = useState<number>(600);
  const [running, setRunning] = useState<boolean>(false);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const c of GRAND_ORAL_CRITERIA) init[c.id] = 3;
    return init;
  });

  // Specialty modules state (NSI & SES)
  const [specialtyFilter, setSpecialtyFilter] = useState<'nsi' | 'ses'>('nsi');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(SPECIALTY_MODULES[0].id);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [checkedModules, setCheckedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          if (phase === 'expose') {
            setPhase('jury');
            return 600;
          }
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phase]);

  const filteredTopics = useMemo(() => {
    if (pairFilter === 'all') return GRAND_ORAL_TOPICS;
    return GRAND_ORAL_TOPICS.filter((t) => t.pairCategory === pairFilter);
  }, [pairFilter]);

  const activeTopic: GrandOralTopic =
    filteredTopics.find((t) => t.id === selectedTopicId) ||
    filteredTopics[0] ||
    GRAND_ORAL_TOPICS[0];

  const totalScoreOn20 = useMemo(
    () => GRAND_ORAL_CRITERIA.reduce((sum, c) => sum + (rubricScores[c.id] ?? 0), 0),
    [rubricScores]
  );

  const filteredModules = useMemo(
    () => SPECIALTY_MODULES.filter((m) => m.specialty === specialtyFilter),
    [specialtyFilter]
  );

  const activeModule =
    filteredModules.find((m) => m.id === selectedModuleId) ||
    filteredModules[0] ||
    SPECIALTY_MODULES[0];

  const elapsedPct = Math.round(((600 - remainingSec) / 600) * 100);

  const handlePrintBrief = () => {
    onPrintDocument({
      kind: 'grand-oral-brief',
      generatedAt: new Date().toLocaleDateString('fr-FR'),
      brief: {
        title: activeTopic.title,
        specialtiesLabel: activeTopic.specialties,
        problemStatement: activeTopic.problemStatement,
        hook: activeTopic.hook,
        outline: activeTopic.outline.map((o) => ({
          part: `${o.part} (${o.duration})`,
          details: o.details,
        })),
        keyConcepts: activeTopic.keyConcepts,
        juryQuestions: activeTopic.juryQuestions,
        selfEvalScoreOn20: totalScoreOn20,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Sous-navigation Atelier Grand Oral / Spécialités NSI & SES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Lycée (1ʳᵉ & Terminale) · Préparation officielle & Enseignements de spécialité
          </div>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {subTab === 'oral'
              ? 'Atelier Grand Oral — Simulateur 10 + 10 min & Sujets croisés'
              : 'Modules Spécialités Lycée — NSI & SES'}
          </h2>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 self-start">
          <button
            type="button"
            onClick={() => setSubTab('oral')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'oral'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Grand Oral (10 + 10 min)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('specialties')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              subTab === 'specialties'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Spécialités NSI & SES
          </button>
        </div>
      </div>

      {subTab === 'oral' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Colonne gauche : Banque de sujets croisés + fiche détaillée */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'Tous les binômes' },
                  { id: 'maths-nsi', label: 'Maths · NSI' },
                  { id: 'maths-physique', label: 'Maths · Physique' },
                  { id: 'svt-physique', label: 'SVT · Sciences' },
                  { id: 'ses-maths', label: 'SES · Maths' },
                  { id: 'philo-humanites', label: 'Philo · NSI' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPairFilter(f.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    pairFilter === f.id
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTopics.map((topic) => {
                const active = topic.id === activeTopic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/25'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {topic.specialties}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                      {topic.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Fiche détaillée du sujet sélectionné */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {activeTopic.specialties} · Fiche de préparation structurée
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {activeTopic.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handlePrintBrief}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Exporter PDF / Imprimer</span>
                </button>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Problématique retenue
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {activeTopic.problemStatement}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                  <strong>Accroche :</strong> {activeTopic.hook}
                </p>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
                  Plan chronométré de l’exposé (10 minutes)
                </div>
                <div className="space-y-2.5">
                  {activeTopic.outline.map((step, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                        <span>{step.part}</span>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {step.duration}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {step.details}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Notions du programme à mobiliser
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  {activeTopic.keyConcepts.join(' · ')}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Questions d’entraînement du jury (phase d’échange 10 min)
                </div>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 list-disc list-inside">
                  {activeTopic.juryQuestions.map((q, i) => (
                    <li key={i} className="leading-relaxed">
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Colonne droite : Minuterie 10 + 10 min + Grille officielle d'auto-évaluation */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Simulateur chronométré officiel</span>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {phase === 'expose' ? 'Phase 1 / 2' : 'Phase 2 / 2'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setPhase('expose');
                    setRemainingSec(600);
                    setRunning(false);
                  }}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    phase === 'expose'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Exposé · 10 min
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhase('jury');
                    setRemainingSec(600);
                    setRunning(false);
                  }}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    phase === 'jury'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Échange jury · 10 min
                </button>
              </div>

              <div className="py-4 text-center">
                <div
                  className={`text-5xl font-bold font-mono tabular-nums tracking-tight ${
                    remainingSec <= 60
                      ? 'text-red-600 dark:text-red-400'
                      : remainingSec <= 180
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatTimer(remainingSec)}
                </div>
                <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {phase === 'expose'
                    ? remainingSec > 420
                      ? 'Introduction & problématique'
                      : remainingSec > 120
                        ? 'Développement argumenté (sans support)'
                        : 'Conclusion et ouverture conseillées'
                    : 'Répondez aux questions du jury et approfondissez vos limites'}
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${elapsedPct}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRunning((r) => !r)}
                  className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${ACCENT_BG_MAP[accentColor]}`}
                >
                  {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{running ? 'Mettre en pause' : 'Démarrer le chrono'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRunning(false);
                    setRemainingSec(600);
                  }}
                  aria-label="Réinitialiser le minuteur"
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grille officielle d'auto-évaluation sur 20 */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Grille d’auto-évaluation du jury
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Barème officiel sur 20 points (5 critères × 4 pts)
                  </p>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {totalScoreOn20}/20
                </div>
              </div>

              <div className="space-y-4">
                {GRAND_ORAL_CRITERIA.map((crit) => {
                  const val = rubricScores[crit.id] ?? 0;
                  return (
                    <div key={crit.id} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {crit.label}
                        </span>
                        <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400">
                          {val}/{crit.maxPoints}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {crit.description}
                      </p>
                      <div className="grid grid-cols-5 gap-1 pt-0.5">
                        {[0, 1, 2, 3, 4].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() =>
                              setRubricScores((prev) => ({ ...prev, [crit.id]: score }))
                            }
                            className={`py-1 text-xs font-mono tabular-nums rounded border transition-colors cursor-pointer ${
                              val === score
                                ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Onglet Spécialités Lycée : NSI & SES */
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSpecialtyFilter('nsi');
                setSelectedModuleId(SPECIALTY_MODULES.find((m) => m.specialty === 'nsi')!.id);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                specialtyFilter === 'nsi'
                  ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>NSI · Algorithmique, Python, SQL & Réseaux</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSpecialtyFilter('ses');
                setSelectedModuleId(SPECIALTY_MODULES.find((m) => m.specialty === 'ses')!.id);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                specialtyFilter === 'ses'
                  ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>SES · Économie, Sociologie & Climat</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 space-y-2.5">
              {filteredModules.map((mod, idx) => {
                const active = mod.id === activeModule.id;
                const solved =
                  checkedModules[mod.id] && selectedAnswers[mod.id] === mod.exercise.correctAnswer;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setSelectedModuleId(mod.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/25'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Module {idx + 1} · {mod.grade === '1ere' ? 'Première' : 'Terminale'}
                      </span>
                      {solved && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Validé
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {mod.title}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Spécialité {activeModule.specialty.toUpperCase()} ·{' '}
                  {activeModule.grade === '1ere' ? 'Première' : 'Terminale'}
                </div>
                <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {activeModule.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeModule.summary}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-4 overflow-x-auto">
                <div className="text-[11px] font-medium text-slate-400 mb-2">
                  {activeModule.keySnippetTitle}
                </div>
                <pre className="text-xs font-mono leading-relaxed whitespace-pre">
                  {activeModule.keySnippet}
                </pre>
              </div>

              <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
                {activeModule.bulletPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>

              {/* Mini-exercice corrigé immédiatement */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Vérification rapide — Exercice type Bac
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {activeModule.exercise.prompt}
                </p>
                <div className="space-y-2">
                  {activeModule.exercise.options.map((opt) => {
                    const picked = selectedAnswers[activeModule.id] === opt;
                    const checked = Boolean(checkedModules[activeModule.id]);
                    const isRight = opt === activeModule.exercise.correctAnswer;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setSelectedAnswers((prev) => ({ ...prev, [activeModule.id]: opt }));
                          setCheckedModules((prev) => ({ ...prev, [activeModule.id]: true }));
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm rounded-lg border transition-colors cursor-pointer ${
                          checked && isRight
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-medium'
                            : checked && picked && !isRight
                              ? 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                              : picked
                                ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                                : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {checkedModules[activeModule.id] && (
                  <div
                    className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                      selectedAnswers[activeModule.id] === activeModule.exercise.correctAnswer
                        ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                        : 'border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold mb-1">
                      {selectedAnswers[activeModule.id] === activeModule.exercise.correctAnswer ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Bonne réponse</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Réponse attendue : {activeModule.exercise.correctAnswer}</span>
                        </>
                      )}
                    </div>
                    <p>{activeModule.exercise.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
