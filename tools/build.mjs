// build.mjs — empaqueta el juego en un solo archivo HTML.
//   node tools/build.mjs
// Genera:
//   dist/index.html     → página completa (sirve para cualquier hosting estático)
//   dist/artifact.html  → fragmento sin <html>/<head>/<body>, para publicar como artefacto
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';
import { JS_OPTIONS, CSS_OPTIONS, ENTRY_SCRIPT, JS_BUDGET_GZIP_KB } from './esbuild.shared.mjs';

mkdirSync('dist', { recursive: true });

const js = await build({ ...JS_OPTIONS, minify: true, write: false });
const bundle = js.outputFiles[0].text;

const cssOut = await build({ ...CSS_OPTIONS, minify: true, write: false, outdir: 'dist' });
const css = cssOut.outputFiles.find(f => f.path.endsWith('.css')).text;

const html = readFileSync('index.html', 'utf8');
const favicon = readFileSync('assets/favicon.svg', 'utf8');

for (const needle of ['<link rel="stylesheet" href="css/styles.css">', ENTRY_SCRIPT, 'href="assets/favicon.svg"']) {
  if (!html.includes(needle)) throw new Error(`build: no se encontró ${needle} en index.html`);
}

// Reemplazos con función para que "$$" del código no se interprete como patrón de String.replace
const single = html
  .replace('<link rel="stylesheet" href="css/styles.css">', () => `<style>\n${css}\n</style>`)
  .replace(ENTRY_SCRIPT, () => `<script>\n${bundle}\n</script>`)
  .replace('href="assets/favicon.svg"', () => `href="data:image/svg+xml,${encodeURIComponent(favicon.trim())}"`);
writeFileSync('dist/index.html', single);

// Fragmento para artefacto: título + meta de laterales + estilos + cuerpo + script
const body = single.slice(single.indexOf('<body>') + 6, single.lastIndexOf('</body>'));
const style = single.match(/<style>[\s\S]*?<\/style>/)[0];
const fragment = `<title>Gimnasio de Memoria</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${style}\n${body}`;
writeFileSync('dist/artifact.html', fragment);

const kb = n => (n / 1024).toFixed(1);
const jsGzip = gzipSync(bundle).length / 1024;
console.log(`dist/index.html ${kb(single.length)} KB · dist/artifact.html ${kb(fragment.length)} KB`);
console.log(`JS ${kb(bundle.length)} KB (gzip ${jsGzip.toFixed(1)} KB / presupuesto ${JS_BUDGET_GZIP_KB} KB) · CSS ${kb(css.length)} KB`);
if (jsGzip > JS_BUDGET_GZIP_KB) {
  console.error(`AVISO: el JS supera el presupuesto de ${JS_BUDGET_GZIP_KB} KB gzip.`);
  process.exitCode = 1;
}
