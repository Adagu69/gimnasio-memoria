// voxel.js — piezas básicas de la estética Pixel-3D: material toon de 3 tonos, cubos, texturas pixeladas,
// luces y "sprites vóxel" (un dibujo pixel art extruido en cubos con InstancedMesh).
import * as THREE from 'three';

let gradient = null;
let unitBox = null;

/** Mapa de degradado de 3 tonos (sombra, medio, luz) con filtro "nearest": sombreado en escalones. */
export function toonGradient() {
  if (gradient) return gradient;
  const data = new Uint8Array([110, 185, 255]);
  gradient = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

export function toon(color, opts = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), ...opts });
}

/** Cubo de lado 1 compartido; cada pieza se escala. Marcado como compartido: disposeTree no lo libera. */
function box1() {
  if (!unitBox) { unitBox = new THREE.BoxGeometry(1, 1, 1); unitBox.userData.shared = true; }
  return unitBox;
}

/**
 * Libera geometrías, materiales, instancias y mapas de sombra de un árbol de objetos.
 * Respeta lo compartido (geometry.userData.shared) y no toca texturas (viven en cachés).
 */
export function disposeTree(root) {
  root.traverse(o => {
    if (o.isInstancedMesh) o.dispose();
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    if (o.shadow && o.shadow.map) o.shadow.dispose();
  });
}

/** Prisma w × h × d con material toon propio (para poder cambiar color/emisivo por pieza). */
export function box(w, h, d, color, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(box1(), toon(color));
  m.scale.set(w, h, d);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}

/** Luz hemisférica + direccional con sombra de baja resolución (la sombra también se ve "pixelada"). */
export function addLights(scene, size = 500) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0x9aa3bd, 1.7);
  const dir = new THREE.DirectionalLight(0xffffff, 2.1);
  dir.castShadow = true;
  dir.shadow.mapSize.set(512, 512);
  dir.shadow.bias = -0.002;
  scene.add(hemi, dir, dir.target);
  const fit = s => {
    dir.position.set(-s * 0.35, s * 1.2, s * 0.7);
    const c = dir.shadow.camera;
    c.left = -s; c.right = s; c.top = s; c.bottom = -s; c.near = 1; c.far = s * 5;
    c.updateProjectionMatrix();
  };
  fit(size);
  return { hemi, dir, fit };
}

/** Textura desde un dibujo en canvas, sin suavizado (cada texel es un píxel nítido). */
export function canvasTexture(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Símbolo de carta (Pares) sobre fondo liso, dibujado a baja resolución. */
export function glyphTexture(ch, color, bg, size = 32) {
  return canvasTexture(size, size, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.font = `700 ${Math.round(size * 0.66)}px system-ui, "Segoe UI Symbol", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch, w / 2, h / 2 + size * 0.04);
  });
}

/** Dorso de carta: patrón diagonal de 8×8 píxeles en dos tonos. */
export function patternTexture(a, b) {
  return canvasTexture(8, 8, (ctx) => {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      ctx.fillStyle = ((x + y) % 4 === 0) ? b : a;
      ctx.fillRect(x, y, 1, 1);
    }
  });
}

/**
 * Sprite pixel art extruido en cubos: cada carácter distinto de '.' es un vóxel del color de `colors[char]`.
 * El resultado está centrado en el origen, mide `px` por vóxel y mira hacia +z.
 */
export function voxelSprite(rows, colors, { px = 1, depth = 1 } = {}) {
  const cells = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.' && colors[ch]) cells.push({ x, y, c: colors[ch] }); }));
  const mesh = new THREE.InstancedMesh(box1(), toon(0xffffff), Math.max(1, cells.length));
  const m = new THREE.Matrix4(), col = new THREE.Color();
  const w = rows[0].length, h = rows.length;
  cells.forEach((cell, i) => {
    m.makeScale(px, px, px * depth);
    m.setPosition((cell.x - (w - 1) / 2) * px, ((h - 1) / 2 - cell.y) * px, 0);
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, col.set(cell.c));
  });
  mesh.count = cells.length;
  mesh.castShadow = true;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}
