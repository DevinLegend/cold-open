// Lane: presentation. Percent, stocks, intro, and the fading control strip.
//
// Owen display contract — bind only. This module does not store damage or stocks.
//   Percent: fighter.damage   (data-damage, unrounded)
//   Stocks:  fighter.stocks   (data-stocks, lives remaining)
// The visible digits are Math.floor(fighter.damage). Hit juice reads fighter.damageFlash.
// koLog is not drained and is not a second percent. During a blast freeze the HUD
// still shows fighter.damage; respawn is what zeroes it.

import type { FighterId, MatchState } from '../game/types.ts';
import { NAMEPLATE_LABELS, NAMEPLATE_SIZE } from '../../art/nameplates.ts';
import { P1_LABEL, P2_LABEL } from '../input/bindings.ts';
import { STOCKS, STAGE_NAME, VIEW } from '../stage/layout.ts';
import { HUD_PLATE_SCALE, drawHudPlate } from './nameplate.ts';
import { damageColor, setFont } from './text.ts';

/**
 * Bottom-corner panels in view fractions.
 * At the rest camera these sit in the pit: below the slab, clear of both
 * fighters' feet, and well outside the stage midline.
 */
export const HUD_LAYOUT = {
  width: 0.22,
  insetX: 0.018,
  insetBottom: 0.012,
  maxHeight: 0.122,
} as const;

export interface HudPanelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HudReadout {
  slot: 0 | 1;
  fighterId: FighterId;
  /** Unrounded `fighter.damage`. */
  damage: number;
  /** `fighter.stocks` remaining. */
  stocks: number;
  /** Icon slots from the match stock rule. */
  stockCap: number;
  /** `fighter.damageFlash` seconds still running. */
  flash: number;
  /** `fighter.koHold` — the stock that just dropped can blink. */
  koHold: boolean;
  out: boolean;
  side: 'P1' | 'P2' | 'CPU';
  name: string;
}

export function hudPanelRect(slot: 0 | 1, view: { w: number; h: number } = VIEW): HudPanelRect {
  const w = view.w * HUD_LAYOUT.width;
  const h = view.h * HUD_LAYOUT.maxHeight;
  const y = view.h * (1 - HUD_LAYOUT.insetBottom) - h;
  const x = slot === 0 ? view.w * HUD_LAYOUT.insetX : view.w * (1 - HUD_LAYOUT.insetX) - w;
  return { x, y, w, h };
}

/** Whole-number percent text. The authoritative value stays on `fighter.damage`. */
export function formatPercent(damage: number): string {
  return `${formatPercentDigits(damage)}%`;
}

export function formatPercentDigits(damage: number): string {
  return String(Math.floor(damage));
}

/** Scale pop driven by `fighter.damageFlash`. Rest scale is 1. Caps so the digits stay in the pit. */
export function hudPopScale(flash: number): number {
  if (flash <= 0) return 1;
  return 1 + Math.min(0.2, flash * 1.05);
}

export function readHud(match: MatchState): [HudReadout, HudReadout] {
  return [readSlot(match, 0), readSlot(match, 1)];
}

function readSlot(match: MatchState, slot: 0 | 1): HudReadout {
  const fighter = match.fighters[slot];
  const side = slot === 0 ? 'P1' : match.control[slot] === 'cpu' ? 'CPU' : 'P2';
  return {
    slot,
    fighterId: fighter.id,
    damage: fighter.damage,
    stocks: fighter.stocks,
    stockCap: STOCKS,
    flash: fighter.damageFlash,
    koHold: fighter.koHold,
    out: fighter.out,
    side,
    name: NAMEPLATE_LABELS[fighter.id],
  };
}

const SVG_NS = 'http://www.w3.org/2000/svg';

const plateCache = new Map<FighterId, string>();

/** Shared pixel plate, painted once. Not a damage or stock store. */
function plateSrc(id: FighterId): string {
  const cached = plateCache.get(id);
  if (cached) return cached;
  const size = NAMEPLATE_SIZE[id];
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(size.w * HUD_PLATE_SCALE));
  canvas.height = Math.max(1, Math.ceil(size.h * HUD_PLATE_SCALE));
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  drawHudPlate(ctx, id, canvas.width / 2, canvas.height / 2);
  const url = canvas.toDataURL();
  plateCache.set(id, url);
  return url;
}

/** Push the current match fields into the corner HUD. Call once per painted frame. */
export function bindHud(root: HTMLElement, match: MatchState): void {
  root.hidden = false;
  root.dataset.active = 'true';
  applyLayoutVars(root);
  for (const readout of readHud(match)) bindSlot(root, readout);
}

export function clearHud(root: HTMLElement): void {
  root.hidden = true;
  root.dataset.active = 'false';
}

function applyLayoutVars(root: HTMLElement): void {
  root.style.setProperty('--co-hud-width', `${HUD_LAYOUT.width * 100}%`);
  root.style.setProperty('--co-hud-inset-x', `${HUD_LAYOUT.insetX * 100}%`);
  root.style.setProperty('--co-hud-bottom', `${HUD_LAYOUT.insetBottom * 100}%`);
  root.style.setProperty('--co-hud-max-h', `${HUD_LAYOUT.maxHeight * 100}%`);
  const plateH = (NAMEPLATE_SIZE.elon.h * HUD_PLATE_SCALE) / VIEW.w;
  root.style.setProperty('--co-hud-plate-h', `${plateH * 100}cqw`);
}

