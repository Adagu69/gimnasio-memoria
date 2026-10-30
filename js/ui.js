// ui.js — utilidades de interfaz: selección, modal, toast, formato.

export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

export function fmtTime(secs) {
  return Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0');
}

export function fmtDate(t) {
  try { return new Date(t).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }); }
  catch (e) { return new Date(t).toLocaleString(); }
}

export function setMsg(el, text, cls = '') {
  el.textContent = text;
  el.className = 'msg' + (el.classList.contains('center') ? ' center' : '') + (cls ? ' ' + cls : '');
}

/* ---------- Modal ---------- */
const modal = () => $('#modal');
let lastFocus = null;

/**
 * showModal({title, html, actions:[{label, primary, onClick, keep}]})
 * Las acciones cierran el modal salvo que devuelvan false o tengan keep:true.
 */
export function showModal({ title, html, actions = [] }) {
  const m = modal();
  lastFocus = document.activeElement;
  // Consistencia espacial: el modal nace desde el control que lo abrió
  const box = m.querySelector('.modal-box');
  const r = lastFocus && lastFocus !== document.body ? lastFocus.getBoundingClientRect() : null;
  box.style.setProperty('--ox', r ? (100 * (r.left + r.width / 2) / window.innerWidth).toFixed(1) + '%' : '50%');
  box.style.setProperty('--oy', r ? (100 * (r.top + r.height / 2) / window.innerHeight).toFixed(1) + '%' : '50%');
  m.classList.remove('closing');
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = html;
  const act = $('#modal-actions');
  act.innerHTML = '';
  actions.forEach(a => {
    const b = document.createElement('button');
    b.className = 'btn' + (a.primary ? ' primary' : a.ghost ? ' ghost' : '');
    b.textContent = a.label;
    if (a.id) b.id = a.id;
    b.addEventListener('click', () => {
      const r = a.onClick ? a.onClick() : undefined;
      if (r !== false && !a.keep) closeModal();
    });
    act.appendChild(b);
  });
  m.hidden = false;
  enter(m);                                   // el material se materializa (escala + desenfoque → nítido)
  document.querySelector('main').classList.add('pushed'); // el fondo se empuja hacia atrás
  const first = $('#modal-body input') || act.querySelector('.primary') || act.querySelector('button');
  if (first) first.focus();
}

let closeTimer = null;
export function closeModal() {
  const m = modal();
  if (m.hidden) return;
  document.querySelector('main').classList.remove('pushed');
  // Sale por el mismo camino por el que entró; si se vuelve a abrir antes de terminar, se cancela el cierre.
  m.classList.add('closing');
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => { if (m.classList.contains('closing')) { m.hidden = true; m.classList.remove('closing'); } }, reducedMotion() ? 0 : 220);
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

export function reducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}

/** Fija el estado inicial (data-enter) y lo retira en el siguiente frame: la transición parte del valor actual. */
export function enter(el) {
  if (!el) return;
  el.setAttribute('data-enter', '');
  void el.offsetWidth;
  requestAnimationFrame(() => el.removeAttribute('data-enter'));
}

/** Vibración breve en móviles; se dispara en el mismo instante que el cambio visual y el sonido. */
export function haptic(ms = 10) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal().hidden) closeModal();
});

/* ---------- Toast ---------- */
let toastTimer = null;
export function toast(text, ms = 2400) {
  const t = $('#toast');
  t.textContent = text;
  if (t.hidden) { t.hidden = false; enter(t); }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms);
}

/* ---------- Mini gráfico de barras ---------- */
export function bars(vals, max) {
  if (!vals.length) return '<div class="bars empty">Sin sesiones todavía</div>';
  const m = max || Math.max(...vals, 1);
  return '<div class="bars" aria-hidden="true">' +
    vals.map(v => `<i style="height:${Math.max(4, Math.round(100 * v / m))}%"></i>`).join('') + '</div>';
}

export function avg(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0; }
