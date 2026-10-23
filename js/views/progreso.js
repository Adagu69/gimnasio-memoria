// progreso.js — panel de progreso: indicadores globales, tarjeta por juego, logros e historial.
import { $, bars, avg, fmtDate } from '../ui.js';
import { store } from '../store.js';

export const ACHIEVEMENTS = [
  { id: 'primera', icon: '✓', name: 'Primera sesión', desc: 'Completa cualquier ejercicio', test: d => d.sessions.length >= 1 },
  { id: 'diez', icon: '10', name: 'Constancia', desc: '10 sesiones jugadas', test: d => d.sessions.length >= 10 },
  { id: 'pares6', icon: '♦', name: 'Tablero 6×6', desc: 'Completa el nivel 6 de Pares', test: d => d.sessions.some(s => s.game === 'pares' && s.level >= 6) },
  { id: 'tresestrellas', icon: '★', name: 'Tres estrellas', desc: 'Pares con 3 estrellas', test: d => d.sessions.some(s => s.game === 'pares' && s.stars === 3) },
  { id: 'span6', icon: '6', name: 'Amplitud 6', desc: 'Secuencia de 6 bloques', test: d => d.sessions.some(s => s.game === 'secuencia' && s.span >= 6) },
  { id: 'inverso', icon: '↺', name: 'Al revés', desc: 'Amplitud 4 en modo inverso', test: d => d.sessions.some(s => s.game === 'secuencia' && s.mode === 'inverso' && s.span >= 4) },
  { id: 'nback3', icon: 'N3', name: 'Memoria de trabajo', desc: 'N-Back con N = 3 y precisión ≥ 85 %', test: d => d.sessions.some(s => s.game === 'nback' && s.n >= 3 && s.acc >= 85) },
  { id: 'rutina', icon: '▶', name: 'Rutina completa', desc: 'Termina una rutina del día', test: d => d.routines.length >= 1 },
  { id: 'racha3', icon: '🔥', name: 'Racha de 3', desc: 'Tres días seguidos de rutina', test: () => store.streak() >= 3 }
];

export function unlocked() { const d = store.data; return ACHIEVEMENTS.filter(a => a.test(d)); }

function card(t, kpis, chart, cap) {
  return `<div class="pcard"><h3>${t}</h3><div class="kpis">${kpis.map(k => `<div><div class="k">${k[0]}</div><div class="v">${k[1]}</div></div>`).join('')}</div>${chart}<span class="muted small">Últimas 10 sesiones: ${cap}</span></div>`;
}

export function renderProgress() {
  const p = store.byGame('pares'), s = store.byGame('secuencia'), n = store.byGame('nback');
  const all = store.sessions, routines = store.routines;
  const last10 = a => a.slice(-10);

  $('#pg-top').innerHTML = [
    ['Sesiones', all.length],
    ['Rutinas', routines.length],
    ['Racha', store.streak() + ' d'],
    ['Último puntaje', routines.length ? routines[routines.length - 1].score : '–']
  ].map(k => `<div><div class="k">${k[0]}</div><div class="v">${k[1]}</div></div>`).join('');

  $('#pg-cards').innerHTML =
    card('Pares', [['Sesiones', p.length], ['Mejor nivel', p.length ? Math.max(...p.map(x => x.level)) : '–'], ['Eficiencia media', p.length ? Math.round(avg(p.map(x => x.eff))) + '%' : '–']], bars(last10(p).map(x => x.eff), 100), 'eficiencia') +
    card('Secuencia', [['Sesiones', s.length], ['Mejor amplitud', s.length ? Math.max(...s.map(x => x.span)) : '–'], ['Amplitud media', s.length ? avg(s.map(x => x.span)).toFixed(1) : '–']], bars(last10(s).map(x => x.span), 9), 'amplitud') +
    card('N-Back', [['Sesiones', n.length], ['Mejor precisión', n.length ? Math.max(...n.map(x => x.acc)) + '%' : '–'], ['N más alto', n.length ? Math.max(...n.map(x => x.n)) : '–']], bars(last10(n).map(x => x.acc), 100), 'precisión');

  const got = new Set(unlocked().map(a => a.id));
  $('#pg-badges').innerHTML = ACHIEVEMENTS.map(a =>
    `<div class="badge ${got.has(a.id) ? 'on' : ''}"><i>${a.icon}</i><div><b>${a.name}</b><span>${a.desc}</span></div></div>`).join('');

  const rows = all.slice(-15).reverse().map(x => {
    const d = fmtDate(x.t);
    if (x.game === 'pares') return [d, 'Pares', `Nivel ${x.level} · ${'★'.repeat(x.stars || 0)}`, `${x.moves} intentos · ${x.secs} s · ${x.eff}%`];
    if (x.game === 'secuencia') return [d, 'Secuencia', `Amplitud ${x.span}`, `${x.mode || 'directo'} · falló con ${x.failedAt} bloques`];
    return [d, 'N-Back', `Precisión ${x.acc}%`, `N=${x.n} · ${x.hits} aciertos · ${x.miss} omisiones · ${x.fa} falsas alarmas`];
  });
  $('#pg-table tbody').innerHTML = rows.length
    ? rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('')
    : '<tr><td colspan="4" class="muted">Juega una sesión para ver el historial.</td></tr>';
}
