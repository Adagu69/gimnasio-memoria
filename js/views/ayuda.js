// ayuda.js — "¿Cómo se juega?" por minijuego, con la base teórica de cada uno.
import { showModal } from '../ui.js';

const HELP = {
  pares: {
    title: 'Pares · ¿Cómo se juega?',
    steps: [
      'El tablero se muestra destapado unos segundos: memoriza dónde está cada símbolo.',
      'Luego se tapa. Voltea dos cartas por intento; si coinciden, se quedan abiertas.',
      'Menos intentos = más eficiencia y más estrellas (3★ si usas hasta 1,5 intentos por pareja).',
      'Al completar un nivel se desbloquea el siguiente, con un tablero más grande.'
    ],
    theory: 'Ejercita el almacén visual a corto plazo y el repaso que lo pasa a largo plazo (modelo multialmacén de Atkinson y Shiffrin, 1968).'
  },
  secuencia: {
    title: 'Secuencia · ¿Cómo se juega?',
    steps: [
      'Observa el orden en que se encienden los bloques; cada uno tiene su propio tono.',
      'Cuando diga "Tu turno", toca los bloques en el mismo orden (o al revés, en modo inverso).',
      'Empiezas con 3 bloques. Cada acierto añade uno; tienes dos intentos por longitud.',
      'Tu amplitud es la longitud más larga que lograste repetir.'
    ],
    theory: 'Adaptación de la tarea de bloques de Corsi (1972). Mide la amplitud visoespacial, relacionada con el límite de 7 ± 2 elementos de Miller (1956) y con la agenda visoespacial de Baddeley y Hitch (1974).'
  },
  nback: {
    title: 'N-Back · ¿Cómo se juega?',
    steps: [
      'Cada 2,5 segundos aparece un cuadro en una de las 9 celdas.',
      'Pulsa "Coincide" (o la barra espaciadora) cuando la posición sea la misma que hace N turnos.',
      'Hay 20 turnos puntuables. Se cuentan aciertos, omisiones y falsas alarmas.',
      'Con precisión ≥ 85 % el juego te sube N; con menos de 60 % te lo baja. El N recomendado queda guardado.'
    ],
    theory: 'Tarea de Kirchner (1958) usada en el entrenamiento de memoria de trabajo (Jaeggi et al., 2008). Exige mantener y actualizar información a la vez: el ejecutivo central de Baddeley y Hitch (1974).'
  }
};

export function showHelp(game) {
  const h = HELP[game]; if (!h) return;
  showModal({
    title: h.title,
    html: `<ul>${h.steps.map(s => `<li>${s}</li>`).join('')}</ul><p class="theory">${h.theory}</p>`,
    actions: [{ label: 'Entendido', primary: true }]
  });
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-help]');
  if (b) showHelp(b.dataset.help);
});
