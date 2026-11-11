// esbuild.shared.mjs — opciones de esbuild compartidas por el servidor de desarrollo y el build.
// Three.js (ESM) y Matter.js (UMD/CJS) se empaquetan igual en desarrollo y en producción.

export const JS_OPTIONS = {
  entryPoints: ['js/main.js'],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  legalComments: 'none',
  logLevel: 'warning'
};

export const CSS_OPTIONS = {
  entryPoints: ['css/styles.css'],
  bundle: true,
  loader: { '.woff2': 'dataurl' },
  logLevel: 'warning'
};

/** Etiqueta del script de entrada en index.html (la sustituye el build por el bundle en línea). */
export const ENTRY_SCRIPT = '<script defer src="bundle/main.js"></script>';

/** Presupuesto del JS empaquetado (gzip), en KB. */
export const JS_BUDGET_GZIP_KB = 225;
