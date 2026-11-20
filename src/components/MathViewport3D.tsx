import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import {
  CameraPreset,
  computeReadout,
  getParamMetadataForPreset,
  MathSceneEngine,
} from '../three/MathSceneEngine.ts';
import type { AccentColor, ThemeMode } from '../types/learning.ts';

interface MathViewport3DProps {
  preset: string;
  chapterTitle: string;
  defaultParams: Record<string, number>;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  showGrid: boolean;
  heightClass?: string;
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
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MathSceneEngine | null>(null);

  const [paramA, setParamA] = useState<number>(defaultParams.a ?? 2);
  const [paramB, setParamB] = useState<number>(defaultParams.b ?? 3);
  const [paramC, setParamC] = useState<number>(defaultParams.c ?? 1);
  const [explode, setExplode] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspective');
  const [dockOpen, setDockOpen] = useState<boolean>(true);
  const [contextLost, setContextLost] = useState<boolean>(false);

  // Synchronise les valeurs par défaut quand on change de chapitre
  useEffect(() => {
    setParamA(defaultParams.a ?? 2);
    setParamB(defaultParams.b ?? 3);
    setParamC(defaultParams.c ?? 1);
    setExplode(0);
  }, [preset, defaultParams]);

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

  return (
    <div
      className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 select-none`}
    >
      {/* Conteneur WebGL isolé */}
      <div ref={mountRef} className="w-full h-full" />

      {/* En-tête minimaliste en haut à gauche (surface opaque/rgba sans backdrop-blur sur WebGL) */}
      <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-start justify-between gap-3">
        <div className="pointer-events-auto rounded-lg px-3.5 py-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-sm max-w-md">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Simulation WebGL 3D · {chapterTitle}
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
            <p className="font-semibold">Contexte WebGL momentanément suspendu</p>
            <p className="text-sm text-slate-300 mt-1">
              Le rendu 3D reprendra automatiquement dès la libération des ressources GPU.
            </p>
          </div>
        </div>
      )}

      {/* Dock inférieur repliable unifié (aucun panneau latéral obstruant le centre) */}
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
    </div>
  );
};
