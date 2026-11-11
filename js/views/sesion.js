// sesion.js — encadena los juegos del programa con tarjeta de introducción y de resultado por juego.
// Dos modos: 'calibracion' (prueba de nivel inicial → Resultados → Plan) y 'diaria' (sesión del día → puntaje y racha).
// Pixel-3D: la intro muestra la maqueta de la estación; el resultado deja caer (Matter.js) tantos objetos como la
// métrica del juego. La física solo existe en estas tarjetas, nunca mientras se juega.
import { $, enter } from '../ui.js';
import { store } from '../store.js';
import { go } from '../router.js';
import { pares } from '../games/pares.js';
import { secuencia } from '../games/secuencia.js';
import { nback } from '../games/nback.js';
import { palacio } from '../games/palacio.js';
import { GAMES, ORDER, normalize, areaIndex, globalIndex, goal, goalPct, spanReference } from '../indice.js';
import { is3d } from '../three/skin.js';
import * as engine from '../three/engine.js';
import { createMiniStage } from '../three/scenes/mini.js';
import { mountPhysics } from '../physics/stage.js';
import { resultSpecs, metricCount, columnSpecs, columnWalls } from '../physics/presets.js';

const MODULES = { pares, secuencia, nback, palacio };
const METRIC_CSS = { pares: '--gold', secuencia: '--c6', nback: '--c5', palacio: '--c1' };
let mode = null, steps = [], i = 0, results = {}, active = false, internalNav = false, banner = null;
let phys = null, resultTimer = 0;
const minis = new Map();

function navTo(v) { internalNav = true; go(v); internalNav = false; }
function label() { return mode === 'calibracion' ? 'Prueba de nivel' : 'Sesión diaria'; }
function dropPhysics() { if (phys) { phys.destroy(); phys = null; } }

function renderStepper() {
  const names = steps.map(g => GAMES[g].name).concat(['Resultados']);
  $('#s-stepper').innerHTML = names.map((n, k) => `<span class="${k < i ? 'done' : k === i ? 'active' : ''}"><b>${k + 1}</b>${n}</span>`).join('');
}

/** Maqueta 3D de la estación en la tarjeta de intro (si la piel es Pixel-3D). */
function showMini(g) {
  const host = $('#s-art');
  host.textContent = GAMES[g].icon.repeat(3);
  if (!is3d()) return;
  if (!minis.has(g)) minis.set(g, createMiniStage(g));
  engine.mount(host, minis.get(g));
}

function showIntro() {
  const g = steps[i];
  dropPhysics();
  navTo('sesion'); renderStepper();
  const card = $('#s-intro'); card.dataset.game = g; card.hidden = false; $('#s-result').hidden = true;
  $('#s-title').textContent = GAMES[g].name;
  $('#s-desc').innerHTML = GAMES[g].intro;
  enter(card);
  showMini(g);
}

function play() {
  const g = steps[i];
  engine.unmount($('#s-art'));
  navTo(g);
  removeBanner();
  banner = document.createElement('div'); banner.className = 'rutina-banner'; banner.id = 'rutina-banner';
  banner.innerHTML = `<span>${label()} · paso ${i + 1} de ${steps.length}: ${GAMES[g].name}</span><button class="btn ghost small" id="r-cancel">Cancelar</button>`;
  $('#v-' + g + ' .card').prepend(banner);
  $('#r-cancel').addEventListener('click', cancel);
  MODULES[g].start({ onEnd: r => onEnd(g, r) });
}

/** Objetos que caen en la tarjeta de resultado: representan la métrica (estrellas, amplitud, N, aciertos). */
function dropMetric(g, r) {
  const host = $('#s-art2');
  host.textContent = '';
  const n = metricCount(g, r);
  phys = mountPhysics(host, {
    use3d: is3d(),
    count: n,
    specs: (w, h) => resultSpecs(g, r, { width: w, height: h }).map((s, k) => ({
      ...s, data: { ...s.data, css: METRIC_CSS[g], obj: g === 'palacio' && r.objs ? r.objs[k] : undefined }
    }))
  });
}

function onEnd(g, r) {
  if (!active) return;
  results[g] = r; removeBanner();
  const score = normalize(r);
  const card = $('#s-result'); card.dataset.game = g;
  $('#s-rtitle').textContent = GAMES[g].outro;
  $('#s-rdesc').textContent = GAMES[g].explain;
  $('#s-rscore').textContent = score;
  $('#s-rdetail').textContent = detail(g, r);
  const last = i === steps.length - 1;
  $('#s-next').textContent = last ? (mode === 'calibracion' ? 'Ver resultados' : 'Ver resumen') : `Ahora, ${steps[i + 1] === 'nback' ? 'N-Back' : GAMES[steps[i + 1]].name.toLowerCase()}`;
  // el paso termina al mostrar el resultado: el botón "Continuar" solo cambia de pantalla
  clearTimeout(resultTimer);
  resultTimer = setTimeout(() => {
    if (!active) return;
    navTo('sesion'); renderStepper();
    $('#s-intro').hidden = true; card.hidden = false; enter(card);
    dropMetric(g, r);
    $('#s-next').focus();
  }, 900);
}

