// Pose fixtures for the contrast mock. Sets match state the kits already read.
// Does not add attack kinds or change startup.

import { profileFor } from '../combat/attacks.ts';
import type { Fighter, FighterId } from '../game/types.ts';
import { spawnFighter } from './spawn.ts';

export const POSE_ORDER = ['idle', 'walk', 'jump', 'windup', 'aerial', 'tumble'] as const;
export type CheckPose = (typeof POSE_ORDER)[number];

export const POSE_LABEL: Record<CheckPose, string> = {
  idle: 'Idle',
  walk: 'Walk',
  jump: 'Jump',
  windup: 'Wind-up',
  aerial: 'Aerial',
  tumble: 'KO tumble',
};

export function fighterInPose(id: FighterId, pose: CheckPose, phase = 0): Fighter {
  const fighter = spawnFighter(0, id, 0, 0);
  fighter.anim = phase;
  fighter.facing = 1;
  if (pose === 'walk') {
    fighter.vx = 180;
    fighter.runTime = 0;
  } else if (pose === 'jump') {
    fighter.grounded = false;
    fighter.vy = -220;
    fighter.jumpsLeft = 1;
  } else if (pose === 'windup') {
    const profile = profileFor(id, 'forwardSmash');
    fighter.attack = { kind: 'forwardSmash', t: profile.startup * 0.45, hit: false, charge: 1 };
  } else if (pose === 'aerial') {
    const profile = profileFor(id, 'forwardAerial');
    fighter.grounded = false;
    fighter.vy = 80;
    fighter.jumpsLeft = 0;
    fighter.attack = {
      kind: 'forwardAerial',
      t: profile.startup + profile.active * 0.5,
      hit: false,
      charge: 1,
    };
  } else if (pose === 'tumble') {
    fighter.hitstun = 0.45;
    fighter.koHold = true;
    fighter.grounded = false;
    fighter.vy = 280;
    fighter.jumpsLeft = 0;
  }
  return fighter;
}
