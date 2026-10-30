// pares.js — minijuego Pares (memoria visual a corto plazo).
// Fase 1: el tablero se muestra destapado unos segundos (codificación).
// Fase 2: se tapa y hay que encontrar las parejas (recuperación).
import { $, fmtTime, setMsg, haptic } from '../ui.js';
import { store } from '../store.js';
import { sfx } from '../audio.js';

export const LEVELS = [[4, 3], [4, 4], [5, 4], [6, 4], [6, 5], [6, 6], [7, 6], [8, 6]]; // columnas × filas
const SYMBOLS = ['●', '■', '▲', '◆', '★', '✚', '⬟', '⬢', '◐', '✦', '▼', '◼', '⬠', '✖', '◯', '⬡', '✱', '◈', '◭', '⬣', '✤', '◔', '⯁', '✿'];
const COLORS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];

let level = 0, first = null, lock = false, moves = 0, matched = 0, total = 0, t0 = 0, timer = null, previewTimer = null;
let onEnd = null;
let board, elLevel, elMoves, elPairs, elTime, elMsg, elStars, bStart, bNext, bRetry, bReset;

export function stars(pairs, mv) {
  const r = mv / pairs;
  return r <= 1.5 ? 3 : r <= 2.2 ? 2 : 1;
}

function deck(pairs) {
  const pool = [];
  for (let i = 0; i < pairs; i++) pool.push({ s: SYMBOLS[i % SYMBOLS.length], c: COLORS[(i + Math.floor(i / SYMBOLS.length)) % COLORS.length] });
  return [...pool, ...pool].sort(() => Math.random() - 0.5);
}

function tick() { elTime.textContent = fmtTime(Math.floor((Date.now() - t0) / 1000)); }

function renderStars(n) {
  elStars.innerHTML = [1, 2, 3].map(i => `<span class="${i <= n ? 'on' : ''}">★</span>`).join('');
}

function build() {
  clearInterval(timer); clearTimeout(previewTimer);
  const [cols, rows] = LEVELS[level];
  total = cols * rows / 2; matched = 0; moves = 0; first = null; lock = true;
  elLevel.textContent = level + 1; elMoves.textContent = 0; elPairs.textContent = '0/' + total; elTime.textContent = '0:00';
  renderStars(0);
  bNext.hidden = true; bRetry.hidden = true; bStart.hidden = true;
  board.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  board.innerHTML = '';
  deck(total).forEach((d, i) => {
    const b = document.createElement('button');
    b.className = 'cardp open'; b.dataset.s = d.s; b.setAttribute('aria-label', 'Carta ' + (i + 1));
    b.innerHTML = `<span class="face back"></span><span class="face front" style="color:var(--${d.c})">${d.s}</span>`;
    b.addEventListener('click', () => flip(b));
    board.appendChild(b);
  });
  // Fase de memorización
  const previewMs = 1500 + total * 150;
  board.classList.add('preview');
  setMsg(elMsg, `Memoriza el tablero… ${Math.round(previewMs / 1000)} s`, 'warn');
  let left = Math.round(previewMs / 1000);
  const cd = setInterval(() => { left--; if (left > 0) setMsg(elMsg, `Memoriza el tablero… ${left} s`, 'warn'); }, 1000);
  previewTimer = setTimeout(() => {
    clearInterval(cd);
    board.classList.remove('preview');
    board.querySelectorAll('.cardp').forEach(c => c.classList.remove('open'));
    lock = false;
    setMsg(elMsg, 'Encuentra las parejas.');
    t0 = Date.now(); timer = setInterval(tick, 500);
  }, previewMs);
}

function flip(b) {
  if (lock || b.classList.contains('open') || b.classList.contains('done')) return;
  b.classList.add('open'); sfx.tap();
  if (!first) { first = b; return; }
  moves++; elMoves.textContent = moves; lock = true;
  const a = first; first = null;
  if (a.dataset.s === b.dataset.s) {
    setTimeout(() => {
      a.classList.add('done'); b.classList.add('done'); lock = false; matched++;
      elPairs.textContent = matched + '/' + total; sfx.ok(); haptic(10);
      if (matched === total) win();
    }, 250);
  } else {
    setTimeout(() => { a.classList.remove('open'); b.classList.remove('open'); lock = false; }, 700);
  }
}

function win() {
  clearInterval(timer);
  const secs = Math.floor((Date.now() - t0) / 1000);
  const eff = Math.min(100, Math.round(100 * total / moves));
  const st = stars(total, moves);
  renderStars(st); sfx.win(); haptic([15, 60, 30]);
  setMsg(elMsg, `Nivel ${level + 1} completado: ${moves} intentos en ${fmtTime(secs)} (eficiencia ${eff}%).`, 'ok');
  const result = { game: 'pares', level: level + 1, moves, secs, eff, stars: st };
  store.addSession(result);
  // desbloquea el siguiente nivel como nivel de inicio
  if (level + 2 > store.settings.paresLevel && level < LEVELS.length - 1) store.setSetting('paresLevel', level + 2);
  if (level < LEVELS.length - 1) bNext.hidden = false; else setMsg(elMsg, elMsg.textContent + ' Has completado todos los niveles.', 'ok');
  bRetry.hidden = false;
  if (onEnd) { const cb = onEnd; onEnd = null; cb(result); }
}

export const pares = {
  init() {
    board = $('#p-board'); elLevel = $('#p-level'); elMoves = $('#p-moves'); elPairs = $('#p-pairs'); elTime = $('#p-time');
    elMsg = $('#p-msg'); elStars = $('#p-stars'); bStart = $('#p-start'); bNext = $('#p-next'); bRetry = $('#p-retry'); bReset = $('#p-reset');
    bStart.addEventListener('click', () => { level = Math.min(store.settings.paresLevel - 1, LEVELS.length - 1); build(); });
    bNext.addEventListener('click', () => { level = Math.min(level + 1, LEVELS.length - 1); build(); });
    bRetry.addEventListener('click', build);
    bReset.addEventListener('click', () => { level = 0; build(); });
    this.idle();
  },
  /** Tablero de ejemplo en reposo (antes de empezar). */
  idle() {
    clearInterval(timer); clearTimeout(previewTimer);
    level = Math.min(store.settings.paresLevel - 1, LEVELS.length - 1);
    const [cols, rows] = LEVELS[level];
    board.classList.remove('preview');
    board.style.gridTemplateColumns = `repeat(${cols},1fr)`;
    board.innerHTML = '';
    for (let i = 0; i < cols * rows; i++) {
      const b = document.createElement('button'); b.className = 'cardp'; b.disabled = true; b.tabIndex = -1;
      b.innerHTML = '<span class="face back"></span><span class="face front"></span>'; board.appendChild(b);
    }
    elLevel.textContent = level + 1; elMoves.textContent = 0; elPairs.textContent = '0/' + (cols * rows / 2); elTime.textContent = '0:00';
    renderStars(0); setMsg(elMsg, `Pulsa Empezar. Nivel ${level + 1}: ${cols}×${rows}.`);
    bStart.hidden = false; bNext.hidden = true; bRetry.hidden = true;
  },
  /** Inicio programático (rutina). */
  start({ onEnd: cb } = {}) {
    onEnd = cb || null;
    level = Math.min(store.settings.paresLevel - 1, LEVELS.length - 1);
    build();
  },
  stop() { clearInterval(timer); clearTimeout(previewTimer); onEnd = null; }
};
