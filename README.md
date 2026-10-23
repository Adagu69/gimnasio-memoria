# Gimnasio de Memoria

Aplicación web para entrenar la memoria con tres ejercicios cortos, cada uno apoyado en un modelo de la psicología cognitiva:

| Ejercicio | Qué ejercita | Base teórica |
|-----------|--------------|--------------|
| **Pares** | Memoria visual a corto plazo (codificación → recuperación) | Atkinson y Shiffrin (1968) |
| **Secuencia** (bloques de Corsi, directo e inverso) | Amplitud visoespacial | Corsi (1972); Miller (1956); Baddeley y Hitch (1974) |
| **N-Back espacial** (N = 1 a 4) | Memoria de trabajo (mantener y actualizar) | Kirchner (1958); Jaeggi et al. (2008) |

Además: **rutina diaria** con puntaje y racha, **progreso** con historial y gráficos, **logros**, ayuda por juego, ajustes (nombre, sonido, tema) y vista de **planes** (modelo freemium).

- **Juego en línea:** https://gimnasio-memoria.vercel.app
- **Capturas:** `docs/capturas/` · **Video demostrativo:** `docs/video/demo.mp4`

## Tecnologías

HTML5, CSS y JavaScript (módulos ES) sin frameworks ni dependencias en tiempo de ejecución. Audio con Web Audio API. Progreso en `localStorage`. Publicado como sitio estático en Vercel.

## Estructura

```
index.html            Página única con todas las vistas
css/styles.css        Estilos (tokens de color, tema claro/oscuro)
js/main.js            Punto de entrada: inicializa módulos y vistas
js/router.js          Navegación entre vistas (hooks enter/leave)
js/store.js           Persistencia: perfil, ajustes, sesiones, rutinas, racha
js/audio.js           Tonos sintetizados (Web Audio)
js/ui.js              Utilidades: modal, toast, formato, gráfico de barras
js/games/pares.js     Minijuego Pares (8 niveles, fase de memorización, estrellas)
js/games/secuencia.js Minijuego Secuencia (Corsi directo/inverso, 2 intentos por longitud)
js/games/nback.js     Minijuego N-Back (20 turnos, regla adaptativa 85 % / 60 %)
js/views/*.js         Inicio, rutina, progreso y logros, ajustes, ayuda
tools/build.mjs       Empaqueta todo en un solo HTML (dist/)
tools/test.mjs        Prueba de punta a punta con Playwright (30 comprobaciones)
tools/capturas.mjs    Genera las capturas de pantalla
tools/video.mjs       Graba el video demostrativo
docs/                 Capturas, video, diseño (SVG) y prototipo del Avance 1
```

## Ejecutar en local

Basta con servir la carpeta como sitio estático (los módulos ES no cargan desde `file://`):

```bash
npm install          # solo para build/pruebas (esbuild, playwright)
npm start            # http://localhost:5173
npm run build        # dist/index.html (un solo archivo)
npm test             # prueba automatizada
```

## Modelo de dificultad adaptativa (ciclo PDCA)

Cada sesión sigue el ciclo de Deming: **Planificar** (nivel propuesto según el historial) → **Hacer** (jugar) → **Verificar** (métrica: eficiencia, amplitud, precisión) → **Actuar** (subir, mantener o bajar la dificultad para la próxima sesión).

## Autores

Adriel Gudiel Urquizo — Universidad Tecnológica del Perú (UTP).

## Licencia

MIT.
