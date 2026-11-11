// bridge-dom.js — copia el estado de los cuerpos 2D a elementos DOM (piel clásica).
// Solo se escriben transform (propiedad compuesta por la GPU), nunca top/left.

/** Coloca cada elemento (Map id → HTMLElement, position:absolute en 0,0) en el centro de su cuerpo. */
export function syncElements(snapshot, elements) {
  for (const b of snapshot) {
    const el = elements.get(b.id);
    if (!el) continue;
    el.style.transform = `translate(${(b.x - b.w / 2).toFixed(2)}px, ${(b.y - b.h / 2).toFixed(2)}px) rotate(${b.angle.toFixed(4)}rad)`;
  }
}
