// Sons synthétisés (Web Audio) : aucun fichier à charger, fonctionne hors ligne. Volume volontairement bas.
const KEY = 'euleria.sound';
let ctx: AudioContext | null = null;
let soundOn = (() => {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
})();

export const isSoundOn = () => soundOn;
export function setSoundOn(on: boolean) {
  soundOn = on;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // stockage indisponible : le choix vaut pour la session
  }
}

function beep(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.04, delay = 0) {
  if (!soundOn || typeof window === 'undefined' || !('AudioContext' in window)) return;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

export const sfx = {
  tick: () => beep(880, 0.03, 'triangle', 0.02),
  success: () => [523, 659, 784].forEach((f, i) => beep(f, 0.14, 'sine', 0.05, i * 0.09)),
  star: (i: number) => beep(660 + i * 140, 0.12, 'sine', 0.05),
  fail: () => beep(220, 0.2, 'sine', 0.035),
};

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined') navigator.vibrate?.(pattern);
}
