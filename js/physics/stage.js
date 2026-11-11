// stage.js — monta una escena de física decorativa (Matter.js) en un contenedor DOM.
// Piel Pixel-3D: los cuerpos se dibujan como vóxeles con el motor 3D compartido (bridge3d).
// Piel clásica: cada cuerpo es un elemento DOM movido con transform (bridge-dom).
// Solo se usa DESPUÉS de una tarea (tarjeta de resultado, resultados, torre): nunca durante OBSERVA/TU TURNO.
import * as THREE from 'three';
import { createWorld } from './world2d.js';
import { syncElements } from './bridge-dom.js';
import { syncMeshes } from './bridge3d.js';
import * as engine from '../three/engine.js';
import { addLights, box, toon, voxelSprite, disposeTree } from '../three/voxel.js';
import { palette } from '../three/palette.js';
import { reducedMotion } from '../three/tween.js';
import { SPRITES, SPRITE_COLORS, drawSprite } from '../games/sprites.js';

const STAR = ['.....yy.....', '.....yy.....', '....yyyy....', 'yyyyyyyyyyyy', '.yyyyyyyyyy.', '..yyyyyyyy..',
  '...yyyyyy...', '..yyyyyyyy..', '..yyy..yyy..', '.yyy....yyy.', '.yy......yy.', '............'];

const camelVar = v => v.replace(/^--/, '').replace(/-(\w)/g, (_, c) => c.toUpperCase());

/** Color de un cuerpo: spec.data.css es el nombre de una variable CSS (p. ej. '--c4'). */
function cssVarOf(spec) { return (spec.data && spec.data.css) || '--accent'; }

function meshFor(spec, pal) {
  const color = pal[camelVar(cssVarOf(spec))] || pal.accent;
  if (spec.kind === 'star') { const m = voxelSprite(STAR, { y: '#f2c037' }, { px: spec.w / 12, depth: 3 }); return m; }
  if (spec.kind === 'obj' && spec.data.obj && SPRITES[spec.data.obj]) return voxelSprite(SPRITES[spec.data.obj], SPRITE_COLORS, { px: spec.w / 12, depth: 3 });
  if (spec.kind === 'token') {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(spec.w / 2, spec.w / 2, spec.w * 0.5, 10), toon(color));
    m.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(m); return g;
  }
  return box(spec.w * 0.96, spec.h * 0.96, spec.w * 0.96, color);
}

function elementFor(host, spec) {
  let el = host.querySelector(`[data-pid="${spec.id}"]`);
  if (!el) {
    el = document.createElement('i');
    el.dataset.pid = spec.id;
    host.appendChild(el);
  }
  el.classList.add('pb', 'pb-' + spec.kind);
  el.setAttribute('aria-hidden', 'true');
  el.style.width = spec.w + 'px'; el.style.height = spec.h + 'px';
  el.style.setProperty('--pb', `var(${cssVarOf(spec)})`);
  if (spec.kind === 'obj' && spec.data.obj && !el.querySelector('canvas')) {
    const c = document.createElement('canvas');
    drawSprite(c, spec.data.obj);
    el.appendChild(c);
  }
  return el;
}

/**
 * @param {HTMLElement} host
 * @param {{ specs: Function|Array, settled?: Function|Array, walls?: Function|Array, use3d: boolean, count?: number }} cfg
 *   specs/settled/walls pueden ser funciones (w, h) → array, para adaptarse al tamaño del contenedor.
 * @returns {{ destroy: () => void }}
 */
export function mountPhysics(host, { specs, settled = [], walls = [], use3d, count }) {
  const w = Math.max(40, Math.round(host.clientWidth)), h = Math.max(40, Math.round(host.clientHeight));
  const resolve = v => (typeof v === 'function' ? v(w, h) : v);
  const dyn = resolve(specs), rest = resolve(settled);
  const world = createWorld({ width: w, height: h, walls: resolve(walls) });
  world.add(rest); world.settle(1200);
  world.add(dyn);
  if (reducedMotion()) world.settle(1200);
  host.dataset.physicsCount = String(count ?? dyn.length + rest.length);
  const all = [...rest, ...dyn];
  let raf = 0, destroyed = false, mounted3d = false;

  if (use3d) {
    const pal = palette();
    const scene = new THREE.Scene();
    scene.background = pal.surface2.clone();
    const camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -1000, 1000);
    camera.position.set(0, h * 0.18, 400); camera.lookAt(0, 0, 0);
    addLights(scene, Math.max(w, h));
    const meshes = new Map();
    all.forEach(s => { const m = meshFor(s, pal); meshes.set(s.id, m); scene.add(m); });
    const opts = { scale: 1, originX: w / 2, originY: h / 2 };
    syncMeshes(world.snapshot(), meshes, opts);
    mounted3d = engine.mount(host, {
      scene, camera, pixelSize: 3,
      resize() { /* tamaño fijo durante la vida de la tarjeta */ },
      tick(dt) {
        if (world.asleep()) return false;
        world.step(dt); syncMeshes(world.snapshot(), meshes, opts);
        return true;
      },
      // La escena es de un solo uso: al desmontarla se liberan mallas, materiales y la sombra.
      onUnmount() { disposeTree(scene); }
    });
    if (!mounted3d) disposeTree(scene);
  }

  if (!mounted3d) {
    const els = new Map(all.map(s => [s.id, elementFor(host, s)]));
    syncElements(world.snapshot(), els);
    let last = 0;
    const loop = t => {
      raf = 0;
      if (destroyed) return;
      const dt = last ? Math.min(100, t - last) : 1000 / 60; last = t;
      world.step(dt); syncElements(world.snapshot(), els);
      if (!world.asleep()) raf = requestAnimationFrame(loop);
    };
    if (!world.asleep()) raf = requestAnimationFrame(loop);
  }

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      if (mounted3d) engine.unmount(host);
      world.clear();
      host.querySelectorAll('.pb[data-pid]').forEach(el => { if (!el.hasAttribute('data-block')) el.remove(); });
      delete host.dataset.physicsCount;
    }
  };
}
