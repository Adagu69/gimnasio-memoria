// juegos.js — lista accesible de juegos ("Ver como lista"): mejor marca y sesiones de cada uno.
import { $ } from '../ui.js';
import { store } from '../store.js';

/** Mejor marca de cada juego, en texto. */
export function bestOf(game) {
  const s = store.byGame(game);
  if (!s.length) return '–';
  if (game === 'pares') return String(Math.max(...s.map(x => x.level)));
  if (game === 'secuencia') return String(Math.max(...s.map(x => x.span)));
  if (game === 'nback') return Math.max(...s.map(x => x.acc)) + '%';
  return Math.max(...s.map(x => x.loci)) + ' lugares';
}

export function renderJuegos() {
  for (const g of ['pares', 'secuencia', 'nback', 'palacio']) {
    $(`#h-${g}-n`).textContent = store.byGame(g).length;
    $(`#h-${g}-best`).textContent = bestOf(g);
  }
}
