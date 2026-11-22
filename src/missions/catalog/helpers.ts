export const r = Math.round;

/** n éléments distincts tirés avec la fonction aléatoire fournie (testable avec une graine). */
export function pickN<T>(items: T[], n: number, rand: () => number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}
