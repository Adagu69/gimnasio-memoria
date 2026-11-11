// main.js — punto de entrada: elige la piel visual, inicializa módulos, enlaza vistas y decide la pantalla inicial.
// Flujo: Bienvenida → Configuración → Prueba de nivel → Resultados → Plan → Gimnasio (sesión diaria).
// "El DOM es la verdad, el 3D es la piel": cada juego funciona solo con su DOM; la escena 3D se monta encima
// al entrar en la vista y se desmonta al salir.
import { $, showModal, toast } from './ui.js';
import { store } from './store.js';
import { go, onEnter, onLeave, currentView } from './router.js';
import { pares, previewMs } from './games/pares.js';
import { secuencia } from './games/secuencia.js';
import { nback } from './games/nback.js';
import { palacio } from './games/palacio.js';
import { config } from './views/config.js';
import { sesion } from './views/sesion.js';
import { mundo } from './views/mundo.js';
import { renderJuegos } from './views/juegos.js';
import { renderProgress, unlocked } from './views/progreso.js';
import { ajustes } from './views/ajustes.js';
import { initFases } from './views/fase.js';
import './views/ayuda.js';
import { initSkin, registerStage, attachView, detachView, onSkinChange } from './three/skin.js';
import { createParesStage } from './three/scenes/pares.js';
import { createCorsiStage } from './three/scenes/corsi.js';
import { createNbackStage } from './three/scenes/nback.js';
import { createPalacioStage } from './three/scenes/palacio.js';

initSkin();

pares.init();
secuencia.init();
nback.init();
palacio.init();
config.init();
sesion.init();
mundo.init({ trophies: () => unlocked().map(a => a.id) });
ajustes.init(() => { pares.idle(); nback.refresh(); palacio.refresh(); go('bienvenida'); });
initFases({ paresPreviewMs: previewMs });

// Escenas 3D por vista (solo se crean si la piel es Pixel-3D).
registerStage('pares', { host: '#p-stage', create: createParesStage });
registerStage('secuencia', { host: '#s-stage', create: createCorsiStage });
registerStage('nback', { host: '#n-stage', create: createNbackStage });
registerStage('palacio', { host: '#mp-stage', create: createPalacioStage });
const STAGED = ['hoy', 'pares', 'secuencia', 'nback', 'palacio'];

// Vistas
onEnter('hoy', () => mundo.render());
onLeave('hoy', () => mundo.leave());
onEnter('juegos', renderJuegos);
onEnter('progreso', renderProgress);
onEnter('ajustes', () => ajustes.enter());
onEnter('nback', () => nback.refresh());
onEnter('palacio', () => palacio.refresh());
STAGED.forEach(v => { onEnter(v, () => attachView(v)); onLeave(v, () => detachView(v)); });

// Al salir de un juego se detiene; si era un paso de la sesión, ésta se cancela.
onLeave('pares', () => { sesion.onLeaveGame('pares'); pares.stop(); });
onLeave('secuencia', () => { sesion.onLeaveGame('secuencia'); secuencia.stop(); });
onLeave('nback', () => { sesion.onLeaveGame('nback'); nback.stop(); });
onLeave('palacio', () => { sesion.onLeaveGame('palacio'); palacio.stop(); });
onLeave('sesion', () => sesion.onLeaveScreen());
onLeave('resultados', () => sesion.onLeaveScreen());

// Si cambia la piel (Ajustes o fallo de WebGL), la vista actual se vuelve a montar con la piel nueva.
onSkinChange((skin, reason) => {
  if (reason === 'fallo') toast('El 3D no está disponible en este dispositivo: se usa el estilo clásico.');
  const v = currentView();
  if (v === 'hoy') mundo.render();
  if (skin === '3d' && STAGED.includes(v)) attachView(v);
});

// Logros: avisar cuando se desbloquea uno nuevo
let known = new Set(unlocked().map(a => a.id));
store.onChange(() => {
  const now = unlocked();
  now.forEach(a => { if (!known.has(a.id)) toast(`Logro desbloqueado: ${a.name}`); });
  known = new Set(now.map(a => a.id));
});

// Plan Pro (demostración del modelo de negocio)
$('#pl-pro').addEventListener('click', () => showModal({
  title: 'Plan Pro',
  html: '<p>El plan Pro estará disponible en la siguiente versión. Mientras tanto, todo el entrenamiento básico es gratuito.</p>',
  actions: [{ label: 'Entendido', primary: true }]
}));

// Pantalla inicial: programa configurado → Gimnasio; si falta la prueba de nivel → lanzarla; si no → Bienvenida.
const p = store.profile;
if (p.onboarded && p.calibration) go('hoy');
else if (p.onboarded) sesion.start('calibracion');
else go('bienvenida');
