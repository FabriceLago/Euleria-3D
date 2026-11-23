// Missions des scènes de français, philosophie et anglais (hors narratif et temps, voir narratif.ts / temps.ts).
// Les objectifs reprennent les valeurs affichées par computeReadout (MathSceneEngine).
import type { MissionDef, MissionParams } from '../types.ts';
import { pickN, r } from './helpers.ts';

type Lit = { prompt: string; sol: Partial<MissionParams> };
/** Manches dont la consigne est une phrase fixe ; l'objectif = atteindre exactement `sol`. */
const literalRounds = (items: Lit[], start: (it: Lit) => Partial<MissionParams>) => (rand: () => number) =>
  pickN(items, 4, rand).map((it) => ({
    prompt: it.prompt,
    start: start(it),
    solution: it.sol,
    goal: (p: MissionParams) => Object.entries(it.sol).every(([k, v]) => r(p[k as keyof MissionParams]) === v),
  }));
const other = (v: number) => (v === 1 ? 3 : 1);

// ---- Poésie : a = syllabes par vers, b = vers par strophe, c = rimes (1 AABB, 2 ABAB, 3 ABBA)
const sylControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 6, max: 12, step: 1, pxPerStep: 22 };
const versControl = { param: 'b' as const, gesture: 'drag-y' as const, min: 2, max: 6, step: 1, pxPerStep: 30 };
const poesieMissions: MissionDef[] = [
  {
    id: 'poesie-1', preset: 'fr_poetry_3d', level: 1, kind: 'adjust',
    prompt: 'Écris en alexandrins',
    hint: 'L’alexandrin compte 12 syllabes, coupées en deux hémistiches par la césure (6//6).',
    start: { a: 8, b: 4, c: 2 }, solution: { a: 12 },
    controls: [sylControl], goal: (p) => r(p.a) === 12,
  },
  {
    id: 'poesie-2', preset: 'fr_poetry_3d', level: 2, kind: 'adjust',
    prompt: 'Compose un quatrain de sonnet en rimes embrassées',
    hint: 'Un quatrain compte 4 vers ; les rimes embrassées suivent le schéma ABBA.',
    start: { a: 12, b: 2, c: 1 }, solution: { b: 4, c: 3 },
    controls: [
      { param: 'b', gesture: 'drag-x', min: 2, max: 6, step: 1, pxPerStep: 30 },
      { param: 'c', gesture: 'drag-y', min: 1, max: 3, step: 1, pxPerStep: 40 },
    ],
    goal: (p) => r(p.b) === 4 && r(p.c) === 3,
  },
  {
    id: 'poesie-3', preset: 'fr_poetry_3d', level: 3, kind: 'adjust',
    prompt: 'Strophes chrono',
    hint: 'Distique 2 vers, tercet 3, quatrain 4, sizain 6 ; octosyllabe 8, décasyllabe 10, alexandrin 12.',
    start: { a: 6, b: 5, c: 1 },
    controls: [sylControl, versControl],
    timeLimitS: 75,
    rounds: literalRounds(
      [
        { prompt: 'Un quatrain d’octosyllabes', sol: { a: 8, b: 4 } },
        { prompt: 'Un tercet de décasyllabes', sol: { a: 10, b: 3 } },
        { prompt: 'Un distique d’alexandrins', sol: { a: 12, b: 2 } },
        { prompt: 'Un sizain d’octosyllabes', sol: { a: 8, b: 6 } },
        { prompt: 'Un quatrain de décasyllabes', sol: { a: 10, b: 4 } },
      ],
      () => ({ a: 6, b: 5 })
    ),
  },
];

