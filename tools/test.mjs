// test.mjs — prueba de punta a punta con Playwright sobre dist/index.html (flujo v3 Pixel-3D).
// Recorre: bienvenida → configuración → prueba de nivel (4 juegos) → resultados → plan → gimnasio →
// sesión diaria → torre de constancia → progreso → juego libre → ajustes. Se ejecuta con las dos pieles:
//   VISUAL=pixel3d | clasico | both (por defecto both)
// Además comprueba: (1) ningún cuerpo de física se mueve durante OBSERVA / TU TURNO; (2) la duración de los
// estímulos (Corsi .lit, N-Back .on) no cambia con el 3D; (3) sin errores de consola.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const base = pathToFileURL(resolve('dist/index.html')).href;
const VISUALS = (process.env.VISUAL || 'both') === 'both' ? ['pixel3d', 'clasico'] : [process.env.VISUAL];
const TOL_MS = Number(process.env.TOL_MS) || 20;
let passed = 0;

const browser = await chromium.launch({
  ...(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {}),
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
});

for (const visual of VISUALS) await suite(visual);
console.log(`\n${passed} comprobaciones correctas (${VISUALS.join(' + ')})`);
await browser.close();

async function suite(visual) {
  console.log(`\n=== Piel: ${visual} ===`);
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  const page = await ctx.newPage();
  const ok = (cond, msg) => { if (!cond) throw new Error(`FALLÓ [${visual}]: ${msg}`); passed++; console.log('  ✓', msg); };
  const visible = async id => !(await page.$eval('#' + id, v => v.hidden));
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|ERR_NAME|fonts\.g/.test(m.text())) errors.push(m.text()); });

  await page.goto(`${base}?visual=${visual}&perf=off`);
  await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });

  // Vigilancia continua: física durante las fases de tarea y duración de los estímulos.
  await page.evaluate(() => {
    window.__physDuringTask = 0; window.__lit = []; window.__on = [];
    setInterval(() => {
      const task = [...document.querySelectorAll('.phase')].some(p => !p.closest('.view').hidden && ['observa', 'turno', 'atento'].includes(p.dataset.phase));
      const active = Number(document.documentElement.dataset.physicsActive || 0);
      if (task && active > window.__physDuringTask) window.__physDuringTask = active;
    }, 40);
    const track = (sel, cls, out) => {
      const since = new Map();
      new MutationObserver(recs => recs.forEach(r => {
        const el = r.target; const on = el.classList.contains(cls);
        if (on && !since.has(el)) since.set(el, performance.now());
        if (!on && since.has(el)) { out.push(performance.now() - since.get(el)); since.delete(el); }
      })).observe(document.querySelector(sel), { attributes: true, subtree: true, attributeFilter: ['class'] });
    };
    track('#s-grid', 'lit', window.__lit);
    track('#n-grid', 'on', window.__on);
  });

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
  /** Palacio: registra objeto por lugar durante OBSERVA y responde bien en TU TURNO. */
  async function playPalacio() {
    await page.evaluate(() => {
      window.__pal = {};
      const cap = document.querySelector('#mp-caption');
      const rec = () => { if (cap.dataset.obj && document.querySelector('#mp-stage').dataset.phase === 'observa') window.__pal[cap.dataset.locus] = cap.dataset.obj; };
      if (!window.__palObs) { window.__palObs = new MutationObserver(rec); window.__palObs.observe(cap, { attributes: true, attributeFilter: ['data-obj', 'data-locus'] }); }
    });
    await page.waitForFunction(() => document.querySelector('#mp-stage').dataset.phase === 'turno', null, { timeout: 60000 });
    const phase = () => page.$eval('#mp-stage', s => s.dataset.phase);
    while (await phase() === 'turno') {
      const btn = await page.$('#mp-options button:not([disabled])');
      if (!btn) { await page.waitForTimeout(80); continue; }
      const locus = await page.$eval('#mp-stage', s => s.dataset.locus);
      const want = await page.evaluate(l => window.__pal[l], locus);
      await page.click(`#mp-options button[data-obj="${want}"]`);
      await page.waitForFunction(l => document.querySelector('#mp-stage').dataset.locus !== l || document.querySelector('#mp-stage').dataset.phase !== 'turno', locus, { timeout: 5000 });
    }
  }
  const physCount = () => page.$eval('#s-art2', e => Number(e.dataset.physicsCount));

  /* ---------- Bienvenida y configuración ---------- */
  console.log('Bienvenida y configuración');
  ok(await visible('v-bienvenida'), 'arranca en la bienvenida');
  ok(await page.evaluate(v => document.body.classList.contains(v === 'pixel3d' ? 'skin-3d' : 'skin-clasico'), visual), `piel ${visual} activa`);
  await page.click('#b-start');
  await page.click('#w-next'); // sin nombre
  ok(await page.$eval('#w-name', i => i === document.activeElement), 'exige el nombre antes de continuar');
  await page.fill('#w-name', 'Adriel'); await page.click('#w-next');
  await page.click('#w-goal [data-value="entrenar"]'); await page.waitForTimeout(300);
  ok((await page.$$eval('#w-areas input:checked', i => i.length)) === 4, 'muestra las 4 áreas marcadas (incluye memoria asociativa)');
  await page.click('#w-next'); await page.click('#w-next');
  await page.click('#w-age [data-value="25-34"]'); await page.waitForTimeout(300);
  await page.click('#w-diff [data-value="estandar"]'); await page.waitForTimeout(400);
  ok(await visible('v-sesion'), 'al terminar la configuración abre la prueba de nivel');
  ok((await page.textContent('#s-title')) === 'Pares', 'la prueba empieza con Pares');
  ok((await page.$$eval('#s-stepper span', s => s.length)) === 5, 'stepper con 4 juegos + resultados');
  if (visual === 'pixel3d') ok(!!(await page.$('#s-art.ready canvas.gl')), 'la intro muestra la maqueta 3D de la estación');

  /* ---------- Prueba de nivel ---------- */
  console.log('Prueba de nivel');
  await page.click('#s-go');
  ok(await visible('v-pares') && !!(await page.$('#rutina-banner')), 'abre Pares con el banner de prueba de nivel');
  ok(['observa', 'idle', 'turno'].includes(await page.$eval('#fase-pares', e => e.dataset.phase)), 'Pares muestra el banner de fase');
  if (visual === 'pixel3d') ok(!!(await page.$('#p-stage.ready canvas.gl')), 'Pares se dibuja en 3D');
  await playPares();
  await page.waitForSelector('#s-result:not([hidden])');
  ok((await page.textContent('#s-rtitle')).includes('Pares ha puesto a prueba'), 'muestra la tarjeta de resultado de Pares');
  const stars = ((await page.textContent('#s-rdetail')).match(/★/g) || []).length;
  ok(await physCount() === stars, `caen ${stars} estrellas (física = métrica)`);
  await page.click('#s-next');
  ok((await page.textContent('#s-title')) === 'Secuencia', 'pasa a la intro de Secuencia');
  await page.click('#s-go'); await installSeqRecorder();
  if (visual === 'pixel3d') ok(!!(await page.$('#s-stage.ready canvas.gl')), 'Secuencia se dibuja en 3D');
  ok((await page.$eval('#s-grid .block:nth-child(1)', b => b.style.left)) !== '', 'los bloques de Corsi tienen posición irregular');
  await playSecuencia(3);
  await page.waitForSelector('#s-result:not([hidden])');
  ok((await page.textContent('#s-rdetail')).includes('Amplitud 5'), 'Secuencia registra amplitud 5');
  ok(await physCount() === 5, 'caen 5 bloques (amplitud 5)');
  await page.click('#s-next');
  await page.click('#s-go');
  await page.waitForSelector('#n-start:has-text("Detener")');
  if (visual === 'pixel3d') ok(!!(await page.$('#n-stage.ready canvas.gl')), 'N-Back se dibuja en 3D');
  await playNback();
  await page.waitForSelector('#s-result:not([hidden])');
  await page.click('#s-next');
  ok((await page.textContent('#s-title')) === 'Palacio', 'pasa a la intro del Palacio');
  await page.click('#s-go');
  ok(await visible('v-palacio'), 'abre el Palacio de la memoria');
  if (visual === 'pixel3d') ok(!!(await page.$('#mp-stage.ready canvas.gl')), 'el Palacio se dibuja en 3D');
  await playPalacio();
  await page.waitForSelector('#s-result:not([hidden])');
  ok((await page.textContent('#s-rdetail')).includes('4 de 4 recordados'), 'Palacio: 4 de 4 objetos recordados');
  ok(await physCount() === 4, 'caen 4 objetos al cofre');
  ok((await page.textContent('#s-next')) === 'Ver resultados', 'último paso ofrece ver resultados');
  await page.click('#s-next');
  ok(await visible('v-resultados'), 'muestra la pantalla de resultados');
  ok((await page.$$eval('#r-grid .rcard', r => r.length)) === 4, 'resultados con 4 áreas');
  ok(Number(await page.$eval('#r-stack', e => e.dataset.physicsCount)) > 0, 'columnas de bloques con física');
  const im0 = +(await page.textContent('#r-global'));
  ok(im0 > 0 && im0 <= 100, `índice global inicial ${im0}`);
  await page.click('#r-next');
  ok(await visible('v-plan'), 'muestra el plan de 30 días');
  ok((await page.$$eval('#p-rows tr', r => r.length)) === 5, 'plan con 4 áreas + global');
  await page.click('#p-next');
  ok(await visible('v-hoy'), 'llega al gimnasio');
  ok((await page.textContent('#hoy-greet')).includes('Adriel'), 'saluda por el nombre');
  ok((await page.textContent('#hoy-im')) !== '–', 'muestra el índice de memoria actual');
  ok((await page.$$eval('#stations [data-station]', s => s.length)) === 5, 'el gimnasio tiene 5 estaciones');
  if (visual === 'pixel3d') {
    await page.waitForSelector('#mundo-stage.ready canvas.gl');
    await page.waitForFunction(() => /translate/.test(document.querySelector('[data-station="palacio"]').style.transform));
    ok(true, 'las estaciones se proyectan sobre el mundo 3D');
  }
  await page.click('[data-station="palacio"]');
  ok(await visible('st-panel') && (await page.textContent('#st-title')) === 'Palacio', 'tocar una estación abre su panel');
  await page.click('#st-close');
  ok(!(await visible('st-panel')), 'el panel se cierra y vuelve la vista general');

  /* ---------- Sesión diaria ---------- */
  console.log('Sesión diaria');
  ok(await page.$eval('#hoy-done', e => e.hidden), 'aún no marca la sesión de hoy');
  await page.click('#hoy-start');
  ok((await page.textContent('#s-title')) === 'Pares', 'la sesión diaria empieza con Pares');
  await page.click('#s-go'); await playPares(); await page.waitForSelector('#s-result:not([hidden])'); await page.click('#s-next');
  await page.click('#s-go'); await installSeqRecorder(); await playSecuencia(2); await page.waitForSelector('#s-result:not([hidden])'); await page.click('#s-next');
  await page.click('#s-go'); await page.waitForSelector('#n-start:has-text("Detener")'); await playNback(); await page.waitForSelector('#s-result:not([hidden])'); await page.click('#s-next');
  await page.click('#s-go'); await playPalacio(); await page.waitForSelector('#s-result:not([hidden])');
  ok((await page.textContent('#s-next')) === 'Ver resumen', 'último paso de la sesión diaria ofrece el resumen');
  await page.click('#s-next');
  ok((await page.textContent('#s-rtitle')) === 'Sesión de hoy completada', 'cierra la sesión diaria con resumen');
  await page.click('#s-next');
  ok(await visible('v-hoy') && !(await page.$eval('#hoy-done', e => e.hidden)), 'el gimnasio marca la sesión completada');
  ok((await page.textContent('#hoy-streak')).includes('1'), 'racha de 1 día');
  ok((await page.$$eval('#hoy-cal .c.on', c => c.length)) === 1, 'calendario marca el día de hoy');
  ok((await page.$$eval('#hoy-games .done', c => c.length)) === 4, 'los 4 ejercicios de hoy aparecen hechos');
  ok((await page.$$eval('#torre [data-block]', b => b.length)) === 1, 'la Torre de constancia tiene 1 bloque');
  ok((await page.textContent('#torre-txt')).includes('1 de 30'), 'la torre indica 1 de 30 días');
  if (visual === 'clasico') {
    await page.click('#diario summary');
    await page.waitForFunction(() => Number(document.querySelector('#torre').dataset.physicsCount) === 1);
    ok(true, 'en la piel clásica la torre cae con física al abrir el Diario');
    await page.click('#diario summary');
  }

  /* ---------- Cancelar una sesión navegando ---------- */
  await page.click('#hoy-start'); await page.click('#s-go');
  await page.click('.topnav nav [data-go="juegos"]');
  ok(await visible('v-juegos') && !(await page.$('#rutina-banner')), 'salir de un juego cancela la sesión');

  /* ---------- Juego libre y progreso ---------- */
  console.log('Juego libre y progreso');
  await page.click('#v-juegos [data-go="nback"]');
  ok(await page.$eval('#n-seg [aria-pressed="true"]', b => b.dataset.n) === '4', 'N-Back arranca con el N recomendado (4) tras dos sesiones perfectas (2→3→4)');
  await page.click('.topnav nav [data-go="progreso"]');
  const rows = await page.$$eval('#pg-table tbody tr', r => r.length);
  ok(rows === 8, `historial con 8 sesiones (hay ${rows})`);
  ok((await page.$$eval('.badge.on', b => b.length)) >= 4, 'desbloquea logros (primera sesión, 3 estrellas, prueba de nivel, sesión completa)');
  ok((await page.$$eval('#pg-im .bar', b => b.length)) === 4, 'barras del índice por área (4)');

  /* ---------- Validez: física y tiempos ---------- */
  console.log('Validez de la medida');
  ok(await page.evaluate(() => window.__physDuringTask) === 0, 'ningún cuerpo de física se movió durante OBSERVA / TU TURNO');
  const lit = await page.evaluate(() => window.__lit);
  const litOk = lit.every(d => [595, 560, 525, 490, 455, 420, 385, 380].some(e => Math.abs(d - e) <= TOL_MS));
  ok(lit.length > 10 && litOk, `Corsi: ${lit.length} encendidos con la duración esperada (±${TOL_MS} ms; máx. desvío ${Math.max(...lit.map(d => Math.min(...[595, 560, 525, 490, 455, 420, 385, 380].map(e => Math.abs(d - e))))).toFixed(1)} ms)`);
  const on = await page.evaluate(() => window.__on);
  ok(on.length > 30 && on.every(d => Math.abs(d - 1500) <= TOL_MS), `N-Back: ${on.length} estímulos de 1500 ms (±${TOL_MS} ms; máx. desvío ${Math.max(...on.map(d => Math.abs(d - 1500))).toFixed(1)} ms)`);

  /* ---------- Persistencia y recarga ---------- */
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gimnasio-memoria.v2')));
  ok(saved.profile.onboarded && saved.profile.calibration && saved.profile.ageRange === '25-34', 'perfil y prueba de nivel guardados');
  ok(saved.sessions.length === 8 && saved.routines.length === 1, '8 sesiones y 1 sesión diaria guardadas');
  ok(saved.sessions.filter(s => s.game === 'palacio').every(s => s.loci && s.total && !('objs' in s)), 'las sesiones del Palacio guardan solo su esquema');
  await page.reload(); await page.waitForTimeout(300);
  ok(await visible('v-hoy'), 'al recargar con programa configurado abre el gimnasio directamente');

  /* ---------- Alternativa automática por rendimiento (solo 3D) ---------- */
  if (visual === 'pixel3d') {
    // Hace falta animación continua para medir: la maqueta giratoria de la intro de una sesión.
    const p2 = await ctx.newPage();
    await p2.goto(`${base}?visual=pixel3d&perfThreshold=0`);
    await p2.click('.topnav nav [data-go="ajustes"]');
    await p2.click('#a-recal');
    await p2.waitForFunction(() => document.body.classList.contains('skin-clasico'), null, { timeout: 15000 });
    ok(!(await p2.$('#s-art canvas.gl')), 'al volver a la piel clásica se retira el canvas');
    ok(true, 'con rendimiento bajo vuelve sola a la piel clásica');
    await p2.close();
  }

  /* ---------- Ajustes: estilo visual y borrar ---------- */
  await page.click('.topnav nav [data-go="ajustes"]');
  ok((await page.textContent('#a-profile')).includes('Objetivo'), 'ajustes resume el programa');
  ok((await page.$eval('#a-visual [aria-pressed="true"]', b => b.dataset.visual)) === visual, 'ajustes muestra el estilo visual actual');
  await page.click('#a-clear'); await page.click('#a-yes');
  ok(await visible('v-bienvenida'), 'borrar progreso vuelve a la bienvenida');
  ok(JSON.parse(await page.evaluate(() => localStorage.getItem('gimnasio-memoria.v2'))).sessions.length === 0, 'el almacén queda vacío');

  ok(errors.length === 0, 'sin errores de consola' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await ctx.close();
}
