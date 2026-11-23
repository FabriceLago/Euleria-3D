import {
  PHYSICS_BADGES,
  PHYSICS_CHAPTERS,
  PHYSICS_GRADE_FOCUS,
  PHYSICS_ROOMS,
} from './physicsCurriculumData.ts';
import {
  SVT_BADGES,
  SVT_CHAPTERS,
  SVT_GRADE_FOCUS,
  SVT_ROOMS,
} from './svtCurriculumData.ts';
import {
  HG_BADGES,
  HG_CHAPTERS,
  HG_GRADE_FOCUS,
  HG_ROOMS,
} from './hgCurriculumData.ts';
import {
  FRENCH_BADGES,
  FRENCH_CHAPTERS,
  FRENCH_GRADE_FOCUS,
  FRENCH_ROOMS,
} from './frenchCurriculumData.ts';
import {
  ENGLISH_BADGES,
  ENGLISH_CHAPTERS,
  ENGLISH_GRADE_FOCUS,
  ENGLISH_ROOMS,
} from './englishCurriculumData.ts';

export type SubjectKey =
  | 'mathematics'
  | 'physics_chemistry'
  | 'svt'
  | 'history_geography'
  | 'french_philosophy'
  | 'english_lv1';

export const SUBJECTS: Array<{
  id: SubjectKey;
  label: string;
  shortLabel: string;
  tagline: string;
}> = [
  {
    id: 'mathematics',
    label: 'Mathématiques Appliquées',
    shortLabel: 'Mathématiques',
    tagline: 'Géométrie 3D, analyse, probabilités et prédiction bayésienne',
  },
  {
    id: 'physics_chemistry',
    label: 'Physique-Chimie',
    shortLabel: 'Physique-Chimie',
    tagline: 'Matière, molécules, circuits, optique, mécanique et nucléaire',
  },
  {
    id: 'svt',
    label: 'Sciences de la Vie et de la Terre (SVT)',
    shortLabel: 'SVT',
    tagline: 'Cellules, ADN, tectonique, écosystèmes, immunologie, neurosciences & climat',
  },
  {
    id: 'history_geography',
    label: 'Histoire-Géographie',
    shortLabel: 'Histoire-Géo',
    tagline: 'Antiquité, Moyen Âge, 1789, Guerres mondiales, métropolisation & géopolitique',
  },
  {
    id: 'french_philosophy',
    label: 'Français, Littérature & Philosophie',
    shortLabel: 'Français & Philo',
    tagline: 'Grammaire, versification, théâtre, mouvements littéraires, dissertation & philosophie',
  },
  {
    id: 'english_lv1',
    label: 'Anglais (LV1)',
    shortLabel: 'Anglais LV1',
    tagline: 'Temps verbaux, syntaxe, modaux, culture UK/US, linking words & axes du Bac B2',
  },
];

export {
  ENGLISH_GRADE_FOCUS,
  FRENCH_GRADE_FOCUS,
  HG_GRADE_FOCUS,
  PHYSICS_GRADE_FOCUS,
  SVT_GRADE_FOCUS,
};

export interface SeedBadge {
  slug: string;
  title: string;
  description: string;
  iconName: string;
  xpThreshold: number;
  conditionType: 'xp' | 'chapters_completed' | 'prediction_master' | 'collaboration';
}

export interface SeedRoom {
  slug: string;
  name: string;
  gradeLevel: string;
  topic: string;
}

export interface SeedExercise {
  orderIndex: number;
  exerciseType: 'quiz' | 'practice';
  prompt: string;
  hint: string;
  options: string[] | null;
  correctAnswer: string;
  numericTolerance: number;
  explanation: string;
  xpValue: number;
}

export interface SeedChapter {
  slug: string;
  subject?: SubjectKey;
  gradeLevel: '6e' | '5e' | '4e' | '3e' | '2nde' | '1ere' | 'terminale';
  orderIndex: number;
  title: string;
  subtitle: string;
  summary: string;
  theoryContent: string;
  formulaDisplay: string;
  scenePreset:
    | 'fractions_3d'
    | 'volumes_6e'
    | 'symetrie_3d'
    | 'proportionnalite_5e'
    | 'angles_5e'
    | 'prisme_5e'
    | 'pythagore_4e'
    | 'pyramide_4e'
    | 'calcul_litteral_4e'
    | 'thales_3e'
    | 'trigonometrie_3e'
    | 'sphere_3e'
    | 'vecteurs_2nde'
    | 'parabole_2nde'
    | 'statistiques_2nde'
    | 'derivation_1ere'
    | 'produit_scalaire_1ere'
    | 'probabilites_1ere'
    | 'integrales_term'
    | 'geometrie_espace_term'
    | 'prediction_term'
    | 'pc_states_matter'
    | 'pc_circuit_3d'
    | 'pc_optics_3d'
    | 'pc_molecule_3d'
    | 'pc_atom_3d'
    | 'pc_gravity_3d'
    | 'pc_wave_3d'
    | 'pc_projectile_3d'
    | 'pc_titration_3d'
    | 'svt_cell_3d'
    | 'svt_dna_3d'
    | 'svt_tectonics_3d'
    | 'svt_ecosystem_3d'
    | 'svt_organ_3d'
    | 'svt_neuron_3d'
    | 'svt_climate_3d'
    | 'hg_monument_3d'
    | 'hg_city_urban_3d'
    | 'hg_globe_routes_3d'
    | 'hg_demography_3d'
    | 'hg_timeline_3d'
    | 'hg_industry_3d'
    | 'hg_geopolitics_3d'
    | 'fr_syntax_3d'
    | 'fr_narrative_3d'
    | 'fr_grammar_3d'
    | 'fr_theater_3d'
    | 'fr_poetry_3d'
    | 'fr_rhetoric_3d'
    | 'fr_philo_3d'
    | 'en_tense_3d'
    | 'en_syntax_3d'
    | 'en_modals_3d'
    | 'en_vocab_3d'
    | 'en_culture_3d'
    | 'en_essay_3d';
  defaultParams: Record<string, number>;
  xpReward: number;
  estimatedMinutes: number;
  exercises: SeedExercise[];
}

export const GRADE_LEVELS: Array<{
  id: '6e' | '5e' | '4e' | '3e' | '2nde' | '1ere' | 'terminale';
  label: string;
  cycle: string;
  focus: string;
}> = [
  { id: '6e', label: '6ᵉ', cycle: 'Cycle 3 · Collège', focus: 'Fractions, symétrie axiale et volumes élémentaires' },
  { id: '5e', label: '5ᵉ', cycle: 'Cycle 4 · Collège', focus: 'Proportionnalité, angles, prismes et cylindres' },
  { id: '4e', label: '4ᵉ', cycle: 'Cycle 4 · Collège', focus: 'Pythagore, pyramides, cônes et calcul littéral' },
  { id: '3e', label: '3ᵉ', cycle: 'Cycle 4 · Brevet', focus: 'Thalès, trigonométrie et sections sphériques' },
  { id: '2nde', label: '2nde', cycle: 'Lycée · Général', focus: 'Vecteurs, fonctions du 2nd degré et statistiques' },
  { id: '1ere', label: '1ʳᵉ', cycle: 'Lycée · Spécialité', focus: 'Dérivation, produit scalaire et probabilités conditionnelles' },
  { id: 'terminale', label: 'Terminale', cycle: 'Lycée · Baccalauréat', focus: 'Intégration, géométrie 3D et algorithmes de prédiction' },
];

