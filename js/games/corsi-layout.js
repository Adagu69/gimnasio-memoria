// corsi-layout.js — tablero de Corsi con 9 bloques en posiciones irregulares y fijas.
// La tarea original (Corsi, 1972) usa 9 cubos dispersos sobre un tablero, no una cuadrícula: así se reduce la
// recodificación verbal ("arriba a la izquierda") y se mide la amplitud visoespacial (Berch et al., 1998).
// NOTA: es una disposición irregular inspirada en el tablero original; no reproduce las coordenadas exactas
// publicadas por Kessels et al. (2000), que no se pudieron verificar en esta versión.
// La usan las dos pieles (clásica y Pixel-3D), así que la medida es la misma en ambas.

/** Alto del tablero en unidades de ancho (el tablero es un poco más alto que ancho). */
export const BOARD_ASPECT = 1.1;
/** Lado de cada bloque como fracción del ancho del tablero. */
export const BLOCK_SIZE = 0.16;

/** Centros normalizados (x: fracción del ancho, y: fracción del alto). El índice es el número de bloque. */
export const CORSI_BLOCKS = Object.freeze([
  { x: 0.20, y: 0.14 }, { x: 0.62, y: 0.10 }, { x: 0.86, y: 0.30 },
  { x: 0.42, y: 0.32 }, { x: 0.14, y: 0.50 }, { x: 0.66, y: 0.52 },
  { x: 0.36, y: 0.70 }, { x: 0.84, y: 0.78 }, { x: 0.18, y: 0.88 }
].map(Object.freeze));

/** Rectángulo del bloque i en porcentaje del tablero: { left, top, width, height }. */
export function blockRect(i) {
  const b = CORSI_BLOCKS[i];
  if (!b) throw new RangeError(`corsi-layout: bloque ${i} inexistente`);
  const width = BLOCK_SIZE * 100;
  const height = (BLOCK_SIZE / BOARD_ASPECT) * 100;
  return { left: b.x * 100 - width / 2, top: b.y * 100 - height / 2, width, height };
}
