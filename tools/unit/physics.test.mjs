// physics.test.mjs — pruebas unitarias de la física decorativa (Matter.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seeded, hashSeed } from '../../js/physics/rng.js';
import { createWorld } from '../../js/physics/world2d.js';
import { towerSpecs, metricCount, resultSpecs, columnSpecs, columnWalls, TOWER } from '../../js/physics/presets.js';
import { toWorld, fromWorld, syncMeshes } from '../../js/physics/bridge3d.js';

test('seeded genera la misma secuencia con la misma semilla y valores en [0,1)', () => {
  const a = seeded('2026-11-10'), b = seeded('2026-11-10'), c = seeded('otra');
  const va = [a(), a(), a()], vb = [b(), b(), b()];
  assert.deepEqual(va, vb);
  assert.notDeepEqual(va, [c(), c(), c()]);
  va.forEach(v => assert.ok(v >= 0 && v < 1));
  assert.equal(hashSeed(42), 42);
});

test('una torre de bloques se asienta (todos dormidos) en un número acotado de pasos', () => {
  const days = Array.from({ length: 12 }, (_, k) => ({ day: `2026-10-${String(k + 1).padStart(2, '0')}`, score: 60 + k }));
  const world = createWorld({ width: TOWER.width, height: TOWER.height, walls: [] });
  world.add(towerSpecs(days));
  const steps = world.settle(1500);
  assert.ok(world.asleep(), 'todos los cuerpos duermen');
  assert.ok(steps < 1500, `se asentó en ${steps} pasos`);
  assert.equal(world.activeCount(), 0);
  world.clear();
});

test('settle es determinista: misma entrada → mismas posiciones', () => {
  const days = Array.from({ length: 6 }, (_, k) => ({ day: `2026-09-0${k + 1}`, score: 70 }));
  const run = () => { const w = createWorld({ width: TOWER.width, height: TOWER.height }); w.add(towerSpecs(days)); w.settle(); const s = w.snapshot(); w.clear(); return s; };
  const a = run(), b = run();
  assert.equal(a.length, 6);
  a.forEach((p, i) => { assert.ok(Math.abs(p.x - b[i].x) < 1e-6); assert.ok(Math.abs(p.y - b[i].y) < 1e-6); });
});

test('ningún cuerpo sale de los límites del mundo', () => {
  const w = createWorld({ width: 200, height: 160 });
  w.add(resultSpecs('secuencia', { game: 'secuencia', span: 9, t: 1 }, { width: 200, height: 160 }));
  w.settle(1500);
  for (const p of w.snapshot()) {
    assert.ok(p.x > 0 && p.x < 200, `x=${p.x}`);
    assert.ok(p.y < 160 + 1, `y=${p.y}`);
  }
  w.clear();
});

test('add devuelve solo los ids añadidos (respeta el máximo y los repetidos) y remove los quita', () => {
  const w = createWorld({ width: 300, height: 200 });
  const specs = Array.from({ length: 70 }, (_, k) => ({ id: 'b' + k, kind: 'block', x: 20 + (k % 10) * 26, y: -k * 30, w: 20, h: 20 }));
  const added = w.add(specs);
  assert.equal(added.length, 60, 'máximo de 60 cuerpos');
  assert.deepEqual(w.add([specs[0]]), [], 'un id repetido no se añade');
  assert.deepEqual(w.remove(['b0', 'b1', 'noexiste']), ['b0', 'b1']);
  assert.equal(w.snapshot().length, 58);
  assert.deepEqual(w.add([specs[65]]), ['b65'], 'tras quitar cuerpos vuelve a haber sitio');
  w.clear();
});

test('la torre muestra como máximo los últimos 30 días y conserva el orden', () => {
  const days = Array.from({ length: 40 }, (_, k) => ({ day: `d${k}`, score: 50 }));
  const specs = towerSpecs(days);
  assert.equal(specs.length, TOWER.goal);
  assert.equal(specs[0].data.day, 'd10');
  assert.equal(specs.at(-1).data.day, 'd39');
});

test('metricCount: cada juego cae con tantos objetos como su métrica', () => {
  assert.equal(metricCount('pares', { stars: 3 }), 3);
  assert.equal(metricCount('secuencia', { span: 5 }), 5);
  assert.equal(metricCount('nback', { n: 2 }), 2);
  assert.equal(metricCount('palacio', { correct: 7 }), 7);
  assert.equal(metricCount('pares', {}), 0);
  assert.equal(metricCount('desconocido', { stars: 3 }), 0);
});

test('resultSpecs genera exactamente metricCount cuerpos con ids únicos', () => {
  const r = { game: 'palacio', correct: 6, t: 123 };
  const specs = resultSpecs('palacio', r, { width: 300, height: 120 });
  assert.equal(specs.length, 6);
  assert.equal(new Set(specs.map(s => s.id)).size, 6);
  specs.forEach(s => assert.equal(s.kind, 'obj'));
});

test('columnSpecs: 1 bloque cada 10 puntos por área, con un tubo estrecho por columna', () => {
  const size = { width: 400, height: 300 };
  const specs = columnSpecs([['pares', 83], ['secuencia', 50], ['nback', 0], ['palacio', 100]], size);
  const count = g => specs.filter(s => s.data.area === g).length;
  assert.equal(count('pares'), 8);
  assert.equal(count('secuencia'), 5);
  assert.equal(count('nback'), 0);
  assert.equal(count('palacio'), 10);
  const walls = columnWalls(4, size);
  assert.equal(walls.length, 8, 'dos paredes por columna');
  const block = specs[0].w;
  const gap = walls[1].x - walls[0].x - walls[0].w;
  assert.ok(gap > block && gap < block * 1.5, `el tubo (${gap.toFixed(1)}) apenas es más ancho que un bloque (${block.toFixed(1)})`);
});

test('las columnas se apilan como barras: 10 bloques llegan a 10 alturas de bloque', () => {
  const size = { width: 400, height: 300 };
  const w = createWorld({ ...size, walls: columnWalls(1, size) });
  const specs = columnSpecs([['pares', 100]], size);
  w.add(specs); w.settle(2000);
  const top = Math.min(...w.snapshot().map(b => b.y - b.h / 2));
  assert.ok(size.height - top > specs[0].h * 9.5, `altura apilada ${(size.height - top).toFixed(1)}`);
  w.clear();
});

test('bridge3d: la conversión píxel↔mundo es reversible', () => {
  const opts = { scale: 0.05, originX: 60, originY: 360 };
  const w = toWorld(30, 100, opts);
  const back = fromWorld(w.x, w.y, opts);
  assert.ok(Math.abs(back.x - 30) < 1e-9 && Math.abs(back.y - 100) < 1e-9);
  assert.ok(w.y > 0, 'el eje y de Matter (hacia abajo) se invierte');
});

test('syncMeshes coloca cada malla en su cuerpo e invierte el ángulo; ignora cuerpos sin malla', () => {
  const mesh = () => ({ position: { x: 0, y: 0 }, rotation: { z: 0 } });
  const meshes = new Map([['a', mesh()]]);
  syncMeshes([{ id: 'a', x: 70, y: 340, angle: 0.5 }, { id: 'sin-malla', x: 1, y: 1, angle: 0 }], meshes, { scale: 0.1, originX: 60, originY: 360 });
  const m = meshes.get('a');
  assert.ok(Math.abs(m.position.x - 1) < 1e-9 && Math.abs(m.position.y - 2) < 1e-9);
  assert.equal(m.rotation.z, -0.5);
});
