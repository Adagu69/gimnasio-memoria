// bridge3d.js — copia el estado de los cuerpos 2D (Matter, y hacia abajo, en píxeles) a mallas de Three.js
// situadas en un plano vertical (x a la derecha, y hacia arriba, en unidades de mundo).

/** Píxeles de Matter → unidades de mundo. originX/originY es el punto en píxeles que cae en (0, 0). */
export function toWorld(x, y, { scale = 1, originX = 0, originY = 0 } = {}) {
  return { x: (x - originX) * scale, y: (originY - y) * scale };
}

/** Inversa de toWorld. */
export function fromWorld(wx, wy, { scale = 1, originX = 0, originY = 0 } = {}) {
  return { x: wx / scale + originX, y: originY - wy / scale };
}

/**
 * Mueve cada malla a la posición de su cuerpo. `meshes` es un Map id → Object3D.
 * El ángulo de Matter (horario en pantalla) se invierte al pasar a y hacia arriba.
 */
export function syncMeshes(snapshot, meshes, opts) {
  for (const b of snapshot) {
    const m = meshes.get(b.id);
    if (!m) continue;
    const p = toWorld(b.x, b.y, opts);
    m.position.x = p.x;
    m.position.y = p.y;
    m.rotation.z = -b.angle;
  }
}
