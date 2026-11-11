// corsi.js (escena) — tablero de Corsi: 9 cubos sobre un tablero oscuro en posiciones irregulares.
// Refleja las clases de los botones .block (lit, pressing, hit, miss). El encendido y el apagado son
// INSTANTÁNEOS (sin animación): la duración de exposición la fija la lógica del juego, no el render.
import { createBoard, disposeObject } from './board.js';
import { box } from '../voxel.js';
import { tween, ease } from '../tween.js';
import { invalidate } from '../engine.js';

const PLATE = 6;

export function createCorsiStage(host) {
  const grid = host.querySelector('#s-grid');
  const base = createBoard(host);
  const plate = box(1, PLATE, 1, base.pal.board, { cast: false });
  plate.position.y = PLATE / 2;
  base.scene.add(plate);
  /** { btn, mesh, h, y0, shake } */
  let pieces = [];

  function build() {
    pieces.forEach(p => { base.scene.remove(p.mesh); disposeObject(p.mesh); });
    pieces = [...grid.querySelectorAll('.block')].map(btn => {
      const mesh = box(1, 1, 1, base.pal.block);
      base.scene.add(mesh);
      return { btn, mesh, h: 1, y0: 0, x: 0, missed: false };
    });
    layout();
    sync();
  }

  function layout() {
    const g = base.place(grid, PLATE);
    if (g) { plate.position.x = g.x; plate.position.z = g.z; plate.scale.set(g.w * 1.06, PLATE, g.d * 1.06); }
    for (const p of pieces) {
      const r = base.place(p.btn, PLATE);
      if (!r) continue;
      p.h = r.w * 0.45;
      p.y0 = PLATE + p.h / 2;
      p.x = r.x;
      p.mesh.scale.set(r.w * 0.9, p.h, r.d * 0.9);
      p.mesh.position.set(r.x, p.y0, r.z);
    }
    base.refreshPalette();
    plate.material.color.copy(base.pal.board);
    sync();
  }

  function sync() {
    const pal = base.pal;
    for (const p of pieces) {
      const c = p.btn.classList;
      const m = p.mesh.material;
      m.color.copy(pal.block);
      let y = p.y0;
      // Encendido dorado: máximo contraste con los bloques azules (estímulo saliente, igual que en la piel clásica).
      if (c.contains('lit')) { y = p.y0 + p.h * 0.45; m.color.copy(pal.gold); m.emissive.copy(pal.gold); m.emissiveIntensity = 0.75; }
      else if (c.contains('hit')) { m.emissive.copy(pal.ok); m.emissiveIntensity = 0.9; }
      else if (c.contains('miss')) { m.emissive.copy(pal.bad); m.emissiveIntensity = 0.9; }
      else { m.emissive.setRGB(0, 0, 0); m.emissiveIntensity = 0; }
      if (c.contains('pressing')) y = p.y0 - p.h * 0.18;
      p.mesh.position.y = y;
      // Error: el bloque tiembla (solo retroalimentación; ya terminó la respuesta).
      if (c.contains('miss') && !p.missed) {
        p.missed = true;
        tween({ key: p, ms: 320, ease: ease.linear, update: k => { p.mesh.position.x = p.x + Math.sin(k * Math.PI * 6) * (1 - k) * p.h * 0.25; } });
      } else if (!c.contains('miss')) p.missed = false;
    }
    invalidate();
  }

  base.onRelayout(layout);
  base.observe(grid, { childList: true }, build);
  base.observe(grid, { attributes: true, subtree: true, attributeFilter: ['class'] }, sync);
  return base;
}
