// Gestes de mission : calculs purs + adaptateur Pointer Events (souris, doigt et stylet, même code).
import type { MissionControl, ParamKey } from './types.ts';

export function snap(v: number, min: number, max: number, step: number): number {
  const s = Math.round((v - min) / step) * step + min;
  return Math.min(max, Math.max(min, Number(s.toFixed(6))));
}

export function dragValue(c: MissionControl, startValue: number, dxPx: number, dyPx: number): number {
  const delta = c.gesture === 'drag-x' ? dxPx : -dyPx;
  return snap(startValue + (delta / (c.pxPerStep ?? 24)) * c.step, c.min, c.max, c.step);
}

/** Angle (°) entre la verticale montante passant par le centre et le pointeur : l'angle d'incidence par rapport à la normale. */
export function dialValue(c: MissionControl, cx: number, cy: number, x: number, y: number): number {
  const deg = (Math.atan2(Math.abs(x - cx), cy - y) * 180) / Math.PI;
  return snap(deg, c.min, c.max, c.step);
}

export function tapValue(c: MissionControl, tag: string): number | null {
  if (c.gesture !== 'tap' || !c.tagPrefix || !tag.startsWith(c.tagPrefix)) return null;
  const n = Number(tag.slice(c.tagPrefix.length));
  return Number.isFinite(n) ? snap(n + (c.offset ?? 0), c.min, c.max, c.step) : null;
}

/** Touche chiffre '1'..'9' → étiquette d'identification correspondante (ou null). */
export function digitTag(key: string, tags: string[]): string | null {
  if (!/^[1-9]$/.test(key)) return null;
  return tags[Number(key) - 1] ?? null;
}

const KEYS: Partial<Record<MissionControl['gesture'], Record<string, number>>> = {
  'drag-x': { ArrowRight: 1, ArrowLeft: -1 },
  dial: { ArrowRight: 1, ArrowLeft: -1 },
  'drag-y': { ArrowUp: 1, ArrowDown: -1 },
};

export function keyValue(c: MissionControl, current: number, key: string): number | null {
  const inc = KEYS[c.gesture]?.[key];
  return inc === undefined ? null : snap(current + inc * c.step, c.min, c.max, c.step);
}

export interface GestureHandlers {
  getValue(p: ParamKey): number;
  onChange(p: ParamKey, v: number): void;
  onTap(tag: string): void;
  onEnd(): void;
  pick(x: number, y: number): string | null;
  dialCenter(): { x: number; y: number };
}

const TAP_SLOP_PX = 6;

/** Branche les gestes sur l'élément ; renvoie la fonction de nettoyage. */
export function attachGestures(el: HTMLElement, controls: MissionControl[], h: GestureHandlers, identifyTags: string[] = []): () => void {
  let drag: { id: number; x: number; y: number; tag: string | null; start: Record<ParamKey, number>; moved: boolean } | null = null;

  const down = (e: PointerEvent) => {
    if (drag) return;
    el.setPointerCapture?.(e.pointerId);
    drag = {
      id: e.pointerId, x: e.clientX, y: e.clientY, tag: h.pick(e.clientX, e.clientY), moved: false,
      start: { a: h.getValue('a'), b: h.getValue('b'), c: h.getValue('c') },
    };
  };

  const move = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < TAP_SLOP_PX) return;
    drag.moved = true;
    for (const c of controls) {
      let v: number | null = null;
      if (c.gesture === 'drag-x' || c.gesture === 'drag-y') v = dragValue(c, drag.start[c.param], dx, dy);
      else if (c.gesture === 'dial') {
        const o = h.dialCenter();
        v = dialValue(c, o.x, o.y, e.clientX, e.clientY);
      }
      if (v !== null && v !== h.getValue(c.param)) h.onChange(c.param, v);
    }
  };

  const up = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    el.releasePointerCapture?.(e.pointerId);
    if (!d.moved && d.tag) {
      for (const c of controls) {
        const v = tapValue(c, d.tag);
        if (v !== null && v !== h.getValue(c.param)) h.onChange(c.param, v);
      }
      h.onTap(d.tag);
    }
    h.onEnd();
  };

  // Annulation navigateur (ex. reprise du doigt) : aucun tap, aucune valeur modifiée.
  const cancel = (e: PointerEvent) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag = null;
    el.releasePointerCapture?.(e.pointerId);
  };

  const key = (e: KeyboardEvent) => {
    const tag = digitTag(e.key, identifyTags);
    if (tag !== null) {
      e.preventDefault();
      h.onTap(tag);
      h.onEnd();
      return;
    }
    for (const c of controls) {
      const v = keyValue(c, h.getValue(c.param), e.key);
      if (v !== null) {
        e.preventDefault();
        if (v !== h.getValue(c.param)) h.onChange(c.param, v);
        h.onEnd();
        return;
      }
    }
  };

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('lostpointercapture', cancel);
  el.addEventListener('keydown', key);
  return () => {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', cancel);
    el.removeEventListener('lostpointercapture', cancel);
    el.removeEventListener('keydown', key);
  };
}