function detail(g, r) {
  if (g === 'pares') return `Nivel ${r.level} · ${r.moves} intentos · eficiencia ${r.eff}% · ${'★'.repeat(r.stars)}`;
  if (g === 'secuencia') return `Amplitud ${r.span} (${r.mode}) · ${spanReference(r.span)}`;
  if (g === 'palacio') return `${r.loci} lugares · ${r.correct} de ${r.total} recordados · precisión ${r.acc}%`;
  return `N = ${r.n} · precisión ${r.acc}% · ${r.hits} aciertos, ${r.miss} omisiones, ${r.fa} falsas alarmas`;
}

function advance() {
  if (i < steps.length - 1) { i++; showIntro(); return; }
  finish();
}

function finish() {
  active = false;
  dropPhysics();
  const scores = Object.fromEntries(steps.map(g => [g, normalize(results[g])]));
  const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / steps.length);
  if (mode === 'calibracion') {
    store.setProfile({ calibration: { date: Date.now(), scores, global: avg } });
    navTo('resultados');
    renderResultados(scores, avg);
  } else {
    store.addRoutine({ score: avg, parts: scores });
    renderDailyDone(avg);
  }
}

function renderResultados(scores, avg) {
  const age = store.profile.ageRange;
  $('#r-sub').textContent = 'Tu índice de memoria inicial en cada área (0 a 100). Cada bloque vale 10 puntos' + (age ? ` · rango de edad ${age.replace('menos18', 'menos de 18').replace('+', ' o más')}` : '') + '.';
  $('#r-grid').style.setProperty('--cols', steps.length);
  $('#r-grid').innerHTML = steps.map(g => `<div class="rcard" data-game="${g}">
      <h3>${GAMES[g].name}</h3>
      <div class="box"><small>${GAMES[g].area}</small><span class="n">${scores[g]}</span><small>${detail(g, results[g])}</small></div>
    </div>`).join('');
  $('#r-global').textContent = avg;
  $('#r-ref').textContent = avg >= 70 ? 'Buen punto de partida.' : avg >= 45 ? 'Un punto de partida normal: la práctica diaria lo sube.' : 'Empezarás con niveles cómodos; el juego sube la dificultad contigo.';
  const stack = $('#r-stack');
  stack.style.setProperty('--cols', steps.length);
  const entries = steps.map(g => [g, scores[g]]);
  phys = mountPhysics(stack, {
    use3d: is3d(),
    specs: (w, h) => columnSpecs(entries, { width: w, height: h }).map(s => ({ ...s, data: { ...s.data, css: '--' + GAMES[s.data.area].color } })),
    walls: (w, h) => columnWalls(entries.length, { width: w, height: h })
  });
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
  $('#s-rdesc').textContent = (st > 1 ? `Llevas ${st} días seguidos. ` : 'Primer día de racha. ') + `Tu Índice de Memoria global es ${globalIndex()}. En el gimnasio, un bloque nuevo cae en tu Torre de constancia.`;
  $('#s-rscore').textContent = avg;
  $('#s-rdetail').textContent = steps.map(g => `${GAMES[g].name} ${normalize(results[g])}`).join(' · ');
  $('#s-next').textContent = 'Ir a mi panel';
  enter(card);
}

function removeBanner() { if (banner) { banner.remove(); banner = null; } }

function cancel() {
  const g = steps[i];
  if (MODULES[g]) { MODULES[g].stop(); if (g === 'pares') pares.idle(); }
  clearTimeout(resultTimer);
  active = false; removeBanner(); dropPhysics();
  navTo(store.profile.onboarded && store.profile.calibration ? 'hoy' : 'bienvenida');
}

export const sesion = {
  init() {
    $('#s-go').addEventListener('click', play);
    $('#s-next').addEventListener('click', () => { if (!active) { dropPhysics(); navTo('hoy'); return; } advance(); });
    $('#r-next').addEventListener('click', () => { dropPhysics(); renderPlan(); navTo('plan'); });
    $('#p-next').addEventListener('click', () => navTo('hoy'));
  },
  start(m) {
    clearTimeout(resultTimer); dropPhysics();
    mode = m; steps = ORDER.filter(g => (store.profile.areas || ORDER).includes(g)); i = 0; results = {}; active = true;
    showIntro();
  },
  isActive() { return active; },
  /** Navegación del usuario fuera de un juego en curso: cancela la sesión. */
  onLeaveGame(view) {
    if (active && !internalNav && steps[i] === view) {
      MODULES[view].stop(); if (view === 'pares') pares.idle();
      clearTimeout(resultTimer);
      active = false; removeBanner();
    }
  },
  /** Al salir de las pantallas de sesión/resultados se apaga la física y la maqueta. */
  onLeaveScreen() { if (!internalNav) { dropPhysics(); engine.unmount($('#s-art')); } }
};
