// pares.js (escena) — cartas vóxel sobre la mesa. Refleja el estado de los botones .cardp del DOM
// (.open, .done, tablero .preview); la lógica y los tiempos siguen en js/games/pares.js.
// Volteo de 200 ms: menor que los 250 ms (acierto) y 700 ms (fallo) de la lógica. Al terminar la memorización
// todas las cartas se tapan a la vez, para que la exposición sea idéntica en todas.
import * as THREE from 'three';
import { createBoard, disposeObject } from './board.js';
import { box, toon, glyphTexture, patternTexture } from '../voxel.js';
import { colorOf } from '../palette.js';
import { tween, ease } from '../tween.js';
import { invalidate } from '../engine.js';

const T = 8;            // grosor de la carta, en px
const FLIP_MS = 200;
const PRESS = 3;        // hundimiento al pulsar, en px
const plane = new THREE.PlaneGeometry(1, 1);
plane.userData.shared = true;
const glyphCache = new Map();
const hex = c => '#' + c.getHexString();

export function createParesStage(host) {
  const boardEl = host.querySelector('#p-board');
  const base = createBoard(host);
  /** botón → pieza */
  const pieces = new Map();
  let backTex = null, backKey = '';

  function backTexture() {
    const key = hex(base.pal.accentSoft) + hex(base.pal.accent);
    if (!backTex || key !== backKey) { backTex = patternTexture(hex(base.pal.accentSoft), hex(base.pal.accent)); backKey = key; }
    return backTex;
  }

  function frontTexture(btn) {
    const sym = btn.dataset.s || '';
    const span = btn.querySelector('.front');
    const color = sym && span ? hex(colorOf(span)) : '#000000';
    const bg = hex(base.pal.surface);
    const key = sym + color + bg;
    if (!glyphCache.has(key)) glyphCache.set(key, glyphTexture(sym, color, bg));
    return glyphCache.get(key);
  }

  function makePiece(btn) {
    const holder = new THREE.Group();   // posición en la mesa (+ hundimiento)
    const flip = new THREE.Group();     // giro sobre el eje z y elevación durante el giro
    const body = box(1, T, 1, base.pal.accent); // canto de color: la carta se lee como una pieza con volumen
    const top = new THREE.Mesh(plane, toon(0xffffff, { map: backTexture() }));
    top.rotation.x = -Math.PI / 2; top.position.y = T / 2 + 0.2;
    const bottom = new THREE.Mesh(plane, toon(0xffffff, { map: frontTexture(btn) }));
    bottom.rotation.set(Math.PI / 2, 0, Math.PI); bottom.position.y = -T / 2 - 0.2;
    const frame = box(1, 2, 1, base.pal.ok, { cast: false });
    frame.position.y = -T / 2 + 1; frame.visible = false;
    flip.add(body, top, bottom);
    holder.add(flip, frame);
    return { holder, flip, body, top, bottom, frame, open: false, done: false, sink: 0, w: 1 };
  }

  function setY(p) { p.holder.position.y = T / 2 - p.sink; }

  function layout() {
    for (const [btn, p] of pieces) {
      const r = base.place(btn, T);
      if (!r) continue;
      p.holder.position.x = r.x; p.holder.position.z = r.z; setY(p);
      const w = r.w * 0.92, d = r.d * 0.92;
      p.w = w;
      p.body.scale.set(w, T, d);
      p.top.scale.set(w * 0.94, d * 0.94, 1);
      p.bottom.scale.set(w * 0.94, d * 0.94, 1);
      p.frame.scale.set(r.w, 2, r.d);
    }
    invalidate();
  }

  function setOpen(p, open, instant) {
    if (p.open === open) return;
    p.open = open;
    const from = p.flip.rotation.z, to = open ? Math.PI : 0;
    if (instant) { tween({ key: p, ms: 0, update: () => { p.flip.rotation.z = to; p.flip.position.y = 0; } }); return; }
    tween({
      key: p, ms: FLIP_MS, ease: ease.inOutSine,
      update: k => { p.flip.rotation.z = from + (to - from) * k; p.flip.position.y = Math.sin(k * Math.PI) * p.w * 0.5; }
    });
  }

  function setDone(p, done) {
    if (p.done === done) return;
    p.done = done;
    p.frame.visible = done;
    p.sink = done ? 2 : 0;
    setY(p);
  }

  function sync(instant) {
    for (const [btn, p] of pieces) {
      setOpen(p, btn.classList.contains('open') || btn.classList.contains('done'), instant);
      setDone(p, btn.classList.contains('done'));
    }
    invalidate();
  }

  function rebuild() {
    for (const p of pieces.values()) { base.scene.remove(p.holder); disposeObject(p.holder); }
    pieces.clear();
    for (const btn of boardEl.querySelectorAll('.cardp')) {
      const p = makePiece(btn);
      pieces.set(btn, p);
      base.scene.add(p.holder);
    }
    layout();
    sync(true);
  }

  base.onRelayout(layout);
  base.observe(boardEl, { childList: true }, rebuild);
  base.observe(boardEl, { attributes: true, subtree: true, attributeFilter: ['class'] }, recs => sync(recs.length === 0));

  // Respuesta táctil en pointer-down: la carta se hunde mientras se pulsa.
  const press = (btn, down) => {
    const p = pieces.get(btn);
    if (!p || p.open || p.done || btn.disabled) return;
    p.sink = down ? PRESS : 0; setY(p); invalidate();
  };
  boardEl.addEventListener('pointerdown', e => { const b = e.target.closest('.cardp'); if (b) press(b, true); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => boardEl.addEventListener(t, e => {
    const b = e.target.closest && e.target.closest('.cardp'); if (b) press(b, false);
  }));

  return base;
}
