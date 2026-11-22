import type { MissionDef } from '../types.ts';
import { adnMissions } from './adn.ts';
import { fractionsMissions } from './fractions.ts';
import { friseMissions } from './frise.ts';
import { mathsMissions } from './maths.ts';
import { narratifMissions } from './narratif.ts';
import { refractionMissions } from './refraction.ts';
import { tempsMissions } from './temps.ts';

export const ALL_MISSIONS: MissionDef[] = [
  ...fractionsMissions,
  ...refractionMissions,
  ...adnMissions,
  ...friseMissions,
  ...narratifMissions,
  ...tempsMissions,
  ...mathsMissions,
];

export const getMissionsForPreset = (preset: string): MissionDef[] =>
  ALL_MISSIONS.filter((m) => m.preset === preset).sort((x, y) => x.level - y.level);

export const findMission = (id: string): MissionDef | null => ALL_MISSIONS.find((m) => m.id === id) ?? null;
