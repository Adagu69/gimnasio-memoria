// corsi.test.mjs — el tablero de Corsi irregular: 9 bloques dentro del tablero y sin solaparse.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CORSI_BLOCKS, BLOCK_SIZE, BOARD_ASPECT, blockRect } from '../../js/games/corsi-layout.js';

test('hay 9 bloques, como en el tablero original de Corsi', () => {
  assert.equal(CORSI_BLOCKS.length, 9);
});

test('cada bloque cabe entero en el tablero', () => {
  CORSI_BLOCKS.forEach((_, i) => {
    const r = blockRect(i);
    assert.ok(r.left >= 0 && r.top >= 0, `bloque ${i} empieza dentro`);
    assert.ok(r.left + r.width <= 100 + 1e-9 && r.top + r.height <= 100 + 1e-9, `bloque ${i} termina dentro`);
  });
});

test('ningún par de bloques se solapa (separación mínima de 1,2 lados)', () => {
  // Distancias en unidades de ancho del tablero (el alto mide BOARD_ASPECT anchos).
  for (let i = 0; i < 9; i++) for (let j = i + 1; j < 9; j++) {
    const a = CORSI_BLOCKS[i], b = CORSI_BLOCKS[j];
    const d = Math.hypot(a.x - b.x, (a.y - b.y) * BOARD_ASPECT);
    assert.ok(d >= BLOCK_SIZE * 1.2, `bloques ${i} y ${j} a ${d.toFixed(3)}`);
  }
});

test('la disposición no es una cuadrícula: no hay 3 bloques alineados en una fila o columna', () => {
  const sameRow = CORSI_BLOCKS.map(a => CORSI_BLOCKS.filter(b => Math.abs(a.y - b.y) < 0.03).length);
  const sameCol = CORSI_BLOCKS.map(a => CORSI_BLOCKS.filter(b => Math.abs(a.x - b.x) < 0.03).length);
  assert.ok(Math.max(...sameRow) < 3 && Math.max(...sameCol) < 3);
});

test('blockRect fuera de rango lanza un error', () => {
  assert.throws(() => blockRect(9));
});
