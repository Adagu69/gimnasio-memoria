// board.js — base común de las escenas de tablero (Pares, Secuencia, N-Back).
// Cámara ORTOGRÁFICA fija e inclinada: todos los estímulos se ven del mismo tamaño en cualquier posición
// (con perspectiva los lejanos se verían más pequeños y la medida quedaría sesgada). Sin movimiento de cámara
// ni elementos ambientales: nada compite por la atención durante la codificación.
import * as THREE from 'three';
import { fitOrtho, placeOnPlane } from '../anchor.js';
import { addLights, box } from '../voxel.js';
import { palette } from '../palette.js';
import { invalidate } from '../engine.js';

export const ELEVATION = 50; // suficiente para ver el volumen de las piezas sin que se tapen entre sí

/**
 * Crea escena, cámara, luces y mesa. `observe(fn)` vigila el DOM del tablero (MutationObserver) solo
 * mientras la escena está montada; `relayout(fn)` se llama tras cada cambio de tamaño.
 */
export function createBoard(host, { tableToken = 'surface2' } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -4000, 4000);
  const lights = addLights(scene, 600);
  let pal = palette();
  scene.background = pal.surface.clone();
  const table = box(1, 10, 1, pal[tableToken], { cast: false });
  table.position.y = -5;
  scene.add(table);

  const relayouts = [];
  const observers = [];

  const base = {
    scene, camera, table, host,
    get pal() { return pal; },
    refreshPalette() {
      pal = palette();
      scene.background = pal.surface.clone();
      table.material.color.copy(pal[tableToken]);
    },
    /** Rectángulo DOM → { x, z, w, d } en el plano y = planeY. */
    place(el, planeY = 0) {
      return placeOnPlane(camera, el.getBoundingClientRect(), host.getBoundingClientRect(), planeY);
    },
    onRelayout(fn) { relayouts.push(fn); },
    /** Registra un MutationObserver que se conecta al montar y se desconecta al desmontar. */
    observe(target, options, fn) { observers.push({ target, options, fn, mo: null }); },
    // --- interfaz de "stage" para engine.js ---
    resize(w, h) {
      fitOrtho(camera, w, h, ELEVATION);
      lights.fit(Math.max(w, h));
      table.scale.set(w * 4, 10, h * 4);
      relayouts.forEach(fn => fn());
      invalidate();
    },
    onMount() {
      base.refreshPalette();
      observers.forEach(o => { o.mo = new MutationObserver(o.fn); o.mo.observe(o.target, o.options); o.fn([]); });
    },
    onUnmount() {
      observers.forEach(o => { if (o.mo) o.mo.disconnect(); o.mo = null; });
    }
  };
  return base;
}

/** Libera los materiales de un objeto. Geometrías y texturas son compartidas (cachés) y no se tocan. */
export function disposeObject(obj) {
  obj.traverse(o => {
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
  });
}
