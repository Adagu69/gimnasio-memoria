// palacio.js (escena) — habitación vóxel con 12 lugares en ruta fija. La cámara (en perspectiva, a la altura de
// una persona) recorre la ruta siguiendo #mp-stage[data-locus]; el objeto de #mp-stage[data-obj] aparece en el
// lugar actual como un dibujo pixel art extruido en vóxeles. Los tiempos los fija js/games/palacio.js.
import * as THREE from 'three';
import { addLights, box, voxelSprite } from '../voxel.js';
import { palette } from '../palette.js';
import { tween, ease } from '../tween.js';
import { invalidate } from '../engine.js';
import { LOCI, TIMING } from '../../games/palacio-logic.js';
import { SPRITES, SPRITE_COLORS } from '../../games/sprites.js';

const ROOM = Object.freeze({ w: 16, d: 12, h: 3.2 });
/** Altura (en unidades) donde se deposita el objeto en cada lugar. */
const ANCHOR_Y = Object.freeze({
  perchero: 2.1, espejo: 1.6, sofa: 1.2, lampara: 2.4, ventana: 1.7, estanteria: 1.5,
  chimenea: 1.9, piano: 1.5, cama: 1.1, baul: 1.2, mesa: 1.3, alfombra: 0.7
});
const QUESTION = ['....bbbb....', '...bbbbbb...', '..bb....bb..', '........bb..', '.......bb...', '......bb....',
  '.....bb.....', '.....bb.....', '............', '.....bb.....', '.....bb.....', '............'];
const OVERVIEW = { eye: new THREE.Vector3(0, 10.5, 12.5), at: new THREE.Vector3(0, 0, -0.5) };

const worldOf = l => ({ x: (l.plan.x - 0.5) * ROOM.w, z: (l.plan.y - 0.5) * ROOM.d });

/** Dirección horizontal desde el lugar hacia donde se coloca la cámara (hacia el centro de la sala). */
function facing(l) {
  if (l.id === 'alfombra') return { dx: 0, dz: 1 };
  const p = worldOf(l); const len = Math.hypot(p.x, p.z) || 1;
  return { dx: -p.x / len, dz: -p.z / len };
}

function furniture(id, pal) {
  const g = new THREE.Group();
  const add = (w, h, d, color, x = 0, y = 0, z = 0) => { const m = box(w, h, d, color); m.position.set(x, y + h / 2, z); g.add(m); return m; };
  const dark = new THREE.Color(SPRITE_COLORS.k), white = new THREE.Color('#f4f1ea');
  switch (id) {
    case 'perchero': add(0.6, 0.1, 0.6, pal.wood); add(0.14, 2.2, 0.14, pal.wood); add(0.8, 0.1, 0.1, pal.wood, 0, 1.9, 0); break;
    case 'espejo': add(1.1, 1.7, 0.12, pal.wood, 0, 0.6, 0); add(0.9, 1.5, 0.05, new THREE.Color(SPRITE_COLORS.c), 0, 0.7, 0.07); break;
    case 'sofa': add(2.4, 0.5, 1, pal.c1); add(2.4, 0.8, 0.3, pal.c1, 0, 0.4, -0.35); add(0.3, 0.7, 1, pal.c1, -1.05); add(0.3, 0.7, 1, pal.c1, 1.05); break;
    case 'lampara': add(0.6, 0.1, 0.6, dark); add(0.1, 1.9, 0.1, dark); add(0.8, 0.5, 0.8, pal.warn, 0, 1.9, 0); break;
    case 'ventana': add(1.9, 1.5, 0.15, white, 0, 1, 0); add(1.6, 1.2, 0.05, new THREE.Color(SPRITE_COLORS.c), 0, 1.15, 0.08); break;
    case 'estanteria': add(1.8, 2.3, 0.5, pal.wood); [0.6, 1.2, 1.8].forEach(y => add(1.6, 0.06, 0.45, white, 0, y, 0.05)); break;
    case 'chimenea': add(2, 1.5, 0.7, pal.c1); add(1.1, 0.8, 0.1, dark, 0, 0, 0.32); add(0.6, 0.4, 0.1, pal.warn, 0, 0.05, 0.36); add(2.3, 0.15, 0.85, white, 0, 1.5, 0); break;
    case 'piano': add(1.9, 1.1, 0.8, dark); add(1.7, 0.08, 0.3, white, 0, 0.75, 0.45); break;
    case 'cama': add(1.6, 0.5, 2.2, pal.wood); add(1.5, 0.2, 1.6, pal.c2, 0, 0.5, 0.25); add(1.2, 0.25, 0.45, white, 0, 0.5, -0.75); break;
    case 'baul': add(1.3, 0.75, 0.75, pal.wood); add(1.35, 0.15, 0.8, new THREE.Color(SPRITE_COLORS.N), 0, 0.75, 0); break;
    case 'mesa': add(1.5, 0.12, 1, pal.wood, 0, 0.85, 0); [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]].forEach(([x, z]) => add(0.1, 0.85, 0.1, pal.wood, x, 0, z)); break;
    case 'alfombra': add(3.2, 0.04, 2.2, pal.c5); add(2.6, 0.05, 1.6, pal.c4); break;
    default: break;
  }
  return g;
}

