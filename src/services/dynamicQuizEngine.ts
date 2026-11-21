import type { ChapterItem, SubjectId } from '../types/learning.ts';
import { evaluateExerciseAnswer } from './predictionEngine.ts';

export type QuizDifficulty = 'decouverte' | 'standard' | 'defi';
export type QuizMode = 'mixte' | 'qcm' | 'numerique';
export type QuestionOrigin = 'parametric' | 'formula_synthesis' | 'chapter_exercise';

export interface GeneratedQuizQuestion {
  id: string;
  chapterId: number;
  chapterSlug: string;
  chapterTitle: string;
  subject: SubjectId;
  gradeLevel: string;
  origin: QuestionOrigin;
  exerciseType: 'quiz' | 'practice';
  prompt: string;
  hint: string;
  options: string[] | null;
  correctAnswer: string;
  numericTolerance: number;
  explanation: string;
  baseXp: number;
}

export interface PublicQuizQuestion {
  id: string;
  chapterId: number;
  chapterSlug: string;
  chapterTitle: string;
  subject: SubjectId;
  gradeLevel: string;
  origin: QuestionOrigin;
  exerciseType: 'quiz' | 'practice';
  prompt: string;
  hint: string;
  options: string[] | null;
  baseXp: number;
}

export interface XpBreakdown {
  baseXp: number;
  streakBonus: number;
  speedBonus: number;
  completionBonus: number;
  totalXp: number;
}

export interface DynamicQuizConfig {
  questionCount: number;
  difficulty: QuizDifficulty;
  mode: QuizMode;
}

