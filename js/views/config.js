// config.js — bienvenida y asistente de configuración (nombre, objetivo, áreas, edad, dificultad).
// Al terminar, marca el perfil como configurado y lanza la prueba de nivel.
import { $, $$, toast, enter } from '../ui.js';
import { store } from '../store.js';
import { go } from '../router.js';
import { sesion } from './sesion.js';
import { ORDER } from '../indice.js';
import { startLoci } from '../games/palacio-logic.js';

const STEPS = 6;
let step = 0;
let draft = {};

function showStep(i) {
  step = i;
  $$('#v-config .wstep').forEach(el => { el.hidden = +el.dataset.step !== i; });
  const cur = $(`#v-config .wstep[data-step="${i}"]`);
  enter(cur);
  $('#w-progress').style.width = `${Math.round(100 * (i + 1) / (STEPS + 1))}%`;
  $('#w-back').disabled = i === 0;
  const next = $('#w-next');
  next.textContent = i === STEPS - 1 ? 'Hacer mi prueba de nivel' : 'Continuar';
  next.hidden = [1, 4, 5].includes(i); // los pasos de elección única avanzan al elegir
  if (i === 0) setTimeout(() => $('#w-name').focus(), 50);
}

function valid() {
  if (step === 0) { draft.name = $('#w-name').value.trim().slice(0, 24); if (!draft.name) { toast('Escribe tu nombre para continuar'); $('#w-name').focus(); return false; } }
  if (step === 2) { draft.areas = $$('#w-areas input:checked').map(i => i.value); if (!draft.areas.length) { toast('Elige al menos un área'); return false; } }
  return true;
}

function next() {
  if (!valid()) return;
  if (step < STEPS - 1) { showStep(step + 1); return; }
  finish();
}

function finish() {
  const level = draft.difficulty === 'avanzado' ? 3 : 1;
  store.setProfile({ name: draft.name, goal: draft.goal || 'entrenar', areas: draft.areas, ageRange: draft.ageRange || '', difficulty: draft.difficulty || 'estandar', onboarded: true });
  store.setSetting('paresLevel', level);
  store.setSetting('nbackN', draft.difficulty === 'avanzado' ? 3 : 2);
  store.setSetting('palacioLoci', startLoci(draft.difficulty));
  sesion.start('calibracion');
}

function single(containerId, key, autoNext = true) {
  const c = $('#' + containerId);
  c.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('button', c).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    draft[key] = b.dataset.value;
    if (autoNext) setTimeout(next, 180);
  });
}

export const config = {
  init() {
    $('#b-start').addEventListener('click', () => { draft = { areas: [...ORDER] }; go('config'); showStep(0); });
    $('#w-next').addEventListener('click', next);
    $('#w-back').addEventListener('click', () => { if (step > 0) showStep(step - 1); });
    $('#w-name').addEventListener('keydown', e => { if (e.key === 'Enter') next(); });
    single('w-goal', 'goal');
    single('w-age', 'ageRange');
    single('w-diff', 'difficulty');
    $('#w-areas').addEventListener('change', e => {
      const lab = e.target.closest('.check'); if (lab) lab.classList.toggle('on', e.target.checked);
    });
  },
  /** Reconfigurar desde Ajustes: conserva el nombre. */
  restart() {
    draft = { name: store.profile.name, areas: store.profile.areas };
    go('config'); showStep(0); $('#w-name').value = draft.name;
  }
};
