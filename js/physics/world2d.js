// world2d.js — envoltorio de Matter.js para la física decorativa del juego.
// La física NUNCA es estado del juego: solo representa resultados ya calculados (torre de constancia,
// objetos de la métrica, columnas de resultados) y nunca corre durante OBSERVA ni TU TURNO.
// Paso fijo de 1000/60 ms → simulación determinista; los cuerpos se duermen y el bucle se detiene solo.
import Matter from 'matter-js';

const { Engine, Bodies, Composite } = Matter;

export const STEP_MS = 1000 / 60;
export const MAX_BODIES = 60;
const MAX_FRAME_MS = 100;          // tras una pausa larga no se intenta "recuperar" el tiempo perdido
const WALL = 100;                  // grosor de suelo y paredes invisibles

/** Mundos vivos: permiten saber cuántos cuerpos se mueven en total (data-physics-active). */
const live = new Set();

/** Cuerpos despiertos en todos los mundos vivos. */
export function activeBodies() {
  let n = 0;
  for (const w of live) n += w.activeCount();
  return n;
}

function publishActivity() {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.physicsActive = String(activeBodies());
}

function makeBody(spec) {
  const opts = {
    angle: spec.angle || 0,
    friction: 0.7,
    frictionStatic: 1,
    restitution: spec.restitution ?? 0.08,
    density: 0.002,
    sleepThreshold: 30,
    label: spec.id
  };
  return spec.shape === 'circle'
    ? Bodies.circle(spec.x, spec.y, spec.w / 2, opts)
    : Bodies.rectangle(spec.x, spec.y, spec.w, spec.h, opts);
}

/**
 * Crea un mundo 2D con suelo y paredes laterales (nada sale de [0, width]).
 * @param {{ width:number, height:number, walls?:Array<{x:number,y:number,w:number,h:number}>, gravity?:number }} cfg
 */
export function createWorld({ width, height, walls = [], gravity = 1 }) {
  if (!(width > 0 && height > 0)) throw new Error('createWorld: tamaño inválido');
  const engine = Engine.create({ enableSleeping: true, gravity: { x: 0, y: gravity }, positionIterations: 10, velocityIterations: 8 });
  const statics = [
    Bodies.rectangle(width / 2, height + WALL / 2, width * 3, WALL, { isStatic: true }),
    Bodies.rectangle(-WALL / 2, height / 2, WALL, height * 6, { isStatic: true }),
    Bodies.rectangle(width + WALL / 2, height / 2, WALL, height * 6, { isStatic: true }),
    ...walls.map(w => Bodies.rectangle(w.x, w.y, w.w, w.h, { isStatic: true }))
  ];
  Composite.add(engine.world, statics);

  /** id → { body, spec } */
  const dynamic = new Map();
  let acc = 0;

  const world = {
    width, height,

    /** Añade cuerpos; ignora ids repetidos y respeta el máximo. Devuelve los ids realmente añadidos. */
    add(specs) {
      const added = [];
      for (const spec of specs) {
        if (dynamic.size >= MAX_BODIES || dynamic.has(spec.id)) continue;
        const body = makeBody(spec);
        dynamic.set(spec.id, { body, spec });
        Composite.add(engine.world, body);
        added.push(spec.id);
      }
      publishActivity();
      return added;
    },

    /** Quita cuerpos por id. Devuelve los ids que existían y se quitaron. */
    remove(ids) {
      const removed = [];
      for (const id of ids) {
        const entry = dynamic.get(id);
        if (!entry) continue;
        Composite.remove(engine.world, entry.body);
        dynamic.delete(id);
        removed.push(id);
      }
      publishActivity();
      return removed;
    },

    /** Avanza dtMs de tiempo real en pasos fijos. Devuelve los pasos dados. */
    step(dtMs) {
      acc += Math.min(Math.max(dtMs, 0), MAX_FRAME_MS);
      let n = 0;
      while (acc >= STEP_MS) { Engine.update(engine, STEP_MS); acc -= STEP_MS; n++; }
      publishActivity();
      return n;
    },

    /** Simula de forma síncrona (sin dibujar) hasta que todo duerme. Devuelve los pasos usados. */
    settle(maxSteps = 900) {
      let i = 0;
      while (i < maxSteps && !world.asleep()) { Engine.update(engine, STEP_MS); i++; }
      publishActivity();
      return i;
    },

    asleep() {
      for (const { body } of dynamic.values()) if (!body.isSleeping) return false;
      return true;
    },

    activeCount() {
      let n = 0;
      for (const { body } of dynamic.values()) if (!body.isSleeping) n++;
      return n;
    },

    /** Estado actual de los cuerpos dinámicos (copia): posición del centro, ángulo y medidas. */
    snapshot() {
      return [...dynamic.values()].map(({ body, spec }) => ({
        id: spec.id, kind: spec.kind, x: body.position.x, y: body.position.y, angle: body.angle,
        w: spec.w, h: spec.h, shape: spec.shape || 'rect', data: spec.data || {}
      }));
    },

    clear() {
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      dynamic.clear();
      live.delete(world);
      publishActivity();
    }
  };

  live.add(world);
  return world;
}
