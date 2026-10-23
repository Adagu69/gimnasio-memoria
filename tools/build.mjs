// build.mjs — empaqueta el juego en un solo archivo HTML.
//   node tools/build.mjs
// Genera:
//   dist/index.html     → página completa (sirve para cualquier hosting estático)
//   dist/artifact.html  → fragmento sin <html>/<head>/<body>, para publicar como artefacto
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { build } from 'esbuild';

mkdirSync('dist', { recursive: true });

const js = await build({
  entryPoints: ['js/main.js'],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  target: 'es2020'
});
const bundle = js.outputFiles[0].text;

const html = readFileSync('index.html', 'utf8');
const cssOut = await build({ entryPoints: ['css/styles.css'], minify: true, write: false, loader: { '.css': 'css' } });
const css = cssOut.outputFiles[0].text;
const favicon = readFileSync('assets/favicon.svg', 'utf8');

// Reemplazos con función para que "$$" del código no se interprete como patrón de String.replace
let single = html
  .replace('<link rel="stylesheet" href="css/styles.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="js/main.js"></script>', () => `<script>\n${bundle}\n</script>`)
  .replace('href="assets/favicon.svg"', () => `href="data:image/svg+xml,${encodeURIComponent(favicon.trim())}"`);
writeFileSync('dist/index.html', single);

// Fragmento para artefacto: título + meta de laterales + estilos + cuerpo + script
const body = single.slice(single.indexOf('<body>') + 6, single.lastIndexOf('</body>'));
const fonts = single.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/)[0];
const style = single.match(/<style>[\s\S]*?<\/style>/)[0];
const fragment = `<title>Gimnasio de Memoria</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${fonts}\n${style}\n${body}`;
writeFileSync('dist/artifact.html', fragment);

console.log('dist/index.html', (single.length / 1024).toFixed(1), 'KB ·', 'dist/artifact.html', (fragment.length / 1024).toFixed(1), 'KB');
