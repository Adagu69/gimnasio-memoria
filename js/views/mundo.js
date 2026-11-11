// mundo.js (vista) — el gimnasio: pantalla principal con 5 estaciones fijas, el camino del día, el HUD
// (saludo, racha, índice, botón principal) y el cajón Diario (calendario, índice por área, Torre de constancia).
// Piel Pixel-3D: las estaciones son maquetas 3D y sus botones DOM se colocan encima (proyección 3D→DOM).
// Piel clásica: los mismos botones se ven como tarjetas. El DOM es siempre la verdad (teclado, lector, pruebas).
import { $, $$ } from '../ui.js';
import { store, dayKey } from '../store.js';
import { GAMES, ORDER, areaIndex, globalIndex } from '../indice.js';
import { sesion } from './sesion.js';
import { bestOf } from './juegos.js';
import { is3d, registerStage, onSkinChange } from '../three/skin.js';
import { createMundoStage } from '../three/scenes/mundo.js';
import { mountPhysics } from '../physics/stage.js';
import { towerSpecs, TOWER } from '../physics/presets.js';

const DAYS = ['d', 'l', 'm', 'm', 'j', 'v', 's'];
const STATION_INFO = {
  progreso: { name: 'Vitrina', area: 'Tu progreso', desc: 'Tus trofeos y la Torre de constancia: un bloque por cada sesión diaria completada, hasta la meta de 30 días.' }
};
let stage3d = null, selected = null, torrePhys = null, trophies = () => [];

function greeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const n = store.profile.name;
  return n ? `${g}, ${n}` : g;
}

const todayKey = () => dayKey(Date.now());
const playedToday = g => store.byGame(g).some(s => dayKey(s.t) === todayKey());
const areas = () => store.profile.areas || ORDER;

/** Estado que dibuja la escena 3D. */
function sceneState() {
  const list = areas();
  const played = new Set(list.filter(playedToday));
  const next = store.trainedToday() ? null : (list.find(g => !played.has(g)) || null);
  return { areas: list, played, next, routines: store.routines.map(r => ({ day: r.day, score: r.score })), trophies: trophies() };
}

function renderCalendar() {
  const trained = new Set(store.routines.map(r => r.day));
  const today = new Date(); const tk = dayKey(today);
  const start = new Date(today); start.setDate(today.getDate() - today.getDay() - 21);
  let html = DAYS.map(d => `<span class="d">${d}</span>`).join('');
  for (let k = 0; k < 28; k++) {
    const d = new Date(start); d.setDate(start.getDate() + k);
    const key = dayKey(d); const on = trained.has(key);
    const cls = ['c', on ? 'on' : '', key === tk ? 'today' : '', d < today && !on ? 'past' : ''].join(' ');
    html += `<span class="${cls}" title="${key}">${on ? '' : d.getDate()}</span>`;
  }
  $('#hoy-cal').innerHTML = html;
  const n = store.routines.length;
  $('#hoy-calnote').textContent = n ? `${n} ${n === 1 ? 'sesión completada' : 'sesiones completadas'} en total.` : 'Completa tu primera sesión diaria para empezar la racha.';
}

export function renderImBars(el, withBase = false) {
  const cal = store.profile.calibration;
  el.innerHTML = areas().map(g => {
    const v = areaIndex(g); const base = cal && cal.scores ? cal.scores[g] ?? null : null;
    return `<div><div class="lbl"><span>${GAMES[g].area} <small>· ${GAMES[g].name}</small></span><span>${v ?? '–'}${withBase && base !== null && v !== null ? ` <small>(inicio ${base}${v - base >= 0 ? ' +' : ' '}${v - base})</small>` : ''}</span></div><div class="bar"><i class="${g}" style="transform:scaleX(${(v || 0) / 100})"></i></div></div>`;
  }).join('');
}

/** Torre de constancia en el DOM: un [data-block] por sesión diaria (espejo accesible; la física los mueve en la piel clásica). */
function renderTorre() {
  const host = $('#torre');
  const days = store.routines.slice(-TOWER.goal);
  const keep = new Set(days.map(r => 'd-' + r.day));
  host.querySelectorAll('[data-block]').forEach(el => { if (!keep.has(el.dataset.pid)) el.remove(); });
  days.forEach(r => {
    if (host.querySelector(`[data-pid="d-${r.day}"]`)) return;
    const el = document.createElement('i');
    el.dataset.block = ''; el.dataset.pid = 'd-' + r.day;
    el.style.setProperty('--pb', r.score >= 70 ? 'var(--ok)' : r.score >= 45 ? 'var(--c4)' : 'var(--c1)');
    host.appendChild(el);
  });
  const n = store.routines.length;
  $('#torre-txt').textContent = `Torre de constancia: ${Math.min(n, TOWER.goal)} de ${TOWER.goal} días${n > TOWER.goal ? ` (${n} en total)` : ''}.`;
  host.setAttribute('aria-label', $('#torre-txt').textContent);
}

