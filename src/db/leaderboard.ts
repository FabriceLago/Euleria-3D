// Classement public : forme exposée et pseudonymes. Module pur (sans base) pour être testable.
// Règle : un élève n'apparaît que s'il l'a choisi, et seulement sous pseudonyme + XP + rang.

/** Seule forme publique d'un élève dans le classement : rien qui permette de l'identifier. */
export interface PublicLeaderboardEntry {
  rank: number;
  pseudonym: string;
  xp: number;
}

/** Lignes déjà triées par XP décroissant → entrées publiques numérotées (aucun autre champ ne passe). */
export function toPublicLeaderboard(rows: Array<{ pseudonym: string | null; xp: number }>): PublicLeaderboardEntry[] {
  return rows
    .filter((r): r is { pseudonym: string; xp: number } => typeof r.pseudonym === 'string' && r.pseudonym.length > 0)
    .map((r, i) => ({ rank: i + 1, pseudonym: r.pseudonym, xp: r.xp }));
}

// Pseudonymes tirés au sort, jamais saisis : pas de vrai nom ni d'insulte possible. 12 × 10 × 90 = 10 800 combinaisons.
const ANIMALS = ['Renard', 'Hibou', 'Lynx', 'Castor', 'Dauphin', 'Faucon', 'Koala', 'Panda', 'Pingouin', 'Tigre', 'Loup', 'Héron'];
const ADJECTIVES = ['Curieux', 'Rapide', 'Malin', 'Agile', 'Brillant', 'Calme', 'Vif', 'Futé', 'Patient', 'Joyeux'];

export function makePseudonym(rand: () => number = Math.random): string {
  const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];
  return `${pick(ANIMALS)} ${pick(ADJECTIVES)} ${10 + Math.floor(rand() * 90)}`;
}
