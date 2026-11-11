// router.js — muestra una vista a la vez y avisa a quien lo necesite.
import { $, $$ } from './ui.js';

export const VIEWS = ['bienvenida', 'config', 'sesion', 'resultados', 'plan', 'hoy', 'juegos', 'pares', 'secuencia', 'nback', 'palacio', 'progreso', 'planes', 'ajustes'];
const FOCUS = ['bienvenida', 'config', 'sesion', 'resultados', 'plan']; // pantalla completa, sin menú

const enterHooks = {};
const leaveHooks = {};
let current = null;

export function onEnter(view, fn) { (enterHooks[view] ||= []).push(fn); }
export function onLeave(view, fn) { (leaveHooks[view] ||= []).push(fn); }

export function go(view, params = {}) {
  if (!VIEWS.includes(view)) view = 'hoy';
  if (current && leaveHooks[current]) leaveHooks[current].forEach(fn => fn());
  VIEWS.forEach(v => { $('#v-' + v).hidden = v !== view; });
  $('#app').hidden = FOCUS.includes(view);
  document.body.classList.toggle('focus-mode', FOCUS.includes(view));
  // Entrada "desde el valor actual": se fija el estado inicial y, al siguiente frame, la transición
  // lleva la vista a su reposo. Si el usuario cambia de vista a mitad, la transición se redirige sin salto.
  if (view !== current) enterAnim($('#v-' + view));
  const navFor = { pares: 'hoy', secuencia: 'hoy', nback: 'hoy', palacio: 'hoy', planes: 'ajustes' };
  $$('.topnav nav button').forEach(b => {
    if (b.dataset.go === (navFor[view] || view)) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  current = view;
  if (enterHooks[view]) enterHooks[view].forEach(fn => fn(params));
  window.scrollTo({ top: 0 });
}

export function currentView() { return current; }

/** Marca el estado inicial (data-enter) y lo quita en el siguiente frame para que la transición CSS corra. */
export function enterAnim(el) {
  if (!el) return;
  el.setAttribute('data-enter', '');
  void el.offsetWidth; // fuerza el cálculo de estilos con el estado inicial
  requestAnimationFrame(() => el.removeAttribute('data-enter'));
}

// Efecto de borde de la barra superior: aparece solo cuando hay contenido pasando por debajo.
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => { document.body.classList.toggle('scrolled', window.scrollY > 4); ticking = false; });
}, { passive: true });

// Delegación global: cualquier [data-go] navega.
document.addEventListener('click', e => {
  const b = e.target.closest('[data-go]');
  if (b) go(b.dataset.go);
});
