// Lane: presentation. Composites the stage, fighters, and HUD for an active match.

import type { Camera, MatchState } from '../game/types.ts';
import { isActive, profileFor } from '../combat/attacks.ts';
import { attackBox, hurtbox } from '../combat/hit.ts';
import { drawFighter, drawShadow } from '../fighters/draw.ts';
import { drawWorldBillboard } from './nameplate.ts';
import { ROSTER } from '../fighters/roster.ts';
import { drawPlatform, drawScenery, drawSky } from '../stage/draw.ts';
import { VIEW } from '../stage/layout.ts';
import { drawHud } from './hud.ts';

export function drawWorld(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  time: number,
  match: MatchState | null,
): void {
  drawSky(ctx, time);
  ctx.save();
  applyCamera(ctx, camera);
  drawScenery(ctx, camera, time);
  drawPlatform(ctx);
  if (match) {
    for (const spark of match.sparks) {
      ctx.globalAlpha = Math.max(0, spark.life / spark.max);
      ctx.fillStyle = spark.color;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const fighter of match.fighters) {
      if (fighter.out) continue;
      drawShadow(ctx, fighter);
      drawFighter(ctx, fighter);
      drawWorldBillboard(ctx, fighter, camera.zoom);
    }
    drawCombatBoxes(ctx, match);
  }
  ctx.restore();
}

export function drawMatch(ctx: CanvasRenderingContext2D, match: MatchState): void {
  const mag = match.shake;
  const ox = Math.sin(match.time * 73) * mag;
  const oy = Math.cos(match.time * 59) * mag * 0.65;
  ctx.save();
  ctx.translate(ox, oy);
  drawWorld(ctx, match.camera, match.time, match);
  ctx.restore();
  drawHud(ctx, match);
}

/** Jules: active hitbox stroke, and both hurtboxes while a swing is live. Sizes live in combat/attacks.ts and roster width/height. */
function drawCombatBoxes(ctx: CanvasRenderingContext2D, match: MatchState): void {
  let live = false;
  for (const fighter of match.fighters) {
    if (!fighter.attack || fighter.attack.hit || fighter.out) continue;
    const profile = profileFor(fighter.id, fighter.attack.kind);
    if (!isActive(profile, fighter.attack.t)) continue;
    live = true;
    const box = attackBox(fighter, profile.hit);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = ROSTER[fighter.id].accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  }
  if (!live) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#F6E7D4';
  ctx.lineWidth = 1;
  for (const fighter of match.fighters) {
    if (fighter.out) continue;
    const box = hurtbox(fighter, ROSTER[fighter.id]);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
  }
  ctx.restore();
}

function applyCamera(ctx: CanvasRenderingContext2D, camera: Camera): void {
  ctx.translate(VIEW.w / 2, VIEW.h / 2);
  ctx.scale(1 / camera.zoom, 1 / camera.zoom);
  ctx.translate(-camera.x, -camera.y);
}
