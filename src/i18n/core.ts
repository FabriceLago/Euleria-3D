// Cœur i18n partagé serveur/navigateur.
// Les dictionnaires sont indexés par la phrase française d'origine : { "Programme": "Curriculum" }.
// Le français est la langue source : aucune entrée = texte affiché tel quel.

export type Lang = 'fr' | 'en' | 'nl';
export type Dict = Record<string, string>;

export const LANGS: Lang[] = ['fr', 'en', 'nl'];
export const LANG_LABELS: Record<Lang, string> = { fr: 'Français', en: 'English', nl: 'Nederlands' };

export function parseLang(value: unknown): Lang {
  return value === 'en' || value === 'nl' ? value : 'fr';
}

// Champs techniques ou saisis par les élèves : jamais traduits (identifiants, enums comparés dans le code)
export const SKIP_KEYS = new Set([
  'id', 'slug', 'subject', 'subjects', 'gradeLevel', 'scenePreset', 'exerciseType', 'status',
  'iconName', 'conditionType', 'roomSlug', 'uid', 'email', 'avatarUrl', 'authorAvatar',
  'displayName', 'authorName', 'hostName', 'content', 'themeMode', 'accentColor', 'layoutDensity',
  'code', 'examSlug', 'cardKey', 'lastRating', 'clientId', 'myClientId', 'difficulty', 'mode',
]);

/** Remplace récursivement chaque chaîne connue du dictionnaire (structure inchangée). */
export function translateDeep<T>(value: T, dict: Dict): T {
  return walk(value, dict) as T;
}

function walk(value: unknown, dict: Dict): unknown {
  if (typeof value === 'string') return dict[value] ?? value;
  if (Array.isArray(value)) return value.map((v) => walk(v, dict));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = SKIP_KEYS.has(k) ? v : walk(v, dict);
    return out;
  }
  return value;
}

/** Inverse traduction → français, pour corriger une réponse soumise dans la langue de l'élève. */
export function reverseDict(dict: Dict): Dict {
  const rev: Dict = {};
  // ponytail: si deux phrases FR ont la même traduction, la dernière gagne ; ajouter un contexte si ça arrive
  for (const [fr, tr] of Object.entries(dict)) rev[tr] = fr;
  return rev;
}

/** Clé de recherche d'un texte affiché : espaces fusionnés (comme le rendu JSX). */
export const normalizeText = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * Traducteur de textes affichés : correspondance exacte, sinon gabarits « {0} exercices » extraits du code.
 * Les morceaux variables sont eux-mêmes traduits s'ils sont connus (ex. nom de matière).
 */
export function makeTextTranslator(dict: Dict): (text: string) => string | null {
  const patterns: Array<[RegExp, string]> = [];
  for (const [fr, tr] of Object.entries(dict)) {
    if (!/\{\d+\}/.test(fr)) continue;
    const parts = fr.split(/\{\d+\}/).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (parts.join('').replace(/[^\p{L}]/gu, '').length < 3) continue; // gabarit sans texte fixe : trop générique
    patterns.push([new RegExp(`^${parts.join('([\\s\\S]+?)')}$`), tr]);
  }
  // ponytail: gabarits testés un par un ; indexer par premier mot si la liste dépasse quelques milliers
  const cache = new Map<string, string | null>();
  return (text) => {
    const key = normalizeText(text);
    if (!key) return null;
    if (cache.has(key)) return cache.get(key)!;
    let res: string | null = dict[key] ?? null;
    if (res == null)
      for (const [re, tr] of patterns) {
        const m = re.exec(key);
        if (m) {
          const vals = m.slice(1).map((v) => dict[v] ?? v);
          res = tr.replace(/\{(\d+)\}/g, (_, i) => vals[Number(i)] ?? '');
          break;
        }
      }
    if (cache.size > 5000) cache.clear();
    cache.set(key, res);
    return res;
  };
}

/** t('Bienvenue, {name}', { name }) → traduction avec variables, repli sur le français. */
export function format(dict: Dict, source: string, vars?: Record<string, string | number>): string {
  let s = dict[source] ?? source;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
