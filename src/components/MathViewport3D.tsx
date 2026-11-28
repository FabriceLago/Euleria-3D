import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Gamepad2, RotateCcw } from 'lucide-react';
import {
  CameraPreset,
  computeReadout,
  getParamMetadataForPreset,
  MathSceneEngine,
} from '../three/MathSceneEngine.ts';
import type { AccentColor, ThemeMode } from '../types/learning.ts';
import { getMissionsForPreset } from '../missions/catalog/index.ts';
import { computeStars, createRun, elapsedMs, missionXp, step, type RunEvent, type RunState } from '../missions/runner.ts';
import { attachGestures } from '../missions/gestures.ts';
import { ease, MissionFx } from '../missions/fx.ts';
import { isSoundOn, setSoundOn, sfx, vibrate } from '../missions/audio.ts';
import { loadBest, saveBest } from '../missions/progress.ts';
import { MissionHUD } from '../missions/MissionHUD.tsx';
import type { MissionDef, MissionParams, MissionResult, ParamKey } from '../missions/types.ts';

interface MathViewport3DProps {
  preset: string;
  chapterTitle: string;
  defaultParams: Record<string, number>;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  showGrid: boolean;
  heightClass?: string;
  /** Peut renvoyer les XP réellement accordées par le serveur, affichées à la place de l'estimation */
  onMissionComplete?: (r: MissionResult) => void | Promise<number | null>;
  onMissionFailed?: (r: MissionResult) => void;
  missionXpEnabled?: boolean;
}

const ACCENT_HEX_MAP: Record<AccentColor, string> = {
  indigo: '#4f46e5',
  emerald: '#059669',
  amber: '#d97706',
  sky: '#0284c7',
};

