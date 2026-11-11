// mini.js (escena) — mini-diorama de una estación para la tarjeta de introducción de la sesión.
// Gira despacio (es una pantalla de presentación, no de tarea); con movimiento reducido queda quieta.
import * as THREE from 'three';
import { addLights, box } from '../voxel.js';
import { palette } from '../palette.js';
import { reducedMotion } from '../tween.js';
import { buildStation } from './stations.js';

const SPIN = 0.00035; // rad/ms

export function createMiniStage(gameId) {
  const pal = palette();
  const scene = new THREE.Scene();
  scene.background = pal.surface2.clone(); // lienzo opaco: la maqueta se ve como en una "ventana" pixelada
  const camera = new THREE.OrthographicCamera(-2, 2, 1.4, -1.4, -50, 50);
  camera.position.set(6, 5, 6); camera.lookAt(0, 0.5, 0);
  addLights(scene, 4);
  const root = new THREE.Group();
  const base = box(2.6, 0.3, 2.6, pal.floor, { cast: false }); base.position.y = -0.15;
  root.add(base, buildStation(gameId, pal));
  root.rotation.y = -0.4;
  scene.add(root);
  const still = reducedMotion();

  return {
    scene, camera, pixelSize: 3,
    resize(w, h) {
      const half = 1.9, aspect = w / h;
      const hh = Math.max(half / aspect, 1.25);
      camera.left = -hh * aspect; camera.right = hh * aspect; camera.top = hh; camera.bottom = -hh;
      camera.updateProjectionMatrix();
    },
    tick(dt) { if (still) return false; root.rotation.y += dt * SPIN; return true; }
  };
}
