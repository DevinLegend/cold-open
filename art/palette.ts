// Art lane. Shared color lock for the flat stage and the three fighters.
// Hexes and slab scale match docs/design/01-design-one-pager.md.
// Iris owns that page. Do not import match, combat, or input from here.

export type FighterId = 'elon' | 'sam' | 'dario';

/** Stage palette from the one-pager. Blast rims are edge light only. */
export const STAGE = {
  ground: {
    /** Rust basalt. Top of the slab. */
    top: '#8B4513',
    /** Mid stop of the ground. */
    mid: '#A0522D',
    /** Lip and side. */
    lip: '#3D2314',
  },
  sky: {
    /** Dusty rose. Gradient runs toward `bottom`. */
    top: '#C47A6A',
    /** Ochre haze. */
    bottom: '#D4A574',
    horizon: '#9B6B7A',
  },
  blast: {
    void: '#0B0A12',
    /** Edge readability only. Not a fighter accent. */
    cyanRim: '#3DE0FF',
    /** Edge readability only. Not a fighter accent. */
    magentaRim: '#FF3D9A',
  },
  /** Parallax rockets only. Never on collision. */
  rocket: {
    vapor: '#E8DCC8',
    ember: '#FF6B35',
  },
} as const;

/**
 * Slab scale from the one-pager. Miles owns the collision AABB.
 * Width is in fighter-widths. Thickness and rest air are in fighter-heights.
 * Camera rest shows the full slab, the air above, and the blast rim.
 */
export const SLAB = {
  widthInFighterWidths: { min: 18, max: 22 },
  thicknessInFighterHeights: 1.2,
  restAirInFighterHeights: 1.5,
} as const;

/**
 * Fighter accents locked by the one-pager, on the Jules body fills.
 * ELON teal on charcoal. SAM gold on navy.
 * DARIO: slate body is the mass. Mint is accent only, so it does not melt into sky haze.
 */
export const FIGHTERS = {
  elon: {
    id: 'elon',
    body: '#1a1f2a',
    accent: '#2ee6c5',
    cloth: '#f2f4f8',
    hair: '#2b241c',
  },
  sam: {
    id: 'sam',
    body: '#1c2a4a',
    accent: '#e8b84a',
    cloth: '#d8e0ef',
    hair: '#c4a882',
  },
  dario: {
    id: 'dario',
    body: '#3a4558',
    accent: '#7dffb3',
    cloth: '#efe8dc',
    hair: '#5a4638',
    glasses: '#111318',
  },
} as const satisfies Record<
  FighterId,
  {
    id: FighterId;
    body: string;
    accent: string;
    cloth: string;
    hair: string;
    glasses?: string;
  }
>;

export const FIGHTER_IDS = ['elon', 'sam', 'dario'] as const satisfies readonly FighterId[];