export interface SeedChapterExerciseRef {
  chapterId: number;
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

const DIFFICULTY_BASE_XP: Record<QuizDifficulty, number> = {
  decouverte: 25,
  standard: 40,
  defi: 60,
};

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatNum(n: number, decimals = 2): string {
  const fixed = Number(n.toFixed(decimals));
  return String(fixed);
}

function makeNumericOptions(correct: number, unit = '', decimals = 2): string[] {
  const set = new Set<string>();
  const label = (v: number) => `${formatNum(v, decimals)}${unit ? ' ' + unit : ''}`;
  set.add(label(correct));
  const multipliers = [0.5, 1.5, 2, 0.75, 1.25, 0.25, 3];
  const offsets = [1, -1, 2, -2, 5, -5, 10];
  let guard = 0;
  while (set.size < 4 && guard < 40) {
    guard++;
    const candidate =
      Math.abs(correct) >= 2 && Math.random() > 0.4
        ? correct * pick(multipliers)
        : correct + pick(offsets);
    if (Number.isFinite(candidate) && candidate >= 0 && Math.abs(candidate - correct) > 0.05) {
      set.add(label(candidate));
    }
  }
  while (set.size < 4) {
    set.add(label(Math.abs(correct) + set.size * 2 + 1));
  }
  return shuffle(Array.from(set));
}

function buildParametricQuestion(
  chapter: ChapterItem,
  difficulty: QuizDifficulty,
  preferQcm: boolean,
  uid: string
): GeneratedQuizQuestion | null {
  const baseXp = DIFFICULTY_BASE_XP[difficulty];
  const mult = difficulty === 'defi' ? 2 : difficulty === 'standard' ? 1 : 1;
  const preset = chapter.scenePreset;

  const wrapNumeric = (
    prompt: string,
    hint: string,
    val: number,
    tolerance: number,
    explanation: string,
    unit = '',
    decimals = 2
  ): GeneratedQuizQuestion => {
    const correctStr = preferQcm
      ? `${formatNum(val, decimals)}${unit ? ' ' + unit : ''}`
      : formatNum(val, decimals);
    return {
      id: uid,
      chapterId: chapter.id,
      chapterSlug: chapter.slug,
      chapterTitle: chapter.title,
      subject: chapter.subject || 'mathematics',
      gradeLevel: chapter.gradeLevel,
      origin: 'parametric',
      exerciseType: preferQcm ? 'quiz' : 'practice',
      prompt,
      hint,
      options: preferQcm ? makeNumericOptions(val, unit, decimals) : null,
      correctAnswer: correctStr,
      numericTolerance: preferQcm ? 0 : tolerance,
      explanation,
      baseXp,
    };
  };

  switch (preset) {
    // ===== MATHÉMATIQUES =====
    case 'fractions_3d': {
      const denom = pick([4, 5, 8, 10, 20]);
      const num = randInt(1, denom - 1);
      const val = num / denom;
      return wrapNumeric(
        `Convertis la fraction ${num}/${denom} en écriture décimale.`,
        `Divise le numérateur ${num} par le dénominateur ${denom}.`,
        val,
        0.01,
        `${num} ÷ ${denom} = ${formatNum(val, 3)} (soit ${Math.round(val * 100)} %).`,
        '',
        3
      );
    }
    case 'volumes_6e': {
      const L = randInt(3, 8 * mult);
      const l = randInt(2, 6);
      const h = randInt(2, 7);
      const vol = L * l * h;
      return wrapNumeric(
        `Un pavé droit mesure L = ${L} cm, l = ${l} cm et h = ${h} cm. Quel est son volume V en cm³ ?`,
        `Multiplie les trois dimensions : V = L × l × h.`,
        vol,
        0.1,
        `V = ${L} × ${l} × ${h} = ${vol} cm³.`,
        'cm³',
        0
      );
    }
    case 'symetrie_3d': {
      const x = randInt(2, 12);
      const y = randInt(-6, 8);
      return wrapNumeric(
        `Le point A(${x} ; ${y}) subit une symétrie axiale par rapport à l’axe des ordonnées (x = 0). Quelle est la distance AA’ entre A et son image A’ ?`,
        `A’ a pour abscisse -${x}, donc la distance horizontale vaut 2 × ${x}.`,
        2 * x,
        0.05,
        `A’(-${x} ; ${y}), la distance vaut ${x} - (-${x}) = ${2 * x}.`,
        'unités',
        0
      );
    }
    case 'proportionnalite_5e': {
      const k = randInt(3, 9);
      const x1 = randInt(2, 5);
      const x2 = randInt(6, 12);
      const y1 = k * x1;
      const y2 = k * x2;
      return wrapNumeric(
        `Dans un tableau de proportionnalité, ${x1} objets coûtent ${y1} €. Combien coûtent ${x2} objets identiques (en €) ?`,
        `Trouve le prix unitaire k = ${y1} / ${x1} puis multiplie par ${x2}.`,
        y2,
        0.1,
        `Le coefficient de proportionnalité est k = ${k} €/objet, donc ${x2} × ${k} = ${y2} €.`,
        '€',
        0
      );
    }
    case 'angles_5e': {
      const a1 = randInt(25, 85);
      const a2 = randInt(25, 145 - a1);
      const a3 = 180 - a1 - a2;
      return wrapNumeric(
        `Dans un triangle ABC, l’angle Â mesure ${a1}° et l’angle B̂ mesure ${a2}°. Quelle est la mesure de l’angle Ĉ en degrés ?`,
        `La somme des trois angles d’un triangle vaut toujours 180°.`,
        a3,
        0.1,
        `Ĉ = 180° - (${a1}° + ${a2}°) = ${a3}°.`,
        '°',
        0
      );
    }
    case 'prisme_5e': {
      const baseArea = randInt(8, 25);
      const h = randInt(4, 11);
      const vol = baseArea * h;
      return wrapNumeric(
        `Un prisme droit possède une base d’aire B = ${baseArea} cm² et une hauteur h = ${h} cm. Quel est son volume en cm³ ?`,
        `Applique V = B × h.`,
        vol,
        0.1,
        `V = ${baseArea} × ${h} = ${vol} cm³.`,
        'cm³',
        0
      );
    }
    case 'pythagore_4e': {
      const triple = pick([
        [3, 4, 5],
        [6, 8, 10],
        [5, 12, 13],
        [8, 15, 17],
        [9, 12, 15],
      ]);
      const [a, b, c] = triple;
      return wrapNumeric(
        `Un triangle rectangle possède deux côtés de l’angle droit mesurant a = ${a} cm et b = ${b} cm. Quelle est la longueur de l’hypoténuse c (en cm) ?`,
        `Calcule √(a² + b²) = √(${a * a} + ${b * b}).`,
        c,
        0.05,
        `c² = ${a}² + ${b}² = ${a * a + b * b}, donc c = √${c * c} = ${c} cm.`,
        'cm',
        0
      );
    }
    case 'pyramide_4e': {
      const side = pick([3, 6, 9, 12]);
      const h = randInt(4, 10);
      const vol = (side * side * h) / 3;
      return wrapNumeric(
        `Une pyramide régulière a une base carrée de côté ${side} cm et une hauteur h = ${h} cm. Quel est son volume V en cm³ ?`,
        `V = (Aire_base × h) / 3 = (${side}² × ${h}) / 3.`,
        vol,
        0.1,
        `V = (${side * side} × ${h}) / 3 = ${vol} cm³.`,
        'cm³',
        0
      );
    }
    case 'calcul_litteral_4e': {
      const a = randInt(2, 7);
      const x = randInt(2, 10);
      const b = randInt(3, 15);
      const rhs = a * x + b;
      return wrapNumeric(
        `Résous l’équation du premier degré : ${a}x + ${b} = ${rhs}. Quelle est la valeur de x ?`,
        `Isole ${a}x = ${rhs} - ${b}, puis divise par ${a}.`,
        x,
        0.02,
        `${a}x = ${rhs - b} ⇒ x = ${rhs - b} / ${a} = ${x}.`,
        '',
        0
      );
    }
    case 'thales_3e': {
      const k = pick([1.5, 2, 2.5, 3]);
      const am = randInt(2, 6);
      const mn = randInt(3, 8);
      const ab = am * k;
      const bc = mn * k;
      return wrapNumeric(
        `En configuration de Thalès (MN // BC), on mesure AM = ${am} cm, AB = ${ab} cm et MN = ${mn} cm. Quelle est la longueur BC (en cm) ?`,
        `Utilise le rapport d’agrandissement k = AB / AM = ${ab} / ${am}.`,
        bc,
        0.05,
        `BC = MN × (AB / AM) = ${mn} × ${k} = ${bc} cm.`,
        'cm',
        1
      );
    }
    case 'trigonometrie_3e': {
      const hyp = pick([6, 8, 10, 12, 14, 20]);
      const isCos60 = Math.random() > 0.5;
      const val = hyp * 0.5;
      return wrapNumeric(
        isCos60
          ? `Dans un triangle rectangle d’hypoténuse ${hyp} cm et d’angle aigu 60° (cos 60° = 0,5), quelle est la longueur du côté adjacent (en cm) ?`
          : `Dans un triangle rectangle d’hypoténuse ${hyp} cm et d’angle aigu 30° (sin 30° = 0,5), quelle est la longueur du côté opposé (en cm) ?`,
        isCos60 ? `Adjacent = Hypoténuse × cos(60°).` : `Opposé = Hypoténuse × sin(30°).`,
        val,
        0.05,
        `${hyp} × 0,5 = ${val} cm.`,
        'cm',
        1
      );
    }
    case 'sphere_3e': {
      const pair = pick([
        [5, 3, 4],
        [5, 4, 3],
        [10, 6, 8],
        [13, 5, 12],
      ]);
      const [R, d, rSec] = pair;
      return wrapNumeric(
        `Une sphère de rayon R = ${R} cm est coupée par un plan situé à la distance d = ${d} cm de son centre. Quel est le rayon r du cercle de section (en cm) ?`,
        `Applique Pythagore : r = √(R² - d²).`,
        rSec,
        0.05,
        `r = √(${R}² - ${d}²) = √(${R * R - d * d}) = ${rSec} cm.`,
        'cm',
        0
      );
    }
    case 'vecteurs_2nde': {
      const triple = pick([
        [3, 4, 5],
        [6, 8, 10],
        [5, 12, 13],
      ]);
      const [ux, uy, norm] = triple;
      return wrapNumeric(
        `Soit le vecteur u(${ux} ; ${uy}) dans un repère orthonormé. Quelle est sa norme ||u|| ?`,
        `||u|| = √(x² + y²).`,
        norm,
        0.05,
        `||u|| = √(${ux}² + ${uy}²) = √${ux * ux + uy * uy} = ${norm}.`,
        '',
        0
      );
    }
    case 'parabole_2nde': {
      const a = randInt(1, 3);
      const alpha = randInt(1, 5);
      const b = -2 * a * alpha;
      const c = randInt(-4, 6);
      return wrapNumeric(
        `Soit la fonction polynôme f(x) = ${a}x² ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)}. Quelle est l’abscisse α du sommet de sa parabole ?`,
        `Utilise α = -b / (2a).`,
        alpha,
        0.02,
        `α = -(${b}) / (2 × ${a}) = ${-b} / ${2 * a} = ${alpha}.`,
        '',
        1
      );
    }
    case 'statistiques_2nde': {
      const n1 = randInt(8, 14);
      const n2 = randInt(10, 16);
      const n3 = randInt(12, 18);
      const n4 = randInt(10, 20);
      const mean = (n1 + n2 + n3 + n4) / 4;
      return wrapNumeric(
        `Calcule la moyenne arithmétique de la série de notes suivante : ${n1} ; ${n2} ; ${n3} ; ${n4}.`,
        `Additionne les 4 valeurs et divise par 4.`,
        mean,
        0.05,
        `(${n1} + ${n2} + ${n3} + ${n4}) / 4 = ${n1 + n2 + n3 + n4} / 4 = ${formatNum(mean, 2)}.`,
        '',
        2
      );
    }
    case 'derivation_1ere': {
      const a = randInt(1, 4);
      const b = randInt(1, 6);
      const x0 = randInt(1, 4);
      const deriv = 2 * a * x0 + b;
      return wrapNumeric(
        `Soit f(x) = ${a}x² + ${b}x - 3. Que vaut le nombre dérivé f’(${x0}) (pente de la tangente en x = ${x0}) ?`,
        `Dérive d’abord f’(x) = ${2 * a}x + ${b}, puis remplace x par ${x0}.`,
        deriv,
        0.05,
        `f’(x) = ${2 * a}x + ${b}, donc f’(${x0}) = ${2 * a} × ${x0} + ${b} = ${deriv}.`,
        '',
        0
      );
    }
    case 'produit_scalaire_1ere': {
      const ux = randInt(1, 6);
      const uy = randInt(-4, 5);
      const vx = randInt(1, 6);
      const vy = randInt(-4, 5);
      const dot = ux * vx + uy * vy;
      return wrapNumeric(
        `Calcule le produit scalaire u · v pour u(${ux} ; ${uy}) et v(${vx} ; ${vy}).`,
        `u · v = x_u · x_v + y_u · y_v.`,
        dot,
        0.05,
        `u · v = (${ux})×(${vx}) + (${uy})×(${vy}) = ${ux * vx} + (${uy * vy}) = ${dot}.`,
        '',
        0
      );
    }
    case 'probabilites_1ere': {
      const pA = pick([0.2, 0.4, 0.5, 0.8]);
      const pCond = pick([0.25, 0.5, 0.75, 0.6]);
      const pInter = Number((pA * pCond).toFixed(3));
      return wrapNumeric(
        `On sait que P(A) = ${pA} et P(A ∩ B) = ${pInter}. Quelle est la probabilité conditionnelle P_A(B) ?`,
        `Applique P_A(B) = P(A ∩ B) / P(A).`,
        pCond,
        0.01,
        `P_A(B) = ${pInter} / ${pA} = ${pCond}.`,
        '',
        2
      );
    }
    case 'integrales_term': {
      const k = randInt(1, 3);
      const b = randInt(2, 3);
      const exact = k * Math.pow(b, 3);
      return wrapNumeric(
        `Calcule la valeur exacte de l’intégrale ∫₀^${b} ${3 * k}x² dx.`,
        `Une primitive de ${3 * k}x² est F(x) = ${k}x³.`,
        exact,
        0.05,
        `[${k}x³]₀^${b} = ${k} × ${b}³ - 0 = ${exact}.`,
        '',
        0
      );
    }
    case 'geometrie_espace_term': {
      const ux = randInt(1, 4);
      const uy = randInt(1, 4);
      const uz = randInt(1, 4);
      const vx = randInt(1, 3);
      const vy = randInt(-3, 3);
      const vz = randInt(1, 3);
      const dot = ux * vx + uy * vy + uz * vz;
      return wrapNumeric(
        `Dans l’espace 3D orthonormé, calcule le produit scalaire u · v pour u(${ux} ; ${uy} ; ${uz}) et v(${vx} ; ${vy} ; ${vz}).`,
        `Calcule x·x’ + y·y’ + z·z’.`,
        dot,
        0.05,
        `u · v = ${ux}×${vx} + ${uy}×(${vy}) + ${uz}×${vz} = ${dot}.`,
        '',
        0
      );
    }
    case 'prediction_term': {
      const alpha = pick([0.2, 0.4, 0.5]);
      const prev = pick([40, 60, 80]);
      const obs = 100;
      const nextVal = alpha * obs + (1 - alpha) * prev;
      return wrapNumeric(
        `Un filtre EWMA (α = ${alpha}) a un score précédent S_t = ${prev} %. L’élève réussit la question suivante (x = 100 %). Que vaut le nouveau score S_{t+1} (en %) ?`,
        `S_{t+1} = α × 100 + (1 - α) × S_t.`,
        nextVal,
        0.1,
        `S_{t+1} = ${alpha}×100 + ${(1 - alpha).toFixed(1)}×${prev} = ${formatNum(nextVal, 1)} %.`,
        '%',
        1
      );
    }

    // ===== PHYSIQUE-CHIMIE =====
    case 'pc_states_matter': {
      const rho = pick([0.8, 1.0, 2.7, 7.8, 8.9]);
      const vol = randInt(10, 40);
      const mass = Number((rho * vol).toFixed(1));
      return wrapNumeric(
        `Un échantillon de volume V = ${vol} cm³ a une masse m = ${mass} g. Quelle est sa masse volumique ρ en g/cm³ ?`,
        `Applique ρ = m / V.`,
        rho,
        0.05,
        `ρ = ${mass} / ${vol} = ${rho} g/cm³.`,
        'g/cm³',
        2
      );
    }
    case 'pc_circuit_3d': {
      const R = pick([10, 20, 25, 40, 50, 100]);
      const I = pick([0.1, 0.2, 0.25, 0.4, 0.5]);
      const U = Number((R * I).toFixed(2));
      return wrapNumeric(
        `Un conducteur ohmique de résistance R = ${R} Ω est traversé par un courant d’intensité I = ${I} A. Quelle est la tension U à ses bornes (en V) ?`,
        `Applique la loi d’Ohm : U = R × I.`,
        U,
        0.05,
        `U = ${R} × ${I} = ${U} V.`,
        'V',
        2
      );
    }
    case 'pc_optics_3d': {
      const n = pick([1.2, 1.5, 2.0, 2.4]);
      const vKmS = Math.round(300000 / n);
      return wrapNumeric(
        `Dans un milieu transparent d’indice optique n = ${n} (avec c = 300 000 km/s), quelle est la vitesse v de la lumière en km/s ?`,
        `Utilise v = c / n.`,
        vKmS,
        500,
        `v = 300 000 / ${n} = ${vKmS} km/s.`,
        'km/s',
        0
      );
    }
    case 'pc_molecule_3d': {
      const molar = pick([
        { name: 'eau (H₂O)', M: 18 },
        { name: 'méthane (CH₄)', M: 16 },
        { name: 'dioxyde de carbone (CO₂)', M: 44 },
        { name: 'dioxygène (O₂)', M: 32 },
      ]);
      const nMol = pick([0.5, 1.5, 2, 3, 4, 5]);
      const mass = molar.M * nMol;
      return wrapNumeric(
        `Quelle quantité de matière n (en mol) contient un échantillon de ${mass} g de ${molar.name} sachant que sa masse molaire vaut M = ${molar.M} g/mol ?`,
        `Calcule n = m / M.`,
        nMol,
        0.05,
        `n = ${mass} / ${molar.M} = ${nMol} mol.`,
        'mol',
        2
      );
    }
    case 'pc_atom_3d': {
      if (chapter.gradeLevel === 'terminale') {
        const k = randInt(2, 4);
        const nFinal = randInt(1, 4) * 50;
        const n0 = nFinal * Math.pow(2, k);
        const halfLife = pick([5, 10, 15, 20]);
        const elapsed = halfLife * k;
        return wrapNumeric(
          `Un échantillon radioactif compte initialement N₀ = ${n0} noyaux avec une demi-vie t₁/₂ = ${halfLife} min. Combien de noyaux reste-t-il après ${elapsed} min ?`,
          `${elapsed} min correspond à ${k} demi-vies : divise N₀ par 2^${k}.`,
          nFinal,
          1,
          `Après ${k} demi-vies, N = ${n0} / 2^${k} = ${n0} / ${Math.pow(2, k)} = ${nFinal} noyaux.`,
          'noyaux',
          0
        );
      }
      const Z = randInt(6, 20);
      const N = Z + randInt(0, 4);
      const A = Z + N;
      return wrapNumeric(
        `Un noyau atomique possède A = ${A} nucléons et un numéro atomique Z = ${Z} protons. Combien de neutrons contient-il ?`,
        `Utilise N = A - Z.`,
        N,
        0,
        `N = ${A} - ${Z} = ${N} neutrons.`,
        'neutrons',
        0
      );
    }
    case 'pc_gravity_3d': {
      const m = randInt(4, 25);
      const g = pick([1.6, 3.7, 9.8, 10]);
      const planet =
        g === 1.6 ? 'la Lune' : g === 3.7 ? 'Mars' : 'la Terre';
      const P = Number((m * g).toFixed(1));
      return wrapNumeric(
        `Un instrument scientifique de masse m = ${m} kg est posé sur ${planet} (g = ${g} N/kg). Quel est son poids P en newtons ?`,
        `Applique P = m × g.`,
        P,
        0.2,
        `P = ${m} × ${g} = ${P} N.`,
        'N',
        1
      );
    }
    case 'pc_wave_3d': {
      const v = pick([340, 1500]);
      const milieu = v === 340 ? 'l’air' : 'l’eau';
      const f = v === 340 ? pick([170, 340, 680, 1700]) : pick([500, 750, 1500, 3000]);
      const lambda = Number((v / f).toFixed(2));
      return wrapNumeric(
        `Une onde sonore de fréquence f = ${f} Hz se propage dans ${milieu} à la célérité v = ${v} m/s. Quelle est sa longueur d’onde λ en mètres ?`,
        `Applique λ = v / f.`,
        lambda,
        0.02,
        `λ = ${v} / ${f} = ${lambda} m.`,
        'm',
        2
      );
    }
    case 'pc_projectile_3d': {
      if (chapter.gradeLevel === '6e') {
        const v = pick([12, 15, 20, 25, 30]);
        const t = randInt(2, 6);
        const d = v * t;
        return wrapNumeric(
          `Un mobile parcourt d = ${d} km en t = ${t} h à vitesse constante. Quelle est sa vitesse moyenne en km/h ?`,
          `v = d / t.`,
          v,
          0.1,
          `v = ${d} / ${t} = ${v} km/h.`,
          'km/h',
          0
        );
      }
      if (chapter.gradeLevel === 'terminale') {
        const v0 = pick([10, 20, 30]);
        const g = 10;
        const range = (v0 * v0) / g;
        return wrapNumeric(
          `Un projectile est lancé du sol à v₀ = ${v0} m/s sous un angle optimal α = 45° (sin 90° = 1, g = 10 m/s²). Quelle est sa portée horizontale X_max en mètres ?`,
          `X_max = (v₀² × sin 2α) / g = ${v0}² / 10.`,
          range,
          0.5,
          `X_max = ${v0 * v0} / 10 = ${range} m.`,
          'm',
          0
        );
      }
      const m = pick([2, 4, 6, 10]);
      const v = pick([4, 5, 6, 8, 10]);
      const ec = 0.5 * m * v * v;
      return wrapNumeric(
        `Un objet de masse m = ${m} kg se déplace à la vitesse v = ${v} m/s. Quelle est son énergie cinétique Ec en joules ?`,
        `Ec = ½ × m × v².`,
        ec,
        0.5,
        `Ec = 0,5 × ${m} × ${v}² = 0,5 × ${m} × ${v * v} = ${ec} J.`,
        'J',
        0
      );
    }
    case 'pc_titration_3d': {
      const va = pick([10, 20, 25]);
      const cb = pick([0.1, 0.2]);
      const ve = pick([10, 15, 20]);
      const ca = Number(((cb * ve) / va).toFixed(3));
      return wrapNumeric(
        `On titre V_A = ${va} mL d’acide par une base à C_B = ${cb} mol/L. L’équivalence est repérée à V_E = ${ve} mL. Quelle est la concentration C_A (en mol/L) ?`,
        `À l’équivalence : C_A = (C_B × V_E) / V_A.`,
        ca,
        0.005,
        `C_A = (${cb} × ${ve}) / ${va} = ${formatNum(ca, 3)} mol/L.`,
        'mol/L',
        3
      );
    }

    // ===== SCIENCES DE LA VIE ET DE LA TERRE (SVT) =====
    case 'svt_cell_3d': {
      const oc = pick([5, 10, 15]);
      const obj = pick([10, 20, 40, 60, 100]);
      const g = oc * obj;
      return wrapNumeric(
        `Au microscope optique, on observe une cellule végétale avec un oculaire ×${oc} et un objectif ×${obj}. Quel est le grossissement total G ?`,
        `Multiplie le grossissement de l’oculaire (${oc}) par celui de l’objectif (${obj}).`,
        g,
        0,
        `G = G_oculaire × G_objectif = ${oc} × ${obj} = ${g}.`,
        '×',
        0
      );
    }
    case 'svt_dna_3d': {
      const pctA = randInt(16, 34);
      const pctG = 50 - pctA;
      return wrapNumeric(
        `Dans une molécule d’ADN double brin, l’analyse biochimique révèle ${pctA} % d’Adénine (A). D’après la règle de complémentarité (A = T et G = C), quel est le pourcentage de Guanine (G) ?`,
        `Comme A = T = ${pctA} %, on a A + T = ${pctA * 2} %. Divise le reste (100 − ${pctA * 2}) par 2.`,
        pctG,
        0.1,
        `A = T = ${pctA} % ⇒ G + C = ${100 - pctA * 2} % ⇒ G = C = ${pctG} %.`,
        '%',
        0
      );
    }
    case 'svt_tectonics_3d': {
      const speed = pick([2, 2.5, 3, 4, 5, 6]);
      const millionsYears = pick([5, 10, 15, 20, 25]);
      const distKm = speed * 10 * millionsYears;
      return wrapNumeric(
        `Deux plaques lithosphériques divergent à une dorsale à la vitesse v = ${formatNum(speed, 1)} cm/an. De quelle distance (en km) se sont-elles écartées en ${millionsYears} millions d’années ?`,
        `1 cm/an pendant 1 million d’années = 10 km. Calcule ${formatNum(speed, 1)} × 10 × ${millionsYears}.`,
        distKm,
        1,
        `d = ${formatNum(speed, 1)} × 10 × ${millionsYears} = ${distKm} km.`,
        'km',
        0
      );
    }
    case 'svt_ecosystem_3d': {
      const baseKg = pick([500, 800, 1000, 1500, 2000, 3000]);
      const herbKg = baseKg / 10;
      return wrapNumeric(
        `Selon la règle de transfert énergétique (10 % par niveau trophique), si les producteurs primaires (végétaux) représentent ${baseKg} kg de biomasse, quelle biomasse (en kg) est transmise aux consommateurs primaires (herbivores) ?`,
        `Calcule 10 % de ${baseKg} kg (divise par 10).`,
        herbKg,
        0.5,
        `${baseKg} × 0,10 = ${herbKg} kg de biomasse transmise.`,
        'kg',
        0
      );
    }
    case 'svt_organ_3d': {
      const fc = pick([60, 70, 80, 90, 120, 140]);
      const ves = pick([70, 75, 80, 85, 90]);
      const qcMl = fc * ves;
      return wrapNumeric(
        `Un sportif présente une fréquence cardiaque FC = ${fc} battements/min et un volume d’éjection systolique VES = ${ves} mL. Calcule son débit cardiaque Qc = FC × VES en mL/min.`,
        `Multiplie ${fc} × ${ves}.`,
        qcMl,
        5,
        `Qc = ${fc} × ${ves} = ${qcMl} mL/min (soit ${formatNum(qcMl / 1000, 2)} L/min).`,
        'mL/min',
        0
      );
    }
    case 'svt_neuron_3d': {
      const distM = pick([0.6, 0.8, 1.0, 1.2, 1.5, 1.8]);
      const speedMs = pick([40, 50, 60, 80, 100]);
      const timeMs = Math.round((distM / speedMs) * 1000);
      return wrapNumeric(
        `Un message nerveux parcourt une fibre myélinisée de longueur d = ${formatNum(distM, 1)} m à la vitesse v = ${speedMs} m/s. Quelle est la durée du trajet en millisecondes (ms) ?`,
        `Calcule t = (d / v) × 1000.`,
        timeMs,
        0.5,
        `t = (${formatNum(distM, 1)} / ${speedMs}) × 1000 = ${timeMs} ms.`,
        'ms',
        0
      );
    }
    case 'svt_climate_3d': {
      const albedoPct = pick([20, 25, 30, 35, 40]);
      const pInc = 340;
      const pAbs = Math.round(pInc * (1 - albedoPct / 100));
      return wrapNumeric(
        `La puissance solaire incidente moyenne vaut 340 W/m². Si l’albédo planétaire vaut ${albedoPct} %, quelle puissance moyenne (en W/m²) est absorbée par le système Terre-atmosphère ?`,
        `Calcule 340 × (1 − ${albedoPct}/100).`,
        pAbs,
        1,
        `P_abs = 340 × ${(100 - albedoPct) / 100} = ${pAbs} W/m².`,
        'W/m²',
        0
      );
    }

    // ===== HISTOIRE-GÉOGRAPHIE =====
    case 'hg_monument_3d': {
      const year = pick([476, 800, 1095, 1453, 1492, 1515, 1661, 1789, 1848, 1914]);
      const century = Math.floor((year - 1) / 100) + 1;
      return wrapNumeric(
        `En chronologie historique, à quel numéro de siècle (en chiffres arabes, ex: 18 pour le XVIIIᵉ siècle) appartient l’année ${year} ?`,
        `Ajoute 1 au nombre de centaines (sauf pour les années se terminant par 00).`,
        century,
        0,
        `L’année ${year} se situe entre ${(century - 1) * 100 + 1} et ${century * 100} : elle appartient donc au ${century}ᵉ siècle.`,
        'ᵉ siècle',
        0
      );
    }
    case 'hg_city_urban_3d': {
      const pop = pick([120000, 240000, 360000, 450000, 600000, 900000]);
      const area = pick([40, 60, 100, 120, 150, 200]);
      const density = Math.round(pop / area);
      return wrapNumeric(
        `Une métropole compte ${pop.toLocaleString('fr-FR')} habitants sur une superficie de ${area} km². Quelle est sa densité de population (en hab./km²) ?`,
        `Applique Densité = Population / Superficie.`,
        density,
        2,
        `Densité = ${pop} / ${area} = ${density} hab./km².`,
        'hab./km²',
        0
      );
    }
    case 'hg_globe_routes_3d': {
      const speed = pick([20, 25, 30, 40]);
      const hours = pick([12, 18, 24, 30, 48]);
      const distKm = speed * hours;
      return wrapNumeric(
        `Un porte-conteneurs parcourt une route maritime de ${distKm} km à une vitesse moyenne de ${speed} km/h. Quelle est la durée de la traversée en heures ?`,
        `Calcule t = distance / vitesse = ${distKm} / ${speed}.`,
        hours,
        0.5,
        `t = ${distKm} / ${speed} = ${hours} heures.`,
        'h',
        0
      );
    }
    case 'hg_demography_3d': {
      const birthRate = randInt(16, 38);
      const deathRate = randInt(6, 14);
      const naturalGrowth = birthRate - deathRate;
      return wrapNumeric(
        `Dans un pays en transition démographique, le taux de natalité est de ${birthRate} ‰ et le taux de mortalité est de ${deathRate} ‰. Quel est le taux d’accroissement naturel (en ‰) ?`,
        `Accroissement naturel = Taux de natalité − Taux de mortalité.`,
        naturalGrowth,
        0.1,
        `Taux d’accroissement naturel = ${birthRate} ‰ − ${deathRate} ‰ = ${naturalGrowth} ‰.`,
        '‰',
        0
      );
    }
    case 'hg_timeline_3d': {
      const pair = pick([
        { labelA: 'la Révolution française', yA: 1789, labelB: 'l’abolition de l’esclavage en France', yB: 1848 },
        { labelA: 'le déclenchement de la Première Guerre mondiale', yA: 1914, labelB: 'la fin de la Seconde Guerre mondiale', yB: 1945 },
        { labelA: 'le traité de Rome (CEE)', yA: 1957, labelB: 'la chute du mur de Berlin', yB: 1989 },
        { labelA: 'la loi de séparation des Églises et de l’État', yA: 1905, labelB: 'le droit de vote des femmes en France', yB: 1944 },
        { labelA: 'la proclamation de la Vᵉ République', yA: 1958, labelB: 'le traité de Maastricht', yB: 1992 },
      ]);
      const span = pair.yB - pair.yA;
      return wrapNumeric(
        `Combien d’années séparent ${pair.labelA} (${pair.yA}) de ${pair.labelB} (${pair.yB}) ?`,
        `Calcule l’écart chronologique ${pair.yB} − ${pair.yA}.`,
        span,
        0,
        `${pair.yB} − ${pair.yA} = ${span} ans.`,
        'ans',
        0
      );
    }
    case 'hg_industry_3d': {
      const primary = randInt(2, 12);
      const secondary = randInt(15, 32);
      const tertiary = 100 - primary - secondary;
      return wrapNumeric(
        `Dans une économie développée, le secteur primaire représente ${primary} % des emplois et le secteur secondaire (industrie) ${secondary} %. Quelle est la part du secteur tertiaire (services) en % ?`,
        `La somme des trois secteurs vaut 100 % : calcule 100 − (${primary} + ${secondary}).`,
        tertiary,
        0.1,
        `Secteur tertiaire = 100 − (${primary} + ${secondary}) = ${tertiary} %.`,
        '%',
        0
      );
    }
    case 'hg_geopolitics_3d': {
      const scaleKmPerCm = pick([2, 5, 10, 25, 50]);
      const mapCm = randInt(3, 12);
      const realKm = scaleKmPerCm * mapCm;
      const scaleDenom = (scaleKmPerCm * 100000).toLocaleString('fr-FR');
      return wrapNumeric(
        `Sur une carte géopolitique à l’échelle 1 : ${scaleDenom} (1 cm = ${scaleKmPerCm} km), deux capitales sont distantes de ${mapCm} cm. Quelle distance réelle (en km) les sépare ?`,
        `Multiplie la distance mesurée sur la carte (${mapCm} cm) par ${scaleKmPerCm} km/cm.`,
        realKm,
        0.5,
        `Distance réelle = ${mapCm} × ${scaleKmPerCm} = ${realKm} km.`,
        'km',
        0
      );
    }

    // ===== FRANÇAIS, LITTÉRATURE & PHILOSOPHIE =====
    case 'fr_syntax_3d': {
      const clauses = randInt(2, 5);
      const examples: Record<number, string> = {
        2: '« Le soleil se lève et les oiseaux chantent. »',
        3: '« L’élève lit le texte, il repère les verbes car l’exercice commence. »',
        4: '« Nous arrivons au théâtre, les lumières s’éteignent, le rideau se lève et le public applaudit. »',
        5: '« Elle ouvre son cahier, elle relit la consigne, elle rédige un plan, elle vérifie l’accord et elle conclut. »',
      };
      return wrapNumeric(
        `Combien de propositions (autant que de verbes conjugués) comporte cette phrase : ${examples[clauses]} ?`,
        `Compte chaque verbe conjugué dans la phrase.`,
        clauses,
        0,
        `La phrase contient exactement ${clauses} verbes conjugués, donc ${clauses} propositions.`,
        'propositions',
        0
      );
    }
    case 'fr_narrative_3d': {
      const item = pick([
        { title: 'Yvain de Chrétien de Troyes', year: 1177 },
        { title: 'Les Fables de La Fontaine', year: 1668 },
        { title: 'Candide de Voltaire', year: 1759 },
        { title: 'Madame Bovary de Flaubert', year: 1857 },
        { title: 'Germinal d’Émile Zola', year: 1885 },
        { title: 'L’Étranger d’Albert Camus', year: 1942 },
      ]);
      const century = Math.floor((item.year - 1) / 100) + 1;
      return wrapNumeric(
        `L’œuvre « ${item.title} » a été publiée en ${item.year}. À quel numéro de siècle (en chiffres arabes, ex: 19 pour XIXᵉ) appartient-elle ?`,
        `Ajoute 1 au nombre de centaines de l’année ${item.year}.`,
        century,
        0,
        `${item.year} se situe dans le ${century}ᵉ siècle.`,
        'ᵉ siècle',
        0
      );
    }
    case 'fr_grammar_3d': {
      const persons = 6;
      const tenses = pick([2, 3, 4]);
      const totalForms = persons * tenses;
      return wrapNumeric(
        `Dans un tableau de conjugaison de l’indicatif (6 personnes : je, tu, il/elle, nous, vous, ils/elles), combien de formes conjuguées distinctes doit-on écrire pour réviser ${tenses} temps simples ?`,
        `Multiplie 6 personnes par ${tenses} temps.`,
        totalForms,
        0,
        `6 × ${tenses} = ${totalForms} formes verbales à maîtriser.`,
        'formes',
        0
      );
    }
    case 'fr_theater_3d': {
      const acts = pick([3, 5]);
      const scenesPerAct = randInt(4, 8);
      const totalScenes = acts * scenesPerAct;
      return wrapNumeric(
        `Une pièce de théâtre classique comporte ${acts} actes contenant chacun ${scenesPerAct} scènes. Combien de scènes la pièce compte-t-elle au total ?`,
        `Calcule ${acts} × ${scenesPerAct}.`,
        totalScenes,
        0,
        `${acts} actes × ${scenesPerAct} scènes = ${totalScenes} scènes.`,
        'scènes',
        0
      );
    }
    case 'fr_poetry_3d': {
      const verse = pick([
        { name: 'alexandrins', syl: 12 },
        { name: 'décasyllabes', syl: 10 },
        { name: 'octosyllabes', syl: 8 },
      ]);
      const stanza = pick([
        { name: 'un tercet (3 vers)', lines: 3 },
        { name: 'un quatrain (4 vers)', lines: 4 },
        { name: 'un sizain (6 vers)', lines: 6 },
      ]);
      const totalSyl = verse.syl * stanza.lines;
      return wrapNumeric(
        `En versification française, combien de syllabes compte au total ${stanza.name} composé uniquement d’${verse.name} (${verse.syl} syllabes par vers) ?`,
        `Multiplie ${stanza.lines} vers par ${verse.syl} syllabes.`,
        totalSyl,
        0,
        `${stanza.lines} × ${verse.syl} = ${totalSyl} syllabes.`,
        'syllabes',
        0
      );
    }
    case 'fr_rhetoric_3d': {
      const axes = pick([2, 3]);
      const subParts = pick([2, 3]);
      const totalBlocks = axes * subParts;
      return wrapNumeric(
        `Un plan de commentaire littéraire ou de dissertation comporte ${axes} grands axes, chacun divisé en ${subParts} sous-parties argumentées. Combien de paragraphes de développement structurés cela représente-t-il ?`,
        `Multiplie ${axes} axes × ${subParts} sous-parties.`,
        totalBlocks,
        0,
        `${axes} × ${subParts} = ${totalBlocks} paragraphes argumentés (hors introduction et conclusion).`,
        'paragraphes',
        0
      );
    }
    case 'fr_philo_3d': {
      const pair = pick([
        { a: 'le Discours de la méthode de Descartes', yA: 1637, b: 'Du contrat social de Rousseau', yB: 1762 },
        { a: 'Du contrat social de Rousseau', yA: 1762, b: 'la Critique de la raison pure de Kant', yB: 1781 },
        { a: 'la Critique de la raison pure de Kant', yA: 1781, b: 'L’Être et le Néant de Sartre', yB: 1943 },
        { a: 'L’Interprétation du rêve de Freud', yA: 1900, b: 'L’existentialisme est un humanisme de Sartre', yB: 1946 },
      ]);
      const diff = pair.yB - pair.yA;
      return wrapNumeric(
        `En histoire de la philosophie, combien d’années séparent ${pair.a} (${pair.yA}) de ${pair.b} (${pair.yB}) ?`,
        `Calcule ${pair.yB} − ${pair.yA}.`,
        diff,
        0,
        `${pair.yB} − ${pair.yA} = ${diff} ans.`,
        'ans',
        0
      );
    }

    // ===== ANGLAIS (LV1) =====
    case 'en_tense_3d': {
      const startYear = randInt(2012, 2022);
      const refYear = 2026;
      const duration = refYear - startYear;
      return wrapNumeric(
        `En ${refYear}, un élève écrit au Present Perfect : « I have studied English since ${startYear}. » Pour reformuler avec FOR (« for ___ years »), quel nombre d’années faut-il écrire ?`,
        `Calcule la durée : ${refYear} − ${startYear}.`,
        duration,
        0,
        `De ${startYear} à ${refYear}, la durée vaut ${refYear} − ${startYear} = ${duration} years (« for ${duration} years »).`,
        'years',
        0
      );
    }
    case 'en_syntax_3d': {
      const words = pick([
        { sentence: 'Where do you live in London?', count: 6 },
        { sentence: 'English is spoken by millions of students.', count: 7 },
        { sentence: 'She told us that the story was true.', count: 8 },
        { sentence: 'This historic museum is more interesting than that gallery.', count: 9 },
      ]);
      return wrapNumeric(
        `Analyse la structure de cette phrase anglaise : « ${words.sentence} ». Combien de mots contient-elle au total ?`,
        `Compte chaque mot séparé par un espace.`,
        words.count,
        0,
        `La phrase compte exactement ${words.count} mots.`,
        'words',
        0
      );
    }
    case 'en_modals_3d': {
      const modalItem = pick([
        { expr: 'He must be at home (quasi-certitude)', pct: 95 },
        { expr: 'You should revise tonight (conseil fort)', pct: 75 },
        { expr: 'It may rain later (probabilité moyenne)', pct: 50 },
        { expr: 'She might call us (faible éventualité)', pct: 30 },
      ]);
      const complement = 100 - modalItem.pct;
      return wrapNumeric(
        `Sur l’échelle de certitude des modaux anglais, si « ${modalItem.expr} » est évalué à ${modalItem.pct} % de certitude, quelle part d’incertitude restante (en %) cela laisse-t-il ?`,
        `Calcule 100 − ${modalItem.pct}.`,
        complement,
        0,
        `100 % − ${modalItem.pct} % = ${complement} % d’incertitude.`,
        '%',
        0
      );
    }
    case 'en_vocab_3d': {
      const timeItem = pick([
        { label: 'a quarter past eight', min: 15 },
        { label: 'twenty past nine', min: 20 },
        { label: 'half past ten', min: 30 },
        { label: 'twenty-five past seven', min: 25 },
        { label: 'ten past six', min: 10 },
      ]);
      return wrapNumeric(
        `En anglais, l’heure indiquée est « ${timeItem.label} ». Combien de minutes se sont écoulées après l’heure pleine ?`,
        `« Quarter » = 15 min, « half » = 30 min.`,
        timeItem.min,
        0,
        `« ${timeItem.label} » correspond à ${timeItem.min} minutes passées.`,
        'min',
        0
      );
    }
    case 'en_culture_3d': {
      const city = pick([
        { name: 'Londres (UTC+0)', offset: -1 },
        { name: 'New York (UTC-5)', offset: -6 },
        { name: 'Chicago (UTC-6)', offset: -7 },
        { name: 'Los Angeles (UTC-8)', offset: -9 },
      ]);
      const parisHour = pick([14, 15, 16, 18, 20]);
      const localHour = parisHour + city.offset;
      return wrapNumeric(
        `En heure d’hiver (Paris = UTC+1), lorsqu’il est ${parisHour}h00 à Paris, quelle heure (format 24h, nombre entier) est-il à ${city.name} ?`,
        `Applique un décalage de ${city.offset} heures par rapport à Paris.`,
        localHour,
        0,
        `${parisHour}h + (${city.offset}h) = ${localHour}h00 à ${city.name}.`,
        'h',
        0
      );
    }
    case 'en_essay_3d': {
      const bodyParas = pick([2, 3]);
      const wordsPerBody = pick([60, 70, 80]);
      const introConcl = 60; // 30 intro + 30 conclusion
      const totalWords = introConcl + bodyParas * wordsPerBody;
      return wrapNumeric(
        `Pour un essay d’anglais au Baccalauréat, tu rédiges une introduction + conclusion de ${introConcl} mots au total et ${bodyParas} paragraphes argumentés de ${wordsPerBody} mots chacun. Combien de mots compte ton essai ?`,
        `Calcule ${introConcl} + (${bodyParas} × ${wordsPerBody}).`,
        totalWords,
        1,
        `${introConcl} + ${bodyParas} × ${wordsPerBody} = ${totalWords} words.`,
        'words',
        0
      );
    }
    default:
      return null;
  }
}

function buildFormulaSynthesisQuestion(
  chapter: ChapterItem,
  allChapters: ChapterItem[],
  difficulty: QuizDifficulty,
  uid: string
): GeneratedQuizQuestion | null {
  const sameSubject = allChapters.filter(
    (c) => c.id !== chapter.id && (c.subject || 'mathematics') === (chapter.subject || 'mathematics')
  );
  const pool = sameSubject.length >= 3 ? sameSubject : allChapters.filter((c) => c.id !== chapter.id);
  if (pool.length < 3) return null;

  const distractors = shuffle(pool)
    .slice(0, 3)
    .map((c) => c.formulaDisplay);

  const uniqueOpts = Array.from(new Set([chapter.formulaDisplay, ...distractors]));
  if (uniqueOpts.length < 4) return null;

  return {
    id: uid,
    chapterId: chapter.id,
    chapterSlug: chapter.slug,
    chapterTitle: chapter.title,
    subject: chapter.subject || 'mathematics',
    gradeLevel: chapter.gradeLevel,
    origin: 'formula_synthesis',
    exerciseType: 'quiz',
    prompt: `Quelle relation fondamentale correspond au chapitre « ${chapter.title} » (${chapter.gradeLevel}) ?`,
    hint: `Indice du chapitre : ${chapter.subtitle}.`,
    options: shuffle(uniqueOpts),
    correctAnswer: chapter.formulaDisplay,
    numericTolerance: 0,
    explanation: `${chapter.title} repose sur la relation : ${chapter.formulaDisplay}. ${chapter.summary}`,
    baseXp: DIFFICULTY_BASE_XP[difficulty],
  };
}

export function generateDynamicQuiz(
  selectedChapters: ChapterItem[],
  allChapters: ChapterItem[],
  chapterExercisesByChapterId: Map<number, SeedChapterExerciseRef[]>,
  config: DynamicQuizConfig
): GeneratedQuizQuestion[] {
  const count = Math.max(3, Math.min(15, Math.round(config.questionCount || 6)));
  if (selectedChapters.length === 0) return [];

  const questions: GeneratedQuizQuestion[] = [];
  const usedPrompts = new Set<string>();
  const chaptersPool = shuffle(selectedChapters);

  let qIndex = 0;

  // 1. Priorité aux questions paramétriques fraîchement générées à partir des chapitres sélectionnés
  const parametricTarget =
    config.mode === 'numerique' ? count : Math.max(2, Math.ceil(count * 0.55));

  for (let attempt = 0; attempt < parametricTarget * 3 && questions.length < parametricTarget; attempt++) {
    const ch = chaptersPool[attempt % chaptersPool.length];
    const preferQcm = config.mode === 'qcm';
    const q = buildParametricQuestion(ch, config.difficulty, preferQcm, `dyn-p-${++qIndex}`);
    if (q && !usedPrompts.has(q.prompt)) {
      usedPrompts.add(q.prompt);
      questions.push(q);
    }
  }

  // 2. Questions d’exercices réels issus des chapitres sélectionnés (filtrées selon le mode)
  const exerciseCandidates: Array<{ ch: ChapterItem; ex: SeedChapterExerciseRef }> = [];
  for (const ch of selectedChapters) {
    const exList = chapterExercisesByChapterId.get(ch.id) || [];
    for (const ex of exList) {
      if (config.mode === 'qcm' && !ex.options) continue;
      if (config.mode === 'numerique' && ex.options) continue;
      exerciseCandidates.push({ ch, ex });
    }
  }

  for (const { ch, ex } of shuffle(exerciseCandidates)) {
    if (questions.length >= count) break;
    if (usedPrompts.has(ex.prompt)) continue;
    usedPrompts.add(ex.prompt);
    questions.push({
      id: `dyn-e-${++qIndex}`,
      chapterId: ch.id,
      chapterSlug: ch.slug,
      chapterTitle: ch.title,
      subject: ch.subject || 'mathematics',
      gradeLevel: ch.gradeLevel,
      origin: 'chapter_exercise',
      exerciseType: ex.exerciseType,
      prompt: ex.prompt,
      hint: ex.hint,
      options: ex.options ? shuffle(ex.options) : null,
      correctAnswer: ex.correctAnswer,
      numericTolerance: ex.numericTolerance,
      explanation: ex.explanation,
      baseXp: DIFFICULTY_BASE_XP[config.difficulty],
    });
  }

  // 3. Complément avec synthèse de formules (en mode mixte ou QCM) ou nouvelles variations paramétriques
  let safety = 0;
  while (questions.length < count && safety < 40) {
    safety++;
    const ch = chaptersPool[safety % chaptersPool.length];
    if (config.mode !== 'numerique' && safety % 2 === 1) {
      const fQ = buildFormulaSynthesisQuestion(ch, allChapters, config.difficulty, `dyn-f-${++qIndex}`);
      if (fQ && !usedPrompts.has(fQ.prompt)) {
        usedPrompts.add(fQ.prompt);
        questions.push(fQ);
        continue;
      }
    }
    const pQ = buildParametricQuestion(ch, config.difficulty, config.mode === 'qcm', `dyn-p2-${++qIndex}`);
    if (pQ && !usedPrompts.has(pQ.prompt)) {
      usedPrompts.add(pQ.prompt);
      questions.push(pQ);
    }
  }

  return shuffle(questions).slice(0, count);
}

export function sanitizeQuizQuestions(questions: GeneratedQuizQuestion[]): PublicQuizQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    chapterId: q.chapterId,
    chapterSlug: q.chapterSlug,
    chapterTitle: q.chapterTitle,
    subject: q.subject,
    gradeLevel: q.gradeLevel,
    origin: q.origin,
    exerciseType: q.exerciseType,
    prompt: q.prompt,
    hint: q.hint,
    options: q.options,
    baseXp: q.baseXp,
  }));
}

