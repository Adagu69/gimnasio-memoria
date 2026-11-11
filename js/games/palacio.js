// palacio.js — minijuego Palacio de la memoria (memoria asociativa objeto–lugar, método de loci).
// OBSERVA: se recorre una ruta fija de L lugares; en cada uno aparece un objeto durante 2,4 s.
// TU TURNO: se repite la ruta y en cada lugar se elige el objeto entre 4 opciones (distractores del mismo ensayo).
// Regla 85 % / 60 %: el número de lugares sube o baja para la próxima sesión.
// Contrato DOM (la escena 3D y las pruebas leen estos atributos): #mp-stage[data-phase|data-locus|data-obj],
// #mp-caption[data-locus|data-obj], #mp-options button[data-obj].
import { $, setMsg, haptic } from '../ui.js';
import { store } from '../store.js';
import { sfx } from '../audio.js';
import { LOCI, TIMING, makeTrial, optionsFor, scoreAnswers, nextLoci, caption, question, objectName, normalizeLevel } from './palacio-logic.js';
import { drawSprite } from './sprites.js';

let trial = null, answers = [], k = -1, L = 4, timers = [], onEnd = null, running = false;
let stage, room, cap, opts, elLoci, elCorrect, elState, elMsg, bStart;

const later = (fn, ms) => { timers.push(setTimeout(fn, ms)); };
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

function setPhase(phase, label) { stage.dataset.phase = phase; elState.textContent = label; }

function setLocus(i) {
  k = i;
  stage.dataset.locus = String(i);
  cap.dataset.locus = String(i);
  [...room.children].forEach((el, j) => {
    el.classList.toggle('here', j === i);
    el.classList.toggle('used', !!trial && j < trial.loci);
  });
}

/** Muestra (o quita) el objeto en el lugar actual: lo dibujan la escena 3D y el plano de la piel clásica. */
function showObject(id) {
  stage.dataset.obj = id || '';
  cap.dataset.obj = id || '';
  const here = room.children[k];
  [...room.querySelectorAll('canvas')].forEach(c => { c.hidden = true; });
  if (id && here) { const c = here.querySelector('canvas'); drawSprite(c, id); c.hidden = false; }
}

function renderRoom() {
  room.innerHTML = '';
  LOCI.forEach((l, i) => {
    const el = document.createElement('span');
    el.className = 'locus';
    el.style.left = (l.plan.x * 100) + '%';
    el.style.top = (l.plan.y * 100) + '%';
    const n = document.createElement('i'); n.textContent = String(i + 1);
    const c = document.createElement('canvas'); c.hidden = true; c.setAttribute('aria-hidden', 'true');
    const b = document.createElement('b'); b.textContent = l.en.replace(/^en (el|la) /, '');
    el.append(n, c, b);
    room.appendChild(el);
  });
}

function start() {
  clearTimers();
  L = normalizeLevel(store.settings.palacioLoci); // un valor guardado inválido no rompe el juego
  trial = makeTrial(L);
  running = true;
  answers = [];
  elLoci.textContent = String(L); elCorrect.textContent = '0';
  opts.innerHTML = '';
  bStart.textContent = 'Reiniciar';
  setPhase('observa', 'Observa');
  setMsg(elMsg, `Recorre la habitación: fíjate en qué objeto hay en cada uno de los ${L} lugares.`);
  encode(0);
}

function encode(i) {
  if (i >= L) { later(beginRecall, 500); return; }
  setLocus(i); showObject(null);
  cap.textContent = '…';
  later(() => { showObject(trial.objects[i]); cap.textContent = caption(trial.objects[i], i); sfx.tick(); }, TIMING.MOVE_MS);
  later(() => encode(i + 1), TIMING.MOVE_MS + TIMING.SHOW_MS);
}

function beginRecall() {
  setPhase('turno', 'Tu turno');
  setMsg(elMsg, 'Vuelve a recorrer la ruta. ¿Qué objeto había en cada lugar?');
  recall(0);
}