function bindSlot(root: ParentNode, readout: HudReadout): void {
  const panel = root.querySelector<HTMLElement>(`[data-hud-slot="${readout.slot}"]`);
  if (!panel) throw new Error(`Cold Open HUD is missing slot ${readout.slot}.`);

  panel.dataset.damage = String(readout.damage);
  panel.dataset.stocks = String(readout.stocks);
  panel.dataset.fighter = readout.fighterId;
  panel.dataset.out = readout.out ? '1' : '0';
  panel.classList.toggle('is-hit', readout.flash > 0.06);
  panel.style.setProperty('--hud-pop', hudPopScale(readout.flash).toFixed(3));
  panel.setAttribute(
    'aria-label',
    `${readout.side} ${readout.name}, ${formatPercent(readout.damage)} damage, ${readout.stocks} stocks`,
  );

  const side = panel.querySelector<HTMLElement>('[data-hud="side"]');
  const name = panel.querySelector<HTMLElement>('[data-hud="name"]');
  const plate = panel.querySelector<HTMLImageElement>('[data-hud="plate"]');
  const percent = panel.querySelector<HTMLElement>('[data-hud="percent"]');
  const digits = panel.querySelector<HTMLElement>('[data-hud="digits"]');
  const stocks = panel.querySelector<HTMLElement>('[data-hud="stocks"]');
  if (!side || !name || !plate || !percent || !digits || !stocks) {
    throw new Error(`Cold Open HUD slot ${readout.slot} is missing a readout.`);
  }

  side.textContent = readout.side;
  name.textContent = readout.name;
  const src = plateSrc(readout.fighterId);
  if (src && plate.getAttribute('src') !== src) plate.src = src;
  digits.textContent = formatPercentDigits(readout.damage);
  percent.style.color = percentInk(readout);
  syncTokens(stocks, readout);
}

function percentInk(readout: HudReadout): string {
  if (readout.out) return 'rgba(244, 237, 228, 0.38)';
  if (readout.flash > 0.08) return '#FFF6EE';
  return damageColor(readout.damage);
}

function syncTokens(host: HTMLElement, readout: HudReadout): void {
  const count = Math.max(readout.stockCap, Math.ceil(Math.max(0, readout.stocks)));
  while (host.children.length < count) host.append(createToken());
  while (host.children.length > count) host.lastElementChild?.remove();
  const lostIndex = Math.max(0, Math.floor(readout.stocks));
  for (let i = 0; i < host.children.length; i++) {
    const token = host.children[i] as SVGElement;
    const live = i < readout.stocks;
    token.dataset.live = live ? '1' : '0';
    token.dataset.spentFlash = !live && readout.koHold && i === lostIndex ? '1' : '0';
  }
}

function createToken(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 18 26');
  svg.setAttribute('class', 'co-hud__token');
  svg.setAttribute('aria-hidden', 'true');
  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('cx', '9');
  head.setAttribute('cy', '5.2');
  head.setAttribute('r', '3.3');
  head.setAttribute('class', 'co-hud__token-shape');
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', '4.2');
  body.setAttribute('y', '10');
  body.setAttribute('width', '9.6');
  body.setAttribute('height', '13.2');
  body.setAttribute('rx', '3.1');
  body.setAttribute('class', 'co-hud__token-shape');
  svg.append(head, body);
  return svg;
}

export function drawHud(ctx: CanvasRenderingContext2D, match: MatchState): void {
  setFont(ctx, 13, 700);
  ctx.fillStyle = 'rgba(246, 231, 212, 0.72)';
  ctx.textAlign = 'center';
  ctx.fillText(STAGE_NAME.toUpperCase(), VIEW.w / 2, 32);

  if (match.intro > 0.35) banner(ctx, 'READY');
  else if (match.intro > 0) banner(ctx, 'GO');

  if (match.time < 5.2 && match.winner === null && !match.draw) {
    const alpha = match.time < 4 ? 1 : Math.max(0, 5.2 - match.time);
    ctx.globalAlpha = alpha;
    setFont(ctx, 15, 600);
    ctx.fillStyle = '#F6E7D4';
    ctx.textAlign = 'left';
    ctx.fillText(`P1   ${P1_LABEL}`, 40, 58);
    ctx.textAlign = 'right';
    ctx.fillText(`P2   ${P2_LABEL}`, VIEW.w - 40, 58);
    ctx.globalAlpha = 1;
  }

  if (match.shake > 10) {
    ctx.fillStyle = `rgba(255, 214, 186, ${Math.min(0.22, match.shake / 90)})`;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
}

function banner(ctx: CanvasRenderingContext2D, word: string): void {
  setFont(ctx, 72, 700);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(16, 6, 4, 0.45)';
  ctx.fillText(word, VIEW.w / 2 + 3, VIEW.h / 2 - 40 + 3);
  ctx.fillStyle = '#F6E7D4';
  ctx.fillText(word, VIEW.w / 2, VIEW.h / 2 - 40);
}
