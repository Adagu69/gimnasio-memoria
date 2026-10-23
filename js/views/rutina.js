// rutina.js — "Rutina de hoy": encadena Pares → Secuencia → N-Back y calcula un puntaje del día.
// El puntaje (0-100) promedia tres medidas normalizadas:
//   Pares: eficiencia (parejas/intentos) · Secuencia: amplitud/8 · N-Back: precisión ponderada por N.
import { $, $$ } from '../ui.js';
import { store } from '../store.js';
import { go } from '../router.js';
import { pares } from '../games/pares.js';
import { secuencia } from '../games/secuencia.js';
import { nback } from '../games/nback.js';

const ORDER = ['pares', 'secuencia', 'nback'];
const GAMES = { pares, secuencia, nback };
const LABEL = { pares: 'Pares', secuencia: 'Secuencia', nback: 'N-Back' };

let active = false, step = 0, results = {};
let banner = null, internalNav = false;

function navTo(v) { internalNav = true; go(v); internalNav = false; }

export function routineActive() { return active; }

export function normalize(r) {
  if (r.game === 'pares') return Math.min(100, r.eff);
  if (r.game === 'secuencia') return Math.min(100, Math.round(100 * r.span / 8));
  // N-Back: la precisión vale más cuanto mayor es N (N=1 ×0.7, N=2 ×0.85, N=3 ×1, N=4 ×1.1)
  const w = { 1: 0.7, 2: 0.85, 3: 1, 4: 1.1 }[r.n] || 1;
  return Math.min(100, Math.round(r.acc * w));
}

function renderSteps() {
  $$('#r-steps li').forEach((li, idx) => {
    li.classList.toggle('active', active && idx === step);
    li.classList.toggle('done', !!results[ORDER[idx]]);
  });
}

function ensureBanner(view) {
  removeBanner();
  banner = document.createElement('div');
  banner.className = 'rutina-banner';
  banner.id = 'rutina-banner';
  $('#v-' + view + ' .card').prepend(banner);
}
function removeBanner() { if (banner) { banner.remove(); banner = null; } }

function runStep() {
  const g = ORDER[step];
  navTo(g);
  ensureBanner(g);
  banner.innerHTML = `<span>Rutina de hoy · paso ${step + 1} de 3: ${LABEL[g]}</span><button class="btn ghost small" id="r-cancel">Cancelar rutina</button>`;
  $('#r-cancel').addEventListener('click', cancel);
  renderSteps();
  GAMES[g].start({ onEnd: r => onGameEnd(g, r) });
}

function onGameEnd(g, r) {
  if (!active) return;
  results[g] = r;
  renderSteps();
  const last = step === ORDER.length - 1;
  banner.innerHTML = `<span>${LABEL[g]} listo · ${normalize(r)} pts</span><button class="btn primary small" id="r-continue">${last ? 'Ver resultado' : 'Continuar'}</button>`;
  $('#r-continue').addEventListener('click', () => { if (last) finish(); else { step++; runStep(); } });
  $('#r-continue').focus();
}

function finish() {
  removeBanner();
  const parts = ORDER.map(g => normalize(results[g]));
  const score = Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
  const r = store.addRoutine({ score, parts: Object.fromEntries(ORDER.map((g, i) => [g, parts[i]])) });
  active = false; step = 0;
  const streak = store.streak();
  const sum = $('#r-summary');
  sum.hidden = false;
  sum.innerHTML = `
    <div class="score-big"><span class="l">Puntaje de hoy</span><span class="n">${score}</span><span class="muted small">${streak === 1 ? 'Primer día de racha' : streak + ' días seguidos'}</span></div>
    <div class="score-list">
      <div><span>Pares · nivel ${results.pares.level}, ${results.pares.moves} intentos</span><b>${parts[0]}</b></div>
      <div><span>Secuencia · amplitud ${results.secuencia.span} (${results.secuencia.mode})</span><b>${parts[1]}</b></div>
      <div><span>N-Back · N = ${results.nback.n}, precisión ${results.nback.acc}%</span><b>${parts[2]}</b></div>
    </div>`;
  $('#r-start').textContent = 'Repetir rutina';
  renderSteps();
  navTo('rutina');
  results = {};
}

function cancel() {
  const g = ORDER[step];
  GAMES[g].stop();
  if (g === 'pares') pares.idle();
  active = false; step = 0; results = {};
  removeBanner(); renderSteps();
  navTo('rutina');
}

export const rutina = {
  init() {
    $('#r-start').addEventListener('click', () => {
      active = true; step = 0; results = {};
      $('#r-summary').hidden = true;
      runStep();
    });
  },
  /** Si el usuario navega por su cuenta fuera del paso actual, la rutina se cancela. */
  onLeaveGame(view) {
    if (active && !internalNav && ORDER[step] === view) {
      GAMES[view].stop();
      if (view === 'pares') pares.idle();
      active = false; step = 0; results = {};
      removeBanner(); renderSteps();
    }
  },
  enter() {
    renderSteps();
    if (!active) { $('#r-start').textContent = store.routines.length ? 'Nueva rutina' : 'Empezar rutina'; }
  }
};
