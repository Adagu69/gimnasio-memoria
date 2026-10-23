// capturas.mjs — genera las capturas de pantalla de cada funcionalidad en docs/capturas/.
// Juega automáticamente para que las pantallas muestren datos reales.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdirSync } from 'node:fs';

const url = pathToFileURL(resolve('dist/index.html')).href;
const out = 'docs/capturas';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 860 }, deviceScaleFactor: 1.5, locale: 'es-PE' });
const page = await ctx.newPage();
const shot = (name, opts = {}) => page.screenshot({ path: `${out}/${name}.png`, ...opts });

await page.goto(url);
await page.waitForTimeout(500);
await shot('01-bienvenida');
await page.fill('#w-name', 'Adriel');
await page.click('#modal-actions .primary');

// Ayuda
await page.click('#v-home [data-help="pares"]');
await page.waitForTimeout(200);
await shot('03-ayuda-pares');
await page.keyboard.press('Escape');

// Pares: fase de memorización y resolución
await page.click('nav [data-go="pares"]');
await page.click('#p-start');
await page.waitForTimeout(500);
await shot('04-pares-memorizar');
await page.waitForSelector('#p-board:not(.preview)');
let cards = await page.$$('#p-board .cardp');
let syms = await Promise.all(cards.map(c => c.getAttribute('data-s')));
let seen = {};
for (let i = 0; i < syms.length; i++) {
  if (seen[syms[i]] !== undefined) {
    await cards[seen[syms[i]]].click(); await cards[i].click(); await page.waitForTimeout(330);
    if (i === syms.length - 3) await shot('05-pares-jugando');
  } else seen[syms[i]] = i;
}
await page.waitForSelector('#p-msg.ok');
await page.waitForTimeout(500);
await shot('06-pares-completado');

// Secuencia — grabador persistente de la secuencia mostrada
await page.click('nav [data-go="secuencia"]');
await page.evaluate(() => {
  window.__seq = [];
  const blocks = Array.from(document.querySelectorAll('#s-grid .block'));
  new MutationObserver(() => { blocks.forEach((b, i) => { if (b.classList.contains('lit') && window.__seq[window.__seq.length - 1] !== i) window.__seq.push(i); }); })
    .observe(document.querySelector('#s-grid'), { attributes: true, subtree: true, attributeFilter: ['class'] });
  new MutationObserver(() => { if (document.querySelector('#s-state').textContent === 'Observa') window.__seq = []; })
    .observe(document.querySelector('#s-state'), { childList: true, characterData: true, subtree: true });
});
await page.click('#s-start');
await page.waitForTimeout(900);
await shot('07-secuencia-observa');
const waitTurn = () => page.waitForFunction(() => document.querySelector('#s-state').textContent === 'Tu turno', null, { timeout: 20000 });
for (let r = 0; r < 3; r++) {
  await waitTurn();
  const seq = await page.evaluate(() => window.__seq.slice());
  for (const i of seq) { await page.click(`#s-grid .block:nth-child(${i + 1})`); await page.waitForTimeout(120); }
  if (r === 2) { await page.waitForTimeout(150); await shot('08-secuencia-correcto'); }
  await page.waitForTimeout(1400);
}
// fallar dos veces
for (let k = 0; k < 2; k++) {
  await waitTurn();
  await page.click('#s-grid .block:nth-child(1)'); await page.waitForTimeout(80);
  if (await page.textContent('#s-state') === 'Tu turno') await page.click('#s-grid .block:nth-child(1)');
  await page.waitForTimeout(700);
}
await shot('09-secuencia-fin');

// N-Back
await page.click('nav [data-go="nback"]');
await page.click('#n-start');
const hist = []; let shotTaken = false;
while (await page.evaluate(() => document.querySelector('#n-start').textContent !== 'Empezar')) {
  const on = await page.$$eval('#n-grid .cell', cs => cs.findIndex(c => c.classList.contains('on')));
  if (on >= 0 && (hist.length === 0 || hist[hist.length - 1].idx !== on || Date.now() - hist[hist.length - 1].t > 2000)) {
    hist.push({ idx: on, t: Date.now() }); const k = hist.length - 1;
    if (k >= 2 && hist[k].idx === hist[k - 2].idx) { await page.keyboard.press('Space'); if (!shotTaken && k > 6) { await page.waitForTimeout(150); await shot('10-nback-jugando'); shotTaken = true; } }
  }
  await page.waitForTimeout(100);
}
await page.waitForTimeout(300);
await shot('11-nback-resultado');

// Rutina (vista inicial) y progreso
await page.click('nav [data-go="home"]');
await shot('02-inicio', { fullPage: true });
await page.click('#v-home [data-go="rutina"]');
await shot('12-rutina');
await page.click('nav [data-go="progreso"]');
await shot('13-progreso', { fullPage: true });
await page.click('#v-home [data-go="planes"]').catch(() => {});
await page.click('nav [data-go="home"]'); await page.click('#v-home [data-go="planes"]');
await shot('14-planes');
await page.click('nav [data-go="ajustes"]');
await shot('15-ajustes');

// Tema oscuro
await page.click('#a-theme [data-theme="dark"]');
await page.click('nav [data-go="home"]');
await shot('16-inicio-oscuro', { fullPage: true });

// Móvil
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await m.goto(url); await m.waitForTimeout(300);
await m.fill('#w-name', 'Adriel'); await m.click('#modal-actions .primary');
await m.screenshot({ path: `${out}/17-movil-inicio.png` });
await m.click('nav [data-go="secuencia"]'); await m.click('#s-start'); await m.waitForTimeout(900);
await m.screenshot({ path: `${out}/18-movil-secuencia.png` });

await browser.close();
console.log('Capturas listas en', out);