export const SEED_CHAPTERS: SeedChapter[] = [
  // ==================== 6e ====================
  {
    slug: '6e-fractions-partage',
    gradeLevel: '6e',
    orderIndex: 1,
    title: 'Fractions et partage géométrique',
    subtitle: 'Visualiser numérateur et dénominateur dans l’espace',
    summary: 'Comprendre une fraction comme une proportion d’un solide découpé en parts égales.',
    theoryContent:
      'Une fraction a/b représente a parts prises sur un tout découpé en b parts rigoureusement égales. En 3D, un pavé découpé en b tranches identiques permet de comparer immédiatement deux fractions et d’observer les fractions équivalentes.',
    formulaDisplay: 'a / b = (k × a) / (k × b)   avec b ≠ 0',
    scenePreset: 'fractions_3d',
    defaultParams: { a: 3, b: 8, c: 1 },
    xpReward: 120,
    estimatedMinutes: 15,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'quiz',
        prompt: 'Si un bloc est divisé en 8 tranches égales et que 3 tranches sont colorées, quelle fraction est représentée ?',
        hint: 'Le dénominateur correspond au nombre total de tranches égales.',
        options: ['3/8', '8/3', '3/5', '5/8'],
        correctAnswer: '3/8',
        numericTolerance: 0,
        explanation: 'On compte 3 parts colorées sur un total de 8 parts égales, soit 3/8.',
        xpValue: 35,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Calcule la valeur décimale de la fraction 3/4 (utilise le point décimal, ex: 0.5).',
        hint: 'Divise 3 par 4.',
        options: null,
        correctAnswer: '0.75',
        numericTolerance: 0.01,
        explanation: '3 ÷ 4 = 0.75, soit 75 % du volume total.',
        xpValue: 40,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Laquelle de ces fractions est équivalente à 2/5 ?',
        hint: 'Multiplie le numérateur et le dénominateur par un même entier non nul.',
        options: ['4/10', '4/5', '6/10', '2/10'],
        correctAnswer: '4/10',
        numericTolerance: 0,
        explanation: '(2 × 2) / (5 × 2) = 4/10.',
        xpValue: 45,
      },
    ],
  },
  {
    slug: '6e-volumes-pave-droit',
    gradeLevel: '6e',
    orderIndex: 2,
    title: 'Volumes du cube et du pavé droit',
    subtitle: 'Longueur, largeur et hauteur en centimètres cubes',
    summary: 'Mesurer le volume d’un solide par empilement de cubes unités.',
    theoryContent:
      'Le volume d’un pavé droit de dimensions L, l et h s’obtient en multipliant ces trois longueurs exprimées dans la même unité : V = L × l × h. Dans l’espace 3D, cela revient à empiler h couches contenant chacune L × l cubes unités.',
    formulaDisplay: 'V = L × l × h',
    scenePreset: 'volumes_6e',
    defaultParams: { a: 4, b: 3, c: 2 },
    xpReward: 130,
    estimatedMinutes: 18,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Quel est le volume (en cm³) d’un pavé droit de longueur 5 cm, largeur 3 cm et hauteur 4 cm ?',
        hint: 'Multiplie les trois dimensions entre elles.',
        options: null,
        correctAnswer: '60',
        numericTolerance: 0.01,
        explanation: 'V = 5 × 3 × 4 = 60 cm³.',
        xpValue: 40,
      },
      {
        orderIndex: 2,
        exerciseType: 'quiz',
        prompt: 'Si l’on double la hauteur d’un pavé droit sans changer sa base, son volume est :',
        hint: 'Observe la formule V = Aire_base × h.',
        options: ['Multiplié par 2', 'Multiplié par 4', 'Multiplié par 8', 'Inchangé'],
        correctAnswer: 'Multiplié par 2',
        numericTolerance: 0,
        explanation: 'Le volume est proportionnel à la hauteur : doubler h double V.',
        xpValue: 40,
      },
      {
        orderIndex: 3,
        exerciseType: 'practice',
        prompt: 'Un cube a une arête de 3 cm. Quel est son volume en cm³ ?',
        hint: 'Dans un cube, L = l = h.',
        options: null,
        correctAnswer: '27',
        numericTolerance: 0.01,
        explanation: 'V = 3 × 3 × 3 = 27 cm³.',
        xpValue: 50,
      },
    ],
  },
  {
    slug: '6e-symetrie-axiale',
    gradeLevel: '6e',
    orderIndex: 3,
    title: 'Symétrie axiale et médiatrice',
    subtitle: 'Conservation des longueurs et des angles par réflexion',
    summary: 'Explorer l’effet miroir par rapport à un axe et les propriétés d’invariance.',
    theoryContent:
      'Deux figures sont symétriques par rapport à une droite (d) si elles se superposent parfaitement par pliage le long de (d). La droite (d) est alors la médiatrice de chaque segment reliant un point à son image : elle est perpendiculaire au segment et passe par son milieu.',
    formulaDisplay: 'M ∈ médiatrice(AB) ⇔ MA = MB',
    scenePreset: 'symetrie_3d',
    defaultParams: { a: 2.5, b: 1.5, c: 1 },
    xpReward: 120,
    estimatedMinutes: 16,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'quiz',
        prompt: 'La symétrie axiale conserve-t-elle les longueurs et les aires ?',
        hint: 'Le pliage déforme-t-il la figure ?',
        options: [
          'Oui, elle conserve longueurs, angles et aires',
          'Elle conserve les longueurs mais double les aires',
          'Elle conserve uniquement les angles',
          'Non, elle inverse les longueurs',
        ],
        correctAnswer: 'Oui, elle conserve longueurs, angles et aires',
        numericTolerance: 0,
        explanation: 'La symétrie axiale est une isométrie : toutes les mesures géométriques sont conservées.',
        xpValue: 35,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Un point A est situé à 4.5 cm de l’axe de symétrie (d). Quelle est la distance en cm entre A et son symétrique A’ ?',
        hint: 'L’axe passe exactement au milieu du segment [AA’].',
        options: null,
        correctAnswer: '9',
        numericTolerance: 0.05,
        explanation: 'La distance AA’ vaut 2 × 4.5 = 9 cm.',
        xpValue: 45,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Quelle droite est toujours perpendiculaire au segment [AA’] en son milieu ?',
        hint: 'C’est l’axe de symétrie du segment.',
        options: ['La médiatrice de [AA’]', 'La diagonale', 'La bissectrice', 'La médiane'],
        correctAnswer: 'La médiatrice de [AA’]',
        numericTolerance: 0,
        explanation: 'Par définition, la médiatrice d’un segment est la droite perpendiculaire passant par son milieu.',
        xpValue: 40,
      },
    ],
  },

  // ==================== 5e ====================
  {
    slug: '5e-proportionnalite-echelles',
    gradeLevel: '5e',
    orderIndex: 1,
    title: 'Proportionnalité et échelles 3D',
    subtitle: 'Coefficient de proportionnalité et produit en croix',
    summary: 'Relier deux grandeurs proportionnelles par une fonction linéaire et l’appliquer aux maquettes.',
    theoryContent:
      'Deux grandeurs sont proportionnelles lorsque l’on passe de l’une à l’autre en multipliant toujours par un même nombre k appelé coefficient de proportionnalité. Sur une maquette à l’échelle 1/k, toutes les longueurs réelles sont divisées par k.',
    formulaDisplay: 'y = k × x   et   a / b = c / d ⇒ a × d = b × c',
    scenePreset: 'proportionnalite_5e',
    defaultParams: { a: 2, b: 3, c: 1 },
    xpReward: 130,
    estimatedMinutes: 18,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Une maquette est à l’échelle 1/50. Un mur mesure 12 cm sur la maquette. Quelle est sa longueur réelle en mètres ?',
        hint: '12 × 50 donne la longueur en cm, puis convertis en mètres.',
        options: null,
        correctAnswer: '6',
        numericTolerance: 0.01,
        explanation: '12 × 50 = 600 cm = 6 mètres.',
        xpValue: 45,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Pour 4 cahiers identiques on paie 10 €. Combien coûtent 6 cahiers (en €) ?',
        hint: 'Calcule d’abord le prix d’un cahier (10 ÷ 4).',
        options: null,
        correctAnswer: '15',
        numericTolerance: 0.01,
        explanation: 'Le coefficient vaut 2.5 €/cahier, donc 6 × 2.5 = 15 €.',
        xpValue: 40,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Dans un repère, les points représentant une situation de proportionnalité sont :',
        hint: 'Que vaut y quand x = 0 ?',
        options: [
          'Alignés sur une droite passant par l’origine',
          'Disposés sur une parabole',
          'Alignés sur une droite horizontale ne passant pas par l’origine',
          'Disposés aléatoirement',
        ],
        correctAnswer: 'Alignés sur une droite passant par l’origine',
        numericTolerance: 0,
        explanation: 'Toute relation y = k·x est représentée par une droite passant par (0, 0).',
        xpValue: 45,
      },
    ],
  },
  {
    slug: '5e-angles-paralleles',
    gradeLevel: '5e',
    orderIndex: 2,
    title: 'Angles, parallélisme et triangles',
    subtitle: 'Angles alternes-internes, correspondants et somme dans le triangle',
    summary: 'Caractériser le parallélisme de deux droites par les mesures d’angles.',
    theoryContent:
      'Lorsque deux droites parallèles sont coupées par une sécante, les angles alternes-internes ont exactement la même mesure, tout comme les angles correspondants. Dans tout triangle du plan euclidien, la somme des trois angles vaut 180°.',
    formulaDisplay: 'α + β + γ = 180°',
    scenePreset: 'angles_5e',
    defaultParams: { a: 48, b: 62, c: 1 },
    xpReward: 130,
    estimatedMinutes: 18,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Un triangle possède deux angles de 55° et 75°. Quelle est la mesure du troisième angle en degrés ?',
        hint: 'Soustrais la somme des deux angles à 180°.',
        options: null,
        correctAnswer: '50',
        numericTolerance: 0.1,
        explanation: '180 - (55 + 75) = 180 - 130 = 50°.',
        xpValue: 40,
      },
      {
        orderIndex: 2,
        exerciseType: 'quiz',
        prompt: 'Deux droites coupées par une sécante forment des angles alternes-internes de 64° et 64°. Ces droites sont :',
        hint: 'Utilise la réciproque des angles alternes-internes.',
        options: ['Parallèles', 'Perpendiculaires', 'Confondues obligatoirement', 'Sécantes à 64°'],
        correctAnswer: 'Parallèles',
        numericTolerance: 0,
        explanation: 'Si deux angles alternes-internes sont égaux, alors les deux droites sont parallèles.',
        xpValue: 45,
      },
      {
        orderIndex: 3,
        exerciseType: 'practice',
        prompt: 'Dans un triangle isocèle, l’angle au sommet principal vaut 40°. Combien mesure chacun des deux angles à la base (en degrés) ?',
        hint: 'Les deux angles à la base ont la même mesure.',
        options: null,
        correctAnswer: '70',
        numericTolerance: 0.1,
        explanation: '(180 - 40) ÷ 2 = 140 ÷ 2 = 70°.',
        xpValue: 45,
      },
    ],
  },
  {
    slug: '5e-prisme-cylindre',
    gradeLevel: '5e',
    orderIndex: 3,
    title: 'Prismes droits et cylindres de révolution',
    subtitle: 'Aire de base, aire latérale et volume dans l’espace',
    summary: 'Calculer le volume d’un cylindre ou d’un prisme à partir de sa base et de sa hauteur.',
    theoryContent:
      'Un prisme droit possède deux bases polygonales superposables et des faces latérales rectangulaires. Un cylindre de révolution est engendré par la rotation d’un rectangle autour d’un axe. Pour les deux solides, le volume vaut V = Aire_base × h.',
    formulaDisplay: 'V_cylindre = π × r² × h',
    scenePreset: 'prisme_5e',
    defaultParams: { a: 1.5, b: 4, c: 6 },
    xpReward: 140,
    estimatedMinutes: 20,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Un prisme droit a une base triangulaire d’aire 12 cm² et une hauteur de 7 cm. Quel est son volume en cm³ ?',
        hint: 'Utilise V = Aire_base × hauteur.',
        options: null,
        correctAnswer: '84',
        numericTolerance: 0.05,
        explanation: 'V = 12 × 7 = 84 cm³.',
        xpValue: 45,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Calcule le volume approché (avec π ≈ 3.14) d’un cylindre de rayon 2 cm et de hauteur 5 cm (en cm³).',
        hint: 'V = 3.14 × 2² × 5.',
        options: null,
        correctAnswer: '62.8',
        numericTolerance: 0.2,
        explanation: 'V = π × 4 × 5 = 20π ≈ 62.83 cm³.',
        xpValue: 50,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Quelle est la forme de chaque face latérale d’un prisme droit ?',
        hint: 'Les arêtes latérales sont perpendiculaires aux bases.',
        options: ['Un rectangle', 'Un triangle', 'Un disque', 'Un trapèze quelconque'],
        correctAnswer: 'Un rectangle',
        numericTolerance: 0,
        explanation: 'Dans un prisme droit, toutes les faces latérales sont des rectangles.',
        xpValue: 45,
      },
    ],
  },

  // ==================== 4e ====================
  {
    slug: '4e-theoreme-pythagore',
    gradeLevel: '4e',
    orderIndex: 1,
    title: 'Théorème de Pythagore en 3D',
    subtitle: 'Relations métriques dans le triangle rectangle et diagonales spatiales',
    summary: 'Relier les aires des carrés construits sur les côtés d’un triangle rectangle.',
    theoryContent:
      'Dans un triangle rectangle, le carré de la longueur de l’hypoténuse est égal à la somme des carrés des longueurs des deux autres côtés : a² + b² = c². Cette identité fondamentale permet aussi de calculer la distance euclidienne en 3D : d = √(x² + y² + z²).',
    formulaDisplay: 'BC² = AB² + AC²',
    scenePreset: 'pythagore_4e',
    defaultParams: { a: 3, b: 4, c: 0 },
    xpReward: 150,
    estimatedMinutes: 22,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Un triangle rectangle a des côtés de l’angle droit de 6 cm et 8 cm. Quelle est la longueur de son hypoténuse (en cm) ?',
        hint: 'Calcule √(6² + 8²).',
        options: null,
        correctAnswer: '10',
        numericTolerance: 0.05,
        explanation: '6² + 8² = 36 + 64 = 100, donc l’hypoténuse mesure √100 = 10 cm.',
        xpValue: 50,
      },
      {
        orderIndex: 2,
        exerciseType: 'quiz',
        prompt: 'Un triangle dont les côtés mesurent 5 cm, 12 cm et 13 cm est-il rectangle ?',
        hint: 'Compare 13² à 5² + 12².',
        options: [
          'Oui, d’après la réciproque du théorème de Pythagore',
          'Non, 5 + 12 ≠ 13',
          'Oui, mais uniquement s’il est isocèle',
          'Impossible à déterminer',
        ],
        correctAnswer: 'Oui, d’après la réciproque du théorème de Pythagore',
        numericTolerance: 0,
        explanation: '13² = 169 et 5² + 12² = 25 + 144 = 169. L’égalité est vérifiée, le triangle est rectangle.',
        xpValue: 50,
      },
      {
        orderIndex: 3,
        exerciseType: 'practice',
        prompt: 'Dans un triangle rectangle, l’hypoténuse vaut 13 cm et un côté vaut 5 cm. Quelle est la longueur du troisième côté (en cm) ?',
        hint: 'Isole b² = c² - a².',
        options: null,
        correctAnswer: '12',
        numericTolerance: 0.05,
        explanation: 'b² = 13² - 5² = 169 - 25 = 144, donc b = 12 cm.',
        xpValue: 50,
      },
    ],
  },
  {
    slug: '4e-pyramides-cones',
    gradeLevel: '4e',
    orderIndex: 2,
    title: 'Pyramides et cônes de révolution',
    subtitle: 'Du prisme au tiers du volume et génératrices coniques',
    summary: 'Comparer le volume d’une pyramide ou d’un cône au prisme de même base et hauteur.',
    theoryContent:
      'Le volume d’une pyramide ou d’un cône de révolution est égal au tiers du produit de l’aire de sa base par sa hauteur : V = (1/3) × Aire_base × h. Pour un cône, la génératrice g, le rayon r et la hauteur h forment un triangle rectangle vérifiant g² = r² + h².',
    formulaDisplay: 'V = (1/3) × Aire_base × h',
    scenePreset: 'pyramide_4e',
    defaultParams: { a: 6, b: 5, c: 1 },
    xpReward: 150,
    estimatedMinutes: 20,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Une pyramide a une base carrée de côté 6 cm et une hauteur de 5 cm. Quel est son volume en cm³ ?',
        hint: 'Aire de la base = 6 × 6, puis divise (Aire × h) par 3.',
        options: null,
        correctAnswer: '60',
        numericTolerance: 0.05,
        explanation: 'V = (1/3) × 36 × 5 = 12 × 5 = 60 cm³.',
        xpValue: 50,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Un cône a un rayon de 3 cm et une hauteur de 4 cm. Quelle est la longueur de sa génératrice en cm ?',
        hint: 'Applique Pythagore au triangle rectangle formé par r, h et g.',
        options: null,
        correctAnswer: '5',
        numericTolerance: 0.05,
        explanation: 'g = √(3² + 4²) = √25 = 5 cm.',
        xpValue: 50,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Un cylindre et un cône ont exactement la même base et la même hauteur. Le volume du cylindre vaut 90 cm³. Quel est celui du cône ?',
        hint: 'Le volume du cône est une fraction simple de celui du cylindre.',
        options: ['30 cm³', '45 cm³', '15 cm³', '60 cm³'],
        correctAnswer: '30 cm³',
        numericTolerance: 0,
        explanation: 'V_cône = V_cylindre ÷ 3 = 90 ÷ 3 = 30 cm³.',
        xpValue: 50,
      },
    ],
  },
  {
    slug: '4e-calcul-litteral',
    gradeLevel: '4e',
    orderIndex: 3,
    title: 'Calcul littéral et distributivité',
    subtitle: 'Modéliser des aires géométriques par des expressions algébriques',
    summary: 'Développer, factoriser et résoudre des équations du premier degré.',
    theoryContent:
      'La distributivité simple k(a + b) = ka + kb s’interprète géométriquement comme le découpage d’un rectangle de largeur k et de longueur (a + b) en deux rectangles d’aires ka et kb. Factoriser consiste à effectuer le chemin inverse pour résoudre des équations.',
    formulaDisplay: 'k(a + b) = k·a + k·b',
    scenePreset: 'calcul_litteral_4e',
    defaultParams: { a: 2.5, b: 1.5, c: 2 },
    xpReward: 140,
    estimatedMinutes: 19,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'quiz',
        prompt: 'Quelle est la forme développée et réduite de 3(2x - 4) + 5x ?',
        hint: 'Développe 3(2x - 4) puis regroupe les termes en x.',
        options: ['11x - 12', '11x - 4', '6x - 12', '8x - 12'],
        correctAnswer: '11x - 12',
        numericTolerance: 0,
        explanation: '3(2x - 4) + 5x = 6x - 12 + 5x = 11x - 12.',
        xpValue: 45,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Résous l’équation 4x - 7 = 13. Que vaut x ?',
        hint: 'Ajoute 7 des deux côtés puis divise par 4.',
        options: null,
        correctAnswer: '5',
        numericTolerance: 0.01,
        explanation: '4x = 20 ⇒ x = 5.',
        xpValue: 45,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'La forme factorisée de 12x + 18 est :',
        hint: 'Cherche le plus grand facteur commun à 12 et 18.',
        options: ['6(2x + 3)', '3(4x + 18)', '6(2x + 18)', '2(6x + 6)'],
        correctAnswer: '6(2x + 3)',
        numericTolerance: 0,
        explanation: '6 × 2x + 6 × 3 = 12x + 18.',
        xpValue: 50,
      },
    ],
  },

  // ==================== 3e ====================
  {
    slug: '3e-theoreme-thales',
    gradeLevel: '3e',
    orderIndex: 1,
    title: 'Théorème de Thalès et homothéties',
    subtitle: 'Triangles semblables et conservation des rapports de longueurs',
    summary: 'Calculer une longueur inaccessible grâce au parallélisme et aux agrandissements.',
    theoryContent:
      'Si deux droites parallèles coupent deux droites sécantes en A, les triangles formés sont semblables et les longueurs de leurs côtés correspondants sont proportionnelles : AM/AB = AN/AC = MN/BC. Si les longueurs sont multipliées par k, les aires le sont par k² et les volumes par k³.',
    formulaDisplay: 'AM / AB = AN / AC = MN / BC',
    scenePreset: 'thales_3e',
    defaultParams: { a: 0.55, b: 3.5, c: 2.5 },
    xpReward: 160,
    estimatedMinutes: 22,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'En configuration de Thalès, AM = 3 cm, AB = 9 cm et BC = 12 cm. Combien mesure MN (en cm) ?',
        hint: 'Calcule le rapport k = AM / AB puis multiplie par BC.',
        options: null,
        correctAnswer: '4',
        numericTolerance: 0.05,
        explanation: 'AM/AB = 3/9 = 1/3, donc MN = (1/3) × 12 = 4 cm.',
        xpValue: 55,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Un solide a un volume de 20 cm³. On réalise un agrandissement de rapport k = 3. Quel est le nouveau volume en cm³ ?',
        hint: 'Dans un agrandissement de rapport k, les volumes sont multipliés par k³.',
        options: null,
        correctAnswer: '540',
        numericTolerance: 0.1,
        explanation: 'V’ = 20 × 3³ = 20 × 27 = 540 cm³.',
        xpValue: 55,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Si AM/AB ≠ AN/AC dans une configuration à deux sécantes, que peut-on conclure sur (MN) et (BC) ?',
        hint: 'Utilise la contraposée du théorème de Thalès.',
        options: [
          'Les droites (MN) et (BC) ne sont pas parallèles',
          'Les droites sont perpendiculaires',
          'Les droites sont parallèles',
          'Le triangle est équilatéral',
        ],
        correctAnswer: 'Les droites (MN) et (BC) ne sont pas parallèles',
        numericTolerance: 0,
        explanation: 'Si les rapports ne sont pas égaux, les droites ne peuvent pas être parallèles.',
        xpValue: 50,
      },
    ],
  },
  {
    slug: '3e-trigonometrie-triangle',
    gradeLevel: '3e',
    orderIndex: 2,
    title: 'Trigonométrie dans le triangle rectangle',
    subtitle: 'Cosinus, sinus et tangente en géométrie et robotique',
    summary: 'Relier les angles aigus et les rapports de côtés dans un triangle rectangle.',
    theoryContent:
      'Pour un angle aigu α d’un triangle rectangle : cos(α) = Adjacent / Hypoténuse, sin(α) = Opposé / Hypoténuse et tan(α) = Opposé / Adjacent. De plus, pour tout angle α, on a l’identité fondamentale cos²(α) + sin²(α) = 1.',
    formulaDisplay: 'cos²(α) + sin²(α) = 1   et   tan(α) = sin(α) / cos(α)',
    scenePreset: 'trigonometrie_3e',
    defaultParams: { a: 37, b: 4, c: 1 },
    xpReward: 160,
    estimatedMinutes: 24,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Dans un triangle rectangle, l’hypoténuse mesure 10 cm et un angle aigu mesure 60°. Quelle est la longueur du côté adjacent (cos 60° = 0.5) en cm ?',
        hint: 'Adjacent = Hypoténuse × cos(60°).',
        options: null,
        correctAnswer: '5',
        numericTolerance: 0.05,
        explanation: 'Adjacent = 10 × cos(60°) = 10 × 0.5 = 5 cm.',
        xpValue: 55,
      },
      {
        orderIndex: 2,
        exerciseType: 'quiz',
        prompt: 'Si cos(α) = 0.6 pour un angle aigu α, que vaut sin(α) ?',
        hint: 'Utilise cos²(α) + sin²(α) = 1.',
        options: ['0.8', '0.4', '0.64', '0.36'],
        correctAnswer: '0.8',
        numericTolerance: 0,
        explanation: 'sin²(α) = 1 - 0.6² = 1 - 0.36 = 0.64 ⇒ sin(α) = 0.8.',
        xpValue: 55,
      },
      {
        orderIndex: 3,
        exerciseType: 'practice',
        prompt: 'Le côté opposé vaut 6 cm et le côté adjacent vaut 3 cm. Que vaut tan(α) ?',
        hint: 'tan(α) = Opposé / Adjacent.',
        options: null,
        correctAnswer: '2',
        numericTolerance: 0.01,
        explanation: 'tan(α) = 6 / 3 = 2.',
        xpValue: 50,
      },
    ],
  },
  {
    slug: '3e-sphere-sections-planes',
    gradeLevel: '3e',
    orderIndex: 3,
    title: 'Sphère, boule et sections planes',
    subtitle: 'Aire sphérique, volume et cercle de section',
    summary: 'Analyser l’intersection d’une sphère par un plan sécant en 3D.',
    theoryContent:
      'L’aire d’une sphère de rayon R vaut 4πR² et le volume de la boule associée vaut (4/3)πR³. Lorsqu’un plan coupe une sphère de rayon R à une distance d < R de son centre, la section est un cercle de rayon r = √(R² - d²).',
    formulaDisplay: 'A = 4πR²   |   V = (4/3)πR³   |   r = √(R² - d²)',
    scenePreset: 'sphere_3e',
    defaultParams: { a: 2.5, b: 1.2, c: 1 },
    xpReward: 160,
    estimatedMinutes: 20,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Une sphère de rayon R = 5 cm est coupée par un plan situé à d = 3 cm de son centre. Quel est le rayon r du cercle de section (en cm) ?',
        hint: 'Utilise Pythagore dans le plan de coupe : r = √(R² - d²).',
        options: null,
        correctAnswer: '4',
        numericTolerance: 0.05,
        explanation: 'r = √(5² - 3²) = √(25 - 9) = √16 = 4 cm.',
        xpValue: 55,
      },
      {
        orderIndex: 2,
        exerciseType: 'quiz',
        prompt: 'Quelle est la formule exacte du volume d’une boule de rayon R ?',
        hint: 'Attention au coefficient devant πR³.',
        options: ['(4/3) × π × R³', '4 × π × R²', '(1/3) × π × R³', '2 × π × R³'],
        correctAnswer: '(4/3) × π × R³',
        numericTolerance: 0,
        explanation: 'Le volume de la boule est V = (4/3)πR³.',
        xpValue: 50,
      },
      {
        orderIndex: 3,
        exerciseType: 'practice',
        prompt: 'Calcule l’aire approchée (π ≈ 3.14) d’une sphère de rayon 3 cm (en cm²).',
        hint: 'A = 4 × 3.14 × 3².',
        options: null,
        correctAnswer: '113.04',
        numericTolerance: 0.3,
        explanation: 'A = 4 × 3.14 × 9 = 113.04 cm².',
        xpValue: 55,
      },
    ],
  },

  // ==================== 2nde ====================
  {
    slug: '2nde-vecteurs-coordonnees',
    gradeLevel: '2nde',
    orderIndex: 1,
    title: 'Vecteurs, translation et colinéarité',
    subtitle: 'Addition vectorielle, norme et critère du déterminant',
    summary: 'Manipuler des vecteurs en 3D et vérifier l’alignement par le déterminant.',
    theoryContent:
      'Un vecteur caractérise une translation par sa direction, son sens et sa norme. La somme u + v suit la règle du parallélogramme (relation de Chasles). Deux vecteurs u(x, y) et v(x’, y’) sont colinéaires si et seulement si leur déterminant det(u, v) = xy’ - x’y est nul.',
    formulaDisplay: 'det(u, v) = x·y’ - x’·y = 0 ⇔ u et v colinéaires',
    scenePreset: 'vecteurs_2nde',
    defaultParams: { a: 3, b: 4, c: -3 },
    xpReward: 170,
    estimatedMinutes: 24,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Soient u(3 ; 4) et v(x ; 8). Pour quelle valeur de x ces deux vecteurs sont-ils colinéaires ?',
        hint: 'Résous 3×8 - 4×x = 0.',
        options: null,
        correctAnswer: '6',
        numericTolerance: 0.01,
        explanation: 'det(u, v) = 24 - 4x = 0 ⇒ x = 6.',
        xpValue: 55,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Calcule la norme ||u|| du vecteur u(3 ; -4).',
        hint: '||u|| = √(x² + y²).',
        options: null,
        correctAnswer: '5',
        numericTolerance: 0.05,
        explanation: '||u|| = √(3² + (-4)²) = √(9 + 16) = 5.',
        xpValue: 55,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'D’après la relation de Chasles, pour tous points A, B, C, la somme AB + BC vaut :',
        hint: 'Enchaîne les deux translations.',
        options: ['AC', 'CA', 'BA', '0'],
        correctAnswer: 'AC',
        numericTolerance: 0,
        explanation: 'La translation de A vers B suivie de B vers C donne le vecteur AC.',
        xpValue: 60,
      },
    ],
  },
  {
    slug: '2nde-fonctions-carre-parabole',
    gradeLevel: '2nde',
    orderIndex: 2,
    title: 'Fonctions polynômes du second degré',
    subtitle: 'Parabole, axe de symétrie et extremum dans l’espace',
    summary: 'Étudier la courbe représentative de f(x) = ax² + bx + c et son sommet.',
    theoryContent:
      'Une fonction quadratique f(x) = a(x - α)² + β est représentée par une parabole de sommet S(α, β). Si a > 0, la parabole est tournée vers le haut et admet un minimum en α = -b/(2a). Si a < 0, elle admet un maximum.',
    formulaDisplay: 'f(x) = ax² + bx + c   |   α = -b / (2a)',
    scenePreset: 'parabole_2nde',
    defaultParams: { a: 0.8, b: 0, c: -1.5 },
    xpReward: 170,
    estimatedMinutes: 25,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Soit f(x) = 2x² - 8x + 5. Quelle est l’abscisse α du sommet de la parabole ?',
        hint: 'Utilise α = -b / (2a).',
        options: null,
        correctAnswer: '2',
        numericTolerance: 0.01,
        explanation: 'α = -(-8) / (2 × 2) = 8 / 4 = 2.',
        xpValue: 55,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Pour cette même fonction f(x) = 2x² - 8x + 5, quelle est la valeur minimale f(2) ?',
        hint: 'Remplace x par 2 dans f(x).',
        options: null,
        correctAnswer: '-3',
        numericTolerance: 0.01,
        explanation: 'f(2) = 2(4) - 8(2) + 5 = 8 - 16 + 5 = -3.',
        xpValue: 60,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Si a < 0 dans f(x) = ax² + bx + c, la parabole possède :',
        hint: 'Observe la concavité tournée vers le bas.',
        options: ['Un maximum global', 'Un minimum global', 'Aucune variation', 'Une asymptote verticale'],
        correctAnswer: 'Un maximum global',
        numericTolerance: 0,
        explanation: 'Lorsque a < 0, la fonction est croissante puis décroissante : elle atteint un maximum au sommet.',
        xpValue: 55,
      },
    ],
  },
  {
    slug: '2nde-statistiques-dispersion',
    gradeLevel: '2nde',
    orderIndex: 3,
    title: 'Statistiques descriptives et dispersion',
    subtitle: 'Moyenne, médiane, quartiles et écart-type appliqué aux données',
    summary: 'Quantifier la tendance centrale et la variabilité d’un jeu de données réelles.',
    theoryContent:
      'Pour résumer une série statistique, on associe un indicateur de position (moyenne ou médiane) à un indicateur de dispersion (écart interquartile Q3 - Q1 ou écart-type σ). L’écart-type mesure la racine de la moyenne des carrés des écarts à la moyenne.',
    formulaDisplay: 'σ = √( (1/n) Σ (x_i - x̄)² )',
    scenePreset: 'statistiques_2nde',
    defaultParams: { a: 1.2, b: 2.5, c: 1 },
    xpReward: 165,
    estimatedMinutes: 22,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Calcule la moyenne de la série : 10, 14, 16, 20.',
        hint: 'Additionne les 4 valeurs puis divise par 4.',
        options: null,
        correctAnswer: '15',
        numericTolerance: 0.01,
        explanation: '(10 + 14 + 16 + 20) / 4 = 60 / 4 = 15.',
        xpValue: 50,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Quelle est la médiane de la série ordonnée : 4, 7, 11, 15, 22 ?',
        hint: 'Prends la valeur centrale sur 5 éléments.',
        options: null,
        correctAnswer: '11',
        numericTolerance: 0.01,
        explanation: 'Sur 5 valeurs ordonnées, la 3ᵉ valeur (11) partage la série en deux moitiés.',
        xpValue: 55,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Quel indicateur est le plus robuste face à une valeur aberrante extrême ?',
        hint: 'Une valeur très grande modifie fortement la somme, pas l’ordre.',
        options: ['La médiane', 'La moyenne arithmétique', 'L’étendue', 'La somme totale'],
        correctAnswer: 'La médiane',
        numericTolerance: 0,
        explanation: 'La médiane dépend uniquement du rang des valeurs et résiste aux valeurs extrêmes.',
        xpValue: 60,
      },
    ],
  },

  // ==================== 1ere ====================
  {
    slug: '1ere-derivation-tangentes',
    gradeLevel: '1ere',
    orderIndex: 1,
    title: 'Nombre dérivé et optimisation par gradient',
    subtitle: 'Coefficient directeur de la tangente et descente de gradient',
    summary: 'Relier le taux d’accroissement instantané aux algorithmes d’optimisation.',
    theoryContent:
      'Le nombre dérivé f’(a) est la limite du taux d’accroissement quand h tend vers 0. Il représente la pente de la tangente à la courbe en x = a. En apprentissage automatique et prédiction temps réel, on utilise f’(x) (le gradient) pour minimiser une fonction d’erreur.',
    formulaDisplay: 'f’(a) = lim_{h→0} (f(a+h) - f(a)) / h   |   y = f’(a)(x - a) + f(a)',
    scenePreset: 'derivation_1ere',
    defaultParams: { a: 1.2, b: 0.8, c: 1 },
    xpReward: 190,
    estimatedMinutes: 26,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Soit f(x) = x³ - 3x. Que vaut le nombre dérivé f’(2) ?',
        hint: 'Calcule d’abord f’(x) = 3x² - 3 puis évalue en x = 2.',
        options: null,
        correctAnswer: '9',
        numericTolerance: 0.01,
        explanation: 'f’(x) = 3x² - 3, donc f’(2) = 3(4) - 3 = 9.',
        xpValue: 60,
      },
      {
        orderIndex: 2,
        exerciseType: 'quiz',
        prompt: 'Si f’(x) > 0 sur un intervalle I, alors la fonction f est sur I :',
        hint: 'Une pente positive fait monter la courbe.',
        options: ['Strictement croissante', 'Strictement décroissante', 'Constante', 'Négative'],
        correctAnswer: 'Strictement croissante',
        numericTolerance: 0,
        explanation: 'Le signe positif de la dérivée implique la croissance stricte de f.',
        xpValue: 60,
      },
      {
        orderIndex: 3,
        exerciseType: 'practice',
        prompt: 'Soit g(x) = 2x² - 12x + 7. Pour quelle valeur de x la dérivée g’(x) s’annule-t-elle (minimum) ?',
        hint: 'Résous 4x - 12 = 0.',
        options: null,
        correctAnswer: '3',
        numericTolerance: 0.01,
        explanation: 'g’(x) = 4x - 12 = 0 ⇒ x = 3.',
        xpValue: 70,
      },
    ],
  },
  {
    slug: '1ere-produit-scalaire',
    gradeLevel: '1ere',
    orderIndex: 2,
    title: 'Produit scalaire et orthogonalité',
    subtitle: 'Projection orthogonale, norme et similarité cosinus',
    summary: 'Mesurer l’angle entre deux vecteurs dans le plan et l’espace.',
    theoryContent:
      'Le produit scalaire de deux vecteurs u et v vaut u·v = ||u||·||v||·cos(θ) = xx’ + yy’. Il est nul si et seulement si u et v sont orthogonaux. En science des données, le cosinus de l’angle mesure la similarité entre deux profils vectoriels.',
    formulaDisplay: 'u · v = ||u|| · ||v|| · cos(θ) = x·x’ + y·y’',
    scenePreset: 'produit_scalaire_1ere',
    defaultParams: { a: 60, b: 3, c: 2.5 },
    xpReward: 185,
    estimatedMinutes: 25,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Calcule le produit scalaire u · v pour u(2 ; 5) et v(4 ; -1).',
        hint: 'Utilise la formule x·x’ + y·y’.',
        options: null,
        correctAnswer: '3',
        numericTolerance: 0.01,
        explanation: 'u · v = 2×4 + 5×(-1) = 8 - 5 = 3.',
        xpValue: 60,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Pour quelle valeur de k les vecteurs u(3 ; 6) et v(k ; -2) sont-ils orthogonaux ?',
        hint: 'Écris 3k + 6×(-2) = 0.',
        options: null,
        correctAnswer: '4',
        numericTolerance: 0.01,
        explanation: '3k - 12 = 0 ⇒ k = 4.',
        xpValue: 65,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Si ||u|| = 4, ||v|| = 5 et θ = 60°, que vaut u · v ?',
        hint: 'cos(60°) = 0.5.',
        options: ['10', '20', '17.3', '0'],
        correctAnswer: '10',
        numericTolerance: 0,
        explanation: 'u · v = 4 × 5 × cos(60°) = 20 × 0.5 = 10.',
        xpValue: 60,
      },
    ],
  },
  {
    slug: '1ere-probabilites-bayes',
    gradeLevel: '1ere',
    orderIndex: 3,
    title: 'Probabilités conditionnelles et Bayes',
    subtitle: 'Arbres pondérés, indépendance et mise à jour de croyance',
    summary: 'Fondement mathématique du moteur de prédiction bayésien de réussite scolaire.',
    theoryContent:
      'La probabilité conditionnelle de B sachant A est P_A(B) = P(A ∩ B) / P(A). La formule de Bayes permet d’inverser le conditionnement pour mettre à jour une probabilité de maîtrise L sachant qu’un élève vient de réussir ou d’échouer à un quiz.',
    formulaDisplay: 'P(A | B) = P(B | A) · P(A) / P(B)',
    scenePreset: 'probabilites_1ere',
    defaultParams: { a: 0.65, b: 0.85, c: 0.2 },
    xpReward: 195,
    estimatedMinutes: 26,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'On sait que P(A) = 0.4 et P(A ∩ B) = 0.16. Que vaut la probabilité conditionnelle P_A(B) ?',
        hint: 'Divise P(A ∩ B) par P(A).',
        options: null,
        correctAnswer: '0.4',
        numericTolerance: 0.01,
        explanation: 'P_A(B) = 0.16 / 0.4 = 0.4.',
        xpValue: 65,
      },
      {
        orderIndex: 2,
        exerciseType: 'quiz',
        prompt: 'Deux événements A et B de probabilité non nulle sont indépendants si et seulement si :',
        hint: 'La réalisation de A ne change pas la probabilité de B.',
        options: ['P(A ∩ B) = P(A) × P(B)', 'P(A ∩ B) = 0', 'P(A ∪ B) = 1', 'P(A) = P(B)'],
        correctAnswer: 'P(A ∩ B) = P(A) × P(B)',
        numericTolerance: 0,
        explanation: 'L’indépendance stochastique se traduit par P(A ∩ B) = P(A)P(B).',
        xpValue: 60,
      },
      {
        orderIndex: 3,
        exerciseType: 'practice',
        prompt: 'Un élève maîtrise un chapitre avec P(L) = 0.5. S’il maîtrise, il réussit à 0.9 ; sinon à 0.3. Quelle est la probabilité totale qu’il réussisse ?',
        hint: 'Formule des probabilités totales : P(L)×0.9 + (1-P(L))×0.3.',
        options: null,
        correctAnswer: '0.6',
        numericTolerance: 0.01,
        explanation: 'P(Succès) = 0.5 × 0.9 + 0.5 × 0.3 = 0.45 + 0.15 = 0.6.',
        xpValue: 70,
      },
    ],
  },

  // ==================== Terminale ====================
  {
    slug: 'term-calcul-integral',
    gradeLevel: 'terminale',
    orderIndex: 1,
    title: 'Calcul intégral et sommes de Riemann',
    subtitle: 'Aire sous la courbe, primitives et convergence discrète',
    summary: 'Approcher une intégrale en 3D par des prismes de Riemann et calculer la valeur exacte.',
    theoryContent:
      'Pour une fonction continue positive f sur [a, b], l’intégrale ∫_a^b f(x)dx mesure l’aire sous la courbe. Elle est la limite des sommes de Riemann lorsque le nombre de subdivisions n tend vers l’infini, et se calcule exactement via une primitive F : F(b) - F(a).',
    formulaDisplay: '∫_a^b f(x) dx = F(b) - F(a) = lim_{n→∞} Σ f(x_i) Δx',
    scenePreset: 'integrales_term',
    defaultParams: { a: 12, b: 1.5, c: 3 },
    xpReward: 220,
    estimatedMinutes: 30,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Calcule l’intégrale ∫_0^2 3x² dx.',
        hint: 'Une primitive de 3x² est F(x) = x³.',
        options: null,
        correctAnswer: '8',
        numericTolerance: 0.01,
        explanation: 'F(2) - F(0) = 2³ - 0³ = 8.',
        xpValue: 70,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Quelle est la valeur moyenne de f(x) = 2x sur l’intervalle [1 ; 3] ?',
        hint: 'μ = (1 / (3 - 1)) ∫_1^3 2x dx.',
        options: null,
        correctAnswer: '4',
        numericTolerance: 0.01,
        explanation: '∫_1^3 2x dx = [x²]_1^3 = 9 - 1 = 8, donc μ = 8 / 2 = 4.',
        xpValue: 75,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Quelle primitive correspond à f(x) = e^(2x) ?',
        hint: 'Dérive chaque proposition pour vérifier.',
        options: ['(1/2)e^(2x)', '2e^(2x)', 'e^(2x)', 'x·e^(2x)'],
        correctAnswer: '(1/2)e^(2x)',
        numericTolerance: 0,
        explanation: 'La dérivée de (1/2)e^(2x) vaut (1/2) × 2e^(2x) = e^(2x).',
        xpValue: 75,
      },
    ],
  },
  {
    slug: 'term-geometrie-espace',
    gradeLevel: 'terminale',
    orderIndex: 2,
    title: 'Géométrie vectorielle dans l’espace 3D',
    subtitle: 'Droites paramétriques, plans normaux et distances orthogonales',
    summary: 'Modéliser des intersections droites/plans en coordonnées cartésiennes (x, y, z).',
    theoryContent:
      'Dans un repère orthonormé de l’espace, un plan de vecteur normal n(a, b, c) a pour équation cartésienne ax + by + cz + d = 0. Une droite passant par A de vecteur directeur u s’écrit M = A + t·u. Le moteur 3D WebGL utilise exactement ces équations pour le raycasting.',
    formulaDisplay: 'ax + by + cz + d = 0   |   n · AM = 0',
    scenePreset: 'geometrie_espace_term',
    defaultParams: { a: 1, b: 1.5, c: 1 },
    xpReward: 220,
    estimatedMinutes: 28,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Un plan P a pour équation 2x - y + 2z - 6 = 0. Calcule la norme du vecteur normal n(2 ; -1 ; 2).',
        hint: '||n|| = √(2² + (-1)² + 2²).',
        options: null,
        correctAnswer: '3',
        numericTolerance: 0.01,
        explanation: '||n|| = √(4 + 1 + 4) = √9 = 3.',
        xpValue: 70,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Soit une droite passant par A(1 ; 2 ; 0) de vecteur directeur u(2 ; -1 ; 3). Quelle est l’abscisse x du point pour le paramètre t = 4 ?',
        hint: 'x(t) = x_A + t · u_x.',
        options: null,
        correctAnswer: '9',
        numericTolerance: 0.01,
        explanation: 'x(4) = 1 + 4 × 2 = 9.',
        xpValue: 75,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Si le produit scalaire n · u entre le vecteur normal d’un plan et le vecteur directeur d’une droite est nul, la droite est :',
        hint: 'Orthogonale au vecteur normal signifie dans la direction du plan.',
        options: ['Parallèle au plan', 'Perpendiculaire au plan', 'Oblique à 45°', 'Toujours confondue avec l’axe Oz'],
        correctAnswer: 'Parallèle au plan',
        numericTolerance: 0,
        explanation: 'Si u ⊥ n, alors u est parallèle au plan.',
        xpValue: 75,
      },
    ],
  },
  {
    slug: 'term-algorithmes-prediction',
    gradeLevel: 'terminale',
    orderIndex: 3,
    title: 'Mathématiques appliquées & prédiction temps réel',
    subtitle: 'Régression logistique, gradient et modèle BKT de cette plateforme',
    summary: 'Optimiser la probabilité de réussite en temps réel à partir des réponses et du temps de réaction.',
    theoryContent:
      'La fonction logistique σ(z) = 1 / (1 + e^(-z)) transforme un score linéaire en probabilité comprise entre 0 et 1. Couplée à la mise à jour bayésienne (BKT) et à la moyenne mobile exponentielle (EWMA), elle permet d’estimer en temps réel la maîtrise d’un élève sur chaque chapitre.',
    formulaDisplay: 'σ(z) = 1 / (1 + e^(-z))   |   P_t = α·y_t + (1-α)·P_{t-1}',
    scenePreset: 'prediction_term',
    defaultParams: { a: 1.8, b: 0.4, c: 0.38 },
    xpReward: 250,
    estimatedMinutes: 30,
    exercises: [
      {
        orderIndex: 1,
        exerciseType: 'practice',
        prompt: 'Pour z = 0 dans la fonction sigmoïde σ(z) = 1 / (1 + e^(-z)), que vaut σ(0) ?',
        hint: 'Rappelle-toi que e⁰ = 1.',
        options: null,
        correctAnswer: '0.5',
        numericTolerance: 0.01,
        explanation: 'σ(0) = 1 / (1 + 1) = 0.5, soit 50 % de probabilité prédite.',
        xpValue: 80,
      },
      {
        orderIndex: 2,
        exerciseType: 'practice',
        prompt: 'Dans une EWMA avec α = 0.4 et P₀ = 0.5, un élève réussit (y₁ = 1). Quelle est la nouvelle estimation P₁ = α·1 + (1-α)·0.5 ?',
        hint: 'Calcule 0.4×1 + 0.6×0.5.',
        options: null,
        correctAnswer: '0.7',
        numericTolerance: 0.01,
        explanation: 'P₁ = 0.4 + 0.3 = 0.7 (soit 70 %).',
        xpValue: 85,
      },
      {
        orderIndex: 3,
        exerciseType: 'quiz',
        prompt: 'Dans un algorithme d’optimisation par descente de gradient, quel est le rôle du pas d’apprentissage η ?',
        hint: 'Il contrôle l’amplitude de la mise à jour à chaque itération.',
        options: [
          'Régler la taille des pas vers le minimum de l’erreur',
          'Augmenter aléatoirement la variance',
          'Supprimer les données manquantes',
          'Fixer le nombre de tables SQL',
        ],
        correctAnswer: 'Régler la taille des pas vers le minimum de l’erreur',
        numericTolerance: 0,
        explanation: 'w_{t+1} = w_t - η · ∇L(w_t) : η règle la vitesse et la stabilité de convergence.',
        xpValue: 85,
      },
    ],
  },
];

