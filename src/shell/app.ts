// Lane: match shell. Screen flow only — rules live in src/match, drawing in src/render.

import type { FighterId, Intent, MatchState } from '../game/types.ts';
import { sfx, unlockAudio } from '../audio/sfx.ts';
import { P1_BIND, P2_BIND } from '../input/bindings.ts';
import { Device, pointIn } from '../input/device.ts';
import { drainKoLog } from '../match/persist.ts';
import { readRematchState, requestRematch as applyRematch, type RematchState } from '../match/rematch.ts';
import { createMatch, stepMatch, type MatchOptions } from '../match/sim.ts';
import { FIGHTER_IDS, ROSTER } from '../fighters/roster.ts';
import { drawMatch } from '../render/frame.ts';
import { bindHud, clearHud } from '../render/hud.ts';
import { drawMode, drawPause, drawSelect, drawTitle, type Mode } from '../render/menus.ts';
import { drawResultOverlay, type ResultOverlay, type ResultPlate } from '../render/results.ts';
import { VIEW } from '../stage/layout.ts';
import {
  chooseResult,
  quitPressed,
  rematchPressed,
  resultTarget,
  type ResultChoice,
} from './results.ts';
import { CARDS, MODE_ROWS, START_BUTTON } from './ui.ts';

type Screen = 'title' | 'mode' | 'select' | 'fight';

export class App {
  private screen: Screen = 'title';
  private mode: Mode = 'cpu';
  private modeIndex = 0;
  private cursor = 0;
  private picks: [FighterId | null, FighterId | null] = [null, null];
  private picking: 0 | 1 = 0;
  private match: MatchState | null = null;
  private paused = false;
  private uiTime = 0;
  private resultAge = 0;
  private resultHover: ResultChoice | null = null;
  private readonly device: Device;
  private readonly hud: HTMLElement;

  constructor(canvas: HTMLCanvasElement, hud: HTMLElement) {
    this.device = new Device(canvas);
    this.hud = hud;
    this.armResultPreview();
  }

  tick(ctx: CanvasRenderingContext2D, dt: number): void {
    this.uiTime += dt;
    this.update(dt);
    this.draw(ctx);
    this.device.endFrame();
  }

  private update(dt: number): void {
    const pointerMoved = this.device.consumePointerMove();
    if (this.screen === 'title') this.updateTitle();
    else if (this.screen === 'mode') this.updateMode(pointerMoved);
    else if (this.screen === 'select') this.updateSelect(pointerMoved);
    else this.updateFight(dt);
  }

  private updateTitle(): void {
    const hover = pointIn(this.device.point, START_BUTTON);
    if (this.edgeStart() || (this.device.click && hover)) {
      unlockAudio();
      sfx.ui();
      this.screen = 'mode';
    }
  }

  private updateMode(pointerMoved: boolean): void {
    const hover = MODE_ROWS.findIndex((row) => pointIn(this.device.point, row));
    if (pointerMoved && hover >= 0) this.modeIndex = hover;
    if (this.edgeVert(-1)) this.modeIndex = Math.max(0, this.modeIndex - 1);
    if (this.edgeVert(1)) this.modeIndex = Math.min(1, this.modeIndex + 1);
    if (this.edgeBack()) {
      sfx.ui();
      this.screen = 'title';
      return;
    }
    const clicked = this.device.click && hover >= 0;
    if (this.edgeStart() || clicked) {
      this.mode = this.modeIndex === 0 ? 'cpu' : 'local';
      this.picks = [null, null];
      this.picking = 0;
      this.cursor = 0;
      sfx.ui();
      this.screen = 'select';
    }
  }

  private updateSelect(pointerMoved: boolean): void {
    const hover = CARDS.findIndex((card) => pointIn(this.device.point, card));
    if (pointerMoved && hover >= 0) this.cursor = hover;
    if (this.edgeHoriz(-1)) this.cursor = (this.cursor + 2) % 3;
    if (this.edgeHoriz(1)) this.cursor = (this.cursor + 1) % 3;
    if (this.edgeBack()) {
      sfx.ui();
      if (this.picking === 1) {
        this.picking = 0;
        this.picks[1] = null;
        return;
      }
      this.screen = 'mode';
      return;
    }
    const clicked = this.device.click && hover >= 0;
    if (this.edgeStart() || clicked) {
      const id = FIGHTER_IDS[this.cursor];
      this.picks[this.picking] = id;
      sfx.ui();
      if (this.picking === 0) {
        this.picking = 1;
        this.cursor = (this.cursor + 1) % 3;
        return;
      }
      this.startMatch();
    }
  }

