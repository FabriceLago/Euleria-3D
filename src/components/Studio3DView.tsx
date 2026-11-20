import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { GRADE_LEVELS } from '../db/curriculumData.ts';
import type { AccentColor, ChapterItem, GradeLevel, ThemeMode } from '../types/learning.ts';
import { MathViewport3D } from './MathViewport3D.tsx';

interface Studio3DViewProps {
  chapters: ChapterItem[];
  initialGrade: GradeLevel;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  showGrid: boolean;
  onOpenChapterInCourse: (chapter: ChapterItem) => void;
}

export const Studio3DView: React.FC<Studio3DViewProps> = ({
  chapters,
  initialGrade,
  themeMode,
  accentColor,
  showGrid,
  onOpenChapterInCourse,
}) => {
  const [grade, setGrade] = useState<GradeLevel>(initialGrade);
  const gradeChapters = useMemo(
    () => chapters.filter((c) => c.gradeLevel === grade),
    [chapters, grade]
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const activeChapter = useMemo(() => {
    const found = chapters.find((c) => c.id === selectedId);
    if (found && found.gradeLevel === grade) return found;
    return gradeChapters[0] || chapters[0] || null;
  }, [chapters, gradeChapters, selectedId, grade]);

  if (!activeChapter) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Rendu WebGL PBR · Manipulation libre des modèles mathématiques
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Atelier de géométrie & modélisation 3D
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {GRADE_LEVELS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGrade(g.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                grade === g.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sélecteur de modèle du niveau */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {gradeChapters.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setSelectedId(ch.id)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                ch.id === activeChapter.id
                  ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {ch.title}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onOpenChapterInCourse(activeChapter)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Passer au quiz de ce chapitre</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <MathViewport3D
        preset={activeChapter.scenePreset}
        chapterTitle={activeChapter.title}
        defaultParams={activeChapter.defaultParams}
        themeMode={themeMode}
        accentColor={accentColor}
        showGrid={showGrid}
        heightClass="h-[540px] lg:h-[620px]"
      />
    </div>
  );
};
