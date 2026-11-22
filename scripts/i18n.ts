// Outil de traduction : recense toutes les phrases françaises à traduire et mesure la couverture.
//   npx tsx scripts/i18n.ts status                  → couverture EN / NL par groupe
//   npx tsx scripts/i18n.ts missing en <groupe>     → JSON { "phrase FR": "" } à traduire
//   npx tsx scripts/i18n.ts merge en <fichier.json> → fusionne des traductions dans locales/en.json
import fs from 'fs';
import path from 'path';
import {
  ALL_SEED_BADGES,
  ALL_SEED_CHAPTERS,
  ALL_SEED_ROOMS,
  GRADE_LEVELS,
  SUBJECTS,
} from '../src/db/curriculumData.ts';
import { GRAND_ORAL_CRITERIA, GRAND_ORAL_TOPICS, SPECIALTY_MODULES } from '../src/data/grandOralData.ts';
import { MOCK_EXAM_PRESETS, SUBJECT_DISPLAY_LABELS } from '../src/services/mockExamEngine.ts';
import { normalizeText, SKIP_KEYS, type Dict } from '../src/i18n/core.ts';
import { parse } from '@babel/parser';

const LOCALES = path.resolve('src/i18n/locales');

function collect(value: unknown, out: Set<string>) {
  if (typeof value === 'string') {
    if (/\p{L}{2,}/u.test(value)) out.add(value); // ignore nombres, formules sans mots
  } else if (Array.isArray(value)) value.forEach((v) => collect(v, out));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) if (!SKIP_KEYS.has(k)) collect(v, out);
}

// Attributs JSX techniques : jamais affichés
const SKIP_ATTRS = /^(className|key|id|type|href|src|to|role|name|htmlFor|rel|target|method|accept|autoComplete|inputMode|lang|style|viewBox|d|fill|stroke|data-.*)$/;

/** Texte lisible par un humain (exclut classes Tailwind, chemins, identifiants, clés techniques). */
function isHuman(s: string): boolean {
  if (!/\p{L}{2,}/u.test(s) || s.length > 600) return false;
  if (/^(https?:|\/|\.\.?\/|#|@)/.test(s) || /^[\w.-]+\.(tsx?|json|css|png|svg|js)$/.test(s)) return false;
  const tokens = s.split(/\s+/);
  if (tokens.every((w) => /^[a-z0-9:!\-/[\].%#()_,>&*=]+$/.test(w)) && tokens.some((w) => /[-:[]/.test(w))) return false; // classes CSS
  if (tokens.length === 1) {
    if (/^[a-z][a-zA-Z0-9_]*$/.test(s) || /^[A-Z0-9_]+$/.test(s) || (/^[\w-]+$/.test(s) && s.includes('-'))) return false; // identifiants
    return /^[A-ZÀ-Ý]/.test(s) || /[À-ÿ]/.test(s);
  }
  return true;
}

/**
 * Textes d'interface du code source : texte JSX, chaînes et gabarits `${x}` (→ « {0} »).
 * Clés normalisées comme le traducteur DOM (espaces fusionnés) pour correspondre aux nœuds texte.
 */
function uiStrings(): Set<string> {
  const out = new Set<string>();
  // texte JSX = toujours affiché : un mot seul en minuscules (« exercices ») compte aussi
  const add = (s: string, jsx = false) => {
    const k = normalizeText(s);
    if (isHuman(k) || (jsx && /^\p{L}{3,}$/u.test(k))) out.add(k);
  };
  const KEEP_TS = new Set(['TSAsExpression', 'TSNonNullExpression', 'TSSatisfiesExpression']);
  const visit = (node: any, parent: any) => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'ImportDeclaration' || (node.type.startsWith('TS') && !KEEP_TS.has(node.type))) return;
    if (node.type === 'JSXAttribute' && SKIP_ATTRS.test(String(node.name?.name?.name ?? node.name?.name ?? ''))) return;
    if (node.type === 'CallExpression' && node.callee?.object?.name === 'console') return;
    if (node.type === 'JSXText') add(node.value, true);
    else if (node.type === 'StringLiteral' && !(parent?.type === 'ObjectProperty' && parent.key === node)) add(node.value);
    else if (node.type === 'TemplateLiteral')
      add(node.quasis.map((q: any, i: number) => (i ? `{${i - 1}}` : '') + (q.value.cooked ?? '')).join(''));
    for (const [key, child] of Object.entries(node)) {
      if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
      if (Array.isArray(child)) child.forEach((c) => visit(c, node));
      else if (child && typeof child === 'object') visit(child, node);
    }
  };
  const walk = (dir: string) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(f.name) && !/Data\.ts$|\.d\.ts$/.test(f.name)) {
        const ast = parse(fs.readFileSync(p, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'], errorRecovery: true });
        visit(ast.program, null);
      }
    }
  };
  walk(path.resolve('src'));
  return out;
}

function groups(): Record<string, Set<string>> {
  const g: Record<string, Set<string>> = {};
  const add = (name: string, v: unknown) => collect(v, (g[name] ??= new Set()));
  for (const ch of ALL_SEED_CHAPTERS) add(`cours-${ch.subject || 'mathematics'}`, ch);
  add('meta', [SUBJECTS, GRADE_LEVELS, ALL_SEED_BADGES, ALL_SEED_ROOMS, MOCK_EXAM_PRESETS, SUBJECT_DISPLAY_LABELS]);
  add('grand-oral', [GRAND_ORAL_CRITERIA, GRAND_ORAL_TOPICS, SPECIALTY_MODULES]);
  g.ui = uiStrings();
  return g;
}

const readDict = (lang: string): Dict => JSON.parse(fs.readFileSync(path.join(LOCALES, `${lang}.json`), 'utf8'));

const [cmd, lang, arg] = process.argv.slice(2);
const all = groups();

if (cmd === 'status') {
  const dicts = { en: readDict('en'), nl: readDict('nl') };
  console.log('groupe'.padEnd(28), 'phrases', '   EN', '   NL');
  for (const [name, set] of Object.entries(all)) {
    const pct = (d: Dict) => `${Math.round((100 * [...set].filter((s) => d[s]).length) / Math.max(1, set.size))}%`.padStart(5);
    console.log(name.padEnd(28), String(set.size).padStart(7), pct(dicts.en), pct(dicts.nl));
  }
} else if (cmd === 'missing' && lang) {
  const d = readDict(lang);
  const pick = arg ? all[arg] : new Set(Object.values(all).flatMap((s) => [...s]));
  if (!pick) throw new Error(`Groupe inconnu : ${arg}. Groupes : ${Object.keys(all).join(', ')}`);
  console.log(JSON.stringify(Object.fromEntries([...pick].filter((s) => !d[s]).map((s) => [s, ''])), null, 1));
} else if (cmd === 'merge' && lang && arg) {
  const d = readDict(lang);
  const incoming: Dict = JSON.parse(fs.readFileSync(arg, 'utf8'));
  let n = 0;
  for (const [fr, tr] of Object.entries(incoming)) if (typeof tr === 'string' && tr.trim()) (d[fr] = tr), n++;
  fs.writeFileSync(path.join(LOCALES, `${lang}.json`), JSON.stringify(d, null, 1) + '\n');
  console.log(`${n} traductions fusionnées dans ${lang}.json (${Object.keys(d).length} au total)`);
} else {
  console.log('Usage : status | missing <en|nl> [groupe] | merge <en|nl> <fichier.json>');
}
