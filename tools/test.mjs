// test.mjs — prueba de punta a punta con Playwright sobre dist/index.html (flujo v2).
// Recorre: bienvenida → configuración → prueba de nivel (3 juegos) → resultados → plan → Hoy →
// sesión diaria → progreso → juego libre → ajustes. Comprueba el guardado y la ausencia de errores.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const url = pathToFileURL(resolve('dist/index.html')).href;
const errors = [];
let passed = 0;
const ok = (cond, msg) => { if (!cond) throw new Error('FALLÓ: ' + msg); passed++; console.log('  ✓', msg); };
const visible = async id => !(await page.$eval('#' + id, v => v.hidden));

const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|fonts\.g/.test(m.text())) errors.push(m.text()); });

await page.goto(url);
await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });

/* ---------- helpers de juego ---------- */
async function playPares() {
  await page.waitForSelector('#p-board:not(.preview) .cardp:not([disabled])', { timeout: 15000 });
  const cards = await page.$$('#p-board .cardp');
  const syms = await Promise.all(cards.map(c => c.getAttribute('data-s')));
  const seen = {};
  for (let i = 0; i < syms.length; i++) {
    if (seen[syms[i]] !== undefined) { await cards[seen[syms[i]]].click(); await cards[i].click(); await page.waitForTimeout(320); }
    else seen[syms[i]] = i;
  }
  await page.waitForSelector('#p-msg.ok');
}
async function installSeqRecorder() {
  await page.evaluate(() => {
    if (window.__seqInstalled) return; window.__seqInstalled = true; window.__seq = [];
    const blocks = Array.from(document.querySelectorAll('#s-grid .block'));
    new MutationObserver(() => { blocks.forEach((b, i) => { if (b.classList.contains('lit') && window.__seq[window.__seq.length - 1] !== i) window.__seq.push(i); }); })
      .observe(document.querySelector('#s-grid'), { attributes: true, subtree: true, attributeFilter: ['class'] });
    new MutationObserver(() => { if (document.querySelector('#s-state').textContent === 'Observa') window.__seq = []; })
      .observe(document.querySelector('#s-state'), { childList: true, characterData: true, subtree: true });
  });
}
const waitTurn = () => page.waitForFunction(() => document.querySelector('#s-state').textContent === 'Tu turno', null, { timeout: 30000 });
async function playSecuencia(rounds) {
  for (let r = 0; r < rounds; r++) {
    await waitTurn();
    const seq = await page.evaluate(() => window.__seq.slice());
    const mode = await page.$eval('#s-mode [aria-pressed="true"]', b => b.dataset.mode);
    for (const i of (mode === 'inverso' ? [...seq].reverse() : seq)) { await page.click(`#s-grid .block:nth-child(${i + 1})`); await page.waitForTimeout(60); }
    await page.waitForTimeout(1300);
  }
  for (let k = 0; k < 2; k++) { // dos errores seguidos terminan
    await waitTurn();
    const seq = await page.evaluate(() => window.__seq.slice());
    const wrong = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(i => i !== seq[0]);
    await page.click(`#s-grid .block:nth-child(${wrong + 1})`); await page.waitForTimeout(800);
  }
  await page.waitForFunction(() => document.querySelector('#s-state').textContent === 'Fin');
}
async function playNback() {
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

/* ---------- Bienvenida y configuración ---------- */
console.log('Bienvenida y configuración');
ok(await visible('v-bienvenida'), 'arranca en la bienvenida');
await page.click('#b-start');
await page.click('#w-next'); // sin nombre
ok(await page.$eval('#w-name', i => i === document.activeElement), 'exige el nombre antes de continuar');
await page.fill('#w-name', 'Adriel'); await page.click('#w-next');
await page.click('#w-goal [data-value="entrenar"]'); await page.waitForTimeout(300);
ok(await page.$eval('#w-areas input:checked', () => true), 'muestra las áreas con todas marcadas');
await page.click('#w-next'); await page.click('#w-next');
await page.click('#w-age [data-value="25-34"]'); await page.waitForTimeout(300);
await page.click('#w-diff [data-value="estandar"]'); await page.waitForTimeout(400);
ok(await visible('v-sesion'), 'al terminar la configuración abre la prueba de nivel');
ok((await page.textContent('#s-title')) === 'Pares', 'la prueba empieza con Pares');
ok((await page.$$eval('#s-stepper span', s => s.length)) === 4, 'stepper con 3 juegos + resultados');

/* ---------- Prueba de nivel ---------- */
console.log('Prueba de nivel');
await page.click('#s-go');
ok(await visible('v-pares') && !!(await page.$('#rutina-banner')), 'abre Pares con el banner de prueba de nivel');
await playPares();
await page.waitForSelector('#s-result:not([hidden])');
ok((await page.textContent('#s-rtitle')).includes('Pares ha puesto a prueba'), 'muestra la tarjeta de resultado de Pares');
await page.click('#s-next');
ok((await page.textContent('#s-title')) === 'Secuencia', 'pasa a la intro de Secuencia');
await page.click('#s-go'); await installSeqRecorder();
await playSecuencia(3);
await page.waitForSelector('#s-result:not([hidden])');
ok((await page.textContent('#s-rdetail')).includes('Amplitud 5'), 'Secuencia registra amplitud 5');
await page.click('#s-next');
await page.click('#s-go');
await page.waitForSelector('#n-start:has-text("Detener")');
await playNback();
await page.waitForSelector('#s-result:not([hidden])');
ok((await page.textContent('#s-next')) === 'Ver resultados', 'último paso ofrece ver resultados');
await page.click('#s-next');
ok(await visible('v-resultados'), 'muestra la pantalla de resultados');
ok((await page.$$eval('#r-grid .rcard', r => r.length)) === 3, 'resultados con 3 áreas');
const im0 = +(await page.textContent('#r-global'));
ok(im0 > 0 && im0 <= 100, `índice global inicial ${im0}`);
await page.click('#r-next');
ok(await visible('v-plan'), 'muestra el plan de 30 días');
ok((await page.$$eval('#p-rows tr', r => r.length)) === 4, 'plan con 3 áreas + global');
await page.click('#p-next');
ok(await visible('v-hoy'), 'llega al panel Hoy');
ok((await page.textContent('#hoy-greet')).includes('Adriel'), 'saluda por el nombre');
ok((await page.textContent('#hoy-im')) !== '–', 'muestra el índice de memoria actual');

/* ---------- Sesión diaria ---------- */
console.log('Sesión diaria');
ok(await page.$eval('#hoy-done', e => e.hidden), 'aún no marca la sesión de hoy');
await page.click('#hoy-start');
ok((await page.textContent('#s-title')) === 'Pares', 'la sesión diaria empieza con Pares');
await page.click('#s-go'); await playPares(); await page.waitForSelector('#s-result:not([hidden])'); await page.click('#s-next');
await page.click('#s-go'); await installSeqRecorder(); await playSecuencia(2); await page.waitForSelector('#s-result:not([hidden])'); await page.click('#s-next');
await page.click('#s-go'); await page.waitForSelector('#n-start:has-text("Detener")'); await playNback(); await page.waitForSelector('#s-result:not([hidden])');
ok((await page.textContent('#s-next')) === 'Ver resumen', 'último paso de la sesión diaria ofrece el resumen');
await page.click('#s-next');
ok((await page.textContent('#s-rtitle')) === 'Sesión de hoy completada', 'cierra la sesión diaria con resumen');
await page.click('#s-next');
ok(await visible('v-hoy') && !(await page.$eval('#hoy-done', e => e.hidden)), 'Hoy marca la sesión completada');
ok((await page.textContent('#hoy-streak')).includes('1'), 'racha de 1 día');
ok((await page.$$eval('#hoy-cal .c.on', c => c.length)) === 1, 'calendario marca el día de hoy');
ok((await page.$$eval('#hoy-games .done', c => c.length)) === 3, 'los 3 ejercicios de hoy aparecen hechos');

/* ---------- Cancelar una sesión navegando ---------- */
await page.click('#hoy-start'); await page.click('#s-go');
await page.click('.side nav [data-go="juegos"]');
ok(await visible('v-juegos') && !(await page.$('#rutina-banner')), 'salir de un juego cancela la sesión');

/* ---------- Juego libre y progreso ---------- */
console.log('Juego libre y progreso');
await page.click('#v-juegos [data-go="nback"]');
ok(await page.$eval('#n-seg [aria-pressed="true"]', b => b.dataset.n) === '4', 'N-Back arranca con el N recomendado (4) tras dos sesiones perfectas (2→3→4)');
await page.click('.side nav [data-go="progreso"]');
const rows = await page.$$eval('#pg-table tbody tr', r => r.length);
ok(rows === 6, `historial con 6 sesiones (hay ${rows})`);
ok((await page.$$eval('.badge.on', b => b.length)) >= 4, 'desbloquea logros (primera sesión, 3 estrellas, prueba de nivel, sesión completa)');
ok((await page.$$eval('#pg-im .bar', b => b.length)) === 3, 'barras del índice por área');

/* ---------- Persistencia y recarga ---------- */
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gimnasio-memoria.v2')));
ok(saved.profile.onboarded && saved.profile.calibration && saved.profile.ageRange === '25-34', 'perfil y prueba de nivel guardados');
ok(saved.sessions.length === 6 && saved.routines.length === 1, '6 sesiones y 1 sesión diaria guardadas');
await page.reload(); await page.waitForTimeout(300);
ok(await visible('v-hoy'), 'al recargar con programa configurado abre Hoy directamente');

/* ---------- Ajustes: borrar ---------- */
await page.click('.side nav [data-go="ajustes"]');
ok((await page.textContent('#a-profile')).includes('Objetivo'), 'ajustes resume el programa');
await page.click('#a-clear'); await page.click('#a-yes');
ok(await visible('v-bienvenida'), 'borrar progreso vuelve a la bienvenida');
ok(JSON.parse(await page.evaluate(() => localStorage.getItem('gimnasio-memoria.v2'))).sessions.length === 0, 'el almacén queda vacío');

ok(errors.length === 0, 'sin errores de consola' + (errors.length ? ': ' + errors.join(' | ') : ''));
console.log(`\n${passed} comprobaciones correctas`);
await browser.close();
