// Shared contracts. Lanes can add fields, but keep this module free of rendering and DOM.

export type FighterId = 'elon' | 'sam' | 'dario';

export type Controller = 'human' | 'cpu';

/**
 * Grounded and airborne attacks. Do not rename `forwardSmash` or `forwardAerial`.
 * Throws are applied by the grab hold, not by the attack button.
 * `upSpecial` is the recovery after the double jump is spent.
 */
export type AttackKind =
  | 'forwardSmash'
  | 'backSmash'
  | 'downSmash'
  | 'upSmash'
  | 'forwardAerial'
  | 'backAerial'
  | 'downAerial'
  | 'upAerial'
  | 'grab'
  | 'throwForward'
  | 'throwBack'
  | 'throwUp'
  | 'throwDown'
  | 'upSpecial';

export type DodgeKind = 'spot' | 'roll' | 'air';

export interface Intent {
  x: -1 | 0 | 1;
  /** -1 is up, 1 is down. Space is jump without aiming up. */
  y: -1 | 0 | 1;
  jumpHeld: boolean;
  jumpEdge: boolean;
  attackEdge: boolean;
  /** Held attack charges a grounded smash. A tap leaves this false after the edge frame. */
  attackHeld: boolean;
  grabEdge: boolean;
  dodgeEdge: boolean;
}

export const EMPTY_INTENT: Intent = {
  x: 0,
  y: 0,
  jumpHeld: false,
  jumpEdge: false,
  attackEdge: false,
  attackHeld: false,
  grabEdge: false,
  dodgeEdge: false,
};

export interface AttackState {
  kind: AttackKind;
  /** Seconds since the attack started. */
  t: number;
  hit: boolean;
  /** 1 is a tap. Charged smashes scale damage and base knockback by this. */
  charge: number;
}

export interface ChargeState {
  kind: AttackKind;
  t: number;
}

export interface DodgeState {
  kind: DodgeKind;
  t: number;
  dir: -1 | 0 | 1;
}

/**
 * Owen: one stock spent by a blast-zone KO.
 * Appended before damage resets on respawn. The live HUD still reads `fighter.damage` and `fighter.stocks`.
 * `drainKoLog` (`src/match/persist.ts`) moves these into localStorage key `cold-open.ko-history.v1`.
 * Do not skin the HUD from this lane.
 */
export interface KoRecord {
  slot: 0 | 1;
  fighterId: FighterId;
  stocksRemaining: number;
  damageAtKo: number;
  x: number;
  y: number;
}

export interface Fighter {
  slot: 0 | 1;
  id: FighterId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  /** Displayed as a whole-number percent. */
  damage: number;
  stocks: number;
  grounded: boolean;
  jumpsLeft: number;
  coyote: number;
  jumpBuffer: number;
  jumpCut: boolean;
  jumpCutT: number;
  runTime: number;
  hitstun: number;
  intangible: number;
  respawnLock: number;
  landingLag: number;
  attack: AttackState | null;
  /** Grounded smash charge. Elena can retune the cap in combat/attacks.ts. */
  charge: ChargeState | null;
  dodge: DodgeState | null;
  /** Attacker is holding the other fighter. */
  holding: boolean;
  holdT: number;
  /** Defender is pinned by a grab. Hits and blast zones ignore them until the throw. */
  held: boolean;
  /** Air dodge ended. No jump, attack, or recovery until landing. */
  freefall: boolean;
  /** Up-special already used this airtime. Clears on landing and on hit. */
  recoveryUsed: boolean;
  anim: number;
  damageFlash: number;
  koHold: boolean;
  out: boolean;
  dust: number;
}

export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  r: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  /** Spring velocity for the follow. Absent means at rest. */
  vx?: number;
  vy?: number;
  vz?: number;
}

export interface MatchState {
  fighters: [Fighter, Fighter];
  control: [Controller, Controller];
  time: number;
  intro: number;
  hitstop: number;
  shake: number;
  winner: 0 | 1 | null;
  draw: boolean;
  sparks: Spark[];
  /** Owen: KO history for this match. Not rendered. Drained on match end, leave, and rematch. */
  koLog: KoRecord[];
  /** Stable id for this round. A rematch mints a new one. */
  matchId: string;
  camera: Camera;
  rng: () => number;
  cpuTimer: [number, number];
  cpuPlan: [Intent, Intent];
}

export interface FighterDef {
  id: FighterId;
  name: string;
  short: string;
  temper: string;
  color: string;
  accent: string;
  ink: string;
  width: number;
  height: number;
  /** Higher weight receives less knockback. */
  weight: number;
  walk: number;
  run: number;
  fullHop: number;
  airHop: number;
}
