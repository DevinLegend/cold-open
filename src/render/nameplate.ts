// Presentation. World billboards and the HUD repeat both call paintNameplate.
// Drawn inside the match camera. A full multiply by camera.zoom holds the plate
// at a fixed screen size and blows it up in the world as the view opens.
// cameraDamp follows only part of that zoom: the label still shrinks on a
// pull-back, but not down to a speck, and a punch-in cannot explode it.

import { elonIdleTop } from '../../art/elon/paint.ts';
import { NAMEPLATE_SIZE, paintNameplate } from '../../art/nameplates.ts';
import type { Fighter, FighterId } from '../game/types.ts';

/**
 * Rest scale for the shared pixel plate.
 * 0.5 lands the kit's 8px cells on 4px and the 6px letter gap on 3px,
 * so ELON / SAM / DARIO keep the same 0.15em tracking as the chip's 0.16em.
 * Still under a full-size plate.
 */
export const BILLBOARD_SCALE = 0.5;
/** Screen-space HUD repeat. Stays put when the camera zooms. Smaller than the billboard. */
export const HUD_PLATE_SCALE = 0.32;
const HEAD_GAP = 8;

/** Share of camera zoom the billboard follows. 1 would cancel zoom. */
export const CAMERA_FOLLOW = 0.5;
/** Matches the pull-back cap in stage/camera.ts. Feel only — that file is not retuned. */
const ZOOM_MAX = 1.62;
/** Screen size vs rest. Stops a future punch-in from blowing the plate up. */
const SCREEN_MAX = 1.15;

/** Visual top of the idle head, in fighter space (negative is up). */
const HEAD_TOP: Record<Exclude<FighterId, 'elon'>, number> = {
  sam: -112,
  dario: -120,
};

export function fighterHeadTop(id: FighterId): number {
  return id === 'elon' ? elonIdleTop() : HEAD_TOP[id];
}

/**
 * World-size multiplier for `zoom`. Rest zoom (1) returns 1.
 * Pull-back grows the plate only halfway, so it stays readable without
 * covering the opened view. Screen size is capped so a punch-in cannot explode it.
 */
export function cameraDamp(zoom = 1): number {
  if (!Number.isFinite(zoom) || zoom <= 0) return 1;
  const followed = Math.min(zoom, ZOOM_MAX);
  let damp = 1 + (followed - 1) * CAMERA_FOLLOW;
  if (damp / zoom > SCREEN_MAX) damp = zoom * SCREEN_MAX;
  return damp;
}

/** Billboard scale at this camera zoom. Rest zoom keeps `BILLBOARD_SCALE`. */
export function billboardScaleForZoom(zoom = 1): number {
  return BILLBOARD_SCALE * cameraDamp(zoom);
}

/** Plate center above the head. `feetY` is the fighter's world foot line. */
export function billboardCenterY(id: FighterId, feetY: number, scale = BILLBOARD_SCALE): number {
  const half = (NAMEPLATE_SIZE[id].h * scale) / 2;
  return feetY + fighterHeadTop(id) - HEAD_GAP - half;
}

/** Paint a plate centered on (`cx`, `cy`). Origin snaps so 0.5 scale stays on pixels. */
function paintPlate(
  ctx: CanvasRenderingContext2D,
  id: FighterId,
  cx: number,
  cy: number,
  scale: number,
): void {
  const size = NAMEPLATE_SIZE[id];
  const left = Math.round(cx - (size.w * scale) / 2);
  const top = Math.round(cy - (size.h * scale) / 2);
  ctx.save();
  ctx.translate(left, top);
  ctx.scale(scale, scale);
  paintNameplate(ctx, id, size.w / 2, size.h / 2);
  ctx.restore();
}

export function drawWorldBillboard(
  ctx: CanvasRenderingContext2D,
  fighter: Fighter,
  zoom = 1,
): void {
  const scale = billboardScaleForZoom(zoom);
  const cy = billboardCenterY(fighter.id, fighter.y, scale);
  paintPlate(ctx, fighter.id, fighter.x, cy, scale);
}

export function drawHudPlate(
  ctx: CanvasRenderingContext2D,
  id: FighterId,
  cx: number,
  cy: number,
  scale = HUD_PLATE_SCALE,
): void {
  paintPlate(ctx, id, cx, cy, scale);
}
