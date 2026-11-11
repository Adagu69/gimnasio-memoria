// nback.js (escena) — N-Back espacial: rejilla 3×3 de baldosas (como Jaeggi et al., 2008).
// El estímulo es una ficha vóxel que aparece en el mismo frame en que la celda recibe .on y desaparece igual:
// sin fundidos, para no alterar la exposición de 1500 ms ni el intervalo de 2500 ms.
import { createBoard, disposeObject } from './board.js';
import { box } from '../voxel.js';
import { invalidate } from '../engine.js';

const PLATE = 6, TILE = 4;

export function createNbackStage(host) {
  const grid = host.querySelector('#n-grid');
  const base = createBoard(host);
  const plate = box(1, PLATE, 1, base.pal.board, { cast: false });
  plate.position.y = PLATE / 2;
  base.scene.add(plate);
  /** { cell, tile, token } */
  let pieces = [];

  function build() {
    pieces.forEach(p => { base.scene.remove(p.tile, p.token); disposeObject(p.tile); disposeObject(p.token); });
    pieces = [...grid.querySelectorAll('.cell')].map(cell => {
      const tile = box(1, TILE, 1, base.pal.surface2, { cast: false });
      const token = box(1, 1, 1, base.pal.accent);
      token.visible = false;
      base.scene.add(tile, token);
      return { cell, tile, token };
    });
    layout();
  }

  function layout() {
    base.refreshPalette();
    plate.material.color.copy(base.pal.board);
    const g = base.place(grid, PLATE);
    if (g) { plate.position.x = g.x; plate.position.z = g.z; plate.scale.set(g.w * 1.06, PLATE, g.d * 1.06); }
    for (const p of pieces) {
      const r = base.place(p.cell, PLATE + TILE);
      if (!r) continue;
      p.tile.material.color.copy(base.pal.surface2);
      p.tile.scale.set(r.w * 0.94, TILE, r.d * 0.94);
      p.tile.position.set(r.x, PLATE + TILE / 2, r.z);
      const s = r.w * 0.5;
      p.token.material.color.copy(base.pal.accent);
      p.token.scale.set(s, s * 0.6, s * (r.d / r.w));
      p.token.position.set(r.x, PLATE + TILE + s * 0.3, r.z);
    }
    sync();
  }

  function sync() {
    for (const p of pieces) p.token.visible = p.cell.classList.contains('on');
    invalidate();
  }

  base.onRelayout(layout);
  base.observe(grid, { childList: true }, build);
  base.observe(grid, { attributes: true, subtree: true, attributeFilter: ['class'] }, sync);
  return base;
}