// ---- Théâtre : a = actes, b = scènes par acte, c = genre (1 comédie, 2 tragédie, 3 moderne)
const actesControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 1, max: 5, step: 1, pxPerStep: 30 };
const genreControl = { param: 'c' as const, gesture: 'drag-y' as const, min: 1, max: 3, step: 1, pxPerStep: 40 };
const theatreMissions: MissionDef[] = [
  {
    id: 'theatre-1', preset: 'fr_theater_3d', level: 1, kind: 'adjust',
    prompt: 'Donne à la tragédie classique ses actes',
    hint: 'La tragédie classique (Corneille, Racine) est construite en 5 actes.',
    start: { a: 2, b: 4, c: 2 }, solution: { a: 5 },
    controls: [actesControl], goal: (p) => r(p.c) === 2 && r(p.a) === 5,
  },
  {
    id: 'theatre-2', preset: 'fr_theater_3d', level: 2, kind: 'adjust',
    prompt: 'Les Précieuses ridicules de Molière : choisis le genre et le nombre d’actes',
    hint: 'C’est une comédie de Molière (1659) en un seul acte.',
    start: { a: 5, b: 3, c: 2 }, solution: { a: 1, c: 1 },
    controls: [actesControl, genreControl], goal: (p) => r(p.c) === 1 && r(p.a) === 1,
  },
  {
    id: 'theatre-3', preset: 'fr_theater_3d', level: 3, kind: 'adjust',
    prompt: 'Répertoire chrono',
    hint: 'Molière : comédies ; Racine : tragédies ; Beckett et Ionesco : théâtre moderne.',
    start: { a: 4, b: 3, c: 2 },
    controls: [actesControl, genreControl],
    timeLimitS: 75,
    rounds: literalRounds(
      [
        { prompt: 'Phèdre de Racine, en 5 actes', sol: { a: 5, c: 2 } },
        { prompt: 'Le Misanthrope de Molière, en 5 actes', sol: { a: 5, c: 1 } },
        { prompt: 'Les Précieuses ridicules de Molière, en 1 acte', sol: { a: 1, c: 1 } },
        { prompt: 'En attendant Godot de Beckett, en 2 actes', sol: { a: 2, c: 3 } },
        { prompt: 'Rhinocéros de Ionesco, en 3 actes', sol: { a: 3, c: 3 } },
      ],
      () => ({ a: 4, c: 2 })
    ),
  },
];

// ---- Syntaxe (FR) : a = constituants / propositions, b = mots, c = type (1 simple, 2 subordonnée, 3 complexe)
const propControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 2, max: 8, step: 1, pxPerStep: 24 };
const syntaxeMissions: MissionDef[] = [
  {
    id: 'syntaxe-1', preset: 'fr_syntax_3d', level: 1, kind: 'adjust',
    prompt: '« Je pense que tu as raison » : règle le type de phrase et le nombre de propositions',
    hint: 'Un verbe conjugué = une proposition : « je pense » + la subordonnée « que tu as raison ».',
    start: { a: 4, b: 6, c: 1 }, solution: { a: 2, c: 2 },
    controls: [propControl, { param: 'c', gesture: 'drag-y', min: 1, max: 3, step: 1, pxPerStep: 40 }],
    goal: (p) => r(p.c) === 2 && r(p.a) === 2,
  },
  {
    id: 'syntaxe-2', preset: 'fr_syntax_3d', level: 2, kind: 'adjust',
    prompt: '« Quand il pleut, je lis et j’écoute de la musique » : compte les propositions',
    hint: 'Trois verbes conjugués : pleut, lis, écoute.',
    start: { a: 2, b: 12, c: 3 }, solution: { a: 3 },
    controls: [propControl], goal: (p) => r(p.a) === 3,
  },
  {
    id: 'syntaxe-3', preset: 'fr_syntax_3d', level: 3, kind: 'adjust',
    prompt: 'Propositions chrono',
    hint: '1 verbe conjugué = 1 proposition.',
    start: { a: 8, b: 12, c: 2 },
    controls: [propControl],
    timeLimitS: 60,
    rounds: literalRounds(
      [
        { prompt: '« Je sais que tu viendras »', sol: { a: 2 } },
        { prompt: '« Il sourit quand elle chante »', sol: { a: 2 } },
        { prompt: '« Je crois qu’il partira dès qu’il pourra »', sol: { a: 3 } },
        { prompt: '« Elle lit, il écrit, nous écoutons »', sol: { a: 3 } },
        { prompt: '« Il dit qu’il sait où elle vit et qu’elle reviendra »', sol: { a: 4 } },
      ],
      () => ({ a: 8 })
    ),
  },
];

