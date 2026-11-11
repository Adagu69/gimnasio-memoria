// rng.js — números pseudoaleatorios deterministas (mulberry32) a partir de una semilla.
// Se usa para que la física decorativa y los ensayos generados en pruebas sean reproducibles.

/** Convierte cualquier semilla (número o texto) en un entero de 32 bits sin signo. */
export function hashSeed(seed) {
  if (typeof seed === 'number' && Number.isFinite(seed)) return seed >>> 0;
  let h = 2166136261;
  for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Devuelve una función que produce números en [0, 1) siempre en el mismo orden para la misma semilla. */
export function seeded(seed) {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Baraja una copia del arreglo con el generador dado (Fisher–Yates). No modifica el original. */
export function shuffled(arr, rnd = Math.random) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
