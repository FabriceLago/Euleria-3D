import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Box } from 'lucide-react';
import { lazyWithReload } from '../utils/lazyWithReload.ts';
import type { MathViewport3D as MathViewport3DType } from './MathViewport3D.tsx';

// La 3D (Three.js, ~600 Ko) n'est chargée qu'à l'affichage d'une scène, pas au démarrage (audit 3.8).
const MathViewport3D = lazyWithReload(() => import('./MathViewport3D.tsx').then((m) => ({ default: m.MathViewport3D })));

type Props = React.ComponentProps<typeof MathViewport3DType>;
const DEFAULT_HEIGHT = 'h-[440px] lg:h-[520px]';

let webglSupport: boolean | null = null;
/** WebGL 2 disponible ? Three.js r163+ n'accepte plus WebGL 1. Testé une fois ; le contexte d'essai est libéré aussitôt. */
function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    webglSupport = Boolean(gl);
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

const frame = 'relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950';

export const Viewport3D: React.FC<Props> = (props) => {
  const height = props.heightClass ?? DEFAULT_HEIGHT;
  // Sur téléphone la scène est sous la ligne de flottaison : elle démarre seulement à l'approche de l'écran,
  // pour ne pas bloquer le chargement de la page (Three.js + compilation des shaders)
  const holderRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = holderRef.current;
    if (near || !el) return;
    if (!('IntersectionObserver' in window)) return setNear(true);
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setNear(true), {
      rootMargin: '200px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  const placeholder = (
    <div ref={holderRef} className={`${frame} ${height} flex items-center justify-center text-sm text-slate-500 dark:text-slate-400`}>
      Chargement de la scène 3D…
    </div>
  );

  // Sans WebGL (vieil appareil, accélération désactivée) : le chapitre reste utilisable sans la scène
  if (!hasWebGL()) {
    return (
      <div className={`${frame} p-6 flex flex-col items-center justify-center text-center gap-2`} role="note">
        <Box className="w-8 h-8 text-slate-400" aria-hidden="true" />
        <p className="font-semibold text-slate-900 dark:text-white">La 3D n’est pas disponible sur cet appareil</p>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
          Modèle 3D · {props.chapterTitle}. Le cours, la fiche, les flashcards et les exercices juste en dessous restent
          disponibles.
        </p>
      </div>
    );
  }

  if (!near) return placeholder;
  return (
    <Suspense fallback={placeholder}>
      <MathViewport3D {...props} />
    </Suspense>
  );
};