// ---- Conjugaison : a = groupes, b = temps, c = mode (1 indicatif, 2 subjonctif / conditionnel)
const tempsControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 3, max: 8, step: 1, pxPerStep: 26 };
const modeControl = { param: 'c' as const, gesture: 'drag-y' as const, min: 1, max: 2, step: 1, pxPerStep: 40 };
const conjugaisonMissions: MissionDef[] = [
  {
    id: 'conjugaison-1', preset: 'fr_grammar_3d', level: 1, kind: 'adjust',
    prompt: 'Règle le nombre de groupes de verbes en français',
    hint: '1er groupe (-er), 2e groupe (-ir avec -issons), 3e groupe (tous les autres).',
    start: { a: 1, b: 4, c: 1 }, solution: { a: 3 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 1, max: 4, step: 1, pxPerStep: 30 }],
    goal: (p) => r(p.a) === 3,
  },
  {
    id: 'conjugaison-2', preset: 'fr_grammar_3d', level: 2, kind: 'adjust',
    prompt: 'Affiche tous les temps de l’indicatif',
    hint: 'L’indicatif compte 8 temps : 4 simples et 4 composés.',
    start: { a: 3, b: 4, c: 2 }, solution: { b: 8, c: 1 },
    controls: [tempsControl, modeControl], goal: (p) => r(p.c) === 1 && r(p.b) === 8,
  },
  {
    id: 'conjugaison-3', preset: 'fr_grammar_3d', level: 3, kind: 'adjust',
    prompt: 'Modes et temps chrono',
    hint: 'Indicatif : 8 temps (4 simples + 4 composés) ; subjonctif : 4 ; conditionnel : 2.',
    start: { a: 3, b: 3, c: 1 },
    controls: [tempsControl, modeControl],
    timeLimitS: 60,
    rounds: literalRounds(
      [
        { prompt: 'Les temps du subjonctif', sol: { b: 4, c: 2 } },
        { prompt: 'Les temps de l’indicatif', sol: { b: 8, c: 1 } },
        { prompt: 'Les temps simples de l’indicatif', sol: { b: 4, c: 1 } },
        { prompt: 'Les temps du subjonctif et du conditionnel réunis', sol: { b: 6, c: 2 } },
      ],
      () => ({ b: 3, c: 1 })
    ),
  },
];