  private updateFight(dt: number): void {
    const match = this.match;
    if (!match) return;
    if (import.meta.env.DEV && this.device.edge('F8')) this.forceResult();
    if (this.takeResult(dt)) return;

    if (this.device.edge('Escape') && match.intro <= 0) {
      this.paused = !this.paused;
      sfx.ui();
    }
    if (this.paused) {
      if (this.device.edge('Enter')) this.paused = false;
      if (this.device.edge('Backspace')) this.leaveMatch(false);
      return;
    }

    const before = {
      damage: [match.fighters[0].damage, match.fighters[1].damage] as [number, number],
      stocks: [match.fighters[0].stocks, match.fighters[1].stocks] as [number, number],
    };
    stepMatch(match, dt, [this.intent(0), this.intent(1)]);
    if (match.fighters[0].damage > before.damage[0] || match.fighters[1].damage > before.damage[1]) {
      sfx.hit();
    }
    if (match.fighters[0].stocks < before.stocks[0] || match.fighters[1].stocks < before.stocks[1]) {
      sfx.ko();
    }
    this.takeResult(dt);
  }

  private takeResult(dt: number): boolean {
    if (!this.rematchState()?.canRematch) {
      this.resultAge = 0;
      this.resultHover = null;
      return false;
    }
    this.paused = false;
    this.resultAge += dt;
    this.resultHover = resultTarget(this.device.point, this.resultAge);
    const choice = chooseResult({
      confirm: rematchPressed((code) => this.device.edge(code)),
      back: this.edgeBack(),
      quitKey: quitPressed((code) => this.device.edge(code)),
      click: this.device.click ? this.resultHover : null,
    });
    if (choice) this.applyResult(choice);
    return true;
  }

  /** Snapshot Elena can bind. Null on the menus. */
  rematchState(): RematchState | null {
    return this.match ? readRematchState(this.match) : null;
  }

  /**
   * Rematch entry. Resets stocks, percent, and positions on this match,
   * and drains any KO records still sitting in koLog.
   */
  requestRematch(options: MatchOptions = {}): boolean {
    if (!this.match) return false;
    const accepted = applyRematch(this.match, {
      seed: options.seed ?? ((Date.now() ^ (this.cursor * 97)) >>> 0),
      intro: options.intro ?? 0.4,
    });
    if (!accepted) return false;
    this.paused = false;
    this.resultAge = 0;
    this.resultHover = null;
    return true;
  }

  private leaveMatch(clearPicks: boolean): void {
    if (this.match) drainKoLog(this.match);
    this.paused = false;
    this.match = null;
    this.resultAge = 0;
    this.resultHover = null;
    this.picking = 0;
    this.picks = clearPicks ? [null, null] : [this.picks[0], null];
    this.screen = 'select';
  }

  private startMatch(options: MatchOptions = {}): void {
    const p1 = this.picks[0] ?? 'elon';
    const p2 = this.picks[1] ?? 'sam';
    // Opening round only. A rematch calls requestRematch and stays on this match.
    this.match = createMatch([p1, p2], ['human', this.mode === 'cpu' ? 'cpu' : 'human'], {
      seed: (Date.now() ^ (this.cursor * 97)) >>> 0,
      ...options,
    });
    this.paused = false;
    this.resultAge = 0;
    this.resultHover = null;
    this.screen = 'fight';
  }

  private applyResult(choice: ResultChoice): void {
    sfx.ui();
    if (choice === 'rematch') {
      this.requestRematch();
      return;
    }
    if (choice === 'change') {
      this.leaveMatch(true);
      return;
    }
    if (this.match) drainKoLog(this.match);
    this.paused = false;
    this.match = null;
    this.resultAge = 0;
    this.resultHover = null;
    this.picking = 0;
    this.picks = [null, null];
    this.cursor = 0;
    this.screen = 'title';
  }

  /** Dev only. Opens the card by setting the match-over flag. Does not touch stocks, percent, or koLog. */
  private forceResult(): void {
    const match = this.match;
    if (!match || match.winner !== null || match.draw) return;
    match.hitstop = 0;
    match.draw = false;
    match.winner = match.fighters[0].stocks > 0 ? 0 : 1;
  }

