// indice.js — Índice de Memoria (IM): una medida 0–100 por área y una global.
// Cada sesión se normaliza: Pares → eficiencia; Secuencia → amplitud/8; N-Back → precisión ponderada por N.
// El índice de un área es el promedio de sus últimas 3 sesiones; el global, el promedio de las áreas entrenadas.
import { store } from './store.js';

export const GAMES = {
  pares: { name: 'Pares', area: 'Memoria visual', color: 'c4', icon: '◆', intro: 'Pon a prueba tu <b>memoria visual a corto plazo</b> recordando dónde está cada símbolo cuando el tablero se tape.', outro: 'Pares ha puesto a prueba tu memoria visual a corto plazo', explain: 'Memorizaste el tablero destapado y luego recuperaste la posición de cada pareja: la codificación y la recuperación del almacén a corto plazo descritas por Atkinson y Shiffrin.' },
  secuencia: { name: 'Secuencia', area: 'Memoria espacial', color: 'c6', icon: '▦', intro: 'Pon a prueba tu <b>memoria espacial</b> repitiendo el orden en que se encienden los bloques.', outro: 'Secuencia ha puesto a prueba tu memoria espacial', explain: 'Repetiste secuencias cada vez más largas: tu amplitud es el número de posiciones que puedes retener en orden, el límite que Miller situó alrededor de 7 ± 2.' },
  nback: { name: 'N-Back', area: 'Memoria de trabajo', color: 'c5', icon: '▣', intro: 'Pon a prueba tu <b>memoria de trabajo</b> avisando cuando una posición se repite respecto a N turnos atrás.', outro: 'N-Back ha puesto a prueba tu memoria de trabajo', explain: 'Mantuviste y actualizaste las últimas posiciones a la vez que respondías: la carga del ejecutivo central del modelo de Baddeley y Hitch.' }
};
export const ORDER = ['pares', 'secuencia', 'nback'];

export function normalize(r) {
  if (!r) return 0;
  if (r.game === 'pares') return Math.min(100, r.eff);
  if (r.game === 'secuencia') return Math.min(100, Math.round(100 * r.span / 8));
  const w = { 1: 0.7, 2: 0.85, 3: 1, 4: 1.1 }[r.n] || 1;
  return Math.min(100, Math.round(r.acc * w));
}

export function areaIndex(game, n = 3) {
  const last = store.byGame(game).slice(-n);
  if (!last.length) return null;
  return Math.round(last.reduce((a, s) => a + normalize(s), 0) / last.length);
}

export function globalIndex() {
  const vals = (store.profile.areas || ORDER).map(g => areaIndex(g)).filter(v => v !== null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Meta a 30 días: subir el índice un porcentaje según la dificultad elegida (objetivo de práctica, no predicción). */
export function goalPct() { return store.profile.difficulty === 'avanzado' ? 35 : 25; }
export function goal(v) { return v === null ? null : Math.min(100, Math.round(v * (1 + goalPct() / 100))); }

/** Texto de referencia para la amplitud (Secuencia). Kessels et al. (2000): adultos sanos, amplitud directa media ≈ 6. */
export function spanReference(span) {
  if (span >= 7) return 'Por encima de la referencia típica de adultos (6).';
  if (span >= 5) return 'Dentro de la referencia típica de adultos (5 a 7).';
  return 'Por debajo de la referencia típica (5 a 7); mejorará con la práctica.';
}
