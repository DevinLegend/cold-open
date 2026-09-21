// Lane: fighters. Identity, silhouette colors, and movement stats. No marks, no photos.

import { FIGHTERS } from '../../art/palette.ts';
import type { FighterDef, FighterId } from '../game/types.ts';
import { ELON } from '../../art/elon/palette.ts';
import { SAM } from '../../art/sam/palette.ts';

export const FIGHTER_IDS: readonly FighterId[] = ['elon', 'sam', 'dario'];

export const ROSTER: Record<FighterId, FighterDef> = {
  elon: {
    id: 'elon',
    name: 'Elon Musk',
    short: 'ELON',
    temper: 'Sends them downrange.',
    color: ELON.jacket,
    accent: ELON.accent,
    ink: ELON.ink,
    width: 40,
    height: 98,
    weight: 0.96,
    walk: 200,
    run: 350,
    fullHop: 770,
    airHop: 700,
  },
  sam: {
    id: 'sam',
    name: 'Sam Altman',
    short: 'SAM',
    temper: 'Short windup, clean hit.',
    color: SAM.blazer,
    accent: SAM.accent,
    ink: SAM.ink,
    width: 48,
    height: 86,
    weight: 0.86,
    walk: 230,
    run: 410,
    fullHop: 800,
    airHop: 760,
  },
  dario: {
    id: 'dario',
    name: 'Dario',
    short: 'Dario',
    temper: 'Heavy. Leaves the ground.',
    color: FIGHTERS.dario.body,
    accent: FIGHTERS.dario.accent,
    ink: FIGHTERS.dario.glasses ?? FIGHTERS.dario.body,
    width: 46,
    height: 96,
    weight: 1.14,
    walk: 175,
    run: 300,
    fullHop: 740,
    airHop: 680,
  },
};
