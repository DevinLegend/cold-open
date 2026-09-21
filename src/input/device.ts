// Lane: input. Window keys plus canvas pointer, in 1280×720 space.

import { VIEW } from '../stage/layout.ts';

const BLOCKED = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export class Device {
  private readonly down = new Set<string>();
  private readonly edges = new Set<string>();
  private pointer = { x: -1, y: -1 };
  private clicked = false;
  private pointerMoved = false;
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
  }

  held(code: string): boolean {
    return this.down.has(code);
  }

  edge(code: string): boolean {
    return this.edges.has(code);
  }

  edgeAny(codes: readonly string[]): boolean {
    return codes.some((code) => this.edges.has(code));
  }

  heldAny(codes: readonly string[]): boolean {
    return codes.some((code) => this.down.has(code));
  }

  get click(): boolean {
    return this.clicked;
  }

  get point(): { x: number; y: number } {
    return this.pointer;
  }

  /** True once per pointer move or click, so a resting cursor does not override the keyboard. */
  consumePointerMove(): boolean {
    const moved = this.pointerMoved;
    this.pointerMoved = false;
    return moved;
  }

  endFrame(): void {
    this.edges.clear();
    this.clicked = false;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    if (BLOCKED.has(event.code)) event.preventDefault();
    this.down.add(event.code);
    this.edges.add(event.code);
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    this.down.delete(event.code);
  };

  private onBlur = (): void => {
    this.down.clear();
  };

  private onPointerDown = (event: PointerEvent): void => {
    this.track(event);
    this.clicked = true;
    this.canvas.focus();
  };

  private onPointerMove = (event: PointerEvent): void => {
    this.track(event);
  };

  private track(event: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.pointer = {
      x: ((event.clientX - rect.left) / rect.width) * VIEW.w,
      y: ((event.clientY - rect.top) / rect.height) * VIEW.h,
    };
    this.pointerMoved = true;
  }
}

export function pointIn(
  point: { x: number; y: number },
  rect: { x: number; y: number; w: number; h: number },
): boolean {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}
