// Lane: match. Rules loop: intro, hitstop, damage, stocks, respawn, end.
// Headless on purpose — rendering and keyboard stay outside this file.
//
// Owen: damage is added in applyStrike / applyThrow. Stocks drop in eliminate.
// `state.koLog` records the blast KO before respawn zeroes percent.
// When the match ends, the KO hitstop drains that log through drainKoLog.
// The HUD reads fighter.damage and fighter.stocks directly. Do not skin it here.
//
// Resolve order is part of the combat contract: move, then hit, then grab hold, then blast.

import type { AttackKind, Controller, Fighter, FighterId, Intent, KoRecord, MatchState } from '../game/types.ts';
import { EMPTY_INTENT } from '../game/types.ts';
import { mulberry32 } from '../game/rng.ts';
import { burst } from '../game/sparks.ts';
import { chooseThrow, isActive, isSmash, profileFor } from '../combat/attacks.ts';
import {
  attackBox,
  hitstunFor,
  hurtbox,
  inBlast,
  knockbackMag,
  knockFacing,
  launchVector,
  overlap,
} from '../combat/hit.ts';
import { ROSTER } from '../fighters/roster.ts';
import { spawnFighter } from '../fighters/spawn.ts';
import { planCpu } from '../input/cpu.ts';
import { REST_CAMERA, stepCamera } from '../stage/camera.ts';
import { PLATFORM, SPAWN } from '../stage/layout.ts';
import { stepFighter } from './body.ts';
import { drainKoLog } from './persist.ts';

export interface MatchOptions {
  seed?: number;
  /** Countdown before control. Tests pass 0. */
  intro?: number;
}

const HOLD_THROW_AT = 0.12;
const HOLD_TIMEOUT = 0.9;

let matchSerial = 0;

function nextMatchId(): string {
  matchSerial += 1;
  return `m${matchSerial.toString(36)}-${Date.now().toString(36)}`;
}

export function createMatch(
  ids: [FighterId, FighterId],
  control: [Controller, Controller],
  options: MatchOptions = {},
): MatchState {
  return {
    fighters: [spawnFighter(0, ids[0]), spawnFighter(1, ids[1])],
    control,
    time: 0,
    intro: options.intro ?? 0.75,
    hitstop: 0,
    shake: 0,
    winner: null,
    draw: false,
    sparks: [],
    koLog: [],
    matchId: nextMatchId(),
    camera: { ...REST_CAMERA },
    rng: mulberry32(options.seed ?? 1),
    cpuTimer: [0.2, 0.35],
    cpuPlan: [{ ...EMPTY_INTENT }, { ...EMPTY_INTENT }],
  };
}

export function stepMatch(state: MatchState, dt: number, intents: [Intent, Intent]): void {
  dt = Math.min(Math.max(dt, 0), 0.05);
  if (dt === 0) return;

  state.time += dt;
  for (const spark of state.sparks) {
    spark.life -= dt;
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.vy += 980 * dt;
  }
  if (state.sparks.length > 120) state.sparks.splice(0, state.sparks.length - 120);
  state.sparks = state.sparks.filter((spark) => spark.life > 0);
  state.shake = Math.max(0, state.shake - dt * 26);

  // Feel only. Hit, throw, and blast still run in that order below.
  stepCamera(state.camera, state.fighters, dt);

  if (state.hitstop > 0) {
    state.hitstop -= dt;
    if (state.hitstop <= 0) {
      state.hitstop = 0;
      releaseHolds(state);
      settleKoHistory(state);
    }
    return;
  }

  if (state.winner !== null || state.draw) {
    settleKoHistory(state);
    return;
  }

  if (state.intro > 0) {
    state.intro = Math.max(0, state.intro - dt);
    return;
  }

  const resolved = resolveIntents(state, intents, dt);
  for (let i = 0; i < 2; i++) stepFighter(state.fighters[i], resolved[i], dt, state.sparks);
  resolveHits(state);
  resolveHolds(state, resolved);
  resolveBlast(state);
}

function resolveIntents(state: MatchState, intents: [Intent, Intent], dt: number): [Intent, Intent] {
  const resolved: [Intent, Intent] = [intents[0], intents[1]];
  for (let i = 0; i < 2; i++) {
    if (state.control[i] !== 'cpu') continue;
    state.cpuTimer[i] -= dt;
    if (state.cpuTimer[i] <= 0) {
      state.cpuPlan[i] = planCpu(state.fighters[i], state.fighters[i ^ 1], state.rng);
      state.cpuTimer[i] = 0.14 + state.rng() * 0.12;
      resolved[i] = state.cpuPlan[i];
    } else {
      resolved[i] = {
        ...state.cpuPlan[i],
        jumpEdge: false,
        attackEdge: false,
        attackHeld: false,
        grabEdge: false,
        dodgeEdge: false,
      };
    }
  }
  return resolved;
}

