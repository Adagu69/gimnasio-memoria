// hoy.js — panel principal: sesión diaria, historial de entrenamiento (calendario) e Índice de Memoria.
import { $ } from '../ui.js';
import { store, dayKey } from '../store.js';
import { GAMES, ORDER, areaIndex, globalIndex } from '../indice.js';
import { sesion } from './sesion.js';

const DAYS = ['d', 'l', 'm', 'm', 'j', 'v', 's'];

function greeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const n = store.profile.name;
  return n ? `${g}, ${n}` : g;
}

function renderCalendar() {
  const trained = new Set(store.routines.map(r => r.day));
  const today = new Date(); const todayKey = dayKey(today);
  // 4 semanas: la semana actual y las 3 anteriores, empezando en domingo
  const start = new Date(today); start.setDate(today.getDate() - today.getDay() - 21);
  let html = DAYS.map(d => `<span class="d">${d}</span>`).join('');
  for (let k = 0; k < 28; k++) {
    const d = new Date(start); d.setDate(start.getDate() + k);
    const key = dayKey(d); const on = trained.has(key);
    const cls = ['c', on ? 'on' : '', key === todayKey ? 'today' : '', d < today && !on ? 'past' : ''].join(' ');
    html += `<span class="${cls}" title="${key}">${on ? '' : d.getDate()}</span>`;
  }
  $('#hoy-cal').innerHTML = html;
  const n = store.routines.length;
  $('#hoy-calnote').textContent = n ? `${n} ${n === 1 ? 'sesión completada' : 'sesiones completadas'} en total.` : 'Completa tu primera sesión diaria para empezar la racha.';
}

export function renderImBars(el, withBase = false) {
  const areas = store.profile.areas || ORDER; const cal = store.profile.calibration;
  el.innerHTML = areas.map(g => {
    const v = areaIndex(g); const base = cal ? cal.scores[g] : null;
    return `<div><div class="lbl"><span>${GAMES[g].area} <small>· ${GAMES[g].name}</small></span><span>${v ?? '–'}${withBase && base !== null && v !== null ? ` <small>(inicio ${base}${v - base >= 0 ? ' +' : ' '}${v - base})</small>` : ''}</span></div><div class="bar"><i class="${g}" style="transform:scaleX(${(v || 0) / 100})"></i></div></div>`;
  }).join('');
}

export const hoy = {
  init() {
    $('#hoy-start').addEventListener('click', () => sesion.start('diaria'));
  },
  render() {
    $('#hoy-greet').textContent = greeting();
    try { $('#hoy-date').textContent = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }) + ` · ${(store.profile.areas || ORDER).length} juegos`; } catch (e) { $('#hoy-date').textContent = ''; }
    const done = store.trainedToday();
    $('#hoy-done').hidden = !done;
    $('#hoy-start').textContent = done ? 'Entrenar otra vez' : 'Comenzar';
    // anillo: cada área entrenada hoy colorea un tercio
    const areas = store.profile.areas || ORDER; const todayKey = dayKey(Date.now());
    const playedToday = g => store.byGame(g).some(s => dayKey(s.t) === todayKey);
    const ring = $('#hoy-ring'); let acc = 0;
    ['p1', 'p2', 'p3'].forEach((p, k) => { if (areas[k] && playedToday(areas[k])) acc += 100 / areas.length; ring.style.setProperty('--' + p, acc + '%'); });
    $('#hoy-games').innerHTML = areas.map(g => `<div class="${playedToday(g) ? 'done' : ''}"><i style="background:var(--${GAMES[g].color})"></i><div><b>${GAMES[g].name}</b><small>${GAMES[g].area}</small></div></div>`).join('');
    const st = store.streak();
    $('#hoy-streak').textContent = `🔥 ${st}`;
    const side = $('#side-streak'); side.hidden = st === 0; side.textContent = `🔥 ${st} ${st === 1 ? 'día' : 'días'} de racha`;
    renderCalendar();
    const gi = globalIndex(); $('#hoy-im').textContent = gi ?? '–';
    renderImBars($('#hoy-bars'));
  }
};
