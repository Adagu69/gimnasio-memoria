// video.mjs — graba un video demostrativo (webm) de una partida completa con Playwright.
// Convertir a MP4:  ffmpeg -i docs/video/demo.webm -c:v libx264 -pix_fmt yuv420p -movflags +faststart docs/video/demo.mp4
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { mkdirSync, renameSync, readdirSync } from 'node:fs';

const url = pathToFileURL(resolve('dist/index.html')).href;
const dir = 'docs/video';
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir, size: { width: 1280, height: 800 } },
  locale: 'es-PE'
});
const page = await ctx.newPage();
const pause = ms => page.waitForTimeout(ms);
// Cursor visible para que se entienda dónde se hace clic
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
  const box = await el.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
  await pause(250);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

await page.goto(url);
await pause(1500);
await page.type('#w-name', 'Adriel', { delay: 120 });
await pause(600);
await click('#modal-actions .primary');
await pause(1800);

// Ayuda
await click('#v-home [data-help="pares"]');
await pause(2600);
await click('#modal-actions .primary');
await pause(600);

// Pares
await click('nav [data-go="pares"]');
await pause(900);
await click('#p-start');
await page.waitForSelector('#p-board:not(.preview)');
await pause(500);
{
  const cards = await page.$$('#p-board .cardp');
  const syms = await Promise.all(cards.map(c => c.getAttribute('data-s')));
  const seen = {};
  // dos fallos "humanos" al inicio para que se vea el volteo
  await click(`#p-board .cardp:nth-child(1)`); await pause(350);
  const other = syms.findIndex((s, i) => i > 0 && s !== syms[0]);
  await click(`#p-board .cardp:nth-child(${other + 1})`); await pause(1100);
  for (let i = 0; i < syms.length; i++) {
    if (seen[syms[i]] !== undefined) {
      await click(`#p-board .cardp:nth-child(${seen[syms[i]] + 1})`); await pause(300);
      await click(`#p-board .cardp:nth-child(${i + 1})`); await pause(700);
    } else seen[syms[i]] = i;
  }
}
await page.waitForSelector('#p-msg.ok');
await pause(2500);

// Secuencia
await click('nav [data-go="secuencia"]');
await pause(800);
await page.evaluate(() => {
  window.__seq = [];
  const blocks = Array.from(document.querySelectorAll('#s-grid .block'));
  new MutationObserver(() => { blocks.forEach((b, i) => { if (b.classList.contains('lit') && window.__seq[window.__seq.length - 1] !== i) window.__seq.push(i); }); })
    .observe(document.querySelector('#s-grid'), { attributes: true, subtree: true, attributeFilter: ['class'] });
  new MutationObserver(() => { if (document.querySelector('#s-state').textContent === 'Observa') window.__seq = []; })
    .observe(document.querySelector('#s-state'), { childList: true, characterData: true, subtree: true });
});
await click('#s-start');
const waitTurn = () => page.waitForFunction(() => document.querySelector('#s-state').textContent === 'Tu turno', null, { timeout: 30000 });
for (let r = 0; r < 3; r++) {
  await waitTurn(); await pause(400);
  const seq = await page.evaluate(() => window.__seq.slice());
  for (const i of seq) { await click(`#s-grid .block:nth-child(${i + 1})`); await pause(380); }
  await pause(1400);
}
// error intencional ×2 para mostrar el reintento y el fin
for (let k = 0; k < 2; k++) {
  await waitTurn(); await pause(500);
  const seq = await page.evaluate(() => window.__seq.slice());
  const wrong = [0, 1, 2, 3, 4, 5, 6, 7, 8].find(i => i !== seq[0]);
  await click(`#s-grid .block:nth-child(${wrong + 1})`);
  await pause(1600);
}
await pause(1500);

// N-Back
await click('nav [data-go="nback"]');
await pause(900);
await click('#n-start');
{
  const hist = [];
  while (await page.evaluate(() => document.querySelector('#n-start').textContent !== 'Empezar')) {
    const on = await page.$$eval('#n-grid .cell', cs => cs.findIndex(c => c.classList.contains('on')));
    if (on >= 0 && (hist.length === 0 || hist[hist.length - 1].idx !== on || Date.now() - hist[hist.length - 1].t > 2000)) {
      hist.push({ idx: on, t: Date.now() }); const k = hist.length - 1;
      if (k >= 2 && hist[k].idx === hist[k - 2].idx) { await pause(500); await click('#n-match'); }
    }
    await pause(100);
  }
}
await pause(2500);

// Progreso y cierre
await click('nav [data-go="progreso"]');
await pause(2200);
await page.mouse.wheel(0, 500); await pause(1800);
await page.mouse.wheel(0, 600); await pause(1800);
await click('nav [data-go="home"]');
await pause(1500);
await click('#v-home [data-go="planes"]');
await pause(2200);
await click('nav [data-go="home"]');
await pause(1500);

await ctx.close();
await browser.close();
const f = readdirSync(dir).find(n => n.endsWith('.webm') && n !== 'demo.webm');
renameSync(`${dir}/${f}`, `${dir}/demo.webm`);
console.log('Video:', `${dir}/demo.webm`);
