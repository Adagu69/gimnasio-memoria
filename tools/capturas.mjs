// capturas.mjs — genera las capturas de pantalla del flujo v3 (Pixel-3D) en docs/capturas/.
// Juega automáticamente para que las pantallas muestren datos reales.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const url = pathToFileURL(resolve('dist/index.html')).href + '?visual=pixel3d&perf=off';
const out = 'docs/capturas';
mkdirSync(out, { recursive: true });

// SwiftShader: WebGL en modo headless para que se vea la piel Pixel-3D.
const browser = await chromium.launch({
  ...(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});
const ctx = await browser.newContext({ viewport: { width: 1200, height: 860 }, deviceScaleFactor: 1.5, locale: 'es-PE' });
const page = await ctx.newPage();
const shot = (name, opts = {}) => page.screenshot({ path: `${out}/${name}.png`, ...opts });
const wait = ms => page.waitForTimeout(ms);

async function playPares(shotMid) {
  await page.waitForSelector('#p-board:not(.preview) .cardp:not([disabled])');
  const cards = await page.$$('#p-board .cardp');
  const syms = await Promise.all(cards.map(c => c.getAttribute('data-s')));
  const seen = {};
  for (let i = 0; i < syms.length; i++) {
    if (seen[syms[i]] !== undefined) { await cards[seen[syms[i]]].click(); await cards[i].click(); await wait(330); if (shotMid && i === syms.length - 3) await shot(shotMid); }
    else seen[syms[i]] = i;
  }
  await page.waitForSelector('#p-msg.ok'); await wait(400);
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
async function playSecuencia(rounds, shots = {}) {
  for (let r = 0; r < rounds; r++) {
    await waitTurn();
    const seq = await page.evaluate(() => window.__seq.slice());
    for (const i of seq) { await page.click(`#s-grid .block:nth-child(${i + 1})`); await wait(120); }
    if (shots.correct && r === rounds - 1) { await wait(150); await shot(shots.correct); }
    await wait(1400);
  }
  for (let k = 0; k < 2; k++) {
    await waitTurn(); const seq = await page.evaluate(() => window.__seq.slice());
    await page.click(`#s-grid .block:nth-child(${[0, 1, 2, 3, 4, 5, 6, 7, 8].find(i => i !== seq[0]) + 1})`); await wait(800);
  }
  await page.waitForFunction(() => document.querySelector('#s-state').textContent === 'Fin');
}
async function playNback(shotMid) {
  const N = +(await page.$eval('#n-seg [aria-pressed="true"]', b => b.dataset.n));
  const hist = []; let taken = false;
  while (await page.evaluate(() => document.querySelector('#n-start').textContent !== 'Empezar')) {
    const on = await page.$$eval('#n-grid .cell', cs => cs.findIndex(c => c.classList.contains('on')));
    if (on >= 0 && (hist.length === 0 || hist[hist.length - 1].idx !== on || Date.now() - hist[hist.length - 1].t > 2000)) {
      hist.push({ idx: on, t: Date.now() }); const k = hist.length - 1;
      if (k >= N && hist[k].idx === hist[k - N].idx) { await page.keyboard.press('Space'); if (shotMid && !taken && k > 6) { await wait(150); await shot(shotMid); taken = true; } }
    }
    await wait(100);
  }
}

/** Palacio: registra el objeto de cada lugar en OBSERVA y responde bien en TU TURNO (con capturas opcionales). */
async function playPalacio(shots = {}) {
  await page.evaluate(() => {
    window.__pal = {};
    const cap = document.querySelector('#mp-caption');
    if (!window.__palObs) {
      window.__palObs = new MutationObserver(() => { if (cap.dataset.obj && document.querySelector('#mp-stage').dataset.phase === 'observa') window.__pal[cap.dataset.locus] = cap.dataset.obj; });
      window.__palObs.observe(cap, { attributes: true, attributeFilter: ['data-obj', 'data-locus'] });
    }
  });
  if (shots.observa) { await page.waitForFunction(() => document.querySelector('#mp-caption').dataset.obj); await wait(250); await shot(shots.observa); }
  await page.waitForFunction(() => document.querySelector('#mp-stage').dataset.phase === 'turno', null, { timeout: 60000 });
  let first = true;
  while (await page.$eval('#mp-stage', s => s.dataset.phase) === 'turno') {
    const btn = await page.$('#mp-options button:not([disabled])');
    if (!btn) { await wait(80); continue; }
    if (first && shots.turno) { await wait(200); await shot(shots.turno); }
    first = false;
    const locus = await page.$eval('#mp-stage', s => s.dataset.locus);
    const want = await page.evaluate(l => window.__pal[l], locus);
    await page.click(`#mp-options button[data-obj="${want}"]`);
    await page.waitForFunction(l => document.querySelector('#mp-stage').dataset.locus !== l || document.querySelector('#mp-stage').dataset.phase !== 'turno', locus, { timeout: 5000 });
  }
}

await page.goto(url); await wait(600);
await shot('01-bienvenida');
await page.click('#b-start'); await wait(400);
await page.fill('#w-name', 'Adriel'); await page.click('#w-next'); await wait(400);
await shot('02-config-objetivo');
await page.click('#w-goal [data-value="entrenar"]'); await wait(500);
await shot('03-config-areas');
await page.click('#w-next'); await wait(500);
await shot('04-config-musculo');
await page.click('#w-next'); await wait(300); await page.click('#w-age [data-value="25-34"]'); await wait(500);
await shot('05-config-dificultad');
await page.click('#w-diff [data-value="estandar"]'); await wait(700);
await shot('06-prueba-intro-pares');
await page.click('#s-go'); await wait(500);
await shot('07-pares-memorizar');
await playPares('08-pares-jugando');
await page.waitForSelector('#s-result:not([hidden])'); await wait(500);
await shot('09-prueba-resultado-pares');
await page.click('#s-next'); await wait(500);
await page.click('#s-go'); await installSeqRecorder(); await wait(900);
await shot('10-secuencia-observa');
await playSecuencia(3, { correct: '11-secuencia-correcto' });
await page.waitForSelector('#s-result:not([hidden])'); await page.click('#s-next'); await wait(400);
await page.click('#s-go'); await page.waitForSelector('#n-start:has-text("Detener")');
await playNback('12-nback-jugando');
await page.waitForSelector('#s-result:not([hidden])'); await wait(400);
await shot('13-prueba-resultado-nback');
await page.click('#s-next'); await wait(500);
await page.click('#s-go'); await wait(300);
await playPalacio({ observa: '28-palacio-observa', turno: '29-palacio-turno' });
await page.waitForSelector('#s-result:not([hidden])'); await wait(1200);
await shot('31-resultado-fisica-palacio');
await page.click('#s-next'); await wait(1500);
await shot('14-resultados-prueba-nivel');
await page.click('#r-next'); await wait(700);
await shot('15-plan-30-dias');
await page.click('#p-next'); await wait(1500);
await shot('16-hoy');
await page.click('[data-station="palacio"]'); await wait(900);
await shot('30-mundo-estacion');
await page.click('#st-close'); await wait(500);
// sesión diaria completa
await page.click('#hoy-start'); await wait(300);
await page.click('#s-go'); await playPares(); await page.waitForSelector('#s-result:not([hidden])'); await page.click('#s-next');
await page.click('#s-go'); await installSeqRecorder(); await playSecuencia(2); await page.waitForSelector('#s-result:not([hidden])'); await page.click('#s-next');
await page.click('#s-go'); await page.waitForSelector('#n-start:has-text("Detener")'); await playNback(); await page.waitForSelector('#s-result:not([hidden])'); await page.click('#s-next');
await page.click('#s-go'); await playPalacio(); await page.waitForSelector('#s-result:not([hidden])'); await page.click('#s-next'); await wait(600);
await shot('17-sesion-completada');
await page.click('#s-next'); await wait(1800);
await shot('18-hoy-completado');
await page.click('.topnav nav [data-go="progreso"]'); await wait(700);
await shot('19-progreso', { fullPage: true });
await page.click('.topnav nav [data-go="juegos"]'); await wait(500);
await shot('20-juegos');
await page.click('#v-juegos [data-help="nback"]'); await wait(500);
await shot('21-ayuda-nback');
await page.keyboard.press('Escape'); await wait(300);
await page.click('#v-juegos [data-go="planes"]'); await wait(500);
await shot('22-planes');
await page.click('.topnav nav [data-go="ajustes"]'); await wait(400);
await shot('23-ajustes');
await page.click('#a-theme [data-theme="dark"]'); await page.click('.topnav nav [data-go="hoy"]'); await wait(1500);
await shot('24-hoy-oscuro');

// Móvil
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await m.goto(url); await m.waitForTimeout(400);
await m.screenshot({ path: `${out}/25-movil-bienvenida.png` });
await m.evaluate(() => localStorage.setItem('gimnasio-memoria.v2', JSON.stringify({ profile: { name: 'Adriel', onboarded: true, areas: ['pares', 'secuencia', 'nback', 'palacio'], calibration: { date: Date.now(), scores: { pares: 67, secuencia: 62, nback: 70, palacio: 56 }, global: 64 }, difficulty: 'estandar', goal: 'entrenar', ageRange: '25-34' }, settings: { sound: true, volume: 60, theme: 'system', nbackN: 2, paresLevel: 1, palacioLoci: 4, visual: 'auto' }, sessions: [{ game: 'pares', level: 1, moves: 8, secs: 30, eff: 75, stars: 3, t: Date.now() }, { game: 'secuencia', span: 5, mode: 'directo', failedAt: 6, t: Date.now() }, { game: 'nback', n: 2, acc: 85, hits: 5, miss: 1, fa: 1, t: Date.now() }], routines: [] })));
await m.reload(); await m.waitForTimeout(1500);
await m.screenshot({ path: `${out}/26-movil-hoy.png` });
await m.click('.topnav nav [data-go="juegos"]'); await m.click('#v-juegos [data-go="secuencia"]'); await m.click('#s-start'); await m.waitForTimeout(900);
await m.screenshot({ path: `${out}/27-movil-secuencia.png` });

await browser.close();
console.log('Capturas listas en', out);
