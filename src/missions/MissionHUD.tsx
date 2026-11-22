import React from 'react';
import { motion } from 'motion/react';
import { Lightbulb, Pause, Play, Star, Timer, Volume2, VolumeX, X } from 'lucide-react';
import type { MissionDef } from './types.ts';
import type { RunState } from './runner.ts';

const LEVEL_LABEL = { 1: 'Guidé', 2: 'Autonome', 3: 'Chrono' } as const;
const GESTURE_HELP: Record<string, string> = {
  'drag-x': 'Glisse horizontalement sur la scène',
  'drag-y': 'Glisse verticalement sur la scène',
  dial: 'Tourne autour du point d’incidence',
  tap: 'Touche un élément de la scène',
};

interface MissionHUDProps {
  missions: MissionDef[];
  best: Record<string, number>;
  active: MissionDef | null;
  run: RunState | null;
  timeLeftS: number | null;
  stars: number | null;
  xp: number | null;
  showHint: boolean;
  soundOn: boolean;
  onPick(m: MissionDef): void;
  onBegin(): void;
  onHint(): void;
  onValidate(): void;
  onRetry(): void;
  onQuit(): void;
  onToggleSound(): void;
}

const Stars: React.FC<{ n: number; animate?: boolean }> = ({ n, animate }) => (
  <span className="inline-flex gap-0.5" aria-label={`${n}/3`}>
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        initial={animate ? { scale: 0, rotate: -90 } : false}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: animate ? 0.25 + i * 0.25 : 0, type: 'spring', stiffness: 380, damping: 14 }}
      >
        <Star className={`w-5 h-5 ${i < n ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
      </motion.span>
    ))}
  </span>
);

const panel = 'rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-lg backdrop-blur';
const btn = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium min-h-[44px] cursor-pointer';

export const MissionHUD: React.FC<MissionHUDProps> = (p) => {
  const { active, run } = p;

  if (!active || !run) {
    return (
      <div className={`absolute inset-x-3 bottom-3 z-20 p-3 ${panel}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Missions 3D</h3>
          <button type="button" onClick={p.onQuit} className={`${btn} px-2`} aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {p.missions.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => p.onPick(m)}
              className="text-left rounded-lg border border-slate-200 dark:border-slate-700 p-3 hover:border-indigo-400 min-h-[44px] cursor-pointer"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400">{LEVEL_LABEL[m.level]}</div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">{m.prompt}</div>
              <Stars n={p.best[m.id] ?? 0} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const round = run.rounds[run.round];
  const gestures = active.kind === 'identify' ? ['tap'] : (active.controls ?? []).map((c) => c.gesture);

  return (
    <>
      <div className={`absolute inset-x-3 top-3 z-20 p-3 ${panel}`}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {LEVEL_LABEL[active.level]}
              {/* séparateur et compteur dans deux nœuds texte : « Manche {0}/{1} » reste traduisible */}
              {run.rounds.length > 1 && <span> · {`Manche ${Math.min(run.round + 1, run.rounds.length)}/${run.rounds.length}`}</span>}
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">{round.prompt}</p>
            {active.kind === 'identify' && run.phase === 'playing' && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Au clavier : touches numériques 1, 2, 3…</p>
            )}
            {active.level === 1 && run.phase === 'playing' && (
              <p className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
                {[...new Set(gestures)].map((g) => (
                  <span key={g} className="mr-2">{GESTURE_HELP[g]}</span>
                ))}
              </p>
            )}
            {p.showHint && <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{active.hint}</p>}
          </div>
          {p.timeLeftS !== null && (
            <span className="inline-flex items-center gap-1 font-mono tabular-nums text-sm text-slate-700 dark:text-slate-200">
              <Timer className="w-4 h-4" />
              {Math.max(0, Math.ceil(p.timeLeftS))} s
            </span>
          )}
          <button type="button" onClick={p.onToggleSound} className={`${btn} px-2`} aria-label={p.soundOn ? 'Couper le son' : 'Activer le son'}>
            {p.soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button type="button" onClick={p.onQuit} className={`${btn} px-2`} aria-label="Quitter la mission">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-3 bottom-3 z-20 flex flex-wrap justify-center gap-2">
        {run.phase === 'intro' && (
          <button type="button" onClick={p.onBegin} className={`${btn} bg-indigo-600 text-white`}>
            <Play className="w-4 h-4" /> C’est parti
          </button>
        )}
        {run.phase === 'playing' && (
          <>
            {!p.showHint && (
              <button type="button" onClick={p.onHint} className={`${btn} ${panel}`}>
                <Lightbulb className="w-4 h-4" /> Indice
              </button>
            )}
            {active.kind === 'adjust' && (
              <button type="button" onClick={p.onValidate} className={`${btn} bg-indigo-600 text-white`}>
                Valider
              </button>
            )}
          </>
        )}
        {run.phase === 'demo' && <div className={`${btn} ${panel} text-amber-700 dark:text-amber-300`}>Voici la bonne réponse</div>}
        {run.phase === 'paused' && (
          <div className={`${btn} ${panel}`}>
            <Pause className="w-4 h-4" /> En pause
          </div>
        )}
        {run.phase === 'done' && (
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`p-4 ${panel} text-center`}>
            {p.stars ? (
              <>
                <p className="text-base font-semibold text-slate-900 dark:text-white">Mission réussie !</p>
                <Stars n={p.stars} animate />
                {p.xp ? <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400">{`+${p.xp} XP`}</p> : null}
              </>
            ) : (
              <p className="text-base font-semibold text-slate-900 dark:text-white">Mission échouée — réessaie !</p>
            )}
            <div className="flex gap-2 justify-center mt-2">
              <button type="button" onClick={p.onRetry} className={`${btn} bg-indigo-600 text-white`}>Rejouer</button>
              <button type="button" onClick={p.onQuit} className={`${btn} border border-slate-300 dark:border-slate-600`}>Autres missions</button>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};
