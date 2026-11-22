// Missions 3D : définitions en données pures (aucune dépendance au moteur ni au DOM).

export type ParamKey = 'a' | 'b' | 'c';
export interface MissionParams {
  a: number;
  b: number;
  c: number;
}

/** drag-x / drag-y : glisser · dial : tourner autour d'un point · tap : toucher un objet étiqueté */
export type GestureKind = 'drag-x' | 'drag-y' | 'dial' | 'tap';

export interface MissionControl {
  param: ParamKey;
  gesture: GestureKind;
  min: number;
  max: number;
  step: number;
  /** pixels de glissé par cran (défaut 24) */
  pxPerStep?: number;
  /** tap : préfixe d'étiquette (« slice- ») ; valeur = numéro de l'étiquette + offset */
  tagPrefix?: string;
  offset?: number;
}

export interface MissionRound {
  prompt: string;
  start: Partial<MissionParams>;
  goal?: (p: MissionParams) => boolean;
  targetTag?: string;
  solution?: Partial<MissionParams>;
}

export interface MissionDef {
  id: string;
  preset: string;
  level: 1 | 2 | 3;
  kind: 'adjust' | 'identify';
  prompt: string;
  hint: string;
  start: Partial<MissionParams>;
  controls?: MissionControl[];
  goal?: (p: MissionParams) => boolean;
  solution?: Partial<MissionParams>;
  targetTag?: string;
  /** niveau 3 : série de manches tirées au hasard */
  rounds?: (rand: () => number) => MissionRound[];
  timeLimitS?: number;
}

export interface MissionResult {
  missionId: string;
  level: 1 | 2 | 3;
  stars: 0 | 1 | 2 | 3;
  timeMs: number;
  prompt: string;
  hint: string;
}
