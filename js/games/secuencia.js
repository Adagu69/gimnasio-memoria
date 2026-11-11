// secuencia.js — minijuego Secuencia (tarea de bloques de Corsi).
// Modo directo: repetir el orden mostrado. Modo inverso: repetirlo al revés.
// Dos intentos por longitud; la amplitud (span) es la última longitud superada.
import { $, $$, setMsg, enter, haptic } from '../ui.js';
import { store } from '../store.js';
import { tone, sfx, BLOCK_FREQ } from '../audio.js';
import { blockRect } from './corsi-layout.js';

const START_LEN = 3, MAX_LEN = 9;
let blocks = [], seq = [], expected = [], pos = 0, len = START_LEN, span = 0, tries = 0, input = false, timers = [];
let mode = 'directo', onEnd = null;
let grid, elLen, elSpan, elState, elMsg, elTries, bStart, segMode;

function set(state, msg, cls) { elState.textContent = state; if (msg !== undefined) setMsg(elMsg, msg, cls); }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

function abort() {
  clearTimers(); input = false;
  blocks.forEach(b => { b.disabled = true; b.className = 'block'; });
  $$('button', segMode).forEach(b => b.disabled = false);
  elTries.hidden = true;
}

function start() {
  abort(); len = START_LEN; span = 0; tries = 0;
  elSpan.textContent = 0;
  $$('button', segMode).forEach(b => b.disabled = true);
  bStart.textContent = 'Reiniciar';
  next();
}

function next() {
  elLen.textContent = len; seq = []; let last = -1;
  for (let i = 0; i < len; i++) { let r; do { r = Math.floor(Math.random() * 9); } while (r === last); seq.push(r); last = r; }
  expected = mode === 'inverso' ? [...seq].reverse() : seq;
  elTries.hidden = false; elTries.textContent = tries === 0 ? 'Intento 1 de 2' : 'Intento 2 de 2'; elTries.className = 'pill ' + (tries ? 'warn' : ''); enter(elTries);
  show();
}

function show() {
  input = false; set('Observa', 'Memoriza el orden…'); blocks.forEach(b => b.disabled = true);
  const on = Math.max(380, 700 - len * 35), gap = 220; let t = 500;
  seq.forEach(i => {
    timers.push(setTimeout(() => { blocks[i].classList.add('lit'); tone(BLOCK_FREQ[i], on * 0.9); }, t));
    timers.push(setTimeout(() => { blocks[i].classList.remove('lit'); }, t + on));
    t += on + gap;
  });
  timers.push(setTimeout(() => {
    input = true; pos = 0; blocks.forEach(b => b.disabled = false);
    set('Tu turno', mode === 'inverso' ? 'Repite la secuencia al revés.' : 'Repite la secuencia.');
  }, t + 150));
}

function tap(i) {
  if (!input) return;
  const b = blocks[i];
  if (expected[pos] === i) {
    b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 180); pos++;
    if (pos === expected.length) {
      input = false; span = len; tries = 0; elSpan.textContent = span; blocks.forEach(x => x.disabled = true); sfx.ok(); haptic(10);
      if (len >= MAX_LEN) { finish('Has llegado al máximo de ' + MAX_LEN + ' bloques.'); return; }
      set('Correcto', `Bien. Siguiente: ${len + 1} bloques.`, 'ok'); len++;
      timers.push(setTimeout(next, 1100));
    }
  } else {
    input = false; b.classList.add('miss'); blocks.forEach(x => x.disabled = true); sfx.bad(); haptic([20, 40, 20]);
    timers.push(setTimeout(() => b.classList.remove('miss'), 500));
    if (tries === 0) {
      tries = 1; set('Casi', `Error en el bloque ${pos + 1}. Otra oportunidad con ${len} bloques.`, 'warn');
      timers.push(setTimeout(next, 1300));
    } else {
      finish(`Error en el bloque ${pos + 1}.`);
    }
  }
}

function finish(reason) {
  const result = { game: 'secuencia', mode, span, failedAt: len };
  store.addSession(result);
  set('Fin', `${reason} Amplitud lograda: ${span} (${mode}). Pulsa Empezar para repetir.`, span >= 6 ? 'ok' : 'bad');
  $$('button', segMode).forEach(b => b.disabled = false);
  elTries.hidden = true; bStart.textContent = 'Empezar';
  if (onEnd) { const cb = onEnd; onEnd = null; cb(result); }
}

export const secuencia = {
  init() {
    grid = $('#s-grid'); elLen = $('#s-len'); elSpan = $('#s-span'); elState = $('#s-state'); elMsg = $('#s-msg'); elTries = $('#s-tries'); bStart = $('#s-start'); segMode = $('#s-mode');
    for (let i = 0; i < 9; i++) {
      const b = document.createElement('button'); b.className = 'block'; b.disabled = true; b.setAttribute('aria-label', 'Bloque ' + (i + 1));
      // Tablero de Corsi irregular (igual en las dos pieles): la posición la decide corsi-layout.js.
      const r = blockRect(i);
      Object.assign(b.style, { left: r.left + '%', top: r.top + '%', width: r.width + '%', height: r.height + '%' });
      // La respuesta vive en la pulsación: tono y realce al bajar el dedo; la validación, al soltar.
      b.addEventListener('pointerdown', () => { if (input) { b.classList.add('pressing'); tone(BLOCK_FREQ[i], 140); } });
      const release = () => b.classList.remove('pressing');
      b.addEventListener('pointerup', release); b.addEventListener('pointercancel', release); b.addEventListener('pointerleave', release);
      b.addEventListener('click', () => tap(i)); grid.appendChild(b); blocks.push(b);
    }
    segMode.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      mode = b.dataset.mode; $$('button', segMode).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      setMsg(elMsg, mode === 'inverso' ? 'Modo inverso: toca los bloques en orden contrario al mostrado.' : 'Modo directo: toca los bloques en el mismo orden.');
    });
    bStart.addEventListener('click', start);
    setMsg(elMsg, 'Pulsa Empezar. La secuencia comienza con 3 bloques.');
  },
  start({ onEnd: cb } = {}) { onEnd = cb || null; start(); },
  stop() { abort(); onEnd = null; bStart.textContent = 'Empezar'; }
};
