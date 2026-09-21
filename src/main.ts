import './style.css';
import { App } from './shell/app.ts';
import { VIEW } from './stage/layout.ts';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) throw new Error('Cold Open is missing its canvas.');
const hud = document.querySelector<HTMLElement>('#co-hud');
if (!hud) throw new Error('Cold Open is missing its match HUD.');
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Cold Open could not get a 2D context.');

canvas.tabIndex = 0;
canvas.addEventListener('pointerdown', () => {
  canvas.focus();
});

function fit(): void {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas!.width = Math.round(VIEW.w * dpr);
  canvas!.height = Math.round(VIEW.h * dpr);
  ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
}

fit();
window.addEventListener('resize', fit);

const app = new App(canvas, hud);
let last = performance.now();

function frame(now: number): void {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  app.tick(ctx!, dt);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
void canvas.focus();