  private armResultPreview(): void {
    if (!import.meta.env.DEV || typeof location === 'undefined') return;
    if (new URLSearchParams(location.search).get('results') !== '1') return;
    this.mode = 'cpu';
    this.picks = ['elon', 'dario'];
    this.startMatch({ intro: 0 });
    this.forceResult();
  }

  private resultView(): ResultOverlay {
    const match = this.match;
    const live = this.rematchState();
    const plates: [ResultPlate, ResultPlate] = match
      ? [this.plate(match, 0), this.plate(match, 1)]
      : [blankPlate(), blankPlate()];
    const winner = live?.winner ?? null;
    const winnerPlate = winner === null ? null : plates[winner];
    return {
      draw: live?.draw ?? false,
      winnerName: match && winner !== null ? ROSTER[match.fighters[winner].id].name : null,
      winnerTag: winnerPlate?.tag ?? null,
      winnerAccent: winnerPlate?.accent ?? '#F0C7A4',
      plates,
      hover: this.resultHover,
      age: this.resultAge,
    };
  }

  /** Card numbers come from the live fighter. `koLog` stays Owen's log and is not copied here. */
  private plate(match: MatchState, slot: 0 | 1): ResultPlate {
    const fighter = match.fighters[slot];
    const def = ROSTER[fighter.id];
    return {
      tag: match.control[slot] === 'cpu' ? 'CPU' : slot === 0 ? 'P1' : 'P2',
      name: def.short.toUpperCase(),
      damage: fighter.damage,
      stocks: fighter.stocks,
      accent: def.accent,
      won: match.winner === slot,
    };
  }

  private intent(slot: 0 | 1): Intent {
    const bind = slot === 0 ? P1_BIND : P2_BIND;
    const left = this.device.held(bind.left);
    const right = this.device.held(bind.right);
    const up = this.device.heldAny(bind.up);
    const down = this.device.held(bind.down);
    const x = (right ? 1 : 0) - (left ? 1 : 0);
    const y = (down ? 1 : 0) - (up ? 1 : 0);
    return {
      x: x < 0 ? -1 : x > 0 ? 1 : 0,
      y: y < 0 ? -1 : y > 0 ? 1 : 0,
      jumpHeld: this.device.heldAny(bind.jump),
      jumpEdge: this.device.edgeAny(bind.jump),
      attackEdge: this.device.edgeAny(bind.attack),
      attackHeld: this.device.heldAny(bind.attack),
      grabEdge: this.device.edgeAny(bind.grab),
      dodgeEdge: this.device.edgeAny(bind.dodge),
    };
  }

  private edgeStart(): boolean {
    return this.device.edge('Enter') || this.device.edge('KeyJ') || this.device.edge('KeyK');
  }

  private edgeBack(): boolean {
    return this.device.edge('Escape') || this.device.edge('Backspace');
  }

  private edgeHoriz(dir: -1 | 1): boolean {
    if (dir < 0) return this.device.edge('KeyA') || this.device.edge('ArrowLeft');
    return this.device.edge('KeyD') || this.device.edge('ArrowRight');
  }

  private edgeVert(dir: -1 | 1): boolean {
    if (dir < 0) return this.device.edge('KeyW') || this.device.edge('ArrowUp');
    return this.device.edge('KeyS') || this.device.edge('ArrowDown');
  }

  private draw(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, VIEW.w, VIEW.h);
    const hoverStart = pointIn(this.device.point, START_BUTTON);

    if (this.screen === 'title') drawTitle(ctx, this.uiTime, hoverStart);
    else if (this.screen === 'mode') drawMode(ctx, this.uiTime, this.modeIndex);
    else if (this.screen === 'select') {
      drawSelect(ctx, this.uiTime, this.cursor, this.picks, this.mode, this.picking);
    } else if (this.match) {
      drawMatch(ctx, this.match);
      const live = this.rematchState();
      if (this.paused && !live?.over) drawPause(ctx);
      if (live?.canRematch) drawResultOverlay(ctx, this.resultView());
    }

    if (this.screen === 'fight' && this.match) bindHud(this.hud, this.match);
    else clearHud(this.hud);
  }
}

function blankPlate(): ResultPlate {
  return { tag: '', name: '', damage: 0, stocks: 0, accent: '#F0C7A4', won: false };
}
