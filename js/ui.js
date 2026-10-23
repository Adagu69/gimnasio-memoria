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
  const first = $('#modal-body input') || act.querySelector('.primary') || act.querySelector('button');
  if (first) first.focus();
}

export function closeModal() {
  const m = modal();
  m.hidden = true;
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal().hidden) closeModal();
});

/* ---------- Toast ---------- */
let toastTimer = null;
export function toast(text, ms = 2400) {
  const t = $('#toast');
  t.textContent = text;
  t.hidden = false;
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