export function evaluateDynamicQuestionAnswer(params: {
  question: GeneratedQuizQuestion;
  submittedAnswer: string;
  responseTimeMs: number;
  currentStreak: number;
  isFinalQuestion: boolean;
  totalCorrectSoFar: number;
  totalQuestions: number;
}): {
  isCorrect: boolean;
  nextStreak: number;
  xpBreakdown: XpBreakdown;
} {
  const isCorrect = evaluateExerciseAnswer(
    params.question.exerciseType,
    params.submittedAnswer,
    params.question.correctAnswer,
    params.question.numericTolerance
  );

  const nextStreak = isCorrect ? params.currentStreak + 1 : 0;
  const baseXp = isCorrect ? params.question.baseXp : 0;
  const streakBonus = isCorrect && nextStreak >= 2 ? Math.min(nextStreak - 1, 5) * 10 : 0;
  const speedBonus =
    isCorrect && params.responseTimeMs <= 15000
      ? 10
      : isCorrect && params.responseTimeMs <= 30000
        ? 5
        : 0;

  let completionBonus = 0;
  if (params.isFinalQuestion) {
    const finalCorrect = params.totalCorrectSoFar + (isCorrect ? 1 : 0);
    const accuracy = params.totalQuestions > 0 ? finalCorrect / params.totalQuestions : 0;
    if (accuracy >= 1) {
      completionBonus = 100;
    } else if (accuracy >= 0.6) {
      completionBonus = 50;
    }
  }

  return {
    isCorrect,
    nextStreak,
    xpBreakdown: {
      baseXp,
      streakBonus,
      speedBonus,
      completionBonus,
      totalXp: baseXp + streakBonus + speedBonus + completionBonus,
    },
  };
}
