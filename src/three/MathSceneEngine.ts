import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type CameraPreset = 'perspective' | 'top' | 'front' | 'iso';

export interface SceneParams {
  preset: string;
  a: number;
  b: number;
  c: number;
  explode: number;
  showGrid: boolean;
  darkMode: boolean;
  accentHex: string;
}

export interface LiveMathReadout {
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  formulaLive: string;
}

/** Accès minimal pour les effets de mission (src/missions/fx.ts) : aucune logique de jeu dans le moteur. */
export interface FxContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  modelGroup: THREE.Group;
  isSoftwareGl: boolean;
  onFrame(cb: (dt: number) => void): () => void;
  findByTag(tag: string): THREE.Object3D | null;
}

export interface ParamMetadata {
  labelA: string;
  minA: number;
  maxA: number;
  stepA: number;
  labelB: string;
  minB: number;
  maxB: number;
  stepB: number;
  labelC: string;
  minC: number;
  maxC: number;
  stepC: number;
}

export function getParamMetadataForPreset(preset: string): ParamMetadata {
  switch (preset) {
    case 'fractions_3d':
      return {
        labelA: 'Parts sélectionnées (a)',
        minA: 1,
        maxA: 12,
        stepA: 1,
        labelB: 'Dénominateur total (b)',
        minB: 2,
        maxB: 12,
        stepB: 1,
        labelC: 'Échelle hauteur',
        minC: 0.6,
        maxC: 2,
        stepC: 0.1,
      };
    case 'volumes_6e':
      return {
        labelA: 'Longueur L (cm)',
        minA: 1,
        maxA: 6,
        stepA: 1,
        labelB: 'Largeur l (cm)',
        minB: 1,
        maxB: 5,
        stepB: 1,
        labelC: 'Hauteur h (cm)',
        minC: 1,
        maxC: 5,
        stepC: 1,
      };
    case 'pythagore_4e':
      return {
        labelA: 'Côté a (cm)',
        minA: 1.5,
        maxA: 4.5,
        stepA: 0.5,
        labelB: 'Côté b (cm)',
        minB: 1.5,
        maxB: 4.5,
        stepB: 0.5,
        labelC: 'Élévation 3D',
        minC: 0,
        maxC: 1.5,
        stepC: 0.1,
      };
    case 'trigonometrie_3e':
      return {
        labelA: 'Angle θ (°)',
        minA: 10,
        maxA: 80,
        stepA: 1,
        labelB: 'Rayon R',
        minB: 2,
        maxB: 5,
        stepB: 0.25,
        labelC: 'Épaisseur',
        minC: 0.5,
        maxC: 1.5,
        stepC: 0.1,
      };
    case 'sphere_3e':
      return {
        labelA: 'Rayon sphère R',
        minA: 1.5,
        maxA: 3.5,
        stepA: 0.1,
        labelB: 'Distance plan d',
        minB: 0,
        maxB: 3.2,
        stepB: 0.1,
        labelC: 'Transparence',
        minC: 0.4,
        maxC: 1,
        stepC: 0.1,
      };
    case 'integrales_term':
      return {
        labelA: 'Subdivisions Riemann (n)',
        minA: 3,
        maxA: 24,
        stepA: 1,
        labelB: 'Amplitude f(x)',
        minB: 0.6,
        maxB: 2.2,
        stepB: 0.1,
        labelC: 'Borne b',
        minC: 2,
        maxC: 4,
        stepC: 0.25,
      };
    case 'prediction_term':
      return {
        labelA: 'Poids pente w',
        minA: 0.5,
        maxA: 4,
        stepA: 0.1,
        labelB: 'Biais b',
        minB: -1.5,
        maxB: 1.5,
        stepB: 0.1,
        labelC: 'Taux α (EWMA)',
        minC: 0.1,
        maxC: 0.9,
        stepC: 0.05,
      };
    case 'angles_5e':
      return {
        labelA: 'Angle α (°)',
        minA: 15,
        maxA: 120,
        stepA: 1,
        labelB: 'Angle β (°)',
        minB: 15,
        maxB: 120,
        stepB: 1,
        labelC: 'Échelle arêtes',
        minC: 0.5,
        maxC: 3,
        stepC: 0.1,
      };
    case 'prisme_5e':
      return {
        labelA: 'Rayon / base a',
        minA: 1,
        maxA: 6,
        stepA: 0.25,
        labelB: 'Largeur / profondeur b',
        minB: 1,
        maxB: 6,
        stepB: 0.25,
        labelC: 'Hauteur prisme h',
        minC: 1,
        maxC: 8,
        stepC: 0.25,
      };
    case 'parabole_2nde':
      return {
        labelA: 'Coefficient a',
        minA: -3,
        maxA: 3,
        stepA: 0.1,
        labelB: 'Coefficient b',
        minB: -4,
        maxB: 4,
        stepB: 0.1,
        labelC: 'Ordonnée c',
        minC: -4,
        maxC: 4,
        stepC: 0.1,
      };
    case 'produit_scalaire_1ere':
      return {
        labelA: 'Angle θ (°)',
        minA: 0,
        maxA: 180,
        stepA: 5,
        labelB: 'Norme ‖u‖',
        minB: 1,
        maxB: 6,
        stepB: 0.25,
        labelC: 'Norme ‖v‖',
        minC: 1,
        maxC: 6,
        stepC: 0.25,
      };
    case 'probabilites_1ere':
      return {
        labelA: 'Prior P(A)',
        minA: 0.1,
        maxA: 5,
        stepA: 0.1,
        labelB: 'Vraisemblance P(B|A)',
        minB: 0.1,
        maxB: 5,
        stepB: 0.1,
        labelC: 'Faux positifs P(B|¬A)',
        minC: 0.05,
        maxC: 1,
        stepC: 0.05,
      };
    case 'pc_states_matter':
      return {
        labelA: 'Température T (°C)',
        minA: -20,
        maxA: 140,
        stepA: 5,
        labelB: 'Masse volumique ρ (g/cm³)',
        minB: 0.5,
        maxB: 3.0,
        stepB: 0.1,
        labelC: 'Volume enceinte V (L)',
        minC: 1.0,
        maxC: 4.0,
        stepC: 0.2,
      };
    case 'pc_circuit_3d':
      return {
        labelA: 'Tension générateur U (V)',
        minA: 1.5,
        maxA: 24,
        stepA: 0.5,
        labelB: 'Résistance R (Ω)',
        minB: 4,
        maxB: 60,
        stepB: 2,
        labelC: 'Branches (1=Série, 2=Dériv.)',
        minC: 1,
        maxC: 2,
        stepC: 1,
      };
    case 'pc_optics_3d':
      return {
        labelA: 'Angle incidence i₁ (°)',
        minA: 5,
        maxA: 80,
        stepA: 1,
        labelB: 'Indice milieu 1 (n₁)',
        minB: 1.0,
        maxB: 1.8,
        stepB: 0.05,
        labelC: 'Indice milieu 2 (n₂)',
        minC: 1.0,
        maxC: 2.0,
        stepC: 0.05,
      };
    case 'pc_molecule_3d':
      return {
        labelA: 'Molécule (1=H₂O, 2=CO₂, 3=CH₄)',
        minA: 1,
        maxA: 3,
        stepA: 1,
        labelB: 'Angle liaison (°)',
        minB: 95,
        maxB: 180,
        stepB: 0.5,
        labelC: 'Échelle liaison',
        minC: 0.8,
        maxC: 1.6,
        stepC: 0.1,
      };
    case 'pc_atom_3d':
      return {
        labelA: 'Numéro atomique Z (p⁺)',
        minA: 1,
        maxA: 10,
        stepA: 1,
        labelB: 'Neutrons N (n⁰)',
        minB: 0,
        maxB: 12,
        stepB: 1,
        labelC: 'Demi-vies écoulées (t / t₁/₂)',
        minC: 0,
        maxC: 4,
        stepC: 0.25,
      };
    case 'pc_gravity_3d':
      return {
        labelA: 'Masse astre central M',
        minA: 1,
        maxA: 10,
        stepA: 0.5,
        labelB: 'Rayon orbital d',
        minB: 1.8,
        maxB: 4.0,
        stepB: 0.1,
        labelC: 'Gravité g (N/kg)',
        minC: 1.6,
        maxC: 15,
        stepC: 0.2,
      };
    case 'pc_wave_3d':
      return {
        labelA: 'Fréquence visuelle f',
        minA: 1.0,
        maxA: 4.5,
        stepA: 0.1,
        labelB: 'Amplitude A',
        minB: 0.2,
        maxB: 1.5,
        stepB: 0.1,
        labelC: 'Célérité v (m/s)',
        minC: 100,
        maxC: 1500,
        stepC: 20,
      };
    case 'pc_projectile_3d':
      return {
        labelA: 'Vitesse initiale v₀ (m/s)',
        minA: 6,
        maxA: 26,
        stepA: 1,
        labelB: 'Angle de tir α (°)',
        minB: 15,
        maxB: 75,
        stepB: 1,
        labelC: 'Pesanteur g (m/s²)',
        minC: 1.6,
        maxC: 14,
        stepC: 0.2,
      };
    case 'pc_titration_3d':
      return {
        labelA: 'Volume versé V_B (mL)',
        minA: 0,
        maxA: 25,
        stepA: 0.5,
        labelB: 'pKa du couple acide',
        minB: 2.0,
        maxB: 9.0,
        stepB: 0.2,
        labelC: 'Volume équivalent V_E (mL)',
        minC: 8,
        maxC: 18,
        stepC: 0.5,
      };
    case 'svt_cell_3d':
      return {
        labelA: 'Mitochondries (production ATP)',
        minA: 2,
        maxA: 10,
        stepA: 1,
        labelB: 'Activité ribosomale / enzymatique',
        minB: 1,
        maxB: 4,
        stepB: 1,
        labelC: 'Type (1: Animale · 2: Végétale)',
        minC: 1,
        maxC: 2,
        stepC: 1,
      };
    case 'svt_dna_3d':
      return {
        labelA: 'Paires de nucléotides',
        minA: 6,
        maxA: 16,
        stepA: 1,
        labelB: 'Proportion Adénine %A',
        minB: 15,
        maxB: 35,
        stepB: 1,
        labelC: 'État (1: Double hélice · 2: Réplication)',
        minC: 1,
        maxC: 2,
        stepC: 1,
      };
    case 'svt_tectonics_3d':
      return {
        labelA: 'Vitesse plaques (cm/an)',
        minA: 1,
        maxA: 10,
        stepA: 0.5,
        labelB: 'Durée (Ma) / Profondeur foyer (km)',
        minB: 5,
        maxB: 40,
        stepB: 1,
        labelC: 'Contexte (1:Dorsale 2:Subduction 3:Strates)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'svt_ecosystem_3d':
      return {
        labelA: 'Niveaux trophiques',
        minA: 2,
        maxA: 4,
        stepA: 1,
        labelB: 'Biomasse producteurs (kg)',
        minB: 200,
        maxB: 2000,
        stepB: 100,
        labelC: 'Vue (1: Pyramide · 2: Photosynthèse)',
        minC: 1,
        maxC: 2,
        stepC: 1,
      };
    case 'svt_organ_3d':
      return {
        labelA: 'FC (bpm) / Antigènes',
        minA: 4,
        maxA: 180,
        stepA: 2,
        labelB: 'VES (mL) / Efficacité (%)',
        minB: 40,
        maxB: 120,
        stepB: 5,
        labelC: 'Système (1: Cœur/Sang · 2: Immunité)',
        minC: 1,
        maxC: 2,
        stepC: 1,
      };
    case 'svt_neuron_3d':
      return {
        labelA: 'Vitesse influx nerveux (m/s)',
        minA: 20,
        maxA: 120,
        stepA: 5,
        labelB: 'Longueur axone (m)',
        minB: 0.4,
        maxB: 2.0,
        stepB: 0.1,
        labelC: 'Fréquence potentiels d’action (×20 Hz)',
        minC: 1,
        maxC: 4,
        stepC: 1,
      };
    case 'svt_climate_3d':
      return {
        labelA: 'CO₂ atmosphérique (ppm)',
        minA: 200,
        maxA: 600,
        stepA: 10,
        labelB: 'Albédo planétaire (%)',
        minB: 10,
        maxB: 60,
        stepB: 1,
        labelC: 'Inclinaison axe terrestre (°)',
        minC: 0,
        maxC: 30,
        stepC: 0.2,
      };
    case 'hg_monument_3d':
      return {
        labelA: 'Niveaux / Colonnes / Tours',
        minA: 3,
        maxA: 8,
        stepA: 1,
        labelB: 'Hauteur monumentale (m)',
        minB: 10,
        maxB: 40,
        stepB: 1,
        labelC: 'Type (1:Pyramide 2:Temple 3:Château)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'hg_city_urban_3d':
      return {
        labelA: 'Tours du CBD (centre d’affaires)',
        minA: 3,
        maxA: 12,
        stepA: 1,
        labelB: 'Taux d’urbanisation (%)',
        minB: 30,
        maxB: 95,
        stepB: 1,
        labelC: 'Rang (1:Ville 2:Métropole 3:Mondiale)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'hg_globe_routes_3d':
      return {
        labelA: 'Routes maritimes actives',
        minA: 2,
        maxA: 10,
        stepA: 1,
        labelB: 'Vitesse moyenne navires (km/h)',
        minB: 10,
        maxB: 50,
        stepB: 2,
        labelC: 'Époque (1:Découvertes 2:Conteneurs/ZEE)',
        minC: 1,
        maxC: 2,
        stepC: 1,
      };
    case 'hg_demography_3d':
      return {
        labelA: 'Taux de natalité (‰)',
        minA: 8,
        maxA: 45,
        stepA: 1,
        labelB: 'Taux de mortalité (‰)',
        minB: 4,
        maxB: 30,
        stepB: 1,
        labelC: 'Phase de transition démographique (1→4)',
        minC: 1,
        maxC: 4,
        stepC: 1,
      };
    case 'hg_timeline_3d':
      return {
        labelA: 'Année repère (fin)',
        minA: 1600,
        maxA: 2025,
        stepA: 1,
        labelB: 'Année origine (début)',
        minB: 1600,
        maxB: 2000,
        stepB: 1,
        labelC: 'Période (1:Moderne 2:XIXᵉ 3:Contemp.)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'hg_industry_3d':
      return {
        labelA: 'Unités productives / R&D',
        minA: 3,
        maxA: 10,
        stepA: 1,
        labelB: 'Part tertiaire / Rendement (%)',
        minB: 20,
        maxB: 90,
        stepB: 2,
        labelC: 'Modèle (1:Usine XIXᵉ 2:Technopôle XXIᵉ)',
        minC: 1,
        maxC: 2,
        stepC: 1,
      };
    case 'hg_geopolitics_3d':
      return {
        labelA: 'Pôles / États membres',
        minA: 2,
        maxA: 27,
        stepA: 1,
        labelB: 'Année géopolitique clé',
        minB: 1945,
        maxB: 2025,
        stepB: 1,
        labelC: 'Ordre (1:Bipolaire 2:UE 3:Multipolaire)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'fr_syntax_3d':
      return {
        labelA: 'Constituants / Propositions',
        minA: 2,
        maxA: 8,
        stepA: 1,
        labelB: 'Mots dans la phrase',
        minB: 6,
        maxB: 20,
        stepB: 1,
        labelC: 'Type (1:Simple 2:Subordonnée 3:Complexe)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'fr_narrative_3d':
      return {
        labelA: 'Étapes du schéma narratif',
        minA: 3,
        maxA: 6,
        stepA: 1,
        labelB: 'Intensité dramatique',
        minB: 2,
        maxB: 6,
        stepB: 1,
        labelC: 'Genre (1:Conte 2:Chevalerie 3:Roman XIXᵉ)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'fr_grammar_3d':
      return {
        labelA: 'Groupes / Modes verbaux',
        minA: 1,
        maxA: 4,
        stepA: 1,
        labelB: 'Temps verbaux révisés',
        minB: 3,
        maxB: 8,
        stepB: 1,
        labelC: 'Mode (1:Indicatif 2:Subjonctif/Cond.)',
        minC: 1,
        maxC: 2,
        stepC: 1,
      };
    case 'fr_theater_3d':
      return {
        labelA: 'Actes de la pièce',
        minA: 1,
        maxA: 5,
        stepA: 1,
        labelB: 'Scènes par acte',
        minB: 2,
        maxB: 6,
        stepB: 1,
        labelC: 'Genre (1:Comédie 2:Tragédie 3:Moderne)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'fr_poetry_3d':
      return {
        labelA: 'Syllabes par vers (mètre)',
        minA: 6,
        maxA: 12,
        stepA: 1,
        labelB: 'Vers par strophe',
        minB: 2,
        maxB: 6,
        stepB: 1,
        labelC: 'Rimes (1:AABB 2:ABAB 3:ABBA)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'fr_rhetoric_3d':
      return {
        labelA: 'Axes / Arguments clés',
        minA: 2,
        maxA: 6,
        stepA: 1,
        labelB: 'Force persuasive (%)',
        minB: 40,
        maxB: 100,
        stepB: 5,
        labelC: 'Forme (1:Figures 2:Plaidoyer 3:Dissertation)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'fr_philo_3d':
      return {
        labelA: 'Concepts dialectiques',
        minA: 2,
        maxA: 5,
        stepA: 1,
        labelB: 'Rigueur démonstrative (%)',
        minB: 40,
        maxB: 100,
        stepB: 5,
        labelC: 'Domaine (1:Conscience 2:Vérité 3:Justice)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'en_tense_3d':
      return {
        labelA: 'Temps (1:Pres 2:BE+ing 3:Past 4:Perf 5:Fut 6:PPerf)',
        minA: 1,
        maxA: 6,
        stepA: 1,
        labelB: 'Repères / Verbes étudiés',
        minB: 4,
        maxB: 14,
        stepB: 1,
        labelC: 'Sphère (1:Présent 2:Passé 3:Futur/Antér.)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'en_syntax_3d':
      return {
        labelA: 'Blocs syntaxiques (WH/Aux/S/V/O)',
        minA: 3,
        maxA: 8,
        stepA: 1,
        labelB: 'Longueur phrase (mots)',
        minB: 5,
        maxB: 16,
        stepB: 1,
        labelC: 'Structure (1:WH-Q 2:Comparatif 3:Passif/Ind.)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'en_modals_3d':
      return {
        labelA: 'Auxiliaires modaux actifs',
        minA: 2,
        maxA: 6,
        stepA: 1,
        labelB: 'Degré de certitude / obligation (%)',
        minB: 20,
        maxB: 100,
        stepB: 5,
        labelC: 'Niveau (1:Base 2:If-clauses 3:Modaux B2)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'en_vocab_3d':
      return {
        labelA: 'Champs lexicaux interconnectés',
        minA: 4,
        maxA: 12,
        stepA: 1,
        labelB: 'Maîtrise lexicale (%)',
        minB: 30,
        maxB: 100,
        stepB: 5,
        labelC: 'Thème (1:Routine 2:Écologie 3:Numérique)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'en_culture_3d':
      return {
        labelA: 'Pôles culturels anglophones',
        minA: 3,
        maxA: 8,
        stepA: 1,
        labelB: 'Latitude repère (° N)',
        minB: 10,
        maxB: 60,
        stepB: 1,
        labelC: 'Aire (1:Royaume-Uni 2:États-Unis 3:Monde)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'en_essay_3d':
      return {
        labelA: 'Paragraphes & Linking words',
        minA: 3,
        maxA: 6,
        stepA: 1,
        labelB: 'Cohérence argumentative B2 (%)',
        minB: 50,
        maxB: 100,
        stepB: 2,
        labelC: 'Format (1:Essay 1ʳᵉ 2:Synthèse Bac B2)',
        minC: 1,
        maxC: 2,
        stepC: 1,
      };
    default:
      return {
        labelA: 'Paramètre a',
        minA: 0.5,
        maxA: 5,
        stepA: 0.1,
        labelB: 'Paramètre b',
        minB: 0.5,
        maxB: 5,
        stepB: 0.1,
        labelC: 'Paramètre c',
        minC: 0.5,
        maxC: 4,
        stepC: 0.1,
      };
  }
}

export function computeReadout(params: SceneParams): LiveMathReadout {
  const { preset, a, b, c } = params;
  switch (preset) {
    case 'fractions_3d': {
      const denom = Math.max(2, Math.round(b));
      const num = Math.min(denom, Math.max(1, Math.round(a)));
      const dec = (num / denom).toFixed(3);
      const pct = Math.round((num / denom) * 100);
      return {
        primaryLabel: 'Fraction active',
        primaryValue: `${num} / ${denom}`,
        secondaryLabel: 'Équivalent décimal',
        secondaryValue: `${dec} (${pct}%)`,
        formulaLive: `${num}/${denom} = ${dec}`,
      };
    }
    case 'volumes_6e': {
      const L = Math.round(a);
      const l = Math.round(b);
      const h = Math.round(c);
      const vol = L * l * h;
      return {
        primaryLabel: 'Volume V',
        primaryValue: `${vol} cm³`,
        secondaryLabel: 'Base × Hauteur',
        secondaryValue: `${L * l} cm² × ${h} cm`,
        formulaLive: `V = ${L} × ${l} × ${h} = ${vol}`,
      };
    }
    case 'pythagore_4e': {
      const hyp = Math.sqrt(a * a + b * b);
      return {
        primaryLabel: 'Hypoténuse c',
        primaryValue: `${hyp.toFixed(2)} cm`,
        secondaryLabel: 'Aires a² + b²',
        secondaryValue: `${(a * a).toFixed(1)} + ${(b * b).toFixed(1)} = ${(hyp * hyp).toFixed(1)}`,
        formulaLive: `${a.toFixed(1)}² + ${b.toFixed(1)}² = ${hyp.toFixed(2)}²`,
      };
    }
    case 'trigonometrie_3e': {
      const rad = THREE.MathUtils.degToRad(a);
      const cosV = Math.cos(rad);
      const sinV = Math.sin(rad);
      return {
        primaryLabel: 'cos(θ) / sin(θ)',
        primaryValue: `${cosV.toFixed(3)} / ${sinV.toFixed(3)}`,
        secondaryLabel: 'Identité cos² + sin²',
        secondaryValue: `${(cosV * cosV + sinV * sinV).toFixed(3)}`,
        formulaLive: `R·cos(${Math.round(a)}°) = ${(b * cosV).toFixed(2)}`,
      };
    }
    case 'sphere_3e': {
      const d = Math.min(a - 0.05, b);
      const rSec = Math.sqrt(Math.max(0, a * a - d * d));
      const vol = (4 / 3) * Math.PI * Math.pow(a, 3);
      return {
        primaryLabel: 'Rayon section r',
        primaryValue: `${rSec.toFixed(2)} cm`,
        secondaryLabel: 'Volume boule',
        secondaryValue: `${vol.toFixed(1)} cm³`,
        formulaLive: `r = √(${a.toFixed(1)}² - ${d.toFixed(1)}²) = ${rSec.toFixed(2)}`,
      };
    }
    case 'integrales_term': {
      const n = Math.max(3, Math.round(a));
      const upper = Math.max(1, c);
      const dx = upper / n;
      let riemann = 0;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * dx;
        riemann += b * (0.3 * x * x + 0.4) * dx;
      }
      const exact = b * (0.1 * Math.pow(upper, 3) + 0.4 * upper);
      return {
        primaryLabel: `Somme Riemann (n=${n})`,
        primaryValue: `${riemann.toFixed(3)} u.a.`,
        secondaryLabel: 'Intégrale exacte',
        secondaryValue: `${exact.toFixed(3)} u.a.`,
        formulaLive: `Δx = ${dx.toFixed(2)} · Erreur = ${Math.abs(exact - riemann).toFixed(3)}`,
      };
    }
    case 'prediction_term': {
      const sig = 1 / (1 + Math.exp(-(a * 0.8 + b)));
      return {
        primaryLabel: 'Prédiction σ(z)',
        primaryValue: `${Math.round(sig * 100)} %`,
        secondaryLabel: 'Taux d’oubli / EWMA α',
        secondaryValue: `${c.toFixed(2)}`,
        formulaLive: `σ(${(a * 0.8 + b).toFixed(2)}) = ${sig.toFixed(3)}`,
      };
    }
    case 'pc_states_matter': {
      const stateName = a < 0 ? 'Solide (cristallin)' : a < 100 ? 'Liquide (fluide)' : 'Gazeux (dispersé)';
      const massKg = b * c;
      return {
        primaryLabel: 'État physique',
        primaryValue: `${stateName} · ${Math.round(a)} °C`,
        secondaryLabel: 'Masse m = ρ · V',
        secondaryValue: `${massKg.toFixed(2)} kg (ρ = ${b.toFixed(1)} g/cm³)`,
        formulaLive: `m = ${b.toFixed(1)} × ${c.toFixed(1)} = ${massKg.toFixed(2)} kg`,
      };
    }
    case 'pc_circuit_3d': {
      const branches = Math.round(c) >= 2 ? 2 : 1;
      const rEq = branches === 2 ? b / 2 : b;
      const intensity = a / Math.max(1, rEq);
      const power = a * intensity;
      return {
        primaryLabel: 'Intensité I = U / R_eq',
        primaryValue: `${intensity.toFixed(2)} A`,
        secondaryLabel: 'Puissance P = U · I',
        secondaryValue: `${power.toFixed(1)} W (${branches === 2 ? 'Dérivation' : 'Série'})`,
        formulaLive: `U = ${a.toFixed(1)} V · R_eq = ${rEq.toFixed(1)} Ω · I = ${intensity.toFixed(2)} A`,
      };
    }
    case 'pc_optics_3d': {
      const i1Rad = THREE.MathUtils.degToRad(a);
      const sinI2 = (b / Math.max(0.1, c)) * Math.sin(i1Rad);
      const isTir = sinI2 > 1;
      const i2Deg = isTir ? 90 : THREE.MathUtils.radToDeg(Math.asin(Math.max(-1, Math.min(1, sinI2))));
      return {
        primaryLabel: isTir ? 'Réflexion totale interne' : 'Angle réfracté i₂',
        primaryValue: isTir ? `i₁ = ${Math.round(a)}° > i_lim` : `${i2Deg.toFixed(1)}°`,
        secondaryLabel: 'Loi de Snell-Descartes',
        secondaryValue: `n₁=${b.toFixed(2)} → n₂=${c.toFixed(2)}`,
        formulaLive: `${b.toFixed(2)}·sin(${Math.round(a)}°) = ${(b * Math.sin(i1Rad)).toFixed(3)}`,
      };
    }
    case 'pc_molecule_3d': {
      const molIdx = Math.round(a);
      const info =
        molIdx === 1
          ? { name: 'H₂O (Eau)', geom: 'Coudée · Polaire', molar: '18,0 g/mol' }
          : molIdx === 2
            ? { name: 'CO₂ (Dioxyde de C)', geom: 'Linéaire · Apolaire', molar: '44,0 g/mol' }
            : { name: 'CH₄ (Méthane)', geom: 'Tétraédrique · Apolaire', molar: '16,0 g/mol' };
      return {
        primaryLabel: info.name,
        primaryValue: info.geom,
        secondaryLabel: 'Masse molaire M',
        secondaryValue: `${info.molar} · θ ≈ ${b.toFixed(1)}°`,
        formulaLive: `${info.name} · M = ${info.molar}`,
      };
    }
    case 'pc_atom_3d': {
      const z = Math.max(1, Math.min(10, Math.round(a)));
      const n = Math.max(0, Math.round(b));
      const massNum = z + n;
      const elements = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'];
      const sym = elements[z - 1] || 'C';
      const remainingPct = Math.round(100 * Math.pow(0.5, Math.max(0, c)));
      return {
        primaryLabel: `Atome ${massNum}/${z} ${sym}`,
        primaryValue: `${z} p⁺ · ${n} n⁰ · ${z} e⁻`,
        secondaryLabel: 'Noyaux restants N(t)/N₀',
        secondaryValue: `${remainingPct} % (${c.toFixed(2)} t₁/₂)`,
        formulaLive: `A = ${z} + ${n} = ${massNum} · N(t) = N₀·(1/2)^${c.toFixed(1)}`,
      };
    }
    case 'pc_gravity_3d': {
      const forceRel = (a * 10) / Math.max(0.5, b * b);
      const weight10kg = 10 * c;
      return {
        primaryLabel: 'Attraction F ∝ M / d²',
        primaryValue: `${forceRel.toFixed(2)} u.N`,
        secondaryLabel: 'Poids (m=10 kg)',
        secondaryValue: `${weight10kg.toFixed(1)} N (g=${c.toFixed(1)} N/kg)`,
        formulaLive: `F ∝ ${a.toFixed(1)} / ${b.toFixed(1)}² · P = 10 × ${c.toFixed(1)}`,
      };
    }
    case 'pc_wave_3d': {
      const freqHz = Math.round(a * 200);
      const lambda = c / Math.max(1, freqHz);
      const periodMs = (1000 / Math.max(1, freqHz)).toFixed(2);
      return {
        primaryLabel: 'Longueur d’onde λ = v / f',
        primaryValue: `${lambda.toFixed(2)} m`,
        secondaryLabel: 'Fréquence / Période',
        secondaryValue: `${freqHz} Hz · T = ${periodMs} ms`,
        formulaLive: `λ = ${Math.round(c)} / ${freqHz} = ${lambda.toFixed(2)} m`,
      };
    }
    case 'pc_projectile_3d': {
      const rad = THREE.MathUtils.degToRad(b);
      const g = Math.max(1, c);
      const range = (a * a * Math.sin(2 * rad)) / g;
      const hMax = (a * a * Math.sin(rad) * Math.sin(rad)) / (2 * g);
      const ec0 = 0.5 * 1.0 * a * a;
      return {
        primaryLabel: 'Portée X_max / Sommet H',
        primaryValue: `${range.toFixed(1)} m / ${hMax.toFixed(1)} m`,
        secondaryLabel: 'Énergie cinétique (1 kg)',
        secondaryValue: `Ec₀ = ${ec0.toFixed(0)} J (α=${Math.round(b)}°)`,
        formulaLive: `X = (${Math.round(a)}²·sin ${Math.round(2 * b)}°) / ${g.toFixed(1)} = ${range.toFixed(1)} m`,
      };
    }
    case 'pc_titration_3d': {
      const vB = Math.max(0, a);
      const pKa = b;
      const vE = Math.max(4, c);
      let ph = 2.0;
      if (vB < 0.2) {
        ph = Math.max(1.2, 0.5 * (pKa + 1.0));
      } else if (vB < vE - 0.35) {
        ph = pKa + Math.log10(vB / (vE - vB));
      } else if (Math.abs(vB - vE) <= 0.35) {
        ph = 7.0 + 0.5 * Math.max(0, pKa - 4.0) + (vB - vE) * 4.5;
      } else {
        const excess = (vB - vE) / (20 + vB);
        ph = Math.min(13.4, 14 + Math.log10(Math.max(1e-6, excess * 0.1)));
      }
      ph = Math.max(0.8, Math.min(13.6, ph));
      const zone =
        ph < 6.0 ? 'Milieu acide (jaune BBT)' : ph <= 7.6 ? 'Zone d’équivalence (vert BBT)' : 'Milieu basique (bleu BBT)';
      return {
        primaryLabel: 'pH mesuré en direct',
        primaryValue: `pH = ${ph.toFixed(2)}`,
        secondaryLabel: 'Indicateur coloré',
        secondaryValue: zone,
        formulaLive: `V_B = ${vB.toFixed(1)} mL · V_E = ${vE.toFixed(1)} mL · pKa = ${pKa.toFixed(1)}`,
      };
    }
    case 'svt_cell_3d': {
      const mito = Math.max(2, Math.round(a));
      const ribo = Math.max(1, Math.round(b));
      const isPlant = Math.round(c) >= 2;
      const atpPerSec = mito * 32;
      return {
        primaryLabel: isPlant ? 'Cellule végétale (chloroplastes)' : 'Cellule animale (eucaryote)',
        primaryValue: `${mito} mitochondries · ~${atpPerSec} ATP/cycle`,
        secondaryLabel: 'Synthèse protéique',
        secondaryValue: `${ribo * 6} ribosomes actifs · Noyau ADN`,
        formulaLive: isPlant
          ? 'Paroi + Vacuole + Chloroplastes : 6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂'
          : `Respiration aérobie : ${mito} × 32 = ${atpPerSec} ATP / cycle`,
      };
    }
    case 'svt_dna_3d': {
      const pairs = Math.max(6, Math.round(a));
      const pctA = Math.max(15, Math.min(35, Math.round(b)));
      const pctG = 50 - pctA;
      const isRep = Math.round(c) >= 2;
      return {
        primaryLabel: isRep ? 'Réplication semi-conservative' : 'Double hélice d’ADN',
        primaryValue: `A=T=${pctA}% · G=C=${pctG}%`,
        secondaryLabel: 'Liaisons hydrogène (2·AT + 3·GC)',
        secondaryValue: `${pairs} pb · ~${Math.round(pairs * (2 * (pctA / 50) + 3 * (pctG / 50)))} liaisons H`,
        formulaLive: `A(${pctA}%) = T(${pctA}%)  ·  G(${pctG}%) = C(${pctG}%)  (Chargaff)`,
      };
    }
    case 'svt_tectonics_3d': {
      const speed = Math.max(1, a);
      const timeMa = Math.max(5, Math.round(b));
      const mode = Math.max(1, Math.min(3, Math.round(c)));
      const driftKm = Math.round(speed * 10 * timeMa);
      const modeLabel =
        mode === 1 ? 'Dorsale océanique (Divergence)' : mode === 2 ? 'Zone de subduction & volcanisme' : 'Érosion & bassin sédimentaire';
      return {
        primaryLabel: modeLabel,
        primaryValue: mode === 3 ? `Strates : ${(timeMa * 0.2).toFixed(1)} m / 100 ka` : `Déplacement : ${driftKm} km`,
        secondaryLabel: mode === 2 ? 'Profondeur foyer / magmatisme' : 'Vitesse tectonique',
        secondaryValue: mode === 2 ? `Foyer ${timeMa} km · v = ${speed.toFixed(1)} cm/an` : `v = ${speed.toFixed(1)} cm/an sur ${timeMa} Ma`,
        formulaLive: `d = ${speed.toFixed(1)} cm/an × ${timeMa} Ma = ${driftKm} km`,
      };
    }
    case 'svt_ecosystem_3d': {
      const levels = Math.max(2, Math.min(4, Math.round(a)));
      const bio0 = Math.max(200, Math.round(b));
      const isPhoto = Math.round(c) >= 2;
      const topBio = bio0 / Math.pow(10, levels - 1);
      return {
        primaryLabel: isPhoto ? 'Flux photosynthétique (O₂ / CO₂)' : `Pyramide trophique (${levels} niveaux)`,
        primaryValue: isPhoto ? `${Math.round(bio0 * 0.6)} g O₂/j libérés` : `Sommet : ${topBio.toFixed(1)} kg`,
        secondaryLabel: 'Règle des 10 % (Lindeman)',
        secondaryValue: `Producteurs : ${bio0} kg → Herbivores : ${(bio0 * 0.1).toFixed(0)} kg`,
        formulaLive: `B_n = B_0 × 0,10^(${levels - 1}) = ${topBio.toFixed(1)} kg`,
      };
    }
    case 'svt_organ_3d': {
      const isImm = Math.round(c) >= 2;
      if (isImm) {
        const antigens = Math.max(4, Math.min(18, Math.round(a)));
        const eff = Math.min(100, Math.max(40, Math.round(b)));
        const neutralized = Math.round((antigens * eff) / 100);
        return {
          primaryLabel: 'Complexe immun (Anticorps en Y)',
          primaryValue: `${neutralized} / ${antigens} antigènes neutralisés`,
          secondaryLabel: 'Réponse adaptative (Lymphocytes B)',
          secondaryValue: `Affinité spécifique : ${eff} %`,
          formulaLive: `Antigène + Anticorps spécifique → Complexe immun → Phagocytose`,
        };
      }
      const fc = Math.max(40, Math.min(180, Math.round(a)));
      const ves = Math.max(40, Math.min(120, Math.round(b)));
      const qcL = (fc * ves) / 1000;
      return {
        primaryLabel: 'Débit cardiaque (Double circulation)',
        primaryValue: `Qc = ${qcL.toFixed(2)} L/min`,
        secondaryLabel: 'Paramètres cardiaques',
        secondaryValue: `FC = ${fc} bpm · VES = ${ves} mL`,
        formulaLive: `Qc = ${fc} × ${ves} = ${fc * ves} mL/min = ${qcL.toFixed(2)} L/min`,
      };
    }
    case 'svt_neuron_3d': {
      const speed = Math.max(20, Math.round(a));
      const dist = Math.max(0.4, b);
      const freq = Math.max(1, Math.round(c)) * 20;
      const ms = (dist / speed) * 1000;
      return {
        primaryLabel: 'Conduction saltatoire (Axone)',
        primaryValue: `Δt = ${ms.toFixed(1)} ms (v = ${speed} m/s)`,
        secondaryLabel: 'Codage en fréquence de PA',
        secondaryValue: `${freq} Hz · Amplitude constante 100 mV`,
        formulaLive: `t = ${dist.toFixed(1)} m / ${speed} m/s = ${ms.toFixed(1)} ms · f = ${freq} Hz`,
      };
    }
    case 'svt_climate_3d': {
      const co2 = Math.max(200, Math.round(a));
      const albedo = Math.max(10, Math.min(60, Math.round(b)));
      const tilt = Math.max(0, Math.min(30, c));
      const pAbs = Math.round(340 * (1 - albedo / 100));
      const forcing = 5.35 * Math.log(co2 / 280);
      const tMean = 15 + forcing * 0.75 + (30 - albedo) * 0.35;
      return {
        primaryLabel: 'Bilan radiatif terrestre',
        primaryValue: `P_abs = ${pAbs} W/m² · T ≈ ${tMean.toFixed(1)} °C`,
        secondaryLabel: 'Forçage CO₂ & Inclinaison',
        secondaryValue: `ΔF = ${forcing >= 0 ? '+' : ''}${forcing.toFixed(2)} W/m² · Axe ${tilt.toFixed(1)}°`,
        formulaLive: `P_abs = (1 − ${(albedo / 100).toFixed(2)}) × 340 = ${pAbs} W/m² · CO₂=${co2} ppm`,
      };
    }
    case 'hg_monument_3d': {
      const units = Math.max(3, Math.min(8, Math.round(a)));
      const heightM = Math.max(10, Math.round(b));
      const mode = Math.max(1, Math.min(3, Math.round(c)));
      const archLabel =
        mode === 1 ? 'Pyramide / Ziggourat antique' : mode === 2 ? 'Temple civique grec' : 'Forteresse & cité médiévale';
      const baseArea = Math.round(heightM * heightM * (mode === 1 ? 1.8 : 1.1));
      return {
        primaryLabel: archLabel,
        primaryValue: `H = ${heightM} m · ${units} ${mode === 1 ? 'degrés' : mode === 2 ? 'colonnes' : 'tours'}`,
        secondaryLabel: 'Emprise au sol estimée',
        secondaryValue: `~${baseArea} m² · Axe sacré / défensif`,
        formulaLive: `${archLabel} · H = ${heightM} m · Emprise ≈ ${baseArea} m²`,
      };
    }
    case 'hg_city_urban_3d': {
      const towers = Math.max(3, Math.min(12, Math.round(a)));
      const urbanPct = Math.max(30, Math.min(95, Math.round(b)));
      const tier = Math.max(1, Math.min(3, Math.round(c)));
      const tierLabel = tier === 1 ? 'Ville moyenne' : tier === 2 ? 'Métropole régionale' : 'Ville mondiale (Archipel)';
      const density = Math.round(urbanPct * 85 * tier);
      return {
        primaryLabel: tierLabel,
        primaryValue: `Urbanisation : ${urbanPct} % · ${towers} tours CBD`,
        secondaryLabel: 'Densité métropolitaine',
        secondaryValue: `~${density.toLocaleString('fr-FR')} hab./km²`,
        formulaLive: `Densité ≈ ${density} hab./km² · Taux urbain = ${urbanPct} %`,
      };
    }
    case 'hg_globe_routes_3d': {
      const routes = Math.max(2, Math.min(10, Math.round(a)));
      const speedKmH = Math.max(10, Math.round(b));
      const isModern = Math.round(c) >= 2;
      const distKm = isModern ? 18500 : 6500;
      const days = distKm / (speedKmH * 24);
      return {
        primaryLabel: isModern ? 'Façades maritimes & ZEE (200 milles)' : 'Grandes Découvertes maritimes',
        primaryValue: `${routes} routes · ${speedKmH} km/h`,
        secondaryLabel: isModern ? 'Transit Asie–Europe (18 500 km)' : 'Traversée Atlantique (6 500 km)',
        secondaryValue: `≈ ${days.toFixed(1)} jours en mer`,
        formulaLive: `t = ${distKm} km / (${speedKmH} km/h × 24) ≈ ${days.toFixed(1)} j`,
      };
    }
    case 'hg_demography_3d': {
      const natal = Math.max(8, Math.round(a));
      const mortal = Math.max(4, Math.round(b));
      const phase = Math.max(1, Math.min(4, Math.round(c)));
      const accNat = natal - mortal;
      const phaseNames = [
        'Phase 1 : Régime traditionnel',
        'Phase 2 : Explosion démographique',
        'Phase 3 : Baisse de la natalité',
        'Phase 4 : Régime post-transitionnel',
      ];
      return {
        primaryLabel: phaseNames[phase - 1],
        primaryValue: `Accroissement : ${accNat >= 0 ? '+' : ''}${accNat} ‰`,
        secondaryLabel: 'Natalité / Mortalité',
        secondaryValue: `N = ${natal} ‰ · M = ${mortal} ‰`,
        formulaLive: `TAN = ${natal} ‰ − ${mortal} ‰ = ${accNat >= 0 ? '+' : ''}${accNat} ‰`,
      };
    }
    case 'hg_timeline_3d': {
      const yEnd = Math.round(a);
      const yStart = Math.round(b);
      const span = Math.abs(yEnd - yStart);
      const century = Math.floor((Math.max(1, yEnd) - 1) / 100) + 1;
      const era = Math.round(c) === 1 ? 'Temps modernes' : Math.round(c) === 2 ? 'XIXᵉ – 1ʳᵉ Guerre mondiale' : 'Monde contemporain';
      return {
        primaryLabel: `${era} · ${century}ᵉ siècle`,
        primaryValue: `${Math.min(yStart, yEnd)} → ${Math.max(yStart, yEnd)}`,
        secondaryLabel: 'Écart chronologique',
        secondaryValue: `${span} ans (${(span / 10).toFixed(1)} décennies)`,
        formulaLive: `Δt = |${yEnd} − ${yStart}| = ${span} ans · Repère : ${yEnd}`,
      };
    }
    case 'hg_industry_3d': {
      const units = Math.max(3, Math.min(10, Math.round(a)));
      const tertiaryPct = Math.max(20, Math.min(90, Math.round(b)));
      const isModern = Math.round(c) >= 2;
      const secPct = Math.max(5, Math.round((100 - tertiaryPct) * 0.72));
      const primPct = Math.max(1, 100 - tertiaryPct - secPct);
      return {
        primaryLabel: isModern ? 'Technopôle & ZIP mondialisée' : 'Bassin industriel XIXᵉ (Vapeur)',
        primaryValue: `${units} pôles · Tertiaire ${tertiaryPct} %`,
        secondaryLabel: 'Répartition sectorielle',
        secondaryValue: `Prim. ${primPct}% · Sec. ${secPct}% · Tert. ${tertiaryPct}%`,
        formulaLive: `${primPct}% + ${secPct}% + ${tertiaryPct}% = 100 %`,
      };
    }
    case 'hg_geopolitics_3d': {
      const poles = Math.max(2, Math.min(27, Math.round(a)));
      const year = Math.round(b);
      const mode = Math.max(1, Math.min(3, Math.round(c)));
      const label =
        mode === 1 ? 'Ordre bipolaire (Guerre froide)' : mode === 2 ? 'Union européenne (Intégration)' : 'Monde multipolaire (XXIᵉ s.)';
      return {
        primaryLabel: label,
        primaryValue: mode === 2 ? `${poles} États membres · ${year}` : `${poles} pôles de puissance · ${year}`,
        secondaryLabel: 'Équilibre géopolitique',
        secondaryValue: mode === 1 ? 'Blocs Est / Ouest · Dissuasion' : mode === 2 ? 'Marché unique & institutions' : 'Puissances régionales & ONU',
        formulaLive: `${label} · Repère ${year} · ${poles} acteurs majeurs`,
      };
    }
    case 'fr_syntax_3d': {
      const blocks = Math.max(2, Math.min(8, Math.round(a)));
      const words = Math.max(6, Math.round(b));
      const mode = Math.max(1, Math.min(3, Math.round(c)));
      const label = mode === 1 ? 'Phrase simple (S + V + COD)' : mode === 2 ? 'Phrase complexe (Subordination)' : 'Période syntaxique';
      return {
        primaryLabel: label,
        primaryValue: `${blocks} groupes · ${words} mots`,
        secondaryLabel: 'Architecture grammaticale',
        secondaryValue: mode === 1 ? '1 verbe conjugué · Nature ≠ Fonction' : `${blocks} propositions articulées`,
        formulaLive: `${label} · ${blocks} constituants · ${words} mots`,
      };
    }
    case 'fr_narrative_3d': {
      const steps = Math.max(3, Math.min(6, Math.round(a)));
      const tension = Math.max(2, Math.min(6, Math.round(b)));
      const mode = Math.max(1, Math.min(3, Math.round(c)));
      const genre = mode === 1 ? 'Conte merveilleux' : mode === 2 ? 'Chevalerie / Autobiographie' : 'Roman réaliste & fantastique';
      return {
        primaryLabel: `Arc narratif · ${genre}`,
        primaryValue: `${steps} étapes · Tension ${tension}/6`,
        secondaryLabel: 'Dynamique du récit',
        secondaryValue: 'SI → Élément perturbateur → Péripéties → Dénouement',
        formulaLive: `${genre} · ${steps} étapes · Climax niveau ${tension}`,
      };
    }
    case 'fr_grammar_3d': {
      const groups = Math.max(1, Math.min(4, Math.round(a)));
      const tenses = Math.max(3, Math.min(8, Math.round(b)));
      const isSubj = Math.round(c) >= 2;
      return {
        primaryLabel: isSubj ? 'Subjonctif & Conditionnel' : 'Système de l’Indicatif',
        primaryValue: `${tenses} temps · ${tenses * 6} formes`,
        secondaryLabel: 'Groupes verbaux actifs',
        secondaryValue: `${groups} groupes · Imparfait (fond) vs Passé simple`,
        formulaLive: `${tenses} temps × 6 personnes = ${tenses * 6} conjugaisons`,
      };
    }
    case 'fr_theater_3d': {
      const acts = Math.max(1, Math.min(5, Math.round(a)));
      const scenes = Math.max(2, Math.min(6, Math.round(b)));
      const mode = Math.max(1, Math.min(3, Math.round(c)));
      const genre = mode === 1 ? 'Comédie (Molière)' : mode === 2 ? 'Tragédie classique (3 unités)' : 'Théâtre moderne';
      return {
        primaryLabel: genre,
        primaryValue: `${acts} actes · ${acts * scenes} scènes`,
        secondaryLabel: 'Dispositif scénique',
        secondaryValue: mode === 2 ? '1 lieu · 24 heures · 1 action (Catharsis)' : 'Double énonciation · Répliques + Didascalies',
        formulaLive: `${acts} actes × ${scenes} scènes = ${acts * scenes} scènes`,
      };
    }
    case 'fr_poetry_3d': {
      const syl = Math.max(6, Math.min(12, Math.round(a)));
      const lines = Math.max(2, Math.min(6, Math.round(b)));
      const rimeMode = Math.max(1, Math.min(3, Math.round(c)));
      const meterName = syl === 12 ? 'Alexandrin (6//6)' : syl === 10 ? 'Décasyllabe' : syl === 8 ? 'Octosyllabe' : `${syl} syllabes`;
      const rimeLabel = rimeMode === 1 ? 'Rimes plates (AABB)' : rimeMode === 2 ? 'Rimes croisées (ABAB)' : 'Rimes embrassées (ABBA)';
      return {
        primaryLabel: `${meterName} · ${lines} vers`,
        primaryValue: `${syl * lines} syllabes / strophe`,
        secondaryLabel: 'Disposition des rimes',
        secondaryValue: rimeLabel,
        formulaLive: `${lines} vers × ${syl} syllabes = ${syl * lines} syllabes · ${rimeLabel}`,
      };
    }
    case 'fr_rhetoric_3d': {
      const axes = Math.max(2, Math.min(6, Math.round(a)));
      const force = Math.max(40, Math.min(100, Math.round(b)));
      const mode = Math.max(1, Math.min(3, Math.round(c)));
      const label = mode === 1 ? 'Figures de style & rhétorique' : mode === 2 ? 'Argumentation (Convaincre/Persuader)' : 'Plan dialectique (Bac)';
      return {
        primaryLabel: label,
        primaryValue: `${axes} axes · Impact ${force} %`,
        secondaryLabel: 'Équilibre rhétorique',
        secondaryValue: 'Thèse → Arguments → Exemples analysés',
        formulaLive: `${axes} axes × 2 sous-parties = ${axes * 2} paragraphes · ${force}%`,
      };
    }
    case 'fr_philo_3d': {
      const concepts = Math.max(2, Math.min(5, Math.round(a)));
      const rigor = Math.max(40, Math.min(100, Math.round(b)));
      const domain = Math.max(1, Math.min(3, Math.round(c)));
      const names = ['Conscience, Inconscient & Liberté', 'Raison, Vérité & Réfutabilité', 'État, Contrat social & Devoir'];
      return {
        primaryLabel: names[domain - 1],
        primaryValue: `${concepts} concepts · Rigueur ${rigor} %`,
        secondaryLabel: 'Mouvement dialectique',
        secondaryValue: 'Thèse → Antithèse → Synthèse problématisée',
        formulaLive: `${names[domain - 1]} · ${concepts} notions articulées`,
      };
    }
    case 'en_tense_3d': {
      const tenseIdx = Math.max(1, Math.min(6, Math.round(a)));
      const verbs = Math.max(4, Math.round(b));
      const names = [
        'Present Simple (Habits)',
        'Present Continuous (BE + V-ing)',
        'Past Simple (Preterit -ed / 2nd col)',
        'Present Perfect (HAVE/HAS + V-en)',
        'Future (WILL / BE GOING TO)',
        'Past Perfect (HAD + V-en)',
      ];
      return {
        primaryLabel: names[tenseIdx - 1],
        primaryValue: `Tense #${tenseIdx} · ${verbs} verbes repères`,
        secondaryLabel: 'Axe chronologique anglais',
        secondaryValue: tenseIdx === 4 ? 'Passé relié au présent (FOR / SINCE)' : tenseIdx === 6 ? 'Antériorité dans le passé' : 'Aspect & temporalité',
        formulaLive: `${names[tenseIdx - 1]} · ${verbs} forms`,
      };
    }
    case 'en_syntax_3d': {
      const blocks = Math.max(3, Math.min(8, Math.round(a)));
      const words = Math.max(5, Math.round(b));
      const mode = Math.max(1, Math.min(3, Math.round(c)));
      const label = mode === 1 ? 'WH-Question (Q-A-S-V)' : mode === 2 ? 'Comparatif & Superlatif' : 'Voix passive & Reported Speech';
      return {
        primaryLabel: label,
        primaryValue: `${blocks} blocs · ${words} words`,
        secondaryLabel: 'Ordre syntaxique anglais',
        secondaryValue: mode === 1 ? 'WH + Aux + Subject + Verb' : mode === 2 ? '-er / more… than / as… as' : 'BE + Past Participle / Backshift',
        formulaLive: `${label} · ${blocks} slots · ${words} words`,
      };
    }
    case 'en_modals_3d': {
      const modals = Math.max(2, Math.min(6, Math.round(a)));
      const certainty = Math.max(20, Math.min(100, Math.round(b)));
      const mode = Math.max(1, Math.min(3, Math.round(c)));
      const modalName = certainty >= 85 ? 'MUST (obligation / certitude)' : certainty >= 65 ? 'SHOULD (conseil)' : certainty >= 45 ? 'MAY (probabilité)' : 'MIGHT (éventualité)';
      return {
        primaryLabel: mode === 2 ? 'If-Clauses (Type 1 & 2)' : mode === 3 ? 'Modaux au passé (B2)' : 'Échelle des modaux',
        primaryValue: `${modalName} · ${certainty} %`,
        secondaryLabel: 'Règle d’or modale',
        secondaryValue: `${modals} modaux · Invariable + Base verbale (sans « to »)`,
        formulaLive: mode === 3 ? `Modal + HAVE + V-en (${certainty}%)` : `Modal + BV · ${certainty}% certitude`,
      };
    }
    case 'en_vocab_3d': {
      const nodes = Math.max(4, Math.min(12, Math.round(a)));
      const mastery = Math.max(30, Math.min(100, Math.round(b)));
      const theme = Math.max(1, Math.min(3, Math.round(c)));
      const labels = ['Daily Routine & Time', 'Environment & Sustainability', 'Digital Citizenship (B2)'];
      return {
        primaryLabel: labels[theme - 1],
        primaryValue: `${nodes} champs · Maîtrise ${mastery} %`,
        secondaryLabel: 'Réseau lexical actif',
        secondaryValue: `${nodes * 6} expressions authentiques reliées`,
        formulaLive: `${labels[theme - 1]} · ${nodes * 6} expressions (${mastery}%)`,
      };
    }
    case 'en_culture_3d': {
      const hubs = Math.max(3, Math.min(8, Math.round(a)));
      const lat = Math.round(b);
      const area = Math.max(1, Math.min(3, Math.round(c)));
      const labels = ['United Kingdom (4 Nations)', 'United States (50 States)', 'English-Speaking World (Commonwealth)'];
      return {
        primaryLabel: labels[area - 1],
        primaryValue: `${hubs} pôles · Lat. ${lat}° N`,
        secondaryLabel: 'Aire culturelle anglophone',
        secondaryValue: area === 1 ? 'London · Edinburgh · Cardiff · Belfast' : area === 2 ? 'Washington D.C. · New York · Ellis Island' : 'UK · USA · Canada · Australia · India',
        formulaLive: `${labels[area - 1]} · ${hubs} hubs · ${lat}° N`,
      };
    }
    case 'en_essay_3d': {
      const paras = Math.max(3, Math.min(6, Math.round(a)));
      const coh = Math.max(50, Math.min(100, Math.round(b)));
      const isB2 = Math.round(c) >= 2;
      const targetWords = 60 + (paras - 2) * 70;
      return {
        primaryLabel: isB2 ? 'Bac B2 Essay & Synthesis' : 'Structured Essay (Linking Words)',
        primaryValue: `${paras} parties · ~${targetWords} words`,
        secondaryLabel: 'Cohérence & connecteurs',
        secondaryValue: `${coh} % · However · Although · Despite · Furthermore`,
        formulaLive: `Intro + ${Math.max(1, paras - 2)} body + Concl ≈ ${targetWords} words (${coh}%)`,
      };
    }
    default:
      return {
        primaryLabel: 'Paramètres actifs',
        primaryValue: `a=${a.toFixed(1)} · b=${b.toFixed(1)}`,
        secondaryLabel: 'Profondeur / c',
        secondaryValue: `${c.toFixed(1)}`,
        formulaLive: `f(${a.toFixed(1)}, ${b.toFixed(1)})`,
      };
  }
}

// Pre-allocated math helpers outside render loop (zero GC)
const _camTargetPos = new THREE.Vector3(6.5, 5.2, 7.5);
const _camTargetLook = new THREE.Vector3(0, 1.0, 0);

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createCoordinateGridTexture(dark: boolean, maxAniso: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = dark ? '#0f172a' : '#f1f5f9';
  ctx.fillRect(0, 0, size, size);

  // Subgrid
  ctx.strokeStyle = dark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(100, 116, 139, 0.15)';
  ctx.lineWidth = 1;
  const step = size / 8;
  for (let i = 0; i <= 8; i++) {
    const p = i * step;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  // Major border
  ctx.strokeStyle = dark ? 'rgba(148, 163, 184, 0.30)' : 'rgba(71, 85, 105, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.anisotropy = maxAniso;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.48
  );
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.42)');
  grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.16)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createVectorArrowGroup(
  from: THREE.Vector3,
  to: THREE.Vector3,
  color: number,
  radius = 0.06
): THREE.Group {
  const group = new THREE.Group();
  const dir = to.clone().sub(from);
  const len = Math.max(0.15, dir.length());
  const headLen = Math.min(0.35, len * 0.28);
  const shaftLen = Math.max(0.05, len - headLen);

  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.45,
  });

  const shaftGeo = new THREE.CylinderGeometry(radius, radius, shaftLen, 16);
  const shaft = new THREE.Mesh(shaftGeo, mat);
  shaft.position.y = shaftLen / 2;
  shaft.castShadow = true;

  const headGeo = new THREE.ConeGeometry(radius * 2.3, headLen, 18);
  const head = new THREE.Mesh(headGeo, mat);
  head.position.y = shaftLen + headLen / 2;
  head.castShadow = true;

  group.add(shaft, head);
  group.position.copy(from);
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize());
  group.quaternion.copy(quat);
  return group;
}

export class MathSceneEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;
  private clock: THREE.Clock;
  private frameId = 0;
  private disposed = false;

  private modelGroup: THREE.Group;
  private animatedSubparts: Array<{ obj: THREE.Object3D; baseY: number; phase: number; amp?: number; speed?: number }> = [];
  private orbitSubparts: Array<{
    obj: THREE.Object3D;
    radiusX: number;
    radiusZ: number;
    speed: number;
    phase: number;
    centerY: number;
    tiltX: number;
    tiltZ: number;
    rectLoop?: { halfW: number; halfD: number; y: number };
  }> = [];
  private floorMesh: THREE.Mesh;
  private plinthGroup: THREE.Group;
  private contactShadow: THREE.Mesh;
  private axesGroup: THREE.Group;
  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private pmremEnvTex: THREE.Texture;

  private params: SceneParams;
  private cameraTransitionActive = false;
  private onContextLostCb?: (lost: boolean) => void;
  private frameListeners = new Set<(dt: number) => void>();
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2();

  constructor(
    container: HTMLElement,
    initialParams: SceneParams,
    onContextLost?: (lost: boolean) => void
  ) {
    this.container = container;
    this.params = { ...initialParams };
    this.onContextLostCb = onContextLost;
    this.isSoftwareGl = detectSoftwareWebGL();
    this.clock = new THREE.Clock();

    const width = Math.max(320, container.clientWidth);
    const height = Math.max(240, container.clientHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);

    this.scene = new THREE.Scene();
    const bgHex = this.params.darkMode ? 0x0b1120 : 0xf1f5f9;
    this.scene.background = new THREE.Color(bgHex);
    this.scene.fog = new THREE.FogExp2(bgHex, 0.024);

    // Mandatory studio reflection environment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremEnvTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.pmremEnvTex;
    pmremGenerator.dispose();

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    this.camera.position.set(6.5, 5.2, 7.5);

    // Molette : défilement de la page ; zoom 3D seulement avec Ctrl (le pincement d'un pavé tactile envoie aussi ctrlKey)
    this.renderer.domElement.addEventListener(
      'wheel',
      (e) => {
        if (!e.ctrlKey) e.stopImmediatePropagation();
      },
      { capture: true }
    );
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 1.0, 0);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 24;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.controls.addEventListener('start', () => {
      this.cameraTransitionActive = false;
    });

    // Three-point studio lighting
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x334155, 0.7);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff7ed, 1.9);
    this.keyLight.position.set(7, 11, 6);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.left = -8;
    this.keyLight.shadow.camera.right = 8;
    this.keyLight.shadow.camera.top = 8;
    this.keyLight.shadow.camera.bottom = -8;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 30;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);

    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.75);
    rimLight.position.set(-6, 5, -7);
    this.scene.add(rimLight);

    // Floor & Grounding Plinth
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const gridTex = createCoordinateGridTexture(this.params.darkMode, maxAniso);
    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.85,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    this.floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.position.y = -0.02;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    this.plinthGroup = this.buildStudioPlinth();
    this.scene.add(this.plinthGroup);

    this.contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 7.2),
      new THREE.MeshBasicMaterial({
        map: createContactShadowTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
      })
    );
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.065;
    this.scene.add(this.contactShadow);

    this.axesGroup = this.buildAxesHelper();
    this.axesGroup.visible = this.params.showGrid;
    this.scene.add(this.axesGroup);

    this.modelGroup = new THREE.Group();
    this.modelGroup.position.y = 0.08;
    this.scene.add(this.modelGroup);

    this.rebuildModel();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.startLoop();
  }

  private buildStudioPlinth(): THREE.Group {
    const g = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({
      color: this.params.darkMode ? 0x1e293b : 0xe2e8f0,
      roughness: 0.65,
      metalness: 0.15,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 4.0, 0.08, 48), baseMat);
    disc.position.y = 0.02;
    disc.receiveShadow = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.82, 0.025, 12, 64), trimMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.06;
    g.add(disc, ring);
    return g;
  }

  private buildAxesHelper(): THREE.Group {
    const g = new THREE.Group();
    const len = 3.5;
    g.add(
      createVectorArrowGroup(new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(len, 0.08, 0), 0xef4444, 0.02),
      createVectorArrowGroup(new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(0, len, 0), 0x10b981, 0.02),
      createVectorArrowGroup(new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(0, 0.08, len), 0x3b82f6, 0.02)
    );
    return g;
  }

  private clearModelGroup() {
    this.animatedSubparts = [];
    this.orbitSubparts = [];
    const disposedGeos = new Set<THREE.BufferGeometry>();
    const disposedMats = new Set<THREE.Material>();
    this.modelGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry && !disposedGeos.has(mesh.geometry)) {
          disposedGeos.add(mesh.geometry);
          mesh.geometry.dispose();
        }
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            if (m && !disposedMats.has(m)) {
              disposedMats.add(m);
              m.dispose();
            }
          });
        } else if (mesh.material && !disposedMats.has(mesh.material)) {
          disposedMats.add(mesh.material);
          mesh.material.dispose();
        }
      }
    });
    while (this.modelGroup.children.length > 0) {
      this.modelGroup.remove(this.modelGroup.children[0]);
    }
  }

  /** Étiquette (userData.tag) de l'objet sous le pointeur, ou null. Ne teste que les objets étiquetés. */
  public pick(clientX: number, clientY: number): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNdc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const tagged: THREE.Object3D[] = [];
    this.modelGroup.traverse((o) => {
      if (o.userData.tag) tagged.push(o);
    });
    const hit = this.raycaster.intersectObjects(tagged, false)[0];
    return hit ? String(hit.object.userData.tag) : null;
  }

  public findByTag(tag: string): THREE.Object3D | null {
    let found: THREE.Object3D | null = null;
    this.modelGroup.traverse((o) => {
      if (!found && o.userData.tag === tag) found = o;
    });
    return found;
  }

  /** Étiquettes des objets de la scène, dans l'ordre de construction (accès clavier des missions d'identification). */
  public listTags(): string[] {
    const tags: string[] = [];
    this.modelGroup.traverse((o) => {
      if (o.userData.tag) tags.push(String(o.userData.tag));
    });
    return tags;
  }

  public setOrbitEnabled(enabled: boolean) {
    this.controls.enabled = enabled;
  }

  public onFrame(cb: (dt: number) => void): () => void {
    this.frameListeners.add(cb);
    return () => this.frameListeners.delete(cb);
  }

  public projectToScreen(obj: THREE.Object3D): { x: number; y: number } {
    const v = new THREE.Vector3();
    obj.getWorldPosition(v).project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height };
  }

  public getFxContext(): FxContext {
    return {
      scene: this.scene,
      camera: this.camera,
      modelGroup: this.modelGroup,
      isSoftwareGl: this.isSoftwareGl,
      onFrame: (cb) => this.onFrame(cb),
      findByTag: (tag) => this.findByTag(tag),
    };
  }

  public updateParams(next: Partial<SceneParams>) {
    const prevTheme = this.params.darkMode;
    const prevPreset = this.params.preset;
    const prevA = this.params.a;
    const prevB = this.params.b;
    const prevC = this.params.c;
    const prevExplode = this.params.explode;
    const prevAccent = this.params.accentHex;

    this.params = { ...this.params, ...next };
    this.axesGroup.visible = this.params.showGrid;

    if (prevTheme !== this.params.darkMode) {
      const bgHex = this.params.darkMode ? 0x0b1120 : 0xf1f5f9;
      this.scene.background = new THREE.Color(bgHex);
      this.scene.fog = new THREE.FogExp2(bgHex, 0.024);
      const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
      const mat = this.floorMesh.material as THREE.MeshStandardMaterial;
      mat.map?.dispose();
      mat.map = createCoordinateGridTexture(this.params.darkMode, maxAniso);
      mat.needsUpdate = true;

      // Update plinth color
      const disc = this.plinthGroup.children[0] as THREE.Mesh;
      (disc.material as THREE.MeshStandardMaterial).color.setHex(
        this.params.darkMode ? 0x1e293b : 0xe2e8f0
      );
    }

    if (
      prevPreset !== this.params.preset ||
      prevA !== this.params.a ||
      prevB !== this.params.b ||
      prevC !== this.params.c ||
      prevExplode !== this.params.explode ||
      prevAccent !== this.params.accentHex
    ) {
      this.rebuildModel();
    }
  }

  public setCameraPreset(preset: CameraPreset) {
    this.cameraTransitionActive = true;
    switch (preset) {
      case 'top':
        _camTargetPos.set(0.01, 10.5, 0.01);
        _camTargetLook.set(0, 0.5, 0);
        break;
      case 'front':
        _camTargetPos.set(0, 2.6, 9.5);
        _camTargetLook.set(0, 1.2, 0);
        break;
      case 'iso':
        _camTargetPos.set(7.5, 7.5, 7.5);
        _camTargetLook.set(0, 1.0, 0);
        break;
      case 'perspective':
      default:
        _camTargetPos.set(6.5, 5.2, 7.5);
        _camTargetLook.set(0, 1.0, 0);
        break;
    }
  }

  public resize() {
    if (this.disposed) return;
    const width = Math.max(320, this.container.clientWidth);
    const height = Math.max(240, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private rebuildModel() {
    this.clearModelGroup();

    const accent = new THREE.Color(this.params.accentHex || '#4f46e5');
    const accentMat = new THREE.MeshPhysicalMaterial({
      color: accent,
      roughness: 0.2,
      metalness: 0.35,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    });
    const brushedMetalMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.32,
      metalness: 0.85,
    });
    const darkSlateMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.65,
      metalness: 0.2,
    });
    const warmBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.22,
      metalness: 0.9,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      roughness: 0.08,
      metalness: 0.05,
      transmission: this.isSoftwareGl ? 0 : 0.78,
      transparent: true,
      opacity: this.isSoftwareGl ? 0.38 : 1,
      ior: 1.5,
      thickness: 0.8,
      depthWrite: false,
    });

    const { preset, a, b, c, explode } = this.params;

    switch (preset) {
      case 'fractions_3d': {
        const denom = Math.max(2, Math.min(12, Math.round(b)));
        const num = Math.max(1, Math.min(denom, Math.round(a)));
        const totalWidth = 4.8;
        const sliceW = totalWidth / denom;
        const gap = 0.03 + explode * 0.22;
        const startX = -((denom - 1) * (sliceW + gap)) / 2;

        // Brass frame rail underneath
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(totalWidth + denom * gap + 0.4, 0.12, 1.5),
          darkSlateMat
        );
        rail.position.y = 0.06;
        rail.receiveShadow = true;
        this.modelGroup.add(rail);

        for (let i = 0; i < denom; i++) {
          const active = i < num;
          const h = active ? 1.5 * c : 1.15 * c;
          const slice = new THREE.Mesh(
            new THREE.BoxGeometry(sliceW * 0.92, h, 1.2),
            active ? accentMat : brushedMetalMat
          );
          slice.position.set(startX + i * (sliceW + gap), 0.12 + h / 2, 0);
          slice.userData.tag = `slice-${i}`;
          slice.castShadow = true;
          slice.receiveShadow = true;
          this.modelGroup.add(slice);
          if (active) {
            this.animatedSubparts.push({ obj: slice, baseY: slice.position.y, phase: i * 0.45 });
          }
        }
        break;
      }

      case 'volumes_6e': {
        const L = Math.max(1, Math.min(6, Math.round(a)));
        const l = Math.max(1, Math.min(5, Math.round(b)));
        const h = Math.max(1, Math.min(5, Math.round(c)));
        const count = L * l * h;
        const cubeSize = 0.58;
        const step = cubeSize + explode * 0.25 + 0.03;

        const geo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const inst = new THREE.InstancedMesh(geo, accentMat, count);
        inst.castShadow = true;
        inst.receiveShadow = true;

        const mat4 = new THREE.Matrix4();
        const color = new THREE.Color();
        let idx = 0;
        for (let y = 0; y < h; y++) {
          for (let z = 0; z < l; z++) {
            for (let x = 0; x < L; x++) {
              const px = (x - (L - 1) / 2) * step;
              const py = cubeSize / 2 + y * step;
              const pz = (z - (l - 1) / 2) * step;
              mat4.makeTranslation(px, py, pz);
              inst.setMatrixAt(idx, mat4);
              color.copy(accent).offsetHSL(y * 0.03, 0, (y - 1) * 0.06);
              inst.setColorAt(idx, color);
              idx++;
            }
          }
        }
        inst.instanceMatrix.needsUpdate = true;
        if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
        inst.computeBoundingSphere();
        this.modelGroup.add(inst);

        // Caliper brass frame showing outer bounds
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(L * step + 0.2, 0.08, l * step + 0.2),
          warmBrassMat
        );
        frame.position.y = 0.04;
        this.modelGroup.add(frame);
        break;
      }

      case 'pythagore_4e': {
        const sa = Math.max(1.0, Math.min(3.0, a * 0.65));
        const sb = Math.max(1.0, Math.min(3.0, b * 0.65));
        const sc = Math.sqrt(sa * sa + sb * sb);
        const thickness = 0.28;
        const elev = 0.15 + c * 0.45 + explode * 0.4;

        // Right triangle prism
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(sa, 0);
        shape.lineTo(0, sb);
        shape.closePath();

        const triGeo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02 });
        const triMesh = new THREE.Mesh(triGeo, darkSlateMat);
        triMesh.rotation.x = -Math.PI / 2;
        triMesh.position.set(-sa / 2, elev, sb / 2);
        triMesh.castShadow = true;
        this.modelGroup.add(triMesh);

        // Square on side a
        const sqA = new THREE.Mesh(new THREE.BoxGeometry(sa, thickness, sa), accentMat);
        sqA.position.set(0, elev + thickness / 2, sb / 2 + sa / 2 + 0.05 + explode * 0.3);
        sqA.castShadow = true;
        this.modelGroup.add(sqA);

        // Square on side b
        const sqB = new THREE.Mesh(new THREE.BoxGeometry(sb, thickness, sb), warmBrassMat);
        sqB.position.set(-sa / 2 - sb / 2 - 0.05 - explode * 0.3, elev + thickness / 2, 0);
        sqB.castShadow = true;
        this.modelGroup.add(sqB);

        // Square on hypotenuse c
        const angle = Math.atan2(sb, sa);
        const sqC = new THREE.Mesh(new THREE.BoxGeometry(sc, thickness, sc), brushedMetalMat);
        const midX = 0;
        const midZ = 0;
        const nx = Math.sin(angle);
        const nz = -Math.cos(angle);
        const offset = sc / 2 + 0.06 + explode * 0.35;
        sqC.position.set(midX + nx * offset, elev + thickness / 2, midZ + nz * offset);
        sqC.rotation.y = angle;
        sqC.castShadow = true;
        this.modelGroup.add(sqC);
        break;
      }

      case 'trigonometrie_3e': {
        const radius = Math.max(1.5, Math.min(3.2, b * 0.72));
        const rad = THREE.MathUtils.degToRad(a);

        // Unit Circle Torus
        const torus = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.05, 16, 72), brushedMetalMat);
        torus.position.y = radius + 0.25;
        torus.castShadow = true;
        this.modelGroup.add(torus);

        // Origin & rotating radius arm
        const cy = radius + 0.25;
        const px = Math.cos(rad) * radius;
        const py = cy + Math.sin(rad) * radius;

        const arm = createVectorArrowGroup(
          new THREE.Vector3(0, cy, 0),
          new THREE.Vector3(px, py, 0),
          accent.getHex(),
          0.055
        );
        this.modelGroup.add(arm);

        // Cos horizontal bar
        const cosLen = Math.max(0.05, Math.abs(px));
        const cosBar = new THREE.Mesh(new THREE.BoxGeometry(cosLen, 0.09, 0.14), warmBrassMat);
        cosBar.position.set(px / 2, cy, 0);
        this.modelGroup.add(cosBar);

        // Sin vertical bar
        const sinLen = Math.max(0.05, Math.abs(py - cy));
        const sinBar = new THREE.Mesh(new THREE.BoxGeometry(0.09, sinLen, 0.14), accentMat);
        sinBar.position.set(px, cy + sinLen / 2, 0);
        this.modelGroup.add(sinBar);

        // Point sphere
        const marker = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 24), warmBrassMat);
        marker.position.set(px, py, 0);
        this.animatedSubparts.push({ obj: marker, baseY: py, phase: 0 });
        this.modelGroup.add(marker);
        break;
      }

      case 'sphere_3e': {
        const R = Math.max(1.2, Math.min(2.6, a * 0.75));
        const d = Math.min(R - 0.12, b * 0.75);
        const rSec = Math.sqrt(Math.max(0.02, R * R - d * d));
        const cy = R + 0.2;

        // Outer glass sphere
        const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 36, 36), glassMat);
        sphere.position.y = cy;
        sphere.renderOrder = 3;
        this.modelGroup.add(sphere);

        // Center core
        const centerDot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), warmBrassMat);
        centerDot.position.y = cy;
        this.modelGroup.add(centerDot);

        // Secant plane disc
        const planeY = cy + d;
        const secantPlane = new THREE.Mesh(
          new THREE.BoxGeometry(R * 2.5, 0.03, R * 2.5),
          new THREE.MeshStandardMaterial({
            color: 0x64748b,
            transparent: true,
            opacity: 0.35,
            roughness: 0.4,
          })
        );
        secantPlane.position.y = planeY;
        this.modelGroup.add(secantPlane);

        // Intersection ring of radius rSec
        const ring = new THREE.Mesh(new THREE.TorusGeometry(rSec, 0.05, 16, 64), accentMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = planeY + 0.02;
        this.modelGroup.add(ring);

        // Right triangle inside: d vertical, r horizontal, R hypotenuse
        const dRod = createVectorArrowGroup(
          new THREE.Vector3(0, cy, 0),
          new THREE.Vector3(0, planeY, 0),
          0xf59e0b,
          0.03
        );
        const rRod = createVectorArrowGroup(
          new THREE.Vector3(0, planeY, 0),
          new THREE.Vector3(rSec, planeY, 0),
          accent.getHex(),
          0.03
        );
        const hypRod = createVectorArrowGroup(
          new THREE.Vector3(0, cy, 0),
          new THREE.Vector3(rSec, planeY, 0),
          0x94a3b8,
          0.025
        );
        this.modelGroup.add(dRod, rRod, hypRod);
        break;
      }

      case 'integrales_term': {
        const n = Math.max(3, Math.min(24, Math.round(a)));
        const upper = Math.max(2, Math.min(4, c));
        const widthTotal = 5.2;
        const dx = widthTotal / n;
        const startX = -widthTotal / 2;

        // Smooth analytical curve tube
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 48; i++) {
          const t = i / 48;
          const xWorld = startX + t * widthTotal;
          const xMath = t * upper;
          const yMath = b * (0.28 * xMath * xMath + 0.35);
          pts.push(new THREE.Vector3(xWorld, yMath + 0.1, 0));
        }
        const curve = new THREE.CatmullRomCurve3(pts);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.06, 12, false), warmBrassMat);
        tube.castShadow = true;
        this.modelGroup.add(tube);

        // Riemann prism bars
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          const xWorld = startX + t * widthTotal;
          const xMath = t * upper;
          const hVal = Math.max(0.15, b * (0.28 * xMath * xMath + 0.35));
          const bar = new THREE.Mesh(
            new THREE.BoxGeometry(dx * 0.88, hVal, 1.1),
            i % 2 === 0 ? accentMat : brushedMetalMat
          );
          bar.position.set(xWorld, 0.1 + hVal / 2, explode * (i % 2 === 0 ? 0.25 : -0.25));
          bar.castShadow = true;
          bar.receiveShadow = true;
          this.modelGroup.add(bar);
        }
        break;
      }

      case 'prediction_term': {
        // 3D Sigmoid & Loss Optimization Landscape + Gradient Descent Nodes
        const segs = 28;
        const size = 4.8;
        const planeGeo = new THREE.PlaneGeometry(size, size, segs, segs);
        planeGeo.rotateX(-Math.PI / 2);
        const posAttr = planeGeo.attributes.position;
        const colors: number[] = [];
        const cLow = new THREE.Color(0x0ea5e9);
        const cHigh = accent.clone();
        const tmpColor = new THREE.Color();

        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          const logit = a * (x * 0.65) + b + 0.35 * Math.sin(z * 1.1);
          const sig = 1 / (1 + Math.exp(-logit));
          const y = 0.25 + sig * 2.4;
          posAttr.setY(i, y);
          tmpColor.copy(cLow).lerp(cHigh, sig);
          colors.push(tmpColor.r, tmpColor.g, tmpColor.b);
        }
        planeGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        planeGeo.computeVertexNormals();

        const surfaceMat = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.35,
          metalness: 0.25,
          side: THREE.DoubleSide,
        });
        const surface = new THREE.Mesh(planeGeo, surfaceMat);
        surface.castShadow = true;
        surface.receiveShadow = true;
        this.modelGroup.add(surface);

        // Gradient trajectory spheres along sigmoid slice z=0
        for (let k = -2; k <= 2; k++) {
          const x = k * 0.85;
          const logit = a * (x * 0.65) + b;
          const sig = 1 / (1 + Math.exp(-logit));
          const y = 0.25 + sig * 2.4 + 0.14 + explode * 0.4;
          const node = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), warmBrassMat);
          node.position.set(x, y, 0);
          node.castShadow = true;
          this.animatedSubparts.push({ obj: node, baseY: y, phase: k * 0.5 });
          this.modelGroup.add(node);
        }
        break;
      }

      case 'vecteurs_2nde':
      case 'produit_scalaire_1ere': {
        const u = new THREE.Vector3(a * 0.9, c * 0.8, 0.6);
        const angleRad = preset === 'produit_scalaire_1ere' ? THREE.MathUtils.degToRad(a * 12) : 0.9;
        const v = new THREE.Vector3(
          Math.cos(angleRad) * b * 0.9,
          0.6,
          Math.sin(angleRad) * b * 0.9
        );
        const sum = u.clone().add(v);
        const origin = new THREE.Vector3(0, 0.2, 0);

        this.modelGroup.add(createVectorArrowGroup(origin, origin.clone().add(u), accent.getHex(), 0.065));
        this.modelGroup.add(createVectorArrowGroup(origin, origin.clone().add(v), 0xf59e0b, 0.065));
        this.modelGroup.add(createVectorArrowGroup(origin, origin.clone().add(sum), 0x10b981, 0.075));

        const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 20), brushedMetalMat);
        pivot.position.copy(origin);
        this.modelGroup.add(pivot);
        break;
      }

      case 'pyramide_4e':
      case 'prisme_5e': {
        const radius = Math.max(0.8, Math.min(2.0, a * 0.7));
        const height = Math.max(1.4, Math.min(3.6, b * 0.95));
        const isPyramid = preset === 'pyramide_4e';

        // Outer translucent bounding prism/cylinder
        const outerGeo = isPyramid
          ? new THREE.BoxGeometry(radius * 2, height, radius * 2)
          : new THREE.CylinderGeometry(radius, radius, height, 32);
        const outer = new THREE.Mesh(outerGeo, glassMat);
        outer.position.y = height / 2 + 0.1 + explode * 0.6;
        outer.renderOrder = 2;
        this.modelGroup.add(outer);

        // Inner solid core
        const innerGeo = isPyramid
          ? new THREE.ConeGeometry(radius * 1.38, height, 4)
          : new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, height * 0.96, 32);
        const inner = new THREE.Mesh(innerGeo, accentMat);
        inner.position.y = height / 2 + 0.1;
        if (isPyramid) inner.rotation.y = Math.PI / 4;
        inner.castShadow = true;
        this.modelGroup.add(inner);

        // Height axis rod
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, height + 0.3, 12), warmBrassMat);
        rod.position.y = height / 2 + 0.1;
        this.modelGroup.add(rod);
        break;
      }

      case 'pc_states_matter': {
        // Glass containment chamber showing crystal lattice (solid), mobile cluster (liquid), or agitated gas
        const boxSize = Math.max(1.8, Math.min(3.2, 1.5 + c * 0.45));
        const chamber = new THREE.Mesh(
          new THREE.BoxGeometry(boxSize, boxSize, boxSize),
          glassMat
        );
        chamber.position.y = boxSize / 2 + 0.12;
        chamber.renderOrder = 2;
        this.modelGroup.add(chamber);

        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(boxSize, boxSize, boxSize)),
          new THREE.LineBasicMaterial({ color: 0x64748b })
        );
        edges.position.copy(chamber.position);
        this.modelGroup.add(edges);

        const isSolid = a < 0;
        const isGas = a >= 100;
        const particleColor = isSolid ? 0x38bdf8 : isGas ? 0xf97316 : accent.getHex();
        const particleMat = new THREE.MeshPhysicalMaterial({
          color: particleColor,
          roughness: 0.2,
          metalness: 0.25,
          clearcoat: 0.85,
        });

        const gridN = 3;
        const particleRadius = Math.max(0.11, Math.min(0.22, 0.1 + b * 0.04));
        const sphereGeo = new THREE.SphereGeometry(particleRadius, 18, 18);
        const spacing = isSolid ? particleRadius * 2.35 : isGas ? boxSize * 0.34 : particleRadius * 2.75;
        const vibAmp = isSolid ? 0.015 : isGas ? 0.24 : 0.08;
        const vibSpeed = isSolid ? 1.5 : isGas ? 5.2 : 2.8;

        let idx = 0;
        for (let ix = 0; ix < gridN; ix++) {
          for (let iy = 0; iy < gridN; iy++) {
            for (let iz = 0; iz < gridN; iz++) {
              const p = new THREE.Mesh(sphereGeo, particleMat);
              const px = (ix - 1) * spacing * (1 + explode * 0.45);
              const pyBase = isSolid
                ? 0.45 + iy * spacing
                : isGas
                  ? 0.4 + ((iy + 0.5) / gridN) * (boxSize - 0.5)
                  : 0.35 + iy * spacing * 0.85;
              const pz = (iz - 1) * spacing * (1 + explode * 0.45);
              const jitter = isSolid ? 0 : Math.sin(idx * 2.17) * (isGas ? 0.25 : 0.08);
              p.position.set(
                THREE.MathUtils.clamp(px + jitter, -boxSize * 0.42, boxSize * 0.42),
                THREE.MathUtils.clamp(pyBase, 0.3, boxSize - 0.1),
                THREE.MathUtils.clamp(pz + Math.cos(idx * 1.73) * (isGas ? 0.25 : 0.08), -boxSize * 0.42, boxSize * 0.42)
              );
              p.castShadow = true;
              this.animatedSubparts.push({
                obj: p,
                baseY: p.position.y,
                phase: idx * 0.9,
                amp: vibAmp,
                speed: vibSpeed,
              });
              this.modelGroup.add(p);
              idx++;
            }
          }
        }
        break;
      }

      case 'pc_circuit_3d': {
        // 3D electrical circuit board: battery, resistor, emissive lamp, and animated current carriers
        const branches = Math.round(c) >= 2 ? 2 : 1;
        const rEq = branches === 2 ? b / 2 : b;
        const current = a / Math.max(1, rEq);
        const halfW = 2.1;
        const halfD = 1.4;
        const wireY = 0.55;

        // Board base
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(halfW * 2 + 0.8, 0.14, halfD * 2 + 0.8),
          darkSlateMat
        );
        board.position.y = 0.15;
        board.receiveShadow = true;
        this.modelGroup.add(board);

        const wireMat = new THREE.MeshStandardMaterial({
          color: 0xd97706,
          roughness: 0.25,
          metalness: 0.9,
        });

        // Rectangular perimeter copper rails
        const railFront = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, halfW * 2, 12), wireMat);
        railFront.rotation.z = Math.PI / 2;
        railFront.position.set(0, wireY, halfD);
        const railBack = railFront.clone();
        railBack.position.set(0, wireY, -halfD);
        const railLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, halfD * 2, 12), wireMat);
        railLeft.rotation.x = Math.PI / 2;
        railLeft.position.set(-halfW, wireY, 0);
        const railRight = railLeft.clone();
        railRight.position.set(halfW, wireY, 0);
        this.modelGroup.add(railFront, railBack, railLeft, railRight);

        // Battery (left branch)
        const batBody = new THREE.Mesh(
          new THREE.CylinderGeometry(0.32, 0.32, 1.1, 24),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.5 })
        );
        batBody.rotation.x = Math.PI / 2;
        batBody.position.set(-halfW, wireY + 0.12 + explode * 0.35, 0);
        batBody.castShadow = true;
        const batCapPos = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.18, 0.18, 16),
          new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.4 })
        );
        batCapPos.rotation.x = Math.PI / 2;
        batCapPos.position.set(-halfW, wireY + 0.12 + explode * 0.35, -0.64);
        this.modelGroup.add(batBody, batCapPos);

        // Resistor(s)
        const addResistor = (zPos: number) => {
          const resBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.95, 20),
            new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.45, metalness: 0.1 })
          );
          resBody.rotation.z = Math.PI / 2;
          resBody.position.set(0, wireY + explode * 0.3, zPos);
          resBody.castShadow = true;
          this.modelGroup.add(resBody);

          const bandColors = [0xef4444, 0x3b82f6, 0x10b981];
          bandColors.forEach((col, bi) => {
            const band = new THREE.Mesh(
              new THREE.CylinderGeometry(0.21, 0.21, 0.08, 16),
              new THREE.MeshStandardMaterial({ color: col, roughness: 0.35 })
            );
            band.rotation.z = Math.PI / 2;
            band.position.set(-0.24 + bi * 0.24, wireY + explode * 0.3, zPos);
            this.modelGroup.add(band);
          });
        };
        addResistor(-halfD);

        if (branches === 2) {
          const midRail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, halfW * 2, 12), wireMat);
          midRail.rotation.z = Math.PI / 2;
          midRail.position.set(0, wireY, 0);
          this.modelGroup.add(midRail);
          addResistor(0);
        }

        // Glowing incandescent bulb on right branch
        const glowIntensity = Math.min(2.6, Math.max(0.15, current * 1.1));
        const bulbMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: glowIntensity,
          roughness: 0.15,
          metalness: 0.1,
        });
        const bulbSocket = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.32, 20), brushedMetalMat);
        bulbSocket.position.set(halfW, wireY + 0.16, 0);
        const bulbGlobe = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), bulbMat);
        bulbGlobe.position.set(halfW, wireY + 0.62 + explode * 0.4, 0);
        this.modelGroup.add(bulbSocket, bulbGlobe);

        // Animated electron/current carriers moving around the perimeter loop
        const chargeMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.8,
          roughness: 0.2,
        });
        const chargeGeo = new THREE.SphereGeometry(0.095, 12, 12);
        const speed = Math.min(3.2, Math.max(0.25, current * 0.85));
        const numCharges = 12;
        for (let i = 0; i < numCharges; i++) {
          const ch = new THREE.Mesh(chargeGeo, chargeMat);
          this.orbitSubparts.push({
            obj: ch,
            radiusX: 0,
            radiusZ: 0,
            speed,
            phase: i / numCharges,
            centerY: wireY,
            tiltX: 0,
            tiltZ: 0,
            rectLoop: { halfW, halfD, y: wireY },
          });
          this.modelGroup.add(ch);
        }
        break;
      }

      case 'pc_optics_3d': {
        // 3D Snell-Descartes glass optical diopter slab + incident, reflected & refracted laser beams
        const i1Rad = THREE.MathUtils.degToRad(a);
        const sinI2 = (b / Math.max(0.1, c)) * Math.sin(i1Rad);
        const isTir = sinI2 > 1;
        const i2Rad = isTir ? Math.PI / 2 : Math.asin(Math.max(-1, Math.min(1, sinI2)));

        const surfaceY = 1.65;

        // Lower optical medium (glass block)
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(5.2, 1.5, 2.2),
          glassMat
        );
        slab.position.set(0, surfaceY - 0.75, 0);
        slab.renderOrder = 2;
        this.modelGroup.add(slab);

        const slabEdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.BoxGeometry(5.2, 1.5, 2.2)),
          new THREE.LineBasicMaterial({ color: 0x38bdf8 })
        );
        slabEdges.position.copy(slab.position);
        this.modelGroup.add(slabEdges);

        // Normal dotted/vertical reference rod
        const normalRod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.025, 3.2, 12),
          brushedMetalMat
        );
        normalRod.position.set(0, surfaceY, 0);
        normalRod.userData.tag = 'normal';
        this.modelGroup.add(normalRod);

        // Incident laser emitter + ray (from upper left to (0, surfaceY, 0))
        const rayLen = 2.2;
        const incStart = new THREE.Vector3(
          -Math.sin(i1Rad) * rayLen,
          surfaceY + Math.cos(i1Rad) * rayLen,
          0
        );
        const hitPt = new THREE.Vector3(0, surfaceY, 0);
        this.modelGroup.add(createVectorArrowGroup(incStart, hitPt, 0xef4444, 0.055));

        // Laser source housing
        const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.45, 18), darkSlateMat);
        emitter.position.copy(incStart);
        emitter.lookAt(hitPt);
        emitter.rotateX(Math.PI / 2);
        this.modelGroup.add(emitter);

        // Reflected beam (upper right)
        const reflEnd = new THREE.Vector3(
          Math.sin(i1Rad) * rayLen,
          surfaceY + Math.cos(i1Rad) * rayLen,
          0
        );
        this.modelGroup.add(
          createVectorArrowGroup(hitPt, reflEnd, isTir ? 0xef4444 : 0xf59e0b, isTir ? 0.055 : 0.038)
        );

        // Refracted beam inside medium 2 (unless Total Internal Reflection)
        if (!isTir) {
          const refrLen = 1.65;
          const refrEnd = new THREE.Vector3(
            Math.sin(i2Rad) * refrLen,
            surfaceY - Math.cos(i2Rad) * refrLen,
            0
          );
          this.modelGroup.add(createVectorArrowGroup(hitPt, refrEnd, 0x10b981, 0.055));
        }

        // Hit point glow marker
        const hitMarker = new THREE.Mesh(
          new THREE.SphereGeometry(0.11, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.4 })
        );
        hitMarker.position.copy(hitPt);
        this.modelGroup.add(hitMarker);
        break;
      }

      case 'pc_molecule_3d': {
        // 3D CPK ball-and-stick VSEPR molecules: 1=H2O (bent), 2=CO2 (linear), 3=CH4 (tetrahedral)
        const molIdx = Math.round(a);
        const bondLen = Math.max(1.0, Math.min(2.2, 1.35 * c)) + explode * 0.45;
        const centerY = 1.9;

        const matO = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.18, metalness: 0.15, clearcoat: 0.9 });
        const matC = new THREE.MeshPhysicalMaterial({ color: 0x1e293b, roughness: 0.25, metalness: 0.35, clearcoat: 0.8 });
        const matH = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.18, metalness: 0.1, clearcoat: 0.9 });

        const addBond = (p1: THREE.Vector3, p2: THREE.Vector3, isDouble = false) => {
          const dir = p2.clone().sub(p1);
          const len = dir.length();
          const mid = p1.clone().add(p2).multiplyScalar(0.5);
          const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
          const offsets = isDouble ? [-0.09, 0.09] : [0];
          for (const off of offsets) {
            const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, len, 14), brushedMetalMat);
            cyl.position.copy(mid);
            cyl.position.z += off;
            cyl.quaternion.copy(quat);
            cyl.castShadow = true;
            this.modelGroup.add(cyl);
          }
        };

        const centerPos = new THREE.Vector3(0, centerY, 0);

        if (molIdx === 1) {
          // H2O bent molecule + dipole vector
          const halfAngle = THREE.MathUtils.degToRad(Math.min(175, Math.max(70, b)) / 2);
          const oAtom = new THREE.Mesh(new THREE.SphereGeometry(0.52, 28, 28), matO);
          oAtom.position.copy(centerPos);
          oAtom.castShadow = true;
          this.modelGroup.add(oAtom);

          const h1Pos = new THREE.Vector3(-Math.sin(halfAngle) * bondLen, centerY - Math.cos(halfAngle) * bondLen, 0);
          const h2Pos = new THREE.Vector3(Math.sin(halfAngle) * bondLen, centerY - Math.cos(halfAngle) * bondLen, 0);
          [h1Pos, h2Pos].forEach((pos, idx) => {
            const hAtom = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), matH);
            hAtom.position.copy(pos);
            hAtom.castShadow = true;
            this.animatedSubparts.push({ obj: hAtom, baseY: pos.y, phase: idx * Math.PI, amp: 0.03 });
            this.modelGroup.add(hAtom);
            addBond(centerPos, pos, false);
          });
          // Net dipole arrow pointing toward O
          this.modelGroup.add(
            createVectorArrowGroup(new THREE.Vector3(0, centerY - 0.9, 0.45), new THREE.Vector3(0, centerY + 0.75, 0.45), accent.getHex(), 0.05)
          );
        } else if (molIdx === 2) {
          // CO2 linear double-bonded molecule
          const cAtom = new THREE.Mesh(new THREE.SphereGeometry(0.48, 28, 28), matC);
          cAtom.position.copy(centerPos);
          cAtom.castShadow = true;
          this.modelGroup.add(cAtom);

          const o1Pos = new THREE.Vector3(-bondLen * 1.15, centerY, 0);
          const o2Pos = new THREE.Vector3(bondLen * 1.15, centerY, 0);
          [o1Pos, o2Pos].forEach((pos) => {
            const oAtom = new THREE.Mesh(new THREE.SphereGeometry(0.44, 24, 24), matO);
            oAtom.position.copy(pos);
            oAtom.castShadow = true;
            this.modelGroup.add(oAtom);
            addBond(centerPos, pos, true);
          });
        } else {
          // CH4 regular tetrahedron (109.5°)
          const cAtom = new THREE.Mesh(new THREE.SphereGeometry(0.48, 28, 28), matC);
          cAtom.position.copy(centerPos);
          cAtom.castShadow = true;
          this.modelGroup.add(cAtom);

          const dirs = [
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0.9428, -0.3333, 0),
            new THREE.Vector3(-0.4714, -0.3333, 0.8165),
            new THREE.Vector3(-0.4714, -0.3333, -0.8165),
          ];
          dirs.forEach((d) => {
            const pos = centerPos.clone().addScaledVector(d.normalize(), bondLen);
            const hAtom = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 24), matH);
            hAtom.position.copy(pos);
            hAtom.castShadow = true;
            this.modelGroup.add(hAtom);
            addBond(centerPos, pos, false);
          });
        }
        break;
      }

      case 'pc_atom_3d': {
        // 3D Bohr/Nuclear atom with clustered protons & neutrons + orbiting electrons
        const z = Math.max(1, Math.min(10, Math.round(a)));
        const n = Math.max(0, Math.min(12, Math.round(b)));
        const centerY = 2.05;

        const protonMat = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.2, metalness: 0.2, clearcoat: 0.8 });
        const neutronMat = new THREE.MeshPhysicalMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.35 });
        const nucGeo = new THREE.SphereGeometry(0.18, 16, 16);

        const totalNucleons = z + n;
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const decaySpread = Math.max(0, c) * 0.08;
        for (let i = 0; i < totalNucleons; i++) {
          const t = totalNucleons === 1 ? 0 : i / (totalNucleons - 1);
          const yOff = 1 - 2 * t;
          const rSlice = Math.sqrt(Math.max(0, 1 - yOff * yOff));
          const theta = goldenAngle * i;
          const rad = (0.28 + Math.cbrt(totalNucleons) * 0.09) * (1 + explode * 0.8 + decaySpread);
          const mesh = new THREE.Mesh(nucGeo, i < z ? protonMat : neutronMat);
          mesh.position.set(
            Math.cos(theta) * rSlice * rad,
            centerY + yOff * rad,
            Math.sin(theta) * rSlice * rad
          );
          mesh.castShadow = true;
          this.modelGroup.add(mesh);
        }

        // Electron shells: K (max 2) and L (max 8)
        const shells = [
          { count: Math.min(2, z), radius: 1.55, tiltX: 0.25, tiltZ: 0.15, speed: 2.2 },
          { count: Math.max(0, z - 2), radius: 2.45, tiltX: -0.45, tiltZ: 0.35, speed: 1.35 },
        ];
        const electronMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 1.1,
          roughness: 0.15,
        });
        const eGeo = new THREE.SphereGeometry(0.11, 16, 16);

        shells.forEach((shell) => {
          if (shell.count <= 0) return;
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(shell.radius, 0.018, 10, 64),
            new THREE.MeshBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.55 })
          );
          ring.position.y = centerY;
          ring.rotation.set(Math.PI / 2 + shell.tiltX, 0, shell.tiltZ);
          this.modelGroup.add(ring);

          for (let ei = 0; ei < shell.count; ei++) {
            const eMesh = new THREE.Mesh(eGeo, electronMat);
            this.orbitSubparts.push({
              obj: eMesh,
              radiusX: shell.radius,
              radiusZ: shell.radius,
              speed: shell.speed,
              phase: (ei / shell.count) * Math.PI * 2,
              centerY,
              tiltX: shell.tiltX,
              tiltZ: shell.tiltZ,
            });
            this.modelGroup.add(eMesh);
          }
        });
        break;
      }

      case 'pc_gravity_3d': {
        // 3D planetary gravity & orbital motion with radial force vector
        const centerY = 1.9;
        const planetRadius = Math.max(0.45, Math.min(1.05, 0.4 + a * 0.06));
        const orbitR = Math.max(1.6, Math.min(3.5, b));

        const star = new THREE.Mesh(
          new THREE.SphereGeometry(planetRadius, 32, 32),
          new THREE.MeshStandardMaterial({
            color: 0xf59e0b,
            emissive: 0xd97706,
            emissiveIntensity: 0.45,
            roughness: 0.35,
            metalness: 0.2,
          })
        );
        star.position.set(0, centerY, 0);
        star.castShadow = true;
        this.modelGroup.add(star);

        // Orbital track torus
        const track = new THREE.Mesh(
          new THREE.TorusGeometry(orbitR, 0.024, 12, 72),
          new THREE.MeshBasicMaterial({ color: accent.getHex(), transparent: true, opacity: 0.65 })
        );
        track.rotation.x = Math.PI / 2;
        track.position.y = centerY;
        this.modelGroup.add(track);

        // Orbiting satellite group (planet + inward gravity vector)
        const satGroup = new THREE.Group();
        const satBody = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), accentMat);
        satBody.castShadow = true;
        satGroup.add(satBody);

        // Static radial attraction vector visualized at initial angle for pedagogical clarity
        const satStart = new THREE.Vector3(orbitR, centerY, 0);
        const fLen = Math.min(orbitR - planetRadius - 0.15, Math.max(0.55, (a * 0.25) / (orbitR * 0.5)));
        const forceVec = createVectorArrowGroup(
          satStart,
          new THREE.Vector3(orbitR - fLen, centerY, 0),
          0xef4444,
          0.055
        );
        this.modelGroup.add(forceVec);

        // Tangential velocity vector at initial point
        const velVec = createVectorArrowGroup(
          satStart,
          new THREE.Vector3(orbitR, centerY, -Math.min(1.6, 0.6 + Math.sqrt(a / orbitR) * 0.55)),
          0x10b981,
          0.048
        );
        this.modelGroup.add(velVec);

        const orbitalSpeed = Math.sqrt(Math.max(0.5, a) / Math.max(0.8, orbitR)) * 0.85;
        this.orbitSubparts.push({
          obj: satGroup,
          radiusX: orbitR,
          radiusZ: orbitR,
          speed: orbitalSpeed,
          phase: 0,
          centerY,
          tiltX: 0,
          tiltZ: 0,
        });
        this.modelGroup.add(satGroup);
        break;
      }

      case 'pc_wave_3d': {
        // 3D progressive wave surface mesh + concentric wavefront crest rings
        const segs = 36;
        const size = 4.6;
        const waveGeo = new THREE.PlaneGeometry(size, size, segs, segs);
        waveGeo.rotateX(-Math.PI / 2);
        const pos = waveGeo.attributes.position;
        const k = Math.max(0.8, a * 1.3);
        const amp = Math.max(0.15, Math.min(1.0, b * 0.55));
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const r = Math.sqrt(x * x + z * z);
          const envelope = Math.exp(-r * 0.22);
          const y = 1.25 + amp * Math.cos(k * r) * envelope;
          pos.setY(i, Math.max(0.25, y));
        }
        waveGeo.computeVertexNormals();
        const waveMesh = new THREE.Mesh(waveGeo, accentMat);
        waveMesh.castShadow = true;
        waveMesh.receiveShadow = true;
        this.modelGroup.add(waveMesh);

        // Source oscillator sphere at center
        const source = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), warmBrassMat);
        source.position.set(0, 1.25 + amp + 0.25 + explode * 0.4, 0);
        this.animatedSubparts.push({ obj: source, baseY: source.position.y, phase: 0, amp: amp * 0.4, speed: 3.5 });
        this.modelGroup.add(source);
        break;
      }

      case 'pc_projectile_3d': {
        // 3D parabolic ballistic trajectory + launch cannon + velocity/gravity vectors
        const rad = THREE.MathUtils.degToRad(b);
        const g = Math.max(1.5, c);
        const tFlight = (2 * a * Math.sin(rad)) / g;
        const rawRange = Math.max(1, a * Math.cos(rad) * tFlight);
        const rawH = Math.max(0.5, (a * a * Math.sin(rad) * Math.sin(rad)) / (2 * g));
        const scale = Math.min(4.6 / rawRange, 2.8 / rawH);

        const pts: THREE.Vector3[] = [];
        const steps = 28;
        const xOffset = -(rawRange * scale) / 2;
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * tFlight;
          const x = xOffset + a * Math.cos(rad) * t * scale;
          const y = 0.25 + (a * Math.sin(rad) * t - 0.5 * g * t * t) * scale;
          pts.push(new THREE.Vector3(x, Math.max(0.25, y), 0));
        }

        const curve = new THREE.CatmullRomCurve3(pts);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.055, 10, false), accentMat);
        tube.castShadow = true;
        this.modelGroup.add(tube);

        // Launch plinth & initial velocity vector v0
        const startPt = pts[0];
        const endPt = pts[pts.length - 1];
        const apexPt = pts[Math.floor(steps / 2)];

        const launcher = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.35, 18), darkSlateMat);
        launcher.position.set(startPt.x, 0.2, 0);
        this.modelGroup.add(launcher);

        const v0Vec = createVectorArrowGroup(
          startPt,
          new THREE.Vector3(startPt.x + Math.cos(rad) * 1.4, startPt.y + Math.sin(rad) * 1.4, 0),
          0x10b981,
          0.055
        );
        this.modelGroup.add(v0Vec);

        // Projectile sphere at apex + downward gravity vector g
        const proj = new THREE.Mesh(new THREE.SphereGeometry(0.22, 22, 22), warmBrassMat);
        proj.position.copy(apexPt);
        proj.position.y += explode * 0.35;
        proj.castShadow = true;
        this.animatedSubparts.push({ obj: proj, baseY: proj.position.y, phase: 0, amp: 0.05 });
        this.modelGroup.add(proj);

        this.modelGroup.add(
          createVectorArrowGroup(apexPt, new THREE.Vector3(apexPt.x, Math.max(0.3, apexPt.y - 0.95), 0), 0xef4444, 0.045)
        );

        // Landing target ring
        const targetRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 12, 24), warmBrassMat);
        targetRing.rotation.x = Math.PI / 2;
        targetRing.position.set(endPt.x, 0.14, 0);
        this.modelGroup.add(targetRing);
        break;
      }

      case 'pc_titration_3d': {
        // 3D chemistry titration stand: burette, Erlenmeyer beaker with live pH indicator color, and 3D pH curve
        const vB = Math.max(0, a);
        const pKa = b;
        const vE = Math.max(4, c);

        const computePh = (vol: number) => {
          if (vol < 0.2) return Math.max(1.2, 0.5 * (pKa + 1.0));
          if (vol < vE - 0.35) return pKa + Math.log10(vol / (vE - vol));
          if (Math.abs(vol - vE) <= 0.35) return 7.0 + 0.5 * Math.max(0, pKa - 4.0) + (vol - vE) * 4.5;
          const excess = (vol - vE) / (20 + vol);
          return Math.min(13.4, 14 + Math.log10(Math.max(1e-6, excess * 0.1)));
        };

        const currentPh = Math.max(0.8, Math.min(13.6, computePh(vB)));
        // Bromothymol blue color transition: yellow (<6) -> emerald green (6..7.6) -> royal blue (>7.6)
        const liquidColor =
          currentPh < 6.0 ? 0xfacc15 : currentPh <= 7.6 ? 0x10b981 : 0x2563eb;

        // Metal laboratory stand
        const standX = -1.2;
        const standBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 1.4), darkSlateMat);
        standBase.position.set(standX, 0.14, 0);
        const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.6, 14), brushedMetalMat);
        standPole.position.set(standX - 0.55, 1.9, 0);
        const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.14), brushedMetalMat);
        clamp.position.set(standX - 0.22, 2.85, 0);
        this.modelGroup.add(standBase, standPole, clamp);

        // Glass burette above beaker
        const burette = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.85, 20), glassMat);
        burette.position.set(standX, 2.75 + explode * 0.4, 0);
        this.modelGroup.add(burette);

        const buretteLevel = Math.max(0.15, (1 - vB / 25) * 1.55);
        const titrantFluid = new THREE.Mesh(
          new THREE.CylinderGeometry(0.085, 0.085, buretteLevel, 16),
          new THREE.MeshPhysicalMaterial({ color: 0xe0f2fe, roughness: 0.1, transparent: true, opacity: 0.75 })
        );
        titrantFluid.position.set(standX, 1.9 + buretteLevel / 2 + explode * 0.4, 0);
        this.modelGroup.add(titrantFluid);

        // Beaker + reactive pH liquid
        const beaker = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.15, 28, 1, true), glassMat);
        beaker.position.set(standX, 0.8, 0);
        beaker.renderOrder = 2;
        this.modelGroup.add(beaker);

        const liquidH = Math.min(1.0, 0.42 + (vB / 25) * 0.48);
        const liquidMat = new THREE.MeshPhysicalMaterial({
          color: liquidColor,
          roughness: 0.15,
          metalness: 0.05,
          transparent: true,
          opacity: 0.82,
        });
        const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, liquidH, 28), liquidMat);
        liquid.position.set(standX, 0.24 + liquidH / 2, 0);
        this.modelGroup.add(liquid);

        // Falling droplet
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
        drop.position.set(standX, 1.45, 0);
        this.animatedSubparts.push({ obj: drop, baseY: 1.45, phase: 0, amp: 0.22, speed: 4.5 });
        this.modelGroup.add(drop);

        // 3D Live Titration Curve pH = f(V_B) next to the beaker
        const curvePts: THREE.Vector3[] = [];
        for (let i = 0; i <= 40; i++) {
          const vol = (i / 40) * 25;
          const phVal = Math.max(0.8, Math.min(13.6, computePh(vol)));
          curvePts.push(new THREE.Vector3(0.15 + (vol / 25) * 2.5, 0.25 + (phVal / 14) * 2.8, 0));
        }
        const phCurve = new THREE.CatmullRomCurve3(curvePts);
        const phTube = new THREE.Mesh(new THREE.TubeGeometry(phCurve, 56, 0.045, 10, false), accentMat);
        this.modelGroup.add(phTube);

        // Active pH cursor sphere on curve
        const cursor = new THREE.Mesh(
          new THREE.SphereGeometry(0.14, 18, 18),
          new THREE.MeshStandardMaterial({ color: liquidColor, emissive: liquidColor, emissiveIntensity: 0.6 })
        );
        cursor.position.set(0.15 + (vB / 25) * 2.5, 0.25 + (currentPh / 14) * 2.8, 0);
        this.modelGroup.add(cursor);
        break;
      }

      case 'svt_cell_3d': {
        // Composite eukaryotic cell cutaway: cell wall (if plant), translucent membrane dome, double-membrane nucleus, mitochondria, chloroplasts, ribosomes
        const mitoCount = Math.max(2, Math.min(10, Math.round(a)));
        const riboGroups = Math.max(1, Math.min(4, Math.round(b)));
        const isPlant = Math.round(c) >= 2;
        const cellR = 1.9;

        const membraneMat = new THREE.MeshPhysicalMaterial({
          color: isPlant ? 0x34d399 : 0x38bdf8,
          roughness: 0.15,
          metalness: 0.05,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const cytoBaseMat = new THREE.MeshStandardMaterial({
          color: isPlant ? 0xd1fae5 : 0xe0f2fe,
          roughness: 0.7,
          metalness: 0.05,
        });
        const nucleusMat = new THREE.MeshPhysicalMaterial({
          color: 0x6366f1,
          roughness: 0.28,
          metalness: 0.15,
          clearcoat: 0.6,
        });
        const mitoMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          roughness: 0.42,
          metalness: 0.1,
        });
        const chloroMat = new THREE.MeshStandardMaterial({
          color: 0x16a34a,
          roughness: 0.35,
          metalness: 0.12,
        });

        // Grounded basal half-section of cytoplasm
        const baseGeo = isPlant
          ? new THREE.CylinderGeometry(cellR * 1.05, cellR * 1.05, 0.36, 6)
          : new THREE.SphereGeometry(cellR, 36, 20, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
        const baseMesh = new THREE.Mesh(baseGeo, cytoBaseMat);
        baseMesh.position.y = isPlant ? 0.22 : cellR * 0.55;
        baseMesh.receiveShadow = true;
        this.modelGroup.add(baseMesh);

        // Cutaway membrane dome (upper hemisphere translucent so organelles shine inside)
        const dome = new THREE.Mesh(
          isPlant
            ? new THREE.CylinderGeometry(cellR * 1.08, cellR * 1.08, 1.45, 6, 1, true)
            : new THREE.SphereGeometry(cellR * 1.01, 36, 24, 0, Math.PI * 2, 0, Math.PI * 0.52),
          membraneMat
        );
        dome.position.y = isPlant ? 0.96 + explode * 0.35 : cellR * 0.55 + explode * 0.35;
        dome.renderOrder = 3;
        this.modelGroup.add(dome);

        // Rigid hexagonal cell wall rim + central vacuole for plant cells
        if (isPlant) {
          const wallRim = new THREE.Mesh(
            new THREE.TorusGeometry(cellR * 1.05, 0.09, 12, 6),
            new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.65, metalness: 0.08 })
          );
          wallRim.rotation.x = Math.PI / 2;
          wallRim.position.y = 0.4;
          this.modelGroup.add(wallRim);

          const vacuole = new THREE.Mesh(
            new THREE.SphereGeometry(0.68, 24, 24),
            glassMat
          );
          vacuole.scale.set(1.2, 0.72, 0.9);
          vacuole.position.set(0.75, 0.88 + explode * 0.2, -0.35);
          vacuole.renderOrder = 2;
          this.modelGroup.add(vacuole);
        }

        // Nucleus + nucleolus + nuclear envelope ring
        const nucGroup = new THREE.Group();
        nucGroup.position.set(isPlant ? -0.58 : 0, 1.05 + explode * 0.35, 0.15);
        const nucShell = new THREE.Mesh(new THREE.SphereGeometry(0.55, 28, 28), nucleusMat);
        nucShell.castShadow = true;
        nucGroup.add(nucShell);
        const nucHalo = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.035, 10, 32), warmBrassMat);
        nucHalo.rotation.x = Math.PI * 0.42;
        nucGroup.add(nucHalo);
        this.animatedSubparts.push({ obj: nucGroup, baseY: nucGroup.position.y, phase: 0, amp: 0.04 });
        this.modelGroup.add(nucGroup);

        // Mitochondria (capsule organelles with gold cristae bands)
        const mitoGeo = new THREE.CapsuleGeometry(0.14, 0.34, 8, 16);
        const cristaGeo = new THREE.TorusGeometry(0.145, 0.02, 8, 16);
        for (let i = 0; i < mitoCount; i++) {
          const ang = (i / mitoCount) * Math.PI * 2;
          const r = 1.15 + (i % 2) * 0.28;
          const mg = new THREE.Group();
          const mBody = new THREE.Mesh(mitoGeo, mitoMat);
          mBody.rotation.z = Math.PI / 2;
          mBody.castShadow = true;
          mg.add(mBody);
          const cr = new THREE.Mesh(cristaGeo, warmBrassMat);
          cr.rotation.y = Math.PI / 2;
          mg.add(cr);
          mg.position.set(Math.cos(ang) * r, 0.65 + (i % 3) * 0.22 + explode * 0.25, Math.sin(ang) * r);
          mg.rotation.y = -ang;
          this.animatedSubparts.push({ obj: mg, baseY: mg.position.y, phase: i * 0.7, amp: 0.05 });
          this.modelGroup.add(mg);
        }

        // Chloroplasts (stacked green discs in plant cells)
        if (isPlant) {
          const chGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.11, 20);
          for (let i = 0; i < 5; i++) {
            const ang = (i / 5) * Math.PI * 2 + 0.4;
            const chMesh = new THREE.Mesh(chGeo, chloroMat);
            chMesh.position.set(Math.cos(ang) * 1.38, 1.2 + explode * 0.4, Math.sin(ang) * 1.38);
            chMesh.rotation.z = 0.25;
            chMesh.castShadow = true;
            this.animatedSubparts.push({ obj: chMesh, baseY: chMesh.position.y, phase: i * 1.1, amp: 0.06 });
            this.modelGroup.add(chMesh);
          }
        }

        // Orbiting ribosomes / ATP particles
        const riboGeo = new THREE.SphereGeometry(0.065, 10, 10);
        for (let i = 0; i < riboGroups * 3; i++) {
          const ribo = new THREE.Mesh(riboGeo, i % 2 === 0 ? accentMat : warmBrassMat);
          this.modelGroup.add(ribo);
          this.orbitSubparts.push({
            obj: ribo,
            radiusX: 0.9 + (i % 3) * 0.28,
            radiusZ: 0.85 + (i % 2) * 0.3,
            centerY: 0.95 + (i % 3) * 0.25,
            speed: 0.7 + (i % 4) * 0.22,
            phase: (i / (riboGroups * 3)) * Math.PI * 2,
            tiltX: 0.18 * (i % 2 === 0 ? 1 : -1),
            tiltZ: 0.1,
          });
        }
        break;
      }

      case 'svt_dna_3d': {
        // Composite DNA double helix: twin sugar-phosphate TubeGeometry backbones + complementary A-T / G-C base-pair rungs
        const pairs = Math.max(6, Math.min(16, Math.round(a)));
        const pctA = Math.max(15, Math.min(35, Math.round(b)));
        const isRep = Math.round(c) >= 2;
        const totalH = 3.8;
        const radius = 0.72;
        const turns = pairs * 0.14;

        const strand1Pts: THREE.Vector3[] = [];
        const strand2Pts: THREE.Vector3[] = [];
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const y = 0.25 + t * totalH;
          const angle = t * Math.PI * 2 * turns;
          const forkSpread = isRep && t > 0.62 ? (t - 0.62) * 2.1 : 0;
          const rNow = radius + forkSpread + explode * 0.25;
          strand1Pts.push(new THREE.Vector3(Math.cos(angle) * rNow, y, Math.sin(angle) * rNow));
          strand2Pts.push(new THREE.Vector3(Math.cos(angle + Math.PI) * rNow, y, Math.sin(angle + Math.PI) * rNow));
        }

        const backbone1 = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strand1Pts), 72, 0.075, 12, false),
          accentMat
        );
        backbone1.castShadow = true;
        this.modelGroup.add(backbone1);

        const backbone2 = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(strand2Pts), 72, 0.075, 12, false),
          brushedMetalMat
        );
        backbone2.castShadow = true;
        this.modelGroup.add(backbone2);

        const matA = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35, metalness: 0.1 });
        const matT = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35, metalness: 0.1 });
        const matG = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.35, metalness: 0.1 });
        const matC = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.35, metalness: 0.1 });

        const atCutoff = Math.round((pctA / 50) * pairs);
        for (let i = 0; i < pairs; i++) {
          const t = (i + 0.5) / pairs;
          const y = 0.25 + t * totalH;
          const angle = t * Math.PI * 2 * turns;
          const forkSpread = isRep && t > 0.62 ? (t - 0.62) * 2.1 : 0;
          const rNow = radius + forkSpread + explode * 0.25;
          const isAT = ((i * 7 + 3) % pairs) < atCutoff;
          const p1 = new THREE.Vector3(Math.cos(angle) * rNow, y, Math.sin(angle) * rNow);
          const p2 = new THREE.Vector3(Math.cos(angle + Math.PI) * rNow, y, Math.sin(angle + Math.PI) * rNow);
          const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

          // Split rung if in replication fork
          const gapRatio = isRep && t > 0.62 ? 0.42 : 0.96;
          const end1 = new THREE.Vector3().lerpVectors(p1, mid, gapRatio);
          const end2 = new THREE.Vector3().lerpVectors(p2, mid, gapRatio);

          const rung1 = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.LineCurve3(p1, end1), 4, 0.048, 8, false),
            isAT ? matA : matG
          );
          const rung2 = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.LineCurve3(p2, end2), 4, 0.048, 8, false),
            isAT ? matT : matC
          );
          this.modelGroup.add(rung1, rung2);

          // Phosphate bead nodes
          const bead = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), warmBrassMat);
          bead.position.copy(p1);
          this.modelGroup.add(bead);
        }

        // Grounded pedestal base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.18, 0.16, 32), darkSlateMat);
        base.position.y = 0.08;
        base.receiveShadow = true;
        this.modelGroup.add(base);
        break;
      }

      case 'svt_tectonics_3d': {
        // 3D geological cross-section: mantle asthenosphere + tectonic plates (1: Ridge Divergence, 2: Subduction + Volcano, 3: Sedimentary Strata)
        const speed = Math.max(1, a);
        const mode = Math.max(1, Math.min(3, Math.round(c)));

        const magmaMat = new THREE.MeshStandardMaterial({
          color: 0xea580c,
          emissive: 0xdc2626,
          emissiveIntensity: 0.45,
          roughness: 0.5,
          metalness: 0.1,
        });
        const oceanPlateMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          roughness: 0.72,
          metalness: 0.15,
        });
        const contPlateMat = new THREE.MeshStandardMaterial({
          color: 0x854d0e,
          roughness: 0.85,
          metalness: 0.05,
        });
        const waterMat = new THREE.MeshPhysicalMaterial({
          color: 0x0284c7,
          roughness: 0.12,
          metalness: 0.05,
          transparent: true,
          opacity: 0.42,
          depthWrite: false,
        });

        // Asthenosphere / mantle block grounded on Y=0
        const mantle = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.85, 2.6), magmaMat);
        mantle.position.set(0, 0.425, 0);
        mantle.receiveShadow = true;
        this.modelGroup.add(mantle);

        if (mode === 1) {
          // Divergence at mid-ocean ridge
          const gap = 0.25 + (speed / 10) * 0.55 + explode * 0.35;
          const leftPlate = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 2.5), oceanPlateMat);
          leftPlate.position.set(-1.05 - gap * 0.5, 1.06, 0);
          leftPlate.castShadow = true;
          const rightPlate = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, 2.5), oceanPlateMat);
          rightPlate.position.set(1.05 + gap * 0.5, 1.06, 0);
          rightPlate.castShadow = true;
          this.modelGroup.add(leftPlate, rightPlate);

          // Rising magma ridge pillow
          const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.18, gap * 0.7 + 0.25, 0.65, 16), magmaMat);
          ridge.position.set(0, 1.05, 0);
          this.animatedSubparts.push({ obj: ridge, baseY: ridge.position.y, phase: 0, amp: 0.05 });
          this.modelGroup.add(ridge);

          // Translucent ocean layer
          const sea = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.36, 2.55), waterMat);
          sea.position.set(0, 1.48, 0);
          sea.renderOrder = 2;
          this.modelGroup.add(sea);
        } else if (mode === 2) {
          // Subduction slab plunging under continental plate + stratified volcanic cone
          const slab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.32, 2.45), oceanPlateMat);
          slab.position.set(-1.05, 0.92, 0);
          slab.rotation.z = -0.34;
          slab.castShadow = true;
          this.modelGroup.add(slab);

          const cont = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.58, 2.5), contPlateMat);
          cont.position.set(1.15, 1.14 + explode * 0.2, 0);
          cont.castShadow = true;
          this.modelGroup.add(cont);

          // Volcanic cone + magma conduit + glowing crater
          const volcano = new THREE.Mesh(
            new THREE.ConeGeometry(0.78, 1.15, 24, 1, false),
            new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.88, metalness: 0.05 })
          );
          volcano.position.set(1.2, 1.98 + explode * 0.25, 0);
          volcano.castShadow = true;
          this.modelGroup.add(volcano);

          const plume = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), magmaMat);
          plume.position.set(1.2, 2.62 + explode * 0.3, 0);
          this.animatedSubparts.push({ obj: plume, baseY: plume.position.y, phase: 0.5, amp: 0.09 });
          this.modelGroup.add(plume);

          // Seismic focus rings along subduction plane
          for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18 + i * 0.1, 0.025, 8, 24), warmBrassMat);
            ring.position.set(-0.2 + i * 0.35, 0.85 - i * 0.14, 1.28);
            this.modelGroup.add(ring);
          }
        } else {
          // Sedimentary strata + river erosion channel
          const strataColors = [0xd6d3d1, 0xd97706, 0x92400e, 0x65a30d];
          for (let s = 0; s < 4; s++) {
            const layer = new THREE.Mesh(
              new THREE.BoxGeometry(4.4 - s * 0.18, 0.26, 2.4),
              new THREE.MeshStandardMaterial({ color: strataColors[s], roughness: 0.82, metalness: 0.04 })
            );
            layer.position.set(0, 0.98 + s * (0.28 + explode * 0.15), 0);
            layer.castShadow = true;
            layer.receiveShadow = true;
            this.modelGroup.add(layer);
          }
          const river = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 2.46), waterMat);
          river.position.set(0, 2.02 + explode * 0.45, 0);
          this.modelGroup.add(river);
        }
        break;
      }

      case 'svt_ecosystem_3d': {
        // Composite 3D trophic biomass pyramid (Lindeman 10% tiers) + composite low-poly trees & solar flux
        const levels = Math.max(2, Math.min(4, Math.round(a)));
        const isPhoto = Math.round(c) >= 2;
        const tierColors = [0x15803d, 0x16a34a, 0xd97706, 0xdc2626];

        // Grounded soil plinth (decomposers)
        const soil = new THREE.Mesh(
          new THREE.BoxGeometry(3.8, 0.22, 3.8),
          new THREE.MeshStandardMaterial({ color: 0x573b24, roughness: 0.9, metalness: 0.02 })
        );
        soil.position.y = 0.11;
        soil.receiveShadow = true;
        this.modelGroup.add(soil);

        for (let lv = 0; lv < levels; lv++) {
          const w = 3.2 - lv * 0.72;
          const h = 0.48;
          const tier = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, w),
            new THREE.MeshStandardMaterial({ color: tierColors[lv], roughness: 0.48, metalness: 0.08 })
          );
          tier.position.y = 0.46 + lv * (h + 0.08 + explode * 0.28);
          tier.castShadow = true;
          tier.receiveShadow = true;
          this.modelGroup.add(tier);
        }

        // Composite trees (trunk + layered foliage crown) on producer base
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85, metalness: 0.02 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.55, metalness: 0.05 });
        const treeCoords = [
          [-1.35, -1.35],
          [1.35, -1.35],
          [-1.35, 1.35],
          [1.35, 1.35],
        ];
        for (let i = 0; i < treeCoords.length; i++) {
          const [tx, tz] = treeCoords[i];
          const tg = new THREE.Group();
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.42, 8), trunkMat);
          trunk.position.y = 0.21;
          const crown1 = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.48, 8), leafMat);
          crown1.position.y = 0.54;
          const crown2 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.38, 8), leafMat);
          crown2.position.y = 0.78;
          tg.add(trunk, crown1, crown2);
          tg.position.set(tx, 0.7, tz);
          this.modelGroup.add(tg);
        }

        // Solar energy orb + orbiting O2/CO2 exchange particles
        const sun = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 20, 20),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 0.75 })
        );
        sun.position.set(0, 3.05 + explode * 0.4, 0);
        this.animatedSubparts.push({ obj: sun, baseY: sun.position.y, phase: 0, amp: 0.08 });
        this.modelGroup.add(sun);

        const particleCount = isPhoto ? 10 : 6;
        const pGeo = new THREE.SphereGeometry(0.075, 10, 10);
        const o2Mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.4 });
        for (let i = 0; i < particleCount; i++) {
          const orb = new THREE.Mesh(pGeo, i % 2 === 0 ? o2Mat : warmBrassMat);
          this.modelGroup.add(orb);
          this.orbitSubparts.push({
            obj: orb,
            radiusX: 1.65,
            radiusZ: 1.65,
            centerY: 1.45 + (i % 3) * 0.45,
            speed: isPhoto ? 1.25 : 0.85,
            phase: (i / particleCount) * Math.PI * 2,
            tiltX: 0.25,
            tiltZ: -0.15,
          });
        }
        break;
      }

      case 'svt_organ_3d': {
        // Dual biological system: (c=1) Double heart-lung circulation loop; (c=2) Y-shaped antibodies docking onto pathogen antigens
        const isImm = Math.round(c) >= 2;
        if (isImm) {
          // Pathogen sphere + spiked antigens + Y-shaped antibodies docking around it
          const count = Math.max(4, Math.min(10, Math.round(a)));
          const eff = Math.min(100, Math.max(40, Math.round(b))) / 100;
          const pathogenMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.45, metalness: 0.1 });
          const spikeMat = new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.35, metalness: 0.2 });
          const abMat = new THREE.MeshPhysicalMaterial({ color: 0x2563eb, roughness: 0.25, metalness: 0.2, clearcoat: 0.7 });

          const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.88, 2), pathogenMat);
          body.position.set(0, 1.45, 0);
          body.castShadow = true;
          this.modelGroup.add(body);

          for (let i = 0; i < count; i++) {
            const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            const dir = new THREE.Vector3(
              Math.sin(phi) * Math.cos(theta),
              Math.cos(phi),
              Math.sin(phi) * Math.sin(theta)
            );
            const spike = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.34, 10), spikeMat);
            spike.position.copy(dir).multiplyScalar(1.02).add(new THREE.Vector3(0, 1.45, 0));
            spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            this.modelGroup.add(spike);

            // Docked Y-shaped antibody
            const abGroup = new THREE.Group();
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.35, 8), abMat);
            stem.position.y = 0.25;
            const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8), abMat);
            armL.position.set(-0.1, 0.04, 0);
            armL.rotation.z = 0.55;
            const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8), abMat);
            armR.position.set(0.1, 0.04, 0);
            armR.rotation.z = -0.55;
            abGroup.add(stem, armL, armR);
            const dockDist = 1.28 + (1 - eff) * 0.75 + explode * 0.5;
            abGroup.position.copy(dir).multiplyScalar(dockDist).add(new THREE.Vector3(0, 1.45, 0));
            abGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            this.animatedSubparts.push({ obj: abGroup, baseY: abGroup.position.y, phase: i * 0.6, amp: 0.04 });
            this.modelGroup.add(abGroup);
          }
        } else {
          // Double cardio-pulmonary circulation loop: heart (left O2 red + right CO2 blue) + pulmonary & systemic vessels
          const fc = Math.max(40, Math.min(180, a));
          const oxyMat = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.28, metalness: 0.1, clearcoat: 0.5 });
          const deoxyMat = new THREE.MeshPhysicalMaterial({ color: 0x2563eb, roughness: 0.28, metalness: 0.1, clearcoat: 0.5 });

          const heartGroup = new THREE.Group();
          heartGroup.position.set(0, 1.35, 0);
          const leftChamber = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.45, 10, 16), oxyMat);
          leftChamber.position.set(0.24 + explode * 0.18, 0, 0);
          const rightChamber = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.45, 10, 16), deoxyMat);
          rightChamber.position.set(-0.24 - explode * 0.18, 0, 0);
          heartGroup.add(leftChamber, rightChamber);
          this.animatedSubparts.push({
            obj: heartGroup,
            baseY: heartGroup.position.y,
            phase: 0,
            speed: Math.max(1.5, fc / 30),
            amp: 0.07,
          });
          this.modelGroup.add(heartGroup);

          // Systemic (right) and Pulmonary (left) closed loops
          const oxyLoop = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 12, 48), oxyMat);
          oxyLoop.position.set(1.1, 1.35, 0);
          const deoxyLoop = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 12, 48), deoxyMat);
          deoxyLoop.position.set(-1.0, 1.55, 0);
          this.modelGroup.add(oxyLoop, deoxyLoop);

          // Red blood cells orbiting along circulation
          const rbcGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.04, 14);
          for (let i = 0; i < 6; i++) {
            const cell = new THREE.Mesh(rbcGeo, i < 3 ? oxyMat : deoxyMat);
            this.modelGroup.add(cell);
            this.orbitSubparts.push({
              obj: cell,
              radiusX: i < 3 ? 1.85 : 1.55,
              radiusZ: 0.65,
              centerY: 1.35,
              speed: (fc / 55) * (i < 3 ? 1 : -1),
              phase: (i / 3) * Math.PI * 2,
              tiltX: 0.15,
              tiltZ: 0.1,
            });
          }
        }
        break;
      }

      case 'svt_neuron_3d': {
        // Composite multipolar neuron: soma + dendrites + myelinated axon + synaptic terminal + neurotransmitter vesicles
        const speed = Math.max(20, a);
        const freqLevel = Math.max(1, Math.min(4, Math.round(c)));

        const somaMat = new THREE.MeshPhysicalMaterial({ color: 0x6366f1, roughness: 0.3, metalness: 0.15, clearcoat: 0.6 });
        const myelinMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.38, metalness: 0.08 });
        const pulseMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 0.85 });

        // Soma cell body
        const soma = new THREE.Mesh(new THREE.IcosahedronGeometry(0.56, 2), somaMat);
        soma.position.set(-1.95, 1.4, 0);
        soma.castShadow = true;
        this.modelGroup.add(soma);

        // Branching dendrites radiating from soma
        for (let d = 0; d < 5; d++) {
          const ang = (d / 5) * Math.PI * 2;
          const dCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-1.95, 1.4, 0),
            new THREE.Vector3(-2.45, 1.4 + Math.sin(ang) * 0.55, Math.cos(ang) * 0.55),
            new THREE.Vector3(-2.85, 1.4 + Math.sin(ang) * 0.9, Math.cos(ang) * 0.9),
          ]);
          const dend = new THREE.Mesh(new THREE.TubeGeometry(dCurve, 14, 0.045, 8, false), somaMat);
          this.modelGroup.add(dend);
        }

        // Core axon tube
        const axonCurve = new THREE.LineCurve3(new THREE.Vector3(-1.45, 1.4, 0), new THREE.Vector3(1.65, 1.4, 0));
        const axon = new THREE.Mesh(new THREE.TubeGeometry(axonCurve, 24, 0.065, 12, false), accentMat);
        this.modelGroup.add(axon);

        // Myelinated Schwann cell sheaths separated by Nodes of Ranvier
        for (let m = 0; m < 4; m++) {
          const sheath = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.42, 8, 16), myelinMat);
          sheath.rotation.z = Math.PI / 2;
          sheath.position.set(-1.05 + m * 0.78, 1.4 + explode * (m % 2 === 0 ? 0.25 : -0.2), 0);
          sheath.castShadow = true;
          this.modelGroup.add(sheath);
        }

        // Synaptic terminal bulb + post-synaptic membrane + neurotransmitter vesicles
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 18), somaMat);
        bulb.position.set(1.75, 1.4, 0);
        const postSyn = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.15, 1.15), brushedMetalMat);
        postSyn.position.set(2.35 + explode * 0.35, 1.4, 0);
        this.modelGroup.add(bulb, postSyn);

        // Neurotransmitter vesicles pulsing across the cleft + action potential impulses
        for (let v = 0; v < freqLevel + 2; v++) {
          const ves = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), pulseMat);
          ves.position.set(2.05, 1.15 + v * 0.14, (v % 2 === 0 ? 1 : -1) * 0.16);
          this.animatedSubparts.push({
            obj: ves,
            baseY: ves.position.y,
            phase: v * 0.8,
            speed: 2.0 + speed / 40,
            amp: 0.08,
          });
          this.modelGroup.add(ves);
        }
        break;
      }

      case 'svt_climate_3d': {
        // Composite Earth climate model: tilted Earth sphere (23.4°) + polar ice caps + CO2 greenhouse atmosphere shell + solar/IR beams
        const co2 = Math.max(200, Math.min(600, a));
        const albedo = Math.max(10, Math.min(60, b));
        const tiltRad = (Math.max(0, Math.min(30, c)) * Math.PI) / 180;

        const earthGroup = new THREE.Group();
        earthGroup.position.set(0, 1.55, 0);
        earthGroup.rotation.z = -tiltRad;

        const oceanGlobe = new THREE.Mesh(
          new THREE.SphereGeometry(1.12, 36, 36),
          new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.12, clearcoat: 0.65 })
        );
        oceanGlobe.castShadow = true;
        earthGroup.add(oceanGlobe);

        // Continental relief patches
        const landMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.78, metalness: 0.04 });
        const landPositions = [
          [0.85, 0.32, 0.55],
          [-0.78, 0.45, 0.52],
          [0.2, -0.3, -1.0],
          [-0.6, -0.4, -0.75],
        ];
        for (const [lx, ly, lz] of landPositions) {
          const patch = new THREE.Mesh(new THREE.IcosahedronGeometry(0.36, 1), landMat);
          patch.position.set(lx, ly, lz);
          patch.scale.set(1.2, 0.75, 1.1);
          earthGroup.add(patch);
        }

        // Polar ice caps scaling with albedo
        const iceScale = 0.55 + (albedo / 60) * 0.65;
        const iceMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.05 });
        const northCap = new THREE.Mesh(new THREE.CylinderGeometry(0.32 * iceScale, 0.58 * iceScale, 0.16, 20), iceMat);
        northCap.position.y = 1.07;
        const southCap = new THREE.Mesh(new THREE.CylinderGeometry(0.58 * iceScale, 0.32 * iceScale, 0.16, 20), iceMat);
        southCap.position.y = -1.07;
        earthGroup.add(northCap, southCap);

        // Rotation axis rod
        const axisRod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.1, 10), warmBrassMat);
        earthGroup.add(axisRod);

        // Greenhouse atmosphere shell (opacity & hue shift with CO2 ppm)
        const ghIntensity = (co2 - 200) / 400;
        const atmoColor = new THREE.Color().setHSL(0.55 - ghIntensity * 0.45, 0.85, 0.58);
        const atmo = new THREE.Mesh(
          new THREE.SphereGeometry(1.34 + explode * 0.28, 32, 32),
          new THREE.MeshPhysicalMaterial({
            color: atmoColor,
            roughness: 0.15,
            metalness: 0.05,
            transparent: true,
            opacity: 0.14 + ghIntensity * 0.24,
            depthWrite: false,
          })
        );
        atmo.renderOrder = 3;
        earthGroup.add(atmo);
        this.modelGroup.add(earthGroup);

        // Incoming solar rays (yellow) + reflected albedo rays
        const solarMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 0.7 });
        for (let r = -1; r <= 1; r++) {
          const ray = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8), solarMat);
          ray.rotation.z = Math.PI / 2;
          ray.position.set(-2.35, 1.55 + r * 0.52, 0);
          this.modelGroup.add(ray);
        }
        break;
      }

      case 'hg_monument_3d': {
        const units = Math.max(3, Math.min(8, Math.round(a)));
        const heightScale = 0.75 + ((Math.max(10, Math.min(40, b)) - 10) / 30) * 0.65;
        const mode = Math.max(1, Math.min(3, Math.round(c)));

        const sandstoneMat = new THREE.MeshStandardMaterial({ color: 0xd6b588, roughness: 0.82, metalness: 0.04 });
        const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.36, metalness: 0.08 });
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.78, metalness: 0.08 });
        const roofSlateMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55, metalness: 0.25 });

        if (mode === 1) {
          // Stepped Pyramid / Ziggurat with monumental central staircase and gilded capstone
          let curY = 0;
          const stepH = (0.34 * heightScale) / Math.max(1, units / 5);
          for (let t = 0; t < units; t++) {
            const frac = 1 - t / (units + 0.6);
            const w = 3.4 * frac;
            const tierMesh = new THREE.Mesh(new THREE.BoxGeometry(w, stepH, w), sandstoneMat);
            tierMesh.position.y = curY + stepH / 2 + t * explode * 0.14;
            tierMesh.castShadow = true;
            tierMesh.receiveShadow = true;
            this.modelGroup.add(tierMesh);
            curY += stepH;
          }
          // Gilded pyramidion capstone
          const cap = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.52 * heightScale, 4), warmBrassMat);
          cap.rotation.y = Math.PI / 4;
          cap.position.y = curY + 0.26 * heightScale + units * explode * 0.14;
          cap.castShadow = true;
          this.modelGroup.add(cap);

          // Central ceremonial ramp staircase
          const ramp = new THREE.Mesh(new THREE.BoxGeometry(0.46, curY * 0.88, 1.9), accentMat);
          ramp.position.set(0, curY * 0.42, 1.05);
          ramp.rotation.x = -0.68;
          ramp.castShadow = true;
          this.modelGroup.add(ramp);
        } else if (mode === 2) {
          // Classical Greek Temple (Parthenon / Agora) with stylobate, fluted colonnade, entablature & pediment
          for (let s = 0; s < 3; s++) {
            const step = new THREE.Mesh(new THREE.BoxGeometry(3.8 - s * 0.22, 0.14, 2.7 - s * 0.18), marbleMat);
            step.position.y = 0.07 + s * 0.14;
            step.receiveShadow = true;
            this.modelGroup.add(step);
          }
          const colH = 1.45 * heightScale;
          const baseY = 0.42;
          const frontXStart = -1.55;
          const frontSpan = 3.1;
          for (let i = 0; i < units; i++) {
            const x = units > 1 ? frontXStart + (i / (units - 1)) * frontSpan : 0;
            for (const zSign of [-1, 1]) {
              const col = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.105, colH, 14), marbleMat);
              col.position.set(x, baseY + colH / 2, zSign * 1.02);
              col.castShadow = true;
              this.modelGroup.add(col);
              const capital = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.24), warmBrassMat);
              capital.position.set(x, baseY + colH + 0.04, zSign * 1.02);
              this.modelGroup.add(capital);
            }
          }
          // Inner cella sanctuary
          const cella = new THREE.Mesh(new THREE.BoxGeometry(2.1, colH * 0.9, 1.2), sandstoneMat);
          cella.position.set(0, baseY + (colH * 0.9) / 2, 0);
          cella.castShadow = true;
          this.modelGroup.add(cella);

          // Entablature & triangular roof pediment
          const roofY = baseY + colH + 0.18 + explode * 0.45;
          const entab = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.24, 2.35), marbleMat);
          entab.position.y = roofY;
          entab.castShadow = true;
          this.modelGroup.add(entab);

          const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 3.6, 3), accentMat);
          roof.rotation.z = Math.PI / 2;
          roof.scale.set(0.55, 1, 1);
          roof.position.y = roofY + 0.48;
          roof.castShadow = true;
          this.modelGroup.add(roof);
        } else {
          // Medieval fortified castle with central keep (donjon), curtain walls & flanking towers
          const wallH = 1.0 * heightScale;
          const wallR = 1.65;
          // Curtain walls
          const wallGeoNS = new THREE.BoxGeometry(3.2, wallH, 0.22);
          const wallGeoEW = new THREE.BoxGeometry(0.22, wallH, 3.2);
          const wN = new THREE.Mesh(wallGeoNS, stoneMat);
          wN.position.set(0, wallH / 2, -wallR);
          const wS = new THREE.Mesh(wallGeoNS, stoneMat);
          wS.position.set(0, wallH / 2, wallR);
          const wE = new THREE.Mesh(wallGeoEW, stoneMat);
          wE.position.set(wallR, wallH / 2, 0);
          const wW = new THREE.Mesh(wallGeoEW, stoneMat);
          wW.position.set(-wallR, wallH / 2, 0);
          [wN, wS, wE, wW].forEach((m) => {
            m.castShadow = true;
            m.receiveShadow = true;
            this.modelGroup.add(m);
          });

          // Flanking cylindrical towers around perimeter
          for (let i = 0; i < units; i++) {
            const ang = (i / units) * Math.PI * 2 + Math.PI / 4;
            const tx = Math.cos(ang) * (wallR + 0.22 + explode * 0.35);
            const tz = Math.sin(ang) * (wallR + 0.22 + explode * 0.35);
            const tH = wallH * 1.45;
            const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.31, tH, 16), stoneMat);
            tower.position.set(tx, tH / 2, tz);
            tower.castShadow = true;
            const spire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.65, 16), roofSlateMat);
            spire.position.set(tx, tH + 0.32, tz);
            spire.castShadow = true;
            this.modelGroup.add(tower, spire);
          }

          // Central Donjon Keep + banner
          const keepH = 1.9 * heightScale;
          const keep = new THREE.Mesh(new THREE.BoxGeometry(1.15, keepH, 1.15), marbleMat);
          keep.position.set(0, keepH / 2, 0);
          keep.castShadow = true;
          const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(0.88, 0.72, 4), accentMat);
          keepRoof.rotation.y = Math.PI / 4;
          keepRoof.position.set(0, keepH + 0.36 + explode * 0.3, 0);
          this.modelGroup.add(keep, keepRoof);
        }
        break;
      }

      case 'hg_city_urban_3d': {
        // Metropolitan skyline diorama: CBD glass skyscrapers, concentric transit rings, residential peri-urban belt & transit shuttles
        const towers = Math.max(3, Math.min(12, Math.round(a)));
        const urbanPct = Math.max(30, Math.min(95, b));
        const tier = Math.max(1, Math.min(3, Math.round(c)));
        const hMult = 0.65 + (urbanPct / 100) * 0.75 + (tier - 1) * 0.22;

        const cityBase = new THREE.Mesh(new THREE.CylinderGeometry(2.85, 2.95, 0.12, 40), darkSlateMat);
        cityBase.position.y = 0.06;
        cityBase.receiveShadow = true;
        this.modelGroup.add(cityBase);

        const parkMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.85, metalness: 0.04 });
        const glassTowerMat = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          roughness: 0.16,
          metalness: 0.65,
          clearcoat: 0.85,
        });
        const concreteMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.65, metalness: 0.12 });

        // Concentric peripheral ring roads (périphérique & rocade)
        for (let r = 0; r < tier; r++) {
          const ringR = 1.25 + r * 0.65;
          const ring = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.035, 10, 48), r === 0 ? warmBrassMat : brushedMetalMat);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = 0.13;
          this.modelGroup.add(ring);

          // Orbiting metro/transit nodes along ring roads
          const shuttle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.1), accentMat);
          this.modelGroup.add(shuttle);
          this.orbitSubparts.push({
            obj: shuttle,
            radiusX: ringR,
            radiusZ: ringR,
            centerY: 0.18,
            speed: (r % 2 === 0 ? 1 : -1) * (0.9 + r * 0.35),
            phase: r * 2.1,
            tiltX: 0,
            tiltZ: 0,
          });
        }

        // CBD skyscraper cluster
        for (let i = 0; i < towers; i++) {
          const ang = (i / towers) * Math.PI * 2;
          const rad = i === 0 ? 0 : 0.42 + (i % 3) * 0.28 + explode * 0.35;
          const h = (i === 0 ? 2.1 : 0.85 + ((i * 37) % 10) * 0.11) * hMult;
          const w = i === 0 ? 0.42 : 0.24 + (i % 2) * 0.08;
          const mat = i % 3 === 0 ? accentMat : i % 3 === 1 ? glassTowerMat : concreteMat;
          const bldg = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
          bldg.position.set(Math.cos(ang) * rad, 0.12 + h / 2, Math.sin(ang) * rad);
          bldg.castShadow = true;
          bldg.receiveShadow = true;
          this.modelGroup.add(bldg);

          if (i < 3) {
            const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.42, 8), warmBrassMat);
            spire.position.set(bldg.position.x, 0.12 + h + 0.21, bldg.position.z);
            this.modelGroup.add(spire);
          }
        }

        // Peri-urban residential & green belt patches
        for (let p = 0; p < 8; p++) {
          const ang = (p / 8) * Math.PI * 2 + 0.2;
          const px = Math.cos(ang) * 2.25;
          const pz = Math.sin(ang) * 2.25;
          if (p % 2 === 0) {
            const sub = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.28 + (urbanPct / 100) * 0.2, 0.28), concreteMat);
            sub.position.set(px, 0.12 + sub.geometry.parameters.height / 2, pz);
            sub.castShadow = true;
            this.modelGroup.add(sub);
          } else {
            const park = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.06, 12), parkMat);
            park.position.set(px, 0.15, pz);
            this.modelGroup.add(park);
          }
        }
        break;
      }

      case 'hg_globe_routes_3d': {
        // Composite geopolitical / maritime globe with brass meridian cradle, curved TubeGeometry shipping routes & orbiting ships
        const routes = Math.max(2, Math.min(10, Math.round(a)));
        const speedKmH = Math.max(10, Math.min(50, b));
        const isModern = Math.round(c) >= 2;
        const globeY = 1.62;
        const R = 1.15;

        // Brass meridian stand grounded on plinth
        const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.82, 0.14, 24), warmBrassMat);
        standBase.position.y = 0.07;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.4, 14), warmBrassMat);
        stem.position.y = 0.3;
        const cradle = new THREE.Mesh(new THREE.TorusGeometry(R + 0.16, 0.04, 12, 48, Math.PI * 1.25), warmBrassMat);
        cradle.position.y = globeY;
        cradle.rotation.z = -Math.PI * 0.62;
        this.modelGroup.add(standBase, stem, cradle);

        // Ocean sphere + stylized continental masses
        const ocean = new THREE.Mesh(
          new THREE.SphereGeometry(R, 36, 36),
          new THREE.MeshPhysicalMaterial({ color: 0x0369a1, roughness: 0.28, metalness: 0.14, clearcoat: 0.65 })
        );
        ocean.position.y = globeY;
        ocean.castShadow = true;
        this.modelGroup.add(ocean);

        const continentMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8, metalness: 0.05 });
        const landCoords = [
          [0.72, 0.42, 0.62],
          [-0.78, 0.36, 0.56],
          [0.12, -0.35, 0.96],
          [0.85, -0.25, -0.58],
          [-0.55, -0.45, -0.74],
        ];
        for (const [lx, ly, lz] of landCoords) {
          const cont = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 1), continentMat);
          cont.position.set(lx, globeY + ly, lz);
          cont.scale.set(1.2, 0.72, 1.05);
          this.modelGroup.add(cont);
        }

        // Maritime trade route arcs (TubeGeometry) + orbiting vessels
        const routeMat = new THREE.MeshStandardMaterial({
          color: isModern ? 0xf59e0b : 0x38bdf8,
          emissive: isModern ? 0xd97706 : 0x0284c7,
          emissiveIntensity: 0.45,
          roughness: 0.3,
        });
        for (let r = 0; r < routes; r++) {
          const a1 = (r / routes) * Math.PI * 2;
          const a2 = a1 + Math.PI * 0.78;
          const lat1 = ((r % 3) - 1) * 0.45;
          const lat2 = -lat1 * 0.6;
          const p1 = new THREE.Vector3(
            Math.cos(a1) * Math.cos(lat1) * R,
            globeY + Math.sin(lat1) * R,
            Math.sin(a1) * Math.cos(lat1) * R
          );
          const p2 = new THREE.Vector3(
            Math.cos(a2) * Math.cos(lat2) * R,
            globeY + Math.sin(lat2) * R,
            Math.sin(a2) * Math.cos(lat2) * R
          );
          const mid = p1.clone().add(p2).multiplyScalar(0.5);
          const radial = mid.clone().sub(new THREE.Vector3(0, globeY, 0)).normalize();
          mid.copy(new THREE.Vector3(0, globeY, 0)).add(radial.multiplyScalar(R + 0.38 + explode * 0.25));
          const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
          const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.024, 8, false), routeMat);
          this.modelGroup.add(tube);

          if (r < 4) {
            const ship = new THREE.Mesh(
              new THREE.BoxGeometry(0.16, 0.08, 0.08),
              r % 2 === 0 ? accentMat : warmBrassMat
            );
            this.modelGroup.add(ship);
            this.orbitSubparts.push({
              obj: ship,
              radiusX: R + 0.24 + (r % 2) * 0.12,
              radiusZ: R + 0.24 + (r % 2) * 0.12,
              centerY: globeY,
              speed: (speedKmH / 28) * (r % 2 === 0 ? 1 : -0.85),
              phase: a1,
              tiltX: 0.35 * (r % 2 === 0 ? 1 : -1),
              tiltZ: 0.25,
            });
          }
        }

        // Translucent Exclusive Economic Zone (ZEE) halo in modern mode
        if (isModern) {
          const zeeShell = new THREE.Mesh(
            new THREE.SphereGeometry(R + 0.34 + explode * 0.22, 28, 28),
            new THREE.MeshPhysicalMaterial({
              color: 0x38bdf8,
              roughness: 0.12,
              metalness: 0.05,
              transparent: true,
              opacity: 0.16,
              depthWrite: false,
            })
          );
          zeeShell.position.y = globeY;
          zeeShell.renderOrder = 3;
          this.modelGroup.add(zeeShell);
        }
        break;
      }

      case 'hg_demography_3d': {
        // 3D Mirrored Demographic Age Pyramid (Hommes vs Femmes across 8 age cohorts)
        const natal = Math.max(8, Math.min(45, a));
        const mortal = Math.max(4, Math.min(30, b));
        const phase = Math.max(1, Math.min(4, Math.round(c)));

        const basePlate = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 1.35), darkSlateMat);
        basePlate.position.y = 0.07;
        basePlate.receiveShadow = true;
        this.modelGroup.add(basePlate);

        // Central spine column (Age 0 → 80+)
        const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.75, 14), warmBrassMat);
        spine.position.y = 1.48;
        this.modelGroup.add(spine);

        const maleMat = new THREE.MeshPhysicalMaterial({ color: 0x2563eb, roughness: 0.26, metalness: 0.22, clearcoat: 0.6 });
        const femaleMat = new THREE.MeshPhysicalMaterial({ color: 0xe11d48, roughness: 0.26, metalness: 0.22, clearcoat: 0.6 });

        const cohorts = 8;
        const barH = 0.24;
        for (let i = 0; i < cohorts; i++) {
          const ageRatio = i / (cohorts - 1); // 0 = young, 1 = elderly
          let widthFactor: number;
          if (phase <= 2) {
            // Triangular expansive pyramid
            widthFactor = (natal / 40) * Math.pow(1 - ageRatio * (0.65 + mortal / 80), 1.15);
          } else if (phase === 3) {
            // Bell / stationary pyramid
            widthFactor = 0.55 + (natal / 65) * Math.sin(ageRatio * Math.PI * 0.85 + 0.35) - ageRatio * 0.3;
          } else {
            // Urn / aging pyramid (narrow base, bulge at middle/older ages)
            widthFactor = 0.36 + 0.58 * Math.exp(-Math.pow((ageRatio - 0.52) / 0.36, 2)) - (mortal / 120) * ageRatio;
          }
          const barW = Math.max(0.24, Math.min(1.85, widthFactor * 1.65));
          const yPos = 0.28 + i * (barH + 0.06 + explode * 0.06);

          const leftBar = new THREE.Mesh(new THREE.BoxGeometry(barW, barH, 0.58), maleMat);
          leftBar.position.set(-0.08 - barW / 2 - explode * 0.15, yPos, 0);
          leftBar.castShadow = true;

          const rightBar = new THREE.Mesh(new THREE.BoxGeometry(barW * (1 + ageRatio * 0.08), barH, 0.58), femaleMat);
          rightBar.position.set(0.08 + (barW * (1 + ageRatio * 0.08)) / 2 + explode * 0.15, yPos, 0);
          rightBar.castShadow = true;

          this.modelGroup.add(leftBar, rightBar);
        }
        break;
      }

      case 'hg_timeline_3d': {
        // Elevated chronological viaduct bridge with 5 historical epoch obelisks and active golden milestone marker
        const yEnd = Math.max(1600, Math.min(2025, a));
        const yStart = Math.max(1600, Math.min(2000, b));
        const era = Math.max(1, Math.min(3, Math.round(c)));

        // Viaduct bridge deck
        const deck = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.16, 1.1), darkSlateMat);
        deck.position.y = 0.42;
        deck.castShadow = true;
        deck.receiveShadow = true;
        this.modelGroup.add(deck);

        // Bridge support piers grounded on y=0
        for (let p = -2; p <= 2; p++) {
          const pier = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.36, 0.95), brushedMetalMat);
          pier.position.set(p * 1.05, 0.18, 0);
          pier.castShadow = true;
          this.modelGroup.add(pier);
        }

        // 5 historical epoch steles along the timeline
        const spanNorm = Math.max(0, Math.min(1, (yEnd - 1600) / 425));
        const startNorm = Math.max(0, Math.min(1, (yStart - 1600) / 425));
        const eraColors = [0xd97706, 0x2563eb, 0x10b981];
        const eraMat = new THREE.MeshPhysicalMaterial({
          color: eraColors[era - 1],
          roughness: 0.24,
          metalness: 0.32,
          clearcoat: 0.7,
        });

        for (let i = 0; i < 5; i++) {
          const t = i / 4;
          const x = -2.0 + t * 4.0;
          const h = 0.65 + (i % 3) * 0.32;
          const stele = new THREE.Mesh(new THREE.BoxGeometry(0.24, h, 0.24), i === era ? eraMat : brushedMetalMat);
          stele.position.set(x, 0.5 + h / 2 + explode * 0.12 * i, -0.25);
          stele.castShadow = true;
          this.modelGroup.add(stele);
        }

        // Chronological span beam connecting yStart → yEnd
        const x1 = -2.0 + Math.min(startNorm, spanNorm) * 4.0;
        const x2 = -2.0 + Math.max(startNorm, spanNorm) * 4.0;
        const beamLen = Math.max(0.25, x2 - x1);
        const spanBeam = new THREE.Mesh(new THREE.BoxGeometry(beamLen, 0.1, 0.32), accentMat);
        spanBeam.position.set((x1 + x2) / 2, 0.55, 0.22);
        this.modelGroup.add(spanBeam);

        // Active milestone obelisk + floating golden crystal
        const markerX = -2.0 + spanNorm * 4.0;
        const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 1.55, 4), warmBrassMat);
        obelisk.rotation.y = Math.PI / 4;
        obelisk.position.set(markerX, 0.5 + 0.78, 0.22);
        obelisk.castShadow = true;
        this.modelGroup.add(obelisk);

        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), eraMat);
        crystal.position.set(markerX, 2.32 + explode * 0.3, 0.22);
        this.animatedSubparts.push({ obj: crystal, baseY: crystal.position.y, phase: 0, speed: 2.2, amp: 0.1 });
        this.modelGroup.add(crystal);
        break;
      }

      case 'hg_industry_3d': {
        // Composite industrial / productive spaces diorama: 19th-c steam factory vs 21st-c technopôle & port ZIP
        const units = Math.max(3, Math.min(10, Math.round(a)));
        const pct = Math.max(20, Math.min(90, b));
        const isModern = Math.round(c) >= 2;

        const pad = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 3.0), darkSlateMat);
        pad.position.y = 0.07;
        pad.receiveShadow = true;
        this.modelGroup.add(pad);

        if (!isModern) {
          // 19th-century steam factory hall, sawtooth roof, brick smokestacks & steam puffs
          const brickMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85, metalness: 0.05 });
          const steamMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9, transparent: true, opacity: 0.72 });

          const hall = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.05, 1.65), brickMat);
          hall.position.set(-0.45, 0.14 + 0.525, 0);
          hall.castShadow = true;
          this.modelGroup.add(hall);

          // Sawtooth roofs
          for (let r = 0; r < 3; r++) {
            const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.66, 3), brushedMetalMat);
            roof.rotation.x = Math.PI / 2;
            roof.position.set(-1.3 + r * 0.85, 1.38 + explode * 0.25, 0);
            roof.castShadow = true;
            this.modelGroup.add(roof);
          }

          // Brick smokestacks scaled by units
          const stacks = Math.min(5, Math.max(2, Math.round(units / 2)));
          for (let s = 0; s < stacks; s++) {
            const sx = 1.25 + (s % 2) * 0.55;
            const sz = -0.75 + Math.floor(s / 2) * 0.65;
            const sh = 1.65 + (pct / 100) * 0.65;
            const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.16, sh, 14), brickMat);
            chimney.position.set(sx, 0.14 + sh / 2, sz);
            chimney.castShadow = true;
            this.modelGroup.add(chimney);

            const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), steamMat);
            puff.position.set(sx, 0.14 + sh + 0.25, sz);
            this.animatedSubparts.push({ obj: puff, baseY: puff.position.y, phase: s * 1.1, speed: 1.8, amp: 0.14 });
            this.modelGroup.add(puff);
          }

          // Brass steam flywheel
          const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.07, 12, 28), warmBrassMat);
          wheel.position.set(-1.82, 0.65, 0);
          wheel.rotation.y = Math.PI / 2;
          this.modelGroup.add(wheel);
        } else {
          // 21st-century Technopôle & ZIP: glass R&D labs, solar roof arrays, port crane & logistics hub
          const labCount = Math.min(6, Math.max(3, Math.round(units * 0.7)));
          const solarMat = new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.15, metalness: 0.72, clearcoat: 0.9 });

          for (let i = 0; i < labCount; i++) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const lx = -1.35 + col * 1.15;
            const lz = -0.65 + row * 1.25;
            const lh = 0.55 + (pct / 100) * 0.55 + (i % 2) * 0.25;
            const lab = new THREE.Mesh(new THREE.BoxGeometry(0.86, lh, 0.76), i % 2 === 0 ? glassMat : brushedMetalMat);
            lab.position.set(lx, 0.14 + lh / 2, lz);
            lab.castShadow = true;
            this.modelGroup.add(lab);

            const canopy = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.05, 0.7), solarMat);
            canopy.position.set(lx, 0.14 + lh + 0.08 + explode * 0.2, lz);
            this.modelGroup.add(canopy);
          }

          // Port gantry crane (ZIP maritime interface)
          const gantryLeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.75, 0.1), accentMat);
          gantryLeg1.position.set(1.65, 0.14 + 0.875, -0.75);
          const gantryLeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.75, 0.1), accentMat);
          gantryLeg2.position.set(1.65, 0.14 + 0.875, 0.75);
          const gantryBoom = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 2.2), warmBrassMat);
          gantryBoom.position.set(1.65, 1.92, 0);
          this.modelGroup.add(gantryLeg1, gantryLeg2, gantryBoom);
        }
        break;
      }

      case 'hg_geopolitics_3d': {
        // Geopolitical power architecture: Bipolar Cold War, European Union constellation, or Multipolar world
        const poles = Math.max(2, Math.min(27, Math.round(a)));
        const mode = Math.max(1, Math.min(3, Math.round(c)));

        const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.7, 0.14, 40), darkSlateMat);
        dais.position.y = 0.07;
        dais.receiveShadow = true;
        this.modelGroup.add(dais);

        if (mode === 1) {
          // Bipolar Cold War: two opposing power monoliths separated by an illuminated dividing curtain
          const westMat = new THREE.MeshPhysicalMaterial({ color: 0x2563eb, roughness: 0.22, metalness: 0.35, clearcoat: 0.8 });
          const eastMat = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.22, metalness: 0.35, clearcoat: 0.8 });

          const westBloc = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.74, 1.55, 20), westMat);
          westBloc.position.set(-1.3 - explode * 0.3, 0.14 + 0.775, 0);
          westBloc.castShadow = true;

          const eastBloc = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.74, 1.55, 20), eastMat);
          eastBloc.position.set(1.3 + explode * 0.3, 0.14 + 0.775, 0);
          eastBloc.castShadow = true;

          // Iron Curtain translucent barrier plane
          const curtain = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 2.1, 2.8),
            new THREE.MeshPhysicalMaterial({
              color: 0xf59e0b,
              transparent: true,
              opacity: 0.34,
              roughness: 0.2,
              depthWrite: false,
            })
          );
          curtain.position.y = 1.2;
          curtain.renderOrder = 3;

          // Diplomatic/strategic arc over the divide
          const arcCurve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(-1.3, 1.75, 0),
            new THREE.Vector3(0, 2.85, 0),
            new THREE.Vector3(1.3, 1.75, 0)
          );
          const arcMesh = new THREE.Mesh(new THREE.TubeGeometry(arcCurve, 24, 0.035, 8, false), warmBrassMat);
          this.modelGroup.add(westBloc, eastBloc, curtain, arcMesh);
        } else if (mode === 2) {
          // European Union: cobalt institutional parliament rotunda + ring of 12 golden stars & member pillars
          const euBlueMat = new THREE.MeshPhysicalMaterial({ color: 0x1d4ed8, roughness: 0.24, metalness: 0.3, clearcoat: 0.75 });
          const rotunda = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.9, 28), euBlueMat);
          rotunda.position.y = 0.14 + 0.45;
          rotunda.castShadow = true;
          const dome = new THREE.Mesh(new THREE.SphereGeometry(0.92, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
          dome.position.y = 1.04 + explode * 0.25;
          this.modelGroup.add(rotunda, dome);

          // Member state columns around the rotunda (capped visually to 18 for crisp clarity)
          const shownMembers = Math.min(18, Math.max(6, Math.round(poles * 0.66)));
          for (let m = 0; m < shownMembers; m++) {
            const ang = (m / shownMembers) * Math.PI * 2;
            const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.85, 10), brushedMetalMat);
            col.position.set(Math.cos(ang) * 1.55, 0.14 + 0.425, Math.sin(ang) * 1.55);
            col.castShadow = true;
            this.modelGroup.add(col);
          }

          // Crown of 12 orbiting golden EU stars
          for (let s = 0; s < 12; s++) {
            const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), warmBrassMat);
            this.modelGroup.add(star);
            this.orbitSubparts.push({
              obj: star,
              radiusX: 1.95 + explode * 0.2,
              radiusZ: 1.95 + explode * 0.2,
              centerY: 1.75,
              speed: 0.55,
              phase: (s / 12) * Math.PI * 2,
              tiltX: 0,
              tiltZ: 0,
            });
          }
        } else {
          // Multipolar world: central global hub connected to N regional power poles by diplomatic corridors
          const hub = new THREE.Mesh(
            new THREE.SphereGeometry(0.68, 28, 28),
            new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.2, clearcoat: 0.7 })
          );
          hub.position.y = 1.35;
          hub.castShadow = true;
          this.modelGroup.add(hub);

          const shownPoles = Math.min(8, Math.max(3, poles));
          for (let p = 0; p < shownPoles; p++) {
            const ang = (p / shownPoles) * Math.PI * 2;
            const rad = 1.85 + explode * 0.3;
            const px = Math.cos(ang) * rad;
            const pz = Math.sin(ang) * rad;
            const pH = 0.65 + (p % 3) * 0.24;

            const pedestal = new THREE.Mesh(
              new THREE.CylinderGeometry(0.24, 0.28, pH, 16),
              p % 2 === 0 ? accentMat : warmBrassMat
            );
            pedestal.position.set(px, 0.14 + pH / 2, pz);
            pedestal.castShadow = true;
            this.modelGroup.add(pedestal);

            const linkCurve = new THREE.QuadraticBezierCurve3(
              new THREE.Vector3(px, 0.14 + pH, pz),
              new THREE.Vector3(px * 0.5, 2.05, pz * 0.5),
              new THREE.Vector3(0, 1.35, 0)
            );
            const link = new THREE.Mesh(new THREE.TubeGeometry(linkCurve, 18, 0.024, 8, false), brushedMetalMat);
            this.modelGroup.add(link);
          }
        }
        break;
      }

      // ==================== FRANÇAIS, LITTÉRATURE & PHILOSOPHIE ====================
      case 'fr_syntax_3d': {
        // 3D Sentence Syntax Tree & Clause Bridge: root verb hub + elevated syntactic blocks connected by arches
        const blocks = Math.max(2, Math.min(8, Math.round(a)));
        const mode = Math.max(1, Math.min(3, Math.round(c)));

        const baseDeck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 1.8), darkSlateMat);
        baseDeck.position.y = 0.07;
        baseDeck.receiveShadow = true;
        this.modelGroup.add(baseDeck);

        // Central Verb Nucleus elevated above the deck
        const verbHub = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 1), warmBrassMat);
        verbHub.position.set(0, 2.05 + explode * 0.35, 0);
        verbHub.castShadow = true;
        this.animatedSubparts.push({ obj: verbHub, baseY: verbHub.position.y, phase: 0, speed: 1.8, amp: 0.07 });
        this.modelGroup.add(verbHub);

        const palette = [0x2563eb, 0x059669, 0xd97706, 0x7c3aed, 0xe11d48, 0x0284c7];
        for (let i = 0; i < blocks; i++) {
          const x = -1.9 + (i / Math.max(1, blocks - 1)) * 3.8;
          const z = mode >= 2 && i % 2 === 1 ? 0.52 + explode * 0.2 : -0.15;
          const h = 0.55 + (i % 3) * 0.28;
          const mat = new THREE.MeshPhysicalMaterial({
            color: palette[i % palette.length],
            roughness: 0.25,
            metalness: 0.25,
            clearcoat: 0.7,
          });
          const node = new THREE.Mesh(new THREE.BoxGeometry(0.42, h, 0.48), mat);
          node.position.set(x, 0.14 + h / 2, z);
          node.castShadow = true;
          this.modelGroup.add(node);

          // Grammatical dependency arc linking each constituent to the verb nucleus
          const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(x, 0.14 + h, z),
            new THREE.Vector3(x * 0.5, 1.95, z * 0.4),
            new THREE.Vector3(0, 2.05, 0)
          );
          const arc = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.025, 8, false), brushedMetalMat);
          this.modelGroup.add(arc);
        }
        break;
      }

      case 'fr_narrative_3d': {
        // Dramatic Narrative Arc (Freytag / Schéma narratif 5 étapes): rising action curve + golden climax spire + story pedestals
        const steps = Math.max(3, Math.min(6, Math.round(a)));
        const tension = Math.max(2, Math.min(6, Math.round(b)));
        const mode = Math.max(1, Math.min(3, Math.round(c)));

        const trackBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 1.5), darkSlateMat);
        trackBase.position.y = 0.07;
        trackBase.receiveShadow = true;
        this.modelGroup.add(trackBase);

        const pts: THREE.Vector3[] = [];
        const heights = [0.45, 0.85, 1.15 + tension * 0.22, 0.95, 0.55, 0.4];
        const stageColor = mode === 1 ? 0x6366f1 : mode === 2 ? 0xd97706 : 0xe11d48;
        const stageMat = new THREE.MeshPhysicalMaterial({ color: stageColor, roughness: 0.24, metalness: 0.3, clearcoat: 0.75 });

        for (let i = 0; i < steps; i++) {
          const x = -2.0 + (i / (steps - 1)) * 4.0;
          const h = heights[i % heights.length];
          pts.push(new THREE.Vector3(x, 0.14 + h + 0.18, 0));

          const pillar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.26, h, 18),
            i === Math.floor(steps / 2) ? warmBrassMat : stageMat
          );
          pillar.position.set(x, 0.14 + h / 2 + explode * (i === Math.floor(steps / 2) ? 0.35 : 0.05), 0);
          pillar.castShadow = true;
          pillar.userData.tag = `step-${i}`;
          this.modelGroup.add(pillar);
        }

        // Smooth narrative tension ribbon curving over the stages
        const curve = new THREE.CatmullRomCurve3(pts);
        const ribbon = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.055, 10, false), accentMat);
        ribbon.castShadow = true;
        this.modelGroup.add(ribbon);

        // Floating protagonist crystal orbiting the climax peak
        const climaxPt = pts[Math.floor(steps / 2)];
        const heroOrb = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), warmBrassMat);
        heroOrb.position.set(climaxPt.x, climaxPt.y + 0.42, 0);
        this.animatedSubparts.push({ obj: heroOrb, baseY: heroOrb.position.y, phase: 0, speed: 2.3, amp: 0.11 });
        this.modelGroup.add(heroOrb);
        break;
      }

      case 'fr_grammar_3d': {
        // 3D Conjugation Carousel: 3 verbal group rings + 6 grammatical person towers rotating around the temporal axis
        const groups = Math.max(1, Math.min(4, Math.round(a)));
        const tenses = Math.max(3, Math.min(8, Math.round(b)));
        const isSubj = Math.round(c) >= 2;

        const dial = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.5, 0.14, 36), darkSlateMat);
        dial.position.y = 0.07;
        dial.receiveShadow = true;
        this.modelGroup.add(dial);

        const coreAxis = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 2.3, 18), warmBrassMat);
        coreAxis.position.y = 1.25;
        coreAxis.castShadow = true;
        this.modelGroup.add(coreAxis);

        // Concentric tense rings
        for (let g = 0; g < groups; g++) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.85 + g * 0.42, 0.04, 12, 40),
            g % 2 === 0 ? accentMat : brushedMetalMat
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.y = 0.45 + g * (0.48 + explode * 0.18);
          this.modelGroup.add(ring);
        }

        // 6 grammatical person prisms (je, tu, il, nous, vous, ils)
        const personMat = new THREE.MeshPhysicalMaterial({
          color: isSubj ? 0x9333ea : 0x0284c7,
          roughness: 0.22,
          metalness: 0.35,
          clearcoat: 0.75,
        });
        for (let p = 0; p < 6; p++) {
          const ang = (p / 6) * Math.PI * 2;
          const h = 0.45 + ((p + tenses) % 4) * 0.25;
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, h, 6), personMat);
          col.position.set(Math.cos(ang) * 1.75, 0.14 + h / 2, Math.sin(ang) * 1.75);
          col.castShadow = true;
          this.modelGroup.add(col);
        }
        break;
      }

      case 'fr_theater_3d': {
        // Classical Italian/Greek Theater Stage Diorama: curved amphitheater tiers, wooden stage apron, velvet proscenium arch & 3-unities pillars
        const acts = Math.max(1, Math.min(5, Math.round(a)));
        const mode = Math.max(1, Math.min(3, Math.round(c)));

        const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.68, metalness: 0.08 });
        const velvetMat = new THREE.MeshStandardMaterial({
          color: mode === 1 ? 0xb91c1c : mode === 2 ? 0x4c1d95 : 0x0f766e,
          roughness: 0.85,
          metalness: 0.05,
        });

        // Raised theater stage floor
        const stage = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.28, 2.1), woodMat);
        stage.position.set(0, 0.14, -0.55);
        stage.receiveShadow = true;
        stage.castShadow = true;
        this.modelGroup.add(stage);

        // Proscenium pillars & crimson curtain pediment
        const pL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.0, 0.32), warmBrassMat);
        pL.position.set(-1.68, 1.28, 0.35);
        const pR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 2.0, 0.32), warmBrassMat);
        pR.position.set(1.68, 1.28, 0.35);
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.75, 0.34, 0.4), velvetMat);
        lintel.position.set(0, 2.38 + explode * 0.3, 0.35);
        const curtainL = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 1.9, 14), velvetMat);
        curtainL.position.set(-1.32, 1.25, 0.28);
        const curtainR = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 1.9, 14), velvetMat);
        curtainR.position.set(1.32, 1.25, 0.28);
        this.modelGroup.add(pL, pR, lintel, curtainL, curtainR);

        // Act markers (footlights) along the front of the stage
        for (let i = 0; i < acts; i++) {
          const fx = -1.1 + (i / Math.max(1, acts - 1)) * 2.2;
          const lamp = new THREE.Mesh(
            new THREE.SphereGeometry(0.09, 12, 12),
            new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.8 })
          );
          lamp.position.set(fx, 0.34, 0.42);
          this.modelGroup.add(lamp);
        }

        // Curved spectator amphitheater benches (double énonciation)
        for (let r = 0; r < 3; r++) {
          const arc = new THREE.Mesh(
            new THREE.TorusGeometry(1.15 + r * 0.42, 0.09, 10, 28, Math.PI * 0.85),
            brushedMetalMat
          );
          arc.rotation.x = Math.PI / 2;
          arc.rotation.z = Math.PI * 0.075;
          arc.position.set(0, 0.12 + r * 0.16, 0.85 + explode * 0.25);
          this.modelGroup.add(arc);
        }
        break;
      }

      case 'fr_poetry_3d': {
        // 3D Prosody & Alexandrine Metrical Bars: stacked stanza lines composed of rhythmic syllable beads + glowing hemistich caesura (6 // 6)
        const syl = Math.max(6, Math.min(12, Math.round(a)));
        const lines = Math.max(2, Math.min(6, Math.round(b)));
        const rimeMode = Math.max(1, Math.min(3, Math.round(c)));

        const frame = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 2.2), darkSlateMat);
        frame.position.y = 0.07;
        frame.receiveShadow = true;
        this.modelGroup.add(frame);

        const rimeA = new THREE.MeshPhysicalMaterial({ color: 0x4f46e5, roughness: 0.2, metalness: 0.3, clearcoat: 0.8 });
        const rimeB = new THREE.MeshPhysicalMaterial({ color: 0xe11d48, roughness: 0.2, metalness: 0.3, clearcoat: 0.8 });
        const patterns = [
          [0, 0, 1, 1, 0, 0], // AABB
          [0, 1, 0, 1, 0, 1], // ABAB
          [0, 1, 1, 0, 0, 1], // ABBA
        ];
        const pat = patterns[rimeMode - 1];

        for (let l = 0; l < lines; l++) {
          const y = 0.42 + l * (0.36 + explode * 0.1);
          const rMat = pat[l % pat.length] === 0 ? rimeA : rimeB;
          for (let s = 0; s < syl; s++) {
            const halfGap = syl === 12 && s >= 6 ? 0.24 : 0;
            const sx = -2.0 + (s / Math.max(1, syl - 1)) * 3.76 + halfGap;
            const isRhymeEnd = s === syl - 1;
            const bead = new THREE.Mesh(
              isRhymeEnd ? new THREE.SphereGeometry(0.14, 14, 14) : new THREE.BoxGeometry(0.2, 0.14, 0.22),
              isRhymeEnd ? rMat : brushedMetalMat
            );
            bead.position.set(sx, y, 0);
            bead.castShadow = true;
            this.modelGroup.add(bead);
          }
        }

        // Golden Caesura divider blade at the center of the Alexandrine (6 // 6)
        if (syl === 12) {
          const caesura = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, lines * 0.42 + 0.5, 10), warmBrassMat);
          caesura.position.set(0.02, 0.25 + (lines * 0.42) / 2, 0);
          this.modelGroup.add(caesura);
        }
        break;
      }

      case 'fr_rhetoric_3d': {
        // Rhetorical / Dialectical Balance & Parthenon of Arguments: central thesis keystone supported by N argument columns
        const axes = Math.max(2, Math.min(6, Math.round(a)));
        const force = Math.max(40, Math.min(100, b));

        const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 2.0), darkSlateMat);
        base.position.y = 0.09;
        base.receiveShadow = true;
        this.modelGroup.add(base);

        const colH = 0.95 + (force / 100) * 0.85;
        for (let i = 0; i < axes; i++) {
          const x = -1.55 + (i / Math.max(1, axes - 1)) * 3.1;
          const col = new THREE.Mesh(
            new THREE.CylinderGeometry(0.16, 0.2, colH, 16),
            i % 2 === 0 ? accentMat : brushedMetalMat
          );
          col.position.set(x, 0.18 + colH / 2, 0);
          col.castShadow = true;
          this.modelGroup.add(col);
        }

        // Thesis entablature beam & golden conclusion keystone
        const beamY = 0.18 + colH + 0.15 + explode * 0.35;
        const thesisBeam = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.26, 0.9), warmBrassMat);
        thesisBeam.position.y = beamY;
        thesisBeam.castShadow = true;
        this.modelGroup.add(thesisBeam);

        const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), accentMat);
        crown.position.y = beamY + 0.52;
        this.animatedSubparts.push({ obj: crown, baseY: crown.position.y, phase: 0, speed: 2.0, amp: 0.09 });
        this.modelGroup.add(crown);
        break;
      }

      case 'fr_philo_3d': {
        // Philosophical Dialectical Armillary Sphere: central Cogito / Truth prism surrounded by rotating Thesis / Antithesis / Synthesis rings
        const concepts = Math.max(2, Math.min(5, Math.round(a)));
        const domain = Math.max(1, Math.min(3, Math.round(c)));

        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 0.2, 28), darkSlateMat);
        plinth.position.y = 0.1;
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.55, 16), warmBrassMat);
        neck.position.y = 0.45;
        this.modelGroup.add(plinth, neck);

        const centerY = 1.65;
        const coreColor = domain === 1 ? 0x6366f1 : domain === 2 ? 0x0ea5e9 : 0xd97706;
        const coreMat = new THREE.MeshPhysicalMaterial({ color: coreColor, roughness: 0.18, metalness: 0.4, clearcoat: 0.9 });
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), coreMat);
        core.position.y = centerY;
        core.castShadow = true;
        this.animatedSubparts.push({ obj: core, baseY: centerY, phase: 0, speed: 1.6, amp: 0.06 });
        this.modelGroup.add(core);

        for (let r = 0; r < concepts; r++) {
          const rad = 0.85 + r * (0.24 + explode * 0.08);
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(rad, 0.035, 12, 48),
            r % 2 === 0 ? warmBrassMat : brushedMetalMat
          );
          ring.position.y = centerY;
          ring.rotation.x = r * 0.65;
          ring.rotation.y = r * 0.85;
          this.modelGroup.add(ring);

          const node = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), accentMat);
          this.modelGroup.add(node);
          this.orbitSubparts.push({
            obj: node,
            radiusX: rad,
            radiusZ: rad,
            centerY,
            speed: (r % 2 === 0 ? 1 : -1) * (0.65 + r * 0.15),
            phase: r * 1.4,
            tiltX: r * 0.45,
            tiltZ: r * 0.3,
          });
        }
        break;
      }

      // ==================== ANGLAIS (LV1) ====================
      case 'en_tense_3d': {
        // English Aspect & Timeline Axis: Past → Present → Future glowing rail with 6 aspect stations & bridging Present Perfect arc
        const tenseIdx = Math.max(1, Math.min(6, Math.round(a)));

        const railBase = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 1.3), darkSlateMat);
        railBase.position.y = 0.07;
        railBase.receiveShadow = true;
        this.modelGroup.add(railBase);

        const axisRod = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.4, 14), warmBrassMat);
        axisRod.rotation.z = Math.PI / 2;
        axisRod.position.y = 0.85;
        this.modelGroup.add(axisRod);

        // 6 tense markers along the chronological axis
        const xs = [-1.8, -1.1, -0.35, 0.35, 1.15, 1.85];
        for (let i = 0; i < 6; i++) {
          const active = i + 1 === tenseIdx;
          const h = active ? 1.55 : 0.72;
          const post = new THREE.Mesh(
            new THREE.CylinderGeometry(active ? 0.2 : 0.12, active ? 0.24 : 0.14, h, 16),
            active ? accentMat : brushedMetalMat
          );
          post.position.set(xs[i], 0.14 + h / 2 + (active ? explode * 0.3 : 0), 0);
          post.castShadow = true;
          post.userData.tag = `tense-${i + 1}`;
          this.modelGroup.add(post);

          if (active) {
            const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), warmBrassMat);
            beacon.position.set(xs[i], 0.14 + h + 0.42, 0);
            this.animatedSubparts.push({ obj: beacon, baseY: beacon.position.y, phase: 0, speed: 2.4, amp: 0.1 });
            this.modelGroup.add(beacon);
          }
        }

        // Aspect bridge arc linking Past to Present (Present Perfect / Continuous aspect)
        const bridge = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(-1.1, 0.9, 0),
          new THREE.Vector3(-0.2, 2.25 + explode * 0.25, 0),
          new THREE.Vector3(0.4, 0.9, 0)
        );
        const arc = new THREE.Mesh(new THREE.TubeGeometry(bridge, 24, 0.04, 10, false), accentMat);
        this.modelGroup.add(arc);
        break;
      }

      case 'en_syntax_3d': {
        // English Word-Order Modular Rails (WH + Aux + Subject + Verb + Object) with interlocking syntax cubes
        const blocks = Math.max(3, Math.min(8, Math.round(a)));
        const mode = Math.max(1, Math.min(3, Math.round(c)));

        const track = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.16, 1.5), darkSlateMat);
        track.position.y = 0.08;
        track.receiveShadow = true;
        this.modelGroup.add(track);

        const colors = [0xf59e0b, 0xef4444, 0x2563eb, 0x10b981, 0x8b5cf6, 0x06b6d4];
        const spacing = 4.0 / Math.max(1, blocks - 1);
        for (let i = 0; i < blocks; i++) {
          const x = -2.0 + i * spacing;
          const h = mode === 2 ? 0.5 + i * 0.22 : 0.75 + (i % 2) * 0.35;
          const cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.46, h, 0.56),
            new THREE.MeshPhysicalMaterial({ color: colors[i % colors.length], roughness: 0.24, metalness: 0.25, clearcoat: 0.7 })
          );
          cube.position.set(x, 0.16 + h / 2 + (i % 2 === 0 ? explode * 0.25 : 0), 0);
          cube.castShadow = true;
          this.modelGroup.add(cube);
        }

        // Transformation arc (Active → Passive or Direct → Reported) in mode 3
        if (mode === 3) {
          const swapCurve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(1.8, 1.35, 0),
            new THREE.Vector3(0, 2.55, 0),
            new THREE.Vector3(-1.8, 1.35, 0)
          );
          const swapArc = new THREE.Mesh(new THREE.TubeGeometry(swapCurve, 26, 0.04, 10, false), warmBrassMat);
          this.modelGroup.add(swapArc);
        }
        break;
      }

      case 'en_modals_3d': {
        // Modal Certainty & Obligation Graduated Tower (Might → May → Should → Must) with glowing certainty needle
        const modals = Math.max(2, Math.min(6, Math.round(a)));
        const certainty = Math.max(20, Math.min(100, b));

        const base = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 1.6), darkSlateMat);
        base.position.y = 0.07;
        base.receiveShadow = true;
        this.modelGroup.add(base);

        for (let i = 0; i < modals; i++) {
          const frac = (i + 1) / modals;
          const h = 0.45 + frac * 1.65;
          const x = -1.65 + (i / Math.max(1, modals - 1)) * 3.3;
          const colHue = 0.58 - frac * 0.52;
          const barMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color().setHSL(colHue, 0.78, 0.48),
            roughness: 0.22,
            metalness: 0.28,
            clearcoat: 0.75,
          });
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.46, h, 0.56), barMat);
          bar.position.set(x, 0.14 + h / 2 + explode * frac * 0.22, 0);
          bar.castShadow = true;
          this.modelGroup.add(bar);
        }

        // Floating certainty threshold ring
        const levelY = 0.45 + (certainty / 100) * 1.65;
        const indicator = new THREE.Mesh(new THREE.BoxGeometry(4.1, 0.06, 0.85), warmBrassMat);
        indicator.position.y = levelY;
        this.modelGroup.add(indicator);
        break;
      }

      case 'en_vocab_3d': {
        // 3D Semantic Constellation: central lexical theme sphere surrounded by N orbiting vocabulary cluster satellites
        const nodes = Math.max(4, Math.min(12, Math.round(a)));
        const mastery = Math.max(30, Math.min(100, b));
        const theme = Math.max(1, Math.min(3, Math.round(c)));

        const coreColor = theme === 1 ? 0x2563eb : theme === 2 ? 0x16a34a : 0x7c3aed;
        const hub = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.54, 1),
          new THREE.MeshPhysicalMaterial({ color: coreColor, roughness: 0.2, metalness: 0.3, clearcoat: 0.85 })
        );
        hub.position.y = 1.48;
        hub.castShadow = true;
        this.modelGroup.add(hub);

        const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.14, 24), darkSlateMat);
        pedestal.position.y = 0.07;
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.85, 12), warmBrassMat);
        stem.position.y = 0.52;
        this.modelGroup.add(pedestal, stem);

        const rBase = 1.45 + (mastery / 100) * 0.45 + explode * 0.35;
        for (let i = 0; i < nodes; i++) {
          const ang = (i / nodes) * Math.PI * 2;
          const elev = 1.48 + Math.sin(i * 1.7) * 0.55;
          const sx = Math.cos(ang) * rBase;
          const sz = Math.sin(ang) * rBase;

          const sat = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), i % 2 === 0 ? accentMat : warmBrassMat);
          sat.position.set(sx, elev, sz);
          sat.castShadow = true;
          this.animatedSubparts.push({ obj: sat, baseY: elev, phase: i * 0.7, speed: 1.7, amp: 0.08 });
          this.modelGroup.add(sat);

          const spoke = new THREE.LineCurve3(new THREE.Vector3(0, 1.48, 0), new THREE.Vector3(sx, elev, sz));
          const link = new THREE.Mesh(new THREE.TubeGeometry(spoke, 8, 0.018, 6, false), brushedMetalMat);
          this.modelGroup.add(link);
        }
        break;
      }

      case 'en_culture_3d': {
        // English-Speaking World Cultural Landmark Diorama: Big Ben Clock Tower (UK) / Skyscraper Beacon (US) / Global Anglophone Globe
        const hubs = Math.max(3, Math.min(8, Math.round(a)));
        const area = Math.max(1, Math.min(3, Math.round(c)));

        const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.5, 0.14, 36), darkSlateMat);
        dais.position.y = 0.07;
        dais.receiveShadow = true;
        this.modelGroup.add(dais);

        if (area === 1) {
          // Elizabeth Tower (Big Ben) silhouette + 4 constituent nation columns
          const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6b588, roughness: 0.72, metalness: 0.08 });
          const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.68, 2.05, 0.68), stoneMat);
          shaft.position.y = 0.14 + 1.025;
          shaft.castShadow = true;
          const clockFace = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.42, 0.74), warmBrassMat);
          clockFace.position.y = 1.95;
          const spire = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.85, 4), accentMat);
          spire.rotation.y = Math.PI / 4;
          spire.position.y = 2.6 + explode * 0.3;
          this.modelGroup.add(shaft, clockFace, spire);

          for (let n = 0; n < 4; n++) {
            const ang = (n / 4) * Math.PI * 2 + Math.PI / 4;
            const col = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.65, 14), brushedMetalMat);
            col.position.set(Math.cos(ang) * 1.55, 0.46, Math.sin(ang) * 1.55);
            col.castShadow = true;
            this.modelGroup.add(col);
          }
        } else if (area === 2) {
          // US Federal Capitol & New York Skyline Cluster
          const glassMatUS = new THREE.MeshPhysicalMaterial({ color: 0x2563eb, roughness: 0.18, metalness: 0.55, clearcoat: 0.85 });
          for (let i = 0; i < hubs; i++) {
            const ang = (i / hubs) * Math.PI * 2;
            const rad = i === 0 ? 0 : 1.15 + explode * 0.25;
            const h = i === 0 ? 2.25 : 0.85 + (i % 3) * 0.42;
            const tower = new THREE.Mesh(new THREE.BoxGeometry(0.38, h, 0.38), i === 0 ? warmBrassMat : glassMatUS);
            tower.position.set(Math.cos(ang) * rad, 0.14 + h / 2, Math.sin(ang) * rad);
            tower.castShadow = true;
            this.modelGroup.add(tower);
          }
        } else {
          // Global English-Speaking Network (Commonwealth & transatlantic links)
          const globe = new THREE.Mesh(
            new THREE.SphereGeometry(0.88, 30, 30),
            new THREE.MeshPhysicalMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.18, clearcoat: 0.7 })
          );
          globe.position.y = 1.45;
          globe.castShadow = true;
          this.modelGroup.add(globe);

          for (let h = 0; h < hubs; h++) {
            const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), h % 2 === 0 ? warmBrassMat : accentMat);
            this.modelGroup.add(node);
            this.orbitSubparts.push({
              obj: node,
              radiusX: 1.55 + explode * 0.25,
              radiusZ: 1.55 + explode * 0.25,
              centerY: 1.45,
              speed: 0.65,
              phase: (h / hubs) * Math.PI * 2,
              tiltX: 0.35 * (h % 2 === 0 ? 1 : -1),
              tiltZ: 0.2,
            });
          }
        }
        break;
      }

      case 'en_essay_3d': {
        // Structured Essay Pyramid: Introduction base, N interlocking body paragraphs bridged by golden linking-word bars, and Conclusion capstone
        const paras = Math.max(3, Math.min(6, Math.round(a)));
        const coh = Math.max(50, Math.min(100, b));

        const base = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.14, 1.6), darkSlateMat);
        base.position.y = 0.07;
        base.receiveShadow = true;
        this.modelGroup.add(base);

        const bodyW = 3.8 / paras;
        for (let p = 0; p < paras; p++) {
          const x = -1.9 + bodyW / 2 + p * bodyW;
          const isEdge = p === 0 || p === paras - 1;
          const h = isEdge ? 0.72 : 1.15 + (coh / 100) * 0.65;
          const block = new THREE.Mesh(
            new THREE.BoxGeometry(bodyW * 0.76, h, 0.72),
            isEdge ? brushedMetalMat : accentMat
          );
          block.position.set(x, 0.14 + h / 2 + explode * (isEdge ? 0.05 : 0.22), 0);
          block.castShadow = true;
          this.modelGroup.add(block);

          // Golden Linking Word connector bridge between consecutive paragraphs
          if (p < paras - 1) {
            const nextX = x + bodyW;
            const link = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, bodyW * 0.55, 10), warmBrassMat);
            link.rotation.z = Math.PI / 2;
            link.position.set((x + nextX) / 2, 0.75, 0);
            this.modelGroup.add(link);
          }
        }
        break;
      }

      default: {
        // Polyvalent 3D parametric mathematical surface & geometric orbital rig
        const segs = 24;
        const surfGeo = new THREE.PlaneGeometry(4.4, 4.4, segs, segs);
        surfGeo.rotateX(-Math.PI / 2);
        const pos = surfGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const val =
            0.35 * a * Math.cos(x * 0.9) * Math.cos(z * 0.9) +
            0.12 * b * (x * x - z * z) * 0.25 +
            1.2;
          pos.setY(i, Math.max(0.2, val));
        }
        surfGeo.computeVertexNormals();
        const surf = new THREE.Mesh(surfGeo, accentMat);
        surf.castShadow = true;
        surf.receiveShadow = true;
        this.modelGroup.add(surf);

        const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), warmBrassMat);
        core.position.set(0, 2.35 + explode * 0.5, 0);
        core.castShadow = true;
        this.animatedSubparts.push({ obj: core, baseY: core.position.y, phase: 0 });
        this.modelGroup.add(core);
        break;
      }
    }
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private startLoop() {
    const tick = () => {
      if (this.disposed) return;
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();

      if (this.cameraTransitionActive) {
        this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _camTargetPos.x, 5.5, delta);
        this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _camTargetPos.y, 5.5, delta);
        this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _camTargetPos.z, 5.5, delta);
        this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, _camTargetLook.x, 5.5, delta);
        this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, _camTargetLook.y, 5.5, delta);
        this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, _camTargetLook.z, 5.5, delta);
        if (this.camera.position.distanceTo(_camTargetPos) < 0.04) {
          this.cameraTransitionActive = false;
        }
      }

      for (let i = 0; i < this.animatedSubparts.length; i++) {
        const item = this.animatedSubparts[i];
        item.obj.position.y =
          item.baseY + Math.sin(elapsed * (item.speed ?? 1.8) + item.phase) * (item.amp ?? 0.06);
      }

      for (let i = 0; i < this.orbitSubparts.length; i++) {
        const orb = this.orbitSubparts[i];
        if (orb.rectLoop) {
          const { halfW, halfD, y } = orb.rectLoop;
          const u = (elapsed * orb.speed * 0.14 + orb.phase) % 1;
          const perim = 4 * (halfW + halfD);
          let dist = u * perim;
          if (dist < 2 * halfW) {
            orb.obj.position.set(-halfW + dist, y, -halfD);
          } else if (dist < 2 * halfW + 2 * halfD) {
            dist -= 2 * halfW;
            orb.obj.position.set(halfW, y, -halfD + dist);
          } else if (dist < 4 * halfW + 2 * halfD) {
            dist -= 2 * halfW + 2 * halfD;
            orb.obj.position.set(halfW - dist, y, halfD);
          } else {
            dist -= 4 * halfW + 2 * halfD;
            orb.obj.position.set(-halfW, y, halfD - dist);
          }
        } else {
          const theta = elapsed * orb.speed + orb.phase;
          const lx = Math.cos(theta) * orb.radiusX;
          const lz = Math.sin(theta) * orb.radiusZ;
          const cosX = Math.cos(orb.tiltX);
          const sinX = Math.sin(orb.tiltX);
          const cosZ = Math.cos(orb.tiltZ);
          const sinZ = Math.sin(orb.tiltZ);
          const y1 = -lz * sinX;
          const z1 = lz * cosX;
          const x2 = lx * cosZ - y1 * sinZ;
          const y2 = lx * sinZ + y1 * cosZ;
          orb.obj.position.set(x2, orb.centerY + y2, z1);
        }
      }

      this.frameListeners.forEach((cb) => cb(delta));
      this.controls.update();
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.isSoftwareGl) {
      this.frameId = window.setTimeout(tick, 16);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private handleContextLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.onContextLostCb?.(true);
  };

  private handleContextRestored = () => {
    this.onContextLostCb?.(false);
    this.startLoop();
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
    this.clearModelGroup();
    this.pmremEnvTex.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
