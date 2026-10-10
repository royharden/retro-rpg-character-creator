let audioCtx: AudioContext | null = null;
let muted = true;

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  return muted;
}

function getCtx(): AudioContext | null {
  if (muted) return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function blip(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.08) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const sfx = {
  click: () => blip(440, 0.05),
  select: () => blip(660, 0.08),
  start: () => {
    blip(523, 0.1);
    setTimeout(() => blip(659, 0.1), 100);
    setTimeout(() => blip(784, 0.15), 200);
  },
  dice: () => {
    blip(220, 0.03);
    setTimeout(() => blip(330, 0.03), 50);
  },
  success: () => {
    blip(523, 0.08);
    setTimeout(() => blip(784, 0.12), 80);
  },
  error: () => {
    blip(200, 0.15, 'sawtooth', 0.1);
    setTimeout(() => blip(150, 0.2, 'sawtooth', 0.1), 150);
  },
  pip: () => blip(880, 0.03),
  hover: () => blip(1200, 0.02, 'square', 0.04),
};