/** En la piel clásica, la torre cae con física cuando se abre el Diario. */
function mountTorreClassic() {
  if (torrePhys) { torrePhys.destroy(); torrePhys = null; }
  if (is3d() || !$('#diario').open) return;
  const host = $('#torre');
  torrePhys = mountPhysics(host, {
    use3d: false,
    specs: (w) => towerSpecs(store.routines, { width: w }).map(s => ({ ...s, kind: 'day' })),
    walls: (w, h) => [{ x: w / 2 - TOWER.block - 6, y: h / 2, w: 4, h: h * 3 }, { x: w / 2 + TOWER.block + 6, y: h / 2, w: 4, h: h * 3 }]
  });
}

function renderStations() {
  const { next } = sceneState();
  $$('#stations .station').forEach(b => {
    const id = b.dataset.station;
    b.classList.toggle('next', id === next);
    if (id === next) b.setAttribute('aria-description', 'Siguiente ejercicio de hoy'); else b.removeAttribute('aria-description');
    b.classList.toggle('done', id !== 'progreso' && playedToday(id));
    b.classList.toggle('off', id !== 'progreso' && !areas().includes(id));
    const best = b.querySelector('.st-best');
    if (best) best.textContent = id === 'progreso' ? `${store.routines.length} días` : `Mejor: ${bestOf(id)}`;
  });
}

function positionStations(pos) {
  $$('#stations .station').forEach(b => {
    const p = pos[b.dataset.station];
    if (p) b.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -20%)`;
  });
}

function clearPositions() { $$('#stations .station').forEach(b => { b.style.transform = ''; }); }

function select(id) {
  selected = id;
  $$('#stations .station').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.station === id)));
  const panel = $('#st-panel');
  if (!id) { panel.hidden = true; if (stage3d && is3d()) stage3d.focus(null); return; }
  const info = STATION_INFO[id] || { name: GAMES[id].name, area: GAMES[id].area, desc: GAMES[id].intro.replace(/<[^>]+>/g, '') };
  $('#st-title').textContent = info.name;
  $('#st-area').textContent = info.area;
  $('#st-desc').textContent = info.desc;
  $('#st-best').textContent = id === 'progreso' ? `${store.routines.length} sesiones diarias · ${trophies().length} trofeos` : `Mejor marca: ${bestOf(id)} · ${store.byGame(id).length} sesiones`;
  const play = $('#st-play');
  play.dataset.go = id === 'progreso' ? 'progreso' : id;
  play.textContent = id === 'progreso' ? 'Ver mi progreso' : 'Jugar';
  const help = $('#st-help');
  help.hidden = id === 'progreso';
  if (id !== 'progreso') help.dataset.help = id;
  panel.hidden = false;
  if (stage3d && is3d()) stage3d.focus(id);
}

export const mundo = {
  /** @param {{ trophies: () => string[] }} deps */
  init(deps = {}) {
    if (deps.trophies) trophies = deps.trophies;
    $('#hoy-start').addEventListener('click', () => { select(null); sesion.start('diaria'); });
    $('#stations').addEventListener('click', e => {
      const b = e.target.closest('.station'); if (!b) return;
      select(selected === b.dataset.station ? null : b.dataset.station);
    });
    // Flechas: moverse entre estaciones con el teclado.
    $('#stations').addEventListener('keydown', e => {
      const list = $$('#stations .station'); const k = list.indexOf(document.activeElement);
      if (k < 0) return;
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (step) { e.preventDefault(); list[(k + step + list.length) % list.length].focus(); }
    });
    $('#st-close').addEventListener('click', () => select(null));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && selected && !$('#v-hoy').hidden) select(null); });
    $('#diario').addEventListener('toggle', mountTorreClassic);
    registerStage('hoy', {
      host: '#mundo-stage',
      create: host => (stage3d = createMundoStage(host, { getState: sceneState, onProject: positionStations }))
    });
    // La instancia 3D se conserva (skin.js la cachea): al volver a Pixel-3D se reutiliza.
    onSkinChange(() => { if (!is3d()) clearPositions(); });
  },

  render() {
    $('#hoy-greet').textContent = greeting();
    try { $('#hoy-date').textContent = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }) + ` · ${areas().length} juegos`; } catch (e) { $('#hoy-date').textContent = ''; }
    const done = store.trainedToday();
    $('#hoy-done').hidden = !done;
    $('#hoy-start').textContent = done ? 'Entrenar otra vez' : 'Comenzar sesión de hoy';
    $('#hoy-games').innerHTML = areas().map((g, k) => `<div class="${playedToday(g) ? 'done' : ''}"><i style="background:var(--${GAMES[g].color})">${k + 1}</i><div><b>${GAMES[g].name}</b><small>${GAMES[g].area}</small></div></div>`).join('');
    const st = store.streak();
    $('#hoy-streak').textContent = `🔥 ${st}`;
    const side = $('#side-streak'); side.hidden = st === 0; side.textContent = `🔥 ${st} ${st === 1 ? 'día' : 'días'}`;
    renderCalendar();
    const gi = globalIndex(); $('#hoy-im').textContent = gi ?? '–';
    renderImBars($('#hoy-bars'));
    renderTorre();
    renderStations();
    if (!is3d()) clearPositions();
    if (stage3d && is3d()) stage3d.refresh();
    if ($('#diario').open) mountTorreClassic();
  },

  leave() {
    select(null);
    if (torrePhys) { torrePhys.destroy(); torrePhys = null; }
  }
};