export function createPalacioStage(host) {
  const stage = host;
  let pal = palette();
  const scene = new THREE.Scene();
  scene.background = pal.bg.clone();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  const look = OVERVIEW.at.clone();
  camera.position.copy(OVERVIEW.eye); camera.lookAt(look);
  const lights = addLights(scene, 12);

  // Habitación: suelo, tres paredes y una pared frontal baja (vista de "diorama" desde fuera).
  const floor = box(ROOM.w, 0.2, ROOM.d, pal.floor, { cast: false }); floor.position.y = -0.1; scene.add(floor);
  const walls = [
    box(ROOM.w, ROOM.h, 0.3, pal.wall), box(0.3, ROOM.h, ROOM.d, pal.wall), box(0.3, ROOM.h, ROOM.d, pal.wall), box(ROOM.w, 0.8, 0.3, pal.wall)
  ];
  walls[0].position.set(0, ROOM.h / 2, -ROOM.d / 2 - 0.15);
  walls[1].position.set(-ROOM.w / 2 - 0.15, ROOM.h / 2, 0);
  walls[2].position.set(ROOM.w / 2 + 0.15, ROOM.h / 2, 0);
  walls[3].position.set(0, 0.4, ROOM.d / 2 + 0.15);
  walls.forEach(w => { w.receiveShadow = true; scene.add(w); });

  LOCI.forEach(l => {
    const f = furniture(l.id, pal);
    const p = worldOf(l); const d = facing(l);
    f.position.set(p.x, 0, p.z);
    f.rotation.y = Math.atan2(d.dx, d.dz);
    scene.add(f);
  });

  // Marca del lugar actual en el suelo.
  const marker = box(1.4, 0.05, 1.4, pal.accent, { cast: false });
  marker.visible = false; scene.add(marker);

  /** id del objeto → malla vóxel (se crean al usarse y se reutilizan). */
  const objects = new Map();
  const question = voxelSprite(QUESTION, SPRITE_COLORS, { px: 0.085 });
  question.visible = false; scene.add(question);
  function objectMesh(id) {
    if (!objects.has(id) && SPRITES[id]) {
      const m = voxelSprite(SPRITES[id], SPRITE_COLORS, { px: 0.085 });
      m.visible = false; scene.add(m); objects.set(id, m);
    }
    return objects.get(id);
  }

  function viewpoint(i) {
    if (i < 0 || !LOCI[i]) return OVERVIEW;
    const l = LOCI[i], p = worldOf(l), d = facing(l), y = ANCHOR_Y[l.id];
    return { eye: new THREE.Vector3(p.x + d.dx * 3.6, Math.max(2.3, y + 1.1), p.z + d.dz * 3.6), at: new THREE.Vector3(p.x, y, p.z) };
  }

  let cur = null;
  function moveTo(i, instant) {
    const v = viewpoint(i);
    const e0 = camera.position.clone(), a0 = look.clone();
    tween({
      key: camera, ms: instant ? 0 : TIMING.MOVE_MS, ease: ease.inOutSine,
      update: k => { camera.position.lerpVectors(e0, v.eye, k); look.lerpVectors(a0, v.at, k); camera.lookAt(look); }
    });
  }

  function place(mesh, i) {
    const l = LOCI[i], p = worldOf(l), d = facing(l);
    mesh.position.set(p.x + d.dx * 0.6, ANCHOR_Y[l.id] + 0.35, p.z + d.dz * 0.6);
    mesh.rotation.y = Math.atan2(d.dx, d.dz);
    mesh.visible = true;
  }

  function sync(instant) {
    const i = Number(stage.dataset.locus ?? -1);
    const obj = stage.dataset.obj || '';
    const phase = stage.dataset.phase || 'idle';
    if (i !== cur) { cur = i; moveTo(i, instant); }
    objects.forEach(m => { m.visible = false; });
    question.visible = false;
    marker.visible = i >= 0;
    if (i >= 0 && LOCI[i]) {
      const p = worldOf(LOCI[i]); marker.position.set(p.x + facing(LOCI[i]).dx * 1.2, 0.03, p.z + facing(LOCI[i]).dz * 1.2);
      if (obj) { const m = objectMesh(obj); if (m) place(m, i); }
      else if (phase === 'turno') place(question, i);
    }
    invalidate();
  }

  let mo = null;
  return {
    scene, camera, normalEdge: 0.25, depthEdge: 0.35,
    resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); lights.fit(12); invalidate(); },
    onMount() {
      pal = palette(); scene.background = pal.bg.clone();
      mo = new MutationObserver(() => sync(false));
      mo.observe(stage, { attributes: true, attributeFilter: ['data-locus', 'data-obj', 'data-phase'] });
      cur = null; sync(true);
    },
    onUnmount() { if (mo) mo.disconnect(); mo = null; }
  };
}
