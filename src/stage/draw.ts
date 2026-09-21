// Lane: stage. Red Horizon: one slab, a pit, and rockets that never collide.

import type { Camera } from '../game/types.ts';
import { mulberry32 } from '../game/rng.ts';
import { STAGE } from '../../art/palette.ts';
import { PLATFORM, VIEW } from './layout.ts';

interface Rocket {
  x: number;
  y: number;
  depth: number;
  scale: number;
  speed: number;
}

const rand = mulberry32(19);
const STARS = Array.from({ length: 72 }, () => ({
  x: rand() * VIEW.w,
  y: rand() * 300,
  r: rand() * 1.3 + 0.3,
  a: rand() * 0.45 + 0.12,
}));

const ROCKETS: Rocket[] = [
  { x: 180, y: 80, depth: 0.18, scale: 0.7, speed: 28 },
  { x: 520, y: 160, depth: 0.28, scale: 1, speed: 36 },
  { x: 860, y: 40, depth: 0.14, scale: 0.55, speed: 22 },
  { x: 1080, y: 200, depth: 0.36, scale: 1.15, speed: 42 },
  { x: 360, y: 240, depth: 0.22, scale: 0.85, speed: 30 },
];

export function drawSky(ctx: CanvasRenderingContext2D, time: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  sky.addColorStop(0, '#1A0B12');
  sky.addColorStop(0.32, '#6A261C');
  sky.addColorStop(0.58, '#E07A45');
  sky.addColorStop(0.74, '#F2C09A');
  sky.addColorStop(1, '#140806');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  const sun = ctx.createRadialGradient(890, 292, 10, 890, 292, 120);
  sun.addColorStop(0, 'rgba(255, 228, 196, 0.95)');
  sun.addColorStop(0.45, 'rgba(255, 170, 110, 0.35)');
  sun.addColorStop(1, 'rgba(255, 170, 110, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(890, 292, 120, 0, Math.PI * 2);
  ctx.fill();

  for (const star of STARS) {
    const twinkle = 0.65 + Math.sin(time * 1.7 + star.x) * 0.35;
    ctx.globalAlpha = star.a * twinkle;
    ctx.fillStyle = '#F8E6D2';
    ctx.fillRect(star.x, star.y, star.r, star.r);
  }
  ctx.globalAlpha = 1;
}

export function drawScenery(ctx: CanvasRenderingContext2D, camera: Camera, time: number): void {
  drawMesa(ctx, camera, 0.22, '#4A1C16', 470);
  drawMesa(ctx, camera, 0.38, '#2C110E', 500);
  drawPit(ctx);
  drawRockets(ctx, camera, time);
}

function drawMesa(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  depth: number,
  color: string,
  baseY: number,
): void {
  const shift = (camera.x - 640) * (1 - depth);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-400 + shift, baseY + 80);
  const peaks = [40, 120, 40, 150, 70, 180, 50, 140, 80, 160, 40];
  let x = -360;
  for (const peak of peaks) {
    ctx.lineTo(x + shift, baseY - peak);
    x += 190;
    ctx.lineTo(x + shift, baseY - peak * 0.25);
    x += 70;
  }
  ctx.lineTo(2100 + shift, baseY + 80);
  ctx.closePath();
  ctx.fill();
}

function drawPit(ctx: CanvasRenderingContext2D): void {
  const pit = ctx.createLinearGradient(0, PLATFORM.top + 40, 0, 1100);
  pit.addColorStop(0, '#3A1612');
  pit.addColorStop(0.35, '#1A0908');
  pit.addColorStop(1, '#070303');
  ctx.fillStyle = pit;
  ctx.fillRect(-700, PLATFORM.top + PLATFORM.height - 10, 2800, 900);
}

function drawRockets(ctx: CanvasRenderingContext2D, camera: Camera, time: number): void {
  for (const rocket of ROCKETS) {
    const x = rocket.x + (camera.x - 640) * (1 - rocket.depth);
    const travel = (time * rocket.speed + rocket.y) % 560;
    const y = 540 - travel;
    const flame = 0.45 + Math.abs(Math.sin(time * 9 + rocket.x)) * 0.55;
    paintRocket(ctx, x, y, rocket.scale, flame);
  }
}

function paintRocket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  flame: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = `rgba(255, 186, 120, ${0.35 + flame * 0.45})`;
  ctx.beginPath();
  ctx.moveTo(-6, 34);
  ctx.lineTo(0, 48 + flame * 18);
  ctx.lineTo(6, 34);
  ctx.fill();
  ctx.fillStyle = '#E7D7C8';
  ctx.fillRect(-8, -18, 16, 52);
  ctx.beginPath();
  ctx.moveTo(-8, -18);
  ctx.lineTo(0, -38);
  ctx.lineTo(8, -18);
  ctx.fill();
  ctx.fillStyle = '#A86A45';
  ctx.beginPath();
  ctx.moveTo(-8, 18);
  ctx.lineTo(-16, 34);
  ctx.lineTo(-8, 28);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, 18);
  ctx.lineTo(16, 34);
  ctx.lineTo(8, 28);
  ctx.fill();
  ctx.fillStyle = '#24343C';
  ctx.beginPath();
  ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawPlatform(ctx: CanvasRenderingContext2D): void {
  const { left, right, top, height } = PLATFORM;
  const width = right - left;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse((left + right) / 2, top + height + 18, width * 0.38, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Standing surface only. Top is the one-pager rust the shoes stand on.
  // Mid is the front face. Lip is the seam and the bottom edge.
  // Slab size, sky, mesas, and rockets stay where Miles and Iris left them.
  ctx.fillStyle = STAGE.ground.mid;
  ctx.fillRect(left, top + 18, width, height - 18);
  ctx.fillStyle = STAGE.ground.top;
  ctx.fillRect(left, top, width, 20);
  ctx.fillStyle = STAGE.ground.lip;
  ctx.fillRect(left, top + 16, width, 4);
  ctx.fillRect(left, top + height - 8, width, 8);

  ctx.strokeStyle = 'rgba(42, 14, 10, 0.45)';
  ctx.lineWidth = 2;
  for (let x = left + 46; x < right - 10; x += 76) {
    ctx.beginPath();
    ctx.moveTo(x, top + 24);
    ctx.lineTo(x, top + height - 12);
    ctx.stroke();
  }

  ctx.fillStyle = '#8A4634';
  ctx.fillRect(left, top, 12, height);
  ctx.fillRect(right - 12, top, 12, height);

  ctx.fillStyle = 'rgba(255, 236, 214, 0.38)';
  for (const origin of [left + 28, right - 28 - 16 * 5]) {
    for (let i = 0; i < 5; i++) {
      const x = origin + i * 16;
      ctx.beginPath();
      ctx.moveTo(x, top + 7);
      ctx.lineTo(x + 7, top + 7);
      ctx.lineTo(x + 11, top + 11);
      ctx.lineTo(x + 7, top + 15);
      ctx.lineTo(x, top + 15);
      ctx.lineTo(x + 4, top + 11);
      ctx.closePath();
      ctx.fill();
    }
  }
}
