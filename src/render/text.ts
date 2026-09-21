// Lane: presentation.

export const FONT = '"Trebuchet MS", "Segoe UI", "Liberation Sans", "DejaVu Sans", sans-serif';

export function setFont(ctx: CanvasRenderingContext2D, size: number, weight = 700): void {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textBaseline = 'middle';
}

export function damageColor(damage: number): string {
  if (damage < 40) return '#F4EDE4';
  if (damage < 80) return '#F0C14A';
  if (damage < 140) return '#F08848';
  return '#FF5A4A';
}
