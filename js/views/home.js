// home.js — vista de inicio: saludo, resumen por juego y racha.
import { $ } from '../ui.js';
import { store } from '../store.js';

export function renderHome() {
  const p = store.byGame('pares'), s = store.byGame('secuencia'), n = store.byGame('nback');
  const name = store.profile.name;
  $('#home-greet').textContent = name ? `Hola, ${name}` : 'Hola';
  $('#h-pares-n').textContent = p.length; $('#h-pares-best').textContent = p.length ? Math.max(...p.map(x => x.level)) : '–';
  $('#h-secuencia-n').textContent = s.length; $('#h-secuencia-best').textContent = s.length ? Math.max(...s.map(x => x.span)) : '–';
  $('#h-nback-n').textContent = n.length; $('#h-nback-best').textContent = n.length ? Math.max(...n.map(x => x.acc)) + '%' : '–';
  const st = store.streak();
  const el = $('#home-streak');
  el.hidden = st === 0;
  el.textContent = st === 1 ? '🔥 1 día de racha' : `🔥 ${st} días de racha`;
}
