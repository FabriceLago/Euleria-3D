// Âge minimum pour créer un compte : 15 ans pour tous (âge du consentement numérique en France ;
// 13 ans en Belgique, mais le contenu suit le programme français : on applique la règle la plus protectrice).
export const MIN_ACCOUNT_AGE = 15;

/**
 * Âge minimum atteint ? Calculé à partir du mois et de l'année de naissance déclarés, jamais stockés.
 * Sans le jour, on ne compte l'anniversaire comme passé qu'à partir du mois suivant (règle prudente).
 */
export function hasMinimumAge(birthYear: number, birthMonth: number, now: Date = new Date()): boolean {
  if (!Number.isInteger(birthYear) || !Number.isInteger(birthMonth) || birthMonth < 1 || birthMonth > 12) return false;
  const year = now.getUTCFullYear();
  if (birthYear < 1900 || birthYear > year) return false;
  const month = now.getUTCMonth() + 1;
  const age = year - birthYear - (month > birthMonth ? 0 : 1);
  return age >= MIN_ACCOUNT_AGE;
}
