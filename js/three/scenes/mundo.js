// mundo.js (escena) — el gimnasio: isla isométrica con 5 estaciones FIJAS (nunca cambian de sitio), el camino
// del día entre las estaciones de la sesión diaria y la Torre de constancia con física (Matter.js).
// Las estaciones se eligen con botones DOM proyectados encima (anclaje 3D→DOM): ver js/views/mundo.js.
import * as THREE from 'three';
import { addLights, box, voxelSprite, disposeTree } from '../voxel.js';
import { palette } from '../palette.js';
import { tween, ease, reducedMotion } from '../tween.js';
import { invalidate } from '../engine.js';
import { worldToScreen } from '../anchor.js';
import { buildStation, STATION_IDS } from './stations.js';
import { createWorld } from '../../physics/world2d.js';
import { towerSpecs, TOWER } from '../../physics/presets.js';
import { syncMeshes } from '../../physics/bridge3d.js';

const TILE = 1.2, HALF = 5;               // isla de 11 × 11 baldosas
/** Posición (en baldosas) de cada estación. El bucle del camino es pares → secuencia → nback → palacio. */
export const STATION_TILES = Object.freeze({ pares: [-3, -3], secuencia: [3, -3], nback: [3, 3], palacio: [-3, 3], progreso: [0, 0] });
const LOOP_START = { pares: 0, secuencia: 6, nback: 12, palacio: 18 };
const DIR = new THREE.Vector3(1, 1.1, 1).normalize();
const FOCUS_ZOOM = 1.9, FOCUS_MS = 450;
const ARROW = ['yyyyyyyyyy', '.yyyyyyyy.', '..yyyyyy..', '...yyyy...', '....yy....'];
/** Altura de la flecha "siguiente": justo por encima de cada maqueta. */
const ARROW_Y = Object.freeze({ pares: 1.4, secuencia: 1.3, nback: 1.1, palacio: 2.5 });
// Vitrina física: torre (izquierda) y trofeos (derecha), en píxeles de Matter.
const SHELF_W = 92, PHYS_W = TOWER.width + 4 + SHELF_W, PHYS_SCALE = 0.0105;
const TOWER_POS = new THREE.Vector3(1.55, 0, -1.25);

/** Baldosas del perímetro (24) en el orden del bucle, empezando en la esquina de Pares. */
function perimeter() {
  const out = [];
  for (let x = -3; x < 3; x++) out.push([x, -3]);
  for (let z = -3; z < 3; z++) out.push([3, z]);
  for (let x = 3; x > -3; x--) out.push([x, 3]);
  for (let z = 3; z > -3; z--) out.push([-3, z]);
  return out;
}
const PERIM = perimeter();

const tilePos = ([x, z]) => new THREE.Vector3(x * TILE, 0, z * TILE);

function trophySpecs(ids) {
  return ids.map((id, k) => ({
    id: 't-' + id, kind: 'trophy', x: TOWER.width + 4 + 12 + (k % 4) * 21 + (k % 2) * 2, y: -(Math.floor(k / 4) + 1) * 40 - k * 6,
    w: 14, h: 18, data: { id }
  }));
}

/**
 * @param {HTMLElement} host
 * @param {{ getState: () => { areas:string[], played:Set<string>, next:string|null, routines:Array<{day:string,score:number}>, trophies:string[] },
 *           onProject: (pos: Record<string,{x:number,y:number}>) => void }} io
 */