// ---- Rhétorique : a = axes, b = force persuasive (%), c = forme (1 figures, 2 plaidoyer, 3 dissertation) ; paragraphes = 2a
const axesControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 2, max: 6, step: 1, pxPerStep: 30 };
const rhetoriqueMissions: MissionDef[] = [
  {
    id: 'rhetorique-1', preset: 'fr_rhetoric_3d', level: 1, kind: 'adjust',
    prompt: 'Construis un plan dialectique',
    hint: 'Le plan dialectique compte 3 parties : thèse, antithèse, synthèse.',
    start: { a: 2, b: 60, c: 1 }, solution: { a: 3, c: 3 },
    controls: [axesControl, { param: 'c', gesture: 'drag-y', min: 1, max: 3, step: 1, pxPerStep: 40 }],
    goal: (p) => r(p.c) === 3 && r(p.a) === 3,
  },
  {
    id: 'rhetorique-2', preset: 'fr_rhetoric_3d', level: 2, kind: 'adjust',
    prompt: 'Plaidoyer : 4 arguments et une force persuasive de 90 %',
    hint: 'Un argument par axe ; la force se règle par pas de 5 %.',
    start: { a: 2, b: 50, c: 2 }, solution: { a: 4, b: 90 },
    controls: [axesControl, { param: 'b', gesture: 'drag-y', min: 40, max: 100, step: 5, pxPerStep: 14 }],
    goal: (p) => r(p.c) === 2 && r(p.a) === 4 && r(p.b) === 90,
  },
  {
    id: 'rhetorique-3', preset: 'fr_rhetoric_3d', level: 3, kind: 'adjust',
    prompt: 'Développement chrono',
    hint: 'Chaque axe compte 2 sous-parties : axes = paragraphes ÷ 2.',
    start: { a: 2, b: 70, c: 3 },
    controls: [axesControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([6, 8, 10, 12], 4, rand).map((n) => ({
        prompt: `Obtiens un développement de ${n} paragraphes`,
        start: { a: 2 },
        solution: { a: n / 2 },
        goal: (p: MissionParams) => r(p.a) * 2 === n,
      })),
  },
];

// ---- Philosophie : a = concepts, b = rigueur (%), c = domaine (1 conscience, 2 vérité, 3 État / devoir)
const domaineControl = { param: 'c' as const, gesture: 'drag-y' as const, min: 1, max: 3, step: 1, pxPerStep: 40 };
const philoMissions: MissionDef[] = [
  {
    id: 'philo-1', preset: 'fr_philo_3d', level: 1, kind: 'adjust',
    prompt: 'Descartes, « Je pense, donc je suis » : choisis le domaine',
    hint: 'Le cogito fonde la certitude de la conscience de soi.',
    start: { a: 2, b: 60, c: 3 }, solution: { c: 1 },
    controls: [domaineControl], goal: (p) => r(p.c) === 1,
  },
  {
    id: 'philo-2', preset: 'fr_philo_3d', level: 2, kind: 'adjust',
    prompt: 'Dissertation sur la vérité : articule thèse, antithèse et synthèse',
    hint: 'Domaine « Raison, Vérité & Réfutabilité » ; un concept par moment de la dialectique.',
    start: { a: 2, b: 70, c: 1 }, solution: { a: 3, c: 2 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 2, max: 5, step: 1, pxPerStep: 30 }, domaineControl],
    goal: (p) => r(p.c) === 2 && r(p.a) === 3,
  },
  {
    id: 'philo-3', preset: 'fr_philo_3d', level: 3, kind: 'adjust',
    prompt: 'Philosophes chrono',
    hint: 'Conscience, inconscient, liberté · raison, vérité · État, contrat social, devoir.',
    start: { a: 3, b: 70, c: 2 },
    controls: [domaineControl],
    timeLimitS: 60,
    rounds: literalRounds(
      [
        { prompt: 'Freud et l’inconscient', sol: { c: 1 } },
        { prompt: 'Sartre : « l’homme est condamné à être libre »', sol: { c: 1 } },
        { prompt: 'Popper et la réfutabilité', sol: { c: 2 } },
        { prompt: 'Descartes et le doute méthodique', sol: { c: 2 } },
        { prompt: 'Hobbes et le Léviathan', sol: { c: 3 } },
        { prompt: 'Kant et le devoir moral', sol: { c: 3 } },
      ],
      (it) => ({ c: other(it.sol.c!) })
    ),
  },
];