function resolveHits(state: MatchState): void {
  const pending: Array<{ attacker: 0 | 1; defender: 0 | 1 }> = [];
  for (const attacker of [0, 1] as const) {
    const atk = state.fighters[attacker];
    const def = state.fighters[(attacker ^ 1) as 0 | 1];
    if (!atk.attack || atk.attack.hit) continue;
    const profile = profileFor(atk.id, atk.attack.kind);
    if (!isActive(profile, atk.attack.t)) continue;
    if (def.out || def.koHold || def.intangible > 0 || def.held || def.stocks <= 0) continue;
    const box = attackBox(atk, profile.hit);
    const hurt = hurtbox(def, ROSTER[def.id]);
    if (overlap(box, hurt)) pending.push({ attacker, defender: (attacker ^ 1) as 0 | 1 });
  }

  for (const hit of pending) {
    const atk = state.fighters[hit.attacker];
    if (atk.attack?.kind === 'grab') beginHold(state, hit.attacker, hit.defender);
    else applyStrike(state, hit.attacker, hit.defender);
  }
}

function beginHold(state: MatchState, attackerSlot: 0 | 1, defenderSlot: 0 | 1): void {
  const atk = state.fighters[attackerSlot];
  const def = state.fighters[defenderSlot];
  if (!atk.attack) return;
  atk.attack.hit = true;
  atk.holding = true;
  atk.holdT = 0;
  def.held = true;
  def.attack = null;
  def.charge = null;
  def.dodge = null;
  def.holding = false;
  def.vx = 0;
  def.vy = 0;
  def.hitstun = 0;
  def.jumpCut = false;
  state.hitstop = Math.max(state.hitstop, 0.04);
  state.shake = Math.max(state.shake, 2);
  burst(state.sparks, (atk.x + def.x) / 2, def.y - 48, ROSTER[atk.id].accent, 5, 160);
  pinHold(atk, def);
}

function resolveHolds(state: MatchState, intents: [Intent, Intent]): void {
  for (const slot of [0, 1] as const) {
    const atk = state.fighters[slot];
    if (!atk.holding) continue;
    const def = state.fighters[(slot ^ 1) as 0 | 1];
    if (!def.held || def.out || def.koHold) {
      atk.holding = false;
      atk.holdT = 0;
      atk.attack = null;
      continue;
    }
    pinHold(atk, def);
    const intent = intents[slot];
    const aimed = intent.attackEdge || intent.grabEdge || intent.x !== 0 || intent.y !== 0;
    const ready = atk.holdT >= HOLD_THROW_AT && aimed;
    const timeout = atk.holdT >= HOLD_TIMEOUT;
    if (!ready && !timeout) continue;
    const kind = timeout && !ready ? 'throwForward' : chooseThrow(atk.facing, intent.x, intent.y);
    applyThrow(state, slot, (slot ^ 1) as 0 | 1, kind);
  }
}

function pinHold(atk: Fighter, def: Fighter): void {
  const reach = ROSTER[atk.id].width / 2 + ROSTER[def.id].width / 2 + 6;
  def.x = atk.x + atk.facing * reach;
  def.y = atk.grounded ? PLATFORM.top : atk.y;
  def.vx = 0;
  def.vy = 0;
  def.grounded = atk.grounded;
  def.facing = atk.facing === 1 ? -1 : 1;
}

function applyStrike(state: MatchState, attackerSlot: 0 | 1, defenderSlot: 0 | 1): void {
  const atk = state.fighters[attackerSlot];
  const def = state.fighters[defenderSlot];
  if (!atk.attack) return;
  const profile = profileFor(atk.id, atk.attack.kind);
  const charge = atk.attack.charge;
  atk.attack.hit = true;
  releaseIfHolding(state, def);
  def.held = false;
  def.damage = Math.min(999, def.damage + profile.damage * charge);
  const mag = knockbackMag(
    profile.baseKb * charge,
    profile.growth,
    def.damage,
    ROSTER[def.id].weight,
  );
  launchDefender(atk, def, profile.kind, profile.angle, mag);
  state.hitstop = Math.max(state.hitstop, isSmash(profile.kind) ? 0.07 : 0.045);
  state.shake = Math.max(state.shake, isSmash(profile.kind) ? 7 : 4);
  burst(state.sparks, (atk.x + def.x) / 2, def.y - 56, ROSTER[atk.id].accent, 8, 240);
}

