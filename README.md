# Gimnasio de Memoria · v3 Pixel-3D

Programa web de entrenamiento de la memoria con estética **Pixel-3D** (Three.js renderizado a baja resolución con contornos) y física decorativa (Matter.js).

**Flujo:** Bienvenida → Configuración (objetivo, áreas, edad, dificultad) → Prueba de nivel → Resultados e Índice de Memoria → Plan de 30 días → **Gimnasio 3D**. El gimnasio es un mundo navegable con cinco estaciones fijas, el camino del día y la Torre de constancia.

Hay cuatro ejercicios, cada uno apoyado en un modelo de la psicología cognitiva:

| Ejercicio | Qué ejercita | Base teórica |
|-----------|--------------|--------------|
| **Pares** | Memoria visual a corto plazo (codificación → recuperación) | Atkinson y Shiffrin (1968); codificación dual, Paivio (1971) |
| **Secuencia** (tablero de Corsi irregular, directo e inverso) | Amplitud visoespacial | Corsi (1972); Berch et al. (1998); Miller (1956); Baddeley y Hitch (1974) |
| **N-Back espacial** (N = 1 a 4) | Memoria de trabajo (mantener y actualizar) | Kirchner (1958); Jaeggi et al. (2008) |
| **Palacio de la memoria** (4 a 12 lugares) | Memoria asociativa objeto–lugar | Método de loci: Yates (1966), Bower (1970), Legge et al. (2012), Dresler et al. (2017) |

Además incluye:
- **lista de juegos** accesible ("Ver como lista");
- **progreso** con índice frente a la línea base, historial y gráficos;
- **logros**;
- ayuda por juego;
- **ajustes**: nombre, estilo visual Pixel-3D / Clásico, sonido, tema y repetir la prueba de nivel;
- **planes** (modelo freemium).

- **Juego en línea:** https://gimnasio-memoria.vercel.app
- **Código fuente (editable):** https://github.com/Adagu69/gimnasio-memoria
- **Capturas:** `docs/capturas/` · **Video demostrativo:** `docs/video/demo.mp4` · **Informe final:** `docs/informe/Informe-Gimnasio-de-Memoria.docx` (se genera con `npm run informe`)

## Diseño: "el DOM es la verdad, el 3D es la piel"

- **Lógica intacta:** la lógica de cada juego no cambió y sigue manipulando botones DOM. Las escenas 3D observan ese DOM (`MutationObserver`) y lo dibujan detrás; los botones quedan encima como zonas de toque transparentes. Así se conservan el teclado, el lector de pantalla, los tiempos y las métricas.
- **Piel clásica:** si WebGL no está disponible, si el rendimiento es bajo o si el usuario lo elige en Ajustes, se usa la piel clásica (solo DOM). También se puede forzar con `?visual=clasico`.
- **Física decorativa:** Matter.js se usa solo *después* de una tarea, nunca durante OBSERVA / TU TURNO:
  - Torre de constancia: un bloque por sesión diaria, con la meta de 30 días;
  - objetos que representan la métrica en la tarjeta de resultado;
  - columnas de la prueba de nivel;
  - trofeos de la vitrina.

### Justificación psicológica del rediseño

| Decisión | Fundamento |
|---|---|
| Banner de fase idéntico en los 4 juegos: **OBSERVA → TU TURNO → RESULTADO** | Separa codificación y recuperación (Atkinson y Shiffrin); reduce la carga extrínseca (Sweller, 1988) |
| Cámara **ortográfica fija** en los tableros y sin movimiento ambiental durante la codificación | Todos los estímulos con el mismo tamaño; principio de coherencia (Mayer, 2009) |
| Tiempos sin cambios (vista previa de Pares, encendidos de Corsi, ISI 2500 / ON 1500 ms en N-Back); el estímulo aparece en ≤ 1 frame | La exposición no cambia: la línea base y las normas siguen siendo comparables. Lo verifica la prueba E2E (±20 ms) |
| Corsi con bloques en **posiciones irregulares** (iguales en las dos pieles) | Fiel a Corsi (1972); menos recodificación verbal (Berch et al., 1998) |
| Palacio: ruta fija, con distractores tomados de otros lugares del mismo ensayo | Método de loci; mide la asociación objeto–lugar, no el simple reconocimiento |
| Estaciones fijas en el gimnasio y camino del día iluminado | Reconocer antes que recordar (Nielsen, 1994); hábito (Lally et al., 2010) |
| Torre de constancia física con la meta de 30 días | Gradiente de meta (Kivetz, Urminsky y Zheng, 2006) |
| Objetos de la métrica que caen en el resultado (amplitud = bloques) | Ley del efecto (Thorndike, 1911); solo después de la tarea |
| Aviso "la meta es un objetivo de práctica, no una predicción" | Transferencia limitada del entrenamiento (Melby-Lervåg y Hulme, 2013) |

