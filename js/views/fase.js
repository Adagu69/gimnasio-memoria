// fase.js — banner de fase común a los 4 juegos: OBSERVA (codificación) → TU TURNO (recuperación) → RESULTADO.
// La señal es idéntica en todos los juegos y siempre está en el mismo lugar: separa codificación y recuperación
// (Atkinson y Shiffrin, 1968) sin que haya que leer instrucciones (menos carga extrínseca; Sweller, 1988).
// Se deriva del DOM de cada juego con MutationObserver: la lógica de los juegos no cambia.
import { $ } from '../ui.js';

const EYE = ['..####..', '.#....#.', '#..##..#', '#..##..#', '.#....#.', '..####..'];
const HAND = ['...#....', '...#....', '...####.', '.#.#####', '.#######', '.#######', '..######', '...####.'];
const FLAG = ['##......', '#####...', '#######.', '#####...', '##......', '#.......', '#.......', '#.......'];
const DOT = ['..##..', '.####.', '######', '######', '.####.', '..##..'];

function pixelSvg(rows) {
  const w = rows[0].length, h = rows.length;
  const rects = rows.flatMap((r, y) => [...r].map((c, x) => (c === '#' ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : ''))).join('');
  return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

const PHASES = {
  idle: { icon: DOT, title: 'Listo', sub: 'Pulsa Empezar cuando quieras' },
  observa: { icon: EYE, title: 'Observa', sub: 'Memoriza. Todavía no toques nada' },
  turno: { icon: HAND, title: 'Tu turno', sub: 'Responde ahora' },
  atento: { icon: EYE, title: 'Atento', sub: 'Pulsa Coincide si la posición se repite' },
  feedback: { icon: DOT, title: '', sub: '' },
  fin: { icon: FLAG, title: 'Resultado', sub: 'Mira cómo te fue' }
};

function makeBanner(game) {
  const el = document.createElement('div');
  el.className = 'phase';
  el.id = 'fase-' + game;
  el.dataset.phase = 'idle';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = '<span class="ph-ico"></span><span class="ph-txt"><b></b><small></small></span>' +
    '<svg class="ph-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15"/></svg>';
  return el;
}

function render(el, phase, { title, sub, ringMs } = {}) {
  const def = PHASES[phase] || PHASES.idle;
  const t = title || def.title, s = sub ?? def.sub;
  if (el.dataset.phase === phase && el.dataset.title === t && el.dataset.sub === s && !ringMs) return;
  el.dataset.phase = phase; el.dataset.title = t; el.dataset.sub = s;
  el.querySelector('.ph-ico').innerHTML = pixelSvg(def.icon);
  el.querySelector('b').textContent = t;
  el.querySelector('small').textContent = s;
  const ring = el.querySelector('.ph-ring');
  ring.classList.remove('run');
  if (ringMs) { ring.style.setProperty('--ring-ms', ringMs + 'ms'); void ring.getBoundingClientRect(); ring.classList.add('run'); }
}

/** Inserta el banner en la tarjeta del juego, justo después de la cabecera. */
function mount(game) {
  const card = $(`#v-${game} .card`);
  const head = card && card.querySelector('.ghead');
  if (!head) return null;
  const el = makeBanner(game);
  head.after(el);
  return el;
}

function watch(targets, fn) {
  const mo = new MutationObserver(fn);
  targets.forEach(([node, opts]) => node && mo.observe(node, opts));
  fn();
}

const ATTR = { attributes: true, attributeFilter: ['class', 'hidden'] };
const TEXT = { childList: true, characterData: true, subtree: true };

export function initFases({ paresPreviewMs }) {
  // Pares: tablero destapado (.preview) = OBSERVA, con anillo de cuenta atrás igual a la vista previa.
  const pb = mount('pares');
  watch([[$('#p-board'), { attributes: true, attributeFilter: ['class'] }], [$('#p-msg'), ATTR], [$('#p-start'), ATTR]], () => {
    const board = $('#p-board');
    if (board.classList.contains('preview')) {
      const total = board.querySelectorAll('.cardp').length / 2;
      render(pb, 'observa', { ringMs: paresPreviewMs(total) });
    } else if ($('#p-msg').classList.contains('ok')) render(pb, 'fin');
    else if ($('#p-start').hidden) render(pb, 'turno', { sub: 'Voltea dos cartas por intento' });
    else render(pb, 'idle');
  });

  // Secuencia: el estado ya lo publica #s-state.
  const sb = mount('secuencia');
  watch([[$('#s-state'), TEXT]], () => {
    const s = $('#s-state').textContent.trim();
    if (s === 'Observa') render(sb, 'observa', { sub: 'Mira el orden en que se encienden' });
    else if (s === 'Tu turno') render(sb, 'turno', { sub: $('#s-mode [aria-pressed="true"]')?.dataset.mode === 'inverso' ? 'Toca los bloques al revés' : 'Toca los bloques en el mismo orden' });
    else if (s === 'Fin') render(sb, 'fin');
    else if (s === 'Listo') render(sb, 'idle');
    else render(sb, 'feedback', { title: s, sub: '' });
  });

  // N-Back: durante la serie se observa y se responde a la vez.
  const nb = mount('nback');
  watch([[$('#n-start'), TEXT], [$('#n-reco'), ATTR]], () => {
    if ($('#n-start').textContent.trim() === 'Detener') render(nb, 'atento', { sub: `Pulsa Coincide si la posición es la de hace ${$('#n-seg [aria-pressed="true"]')?.dataset.n || 'N'} turnos` });
    else if (!$('#n-reco').hidden) render(nb, 'fin');
    else render(nb, 'idle');
  });

  // Palacio: #mp-stage[data-phase].
  const mb = mount('palacio');
  watch([[$('#mp-stage'), { attributes: true, attributeFilter: ['data-phase'] }]], () => {
    const p = $('#mp-stage').dataset.phase || 'idle';
    if (p === 'observa') render(mb, 'observa', { sub: 'Recorre la habitación y fíjate en cada objeto' });
    else if (p === 'turno') render(mb, 'turno', { sub: 'Elige qué objeto había en cada lugar' });
    else render(mb, p === 'fin' ? 'fin' : 'idle');
  });
}