function applyThrow(state: MatchState, attackerSlot: 0 | 1, defenderSlot: 0 | 1, kind: AttackKind): void {
  const atk = state.fighters[attackerSlot];
  const def = state.fighters[defenderSlot];
  const profile = profileFor(atk.id, kind);
  atk.holding = false;
  atk.holdT = 0;
  atk.attack = null;
  def.held = false;
  def.damage = Math.min(999, def.damage + profile.damage);
  const mag = knockbackMag(profile.baseKb, profile.growth, def.damage, ROSTER[def.id].weight);
  launchDefender(atk, def, kind, profile.angle, mag);
  state.hitstop = Math.max(state.hitstop, 0.055);
  state.shake = Math.max(state.shake, 5);
  burst(state.sparks, (atk.x + def.x) / 2, def.y - 56, ROSTER[atk.id].accent, 8, 220);
}

function launchDefender(
  atk: Fighter,
  def: Fighter,
  kind: AttackKind,
  angle: number,
  mag: number,
): void {
  const launch = launchVector(angle, mag, knockFacing(kind, atk.facing));
  def.vx = launch.vx;
  def.vy = launch.vy;
  def.grounded = false;
  def.hitstun = hitstunFor(mag);
  def.attack = null;
  def.charge = null;
  def.dodge = null;
  def.jumpCut = false;
  def.freefall = false;
  def.recoveryUsed = false;
  def.facing = atk.x < def.x ? -1 : 1;
  def.damageFlash = 0.22;
}

function releaseIfHolding(state: MatchState, def: Fighter): void {
  if (!def.holding) return;
  const victim = state.fighters[(def.slot ^ 1) as 0 | 1];
  victim.held = false;
  def.holding = false;
  def.holdT = 0;
}

function resolveBlast(state: MatchState): void {
  for (const fighter of state.fighters) {
    if (fighter.out || fighter.koHold || fighter.respawnLock > 0 || fighter.held) continue;
    if (inBlast(fighter.x, fighter.y)) eliminate(state, fighter);
  }
}

/** Once the match is over, move koLog into the local save. Empty logs are a no-op. */
function settleKoHistory(state: MatchState): void {
  if (state.winner === null && !state.draw) return;
  drainKoLog(state);
}

function eliminate(state: MatchState, fighter: Fighter): void {
  if (fighter.koHold || fighter.out) return;
  fighter.stocks = Math.max(0, fighter.stocks - 1);
  const record: KoRecord = {
    slot: fighter.slot,
    fighterId: fighter.id,
    stocksRemaining: fighter.stocks,
    damageAtKo: fighter.damage,
    x: fighter.x,
    y: fighter.y,
  };
  state.koLog.push(record);
  fighter.koHold = true;
  fighter.attack = null;
  fighter.charge = null;
  fighter.dodge = null;
  fighter.vx = 0;
  fighter.vy = 0;
  breakHolds(state);
  state.hitstop = Math.max(state.hitstop, 0.42);
  state.shake = Math.max(state.shake, 16);
  burst(state.sparks, fighter.x, fighter.y - 48, '#F6E7D4', 16, 340);
  const [a, b] = state.fighters;
  if (a.stocks <= 0 && b.stocks <= 0) {
    state.draw = true;
    state.winner = null;
  } else if (a.stocks <= 0) {
    state.winner = 1;
    state.draw = false;
  } else if (b.stocks <= 0) {
    state.winner = 0;
    state.draw = false;
  }
}

function breakHolds(state: MatchState): void {
  for (const fighter of state.fighters) {
    if (fighter.holding) fighter.attack = null;
    fighter.held = false;
    fighter.holding = false;
    fighter.holdT = 0;
  }
}

function releaseHolds(state: MatchState): void {
  for (const fighter of state.fighters) {
    if (!fighter.koHold) continue;
    if (fighter.stocks <= 0) {
      fighter.out = true;
      fighter.koHold = false;
      fighter.attack = null;
      fighter.charge = null;
      fighter.dodge = null;
      fighter.holding = false;
      fighter.held = false;
      continue;
    }
    fighter.x = SPAWN[fighter.slot];
    fighter.y = PLATFORM.top;
    fighter.vx = 0;
    fighter.vy = 0;
    fighter.facing = fighter.slot === 0 ? 1 : -1;
    fighter.damage = 0;
    fighter.grounded = true;
    fighter.jumpsLeft = 1;
    fighter.coyote = 0;
    fighter.jumpBuffer = 0;
    fighter.jumpCut = false;
    fighter.jumpCutT = 0;
    fighter.runTime = 0;
    fighter.hitstun = 0;
    fighter.intangible = 1.45;
    fighter.respawnLock = 0.4;
    fighter.landingLag = 0;
    fighter.attack = null;
    fighter.charge = null;
    fighter.dodge = null;
    fighter.holding = false;
    fighter.holdT = 0;
    fighter.held = false;
    fighter.freefall = false;
    fighter.recoveryUsed = false;
    fighter.damageFlash = 0;
    fighter.koHold = false;
    fighter.out = false;
    fighter.dust = 0;
  }
}
