// palacio-logic.js — lógica pura del Palacio de la memoria (sin DOM): ensayos, opciones, puntuación y nivel.
// Método de loci (Yates, 1966; Bower, 1970): una ruta FIJA de lugares en una habitación; en cada lugar se
// "deposita" un objeto y luego se recorre la misma ruta para recuperarlo. Los entornos virtuales sirven igual
// que los lugares conocidos (Legge et al., 2012). Los distractores salen de otros lugares del MISMO ensayo:
// reconocer el objeto no basta, hay que recordar la asociación objeto–lugar.
import { shuffled } from '../physics/rng.js';

/** Lugares en orden de ruta. `plan` = posición normalizada en el plano de la habitación (para la piel clásica). */
export const LOCI = Object.freeze([
  { id: 'perchero', en: 'en el perchero', plan: { x: 0.06, y: 0.84 } },
  { id: 'espejo', en: 'en el espejo', plan: { x: 0.03, y: 0.54 } },
  { id: 'sofa', en: 'en el sofá', plan: { x: 0.16, y: 0.15 } },
  { id: 'lampara', en: 'en la lámpara', plan: { x: 0.34, y: 0.07 } },
  { id: 'ventana', en: 'en la ventana', plan: { x: 0.53, y: 0.02 } },
  { id: 'estanteria', en: 'en la estantería', plan: { x: 0.75, y: 0.04 } },
  { id: 'chimenea', en: 'en la chimenea', plan: { x: 0.97, y: 0.29 } },
  { id: 'piano', en: 'en el piano', plan: { x: 0.9, y: 0.62 } },
  { id: 'cama', en: 'en la cama', plan: { x: 0.81, y: 0.88 } },
  { id: 'baul', en: 'en el baúl', plan: { x: 0.59, y: 0.94 } },
  { id: 'mesa', en: 'en la mesa', plan: { x: 0.34, y: 0.67 } },
  { id: 'alfombra', en: 'en la alfombra', plan: { x: 0.56, y: 0.46 } }
].map(Object.freeze));

/** Objetos que se pueden depositar (el id coincide con su dibujo en sprites.js). */
export const OBJECTS = Object.freeze([
  ['manzana', 'una manzana'], ['llave', 'una llave'], ['pez', 'un pez'], ['paraguas', 'un paraguas'],
  ['reloj', 'un reloj'], ['corona', 'una corona'], ['taza', 'una taza'], ['campana', 'una campana'],
  ['barco', 'un barco'], ['cohete', 'un cohete'], ['sombrero', 'un sombrero'], ['libro', 'un libro'],
  ['flor', 'una flor'], ['vela', 'una vela'], ['ancla', 'un ancla'], ['pelota', 'una pelota'],
  ['bombilla', 'una bombilla'], ['corazon', 'un corazón'], ['hongo', 'un hongo'], ['arbol', 'un árbol']
].map(([id, name]) => Object.freeze({ id, name })));

export const LEVELS = Object.freeze([4, 5, 6, 7, 8, 10, 12]);
const WEIGHTS = Object.freeze({ 4: 0.7, 5: 0.8, 6: 0.9, 7: 0.95, 8: 1, 10: 1.05, 12: 1.1 });

/** Tiempos de la fase OBSERVA por lugar: desplazamiento + exposición del objeto. */
export const TIMING = Object.freeze({ MOVE_MS: 600, SHOW_MS: 2400, FEEDBACK_MS: 700 });

const UP = 85, DOWN = 60;

export function objectName(id) {
  const o = OBJECTS.find(x => x.id === id);
  return o ? o.name : id;
}

/** Ensayo de L lugares: los primeros L de la ruta, cada uno con un objeto distinto. */
export function makeTrial(L, rnd = Math.random) {
  if (!LEVELS.includes(L)) throw new RangeError(`palacio: nivel ${L} no válido`);
  const objects = shuffled(OBJECTS.map(o => o.id), rnd).slice(0, L);
  return Object.freeze({ loci: L, objects: Object.freeze(objects) });
}

/** 4 opciones para el lugar k: la correcta + 3 objetos de otros lugares del mismo ensayo, barajadas. */
export function optionsFor(trial, k, rnd = Math.random) {
  const correct = trial.objects[k];
  const others = shuffled(trial.objects.filter(id => id !== correct), rnd).slice(0, 3);
  return shuffled([correct, ...others], rnd);
}

/** Aciertos sobre el ensayo; las respuestas que falten cuentan como error. */
export function scoreAnswers(trial, answers) {
  const total = trial.loci;
  const correct = trial.objects.reduce((n, id, k) => n + (answers[k] === id ? 1 : 0), 0);
  return { correct, total, acc: Math.round((100 * correct) / total) };
}

function nearestLevel(L) {
  return LEVELS.reduce((best, v) => (Math.abs(v - L) < Math.abs(best - L) ? v : best), LEVELS[0]);
}

/** Ajusta un número de lugares guardado (posiblemente inválido) al escalón válido más cercano. */
export function normalizeLevel(L) {
  const n = Number(L);
  return Number.isFinite(n) ? nearestLevel(n) : LEVELS[0];
}

/** Regla 85 % / 60 % (la misma del N-Back): sube, baja o mantiene el número de lugares. */
export function nextLoci(L, acc) {
  const i = LEVELS.indexOf(nearestLevel(L));
  if (acc >= UP) return LEVELS[Math.min(LEVELS.length - 1, i + 1)];
  if (acc < DOWN) return LEVELS[Math.max(0, i - 1)];
  return LEVELS[i];
}

export function startLoci(difficulty) { return difficulty === 'avanzado' ? 6 : 4; }

export function weight(L) { return WEIGHTS[nearestLevel(L)]; }

/** Índice 0–100 de una sesión de Palacio. */
export function normalizePalacio(r) {
  return Math.min(100, Math.round((r.acc || 0) * weight(r.loci || 4)));
}

const capital = s => s.charAt(0).toUpperCase() + s.slice(1);

export function caption(objId, k) { return `${capital(objectName(objId))} ${LOCI[k].en}`; }
export function question(k) { return `¿Qué había ${LOCI[k].en}?`; }
