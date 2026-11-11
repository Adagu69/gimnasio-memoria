// dev.mjs — servidor de desarrollo: empaqueta js/main.js en bundle/main.js al vuelo y sirve la carpeta.
//   npm start  →  http://localhost:5173
// El CSS se carga directamente (los @import los resuelve el navegador); el build lo empaqueta.
import * as esbuild from 'esbuild';
import { JS_OPTIONS } from './esbuild.shared.mjs';

const PORT = Number(process.env.PORT) || 5173;

const ctx = await esbuild.context({ ...JS_OPTIONS, outdir: 'bundle', sourcemap: true, logLevel: 'info' });
await ctx.watch();
// Solo en este equipo: no se expone la carpeta del proyecto a la red local.
const { port } = await ctx.serve({ servedir: '.', host: '127.0.0.1', port: PORT });
console.log(`Gimnasio de Memoria en http://localhost:${port}  (Ctrl+C para salir)`);
