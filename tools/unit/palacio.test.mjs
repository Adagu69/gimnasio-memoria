// palacio.test.mjs — lógica pura del Palacio de la memoria (método de loci).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seeded } from '../../js/physics/rng.js';
import {
  LOCI, LEVELS, OBJECTS, makeTrial, optionsFor, scoreAnswers, nextLoci, startLoci, weight, normalizePalacio, caption, question, normalizeLevel
} from '../../js/games/palacio-logic.js';
import { SPRITES, SPRITE_COLORS } from '../../js/games/sprites.js';

test('hay 12 lugares fijos en ruta y niveles de 4 a 12 lugares', () => {
  assert.equal(LOCI.length, 12);
  assert.deepEqual(LEVELS, [4, 5, 6, 7, 8, 10, 12]);
  assert.equal(new Set(LOCI.map(l => l.id)).size, 12);
  LOCI.forEach(l => { assert.ok(l.plan.x >= 0 && l.plan.x <= 1 && l.plan.y >= 0 && l.plan.y <= 1, l.id); });
});

test('cada objeto tiene su dibujo pixel art de 12×12 con colores válidos', () => {
  assert.ok(OBJECTS.length >= 16);
  for (const o of OBJECTS) {
    const rows = SPRITES[o.id];
    assert.ok(rows, `falta el dibujo de ${o.id}`);
    assert.equal(rows.length, 12, `${o.id}: 12 filas`);
    rows.forEach((r, i) => {
      assert.equal(r.length, 12, `${o.id}: fila ${i} con ${r.length} columnas`);
      [...r].forEach(ch => assert.ok(ch === '.' || SPRITE_COLORS[ch], `${o.id}: color "${ch}" desconocido`));
    });
  }
});

test('un ensayo usa los primeros L lugares de la ruta, con objetos distintos', () => {
  const t = makeTrial(8, seeded(1));
  assert.equal(t.loci, 8);
  assert.equal(t.objects.length, 8);
  assert.equal(new Set(t.objects).size, 8);
  t.objects.forEach(id => assert.ok(OBJECTS.some(o => o.id === id)));
  assert.throws(() => makeTrial(9));
});

test('el mismo generador produce el mismo ensayo (reproducible)', () => {
  assert.deepEqual(makeTrial(6, seeded('a')), makeTrial(6, seeded('a')));
});

test('opciones: 4, sin repetir, con la correcta, y distractores de OTROS lugares del mismo ensayo', () => {
  const rnd = seeded(7);
  const t = makeTrial(4, rnd);
  for (let k = 0; k < t.loci; k++) {
    const ops = optionsFor(t, k, rnd);
    assert.equal(ops.length, 4);
    assert.equal(new Set(ops).size, 4);
    assert.ok(ops.includes(t.objects[k]));
    ops.forEach(id => assert.ok(t.objects.includes(id), 'el distractor salió del ensayo'));
  }
});

test('puntuación: aciertos, total y precisión redondeada', () => {
  const t = { loci: 4, objects: ['pez', 'llave', 'flor', 'vela'] };
  assert.deepEqual(scoreAnswers(t, ['pez', 'llave', 'vela', 'vela']), { correct: 3, total: 4, acc: 75 });
  assert.deepEqual(scoreAnswers(t, []), { correct: 0, total: 4, acc: 0 });
  assert.equal(scoreAnswers({ loci: 6, objects: ['a', 'b', 'c', 'd', 'e', 'f'] }, ['a', 'b', 'c', 'd']).acc, 67);
});

test('dificultad adaptativa: ≥ 85 % sube un escalón, < 60 % baja, en otro caso se mantiene', () => {
  assert.equal(nextLoci(4, 90), 5);
  assert.equal(nextLoci(8, 85), 10);
  assert.equal(nextLoci(12, 100), 12);
  assert.equal(nextLoci(8, 50), 7);
  assert.equal(nextLoci(4, 0), 4);
  assert.equal(nextLoci(8, 70), 8);
  assert.equal(nextLoci(9, 100), 10, 'un valor fuera de la escala se ajusta al escalón más cercano');
});

test('normalizeLevel ajusta un valor guardado inválido al escalón más cercano', () => {
  assert.equal(normalizeLevel(9), 8, 'en empate se elige el escalón menor (más prudente)');
  assert.equal(normalizeLevel(11), 10, 'en empate se elige el escalón menor (más prudente)');
  assert.equal(normalizeLevel(3), 4);
  assert.equal(normalizeLevel(99), 12);
  assert.equal(normalizeLevel('abc'), 4);
  assert.equal(normalizeLevel(6), 6);
});

test('nivel inicial según la dificultad del programa', () => {
  assert.equal(startLoci('estandar'), 4);
  assert.equal(startLoci('avanzado'), 6);
});

test('normalización 0–100 ponderada por número de lugares (como N en N-Back)', () => {
  assert.equal(weight(8), 1);
  assert.equal(normalizePalacio({ loci: 8, acc: 85 }), 85);
  assert.equal(normalizePalacio({ loci: 4, acc: 100 }), 70);
  assert.equal(normalizePalacio({ loci: 12, acc: 100 }), 100);
  assert.equal(normalizePalacio({ loci: 6, acc: 50 }), 45);
});

test('rótulos en español: objeto + lugar y pregunta', () => {
  assert.equal(caption('llave', 0), 'Una llave en el perchero');
  assert.equal(caption('pez', 3), 'Un pez en la lámpara');
  assert.equal(question(0), '¿Qué había en el perchero?');
});
