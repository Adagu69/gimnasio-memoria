// nback.js — minijuego N-Back espacial (memoria de trabajo).
// 20 turnos puntuables; ~32 % de objetivos. La regla 85 % / 60 % recomienda subir o bajar N
// y la recomendación se guarda como N inicial para la próxima sesión.
import { $, $$, setMsg, enter, haptic } from '../ui.js';
import { store } from '../store.js';
import { tone, sfx } from '../audio.js';

export const TRIALS = 20, ISI = 2500, ON = 1500, MAX_N = 4;
let N = 2, seq = [], i = 0, running = false, timers = [], hits = 0, miss = 0, fa = 0, responded = false, onEnd = null;
let cells = [], grid, elTrial, elHits, elMiss, elFa, elBar, elMsg, elReco, bMatch, bStart, seg;

function setN(n) {
  N = n; store.setSetting('nbackN', n);
  $$('button', seg).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.n === n)));
}

function gen() {
  const total = TRIALS + N; seq = []; let last = -1;
  for (let k = 0; k < total; k++) {
    let v;
    if (k >= N && Math.random() < 0.32) v = seq[k - N];
    else { do { v = Math.floor(Math.random() * 9); } while (v === last || (k >= N && v === seq[k - N])); }
    seq.push(v); last = v;
  }
}

function hud() {
  const done = Math.max(0, i - N);
  elTrial.textContent = done + '/' + TRIALS; elHits.textContent = hits; elMiss.textContent = miss; elFa.textContent = fa;
  elBar.style.width = (100 * done / TRIALS) + '%';
}

function start() {
  stop(true); gen(); i = 0; hits = miss = fa = 0; running = true; hud(); elReco.hidden = true;
  setMsg(elMsg, `Atento. Los primeros ${N} turnos no cuentan.`);
  bMatch.disabled = false; bStart.textContent = 'Detener'; $$('button', seg).forEach(b => b.disabled = true);
  step();
}

function step() {
  if (i > 0) { const prev = i - 1; if (prev >= N && !responded && seq[prev] === seq[prev - N]) { miss++; } }
  if (i >= seq.length) { finish(); return; }
  responded = false;
  cells.forEach(c => c.classList.remove('on')); cells[seq[i]].classList.add('on'); sfx.tick();
  timers.push(setTimeout(() => cells.forEach(c => c.classList.remove('on')), ON));
  i++; hud();
  timers.push(setTimeout(step, ISI));
}

function match() {
  if (!running || responded || i === 0) return;
  responded = true; const cur = i - 1;
  if (cur < N) { setMsg(elMsg, 'Todavía no hay con qué comparar.'); return; }
  if (seq[cur] === seq[cur - N]) { hits++; sfx.ok(); haptic(10); setMsg(elMsg, 'Acierto.', 'ok'); }
  else { fa++; sfx.bad(); haptic([20, 40, 20]); setMsg(elMsg, 'Falsa alarma.', 'bad'); }
  hud();
}

function finish() {
  running = false; cells.forEach(c => c.classList.remove('on'));
  bMatch.disabled = true; bStart.textContent = 'Empezar'; $$('button', seg).forEach(b => b.disabled = false);
  const targets = hits + miss, correctRej = (TRIALS - targets) - fa;
  const acc = Math.round(100 * (hits + correctRej) / TRIALS);
  setMsg(elMsg, `Sesión terminada. Precisión ${acc}% con N = ${N}.`, acc >= 85 ? 'ok' : acc < 60 ? 'bad' : 'warn');
  let nextN = N;
  if (acc >= 85 && N < MAX_N) { nextN = N + 1; elReco.textContent = `Sube a N = ${nextN}`; elReco.className = 'pill ok'; }
  else if (acc < 60 && N > 1) { nextN = N - 1; elReco.textContent = `Baja a N = ${nextN}`; elReco.className = 'pill bad'; }
  else { elReco.textContent = `Mantén N = ${N}`; elReco.className = 'pill warn'; }
  elReco.hidden = false; enter(elReco);
  const result = { game: 'nback', n: N, acc, hits, miss, fa };
  store.addSession(result);
  if (acc >= 85 || acc < 60) sfx.win();
  // la recomendación pasa a ser el N inicial de la próxima vez
  setN(nextN);
  if (onEnd) { const cb = onEnd; onEnd = null; cb(result); }
}

function stop(silent) {
  timers.forEach(clearTimeout); timers = [];
  if (running) {
    running = false; cells.forEach(c => c.classList.remove('on'));
    bMatch.disabled = true; bStart.textContent = 'Empezar'; $$('button', seg).forEach(b => b.disabled = false);
    if (!silent) setMsg(elMsg, 'Sesión detenida.');
  }
}

export const nback = {
  init() {
    grid = $('#n-grid'); elTrial = $('#n-trial'); elHits = $('#n-hits'); elMiss = $('#n-miss'); elFa = $('#n-fa'); elBar = $('#n-bar');
    elMsg = $('#n-msg'); elReco = $('#n-reco'); bMatch = $('#n-match'); bStart = $('#n-start'); seg = $('#n-seg');
    for (let k = 0; k < 9; k++) { const c = document.createElement('div'); c.className = 'cell'; c.innerHTML = '<span class="dot"></span>'; grid.appendChild(c); cells.push(c); }
    seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || running) return; setN(+b.dataset.n); });
    bStart.addEventListener('click', () => running ? stop() : start());
    // Respuesta en pointer-down: el acierto se registra en el instante de la pulsación, no al soltar.
    bMatch.addEventListener('pointerdown', e => { if (e.button === 0) match(); });
    bMatch.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); match(); } });
    document.addEventListener('keydown', e => {
      if (e.code === 'Space' && running && !$('#v-nback').hidden) { e.preventDefault(); match(); }
    });
    setN(store.settings.nbackN || 2);
    setMsg(elMsg, `Pulsa Empezar. N = ${N} según tu última sesión.`);
  },
  refresh() { setN(store.settings.nbackN || 2); },
  start({ onEnd: cb } = {}) { onEnd = cb || null; start(); },
  stop() { stop(true); onEnd = null; }
};