export const MathViewport3D: React.FC<MathViewport3DProps> = ({
  preset,
  chapterTitle,
  defaultParams,
  themeMode,
  accentColor,
  showGrid,
  heightClass = 'h-[440px] lg:h-[520px]',
  onMissionComplete,
  onMissionFailed,
  missionXpEnabled = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MathSceneEngine | null>(null);

  const presetKey = `${preset}:${defaultParams.a ?? 2}:${defaultParams.b ?? 3}:${defaultParams.c ?? 1}`;
  const [prevPresetKey, setPrevPresetKey] = useState<string>(presetKey);
  const [paramA, setParamA] = useState<number>(defaultParams.a ?? 2);
  const [paramB, setParamB] = useState<number>(defaultParams.b ?? 3);
  const [paramC, setParamC] = useState<number>(defaultParams.c ?? 1);
  const [explode, setExplode] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspective');
  const [dockOpen, setDockOpen] = useState<boolean>(true);
  const [contextLost, setContextLost] = useState<boolean>(false);

  // Synchronise immédiatement les valeurs par défaut avant le rendu 3D lors d'un changement de chapitre
  if (prevPresetKey !== presetKey) {
    setPrevPresetKey(presetKey);
    setParamA(defaultParams.a ?? 2);
    setParamB(defaultParams.b ?? 3);
    setParamC(defaultParams.c ?? 1);
    setExplode(0);
  }

  const paramMeta = useMemo(() => getParamMetadataForPreset(preset), [preset]);
  const accentHex = ACCENT_HEX_MAP[accentColor] || '#4f46e5';

  const readout = useMemo(
    () =>
      computeReadout({
        preset,
        a: paramA,
        b: paramB,
        c: paramC,
        explode,
        showGrid,
        darkMode: themeMode === 'dark',
        accentHex,
      }),
    [preset, paramA, paramB, paramC, explode, showGrid, themeMode, accentHex]
  );

  // Initialisation unique du moteur Three.js dans le conteneur ref isolé
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new MathSceneEngine(
      container,
      {
        preset,
        a: paramA,
        b: paramB,
        c: paramC,
        explode,
        showGrid,
        darkMode: themeMode === 'dark',
        accentHex,
      },
      (lost) => setContextLost(lost)
    );
    engineRef.current = engine;

    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(container);

    return () => {
      ro.disconnect();
      runToken.current++;
      if (demoTimer.current) clearTimeout(demoTimer.current);
      demoTimer.current = null;
      fxRef.current?.dispose();
      fxRef.current = null;
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mises à jour réactives sans recréer le canvas WebGL
  useEffect(() => {
    engineRef.current?.updateParams({
      preset,
      a: paramA,
      b: paramB,
      c: paramC,
      explode,
      showGrid,
      darkMode: themeMode === 'dark',
      accentHex,
    });
  }, [preset, paramA, paramB, paramC, explode, showGrid, themeMode, accentHex]);

  const handleCameraChange = (nextCam: CameraPreset) => {
    setCameraPreset(nextCam);
    engineRef.current?.setCameraPreset(nextCam);
  };

  const handleReset = () => {
    setParamA(defaultParams.a ?? 2);
    setParamB(defaultParams.b ?? 3);
    setParamC(defaultParams.c ?? 1);
    setExplode(0);
    handleCameraChange('perspective');
  };

  // ---- Missions 3D ----
  const missions = useMemo(() => getMissionsForPreset(preset), [preset]);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [active, setActive] = useState<MissionDef | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [best, setBest] = useState<Record<string, number>>(loadBest);
  const [soundOn, setSoundOnState] = useState(isSoundOn);
  const [showHint, setShowHint] = useState(false);
  const [clock, setClock] = useState(0);
  const fxRef = useRef<MissionFx | null>(null);
  const paramsRef = useRef<MissionParams>({ a: paramA, b: paramB, c: paramC });
  paramsRef.current = { a: paramA, b: paramB, c: paramC };
  const runRef = useRef<RunState | null>(null);
  runRef.current = run;
  const failReported = useRef(false);
  const demoTimer = useRef<number | null>(null);
  const runToken = useRef(0);
  const reducedMotion = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const setParam = useCallback((p: ParamKey, v: number) => {
    paramsRef.current = { ...paramsRef.current, [p]: v };
    if (p === 'a') setParamA(v);
    else if (p === 'b') setParamB(v);
    else setParamC(v);
  }, []);
  const applyStart = useCallback(
    (s: Partial<MissionParams>) => {
      (Object.keys(s) as ParamKey[]).forEach((k) => setParam(k, s[k] as number));
      setExplode(0);
    },
    [setParam]
  );
  const dispatch = useCallback((e: RunEvent) => setRun((r) => (r ? step(r, e) : r)), []);

  const missionResult = (m: MissionDef, stars: 0 | 1 | 2 | 3, timeMs: number): MissionResult => ({
    missionId: m.id, level: m.level, stars, timeMs, prompt: m.prompt, hint: m.hint,
  });

  const stopMission = useCallback(() => {
    runToken.current++;
    if (demoTimer.current) clearTimeout(demoTimer.current);
    demoTimer.current = null;
    fxRef.current?.dispose();
    fxRef.current = null;
    setActive(null);
    setRun(null);
    engineRef.current?.setOrbitEnabled(true);
  }, []);

  const startMission = (m: MissionDef) => {
    stopMission();
    runToken.current++;
    const engine = engineRef.current;
    if (!engine) return;
    const r = createRun(m);
    setActive(m);
    setRun(r);
    setShowHint(false);
    setClock(0);
    setGrantedXp(null);
    failReported.current = false;
    applyStart({ ...m.start, ...r.rounds[0].start });
    handleCameraChange('perspective');
    engine.setOrbitEnabled(false);
    fxRef.current = new MissionFx(engine.getFxContext(), reducedMotion, accentHex);
  };

  const handleSolved = (tag?: string) => {
    if (runRef.current?.phase !== 'playing') return;
    const fx = fxRef.current;
    fx?.punchZoom();
    fx?.bounce(tag ?? '');
    fx?.burst({ x: 0, y: 1.4, z: 0 });
    sfx.success();
    vibrate(30);
    dispatch({ type: 'solved', now: performance.now() });
  };

  const handleWrong = () => {
    const r = runRef.current;
    const m = active;
    if (!r || !m || r.phase !== 'playing') return;
    const rd = r.rounds[r.round];
    sfx.fail();
    vibrate([20, 40, 20]);
    dispatch({ type: 'wrong', now: performance.now() });
    if (!failReported.current) {
      failReported.current = true;
      onMissionFailed?.(missionResult(m, 0, elapsedMs(r, performance.now())));
    }
    const fx = fxRef.current;
    const token = runToken.current;
    const finish = () => {
      if (token !== runToken.current) return;
      fx?.clearHighlights();
      if (r.rounds.length === 1) applyStart(rd.start);
      dispatch({ type: 'demoDone', now: performance.now() });
    };
    if (rd.solution && fx) {
      // Démonstration : la scène s'anime jusqu'à la bonne réponse
      const from = { ...paramsRef.current };
      const keys = Object.keys(rd.solution) as ParamKey[];
      fx.tween(
        0.9,
        (k) => keys.forEach((p) => setParam(p, Math.round(from[p] + ((rd.solution![p] as number) - from[p]) * k))),
        ease.inOutSine,
        () => {
          demoTimer.current = window.setTimeout(finish, 900);
        }
      );
    } else if (rd.targetTag && fx) {
      fx.highlight(rd.targetTag, '#f59e0b');
      demoTimer.current = window.setTimeout(finish, 1400);
    } else finish();
  };

  // Chaque nouvelle manche repart de son état initial
  useEffect(() => {
    if (run && run.round > 0 && run.phase === 'playing') applyStart(run.rounds[run.round].start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.round]);

  // Gestes actifs seulement pendant le jeu
  useEffect(() => {
    const el = mountRef.current;
    const engine = engineRef.current;
    if (!el || !engine || !active || run?.phase !== 'playing') return;
    const controls = active.kind === 'adjust' ? active.controls ?? [] : [];
    const detach = attachGestures(
      el,
      controls,
      {
        getValue: (p) => paramsRef.current[p],
        onChange: (p, v) => {
          setParam(p, v);
          sfx.tick();
        },
        onTap: (tag) => {
          const r = runRef.current;
          if (!r) return;
          if (active.kind === 'identify') {
            if (tag === r.rounds[r.round].targetTag) handleSolved(tag);
            else handleWrong();
          } else fxRef.current?.bounce(tag);
        },
        onEnd: () => {
          const r = runRef.current;
          // Victoire automatique au niveau 1 seulement ; aux niveaux 2-3 l'élève valide
          if (active.level === 1 && active.kind === 'adjust' && r?.phase === 'playing' && r.rounds[r.round].goal?.(paramsRef.current)) handleSolved();
        },
        pick: (x, y) => engine.pick(x, y),
        dialCenter: () => {
          const n = engine.findByTag('normal');
          if (n) return engine.projectToScreen(n);
          const rect = el.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        },
      },
      active.kind === 'identify' ? engine.listTags() : []
    );
    // Entrée valide (comme le bouton « Valider ») pour les missions d'ajustement
    const onEnter = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || active.kind !== 'adjust') return;
      const r = runRef.current;
      if (r?.phase !== 'playing') return;
      e.preventDefault();
      if (r.rounds[r.round].goal?.(paramsRef.current)) handleSolved();
      else handleWrong();
    };
    el.addEventListener('keydown', onEnter);
    return () => {
      detach();
      el.removeEventListener('keydown', onEnter);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, run?.phase]);

  // Chrono
  useEffect(() => {
    if (!active?.timeLimitS || run?.phase !== 'playing') return;
    const id = window.setInterval(() => {
      const now = performance.now();
      setClock(now);
      const r = runRef.current;
      if (r && elapsedMs(r, now) >= active.timeLimitS! * 1000) dispatch({ type: 'timeUp', now });
    }, 250);
    return () => clearInterval(id);
  }, [active, run?.phase, dispatch]);

  // Pause : onglet masqué ou contexte WebGL perdu
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && runRef.current?.phase !== 'playing') return;
      dispatch({ type: document.hidden ? 'pause' : 'resume', now: performance.now() });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [dispatch]);
  useEffect(() => {
    if (contextLost && runRef.current?.phase !== 'playing') return;
    dispatch({ type: contextLost ? 'pause' : 'resume', now: performance.now() });
  }, [contextLost, dispatch]);

  // Fin de mission : étoiles, XP affichées, sauvegarde locale, résultat au parent
  const stars = run?.phase === 'done' ? computeStars(run) : null;
  const xp = active && stars ? missionXp(active.level, stars) : null;
  // XP réellement accordées par le serveur : seule valeur affichée (0 si plafond quotidien atteint)
  const [grantedXp, setGrantedXp] = useState<number | null>(null);
  useEffect(() => {
    if (!active || !run || run.phase !== 'done') return;
    const s = computeStars(run);
    for (let i = 0; i < s; i++) setTimeout(() => sfx.star(i), 250 + i * 250);
    if (s > 0) {
      setBest(saveBest(active.id, s));
      const token = runToken.current; // ignore une réponse arrivée après un « Rejouer » ou un changement de chapitre
      void Promise.resolve(onMissionComplete?.(missionResult(active, s, elapsedMs(run, performance.now())))).then(
        (granted) => {
          if (typeof granted === 'number' && token === runToken.current) setGrantedXp(granted);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.phase]);

  // Changement de chapitre : abandon propre, sans pénalité
  useEffect(() => {
    stopMission();
    setMissionsOpen(false);
  }, [preset, stopMission]);

  const timeLeftS =
    active?.timeLimitS && run && run.phase !== 'intro'
      ? active.timeLimitS - elapsedMs(run, clock || performance.now()) / 1000
      : null;

  return (
    <div
      className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 select-none`}
      style={{ touchAction: active ? 'none' : undefined }}
    >
      {/* Conteneur WebGL isolé */}
      <div
        ref={mountRef}
        className="w-full h-full"
        tabIndex={active ? 0 : -1}
        aria-label={active ? 'Scène de mission : utilise les flèches du clavier ou glisse' : undefined}
      />

      {/* En-tête minimaliste en haut à gauche (surface opaque/rgba sans backdrop-blur sur WebGL) */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-start justify-between gap-3">
        <div className="pointer-events-auto rounded-lg px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-sm max-w-md">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Modèle 3D · {chapterTitle}
          </div>
          <div className="mt-0.5 flex items-baseline gap-3">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {readout.primaryLabel} :{' '}
              <span className="font-mono tabular-nums">{readout.primaryValue}</span>
            </span>
          </div>
        </div>

        <div className="pointer-events-auto hidden sm:block rounded-lg px-3 py-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-sm text-right">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {readout.secondaryLabel}
          </div>
          <div className="text-xs font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
            {readout.secondaryValue}
          </div>
        </div>
      </div>

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-white p-6 text-center">
          <div>
            <p className="font-semibold">La 3D est momentanément interrompue</p>
            <p className="text-sm text-slate-300 mt-1">
              Le rendu 3D reprendra automatiquement dès la libération des ressources GPU.
            </p>
          </div>
        </div>
      )}

      {/* Dock inférieur repliable unifié (aucun panneau latéral obstruant le centre) */}
      {!missionsOpen && (
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-[820px] flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="mb-1.5 inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          {dockOpen ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Masquer les contrôles</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Contrôles 3D</span>
            </>
          )}
        </button>

        {dockOpen && (
          <div className="w-full rounded-xl p-3 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
              <label className="block">
                <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  <span className="truncate pr-2">{paramMeta.labelA}</span>
                  <span className="font-mono tabular-nums">{paramA}</span>
                </div>
                <input
                  type="range"
                  min={paramMeta.minA}
                  max={paramMeta.maxA}
                  step={paramMeta.stepA}
                  value={paramA}
                  onChange={(e) => setParamA(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </label>

              <label className="block">
                <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  <span className="truncate pr-2">{paramMeta.labelB}</span>
                  <span className="font-mono tabular-nums">{paramB}</span>
                </div>
                <input
                  type="range"
                  min={paramMeta.minB}
                  max={paramMeta.maxB}
                  step={paramMeta.stepB}
                  value={paramB}
                  onChange={(e) => setParamB(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </label>

              <label className="block">
                <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  <span className="truncate pr-2">{paramMeta.labelC}</span>
                  <span className="font-mono tabular-nums">{paramC}</span>
                </div>
                <input
                  type="range"
                  min={paramMeta.minC}
                  max={paramMeta.maxC}
                  step={paramMeta.stepC}
                  value={paramC}
                  onChange={(e) => setParamC(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </label>

              <label className="block">
                <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  <span>Vue éclatée</span>
                  <span className="font-mono tabular-nums">{Math.round(explode * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={explode}
                  onChange={(e) => setExplode(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </label>
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                {(
                  [
                    { id: 'perspective', label: 'Perspective' },
                    { id: 'iso', label: 'Isométrique' },
                    { id: 'front', label: 'Face' },
                    { id: 'top', label: 'Dessus' },
                  ] as const
                ).map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => handleCameraChange(cam.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      cameraPreset === cam.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {readout.formulaLive}
                </span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Réinitialiser</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {missions.length > 0 && !missionsOpen && (
        <button
          type="button"
          onClick={() => setMissionsOpen(true)}
          className="absolute top-16 right-3 z-10 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium px-3 py-2 min-h-[44px] shadow-lg cursor-pointer"
        >
          <Gamepad2 className="w-4 h-4" /> Missions
        </button>
      )}
      {missionsOpen && (
        <MissionHUD
          missions={missions}
          best={best}
          active={active}
          run={run}
          timeLeftS={timeLeftS}
          stars={stars}
          xp={missionXpEnabled ? grantedXp : null}
          showHint={showHint}
          soundOn={soundOn}
          onPick={startMission}
          onBegin={() => {
            dispatch({ type: 'begin', now: performance.now() });
            mountRef.current?.focus();
          }}
          onHint={() => {
            setShowHint(true);
            dispatch({ type: 'hint' });
          }}
          onValidate={() => {
            const r = runRef.current;
            if (r?.phase !== 'playing') return;
            if (r.rounds[r.round].goal?.(paramsRef.current)) handleSolved();
            else handleWrong();
          }}
          onRetry={() => active && startMission(active)}
          onQuit={() => {
            if (active) {
              stopMission();
              handleReset();
            } else setMissionsOpen(false);
          }}
          onToggleSound={() => {
            setSoundOn(!soundOn);
            setSoundOnState(!soundOn);
          }}
        />
      )}
    </div>
  );
};
