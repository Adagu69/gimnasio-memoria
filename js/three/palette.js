// palette.js — paleta limitada de la escena 3D leída de los tokens CSS (los temas claro y oscuro valen igual en 3D).
import { Color } from 'three';

const TOKENS = ['bg', 'surface', 'surface-2', 'fg', 'muted', 'line', 'accent', 'accent-soft', 'ok', 'bad', 'warn', 'gold',
  'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'board', 'block', 'floor', 'floor-2', 'wall', 'wood'];

const camel = s => s.replace(/-(\w)/g, (_, c) => c.toUpperCase());

/** Devuelve { surface, surface2, accent, c1… } como THREE.Color a partir de las variables CSS actuales. */
export function palette() {
  const cs = getComputedStyle(document.documentElement);
  const out = {};
  for (const t of TOKENS) {
    const v = cs.getPropertyValue('--' + t).trim();
    out[camel(t)] = new Color(v || '#8890a8');
  }
  return out;
}

/** Color CSS calculado de un elemento (p. ej. el color del símbolo de una carta). */
export function colorOf(el, prop = 'color') {
  try { return new Color(getComputedStyle(el)[prop]); } catch (e) { return new Color('#8890a8'); }
}