Nota: la disposición de Corsi está inspirada en el tablero original. No reproduce las coordenadas exactas de Kessels et al. (2000), que quedan pendientes de verificar.

## Tecnologías

- **Interfaz:** HTML5, CSS (capas `base` → `pixel` → `juegos` → `mundo`) y JavaScript en módulos ES.
- **Dependencias en tiempo de ejecución:** **Three.js 0.187** (render 3D, `RenderPixelatedPass`) y **Matter.js 0.20** (física 2D). Las empaqueta esbuild en un solo HTML.
- **Fuente:** Pixelify Sans (OFL), solo en títulos, HUD y números.
- **Navegador:** audio con Web Audio API; progreso en `localStorage`.
- **Publicación:** sitio estático en Vercel; `vercel.json` publica `dist/`.

## Estructura

```
index.html                Página única con todas las vistas
css/styles.css            Índice: base.css → pixel.css → juegos.css → mundo.css
js/main.js                Punto de entrada: piel visual, módulos, vistas y escenas
js/router.js              Navegación entre vistas (hooks enter/leave)
js/store.js               Persistencia: perfil, ajustes, sesiones, rutinas, racha
js/indice.js              Índice de Memoria por área y global (4 áreas)
js/games/pares.js         Pares (8 niveles, memorización, estrellas)
js/games/secuencia.js     Secuencia (Corsi directo/inverso) + corsi-layout.js (tablero irregular)
js/games/nback.js         N-Back (20 turnos, regla 85 % / 60 %)
js/games/palacio.js       Palacio de la memoria + palacio-logic.js (lógica pura) + sprites.js (pixel art)
js/three/engine.js        WebGLRenderer compartido, post-proceso pixelado, render bajo demanda, alternativa clásica
js/three/skin.js          Decide la piel (Pixel-3D / clásica) y monta la escena de cada vista
js/three/anchor.js        Anclaje DOM↔3D (desproyección al plano, proyección a pantalla)
js/three/scenes/*.js      board, pares, corsi, nback, palacio, mundo (gimnasio), mini, stations
js/physics/*.js           world2d (Matter.js), presets, bridge3d, bridge-dom, stage, rng
js/views/mundo.js         Gimnasio: HUD, estaciones, panel, Diario y Torre de constancia
js/views/fase.js          Banner de fase OBSERVA / TU TURNO / RESULTADO
js/views/*.js             Configuración, sesión, juegos, progreso y logros, ajustes, ayuda
tools/dev.mjs             Servidor de desarrollo (esbuild, http://localhost:5173)
tools/build.mjs           Empaqueta todo en un solo HTML (dist/) y vigila el presupuesto de JS
tools/test.mjs            Prueba de punta a punta con Playwright (dos pieles)
tools/unit/*.test.mjs     Pruebas unitarias (node --test): física, anclaje, Corsi, Palacio
```

## Ejecutar en local

```bash
npm install          # Three.js, Matter.js y herramientas (esbuild, playwright)
npm start            # http://localhost:5173 (empaqueta al vuelo)
npm run build        # dist/index.html (un solo archivo)
npm run test:unit    # pruebas unitarias con cobertura
npm test             # E2E en las dos pieles (VISUAL=pixel3d|clasico|both)
```

Para las pruebas E2E con WebGL en modo headless se usa SwiftShader (las banderas ya van en `tools/test.mjs`). Instala Chromium una vez con `npx playwright install chromium`.

## Modelo de dificultad adaptativa (ciclo PDCA)

Cada sesión sigue el ciclo de Deming:
1. **Planificar:** nivel propuesto según el historial.
2. **Hacer:** jugar.
3. **Verificar:** métrica de eficiencia, amplitud o precisión.
4. **Actuar:** subir, mantener o bajar la dificultad para la próxima sesión.

## Autores

Adriel Gudiel Urquizo — Universidad Tecnológica del Perú (UTP).

## Licencia

MIT. Pixelify Sans: SIL Open Font License (`assets/fonts/OFL-PixelifySans.txt`).
