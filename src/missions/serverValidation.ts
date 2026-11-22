// Validation d'un résultat de mission côté serveur : les XP viennent du catalogue, jamais du client.
import { findMission } from './catalog/index.ts';
import { missionXp } from './runner.ts';

const MIN_HUMAN_MS = 300; // ponytail: plancher anti-robot minimal (un tap rapide au niveau 1 est légitime) ; plafonner par mission et par jour si un abus apparaît

export function validateMissionCompletion(body: unknown): { ok: true; xp: number } | { ok: false } {
  if (!body || typeof body !== 'object') return { ok: false };
  const { missionId, stars, timeMs } = body as Record<string, unknown>;
  const mission = typeof missionId === 'string' ? findMission(missionId) : null;
  if (!mission || !Number.isInteger(stars) || (stars as number) < 1 || (stars as number) > 3) return { ok: false };
  if (typeof timeMs !== 'number' || !(timeMs >= MIN_HUMAN_MS)) return { ok: false };
  return { ok: true, xp: missionXp(mission.level, stars as number) };
}