export const SEED_BADGES = [
  {
    slug: 'premier-pas',
    title: 'Premier Pas',
    description: 'Compléter votre tout premier exercice validé sur la plateforme.',
    iconName: 'Award',
    xpThreshold: 35,
    conditionType: 'xp',
  },
  {
    slug: 'geometre-3d',
    title: 'Géomètre 3D',
    description: 'Atteindre 250 XP cumulés dans les ateliers et quiz.',
    iconName: 'Box',
    xpThreshold: 250,
    conditionType: 'xp',
  },
  {
    slug: 'maitre-chapitre',
    title: 'Chapitre Maîtrisé',
    description: 'Compléter à 100 % au moins 1 chapitre complet de mathématiques.',
    iconName: 'CheckCircle2',
    xpThreshold: 1,
    conditionType: 'chapters_completed',
  },
  {
    slug: 'polytechnicien',
    title: 'Esprit Analytique',
    description: 'Compléter 3 chapitres avec succès et dépasser 500 XP.',
    iconName: 'Compass',
    xpThreshold: 3,
    conditionType: 'chapters_completed',
  },
  {
    slug: 'oracle-bayesien',
    title: 'Oracle Bayésien',
    description: 'Atteindre une probabilité de réussite prédite ≥ 85 % sur un chapitre.',
    iconName: 'TrendingUp',
    xpThreshold: 85,
    conditionType: 'prediction_master',
  },
  {
    slug: 'collaborateur',
    title: 'Pair Solidaire',
    description: 'Participer à l’entraide étudiante dans un salon de discussion.',
    iconName: 'MessageSquare',
    xpThreshold: 1,
    conditionType: 'collaboration',
  },
];

