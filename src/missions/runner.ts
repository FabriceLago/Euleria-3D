// Machine à états d'une mission : pure, sans DOM ni Three.js (testable en Node).
import type { MissionDef, MissionRound } from './types.ts';

export type Phase = 'intro' | 'playing' | 'demo' | 'paused' | 'done' | 'aborted';

export interface RunState {
  phase: Phase;
  rounds: MissionRound[];
  round: number;
  roundsWon: number;
  failures: number;
  hintUsed: boolean;
  elapsedMs: number;
  resumedAt: number | null;
  pausedFrom: Phase | null;
}

export type RunEvent =
  | { type: 'begin' | 'solved' | 'wrong' | 'demoDone' | 'pause' | 'resume' | 'timeUp'; now: number }
  | { type: 'hint' }
  | { type: 'abort' };

export const MAX_MISSION_XP = 40;
const LEVEL_XP = [20, 30, 40] as const;
const STAR_FACTOR = [0, 0.5, 0.75, 1] as const;

export function createRun(m: MissionDef, rand: () => number = Math.random): RunState {
  const rounds = m.rounds
    ? m.rounds(rand)
    : [{ prompt: m.prompt, start: m.start, goal: m.goal, targetTag: m.targetTag, solution: m.solution }];
  return { phase: 'intro', rounds, round: 0, roundsWon: 0, failures: 0, hintUsed: false, elapsedMs: 0, resumedAt: null, pausedFrom: null };
}

export const elapsedMs = (s: RunState, now: number) => s.elapsedMs + (s.resumedAt !== null ? now - s.resumedAt : 0);
const freeze = (s: RunState, now: number): RunState => ({ ...s, elapsedMs: elapsedMs(s, now), resumedAt: null });

/** Passe à la manche suivante, ou termine la mission après la dernière. */
const advance = (s: RunState, now: number): RunState =>
  s.round + 1 >= s.rounds.length ? { ...freeze(s, now), phase: 'done' } : { ...s, phase: 'playing', round: s.round + 1 };

export function step(s: RunState, e: RunEvent): RunState {
  switch (e.type) {
    case 'begin':
      return s.phase === 'intro' ? { ...s, phase: 'playing', resumedAt: e.now } : s;
    case 'solved':
      return s.phase === 'playing' ? advance({ ...s, roundsWon: s.roundsWon + 1 }, e.now) : s;
    case 'wrong':
      return s.phase === 'playing' ? { ...s, phase: 'demo', failures: s.failures + 1 } : s;
    case 'demoDone':
      if (s.phase !== 'demo') return s;
      // mission simple : on réessaie la même manche ; chrono : manche suivante
      return s.rounds.length === 1 ? { ...s, phase: 'playing' } : advance(s, e.now);
    case 'hint':
      return { ...s, hintUsed: true };
    case 'pause':
      return s.phase === 'playing' || s.phase === 'demo' ? { ...freeze(s, e.now), phase: 'paused', pausedFrom: s.phase } : s;
    case 'resume':
      return s.phase === 'paused' ? { ...s, phase: s.pausedFrom ?? 'playing', pausedFrom: null, resumedAt: e.now } : s;
    case 'timeUp':
      return s.phase === 'playing' || s.phase === 'demo' ? { ...freeze(s, e.now), phase: 'done' } : s;
    case 'abort':
      return { ...s, phase: 'aborted' };
  }
}

export function computeStars(s: RunState): 0 | 1 | 2 | 3 {
  if (s.roundsWon === 0) return 0;
  if (s.rounds.length > 1) {
    const ratio = s.roundsWon / s.rounds.length;
    return ratio === 1 && !s.hintUsed ? 3 : ratio >= 0.6 ? 2 : 1;
  }
  if (s.failures === 0 && !s.hintUsed) return 3;
  return s.failures <= 1 ? 2 : 1;
}

export function missionXp(level: 1 | 2 | 3, stars: number): number {
  const base = LEVEL_XP[level - 1];
  if (base === undefined || !Number.isFinite(stars)) return 0;
  const st = Math.max(0, Math.min(3, Math.round(stars)));
  return Math.min(MAX_MISSION_XP, Math.round(base * STAR_FACTOR[st]));
}
