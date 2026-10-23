// main.js — punto de entrada: inicializa módulos, enlaza vistas y da la bienvenida.
import { $, showModal, toast } from './ui.js';
import { store } from './store.js';
import { go, onEnter, onLeave } from './router.js';
import { pares } from './games/pares.js';
import { secuencia } from './games/secuencia.js';
import { nback } from './games/nback.js';
import { renderHome } from './views/home.js';
import { rutina } from './views/rutina.js';
import { renderProgress, unlocked } from './views/progreso.js';
import { ajustes } from './views/ajustes.js';
import './views/ayuda.js';

pares.init();
secuencia.init();
nback.init();
rutina.init();
ajustes.init(() => { pares.idle(); nback.refresh(); renderHome(); });

// Vistas
onEnter('home', renderHome);
onEnter('progreso', renderProgress);
onEnter('rutina', () => rutina.enter());
onEnter('ajustes', () => ajustes.enter());
onEnter('nback', () => nback.refresh());

// Al salir de un juego se detiene; si era un paso de la rutina, ésta se cancela.
onLeave('pares', () => { rutina.onLeaveGame('pares'); pares.stop(); });
onLeave('secuencia', () => { rutina.onLeaveGame('secuencia'); secuencia.stop(); });
onLeave('nback', () => { rutina.onLeaveGame('nback'); nback.stop(); });

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

// Bienvenida: pedir nombre la primera vez
function welcome() {
  showModal({
    title: 'Bienvenido al Gimnasio de Memoria',
    html: '<p class="muted">¿Cómo te llamas? Usaremos tu nombre para saludarte y llevar tu progreso en este navegador.</p><input id="w-name" type="text" maxlength="24" placeholder="Tu nombre" autocomplete="given-name">',
    actions: [
      { label: 'Ahora no', ghost: true, onClick: () => { store.setName(''); } },
      { label: 'Empezar', primary: true, onClick: () => { store.setName($('#w-name').value || ''); renderHome(); } }
    ]
  });
  $('#w-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('#modal-actions .primary').click(); });
}

go('home');
if (!store.profile.name && store.sessions.length === 0 && !store.welcomed()) {
  store.markWelcomed();
  welcome();
}