export const SEED_ROOMS = [
  {
    slug: 'entraide-college',
    name: 'Entraide Collège (6ᵉ – 3ᵉ)',
    gradeLevel: '6e-3e',
    topic: 'Fractions, Pythagore, Thalès et Trigonométrie',
  },
  {
    slug: 'entraide-lycee',
    name: 'Entraide Lycée (2nde – Term)',
    gradeLevel: '2nde-terminale',
    topic: 'Vecteurs, Dérivation, Intégrales et Prédiction',
  },
  {
    slug: 'labo-prediction',
    name: 'Atelier Prédiction & Algo',
    gradeLevel: 'terminale',
    topic: 'Modèles bayésiens, EWMA et descente de gradient',
  },
];

export const ALL_SEED_CHAPTERS: SeedChapter[] = [
  ...SEED_CHAPTERS,
  ...PHYSICS_CHAPTERS,
  ...SVT_CHAPTERS,
  ...HG_CHAPTERS,
  ...FRENCH_CHAPTERS,
  ...ENGLISH_CHAPTERS,
];
export const EXAM_BADGES = [
  {
    slug: 'laureat-examen',
    title: 'Lauréat d’examen blanc',
    description: 'Obtenir au moins 14/20 (Mention Bien ou Très Bien) à un examen blanc Brevet ou Bac.',
    iconName: 'Medal',
    xpThreshold: 14,
    conditionType: 'exam_honors',
  },
];

export const FLASHCARD_BADGES = [
  {
    slug: 'memoire-durable',
    title: 'Mémoire durable',
    description: 'Maîtriser 15 flashcards en répétition espacée à travers vos chapitres.',
    iconName: 'Brain',
    xpThreshold: 15,
    conditionType: 'flashcards_mastered',
  },
];

export const ALL_SEED_BADGES = [
  ...SEED_BADGES,
  ...PHYSICS_BADGES,
  ...SVT_BADGES,
  ...HG_BADGES,
  ...FRENCH_BADGES,
  ...ENGLISH_BADGES,
  ...EXAM_BADGES,
  ...FLASHCARD_BADGES,
];
export const ALL_SEED_ROOMS = [
  ...SEED_ROOMS,
  ...PHYSICS_ROOMS,
  ...SVT_ROOMS,
  ...HG_ROOMS,
  ...FRENCH_ROOMS,
  ...ENGLISH_ROOMS,
];
