// Adresses lisibles de l'app (audit 3.5) : partage d'un chapitre, bouton retour, favoris.
//   /                                   → programme (matière et classe par défaut)
//   /cours/<matière>/<classe>[/<chapitre>]
//   /quiz · /atelier-3d · /bilan · /entraide
// Module pur (sans React ni DOM) : testé par scripts/routes.check.ts.
import type { AppSection } from '../components/TopBar.tsx';
import type { GradeLevel, SubjectId } from '../types/learning.ts';

export const SUBJECT_SLUGS: Record<SubjectId, string> = {
  mathematics: 'maths',
  physics_chemistry: 'physique-chimie',
  svt: 'svt',
  history_geography: 'histoire-geo',
  french_philosophy: 'francais-philo',
  english_lv1: 'anglais',
};
const SLUG_TO_SUBJECT = Object.fromEntries(Object.entries(SUBJECT_SLUGS).map(([id, slug]) => [slug, id])) as Record<
  string,
  SubjectId
>;
const GRADES: GradeLevel[] = ['6e', '5e', '4e', '3e', '2nde', '1ere', 'terminale'];

const SECTION_PATHS: Record<Exclude<AppSection, 'curriculum'>, string> = {
  quiz: '/quiz',
  studio3d: '/atelier-3d',
  leaderboard: '/bilan',
  collaboration: '/entraide',
};
const PATH_TO_SECTION = Object.fromEntries(Object.entries(SECTION_PATHS).map(([s, p]) => [p, s])) as Record<
  string,
  AppSection
>;

export interface RouteState {
  section: AppSection;
  subject?: SubjectId;
  grade?: GradeLevel;
  chapterSlug?: string;
}

/** Expression unique des adresses servies par l'app (réutilisée par le serveur et le service worker).
 *  Matière et classe vérifiées ; le chapitre seulement par sa forme (inconnu → l'app revient à la classe). */
export const APP_ROUTE_PATTERN = new RegExp(
  `^/(?:$|index\\.html$|cours/(?:${Object.values(SUBJECT_SLUGS).join('|')})/(?:${GRADES.join('|')})(?:/[a-z0-9-]+)?/?$|(?:${Object.values(SECTION_PATHS)
    .map((p) => p.slice(1))
    .join('|')})/?$)`
);

export function toPath(state: RouteState): string {
  if (state.section !== 'curriculum') return SECTION_PATHS[state.section];
  if (!state.subject || !state.grade) return '/';
  const base = `/cours/${SUBJECT_SLUGS[state.subject]}/${state.grade}`;
  return state.chapterSlug ? `${base}/${state.chapterSlug}` : base;
}

/** Clic gauche simple : les autres (Ctrl/⌘, milieu, Maj) gardent le comportement natif du lien (nouvel onglet…). */
export function isPlainLeftClick(e: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/** Adresse → état ; null si l'adresse n'appartient pas à l'app. */
export function parsePath(pathname: string): RouteState | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path === '/' || path === '/index.html') return { section: 'curriculum' };
  if (PATH_TO_SECTION[path]) return { section: PATH_TO_SECTION[path] };
  const m = /^\/cours\/([a-z-]+)\/([a-z0-9]+)(?:\/([a-z0-9-]+))?$/.exec(path);
  if (!m) return null;
  const subject = SLUG_TO_SUBJECT[m[1]];
  const grade = GRADES.find((g) => g === m[2]);
  if (!subject || !grade) return null;
  return { section: 'curriculum', subject, grade, ...(m[3] ? { chapterSlug: m[3] } : {}) };
}
