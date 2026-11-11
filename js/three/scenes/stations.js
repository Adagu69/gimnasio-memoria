// stations.js — maquetas vóxel de cada estación del gimnasio (mundo y tarjetas de sesión).
// Cada maqueta ocupa unos 2 × 2 unidades, centrada en el origen y apoyada en y = 0.
import * as THREE from 'three';
import { box, toon } from '../voxel.js';
import { CORSI_BLOCKS } from '../../games/corsi-layout.js';

export const STATION_IDS = ['pares', 'secuencia', 'nback', 'palacio', 'progreso'];

function add(g, w, h, d, color, x = 0, y = 0, z = 0) {
  const m = box(w, h, d, color);
  m.position.set(x, y + h / 2, z);
  g.add(m);
  return m;
}

const BUILDERS = {
  pares(g, pal) {
    add(g, 2, 0.5, 1.6, pal.wood);
    const faces = [pal.c1, null, pal.c3, pal.c4, null, pal.c1];
    faces.forEach((c, i) => add(g, 0.45, 0.06, 0.55, c || pal.accentSoft, -0.6 + (i % 3) * 0.6, 0.5, -0.35 + Math.floor(i / 3) * 0.7));
  },
  secuencia(g, pal) {
    add(g, 2, 0.2, 2, pal.board);
    CORSI_BLOCKS.forEach((b, i) => {
      const lit = i === 3;
      const m = add(g, 0.28, lit ? 0.32 : 0.22, 0.28, lit ? pal.accent : pal.block, (b.x - 0.5) * 1.8, 0.2, (b.y - 0.5) * 1.8);
      if (lit) { m.material.emissive.copy(pal.accent); m.material.emissiveIntensity = 0.6; }
    });
  },
  nback(g, pal) {
    add(g, 2, 0.15, 2, pal.board);
    for (let i = 0; i < 9; i++) add(g, 0.52, 0.08, 0.52, pal.surface2, -0.6 + (i % 3) * 0.6, 0.15, -0.6 + Math.floor(i / 3) * 0.6);
    add(g, 0.3, 0.22, 0.3, pal.accent, 0.6, 0.23, -0.6);
  },
  palacio(g, pal) {
    add(g, 1.6, 1.1, 1.3, pal.wall);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.8, 4), toon(pal.c1));
    roof.rotation.y = Math.PI / 4; roof.position.y = 1.5; roof.castShadow = true; g.add(roof);
    add(g, 0.4, 0.65, 0.05, pal.wood, 0, 0, 0.66);
    add(g, 0.3, 0.3, 0.05, pal.c6, -0.5, 0.5, 0.66);
  },
  progreso(g, pal) {
    add(g, 1.8, 0.15, 1.1, pal.wood);
    add(g, 0.1, 1.4, 1.1, pal.wood, -0.85); add(g, 0.1, 1.4, 1.1, pal.wood, 0.85);
    add(g, 1.8, 0.08, 1.1, pal.wood, 0, 0.75, 0);
    add(g, 0.3, 0.3, 0.3, pal.gold, -0.4, 0.15, 0); add(g, 0.12, 0.25, 0.12, pal.gold, -0.4, 0.45, 0);
  }
};

/** Devuelve un grupo con la maqueta de la estación. */
export function buildStation(id, pal) {
  const g = new THREE.Group();
  g.name = id;
  (BUILDERS[id] || BUILDERS.progreso)(g, pal);
  return g;
}