function recall(i) {
  if (i >= L) { finish(); return; }
  setLocus(i); showObject(null);
  cap.textContent = question(i);
  opts.innerHTML = '';
  later(() => renderOptions(optionsFor(trial, i)), TIMING.MOVE_MS);
}

function renderOptions(list) {
  opts.innerHTML = '';
  list.forEach(id => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mp-opt'; b.dataset.obj = id;
    const c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true'); drawSprite(c, id);
    const t = document.createElement('span'); t.textContent = objectName(id);
    b.append(c, t);
    b.addEventListener('click', () => answer(id, b));
    opts.appendChild(b);
  });
  // Teclado y lector de pantalla: el foco vuelve al grupo de opciones (etiquetado con la pregunta) en cada
  // lugar, salvo que el usuario esté usando otro control (Ayuda, Salir…).
  opts.setAttribute('aria-label', question(k));
  const a = document.activeElement;
  if (!a || a === document.body || opts.contains(a) || a === opts) opts.focus({ preventScroll: true });
}

function answer(id, btn) {
  if (!running || stage.dataset.phase !== 'turno' || answers[k] !== undefined) return;
  answers[k] = id;
  const correct = trial.objects[k];
  const ok = id === correct;
  opts.querySelectorAll('button').forEach(b => { b.disabled = true; if (b.dataset.obj === correct) b.classList.add('ok'); });
  if (!ok) btn.classList.add('bad');
  showObject(correct); // retroalimentación: el objeto correcto aparece en su lugar
  if (ok) { sfx.ok(); haptic(10); } else { sfx.bad(); haptic([20, 40, 20]); }
  elCorrect.textContent = String(scoreAnswers(trial, answers).correct);
  later(() => recall(k + 1), TIMING.FEEDBACK_MS);
}

function finish() {
  running = false;
  const s = scoreAnswers(trial, answers);
  const saved = store.addSession({ game: 'palacio', loci: L, acc: s.acc, correct: s.correct, total: s.total });
  // Al callback (tarjeta de resultado) se le pasan además los objetos acertados, que no se guardan.
  const result = { ...saved, objs: trial.objects.filter((id, i) => answers[i] === id) };
  const next = nextLoci(L, s.acc);
  store.setSetting('palacioLoci', next);
  setPhase('fin', 'Fin'); setLocus(-1); showObject(null);
  opts.innerHTML = ''; cap.textContent = '';
  const tip = next > L ? `La próxima vez: ${next} lugares.` : next < L ? `La próxima vez: ${next} lugares.` : `Mantienes ${L} lugares.`;
  setMsg(elMsg, `Recordaste ${s.correct} de ${s.total} (${s.acc} %). ${tip}`, s.acc >= 85 ? 'ok' : s.acc < 60 ? 'bad' : 'warn');
  bStart.textContent = 'Empezar';
  if (s.acc >= 85) sfx.win();
  if (onEnd) { const cb = onEnd; onEnd = null; cb(result); }
}

function idle() {
  setPhase('idle', 'Listo'); setLocus(-1); showObject(null);
  cap.textContent = ''; opts.innerHTML = '';
  const n = normalizeLevel(store.settings.palacioLoci);
  elLoci.textContent = String(n); elCorrect.textContent = '0';
  setMsg(elMsg, `Pulsa Empezar. Recorrerás ${n} lugares de la habitación.`);
}

export const palacio = {
  init() {
    stage = $('#mp-stage'); room = $('#mp-room'); cap = $('#mp-caption'); opts = $('#mp-options');
    elLoci = $('#mp-loci'); elCorrect = $('#mp-correct'); elState = $('#mp-state'); elMsg = $('#mp-msg'); bStart = $('#mp-start');
    renderRoom();
    bStart.addEventListener('click', start);
    idle();
  },
  refresh() { if (!running) idle(); },
  start({ onEnd: cb } = {}) { onEnd = cb || null; start(); },
  stop() { clearTimers(); running = false; onEnd = null; bStart.textContent = 'Empezar'; idle(); }
};
