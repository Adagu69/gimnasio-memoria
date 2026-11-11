// tween.js — interpolaciones mínimas e interrumpibles para la capa 3D.
// Una interpolación con la misma `key` cancela la anterior: la nueva parte del valor actual (sin saltos).
// Con prefers-reduced-motion todas son instantáneas (cortes en lugar de movimiento).

const active = new Set();
let wake = () => {};

/** El motor registra aquí cómo despertarse cuando aparece una interpolación nueva. */
export function setWake(fn) { wake = typeof fn === 'function' ? fn : () => {}; }

export const ease = {
  linear: t => t,
  outCubic: t => 1 - (1 - t) ** 3,
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; }
};

export const lerp = (a, b, t) => a + (b - a) * t;

export function reducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}

/**
 * Inicia una interpolación. `update(k)` recibe el progreso ya suavizado (0 → 1).
 * @param {{ ms?:number, delay?:number, ease?:(t:number)=>number, update:(k:number)=>void, done?:()=>void, key?:any }} o
 */
export function tween({ ms = 200, delay = 0, ease: fn = ease.outCubic, update, done, key }) {
  if (key !== undefined) cancel(key);
  const instant = ms <= 0 || reducedMotion();
  if (instant && delay <= 0) { update(1); if (done) done(); return null; }
  const tw = { start: performance.now() + (instant ? 0 : delay), ms: instant ? 0 : ms, fn, update, done, key };
  active.add(tw);
  wake();
  return tw;
}

/** Descarta todas las interpolaciones (al desmontar una escena no deben correr en la siguiente). */
export function clearTweens() { active.clear(); }

export function cancel(key) {
  for (const tw of active) if (tw.key === key) active.delete(tw);
}

/** Avanza todas las interpolaciones; devuelve true si queda alguna activa. */
export function updateTweens(now) {
  for (const tw of [...active]) {
    if (now < tw.start) continue;
    const p = tw.ms ? Math.min(1, (now - tw.start) / tw.ms) : 1;
    tw.update(tw.fn(p));
    if (p >= 1) { active.delete(tw); if (tw.done) tw.done(); }
  }
  return active.size > 0;
}
