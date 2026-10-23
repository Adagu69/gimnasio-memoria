// router.js — muestra una vista a la vez y avisa a quien lo necesite.
import { $, $$ } from './ui.js';

export const VIEWS = ['home', 'rutina', 'pares', 'secuencia', 'nback', 'progreso', 'planes', 'ajustes'];

const enterHooks = {};
const leaveHooks = {};
let current = null;

export function onEnter(view, fn) { (enterHooks[view] ||= []).push(fn); }
export function onLeave(view, fn) { (leaveHooks[view] ||= []).push(fn); }

export function go(view, params = {}) {
  if (!VIEWS.includes(view)) view = 'home';
  if (current && leaveHooks[current]) leaveHooks[current].forEach(fn => fn());
  VIEWS.forEach(v => { $('#v-' + v).hidden = v !== view; });
  $$('nav button').forEach(b => {
    if (b.dataset.go === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  current = view;
  if (enterHooks[view]) enterHooks[view].forEach(fn => fn(params));
  window.scrollTo({ top: 0 });
}

export function currentView() { return current; }

// Delegación global: cualquier [data-go] navega.
document.addEventListener('click', e => {
  const b = e.target.closest('[data-go]');
  if (b) go(b.dataset.go);
});
