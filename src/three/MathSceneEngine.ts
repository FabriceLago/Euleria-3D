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
    case 'db_table_3d':
      return {
        labelA: 'Nombre de lignes (tuples)',
        minA: 2,
        maxA: 10,
        stepA: 1,
        labelB: 'Nombre de colonnes (attributs)',
        minB: 2,
        maxB: 8,
        stepB: 1,
        labelC: 'Lignes sélectionnées (WHERE)',
        minC: 1,
        maxC: 8,
        stepC: 1,
      };
    case 'db_keys_3d':
      return {
        labelA: 'Clés primaires PK (parent)',
        minA: 2,
        maxA: 7,
        stepA: 1,
        labelB: 'Clés étrangères FK (enfant)',
        minB: 2,
        maxB: 10,
        stepB: 1,
        labelC: 'Règle ON DELETE (1:RESTRICT 2:CASCADE)',
        minC: 1,
        maxC: 2,
        stepC: 1,
      };
    case 'db_query_3d':
      return {
        labelA: 'Lignes en entrée (FROM)',
        minA: 4,
        maxA: 20,
        stepA: 1,
        labelB: 'Lignes retenues (WHERE)',
        minB: 1,
        maxB: 18,
        stepB: 1,
        labelC: 'Groupes (GROUP BY)',
        minC: 1,
        maxC: 5,
        stepC: 1,
      };
    case 'db_join_3d':
      return {
        labelA: 'Cardinalité Table A',
        minA: 4,
        maxA: 20,
        stepA: 1,
        labelB: 'Cardinalité Table B',
        minB: 4,
        maxB: 20,
        stepB: 1,
        labelC: 'Type (1:INNER 2:LEFT 3:FULL)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'db_btree_3d':
      return {
        labelA: 'Facteur de branchement b',
        minA: 2,
        maxA: 6,
        stepA: 1,
        labelB: 'Profondeur visuelle h',
        minB: 2,
        maxB: 4,
        stepB: 1,
        labelC: 'Volume indexé N (lignes)',
        minC: 100,
        maxC: 10000,
        stepC: 100,
      };
    case 'db_acid_3d':
      return {
        labelA: 'Requêtes dans la transaction',
        minA: 1,
        maxA: 6,
        stepA: 1,
        labelB: 'Issue (1:COMMIT 2:ROLLBACK)',
        minB: 1,
        maxB: 2,
        stepB: 1,
        labelC: 'Niveau d’isolation (1→3)',
        minC: 1,
        maxC: 3,
        stepC: 1,
      };
    case 'db_norm_3d':
      return {
        labelA: 'Forme normale (1:1NF 2:2NF 3:3NF)',
        minA: 1,
        maxA: 3,
        stepA: 1,
        labelB: 'Volume de lignes',
        minB: 20,
        maxB: 1000,
        stepB: 20,
        labelC: 'Tables décomposées',
        minC: 1,
        maxC: 4,
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
    case 'db_table_3d': {
      const rows = Math.max(2, Math.round(a));
      const cols = Math.max(2, Math.round(b));
      const activeRows = Math.min(rows, Math.max(1, Math.round(c)));
      const cells = rows * cols;
      return {
        primaryLabel: 'Structure relationnelle',
        primaryValue: `${rows} tuples × ${cols} attributs`,
        secondaryLabel: 'Cellules / Sélection',
        secondaryValue: `${cells} cellules · ${activeRows} retenue(s)`,
        formulaLive: `SELECT * FROM table LIMIT ${activeRows};  -- ${rows}×${cols} = ${cells}`,
      };
    }
    case 'db_keys_3d': {
      const parents = Math.max(2, Math.round(a));
      const children = Math.max(2, Math.round(b));
      const cascade = Math.round(c) >= 2;
      return {
        primaryLabel: 'Cardinalité PK → FK',
        primaryValue: `${parents} PK → ${children} FK (1:N)`,
        secondaryLabel: 'Intégrité référentielle',
        secondaryValue: cascade ? 'ON DELETE CASCADE' : 'ON DELETE RESTRICT',
        formulaLive: `FOREIGN KEY (user_id) REFERENCES users(id) ${cascade ? 'ON DELETE CASCADE' : 'ON DELETE RESTRICT'}`,
      };
    }
    case 'db_query_3d': {
      const inputRows = Math.max(4, Math.round(a));
      const keptRows = Math.min(inputRows, Math.max(1, Math.round(b)));
      const groups = Math.max(1, Math.min(keptRows, Math.round(c)));
      const selectivity = Math.round((keptRows / inputRows) * 100);
      const avgPerGroup = (keptRows / groups).toFixed(1);
      return {
        primaryLabel: 'Pipeline WHERE → GROUP BY',
        primaryValue: `${keptRows} / ${inputRows} lignes (${selectivity}%)`,
        secondaryLabel: 'Agrégation COUNT(*)',
        secondaryValue: `${groups} groupe(s) · ~${avgPerGroup} lignes/grp`,
        formulaLive: `SELECT grp, COUNT(*) FROM t WHERE ... GROUP BY grp; -- ${keptRows} lignes`,
      };
    }
    case 'db_join_3d': {
      const cardA = Math.max(4, Math.round(a));
      const cardB = Math.max(4, Math.round(b));
      const mode = Math.max(1, Math.min(3, Math.round(c)));
      const overlap = Math.max(1, Math.min(cardA, cardB, Math.round(Math.min(cardA, cardB) * 0.6)));
      const resultCount =
        mode === 1 ? overlap : mode === 2 ? cardA : cardA + cardB - overlap;
      const modeName = mode === 1 ? 'INNER JOIN' : mode === 2 ? 'LEFT JOIN' : 'FULL OUTER JOIN';
      return {
        primaryLabel: `Résultat ${modeName}`,
        primaryValue: `${resultCount} ligne(s) retournée(s)`,
        secondaryLabel: 'Ensembles A, B et A ∩ B',
        secondaryValue: `|A|=${cardA} · |B|=${cardB} · |A∩B|=${overlap}`,
        formulaLive: `A ${modeName} B ON a.id = b.a_id  →  ${resultCount} tuples`,
      };
    }
    case 'db_btree_3d': {
      const branch = Math.max(2, Math.round(a));
      const rows = Math.max(100, Math.round(c));
      const hops = Math.max(1, Math.ceil(Math.log(rows) / Math.log(branch)));
      const speedup = Math.max(1, Math.round(rows / hops));
      return {
        primaryLabel: 'Coût Index B-Tree O(log_b N)',
        primaryValue: `${hops} accès nœud(s) (b=${branch})`,
        secondaryLabel: 'Gain vs Seq Scan O(N)',
        secondaryValue: `×${speedup} plus rapide (${rows} lignes)`,
        formulaLive: `⌈log_${branch}(${rows})⌉ = ${hops} vs Seq Scan = ${rows}`,
      };
    }
    case 'db_acid_3d': {
      const ops = Math.max(1, Math.round(a));
      const isCommit = Math.round(b) <= 1;
      const isoIdx = Math.max(1, Math.min(3, Math.round(c)));
      const isoName =
        isoIdx === 1 ? 'READ COMMITTED' : isoIdx === 2 ? 'REPEATABLE READ' : 'SERIALIZABLE';
      return {
        primaryLabel: isCommit ? 'Transaction validée (COMMIT)' : 'Transaction annulée (ROLLBACK)',
        primaryValue: `${ops} opération(s) atomique(s)`,
        secondaryLabel: 'Niveau d’isolation ACID',
        secondaryValue: isoName,
        formulaLive: `BEGIN; (${ops} ops) → ${isCommit ? 'COMMIT;' : 'ROLLBACK;'}  [${isoName}]`,
      };
    }
    case 'db_norm_3d': {
      const nf = Math.max(1, Math.min(3, Math.round(a)));
      const rows = Math.max(20, Math.round(b));
      const tables = nf === 1 ? 1 : nf === 2 ? 2 : Math.max(3, Math.round(c));
      const savedPct = nf === 1 ? 18 : nf === 2 ? 52 : 84;
      return {
        primaryLabel: `Forme normale active : ${nf}NF`,
        primaryValue: `${tables} table(s) relationnelle(s)`,
        secondaryLabel: 'Réduction de redondance',
        secondaryValue: `−${savedPct} % sur ${rows} enregistrements`,
        formulaLive: `${nf}NF : atomicité${nf >= 2 ? ' + dépen. pleine' : ''}${nf >= 3 ? ' + sans transitivité' : ''}`,
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
    const ceramicMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.12,
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

      case 'db_table_3d': {
        // 3D relational table matrix: header bar + PK column (brass) + highlighted WHERE rows (accent)
        const rows = Math.max(2, Math.min(9, Math.round(a)));
        const cols = Math.max(2, Math.min(7, Math.round(b)));
        const activeRows = Math.min(rows, Math.max(1, Math.round(c)));
        const cellW = 0.56;
        const cellD = 0.42;
        const gap = 0.08 + explode * 0.1;
        const totalW = cols * (cellW + gap);
        const totalD = (rows + 1) * (cellD + gap);

        // Sleek schema plinth
        const plinth = new THREE.Mesh(
          new THREE.BoxGeometry(totalW + 0.35, 0.14, totalD + 0.35),
          darkSlateMat
        );
        plinth.position.set(0, 0.09, 0);
        plinth.receiveShadow = true;
        this.modelGroup.add(plinth);

        const cellGeo = new THREE.BoxGeometry(cellW, 0.24, cellD);
        const headerGeo = new THREE.BoxGeometry(cellW, 0.34, cellD);

        for (let col = 0; col < cols; col++) {
          const x = (col - (cols - 1) / 2) * (cellW + gap);
          const zHeader = (-rows / 2) * (cellD + gap);
          const hdr = new THREE.Mesh(headerGeo, col === 0 ? warmBrassMat : darkSlateMat);
          hdr.position.set(x, 0.36 + explode * 0.25, zHeader);
          hdr.castShadow = true;
          this.modelGroup.add(hdr);

          for (let r = 0; r < rows; r++) {
            const z = (r + 1 - rows / 2) * (cellD + gap);
            const isSelected = r < activeRows;
            const isPk = col === 0;
            const mat = isSelected ? (isPk ? warmBrassMat : accentMat) : ceramicMat;
            const tile = new THREE.Mesh(cellGeo, mat);
            const baseY = 0.3 + (isSelected ? 0.16 : 0) + explode * (isSelected ? 0.35 : 0.05);
            tile.position.set(x, baseY, z);
            tile.castShadow = true;
            tile.receiveShadow = true;
            if (isSelected) {
              this.animatedSubparts.push({
                obj: tile,
                baseY,
                phase: r * 0.55 + col * 0.25,
                amp: 0.035,
                speed: 2.2,
              });
            }
            this.modelGroup.add(tile);
          }
        }
        break;
      }

      case 'db_keys_3d': {
        // Two 3D relational tables connected by Primary Key -> Foreign Key golden Bezier bridges
        const parents = Math.max(2, Math.min(7, Math.round(a)));
        const children = Math.max(2, Math.min(9, Math.round(b)));
        const isCascade = Math.round(c) >= 2;
        const spreadX = 1.85 + explode * 0.65;

        // Parent table monolith (left)
        const parentH = Math.max(1.5, parents * 0.42 + 0.5);
        const parentBox = new THREE.Mesh(new THREE.BoxGeometry(1.3, parentH, 1.05), glassMat);
        parentBox.position.set(-spreadX, parentH / 2 + 0.12, 0);
        parentBox.renderOrder = 2;
        this.modelGroup.add(parentBox);

        const parentBase = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.14, 1.18), darkSlateMat);
        parentBase.position.set(-spreadX, 0.09, 0);
        this.modelGroup.add(parentBase);

        // Child table monolith (right)
        const childH = Math.max(1.5, children * 0.34 + 0.5);
        const childBox = new THREE.Mesh(new THREE.BoxGeometry(1.3, childH, 1.05), glassMat);
        childBox.position.set(spreadX, childH / 2 + 0.12, 0);
        childBox.renderOrder = 2;
        this.modelGroup.add(childBox);

        const childBase = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.14, 1.18), darkSlateMat);
        childBase.position.set(spreadX, 0.09, 0);
        this.modelGroup.add(childBase);

        const pkCoords: THREE.Vector3[] = [];
        const pkGeo = new THREE.BoxGeometry(0.95, 0.18, 0.62);
        for (let i = 0; i < parents; i++) {
          const y = 0.42 + i * ((parentH - 0.55) / Math.max(1, parents - 1));
          const pkMesh = new THREE.Mesh(pkGeo, warmBrassMat);
          pkMesh.position.set(-spreadX, y, 0);
          pkMesh.castShadow = true;
          this.modelGroup.add(pkMesh);
          pkCoords.push(new THREE.Vector3(-spreadX + 0.5, y, 0));
        }

        const fkGeo = new THREE.BoxGeometry(0.95, 0.16, 0.62);
        const linkMat = new THREE.MeshStandardMaterial({
          color: isCascade ? 0x10b981 : accent.getHex(),
          emissive: isCascade ? 0x059669 : accent.getHex(),
          emissiveIntensity: 0.35,
          roughness: 0.3,
          metalness: 0.5,
        });

        for (let j = 0; j < children; j++) {
          const y = 0.38 + j * ((childH - 0.5) / Math.max(1, children - 1));
          const fkMesh = new THREE.Mesh(fkGeo, accentMat);
          fkMesh.position.set(spreadX, y, 0);
          fkMesh.castShadow = true;
          this.modelGroup.add(fkMesh);

          const targetPk = pkCoords[j % pkCoords.length];
          const start = new THREE.Vector3(spreadX - 0.5, y, 0);
          const mid = new THREE.Vector3(
            0,
            (targetPk.y + y) * 0.5 + 0.45 + (j % 3) * 0.18,
            ((j % 2 === 0 ? 1 : -1) * 0.32)
          );
          const curve = new THREE.QuadraticBezierCurve3(targetPk, mid, start);
          const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, 0.028, 8, false), linkMat);
          this.modelGroup.add(tube);
        }

        // Orbiting referential integrity sentinel orb
        const sentinel = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), warmBrassMat);
        this.orbitSubparts.push({
          obj: sentinel,
          radiusX: spreadX * 0.55,
          radiusZ: 0.75,
          speed: 1.5,
          phase: 0,
          centerY: 2.1,
          tiltX: 0.25,
          tiltZ: 0,
        });
        this.modelGroup.add(sentinel);
        break;
      }

      case 'db_query_3d': {
        // 3D SQL pipeline: FROM input records -> WHERE glass prism filter -> GROUP BY aggregated bars
        const inputRows = Math.max(4, Math.min(18, Math.round(a)));
        const keptRows = Math.min(inputRows, Math.max(1, Math.round(b)));
        const groups = Math.max(1, Math.min(5, Math.round(c)));
        const shift = explode * 0.55;

        // Left: input records grid
        const inCols = 3;
        const blockGeo = new THREE.BoxGeometry(0.32, 0.22, 0.32);
        for (let i = 0; i < inputRows; i++) {
          const r = Math.floor(i / inCols);
          const col = i % inCols;
          const passes = i < keptRows;
          const mesh = new THREE.Mesh(blockGeo, passes ? accentMat : ceramicMat);
          const baseY = 0.26 + r * 0.28;
          mesh.position.set(-2.3 - shift + (col - 1) * 0.42, baseY, 0);
          mesh.castShadow = true;
          if (passes) {
            this.animatedSubparts.push({ obj: mesh, baseY, phase: i * 0.35, amp: 0.03 });
          }
          this.modelGroup.add(mesh);
        }

        // Center: WHERE filter glass prism + brass frame
        const prism = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.2, 3), glassMat);
        prism.position.set(0, 1.25, 0);
        prism.rotation.y = Math.PI / 6;
        prism.renderOrder = 2;
        this.modelGroup.add(prism);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.96, 0.04, 12, 36), warmBrassMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(0, 2.36 + shift * 0.3, 0);
        this.modelGroup.add(ring);

        // Pipeline directional arrows
        this.modelGroup.add(
          createVectorArrowGroup(new THREE.Vector3(-1.45, 1.15, 0), new THREE.Vector3(-0.7, 1.15, 0), 0xf59e0b, 0.045),
          createVectorArrowGroup(new THREE.Vector3(0.7, 1.15, 0), new THREE.Vector3(1.45, 1.15, 0), 0x10b981, 0.045)
        );

        // Right: GROUP BY aggregated bars
        const basePerGroup = Math.floor(keptRows / groups);
        const remainder = keptRows % groups;
        for (let g = 0; g < groups; g++) {
          const cnt = basePerGroup + (g < remainder ? 1 : 0);
          const h = Math.max(0.32, cnt * 0.34);
          const z = (g - (groups - 1) / 2) * 0.62;
          const bar = new THREE.Mesh(new THREE.BoxGeometry(0.46, h, 0.42), accentMat);
          bar.position.set(2.2 + shift, 0.12 + h / 2, z);
          bar.castShadow = true;
          bar.receiveShadow = true;
          this.modelGroup.add(bar);

          const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), warmBrassMat);
          cap.position.set(2.2 + shift, 0.3 + h, z);
          this.animatedSubparts.push({ obj: cap, baseY: cap.position.y, phase: g * 0.7, amp: 0.05 });
          this.modelGroup.add(cap);
        }
        break;
      }

      case 'db_join_3d': {
        // 3D Venn cylinders for INNER / LEFT / FULL OUTER JOIN with live intersection lens
        const cardA = Math.max(4, Math.min(20, Math.round(a)));
        const cardB = Math.max(4, Math.min(20, Math.round(b)));
        const mode = Math.max(1, Math.min(3, Math.round(c))); // 1=INNER, 2=LEFT, 3=FULL

        const rA = 0.95 + (cardA / 20) * 0.65;
        const rB = 0.95 + (cardB / 20) * 0.65;
        const dist = (rA + rB) * 0.56 + explode * 0.55;

        const leftActive = mode === 2 || mode === 3;
        const rightActive = mode === 3;

        const leftMat = new THREE.MeshPhysicalMaterial({
          color: leftActive ? accent.getHex() : 0x64748b,
          roughness: 0.22,
          metalness: 0.1,
          transparent: true,
          opacity: leftActive ? 0.62 : 0.26,
        });
        const rightMat = new THREE.MeshPhysicalMaterial({
          color: rightActive ? 0x0ea5e9 : 0x64748b,
          roughness: 0.22,
          metalness: 0.1,
          transparent: true,
          opacity: rightActive ? 0.62 : 0.26,
        });

        const cylA = new THREE.Mesh(new THREE.CylinderGeometry(rA, rA, 0.55, 40), leftMat);
        cylA.position.set(-dist / 2, 0.42, 0);
        cylA.castShadow = true;
        this.modelGroup.add(cylA);

        const cylB = new THREE.Mesh(new THREE.CylinderGeometry(rB, rB, 0.55, 40), rightMat);
        cylB.position.set(dist / 2, 0.42, 0);
        cylB.castShadow = true;
        this.modelGroup.add(cylB);

        // Glowing golden intersection core representing A ∩ B matched rows
        const overlapRadius = Math.max(0.28, Math.min(rA, rB) * 0.48);
        const intersectionCore = new THREE.Mesh(
          new THREE.CylinderGeometry(overlapRadius, overlapRadius, 0.92, 32),
          warmBrassMat
        );
        intersectionCore.position.set(0, 0.65 + explode * 0.35, 0);
        intersectionCore.castShadow = true;
        this.animatedSubparts.push({
          obj: intersectionCore,
          baseY: intersectionCore.position.y,
          phase: 0,
          amp: 0.05,
        });
        this.modelGroup.add(intersectionCore);

        // Floating matched tuple orbs above active sets
        const orbGeo = new THREE.SphereGeometry(0.1, 14, 14);
        const matchOrbs = Math.min(6, Math.max(2, Math.round(Math.min(cardA, cardB) / 3)));
        for (let i = 0; i < matchOrbs; i++) {
          const angle = (i / matchOrbs) * Math.PI * 2;
          const orb = new THREE.Mesh(orbGeo, accentMat);
          const baseY = 1.55 + (i % 2) * 0.22;
          orb.position.set(Math.cos(angle) * overlapRadius * 0.75, baseY, Math.sin(angle) * overlapRadius * 0.75);
          this.animatedSubparts.push({ obj: orb, baseY, phase: i * 0.8, amp: 0.07 });
          this.modelGroup.add(orb);
        }

        // Base plinth ring markers
        const rimA = new THREE.Mesh(new THREE.TorusGeometry(rA, 0.032, 10, 48), leftActive ? accentMat : darkSlateMat);
        rimA.rotation.x = Math.PI / 2;
        rimA.position.set(-dist / 2, 0.7, 0);
        const rimB = new THREE.Mesh(new THREE.TorusGeometry(rB, 0.032, 10, 48), rightActive ? accentMat : darkSlateMat);
        rimB.rotation.x = Math.PI / 2;
        rimB.position.set(dist / 2, 0.7, 0);
        this.modelGroup.add(rimA, rimB);
        break;
      }

      case 'db_btree_3d': {
        // 3D balanced B-Tree search hierarchy: Root -> Internal nodes -> Leaf pages + active O(log_b N) path
        const branch = Math.max(2, Math.min(4, Math.round(a)));
        const depth = Math.max(2, Math.min(3, Math.round(b)));
        const yRoot = 3.1 + explode * 0.45;
        const yMid = 1.75 + explode * 0.2;
        const yLeaf = 0.45;

        const rootPos = new THREE.Vector3(0, yRoot, 0);
        const rootMesh = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.34, 0.56), warmBrassMat);
        rootMesh.position.copy(rootPos);
        rootMesh.castShadow = true;
        this.modelGroup.add(rootMesh);

        const activeBranchIdx = Math.floor(branch / 2);
        const activeLeafSubIdx = 0;

        for (let i = 0; i < branch; i++) {
          const xMid = (i - (branch - 1) / 2) * 1.45;
          const midPos = new THREE.Vector3(xMid, yMid, 0);
          const isPathMid = i === activeBranchIdx;

          const midNode = new THREE.Mesh(
            new THREE.BoxGeometry(0.76, 0.28, 0.46),
            isPathMid ? accentMat : ceramicMat
          );
          midNode.position.copy(midPos);
          midNode.castShadow = true;
          this.modelGroup.add(midNode);

          // Edge Root -> Mid
          const rootEdge = new THREE.TubeGeometry(
            new THREE.LineCurve3(rootPos, midPos),
            6,
            isPathMid ? 0.042 : 0.022,
            8,
            false
          );
          this.modelGroup.add(new THREE.Mesh(rootEdge, isPathMid ? warmBrassMat : brushedMetalMat));

          if (depth >= 3) {
            const leavesPerMid = Math.min(3, branch);
            for (let j = 0; j < leavesPerMid; j++) {
              const zLeaf = (j - (leavesPerMid - 1) / 2) * 0.92;
              const xLeaf = xMid + (j - (leavesPerMid - 1) / 2) * 0.25;
              const leafPos = new THREE.Vector3(xLeaf, yLeaf, zLeaf);
              const isTargetLeaf = isPathMid && j === activeLeafSubIdx;

              const leafNode = new THREE.Mesh(
                new THREE.BoxGeometry(0.52, 0.22, 0.42),
                isTargetLeaf ? warmBrassMat : isPathMid ? accentMat : darkSlateMat
              );
              leafNode.position.copy(leafPos);
              leafNode.castShadow = true;
              this.modelGroup.add(leafNode);

              const leafEdge = new THREE.TubeGeometry(
                new THREE.LineCurve3(midPos, leafPos),
                6,
                isTargetLeaf ? 0.04 : 0.018,
                8,
                false
              );
              this.modelGroup.add(new THREE.Mesh(leafEdge, isTargetLeaf ? warmBrassMat : brushedMetalMat));

              if (isTargetLeaf) {
                const probe = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), warmBrassMat);
                probe.position.set(leafPos.x, leafPos.y + 0.42, leafPos.z);
                this.animatedSubparts.push({ obj: probe, baseY: probe.position.y, phase: 0, amp: 0.14, speed: 3.2 });
                this.modelGroup.add(probe);
              }
            }
          }
        }
        break;
      }

      case 'db_acid_3d': {
        // 4 monumental ACID architectural pillars + central vault + orbiting transaction operations
        const ops = Math.max(1, Math.min(6, Math.round(a)));
        const isCommit = Math.round(b) <= 1;
        const isoLevel = Math.max(1, Math.min(3, Math.round(c)));
        const statusHex = isCommit ? 0x10b981 : 0xef4444;

        const statusMat = new THREE.MeshStandardMaterial({
          color: statusHex,
          emissive: statusHex,
          emissiveIntensity: 0.42,
          roughness: 0.25,
          metalness: 0.4,
        });

        const baseRadius = 1.65 + explode * 0.4;
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(baseRadius + 0.45, baseRadius + 0.55, 0.16, 40), darkSlateMat);
        plinth.position.y = 0.08;
        plinth.receiveShadow = true;
        this.modelGroup.add(plinth);

        // 4 ACID Pillars (A, C, I, D)
        const pillarH = 1.85 + isoLevel * 0.28;
        const pillarOffsets = [
          [-baseRadius * 0.72, -baseRadius * 0.72],
          [baseRadius * 0.72, -baseRadius * 0.72],
          [baseRadius * 0.72, baseRadius * 0.72],
          [-baseRadius * 0.72, baseRadius * 0.72],
        ];
        pillarOffsets.forEach(([px, pz], idx) => {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, pillarH, 20), ceramicMat);
          col.position.set(px, 0.16 + pillarH / 2, pz);
          col.castShadow = true;
          this.modelGroup.add(col);

          const cap = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.56), statusMat);
          cap.position.set(px, 0.24 + pillarH + explode * 0.2, pz);
          this.animatedSubparts.push({ obj: cap, baseY: cap.position.y, phase: idx * 0.9, amp: 0.03 });
          this.modelGroup.add(cap);
        });

        // Translucent isolation dome / core transaction vault
        const vault = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), isCommit ? accentMat : statusMat);
        vault.position.set(0, 1.35 + explode * 0.3, 0);
        vault.castShadow = true;
        this.animatedSubparts.push({ obj: vault, baseY: vault.position.y, phase: 0, amp: 0.08, speed: 2.0 });
        this.modelGroup.add(vault);

        const shield = new THREE.Mesh(new THREE.SphereGeometry(0.98 + isoLevel * 0.08, 28, 28), glassMat);
        shield.position.set(0, 1.35, 0);
        shield.renderOrder = 2;
        this.modelGroup.add(shield);

        // Orbiting SQL operation orbs
        const opGeo = new THREE.SphereGeometry(0.14, 16, 16);
        for (let i = 0; i < ops; i++) {
          const opOrb = new THREE.Mesh(opGeo, i % 2 === 0 ? warmBrassMat : statusMat);
          this.orbitSubparts.push({
            obj: opOrb,
            radiusX: baseRadius * 0.95,
            radiusZ: baseRadius * 0.95,
            speed: isCommit ? 1.45 : -0.95,
            phase: (i / ops) * Math.PI * 2,
            centerY: 1.35,
            tiltX: 0.18,
            tiltZ: 0.12,
          });
          this.modelGroup.add(opOrb);
        }
        break;
      }

      case 'db_norm_3d': {
        // 3D schema decomposition: monolithic redundant slab (1NF) -> 2NF -> 3 cleanly linked 3NF tables
        const nf = Math.max(1, Math.min(3, Math.round(a)));
        const sep = (nf - 1) * 0.95 + explode * 0.55;

        const islandGeo = new THREE.BoxGeometry(1.35, 0.3, 1.05);
        const layerGeo = new THREE.BoxGeometry(1.18, 0.16, 0.88);

        if (nf === 1) {
          // Single heavy redundant monolith with stacked duplicate bands
          const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.24, 1.45), darkSlateMat);
          base.position.set(0, 0.16, 0);
          this.modelGroup.add(base);
          for (let i = 0; i < 6; i++) {
            const band = new THREE.Mesh(
              new THREE.BoxGeometry(2.35, 0.22, 1.2),
              i % 2 === 0 ? warmBrassMat : ceramicMat
            );
            band.position.set(0, 0.44 + i * (0.28 + explode * 0.1), 0);
            band.castShadow = true;
            this.modelGroup.add(band);
          }
        } else {
          const islands: Array<{ pos: THREE.Vector3; rows: number; mat: THREE.Material }> =
            nf === 2
              ? [
                  { pos: new THREE.Vector3(-sep, 0.2, 0), rows: 4, mat: accentMat },
                  { pos: new THREE.Vector3(sep, 0.2, 0), rows: 3, mat: warmBrassMat },
                ]
              : [
                  { pos: new THREE.Vector3(-sep * 1.15, 0.2, 0.55), rows: 3, mat: accentMat },
                  { pos: new THREE.Vector3(0, 0.2, -0.85 - explode * 0.3), rows: 3, mat: warmBrassMat },
                  { pos: new THREE.Vector3(sep * 1.15, 0.2, 0.55), rows: 3, mat: accentMat },
                ];

          islands.forEach((isl, idx) => {
            const deck = new THREE.Mesh(islandGeo, darkSlateMat);
            deck.position.copy(isl.pos);
            deck.receiveShadow = true;
            this.modelGroup.add(deck);

            for (let r = 0; r < isl.rows; r++) {
              const rowTile = new THREE.Mesh(layerGeo, r === 0 ? warmBrassMat : isl.mat);
              const baseY = isl.pos.y + 0.28 + r * (0.24 + explode * 0.08);
              rowTile.position.set(isl.pos.x, baseY, isl.pos.z);
              rowTile.castShadow = true;
              this.animatedSubparts.push({ obj: rowTile, baseY, phase: idx * 1.1 + r * 0.4, amp: 0.025 });
              this.modelGroup.add(rowTile);
            }
          });

          // Foreign-key relation bridges between normalized tables
          for (let i = 0; i < islands.length - 1; i++) {
            const p0 = islands[i].pos.clone().add(new THREE.Vector3(0, 0.55, 0));
            const p1 = islands[i + 1].pos.clone().add(new THREE.Vector3(0, 0.55, 0));
            const mid = p0.clone().add(p1).multiplyScalar(0.5);
            mid.y += 0.65;
            const bridge = new THREE.Mesh(
              new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0, mid, p1), 24, 0.036, 8, false),
              warmBrassMat
            );
            this.modelGroup.add(bridge);
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
