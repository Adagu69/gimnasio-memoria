// video.mjs — graba un video demostrativo del flujo v3 (Pixel-3D): bienvenida → configuración → prueba de nivel
// (4 juegos) → resultados → plan → gimnasio → progreso. Captura fotogramas (8 por segundo) y los monta con ffmpeg en docs/video/demo.mp4.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdirSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';

const url = pathToFileURL(resolve('dist/index.html')).href + '?visual=pixel3d&perf=off';
const dir = 'docs/video';
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch({
  ...(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'es-PE' });
const page = await ctx.newPage();
const pause = ms => page.waitForTimeout(ms);
// Captura de fotogramas: un screenshot cada 125 ms mientras dure la demostración
const frames = dir + '/frames'; rmSync(frames, { recursive: true, force: true }); mkdirSync(frames, { recursive: true });
let n = 0, grabbing = true;
(async () => { while (grabbing) { const t = Date.now(); try { await page.screenshot({ path: `${frames}/f${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 80 }); } catch (e) {} const d = Date.now() - t; if (d < 125) await new Promise(r => setTimeout(r, 125 - d)); } })();
await page.addInitScript(() => {
  window.addEventListener('DOMContentLoaded', () => {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;width:18px;height:18px;border-radius:50%;background:rgba(42,86,232,.55);border:2px solid #fff;box-shadow:0 0 0 2px rgba(42,86,232,.6);pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:left .18s,top .18s;left:-50px;top:-50px';
    document.body.appendChild(c);
    document.addEventListener('mousemove', e => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
    document.addEventListener('mousedown', () => { c.style.transform = 'translate(-50%,-50%) scale(.7)'; });
    document.addEventListener('mouseup', () => { c.style.transform = 'translate(-50%,-50%) scale(1)'; });
  });
});
async function click(sel) {
  const el = await page.waitForSelector(sel);
  await el.scrollIntoViewIfNeeded(); // las opciones del Palacio quedan bajo el pliegue a 1280×800
  const box = await el.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
  await pause(250);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
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

await page.goto(url); await pause(1800);
await click('#b-start'); await pause(900);
await page.type('#w-name', 'Adriel', { delay: 120 }); await pause(500); await click('#w-next'); await pause(900);
await click('#w-goal [data-value="entrenar"]'); await pause(1200);
await click('#w-next'); await pause(1600);
await click('#w-next'); await pause(900);
await click('#w-age [data-value="25-34"]'); await pause(1000);
await click('#w-diff [data-value="estandar"]'); await pause(1800);

// Prueba de nivel: Pares
await click('#s-go'); await page.waitForSelector('#p-board:not(.preview)'); await pause(400);
{
  const cards = await page.$$('#p-board .cardp');
  const syms = await Promise.all(cards.map(c => c.getAttribute('data-s')));
  const seen = {};
  await click('#p-board .cardp:nth-child(1)'); await pause(350);
  const other = syms.findIndex((s, i) => i > 0 && s !== syms[0]);
  await click(`#p-board .cardp:nth-child(${other + 1})`); await pause(1100);
  for (let i = 0; i < syms.length; i++) {
    if (seen[syms[i]] !== undefined) { await click(`#p-board .cardp:nth-child(${seen[syms[i]] + 1})`); await pause(300); await click(`#p-board .cardp:nth-child(${i + 1})`); await pause(700); }
    else seen[syms[i]] = i;
  }
}
await page.waitForSelector('#s-result:not([hidden])'); await pause(2600);
await click('#s-next'); await pause(1500);

// Secuencia
await click('#s-go'); await installSeqRecorder();
for (let r = 0; r < 3; r++) {
  await waitTurn(); await pause(400);
  const seq = await page.evaluate(() => window.__seq.slice());
  for (const i of seq) { await click(`#s-grid .block:nth-child(${i + 1})`); await pause(380); }
  await pause(1400);
}
for (let k = 0; k < 2; k++) {
  await waitTurn(); await pause(500);
  const seq = await page.evaluate(() => window.__seq.slice());
  await click(`#s-grid .block:nth-child(${[0, 1, 2, 3, 4, 5, 6, 7, 8].find(i => i !== seq[0]) + 1})`); await pause(1600);
}
await page.waitForSelector('#s-result:not([hidden])'); await pause(2600);
await click('#s-next'); await pause(1500);

// N-Back
await click('#s-go'); await page.waitForSelector('#n-start:has-text("Detener")');
{
  const N = +(await page.$eval('#n-seg [aria-pressed="true"]', b => b.dataset.n)); const hist = [];
  while (await page.evaluate(() => document.querySelector('#n-start').textContent !== 'Empezar')) {
    const on = await page.$$eval('#n-grid .cell', cs => cs.findIndex(c => c.classList.contains('on')));
    if (on >= 0 && (hist.length === 0 || hist[hist.length - 1].idx !== on || Date.now() - hist[hist.length - 1].t > 2000)) {
      hist.push({ idx: on, t: Date.now() }); const k = hist.length - 1;
      if (k >= N && hist[k].idx === hist[k - N].idx) { await pause(500); await click('#n-match'); }
    }
    await pause(100);
  }
}
await page.waitForSelector('#s-result:not([hidden])'); await pause(2600);
await click('#s-next'); await pause(1500);

// Palacio de la memoria: se registra el objeto de cada lugar y se responde bien
await click('#s-go');
await page.evaluate(() => {
  window.__pal = {};
  const cap = document.querySelector('#mp-caption');
  new MutationObserver(() => { if (cap.dataset.obj && document.querySelector('#mp-stage').dataset.phase === 'observa') window.__pal[cap.dataset.locus] = cap.dataset.obj; })
    .observe(cap, { attributes: true, attributeFilter: ['data-obj', 'data-locus'] });
});
await page.waitForFunction(() => document.querySelector('#mp-stage').dataset.phase === 'turno', null, { timeout: 60000 });
while (await page.$eval('#mp-stage', s => s.dataset.phase) === 'turno') {
  const btn = await page.$('#mp-options button:not([disabled])');
  if (!btn) { await pause(80); continue; }
  await pause(500);
  const locus = await page.$eval('#mp-stage', s => s.dataset.locus);
  const want = await page.evaluate(l => window.__pal[l], locus);
  await click(want ? `#mp-options button[data-obj="${want}"]` : '#mp-options button:not([disabled])');
  // Con la captura de fotogramas el navegador va más lento: el recorrido de cámara al siguiente lugar puede tardar varios segundos.
  await page.waitForFunction(l => document.querySelector('#mp-stage').dataset.locus !== l || document.querySelector('#mp-stage').dataset.phase !== 'turno', locus, { timeout: 30000 });
}
await page.waitForSelector('#s-result:not([hidden])'); await pause(2800);
await click('#s-next'); await pause(3400);           // resultados (columnas de bloques con física)
await click('#r-next'); await pause(3200);           // plan
await click('#p-next'); await pause(3000);           // gimnasio
await click('[data-station="palacio"]'); await pause(2200);
await click('#st-close'); await pause(1200);
await click('.topnav nav [data-go="progreso"]'); await pause(2200);
await page.mouse.wheel(0, 500); await pause(1800);
await click('.topnav nav [data-go="juegos"]'); await pause(1800);
await click('#v-juegos [data-help="palacio"]'); await pause(2600);
await click('#modal-actions .primary'); await pause(600);
await click('.topnav nav [data-go="hoy"]'); await pause(2000);

grabbing = false; await pause(300);
await ctx.close();
await browser.close();
execSync(`ffmpeg -hide_banner -loglevel error -y -framerate 8 -i ${frames}/f%05d.jpg -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -r 25 -movflags +faststart ${dir}/demo.mp4`);
rmSync(frames, { recursive: true, force: true });
console.log('Video:', `${dir}/demo.mp4`, n, 'fotogramas');
