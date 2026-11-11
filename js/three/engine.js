// engine.js — un solo WebGLRenderer para toda la app.
// - Monta su canvas en el contenedor (.stage3d) de la vista activa; una vista a la vez.
// - Post-proceso Pixel-3D: RenderPixelatedPass (baja resolución + contornos) + OutputPass (sRGB).
// - Dibuja bajo demanda: solo mientras hay interpolaciones o la escena pide más frames; se pausa con la pestaña oculta.
// - Si WebGL falla, se pierde el contexto o el rendimiento es bajo, avisa para volver a la piel clásica.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { updateTweens, setWake, clearTweens } from './tween.js';

export const PIXEL_SIZE = 3;

const params = (() => { try { return new URLSearchParams(location.search); } catch (e) { return new URLSearchParams(); } })();
const PERF = {
  enabled: params.get('perf') !== 'off',
  thresholdMs: Number(params.get('perfThreshold')) >= 0 && params.has('perfThreshold') ? Number(params.get('perfThreshold')) : 50,
  window: 60
};

let renderer = null;
let failed = false;
let current = null;        // { host, stage, composer, pass, ro }
let raf = 0;
let last = 0;
let frames = 0;
const samples = [];
const failListeners = new Set();

export function onFail(fn) { failListeners.add(fn); }
export function hasFailed() { return failed; }
export function available() { return !!create(); }
export function currentHost() { return current ? current.host : null; }

function create() {
  if (renderer) return renderer;
  if (failed) return null;
  try {
    const probe = document.createElement('canvas');
    if (!probe.getContext('webgl2')) throw new Error('WebGL2 no disponible');
    const canvas = document.createElement('canvas');
    canvas.className = 'gl';
    canvas.setAttribute('aria-hidden', 'true');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fail('Se perdió el contexto gráfico'); });
  } catch (e) {
    failed = true;
    renderer = null;
  }
  return renderer;
}

/** Desactiva la capa 3D (la app sigue con la piel clásica). */
export function fail(reason = 'error') {
  if (failed) return;
  failed = true;
  if (current) unmountCurrent();
  try { if (renderer) renderer.dispose(); } catch (e) { /* el contexto ya no existe */ }
  renderer = null;
  failListeners.forEach(fn => fn(reason));
}

/**
 * Monta una escena en un contenedor. `stage` = { scene, camera, resize?(w,h), tick?(dt,t)→bool,
 * onMount?(), onUnmount?(), pixelSize?, normalEdge?, depthEdge? }.
 */
export function mount(host, stage) {
  const r = create();
  if (!r || !host || !stage) return false;
  if (current && current.host === host && current.stage === stage) { invalidate(); return true; }
  if (current) unmountCurrent();
  try {
    host.prepend(r.domElement);
    const composer = new EffectComposer(r);
    const pass = new RenderPixelatedPass(stage.pixelSize || PIXEL_SIZE, stage.scene, stage.camera,
      { normalEdgeStrength: stage.normalEdge ?? 0.35, depthEdgeStrength: stage.depthEdge ?? 0.5 });
    composer.addPass(pass);
    composer.addPass(new OutputPass());
    const ro = new ResizeObserver(resize);
    current = { host, stage, composer, pass, ro };
    ro.observe(host);
    resize();
    host.classList.add('ready');
    if (stage.onMount) stage.onMount();
    invalidate();
    return true;
  } catch (e) {
    if (r.domElement.parentNode === host) r.domElement.remove();
    fail('No se pudo crear la escena');
    return false;
  }
}

export function unmount(host) {
  if (current && (!host || current.host === host)) unmountCurrent();
}

function unmountCurrent() {
  const c = current;
  current = null;
  if (raf) { cancelAnimationFrame(raf); raf = 0; }
  last = 0;
  clearTweens();
  c.ro.disconnect();
  c.host.classList.remove('ready');
  try { if (c.stage.onUnmount) c.stage.onUnmount(); } catch (e) { /* la escena se descarta igual */ }
  c.pass.dispose();
  c.composer.dispose();
  if (renderer && renderer.domElement.parentNode === c.host) renderer.domElement.remove();
}

function resize() {
  if (!current || !renderer) return;
  const { host } = current;
  const w = Math.max(1, Math.round(host.clientWidth)), h = Math.max(1, Math.round(host.clientHeight));
  renderer.setSize(w, h, false);
  current.composer.setSize(w, h);
  if (current.stage.resize) current.stage.resize(w, h);
  invalidate();
}

/** Pide un frame (si no hay uno pendiente). */
export function invalidate() {
  if (current && !raf && !failed && !document.hidden) raf = requestAnimationFrame(frame);
}

function frame(t) {
  raf = 0;
  if (!current || failed) return;
  const continuous = last !== 0;
  const dt = continuous ? Math.min(100, t - last) : 1000 / 60;
  let more = false;
  try {
    const tw = updateTweens(t);
    more = (current.stage.tick ? current.stage.tick(dt, t) : false) || tw;
    current.composer.render(dt / 1000);
  } catch (e) {
    fail('Error al dibujar la escena');
    return;
  }
  frames++;
  document.documentElement.dataset.glFrames = String(frames);
  if (continuous) measure(dt);
  if (more) { last = t; raf = requestAnimationFrame(frame); } else { last = 0; }
}

/** Rendimiento: si la media de 60 frames seguidos supera el umbral, se vuelve a la piel clásica. */
function measure(dt) {
  if (!PERF.enabled) return;
  samples.push(dt);
  if (samples.length > PERF.window) samples.shift();
  if (samples.length === PERF.window) {
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    if (avg > PERF.thresholdMs) fail('Rendimiento bajo');
  }
}

setWake(invalidate);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; samples.length = 0; }
  else invalidate();
});