export function createMundoStage(host, { getState, onProject }) {
  let pal = palette();
  const scene = new THREE.Scene();
  scene.background = pal.bg.clone();
  const camera = new THREE.OrthographicCamera(-10, 10, 7, -7, -100, 200);
  const lights = addLights(scene, 12);
  const target = new THREE.Vector3(0, 0.6, 0);
  let zoom = 1, size = { w: 1, h: 1 };
  const still = reducedMotion();

  function applyCamera() {
    camera.position.copy(target).addScaledVector(DIR, 60);
    camera.lookAt(target);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  // --- Isla ---
  const n = (HALF * 2 + 1) ** 2;
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(TILE, 0.4, TILE), new THREE.MeshToonMaterial({ color: 0xffffff }), n);
  tiles.receiveShadow = true;
  scene.add(tiles);
  function paintIsland() {
    const m = new THREE.Matrix4();
    let i = 0;
    for (let x = -HALF; x <= HALF; x++) for (let z = -HALF; z <= HALF; z++) {
      m.makeTranslation(x * TILE, -0.2, z * TILE);
      tiles.setMatrixAt(i, m);
      tiles.setColorAt(i, (x + z) % 2 === 0 ? pal.floor : pal.floor2);
      i++;
    }
    tiles.instanceMatrix.needsUpdate = true;
    if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
  }
  paintIsland();
  const rim = box((HALF * 2 + 1) * TILE + 0.3, 0.6, (HALF * 2 + 1) * TILE + 0.3, pal.wood, { cast: false });
  rim.position.y = -0.55; scene.add(rim);

  // --- Estaciones ---
  const stations = {};
  STATION_IDS.forEach(id => {
    const g = buildStation(id, pal);
    g.position.copy(tilePos(STATION_TILES[id]));
    if (id !== 'progreso') g.position.y = 0.05;
    scene.add(g);
    stations[id] = g;
  });

  // --- Camino del día ---
  const pathTiles = PERIM.map(t => {
    const m = box(TILE * 0.8, 0.08, TILE * 0.8, pal.surface2, { cast: false });
    m.position.copy(tilePos(t)); m.position.y = 0.04; m.visible = false;
    scene.add(m);
    return m;
  });

  // --- Flecha sobre la siguiente estación ---
  const arrow = voxelSprite(ARROW, { y: '#f2c037' }, { px: 0.09 });
  arrow.visible = false; scene.add(arrow);
  let arrowBase = new THREE.Vector3(), clock = 0;

  // --- Vitrina física: Torre de constancia + trofeos ---
  const shelf = new THREE.Group();
  shelf.position.copy(TOWER_POS);
  shelf.rotation.y = Math.PI / 4; // de frente a la cámara isométrica
  scene.add(shelf);
  const opts = { scale: PHYS_SCALE, originX: PHYS_W / 2, originY: TOWER.height };
  const goalH = (TOWER.goal / 2) * TOWER.block * PHYS_SCALE;
  [-1, 1].forEach(s => { const p = box(0.06, goalH + 0.2, 0.06, pal.line, { cast: false }); p.position.set(((s < 0 ? 0 : TOWER.width) - PHYS_W / 2) * PHYS_SCALE + s * 0.03, (goalH + 0.2) / 2, 0); shelf.add(p); });
  const flag = box(TOWER.width * PHYS_SCALE + 0.12, 0.06, 0.1, pal.gold, { cast: false });
  flag.position.set((TOWER.width / 2 - PHYS_W / 2) * PHYS_SCALE, goalH, 0); shelf.add(flag);
  let world = null;
  const meshes = new Map();

  function bodyMesh(spec) {
    if (spec.kind === 'trophy') {
      const g = new THREE.Group();
      const s = PHYS_SCALE;
      const cup = box(spec.w * s, spec.h * s * 0.55, spec.w * s, pal.gold); cup.position.y = spec.h * s * 0.2;
      const foot = box(spec.w * s * 0.7, spec.h * s * 0.25, spec.w * s * 0.7, pal.gold); foot.position.y = -spec.h * s * 0.3;
      g.add(cup, foot);
      return g;
    }
    const sc = spec.data.score ?? 0;
    const color = sc >= 70 ? pal.ok : sc >= 45 ? pal.c4 : pal.c1;
    return box(spec.w * PHYS_SCALE * 0.96, spec.h * PHYS_SCALE * 0.96, spec.w * PHYS_SCALE * 0.96, color);
  }

  function ensureWorld(state) {
    const specs = [...towerSpecs(state.routines), ...trophySpecs(state.trophies)];
    const fresh = !world;
    if (fresh) world = createWorld({ width: PHYS_W, height: TOWER.height, walls: [{ x: TOWER.width + 2, y: TOWER.height / 2, w: 4, h: TOWER.height * 3 }] });
    // Los días que salen de la ventana de 30 (y los logros que ya no cuentan) se quitan con su malla.
    const wanted = new Set(specs.map(s => s.id));
    world.remove(world.snapshot().map(b => b.id).filter(id => !wanted.has(id))).forEach(id => {
      const m = meshes.get(id);
      if (m) { shelf.remove(m); disposeTree(m); meshes.delete(id); }
    });
    // Solo se crean mallas para los cuerpos que el mundo aceptó de verdad.
    const added = new Set(world.add(specs));
    specs.filter(s => added.has(s.id)).forEach(s => { const m = bodyMesh(s); meshes.set(s.id, m); shelf.add(m); });
    // Al cargar, todo aparece ya asentado; después, solo cae lo nuevo (con movimiento reducido, también asentado).
    if (fresh || still) world.settle(1200);
    syncMeshes(world.snapshot(), meshes, opts);
  }

  // --- Proyección de las estaciones para los botones DOM ---
  // El rótulo va delante y por debajo de la maqueta (esquina hacia la cámara): no tapa la estación ni la flecha.
  const anchors = Object.fromEntries(STATION_IDS.map(id => [id, tilePos(STATION_TILES[id]).add(new THREE.Vector3(1.05, 0, 1.05))]));
  let lastKey = '';
  function project() {
    const pos = {};
    for (const id of STATION_IDS) { const p = worldToScreen(anchors[id], camera, size.w, size.h); pos[id] = { x: Math.round(p.x), y: Math.round(p.y) }; }
    const key = JSON.stringify(pos);
    if (key !== lastKey) { lastKey = key; onProject(pos); }
  }

  const stage = {
    scene, camera, normalEdge: 0.3, depthEdge: 0.45,

    /** Recalcula camino, flecha, torre y trofeos a partir del estado del store. */
    refresh() {
      const st = getState();
      pal = palette();
      scene.background = pal.bg.clone();
      paintIsland();
      pathTiles.forEach(m => { m.visible = false; });
      const loop = st.areas.filter(a => a in LOOP_START);
      for (let i = 0; i + 1 < loop.length; i++) {
        const a = LOOP_START[loop[i]], b = LOOP_START[loop[i + 1]];
        const lit = st.played.has(loop[i]) && st.played.has(loop[i + 1]);
        for (let k = (a + 1) % 24; k !== b; k = (k + 1) % 24) {
          const m = pathTiles[k];
          m.visible = true;
          m.material.color.copy(lit ? pal.gold : pal.surface2);
          m.material.emissive.copy(lit ? pal.gold : new THREE.Color(0));
          m.material.emissiveIntensity = lit ? 0.35 : 0;
        }
      }
      arrow.visible = !!st.next;
      if (st.next) { arrowBase = tilePos(STATION_TILES[st.next]).add(new THREE.Vector3(0, ARROW_Y[st.next] || 1.4, 0)); arrow.position.copy(arrowBase); arrow.rotation.y = Math.PI / 4; }
      ensureWorld(st);
      invalidate();
    },

    /** Acerca la cámara a una estación (o vuelve a la vista general con null). */
    focus(id) {
      const to = id ? tilePos(STATION_TILES[id]).add(new THREE.Vector3(0, 0.6, 0)) : new THREE.Vector3(0, 0.6, 0);
      const z1 = id ? FOCUS_ZOOM : 1;
      const from = target.clone(), z0 = zoom;
      tween({ key: camera, ms: FOCUS_MS, ease: ease.inOutSine, update: k => { target.lerpVectors(from, to, k); zoom = z0 + (z1 - z0) * k; applyCamera(); } });
    },

    resize(w, h) {
      size = { w, h };
      const aspect = w / h;
      const halfW = Math.max(10.8, 7.9 * aspect), halfH = halfW / aspect;
      // Encuadre desplazado hacia abajo: la isla sube y no queda bajo el HUD inferior.
      const shift = halfH * 0.14;
      camera.left = -halfW; camera.right = halfW; camera.top = halfH - shift; camera.bottom = -halfH - shift;
      lights.fit(14);
      applyCamera();
      lastKey = '';
    },

    tick(dt) {
      let more = false;
      if (world && !world.asleep()) { world.step(dt); syncMeshes(world.snapshot(), meshes, opts); more = true; }
      if (arrow.visible && !still) { clock += dt; arrow.position.y = arrowBase.y + Math.sin(clock / 260) * 0.15; more = true; }
      project();
      return more;
    },

    /** Al entrar, la cámara empieza siempre en la vista general (estaciones en su sitio de siempre). */
    onMount() { target.set(0, 0.6, 0); zoom = 1; applyCamera(); lastKey = ''; stage.refresh(); },
    /** Al salir del mundo la física queda dormida: ningún cuerpo se mueve mientras se juega. */
    onUnmount() { if (world) { world.settle(1200); syncMeshes(world.snapshot(), meshes, opts); } }
  };
  applyCamera();
  return stage;
}
