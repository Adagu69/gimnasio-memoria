// test.mjs — prueba de punta a punta con Playwright sobre dist/index.html.
// Juega Pares, Secuencia y N-Back (leyendo el estado interno del DOM), luego una rutina completa,
// y comprueba que todo quede guardado en localStorage y que no haya errores de consola.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const url = pathToFileURL(resolve('dist/index.html')).href;
const errors = [];
let passed = 0;
const ok = (cond, msg) => { if (!cond) throw new Error('FALLÓ: ' + msg); passed++; console.log('  ✓', msg); };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|fonts\.g/.test(m.text())) errors.push(m.text()); });

await page.goto(url);
await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });

// Bienvenida
console.log('Bienvenida');
await page.fill('#w-name', 'Adriel');
await page.click('#modal-actions .primary');
ok(await page.textContent('#home-greet') === 'Hola, Adriel', 'guarda el nombre y saluda');

// ---- Pares: resolver leyendo data-s ----
async function playPares() {
  await page.waitForSelector('#p-board:not(.preview) .cardp:not([disabled])', { timeout: 15000 });
  const cards = await page.$$('#p-board .cardp');
  const syms = await Promise.all(cards.map(c => c.getAttribute('data-s')));
  const seen = {};
  for (let i = 0; i < syms.length; i++) {
    if (seen[syms[i]] !== undefined) {
      await cards[seen[syms[i]]].click(); await cards[i].click(); await page.waitForTimeout(320);
    } else seen[syms[i]] = i;
  }
  await page.waitForSelector('#p-msg.ok');
}
console.log('Pares');
await page.click('nav [data-go="pares"]');
await page.click('#p-start');
ok(await page.$eval('#p-board', b => b.classList.contains('preview')), 'muestra la fase de memorización');
await playPares();
ok((await page.textContent('#p-msg')).includes('Nivel 1 completado'), 'completa el nivel 1');
ok((await page.$$eval('#p-stars span.on', s => s.length)) === 3, 'otorga 3 estrellas con intentos mínimos');
await page.click('#p-next');
ok(await page.textContent('#p-level') === '2', 'avanza al nivel 2');
await playPares();
ok((await page.textContent('#p-msg')).includes('Nivel 2 completado'), 'completa el nivel 2');

// ---- Secuencia: leer la secuencia observando los bloques encendidos ----
async function playSecuencia(rounds) {
  for (let r = 0; r < rounds; r++) {
    const seq = await page.evaluate(() => new Promise(res => {
      const blocks = Array.from(document.querySelectorAll('#s-grid .block'));
      const out = [];
      const obs = new MutationObserver(() => {
        blocks.forEach((b, i) => { if (b.classList.contains('lit') && out[out.length - 1] !== i) out.push(i); });
        if (!blocks[0].disabled) { obs.disconnect(); res(out); }
      });
      blocks.forEach(b => obs.observe(b, { attributes: true }));
    }));
    const mode = await page.$eval('#s-mode [aria-pressed="true"]', b => b.dataset.mode);
    const order = mode === 'inverso' ? [...seq].reverse() : seq;
    for (const i of order) { await page.click(`#s-grid .block:nth-child(${i + 1})`); await page.waitForTimeout(60); }
    await page.waitForTimeout(1300);
  }
}
console.log('Secuencia');
await page.click('nav [data-go="secuencia"]');
await page.click('#s-start');
await playSecuencia(3);
ok(await page.textContent('#s-span') === '5', 'repite 3 secuencias y llega a amplitud 5');
// fallar dos veces para terminar
for (let k = 0; k < 2; k++) {
  await page.waitForFunction(() => !document.querySelector('#s-grid .block').disabled, null, { timeout: 15000 });
  const seq = await page.evaluate(() => Array.from(document.querySelectorAll('#s-grid .block')));
  // tocar un bloque incorrecto: el que no sea el primero esperado (probar dos candidatos)
  const txt = await page.textContent('#s-state');
  ok(txt === 'Tu turno', 'espera la respuesta del jugador (' + (k + 1) + ')');
  // elegimos dos bloques distintos; uno de ellos seguro es incorrecto como primer toque
  await page.click('#s-grid .block:nth-child(1)'); await page.waitForTimeout(80);
  const state = await page.textContent('#s-state');
  if (state === 'Tu turno') { await page.click('#s-grid .block:nth-child(1)'); } // segundo toque igual: no puede ser correcto dos veces seguidas
  await page.waitForTimeout(700);
}
ok(await page.textContent('#s-state') === 'Fin', 'termina tras dos errores en la misma longitud');
ok((await page.textContent('#s-msg')).includes('Amplitud lograda: 5'), 'registra la amplitud 5');

