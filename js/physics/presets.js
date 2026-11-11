// presets.js — definiciones puras de qué cae en cada lugar (sin DOM ni Matter).
// Cada función devuelve "specs" de cuerpos: { id, kind, x, y, w, h, shape?, data? } en píxeles,
// con y hacia abajo (convención de Matter). Las variaciones usan semillas: mismo dato → misma escena.
import { seeded } from './rng.js';

/** Torre de constancia: contenedor de 2 columnas; la marca de meta está en 30 bloques (plan de 30 días). */
export const TOWER = Object.freeze({ width: 60, height: 440, block: 26, goal: 30 });

/** Tamaño del objeto que cae en la tarjeta de resultado, por tipo. */
const RESULT_KIND = Object.freeze({
  pares: { kind: 'star', size: 34, shape: 'rect' },
  secuencia: { kind: 'block', size: 28, shape: 'rect' },
  nback: { kind: 'token', size: 30, shape: 'circle' },
  palacio: { kind: 'obj', size: 32, shape: 'rect' }
});

/** Cuántos objetos representan la métrica de cada juego (estrellas, amplitud, N, aciertos). */
export function metricCount(game, r = {}) {
  const v = { pares: r.stars, secuencia: r.span, nback: r.n, palacio: r.correct }[game];
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

/**
 * Bloques de la torre: uno por sesión diaria (máximo los últimos TOWER.goal), alternando columnas.
 * @param {Array<{day:string, score?:number}>} routines
 */
export function towerSpecs(routines, { width = TOWER.width, block = TOWER.block } = {}) {
  const days = routines.slice(-TOWER.goal);
  return days.map((r, k) => {
    const rnd = seeded('torre-' + r.day);
    const side = k % 2 === 0 ? -1 : 1;
    return {
      id: 'd-' + r.day,
      kind: 'day',
      x: width / 2 + side * (block / 2 + 2) + (rnd() - 0.5) * 2,
      y: -(k + 1) * (block + 8),
      w: block, h: block,
      data: { day: r.day, score: r.score ?? 0 }
    };
  });
}

/** Objetos de la métrica que caen en la tarjeta de resultado. */
export function resultSpecs(game, r, { width, height }) {
  const def = RESULT_KIND[game];
  const n = metricCount(game, r);
  if (!def || !n) return [];
  const rnd = seeded(`${game}-${r.t || 0}-${n}`);
  const size = Math.min(def.size, Math.max(14, height / 3));
  const usable = Math.max(size, width - size * 2);
  return Array.from({ length: n }, (_, k) => ({
    id: `${game}-${k}`,
    kind: def.kind,
    shape: def.shape,
    x: size + (n === 1 ? usable / 2 : (usable * k) / (n - 1)) * 0.6 + usable * 0.2 + (rnd() - 0.5) * size * 0.4,
    y: -size * (1 + k * 0.9) - rnd() * size,
    w: size, h: size,
    angle: (rnd() - 0.5) * 0.6,
    data: { index: k }
  }));
}

/** Lado del bloque de las columnas: caben 10 apilados y no ocupa más de la mitad de la columna. */
function columnBlock(n, { width, height }) {
  return Math.max(8, Math.min((width / n) * 0.55, height / 11));
}

/**
 * Un tubo estrecho por columna (2 paredes, apenas 1,2 bloques de hueco): los bloques se apilan como una
 * barra y las áreas se comparan de un vistazo.
 */
export function columnWalls(n, size) {
  const colW = size.width / n, block = columnBlock(n, size), half = block * 0.6 + 2;
  return Array.from({ length: n }, (_, k) => {
    const cx = colW * (k + 0.5);
    return [-1, 1].map(s => ({ x: cx + s * half, y: size.height / 2, w: 4, h: size.height * 3 }));
  }).flat();
}

/**
 * Columnas de bloques por área: 1 bloque cada 10 puntos (0–10 bloques).
 * @param {Array<[string, number]>} entries  [[área, puntaje 0-100], ...]
 */
export function columnSpecs(entries, { width, height }) {
  const n = entries.length || 1;
  const colW = width / n;
  const block = columnBlock(n, { width, height });
  return entries.flatMap(([area, score], c) => {
    const count = Math.max(0, Math.min(10, Math.round((score || 0) / 10)));
    const rnd = seeded('col-' + area);
    return Array.from({ length: count }, (_, k) => ({
      id: `${area}-${k}`,
      kind: 'col',
      x: colW * (c + 0.5) + (rnd() - 0.5) * 2,
      y: -(k + 1) * (block + 6),
      w: block, h: block,
      data: { area, index: k }
    }));
  });
}
