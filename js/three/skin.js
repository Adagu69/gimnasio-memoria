// skin.js — decide la piel visual y monta la escena 3D de cada vista.
//   'pixel3d' (por defecto): escenas Three.js detrás del DOM; el DOM sigue siendo la verdad (clics, teclado, pruebas).
//   'clasico': solo DOM. Se usa si el usuario lo elige, si se pasa ?visual=clasico o si WebGL falla.
import { store } from '../store.js';
import * as engine from './engine.js';

const params = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); } })();
let skin = 'clasico';
const listeners = new Set();
/** vista → { host: selector | () => Element, create: (host) => stage, instance } */
const registry = new Map();

/** Preferencia efectiva: el parámetro ?visual= manda sobre el ajuste guardado. */
export function preference() {
  const p = params.get('visual');
  if (p === 'clasico' || p === 'pixel3d') return p;
  return store.settings.visual === 'clasico' ? 'clasico' : 'pixel3d';
}

function compute() {
  if (preference() === 'clasico' || engine.hasFailed()) return 'clasico';
  return engine.available() ? '3d' : 'clasico';
}

function apply() {
  const b = document.body;
  b.classList.toggle('skin-3d', skin === '3d');
  b.classList.toggle('skin-clasico', skin !== '3d');
}

function emit(reason) { listeners.forEach(fn => fn(skin, reason)); }

export function initSkin() {
  skin = compute();
  apply();
  engine.onFail(() => {
    if (skin !== '3d') return;
    skin = 'clasico';
    apply();
    emit('fallo');
  });
}

export function is3d() { return skin === '3d'; }
export function onSkinChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Cambia la preferencia desde Ajustes ('pixel3d' | 'clasico'). */
export function setPreference(pref) {
  store.setSetting('visual', pref === 'clasico' ? 'clasico' : 'auto');
  const prev = skin;
  skin = compute();
  if (skin === prev) return;
  if (skin !== '3d') engine.unmount();
  apply();
  emit('usuario');
}

export function registerStage(view, { host, create }) {
  registry.set(view, { host, create, instance: null });
}

function hostOf(reg) { return typeof reg.host === 'function' ? reg.host() : document.querySelector(reg.host); }

/** Monta la escena registrada para la vista (si la piel es 3D). Devuelve true si quedó montada. */
export function attachView(view) {
  if (!is3d()) return false;
  const reg = registry.get(view);
  if (!reg) return false;
  const el = hostOf(reg);
  if (!el) return false;
  try {
    if (!reg.instance) reg.instance = reg.create(el);
  } catch (e) {
    engine.fail('No se pudo crear la escena');
    return false;
  }
  return engine.mount(el, reg.instance);
}

export function detachView(view) {
  const reg = registry.get(view);
  if (!reg) return;
  const el = hostOf(reg);
  if (el) engine.unmount(el);
}
