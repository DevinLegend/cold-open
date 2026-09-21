// Lane: presentation. Short original tones. Nothing sampled.

let audio: AudioContext | null = null;

function context(): AudioContext | null {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audio) audio = new Ctor();
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

export function unlockAudio(): void {
  context();
}

function blip(freq: number, dur: number, type: OscillatorType, gainValue: number): void {
  const ctx = context();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

export const sfx = {
  ui() {
    blip(540, 0.05, 'square', 0.03);
  },
  hit() {
    blip(186, 0.09, 'square', 0.045);
  },
  ko() {
    blip(92, 0.28, 'triangle', 0.06);
  },
};