// ---- Syntaxe (EN) : a = blocs, b = mots, c = structure (1 WH-question, 2 comparatif, 3 passif / discours indirect)
const structControl = { param: 'c' as const, gesture: 'drag-y' as const, min: 1, max: 3, step: 1, pxPerStep: 40 };
const enSyntaxMissions: MissionDef[] = [
  {
    id: 'en-syntax-1', preset: 'en_syntax_3d', level: 1, kind: 'adjust',
    prompt: '« Where do you live? » : règle la structure et le nombre de blocs',
    hint: 'WH-word + auxiliaire do + sujet + verbe : 4 blocs.',
    start: { a: 3, b: 5, c: 2 }, solution: { a: 4, c: 1 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 3, max: 8, step: 1, pxPerStep: 26 }, structControl],
    goal: (p) => r(p.c) === 1 && r(p.a) === 4,
  },
  {
    id: 'en-syntax-2', preset: 'en_syntax_3d', level: 2, kind: 'adjust',
    prompt: '« She is taller than her brother » : règle la structure et le nombre de mots',
    hint: 'Adjectif court + -er + than : un comparatif de 6 mots.',
    start: { a: 5, b: 10, c: 1 }, solution: { b: 6, c: 2 },
    controls: [{ param: 'b', gesture: 'drag-x', min: 5, max: 16, step: 1, pxPerStep: 20 }, structControl],
    goal: (p) => r(p.c) === 2 && r(p.b) === 6,
  },
  {
    id: 'en-syntax-3', preset: 'en_syntax_3d', level: 3, kind: 'adjust',
    prompt: 'Structures chrono',
    hint: 'WH-question · comparatif (-er, more… than, as… as) · passif (be + participe) et discours indirect.',
    start: { a: 5, b: 8, c: 2 },
    controls: [structControl],
    timeLimitS: 60,
    rounds: literalRounds(
      [
        { prompt: '« What are you doing? »', sol: { c: 1 } },
        { prompt: '« Where did you go? »', sol: { c: 1 } },
        { prompt: '« This book is more interesting than that one. »', sol: { c: 2 } },
        { prompt: '« She runs as fast as her sister. »', sol: { c: 2 } },
        { prompt: '« The cake was eaten by the kids. »', sol: { c: 3 } },
        { prompt: '« He said he was tired. »', sol: { c: 3 } },
      ],
      (it) => ({ c: other(it.sol.c!) })
    ),
  },
];

