// ajustes.js — nombre, sonido, volumen, tema y borrado de datos.
import { $, $$, toast } from '../ui.js';
import { store } from '../store.js';
import { tone } from '../audio.js';
import { sesion } from './sesion.js';
import { config } from './config.js';
import { GAMES } from '../indice.js';

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
}

export const ajustes = {
  init(onDataCleared) {
    const s = store.settings;
    $('#a-sound').checked = s.sound;
    $('#a-vol').value = s.volume;
    $$('#a-theme button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === s.theme)));
    applyTheme(s.theme);

    $('#a-save-name').addEventListener('click', () => { store.setName($('#a-name').value); toast('Nombre guardado'); });
    $('#a-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('#a-save-name').click(); });
    $('#a-sound').addEventListener('change', e => { store.setSetting('sound', e.target.checked); if (e.target.checked) tone(660, 120); });
    $('#a-vol').addEventListener('input', e => { store.setSetting('volume', +e.target.value); });
    $('#a-vol').addEventListener('change', () => tone(660, 120));
    $('#a-theme').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $$('#a-theme button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      store.setSetting('theme', b.dataset.theme); applyTheme(b.dataset.theme);
    });
    $('#a-recal').addEventListener('click', () => sesion.start('calibracion'));
    $('#a-reconfig').addEventListener('click', () => config.restart());
    $('#a-clear').addEventListener('click', () => { $('#a-confirm').hidden = false; });
    $('#a-no').addEventListener('click', () => { $('#a-confirm').hidden = true; });
    $('#a-yes').addEventListener('click', () => {
      store.clear(); $('#a-confirm').hidden = true; this.enter(); applyTheme('system');
      $$('#a-theme button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === 'system')));
      $('#a-sound').checked = true; $('#a-vol').value = 60;
      toast('Progreso borrado'); if (onDataCleared) onDataCleared();
    });
  },
  enter() {
    const p = store.profile; $('#a-name').value = p.name;
    const goals = { entrenar: 'entrenar la memoria', mantener: 'mantener la mente activa', superar: 'superarse', explorar: 'explorar' };
    $('#a-profile').textContent = p.onboarded
      ? `Objetivo: ${goals[p.goal] || p.goal} · Áreas: ${(p.areas || []).map(g => GAMES[g].name).join(', ')} · Dificultad: ${p.difficulty} · Prueba de nivel: ${p.calibration ? new Date(p.calibration.date).toLocaleDateString('es-PE') + ' (índice ' + p.calibration.global + ')' : 'pendiente'}`
      : 'Programa sin configurar.';
  }
};
