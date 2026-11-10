// juegos.js — biblioteca de juegos: resumen por juego (mejor marca y sesiones).
import { $ } from '../ui.js';
import { store } from '../store.js';

export function renderJuegos() {
  const p = store.byGame('pares'), s = store.byGame('secuencia'), n = store.byGame('nback');
  $('#h-pares-n').textContent = p.length; $('#h-pares-best').textContent = p.length ? Math.max(...p.map(x => x.level)) : '–';
  $('#h-secuencia-n').textContent = s.length; $('#h-secuencia-best').textContent = s.length ? Math.max(...s.map(x => x.span)) : '–';
  $('#h-nback-n').textContent = n.length; $('#h-nback-best').textContent = n.length ? Math.max(...n.map(x => x.acc)) + '%' : '–';
}
