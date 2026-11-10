// sesion.js — encadena los juegos del programa con tarjeta de introducción y de resultado por juego.
// Dos modos: 'calibracion' (prueba de nivel inicial → Resultados → Plan) y 'diaria' (sesión del día → puntaje y racha).
import { $, $$, enter } from '../ui.js';
import { store } from '../store.js';
import { go } from '../router.js';
import { pares } from '../games/pares.js';
import { secuencia } from '../games/secuencia.js';
import { nback } from '../games/nback.js';
import { GAMES, ORDER, normalize, areaIndex, globalIndex, goal, goalPct, spanReference } from '../indice.js';

const MODULES = { pares, secuencia, nback };
let mode = null, steps = [], i = 0, results = {}, active = false, internalNav = false, banner = null;

function navTo(v) { internalNav = true; go(v); internalNav = false; }
function label() { return mode === 'calibracion' ? 'Prueba de nivel' : 'Sesión diaria'; }

function renderStepper() {
  const names = steps.map(g => GAMES[g].name).concat(['Resultados']);
  $('#s-stepper').innerHTML = names.map((n, k) => `<span class="${k < i ? 'done' : k === i ? 'active' : ''}"><b>${k + 1}</b>${n}</span>`).join('');
}

function showIntro() {
  const g = steps[i];
  navTo('sesion'); renderStepper();
  const card = $('#s-intro'); card.dataset.game = g; card.hidden = false; $('#s-result').hidden = true;
  $('#s-art').textContent = GAMES[g].icon.repeat(3);
  $('#s-title').textContent = GAMES[g].name;
  $('#s-desc').innerHTML = GAMES[g].intro;
  enter(card);
}

function play() {
  const g = steps[i];
  navTo(g);
  removeBanner();
  banner = document.createElement('div'); banner.className = 'rutina-banner'; banner.id = 'rutina-banner';
  banner.innerHTML = `<span>${label()} · paso ${i + 1} de ${steps.length}: ${GAMES[g].name}</span><button class="btn ghost small" id="r-cancel">Cancelar</button>`;
  $('#v-' + g + ' .card').prepend(banner);
  $('#r-cancel').addEventListener('click', cancel);
  MODULES[g].start({ onEnd: r => onEnd(g, r) });
}

function onEnd(g, r) {
  if (!active) return;
  results[g] = r; removeBanner();
  const score = normalize(r);
  const card = $('#s-result'); card.dataset.game = g;
  $('#s-art2').textContent = GAMES[g].icon;
  $('#s-rtitle').textContent = GAMES[g].outro;
  $('#s-rdesc').textContent = GAMES[g].explain;
  $('#s-rscore').textContent = score;
  $('#s-rdetail').textContent = detail(g, r);
  const last = i === steps.length - 1;
  $('#s-next').textContent = last ? (mode === 'calibracion' ? 'Ver resultados' : 'Ver resumen') : `Ahora, ${steps[i + 1] === 'nback' ? 'N-Back' : GAMES[steps[i + 1]].name.toLowerCase()}`;
  // el paso termina al mostrar el resultado: el botón "Continuar" solo cambia de pantalla
  setTimeout(() => {
    navTo('sesion'); renderStepper();
    $('#s-intro').hidden = true; card.hidden = false; enter(card);
    $('#s-next').focus();
  }, 900);
}

function detail(g, r) {
  if (g === 'pares') return `Nivel ${r.level} · ${r.moves} intentos · eficiencia ${r.eff}% · ${'★'.repeat(r.stars)}`;
  if (g === 'secuencia') return `Amplitud ${r.span} (${r.mode}) · ${spanReference(r.span)}`;
  return `N = ${r.n} · precisión ${r.acc}% · ${r.hits} aciertos, ${r.miss} omisiones, ${r.fa} falsas alarmas`;
}

function advance() {
  if (i < steps.length - 1) { i++; showIntro(); return; }
  finish();
}

function finish() {
  active = false;
  const scores = Object.fromEntries(steps.map(g => [g, normalize(results[g])]));
  const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / steps.length);
  if (mode === 'calibracion') {
    store.setProfile({ calibration: { date: Date.now(), scores, global: avg } });
    renderResultados(scores, avg);
    navTo('resultados');
  } else {
    store.addRoutine({ score: avg, parts: scores });
    renderDailyDone(avg);
  }
}

