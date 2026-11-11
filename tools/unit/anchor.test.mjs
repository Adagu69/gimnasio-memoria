// anchor.test.mjs — pruebas del anclaje DOM↔3D (proyección y desproyección).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { pointToNdc, rectToNdc, ndcToPlane, worldToScreen, placeOnPlane, tiltedOrtho } from '../../js/three/anchor.js';

const W = 400, H = 300;
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

function camera() {
  const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -2000, 2000);
  cam.position.set(0, 800, 600); // elevación atan(800/600) ≈ 53,13° → sen = 0,8
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  return cam;
}

test('pointToNdc y rectToNdc: el centro del contenedor es (0, 0)', () => {
  assert.deepEqual(pointToNdc(W / 2, H / 2, W, H), { x: 0, y: 0 });
  const host = { left: 10, top: 20, width: W, height: H };
  const c = rectToNdc({ left: 10 + W / 2 - 5, top: 20 + H / 2 - 5, width: 10, height: 10 }, host);
  assert.ok(near(c.x, 0) && near(c.y, 0));
  assert.deepEqual(pointToNdc(0, 0, W, H), { x: -1, y: 1 });
});

test('desproyectar al plano y volver a proyectar devuelve el mismo píxel', () => {
  const cam = camera();
  for (const [px, py] of [[100, 80], [W / 2, H / 2], [390, 290], [5, 150]]) {
    const n = pointToNdc(px, py, W, H);
    const p = ndcToPlane(cam, n.x, n.y, 0);
    assert.ok(p, 'hay intersección con el plano');
    assert.ok(near(p.y, 0, 1e-6), 'el punto está en el plano y = 0');
    const s = worldToScreen(p, cam, W, H);
    assert.ok(near(s.x, px, 1e-4) && near(s.y, py, 1e-4), `(${s.x}, ${s.y}) ≈ (${px}, ${py})`);
  }
});

test('placeOnPlane: el ancho se conserva y la profundidad se alarga 1/sen(elevación)', () => {
  const cam = camera();
  const host = { left: 0, top: 0, width: W, height: H };
  const r = placeOnPlane(cam, { left: 50, top: 100, width: 80, height: 40 }, host, 0);
  assert.ok(near(r.w, 80, 1e-4), `w=${r.w}`);
  assert.ok(near(r.d, 40 / 0.8, 1e-4), `d=${r.d}`);
  assert.ok(r.x < 0, 'la celda está a la izquierda del centro');
});

test('ndcToPlane devuelve null si el rayo es paralelo al plano', () => {
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  cam.position.set(0, 0, 10); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  assert.equal(ndcToPlane(cam, 0, 0, 0), null);
});

test('tiltedOrtho crea una cámara con la elevación pedida que mira al origen', () => {
  const cam = tiltedOrtho(W, H, 60);
  const dir = new THREE.Vector3(); cam.getWorldDirection(dir);
  const elev = Math.asin(-dir.y) * 180 / Math.PI;
  assert.ok(near(elev, 60, 1e-6), `elevación ${elev}`);
  assert.ok(near(cam.right - cam.left, W) && near(cam.top - cam.bottom, H));
});
