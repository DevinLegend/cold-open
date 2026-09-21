import type { Spark } from './types.ts';

export function burst(
  sparks: Spark[],
  x: number,
  y: number,
  color: string,
  count: number,
  speed = 180,
): void {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const mag = speed * (0.45 + Math.random() * 0.7);
    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * mag,
      vy: Math.sin(angle) * mag - 30,
      life: 0.28 + Math.random() * 0.16,
      max: 0.44,
      color,
      r: 1.5 + (i % 3),
    });
  }
}