// ---- Modaux : b = certitude (%) → MUST ≥ 85, SHOULD ≥ 65, MAY ≥ 45, sinon MIGHT ; c = niveau (3 = modaux au passé)
const BANDS = { MUST: [85, 100], SHOULD: [65, 84], MAY: [45, 64], MIGHT: [20, 44] } as const;
type Modal = keyof typeof BANDS;
const inBand = (p: MissionParams, m: Modal) => r(p.b) >= BANDS[m][0] && r(p.b) <= BANDS[m][1];
const certControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 20, max: 100, step: 5, pxPerStep: 12 };
const MODAL_SENTENCES: Array<[string, Modal]> = [
  ['« You must stop at a red light. »', 'MUST'],
  ['« You should see a doctor. »', 'SHOULD'],
  ['« You should revise for the test. »', 'SHOULD'],
  ['« It may rain tomorrow. »', 'MAY'],
  ['« She might come, but I doubt it. »', 'MIGHT'],
];
const MODAL_SOLUTION: Record<Modal, number> = { MUST: 90, SHOULD: 70, MAY: 50, MIGHT: 30 };
const modauxMissions: MissionDef[] = [
  {
    id: 'modaux-1', preset: 'en_modals_3d', level: 1, kind: 'adjust',
    prompt: '« You must wear a helmet » : place le curseur sur le bon modal',
    hint: 'MUST exprime l’obligation ou une quasi-certitude : tout en haut de l’échelle.',
    start: { a: 3, b: 30, c: 1 }, solution: { b: 90 },
    controls: [certControl], goal: (p) => inBand(p, 'MUST'),
  },
  {
    id: 'modaux-2', preset: 'en_modals_3d', level: 2, kind: 'adjust',
    prompt: '« He might have missed the bus » : règle le niveau et le modal',
    hint: 'Might + have + participe passé : une simple éventualité dans le passé (modaux au passé, B2).',
    start: { a: 4, b: 90, c: 1 }, solution: { b: 30, c: 3 },
    controls: [certControl, { param: 'c', gesture: 'drag-y', min: 1, max: 3, step: 1, pxPerStep: 40 }],
    goal: (p) => r(p.c) === 3 && inBand(p, 'MIGHT'),
  },
  {
    id: 'modaux-3', preset: 'en_modals_3d', level: 3, kind: 'adjust',
    prompt: 'Modaux chrono',
    hint: 'MUST obligation · SHOULD conseil · MAY probabilité · MIGHT éventualité.',
    start: { a: 4, b: 60, c: 1 },
    controls: [certControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN(MODAL_SENTENCES, 4, rand).map(([prompt, m]) => ({
        prompt,
        start: { b: m === 'MUST' ? 20 : 100 },
        solution: { b: MODAL_SOLUTION[m] },
        goal: (p: MissionParams) => inBand(p, m),
      })),
  },
];

// ---- Vocabulaire : a = champs lexicaux (6 expressions chacun), c = thème (1 routine, 2 environnement, 3 numérique)
const themeControl = { param: 'c' as const, gesture: 'drag-y' as const, min: 1, max: 3, step: 1, pxPerStep: 40 };
const vocabMissions: MissionDef[] = [
  {
    id: 'vocab-1', preset: 'en_vocab_3d', level: 1, kind: 'adjust',
    prompt: '« recycling, carbon footprint, renewable energy » : choisis le thème',
    hint: 'Ces mots parlent d’écologie : Environment & Sustainability.',
    start: { a: 4, b: 50, c: 1 }, solution: { c: 2 },
    controls: [themeControl], goal: (p) => r(p.c) === 2,
  },
  {
    id: 'vocab-2', preset: 'en_vocab_3d', level: 2, kind: 'adjust',
    prompt: 'Révise 48 expressions du thème numérique',
    hint: 'Chaque champ lexical regroupe 6 expressions : 48 ÷ 6.',
    start: { a: 4, b: 60, c: 1 }, solution: { a: 8, c: 3 },
    controls: [{ param: 'a', gesture: 'drag-x', min: 4, max: 12, step: 1, pxPerStep: 20 }, themeControl],
    goal: (p) => r(p.c) === 3 && r(p.a) === 8,
  },
  {
    id: 'vocab-3', preset: 'en_vocab_3d', level: 3, kind: 'adjust',
    prompt: 'Thèmes chrono',
    hint: 'Routine quotidienne · environnement · citoyenneté numérique.',
    start: { a: 6, b: 60, c: 2 },
    controls: [themeControl],
    timeLimitS: 60,
    rounds: literalRounds(
      [
        { prompt: '« wake up, have breakfast, commute »', sol: { c: 1 } },
        { prompt: '« go to bed, brush your teeth, get dressed »', sol: { c: 1 } },
        { prompt: '« pollution, biodiversity, global warming »', sol: { c: 2 } },
        { prompt: '« deforestation, recycling, renewable energy »', sol: { c: 2 } },
        { prompt: '« screen time, privacy, cyberbullying »', sol: { c: 3 } },
        { prompt: '« social media, password, fake news »', sol: { c: 3 } },
      ],
      (it) => ({ c: other(it.sol.c!) })
    ),
  },
];

// ---- Culture : b = latitude (° N, tolérance ± 1°), c = aire (1 Royaume-Uni, 2 États-Unis, 3 monde anglophone)
const latControl = { param: 'b' as const, gesture: 'drag-x' as const, min: 10, max: 60, step: 1, pxPerStep: 6 };
const nearLat = (p: MissionParams, lat: number) => Math.abs(r(p.b) - lat) <= 1;
const CITIES: Array<[string, number, number]> = [
  ['Règle la latitude d’Édimbourg', 56, 1],
  ['Règle la latitude de Belfast', 55, 1],
  ['Règle la latitude de Washington D.C.', 39, 2],
  ['Règle la latitude d’Ottawa', 45, 3],
  ['Règle la latitude de New Delhi', 29, 3],
];
const cultureMissions: MissionDef[] = [
  {
    id: 'culture-1', preset: 'en_culture_3d', level: 1, kind: 'adjust',
    prompt: 'Place-toi à la latitude de Londres (≈ 51,5° N)',
    hint: 'Londres est plus au nord que toutes les villes des États-Unis contigus.',
    start: { a: 4, b: 30, c: 1 }, solution: { b: 51 },
    controls: [latControl], goal: (p) => r(p.c) === 1 && nearLat(p, 51.5),
  },
  {
    id: 'culture-2', preset: 'en_culture_3d', level: 2, kind: 'adjust',
    prompt: 'Passe aux États-Unis et règle la latitude de New York (≈ 41° N)',
    hint: 'New York est à 40,7° N, à peu près à la latitude de Madrid.',
    start: { a: 4, b: 55, c: 1 }, solution: { b: 41, c: 2 },
    controls: [latControl, { param: 'c', gesture: 'drag-y', min: 1, max: 3, step: 1, pxPerStep: 40 }],
    goal: (p) => r(p.c) === 2 && nearLat(p, 41),
  },
  {
    id: 'culture-3', preset: 'en_culture_3d', level: 3, kind: 'adjust',
    prompt: 'Latitudes chrono',
    hint: 'Édimbourg 56° · Belfast 55° · Ottawa 45° · Washington 39° · New Delhi 29° (± 1°).',
    start: { a: 5, b: 10, c: 3 },
    controls: [latControl],
    timeLimitS: 75,
    rounds: (rand) =>
      pickN(CITIES, 4, rand).map(([prompt, lat, area]) => ({
        prompt,
        start: { b: 10, c: area },
        solution: { b: lat },
        goal: (p: MissionParams) => nearLat(p, lat),
      })),
  },
];

// ---- Essay : a = parties, c = format (1 essay, 2 Bac B2) ; mots ≈ 60 + 70 × (parties − 2)
const partsControl = { param: 'a' as const, gesture: 'drag-x' as const, min: 3, max: 6, step: 1, pxPerStep: 30 };
const words = (parts: number) => 60 + (parts - 2) * 70;
const essayMissions: MissionDef[] = [
  {
    id: 'essay-1', preset: 'en_essay_3d', level: 1, kind: 'adjust',
    prompt: 'Essay en introduction, 3 paragraphes de développement et conclusion',
    hint: 'Intro + 3 body paragraphs + conclusion = 5 parties.',
    start: { a: 3, b: 70, c: 1 }, solution: { a: 5 },
    controls: [partsControl], goal: (p) => r(p.a) === 5,
  },
  {
    id: 'essay-2', preset: 'en_essay_3d', level: 2, kind: 'adjust',
    prompt: 'Bac B2 : vise un essay d’environ 200 mots',
    hint: 'Chaque partie ajoute environ 70 mots : 4 parties ≈ 200 mots.',
    start: { a: 6, b: 70, c: 1 }, solution: { a: 4, c: 2 },
    controls: [partsControl, { param: 'c', gesture: 'drag-y', min: 1, max: 2, step: 1, pxPerStep: 40 }],
    goal: (p) => r(p.c) === 2 && r(p.a) === 4,
  },
  {
    id: 'essay-3', preset: 'en_essay_3d', level: 3, kind: 'adjust',
    prompt: 'Longueur chrono',
    hint: '≈ 60 + 70 × (parties − 2) mots.',
    start: { a: 3, b: 70, c: 2 },
    controls: [partsControl],
    timeLimitS: 60,
    rounds: (rand) =>
      pickN([3, 4, 5, 6], 4, rand).map((n) => ({
        prompt: `Vise un essay d’environ ${words(n)} mots`,
        start: { a: n === 3 ? 6 : 3 },
        solution: { a: n },
        goal: (p: MissionParams) => r(p.a) === n,
      })),
  },
];

export const languesMissions: MissionDef[] = [
  ...poesieMissions,
  ...theatreMissions,
  ...syntaxeMissions,
  ...conjugaisonMissions,
  ...rhetoriqueMissions,
  ...philoMissions,
  ...enSyntaxMissions,
  ...modauxMissions,
  ...vocabMissions,
  ...cultureMissions,
  ...essayMissions,
];
