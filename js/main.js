// main.js — punto de entrada: inicializa módulos, enlaza vistas y decide la pantalla inicial.
// Flujo: Bienvenida → Configuración → Prueba de nivel → Resultados → Plan → Hoy (sesión diaria).
import { $, showModal, toast } from './ui.js';
import { store } from './store.js';
import { go, onEnter, onLeave } from './router.js';
import { pares } from './games/pares.js';
import { secuencia } from './games/secuencia.js';
import { nback } from './games/nback.js';
import { config } from './views/config.js';
import { sesion } from './views/sesion.js';
import { hoy } from './views/hoy.js';
import { renderJuegos } from './views/juegos.js';
import { renderProgress, unlocked } from './views/progreso.js';
import { ajustes } from './views/ajustes.js';
import './views/ayuda.js';

pares.init();
secuencia.init();
nback.init();
config.init();
sesion.init();
hoy.init();
ajustes.init(() => { pares.idle(); nback.refresh(); go('bienvenida'); });

// Vistas
onEnter('hoy', () => hoy.render());
onEnter('juegos', renderJuegos);
onEnter('progreso', renderProgress);
onEnter('ajustes', () => ajustes.enter());
onEnter('nback', () => nback.refresh());

// Al salir de un juego se detiene; si era un paso de la sesión, ésta se cancela.
onLeave('pares', () => { sesion.onLeaveGame('pares'); pares.stop(); });
onLeave('secuencia', () => { sesion.onLeaveGame('secuencia'); secuencia.stop(); });
onLeave('nback', () => { sesion.onLeaveGame('nback'); nback.stop(); });

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

// Pantalla inicial: programa configurado → Hoy; si falta la prueba de nivel → lanzarla; si no → Bienvenida.
const p = store.profile;
if (p.onboarded && p.calibration) go('hoy');
else if (p.onboarded) sesion.start('calibracion');
else go('bienvenida');
