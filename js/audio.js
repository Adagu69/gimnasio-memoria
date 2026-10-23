// audio.js — tonos sintetizados con Web Audio API (sin archivos de sonido).
import { store } from './store.js';

let ctx = null;

function gainValue() {
  const s = store.settings;
  if (!s.sound) return 0;
  return 0.25 * (s.volume / 100);
}

export function tone(freq, ms, type = 'sine') {
  const g0 = gainValue();
  if (g0 <= 0) return;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(g0, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + ms / 1000 + 0.02);
  } catch (e) { /* sin audio */ }
}

export const sfx = {
  tap: () => tone(520, 70),
  ok: () => { tone(660, 120); setTimeout(() => tone(880, 160), 110); },
  bad: () => tone(180, 260, 'square'),
  win: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 160), i * 110)); },
  tick: () => tone(440, 60)
};

// Escala pentatónica para los 9 bloques de Secuencia
export const BLOCK_FREQ = [262, 294, 330, 392, 440, 523, 587, 659, 784];
