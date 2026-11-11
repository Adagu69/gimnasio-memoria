// anchor.js — anclaje entre el DOM y la escena 3D.
//   DOM → 3D (tableros): el CSS decide dónde está cada celda; aquí se desproyecta su rectángulo al plano
//   de la mesa para colocar la pieza 3D exactamente debajo de la zona de toque.
//   3D → DOM (mundo): se proyecta un punto del mundo a píxeles para colocar el botón accesible encima.
// Funciones puras (solo matemáticas de Three): se prueban en Node.
import { OrthographicCamera, Vector3 } from 'three';

/** Píxel (relativo al contenedor) → coordenadas normalizadas de dispositivo [-1, 1]. */
export function pointToNdc(px, py, w, h) {
  return { x: (px / w) * 2 - 1, y: 1 - (py / h) * 2 };
}

/** Centro de un rectángulo de pantalla (getBoundingClientRect) en NDC respecto al contenedor. */
export function rectToNdc(rect, host) {
  return pointToNdc(rect.left - host.left + rect.width / 2, rect.top - host.top + rect.height / 2, host.width, host.height);
}

/** Intersección del rayo de cámara que pasa por (nx, ny) con el plano horizontal y = planeY. */
export function ndcToPlane(camera, nx, ny, planeY = 0) {
  const origin = new Vector3(nx, ny, -1).unproject(camera);
  const dir = new Vector3(nx, ny, 1).unproject(camera).sub(origin).normalize();
  if (Math.abs(dir.y) < 1e-9) return null;
  const t = (planeY - origin.y) / dir.y;
  return origin.addScaledVector(dir, t);
}

/** Punto del mundo → píxeles del contenedor (w × h). */
export function worldToScreen(v, camera, w, h) {
  const p = v.clone().project(camera);
  return { x: ((p.x + 1) / 2) * w, y: ((1 - p.y) / 2) * h };
}

/**
 * Rectángulo DOM → centro (x, z) y medidas (w en x, d en z) sobre el plano y = planeY.
 * Se desproyectan los puntos medios de los bordes, así el resultado vale para cámaras inclinadas.
 */
export function placeOnPlane(camera, rect, host, planeY = 0) {
  const L = rect.left - host.left, T = rect.top - host.top;
  const at = (px, py) => { const n = pointToNdc(px, py, host.width, host.height); return ndcToPlane(camera, n.x, n.y, planeY); };
  const c = at(L + rect.width / 2, T + rect.height / 2);
  const l = at(L, T + rect.height / 2), r = at(L + rect.width, T + rect.height / 2);
  const t = at(L + rect.width / 2, T), b = at(L + rect.width / 2, T + rect.height);
  if (!c || !l || !r || !t || !b) return null;
  return { x: c.x, z: c.z, w: l.distanceTo(r), d: t.distanceTo(b) };
}

/**
 * Cámara ortográfica en unidades de píxel (1 unidad = 1 px horizontal) inclinada `elevationDeg`
 * sobre la horizontal y mirando al origen. Ortográfica: todos los estímulos se ven del mismo tamaño.
 */
export function tiltedOrtho(w, h, elevationDeg = 60, distance = 1500) {
  const cam = new OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -4000, 4000);
  setTilt(cam, elevationDeg, distance);
  return cam;
}

/** Reajusta frustum e inclinación de una cámara ortográfica existente. */
export function fitOrtho(cam, w, h, elevationDeg = 60, distance = 1500) {
  cam.left = -w / 2; cam.right = w / 2; cam.top = h / 2; cam.bottom = -h / 2;
  setTilt(cam, elevationDeg, distance);
}

function setTilt(cam, elevationDeg, distance) {
  const e = (elevationDeg * Math.PI) / 180;
  cam.position.set(0, distance * Math.sin(e), distance * Math.cos(e));
  cam.up.set(0, 1, 0);
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
}
