// Lane: stage. The only solid is the slab AABB. Parallax rockets never enter this set.
// Elena: do not retouch these rules while Owen is wiring stocks. Feel lives in body.ts.

import { PLATFORM } from './layout.ts';

export interface Aabb {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Rockets, mesas, and the pit are scenery. Keep this false. */
export const ROCKETS_COLLIDE = false;

export function slabAabb(): Aabb {
  return {
    x: PLATFORM.left,
    y: PLATFORM.top,
    w: PLATFORM.right - PLATFORM.left,
    h: PLATFORM.height,
  };
}

/** Collision set for the match. Length is always 1 until a later stage adds a solid. */
export function collisionSolids(): readonly Aabb[] {
  return [slabAabb()];
}

export interface BodyPose {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
}

export interface BodySize {
  width: number;
  height: number;
}

export type SlabContact = 'grounded' | 'landed' | 'left' | 'blocked' | 'air';

function overlaps(a: Aabb, b: Aabb): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function bodyBox(x: number, feetY: number, size: BodySize): Aabb {
  return {
    x: x - size.width / 2,
    y: feetY - size.height,
    w: size.width,
    h: size.height,
  };
}

/**
 * Resolve one fighter against the slab.
 * The foot origin (center) owns the top surface. The body box owns the sides and the underside
 * so a launcher cannot sink into the silhouette. Walking off a lip does not snag on the corner.
 */
export function resolveSlab(body: BodyPose, prevX: number, prevY: number, size: BodySize): SlabContact {
  const slab = slabAabb();
  const feetOver = body.x >= PLATFORM.left && body.x <= PLATFORM.right;

  if (body.grounded) {
    if (feetOver) {
      body.y = PLATFORM.top;
      body.vy = 0;
      return 'grounded';
    }
    body.grounded = false;
    return 'left';
  }

  if (body.vy >= 0 && feetOver && prevY <= PLATFORM.top && body.y >= PLATFORM.top) {
    body.y = PLATFORM.top;
    body.vy = 0;
    body.grounded = true;
    return 'landed';
  }

  const underside = PLATFORM.top + PLATFORM.height;
  const prevHead = prevY - size.height;
  const head = body.y - size.height;
  if (body.vy < 0 && feetOver && prevHead >= underside - 0.5 && head < underside) {
    body.y = underside + size.height;
    body.vy = 0;
    return 'blocked';
  }

  const box = bodyBox(body.x, body.y, size);
  if (!overlaps(box, slab)) return 'air';

  // Leaving the lip: a pixel of sink should not glue them back onto the top.
  if (!feetOver && prevY <= PLATFORM.top + 1) return 'air';

  if (!feetOver) {
    pushOutSide(body, size);
    return 'blocked';
  }

  const prev = bodyBox(prevX, prevY, size);
  const prevOverlapX = prev.x < slab.x + slab.w && prev.x + prev.w > slab.x;
  if (!prevOverlapX) {
    pushOutSide(body, size);
    return 'blocked';
  }

  return 'air';
}

function pushOutSide(body: BodyPose, size: BodySize): void {
  const mid = (PLATFORM.left + PLATFORM.right) / 2;
  if (body.x >= mid) {
    const pen = PLATFORM.right - (body.x - size.width / 2);
    if (pen > 0) body.x += pen;
    if (body.vx < 0) body.vx = 0;
  } else {
    const pen = body.x + size.width / 2 - PLATFORM.left;
    if (pen > 0) body.x -= pen;
    if (body.vx > 0) body.vx = 0;
  }
}