function renderResultados(scores, avg) {
  const age = store.profile.ageRange;
  $('#r-sub').textContent = 'Tu índice de memoria inicial en cada área (0 a 100)' + (age ? ` · rango de edad ${age.replace('menos18', 'menos de 18').replace('+', ' o más')}` : '') + '.';
  $('#r-grid').innerHTML = steps.map(g => {
    const v = scores[g]; const cut = 20 + v * 1.6; // posición de corte en la curva (ancho 200)
    return `<div class="rcard">
      <svg viewBox="0 0 220 90" aria-hidden="true"><defs><clipPath id="clip-${g}"><rect x="0" y="0" width="${cut}" height="90"/></clipPath></defs>
        <path d="M10 80 C 60 80, 70 10, 110 10 S 160 80, 210 80" fill="var(--line)"/>
        <path d="M10 80 C 60 80, 70 10, 110 10 S 160 80, 210 80" fill="var(--${GAMES[g].color})" clip-path="url(#clip-${g})"/>
        <path d="M10 80 C 60 80, 70 10, 110 10 S 160 80, 210 80" fill="none" stroke="var(--fg)" stroke-width="3" stroke-linecap="round"/></svg>
      <h3>${GAMES[g].name}</h3>
      <div class="box"><small>${GAMES[g].area}</small><span class="n">${v}</span><small>${detail(g, results[g])}</small></div>
    </div>`;
  }).join('');
  $('#r-global').textContent = avg;
  $('#r-ref').textContent = avg >= 70 ? 'Buen punto de partida.' : avg >= 45 ? 'Un punto de partida normal: la práctica diaria lo sube.' : 'Empezarás con niveles cómodos; el juego sube la dificultad contigo.';
}

function renderPlan() {
  $('#p-pct').textContent = goalPct() + ' %';
  const cal = store.profile.calibration;
  const areas = store.profile.areas || ORDER;
  $('#p-rows').innerHTML = areas.map(g => {
    const base = cal ? cal.scores[g] : areaIndex(g); const target = goal(base);
    return `<tr><td>${GAMES[g].area} <small class="muted">· ${GAMES[g].name}</small></td><td>${base ?? '–'}</td><td><b>${target ?? '–'}</b>${base !== null && base !== undefined ? `<span class="delta">+${target - base}</span>` : ''}</td></tr>`;
  }).join('') + (cal ? `<tr><td><b>Índice global</b></td><td>${cal.global}</td><td><b>${goal(cal.global)}</b><span class="delta">+${goal(cal.global) - cal.global}</span></td></tr>` : '');
}

function renderDailyDone(avg) {
  const card = $('#s-result'); card.dataset.game = steps[steps.length - 1];
  navTo('sesion'); i = steps.length; renderStepper();
  $('#s-intro').hidden = true; card.hidden = false;
  $('#s-art2').textContent = '🔥';
  $('#s-rtitle').textContent = 'Sesión de hoy completada';
  const st = store.streak();
  $('#s-rdesc').textContent = st > 1 ? `Llevas ${st} días seguidos. Tu Índice de Memoria global es ${globalIndex()}.` : `Primer día de racha. Tu Índice de Memoria global es ${globalIndex()}.`;
  $('#s-rscore').textContent = avg;
  $('#s-rdetail').textContent = steps.map(g => `${GAMES[g].name} ${normalize(results[g])}`).join(' · ');
  $('#s-next').textContent = 'Ir a mi panel';
  enter(card);
}

function removeBanner() { if (banner) { banner.remove(); banner = null; } }

function cancel() {
  const g = steps[i];
  if (MODULES[g]) { MODULES[g].stop(); if (g === 'pares') pares.idle(); }
  active = false; removeBanner();
  navTo(store.profile.onboarded && store.profile.calibration ? 'hoy' : 'bienvenida');
}

export const sesion = {
  init() {
    $('#s-go').addEventListener('click', play);
    $('#s-next').addEventListener('click', () => { if (!active) { navTo('hoy'); return; } advance(); });
    $('#r-next').addEventListener('click', () => { renderPlan(); navTo('plan'); });
    $('#p-next').addEventListener('click', () => navTo('hoy'));
  },
  start(m) {
    mode = m; steps = ORDER.filter(g => (store.profile.areas || ORDER).includes(g)); i = 0; results = {}; active = true;
    showIntro();
  },
  isActive() { return active; },
  /** Navegación del usuario fuera de un juego en curso: cancela la sesión. */
  onLeaveGame(view) {
    if (active && !internalNav && steps[i] === view) {
      MODULES[view].stop(); if (view === 'pares') pares.idle();
      active = false; removeBanner();
    }
  }
};