// ---- N-Back: responder leyendo la celda encendida ----
async function playNback(N) {
  await page.click(`#n-seg [data-n="${N}"]`);
  await page.click('#n-start');
  const hist = [];
  while (true) {
    const done = await page.evaluate(() => document.querySelector('#n-start').textContent === 'Empezar');
    if (done) break;
    const on = await page.$$eval('#n-grid .cell', cs => cs.findIndex(c => c.classList.contains('on')));
    if (on >= 0 && (hist.length === 0 || hist[hist.length - 1].idx !== on || Date.now() - hist[hist.length - 1].t > 2000)) {
      hist.push({ idx: on, t: Date.now() });
      const k = hist.length - 1;
      if (k >= N && hist[k].idx === hist[k - N].idx) await page.keyboard.press('Space');
    }
    await page.waitForTimeout(100);
  }
}
console.log('N-Back');
await page.click('nav [data-go="nback"]');
ok(await page.$eval('#n-seg [aria-pressed="true"]', b => b.dataset.n) === '2', 'arranca con N = 2 por defecto');
await playNback(2);
const acc = +(await page.textContent('#n-msg')).match(/Precisión (\d+)%/)[1];
ok(acc >= 85, `precisión ${acc}% jugando perfecto (N=2)`);
ok((await page.textContent('#n-reco')).includes('Sube a N = 3'), 'recomienda subir a N = 3');
ok(await page.$eval('#n-seg [aria-pressed="true"]', b => b.dataset.n) === '3', 'guarda N = 3 como nuevo valor inicial');

// ---- Progreso ----
console.log('Progreso');
await page.click('nav [data-go="progreso"]');
const rows = await page.$$eval('#pg-table tbody tr', r => r.length);
ok(rows === 4, `historial con 4 sesiones (hay ${rows})`);
ok((await page.$$eval('.badge.on', b => b.length)) >= 2, 'desbloquea logros (Primera sesión, Tres estrellas)');

// ---- Rutina completa ----
console.log('Rutina');
await page.click('nav [data-go="home"]');
await page.click('#v-home [data-go="rutina"]');
await page.click('#r-start');
ok(!(await page.$eval('#v-pares', v => v.hidden)), 'la rutina abre Pares');
ok(!!(await page.$('#rutina-banner')), 'muestra el banner de rutina');
await playPares();
await page.click('#r-continue');
ok(!(await page.$eval('#v-secuencia', v => v.hidden)), 'pasa a Secuencia');
await playSecuencia(2);
for (let k = 0; k < 2; k++) {
  await page.waitForFunction(() => !document.querySelector('#s-grid .block').disabled, null, { timeout: 15000 });
  await page.click('#s-grid .block:nth-child(1)'); await page.waitForTimeout(80);
  if (await page.textContent('#s-state') === 'Tu turno') await page.click('#s-grid .block:nth-child(1)');
  await page.waitForTimeout(700);
}
await page.click('#r-continue');
ok(!(await page.$eval('#v-nback', v => v.hidden)), 'pasa a N-Back');
await page.waitForSelector('#n-start:has-text("Detener")');
// jugar N-Back ya iniciado por la rutina
{
  const N = +(await page.$eval('#n-seg [aria-pressed="true"]', b => b.dataset.n));
  const hist = [];
  while (await page.evaluate(() => document.querySelector('#n-start').textContent !== 'Empezar')) {
    const on = await page.$$eval('#n-grid .cell', cs => cs.findIndex(c => c.classList.contains('on')));
    if (on >= 0 && (hist.length === 0 || hist[hist.length - 1].idx !== on || Date.now() - hist[hist.length - 1].t > 2000)) {
      hist.push({ idx: on, t: Date.now() }); const k = hist.length - 1;
      if (k >= N && hist[k].idx === hist[k - N].idx) await page.keyboard.press('Space');
    }
    await page.waitForTimeout(100);
  }
}
await page.click('#r-continue');
ok(!(await page.$eval('#v-rutina', v => v.hidden)), 'vuelve a la vista Rutina con el resumen');
const score = +(await page.textContent('.score-big .n'));
ok(score > 0 && score <= 100, `puntaje del día ${score}`);
await page.click('nav [data-go="home"]');
ok((await page.textContent('#home-streak')).includes('1 día'), 'racha de 1 día en el inicio');

// ---- Persistencia ----
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gimnasio-memoria.v2')));
ok(saved.profile.name === 'Adriel', 'perfil guardado');
ok(saved.sessions.length === 7, `7 sesiones guardadas (hay ${saved.sessions.length})`);
ok(saved.routines.length === 1, '1 rutina guardada');
ok(saved.settings.paresLevel >= 3, 'nivel de Pares desbloqueado ≥ 3');

// ---- Ajustes: borrar ----
await page.click('nav [data-go="ajustes"]');
await page.click('#a-clear'); await page.click('#a-yes');
const after = await page.evaluate(() => localStorage.getItem('gimnasio-memoria.v2'));
ok(JSON.parse(after).sessions.length === 0, 'borrar progreso vacía las sesiones');

ok(errors.length === 0, 'sin errores de consola' + (errors.length ? ': ' + errors.join(' | ') : ''));
console.log(`\n${passed} comprobaciones correctas`);
await browser.close();
