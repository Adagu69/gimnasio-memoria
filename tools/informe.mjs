// informe.mjs — genera el informe final en Word (docs/informe/Informe-Gimnasio-de-Memoria.docx)
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, ImageRun, PageBreak, LevelFormat, TableOfContents, Footer, Header, PageNumber,
  ExternalHyperlink
} from 'docx';

const OUT = 'docs/informe'; mkdirSync(OUT, { recursive: true });
const URL_JUEGO = 'https://gimnasio-memoria.vercel.app';
const FONT = 'Calibri';
const ACCENT = '2A56E8';

/* ---------- helpers ---------- */
const P = (text, opts = {}) => new Paragraph({ spacing: { after: 140, line: 300 }, alignment: opts.align || AlignmentType.JUSTIFIED, ...opts.p, children: Array.isArray(text) ? text : [new TextRun({ text, font: FONT, size: 22, ...opts.r })] });
const R = (text, r = {}) => new TextRun({ text, font: FONT, size: 22, ...r });
const B = (text) => R(text, { bold: true });
const I = (text) => R(text, { italics: true });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 }, children: [new TextRun({ text: t, font: FONT })] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 260, after: 120 }, children: [new TextRun({ text: t, font: FONT })] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: t, font: FONT })] });
const bullet = (text, level = 0) => new Paragraph({ numbering: { reference: 'bullets', level }, spacing: { after: 80, line: 290 }, children: Array.isArray(text) ? text : [R(text)] });
const num2 = (t) => num(t, 'nums2');
const num = (text, ref = 'nums') => new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80, line: 290 }, children: Array.isArray(text) ? text : [R(text)] });
const code = (lines) => lines.map(l => new Paragraph({ spacing: { after: 0, line: 240 }, shading: { type: ShadingType.CLEAR, fill: 'F3F5FA', color: 'auto' }, indent: { left: 200 }, children: [new TextRun({ text: l || ' ', font: 'Consolas', size: 17 })] }));
const caption = (t) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 220 }, children: [new TextRun({ text: t, font: FONT, size: 18, italics: true, color: '5D6782' })] });
const pb = () => new Paragraph({ children: [new PageBreak()] });
const link = (text, url) => new ExternalHyperlink({ link: url, children: [new TextRun({ text, font: FONT, size: 22, style: 'Hyperlink' })] });

function img(path, widthCm, cap) {
  if (!existsSync(path)) return [caption(`[imagen no disponible: ${path}]`)];
  const data = readFileSync(path);
  // dimensiones reales del PNG
  const w = data.readUInt32BE(16), h = data.readUInt32BE(20);
  const wpx = Math.round(widthCm * 37.8), hpx = Math.round(wpx * h / w);
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: [new ImageRun({ type: 'png', data, transformation: { width: wpx, height: hpx } })] }),
    caption(cap)
  ];
}

function table(headers, rows, widths) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (t, head, w) => new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: head ? { type: ShadingType.CLEAR, fill: 'E2E9FF', color: 'auto' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ spacing: { after: 0, line: 260 }, children: [new TextRun({ text: String(t), font: FONT, size: 19, bold: head })] })]
  });
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    borders: { top: { style: BorderStyle.SINGLE, size: 4, color: 'C9D0E0' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C9D0E0' }, left: { style: BorderStyle.SINGLE, size: 4, color: 'C9D0E0' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'C9D0E0' }, insideH: { style: BorderStyle.SINGLE, size: 4, color: 'C9D0E0' }, insideV: { style: BorderStyle.SINGLE, size: 4, color: 'C9D0E0' } },
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, true, widths[i])) }), ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, false, widths[i])) }))]
  });
}
const spacer = () => new Paragraph({ spacing: { after: 160 }, children: [] });

/* ---------- contenido ---------- */
const children = [];

// Portada
children.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1800, after: 200 }, children: [new TextRun({ text: 'UNIVERSIDAD TECNOLÓGICA DEL PERÚ', font: FONT, size: 26, bold: true, color: '5D6782' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1200 }, children: [new TextRun({ text: 'Curso: Desarrollo de Videojuegos', font: FONT, size: 22, color: '5D6782' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'GIMNASIO DE MEMORIA', font: FONT, size: 56, bold: true, color: ACCENT })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1400 }, children: [new TextRun({ text: 'Aplicación web para reforzar la memoria con tres ejercicios adaptativos, fundamentada en la psicología cognitiva y desarrollada bajo los principios de calidad total de W. Edwards Deming', font: FONT, size: 24, italics: true, color: '17203A' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'Informe final del trabajo', font: FONT, size: 22, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Integrantes:', font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Adriel Gudiel Urquizo', font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: '[Integrante 2]', font: FONT, size: 22, color: 'C97D12' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: '[Integrante 3]', font: FONT, size: 22, color: 'C97D12' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Juego en línea: ', font: FONT, size: 22 }), link(URL_JUEGO, URL_JUEGO)] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Lima, octubre de 2026', font: FONT, size: 22 })] }),
  pb()
);

// Índice
children.push(
  new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 200 }, children: [new TextRun({ text: 'Índice', font: FONT })] }),
  new TableOfContents('Índice', { hyperlink: true, headingStyleRange: '1-2' }),
  P([I('Para actualizar el índice en Word: clic derecho sobre el índice → Actualizar campos → Actualizar toda la tabla.')], { align: AlignmentType.LEFT }),
  pb()
);

// 1 Título
children.push(H1('1. Título'),
  P([B('Gimnasio de Memoria: '), R('aplicación web para reforzar la memoria mediante tres ejercicios adaptativos (Pares, Secuencia y N-Back), fundamentada en la psicología cognitiva y desarrollada bajo los principios de calidad total de W. Edwards Deming.')]));

// 2 Descripción
children.push(H1('2. Descripción'),
  P('Gimnasio de Memoria es una aplicación web gratuita, sin instalación, que entrena tres componentes de la memoria descritos por la psicología cognitiva. Cada componente tiene su propio minijuego, y los tres comparten una misma interfaz, un sistema de progreso y una regla de dificultad adaptativa que mantiene al jugador cerca del límite de su capacidad:'),
  bullet([B('Pares '), R('(memoria visual a corto plazo). El tablero se muestra destapado unos segundos para que el jugador codifique la posición de cada símbolo; luego se tapa y hay que encontrar las parejas en el menor número de intentos. Ocho niveles, de 4×3 a 8×6 cartas; se otorgan estrellas según la eficiencia.')]),
  bullet([B('Secuencia '), R('(amplitud visoespacial, adaptación de la tarea de bloques de Corsi). Nueve bloques se encienden en un orden que el jugador debe repetir, en modo directo o inverso. Comienza con tres bloques; cada acierto añade uno y se permiten dos intentos por longitud. La amplitud (span) es la longitud más larga superada.')]),
  bullet([B('N-Back espacial '), R('(memoria de trabajo). Un estímulo aparece cada 2,5 s en una de nueve celdas; el jugador avisa cuando la posición coincide con la de N turnos atrás (N de 1 a 4). Se registran aciertos, omisiones y falsas alarmas; con precisión ≥ 85 % el juego sube N y con menos de 60 % lo baja.')]),
  P('Complementan el entrenamiento una Rutina de hoy (los tres ejercicios encadenados, con un puntaje diario de 0 a 100 y una racha de días), un panel de Progreso con historial, gráficos y nueve logros, ayuda contextual que explica la base teórica de cada ejercicio, ajustes de nombre, sonido y tema (claro/oscuro) y una vista de Planes que materializa el modelo de negocio freemium. El progreso se guarda en el navegador (localStorage), sin enviar datos a ningún servidor.'),
  P([R('La aplicación está publicada en '), link(URL_JUEGO, URL_JUEGO), R(' y su código fuente editable (HTML, CSS y JavaScript en módulos, sin dependencias) acompaña a este informe.')]));

// 3 Objetivos
children.push(H1('3. Objetivo general y objetivos específicos'),
  H2('3.1 Objetivo general'),
  P('Diseñar y desarrollar una aplicación web en JavaScript que permita ejercitar y reforzar la memoria a corto plazo, la amplitud visoespacial y la memoria de trabajo mediante ejercicios adaptativos fundamentados en la psicología cognitiva, aplicando los principios de calidad total de W. Edwards Deming en el proceso de desarrollo.'),
  H2('3.2 Objetivos específicos'),
  num('Fundamentar cada ejercicio en un modelo o tarea reconocida de la psicología de la memoria (Atkinson y Shiffrin, Miller, Baddeley y Hitch; tareas de Corsi y N-Back).'),
  num('Implementar tres minijuegos con dificultad adaptativa y métricas de desempeño medibles (eficiencia, amplitud, precisión).'),
  num('Registrar el progreso del usuario en el dispositivo y presentarlo en un panel con historial, gráficos y logros que fomenten la constancia (rutina diaria y racha).'),
  num('Aplicar el ciclo PDCA y los 14 puntos de Deming al proceso de desarrollo, con pruebas automatizadas y verificación de cada entrega.'),
  num('Publicar el juego en un servidor remoto, con sus archivos editables, capturas y video demostrativo, y formular un modelo de negocio sostenible para su distribución.'));

// 4 Marco teórico
children.push(H1('4. Marco teórico'),
  P('Se seleccionaron tres autores (o parejas de autores) cuyos modelos describen los componentes de la memoria que cada minijuego ejercita. Las tareas experimentales de Corsi y Kirchner se usan como instrumento de implementación.'),
  H2('4.1 Atkinson y Shiffrin (1968): el modelo multialmacén'),
  P('Atkinson y Shiffrin propusieron que la información fluye por tres almacenes: el registro sensorial, el almacén a corto plazo (de capacidad y duración limitadas) y el almacén a largo plazo. El paso del corto al largo plazo depende de procesos de control, en particular el repaso. El minijuego Pares reproduce esta secuencia: la fase de memorización (tablero destapado) corresponde a la codificación en el almacén a corto plazo; la fase de búsqueda exige recuperar esa información y actualizarla con cada carta que se descubre; y el aumento progresivo del tablero (6 a 24 parejas) obliga a repasar y agrupar para no exceder la capacidad del almacén.'),
  H2('4.2 Miller (1956): el número mágico siete, más o menos dos'),
  P('Miller mostró que la amplitud de memoria inmediata se sitúa alrededor de 7 ± 2 unidades y que la capacidad efectiva aumenta cuando los elementos se agrupan en "chunks". El minijuego Secuencia mide y entrena directamente esta amplitud: la longitud de la secuencia crece de uno en uno desde 3 bloques, y la mayoría de jugadores alcanza su límite entre 5 y 7, coherente con el rango descrito. Los tonos asociados a cada bloque añaden un canal auditivo que facilita la agrupación.'),
  H2('4.3 Baddeley y Hitch (1974): la memoria de trabajo'),
  P('Baddeley y Hitch sustituyeron la idea de un almacén a corto plazo pasivo por un sistema de memoria de trabajo con un ejecutivo central y dos subsistemas: el bucle fonológico y la agenda visoespacial. El N-Back espacial exige a la vez mantener las últimas N posiciones y actualizarlas con cada estímulo, inhibiendo las respuestas a posiciones que ya no corresponden: una carga típica del ejecutivo central y de la agenda visoespacial. El modo inverso de Secuencia también recae en el ejecutivo central, porque requiere manipular el orden además de retenerlo.'),
  H2('4.4 Tareas de referencia: Corsi (1972) y Kirchner (1958)'),
  P('La tarea de bloques de Corsi es la prueba clásica de amplitud visoespacial y se aplica con dos ensayos por longitud, criterio que el juego conserva. La tarea N-Back fue introducida por Kirchner para estudiar la retención a corto plazo de información que cambia con rapidez, y Jaeggi et al. (2008) la popularizaron como programa de entrenamiento de memoria de trabajo. El juego adopta sus parámetros habituales: 2,5 s entre estímulos, alrededor de un tercio de objetivos y adaptación de N según la precisión.'),
  table(['Minijuego', 'Componente de la memoria', 'Autor / modelo', 'Tarea de referencia', 'Métrica'], [
    ['Pares', 'Almacén visual a corto plazo', 'Atkinson y Shiffrin (1968)', 'Juego de parejas con fase de codificación', 'Intentos, tiempo, eficiencia (%), estrellas'],
    ['Secuencia', 'Amplitud de memoria inmediata / visoespacial', 'Miller (1956); Baddeley y Hitch (1974)', 'Bloques de Corsi (1972), directo e inverso', 'Amplitud (span) 3–9'],
    ['N-Back', 'Memoria de trabajo (mantener y actualizar)', 'Baddeley y Hitch (1974)', 'N-Back (Kirchner, 1958; Jaeggi et al., 2008)', 'Precisión (%), aciertos, omisiones, falsas alarmas, N']
  ], [1400, 2000, 2000, 2200, 1760]),
  spacer());

// 5 Estado del arte
children.push(H1('5. Estado del arte'),
  P('Se revisaron tres plataformas comerciales de entrenamiento cognitivo y la evidencia académica asociada a cada una.'),
  H2('5.1 Lumosity (Lumos Labs)'),
  P('Lumosity es la plataforma más difundida, con más de 50 juegos organizados por capacidad cognitiva y un programa diario personalizado. Hardy et al. (2015) publicaron un ensayo aleatorizado con más de 4 700 participantes en el que el grupo que entrenó con Lumosity mejoró más que el grupo control (crucigramas) en una batería de pruebas cognitivas, aunque los autores reconocen que la transferencia a la vida diaria sigue siendo un asunto abierto. El modelo de negocio es de suscripción, con una versión gratuita limitada a tres juegos por día.'),
  H2('5.2 CogniFit'),
  P('CogniFit combina evaluación neuropsicológica en línea con entrenamiento personalizado, y se usa tanto en el ámbito del consumidor como en el clínico y escolar. Shatil (2013) encontró que el entrenamiento cognitivo con CogniFit en adultos mayores mejoró medidas de memoria de trabajo y velocidad de procesamiento, con efectos mayores cuando se combinó con actividad física. Su propuesta de valor se apoya en informes comparativos por edad y en licencias para profesionales e instituciones.'),
  H2('5.3 NeuroNation'),
  P('NeuroNation, de origen alemán, ofrece más de 30 ejercicios con énfasis en memoria de trabajo y está reconocida por algunas aseguradoras de salud de ese país. Strobach y Huestegge (2017) evaluaron sus tareas de memoria de trabajo y hallaron mejoras en las tareas entrenadas y en tareas estructuralmente similares, pero no transferencia amplia a otras capacidades, lo que coincide con la revisión de Simons et al. (2016).'),
  H2('5.4 Comparación y posición del proyecto'),
  table(['Criterio', 'Lumosity', 'CogniFit', 'NeuroNation', 'Gimnasio de Memoria'], [
    ['Plataforma', 'Web y móvil', 'Web y móvil', 'Web y móvil', 'Web (cualquier navegador), sin instalación'],
    ['Número de ejercicios', '> 50', '> 30', '> 30', '3 (enfocados en memoria) + rutina diaria'],
    ['Base teórica explícita al usuario', 'Parcial', 'Parcial', 'Parcial', 'Sí: ayuda de cada juego cita el modelo que ejercita'],
    ['Adaptación de dificultad', 'Sí', 'Sí', 'Sí', 'Sí: por nivel, por longitud y por N (regla 85 %/60 %)'],
    ['Precio', 'Suscripción (≈ US$ 12/mes)', 'Suscripción (≈ US$ 20/mes)', 'Suscripción (≈ € 10/mes)', 'Gratis; plan Pro S/ 9.90/mes'],
    ['Datos del usuario', 'Servidor del proveedor', 'Servidor del proveedor', 'Servidor del proveedor', 'Solo en el dispositivo (sin registro)'],
    ['Idioma y contexto', 'Español disponible', 'Español disponible', 'Alemán/Inglés principalmente', 'Español nativo, precios en soles']
  ], [1900, 1800, 1800, 1800, 2060]),
  spacer(),
  P('El proyecto no pretende competir en catálogo con estas plataformas, sino ocupar un nicho: una herramienta ligera, gratuita, en español, transparente en su fundamento teórico y respetuosa de la privacidad, con un camino de monetización coherente con el mercado latinoamericano.'));

// 6 Justificación
children.push(H1('6. Justificación'),
  P('La memoria de trabajo y la memoria a corto plazo intervienen en el aprendizaje escolar, el rendimiento laboral y la autonomía de las personas mayores. Las plataformas comerciales de entrenamiento cognitivo son de pago, están en inglés en su mayor parte y almacenan datos personales en servidores externos, lo que limita su adopción en el Perú y en América Latina. Una aplicación web gratuita, en español y sin registro reduce esas barreras.'),
  P('Desde el punto de vista académico, el proyecto integra tres áreas del curso: el diseño de mecánicas de juego con propósito (juego serio), la fundamentación en teorías de la psicología cognitiva y la aplicación de un sistema de calidad al proceso de desarrollo. La elección de JavaScript sobre Unity se justifica por el tipo de juego (interfaz 2D de cartas y cuadrículas), por el tiempo de desarrollo (horas frente a días para un primer prototipo funcional), por el peso de la publicación (60 KB frente a decenas de megabytes de un build WebGL) y porque los archivos editables quedan en texto plano, fáciles de revisar y versionar.'),
  P([R('Conviene precisar el alcance de las afirmaciones: la evidencia disponible respalda que el entrenamiento mejora el desempeño en las tareas practicadas y en tareas similares, pero la transferencia a la inteligencia general está cuestionada (Simons et al., 2016). Por ello los objetivos del proyecto hablan de '), I('ejercitar y reforzar la memoria'), R(', y la aplicación mide el progreso en las propias tareas en lugar de prometer beneficios generales.')]));

// 7 Modelo de negocio
children.push(H1('7. Modelo de negocio'),
  P('El modelo se formuló con el lienzo de Osterwalder y Pigneur (2010), bajo un esquema freemium: el entrenamiento básico es gratuito y financia su crecimiento con un plan Pro individual y licencias institucionales.'),
  table(['Bloque', 'Contenido'], [
    ['Segmentos de clientes', 'Estudiantes de secundaria y universidad; adultos que desean mantener su agilidad mental; adultos mayores y sus familias; instituciones educativas y centros de adulto mayor (B2B).'],
    ['Propuesta de valor', 'Entrenar la memoria en cinco minutos al día con ejercicios fundamentados científicamente, en español, gratis, sin instalación ni registro, con progreso visible y racha que motiva la constancia.'],
    ['Canales', 'Web (enlace directo), redes sociales con retos semanales, convenios con colegios y centros de adulto mayor, tiendas de aplicaciones (versión PWA) en una fase posterior.'],
    ['Relación con clientes', 'Autoservicio; recordatorios de rutina diaria; informe semanal por correo en el plan Pro; soporte a instituciones con panel de seguimiento.'],
    ['Fuentes de ingresos', 'Plan Pro: S/ 9.90 al mes o S/ 79 al año (sincronización en la nube, informe semanal, comparación por edad, ejercicios adicionales, modo familia de 4 perfiles). Licencia institucional: S/ 4 por asiento al mes con mínimo de 30 asientos.'],
    ['Recursos clave', 'Código de la aplicación, base de ejercicios y su fundamento teórico, infraestructura de hosting (Vercel), marca.'],
    ['Actividades clave', 'Desarrollo e iteración de ejercicios bajo PDCA, pruebas automatizadas, análisis de métricas de uso, contenido educativo para redes.'],
    ['Socios clave', 'Universidades y facultades de psicología (validación), colegios y centros de adulto mayor (distribución), proveedor de hosting y pagos (Vercel, Culqi o Niubiz).'],
    ['Estructura de costos', 'Hosting (gratuito en el nivel actual, ≈ US$ 20/mes al crecer), dominio, comisiones de pasarela de pago (≈ 4 %), horas de desarrollo y diseño, marketing de contenidos.']
  ], [2400, 6960]),
  spacer(),
  P('Supuestos iniciales: 10 000 usuarios activos mensuales al final del primer año, 3 % de conversión al plan Pro (300 suscriptores × S/ 9.90 ≈ S/ 2 970 mensuales) y dos instituciones con 50 asientos (S/ 400 mensuales), lo que cubriría los costos operativos y permitiría financiar nuevos ejercicios. La vista Planes de la aplicación ya presenta esta oferta para medir el interés con el botón "Me interesa".'));

// 8 Desarrollo
children.push(pb(), H1('8. Desarrollo'),
  H2('8.1 Plataforma y tecnologías'),
  table(['Criterio', 'JavaScript (elegido)', 'Unity (WebGL)'], [
    ['Tiempo hasta un primer juego funcional', 'Horas', 'Días'],
    ['Peso de la publicación', '≈ 60 KB, carga instantánea', 'Decenas de MB, carga lenta'],
    ['Publicación', 'Subir una carpeta estática (Vercel)', 'Compilar WebGL y configurar compresión'],
    ['Archivos editables', 'Texto plano en un repositorio Git', 'Proyecto binario de varios GB'],
    ['Adecuación a cartas y cuadrículas 2D', 'Directa con HTML y CSS', 'Sobredimensionado']
  ], [3200, 3080, 3080]),
  spacer(),
  P('Pila tecnológica: HTML5, CSS3 (variables, grid, backdrop-filter, curvas linear()) y JavaScript en módulos ES, sin frameworks ni librerías en tiempo de ejecución. Web Audio API para el sonido (tonos sintetizados, sin archivos), Vibration API para la respuesta háptica en móviles y localStorage para el progreso. Herramientas de desarrollo: esbuild (empaquetado a un solo archivo), Playwright (pruebas de punta a punta, capturas y video) y Vercel (hosting estático).'),
  H2('8.2 Arquitectura'),
  ...img('docs/diseno/arquitectura.png', 16, 'Figura 1. Arquitectura del sistema: capa de presentación, capa de lógica (módulos de juego y adaptación), servicios del navegador y publicación.'),
  ...img('docs/diseno/flujo-pantallas.png', 16, 'Figura 2. Flujo de pantallas y bucle de juego: cada ronda recorre el ciclo planificar (nivel) → hacer (jugar) → verificar (métrica) → actuar (adaptar).'),
  P('La aplicación es una página única. Un enrutador muestra una vista a la vez y avisa a los módulos cuando se entra o se sale de ella (para detener un juego en curso o cancelar una rutina). Los tres minijuegos exponen la misma interfaz (init, start con un callback de fin, stop), lo que permite que la rutina diaria los encadene sin conocer su interior. Un almacén central guarda perfil, ajustes, sesiones y rutinas, y notifica cambios para que el inicio y los logros se actualicen.'),
  H2('8.3 Estructura del código'),
  ...code([
    'index.html            Página única con todas las vistas',
    'css/styles.css        Tokens de color y movimiento, tema claro/oscuro, materiales',
    'js/main.js            Punto de entrada: inicializa módulos y vistas',
    'js/router.js          Navegación entre vistas (hooks enter/leave, animación de entrada)',
    'js/store.js           Persistencia: perfil, ajustes, sesiones, rutinas, racha',
    'js/audio.js           Tonos sintetizados (Web Audio)',
    'js/ui.js              Modal anclado a su origen, toast, formato, háptica',
    'js/games/pares.js     Pares: 8 niveles, fase de memorización, estrellas',
    'js/games/secuencia.js Secuencia: Corsi directo/inverso, 2 intentos por longitud',
    'js/games/nback.js     N-Back: 20 turnos, regla adaptativa 85 % / 60 %',
    'js/views/*.js         Inicio, rutina, progreso y logros, ajustes, ayuda',
    'tools/build.mjs       Empaqueta todo en un solo HTML',
    'tools/test.mjs        Prueba de punta a punta (30 comprobaciones)',
    'tools/capturas.mjs    Genera las capturas; tools/video.mjs graba el video'
  ]),
  spacer(),
  H2('8.4 Diseño y código de los minijuegos'),
  H3('Pares'),
  P('El mazo se genera con 24 símbolos y 6 colores, de modo que cada pareja sea única incluso en el nivel de 24 parejas. La fase de memorización dura 1,5 s más 150 ms por pareja. Las estrellas se asignan por la razón intentos/parejas:'),
  ...code([
    'export function stars(pairs, mv) {',
    '  const r = mv / pairs;',
    '  return r <= 1.5 ? 3 : r <= 2.2 ? 2 : 1;',
    '}',
    '// Al completar un nivel se desbloquea el siguiente como nivel de inicio',
    "if (level + 2 > store.settings.paresLevel) store.setSetting('paresLevel', level + 2);"
  ]),
  spacer(),
  H3('Secuencia'),
  P('La secuencia se genera sin repetir el bloque inmediatamente anterior y se reproduce con una duración de encendido que disminuye con la longitud (de 700 ms a 380 ms), lo que mantiene el ritmo. En modo inverso la secuencia esperada es la misma invertida. Un error concede un segundo intento con una secuencia nueva de la misma longitud; el segundo error termina la sesión y registra la amplitud:'),
  ...code([
    "expected = mode === 'inverso' ? [...seq].reverse() : seq;",
    'if (expected[pos] === i) { pos++; if (pos === expected.length) { span = len; len++; next(); } }',
    'else if (tries === 0) { tries = 1; next(); } else { finish(); }'
  ]),
  spacer(),
  H3('N-Back'),
  P('Se generan N + 20 estímulos; a partir del turno N, cada posición tiene un 32 % de probabilidad de repetir la de N turnos atrás (objetivo). La precisión combina aciertos y rechazos correctos, y la regla de adaptación guarda el N recomendado como valor inicial de la próxima sesión:'),
  ...code([
    'if (k >= N && Math.random() < 0.32) v = seq[k - N];               // objetivo',
    'else do { v = rnd(9); } while (v === last || (k >= N && v === seq[k - N]));',
    '...',
    'const acc = Math.round(100 * (hits + correctRej) / TRIALS);',
    'if (acc >= 85 && N < 4) nextN = N + 1; else if (acc < 60 && N > 1) nextN = N - 1;',
    "store.setSetting('nbackN', nextN);"
  ]),
  spacer(),
  H3('Rutina diaria y puntaje'),
  P('El puntaje del día promedia tres medidas normalizadas a 0–100: la eficiencia de Pares, la amplitud de Secuencia sobre 8 y la precisión de N-Back ponderada por N (×0,7 para N = 1 hasta ×1,1 para N = 4). La racha cuenta días consecutivos con al menos una rutina y se mantiene viva si la última fue ayer.'),
  H2('8.5 Diseño de la interfaz (versión 1.1)'),
  P('La segunda iteración de interfaz aplicó los principios de interfaces fluidas de Apple (Designing Fluid Interfaces, WWDC 2018) traducidos a la web:'),
  bullet([B('Respuesta inmediata: '), R('todos los controles reaccionan al bajar el puntero (pointer-down), no al soltar; en N-Back el acierto se registra en ese instante, lo que reduce la latencia de respuesta.')]),
  bullet([B('Comportamiento sobre animación: '), R('las transiciones usan curvas de resorte expresadas con la función CSS linear() (razón de amortiguación 1,0 por defecto; 0,72 solo en celebraciones: estrellas, logros, racha).')]),
  bullet([B('Interrupción: '), R('solo se animan transform y opacity con transiciones CSS, que parten del valor actual y pueden revertirse a mitad de camino sin saltos.')]),
  bullet([B('Materiales y profundidad: '), R('la barra superior y los diálogos son translúcidos (backdrop-filter) y el contenido pasa por debajo; el diálogo nace desde el control que lo abrió y, al abrirse, el fondo se atenúa y se empuja hacia atrás.')]),
  bullet([B('Tipografía: '), R('fuente del sistema (SF en Apple, Segoe en Windows), tracking negativo en títulos grandes y positivo en etiquetas pequeñas, cifras tabulares en todos los indicadores.')]),
  bullet([B('Accesibilidad: '), R('se respetan prefers-reduced-motion (fundidos en lugar de resortes), prefers-reduced-transparency (superficies sólidas) y prefers-contrast (bordes definidos); foco visible y regiones aria-live para los mensajes.')]),
  H2('8.6 Pruebas'),
  P('Una prueba automatizada con Playwright (tools/test.mjs) juega los tres minijuegos leyendo el estado del DOM, ejecuta una rutina completa y verifica el guardado. Comprende 30 comprobaciones, entre ellas: el nombre se guarda y aparece en el saludo; Pares muestra la fase de memorización, otorga 3 estrellas con intentos mínimos y avanza de nivel; Secuencia alcanza amplitud 5 y termina tras dos errores en la misma longitud; N-Back alcanza 100 % de precisión jugando perfecto, recomienda subir a N = 3 y lo guarda; el progreso lista 4 sesiones y desbloquea logros; la rutina abre los tres juegos en orden, calcula el puntaje y la racha; se guardan 7 sesiones y 1 rutina; borrar progreso vacía el almacén; y no hay errores de consola. La prueba se ejecuta tras cada cambio (ver sección 9).'),
  H2('8.7 Publicación'),
  P([R('El juego se publicó como sitio estático en Vercel en '), link(URL_JUEGO, URL_JUEGO), R('. Tras cada despliegue se compara el hash SHA-1 de cada archivo publicado con el de los archivos que pasaron las pruebas, de modo que lo que está en línea es exactamente lo verificado. El código fuente editable se entrega como repositorio Git.')]),
  H2('8.8 Pantallazos de la funcionalidad'));

const caps = [
  ['02-inicio.png', 'Figura 3. Inicio: saludo, rutina de hoy, tarjetas de los tres ejercicios con mejor marca y sesiones.'],
  ['04-pares-memorizar.png', 'Figura 4. Pares, fase de memorización: el tablero se muestra destapado con cuenta regresiva.'],
  ['06-pares-completado.png', 'Figura 5. Pares completado: intentos, tiempo, eficiencia y estrellas; se desbloquea el siguiente nivel.'],
  ['08-secuencia-correcto.png', 'Figura 6. Secuencia: respuesta correcta y aumento de la longitud.'],
  ['10-nback-jugando.png', 'Figura 7. N-Back espacial en juego: estímulo, contadores y barra de turnos.'],
  ['11-nback-resultado.png', 'Figura 8. N-Back terminado: precisión y recomendación de N para la próxima sesión.'],
  ['13-progreso.png', 'Figura 9. Progreso: indicadores globales, tarjetas por juego, logros e historial.'],
  ['14-planes.png', 'Figura 10. Planes: materialización del modelo de negocio freemium.'],
  ['16-inicio-oscuro.png', 'Figura 11. Tema oscuro.'],
  ['17-movil-inicio.png', 'Figura 12. Vista en teléfono (390 px de ancho).']
];
for (const [f, c] of caps) children.push(...img('docs/capturas/' + f, f.startsWith('17') ? 7 : 15, c));

// 9 Calidad total
children.push(pb(), H1('9. Principios de calidad total: W. Edwards Deming'),
  P('Se eligió a W. Edwards Deming porque su propuesta se centra en el proceso y en la mejora continua, lo que encaja con un desarrollo de software iterativo. Deming (1986) sostiene que la calidad se construye en el proceso y no se inspecciona al final, que la variación debe entenderse con datos y que la mejora es una espiral sin fin. Dos instrumentos suyos guiaron el proyecto: el ciclo PDCA (Planificar, Hacer, Verificar, Actuar) y los 14 puntos para la gestión.'),
  H2('9.1 El ciclo PDCA en el desarrollo'),
  table(['Iteración', 'Planificar', 'Hacer', 'Verificar', 'Actuar'], [
    ['1. Planificación', 'Lluvia de ideas (8 mecánicas), criterios: base teórica, esfuerzo, demostrabilidad', 'Matriz de decisión; elección de Web + JavaScript', 'Revisión contra los entregables del curso (URL, editables, video)', 'Idea elegida: tres minijuegos con una interfaz común'],
    ['2. Prototipo (Avance 1)', 'Un solo archivo HTML con los tres juegos y progreso', 'Desarrollo del prototipo; publicación como artefacto', 'Revisión visual en escritorio y móvil', 'Reestructurar en módulos; añadir rutina, logros y ajustes'],
    ['3. Versión 1.0', 'Arquitectura modular, fase de memorización, modo inverso, N adaptativo, rutina diaria', 'Implementación en 15 módulos; empaquetador', 'Prueba automatizada de 30 comprobaciones; se detectó y corrigió un defecto del empaquetador ($$ interpretado como patrón)', 'Despliegue en Vercel; hashes verificados; capturas y video'],
    ['4. Versión 1.1', 'Rediseño con principios de interfaces fluidas; respuesta en pointer-down; accesibilidad', 'Nueva hoja de estilos, resortes, materiales, háptica', 'Las 30 comprobaciones siguen pasando; revisión en tema claro, oscuro y móvil', 'Regeneración de capturas y video; informe final']
  ], [1500, 2200, 2000, 2000, 1660]),
  spacer(),
  P('Dentro del juego, cada ronda también es un ciclo PDCA: la regla de adaptación planifica el nivel, el jugador lo ejecuta, la métrica lo verifica y la recomendación actúa sobre la siguiente sesión. Así el principio de mejora continua no solo gobernó el desarrollo sino que está codificado en la mecánica.'),
  H2('9.2 Los 14 puntos de Deming aplicados'),
  table(['Punto de Deming', 'Aplicación en el proyecto'], [
    ['1. Constancia en el propósito de mejorar', 'Un objetivo estable en todas las iteraciones: ejercitar la memoria con ejercicios fundamentados; cada versión mejora sobre la anterior sin cambiar el propósito.'],
    ['3. Dejar de depender de la inspección masiva; construir la calidad desde el principio', 'La prueba automatizada se escribió junto con el código y se ejecuta en cada cambio; los módulos exponen una interfaz común que evita errores de integración.'],
    ['5. Mejorar constantemente el sistema de producción y servicio', 'Cuatro iteraciones PDCA documentadas; el empaquetador, las capturas y el video se generan con scripts repetibles, no a mano.'],
    ['6. Instituir la capacitación', 'La ayuda de cada minijuego enseña al usuario qué ejercita y por qué; el código está comentado para que cualquier integrante pueda continuarlo.'],
    ['9. Derribar las barreras entre departamentos', 'Diseño, código y pruebas se trabajaron juntos: la hoja de estilos documenta los principios de diseño y la prueba verifica el comportamiento que el diseño promete.'],
    ['10. Eliminar lemas y exhortaciones; 11. Eliminar cuotas numéricas', 'No se fijaron metas de "líneas de código" ni fechas por encima de la calidad; el criterio de terminado fue que las 30 comprobaciones pasaran y que lo publicado coincidiera con lo probado.'],
    ['12. Eliminar barreras al orgullo por el trabajo bien hecho', 'Entregables verificables: URL pública, hashes comparados, video de una partida real.'],
    ['14. Poner a todos a trabajar en la transformación', 'El modelo de negocio y el plan de pendientes (sección 10) involucran a todo el equipo en la siguiente iteración: pruebas con usuarios y análisis de datos de uso.']
  ], [3200, 6160]),
  spacer(),
  P('Deming también advierte contra las "enfermedades mortales" de la gestión, entre ellas la falta de constancia y el énfasis en resultados a corto plazo. El proyecto evitó la primera con un plan de iteraciones y la segunda con métricas de proceso (pruebas, hashes) en lugar de solo métricas de resultado.'));

// 10 Conclusiones
children.push(H1('10. Conclusiones'),
  num2('Se diseñó y desarrolló una aplicación web funcional que ejercita tres componentes de la memoria con mecánicas tomadas de tareas experimentales reconocidas (parejas con codificación previa, bloques de Corsi y N-Back), cada una vinculada a un modelo teórico: Atkinson y Shiffrin, Miller, y Baddeley y Hitch.'),
  num2('La elección de JavaScript sobre Unity permitió llegar a un prototipo demostrable en horas, publicar un sitio de 60 KB sin instalación y entregar archivos editables en texto plano; para un juego 2D de cartas y cuadrículas fue la decisión correcta.'),
  num2('La dificultad adaptativa (niveles, longitud y N) mantiene al jugador cerca de su límite, condición que la literatura identifica como necesaria para que el entrenamiento tenga efecto en las tareas practicadas.'),
  num2('Aplicar el ciclo PDCA de Deming estructuró el trabajo en cuatro iteraciones verificables; la prueba automatizada detectó un defecto real antes de publicar y la comparación de hashes garantizó que lo publicado fuera lo probado. La calidad se construyó en el proceso, no se inspeccionó al final.'),
  num2('El rediseño de la interfaz con principios de interfaces fluidas mejoró la respuesta percibida (realimentación en pointer-down), la coherencia espacial y la accesibilidad sin añadir dependencias.'),
  num2('El modelo freemium con un plan Pro en soles y licencias institucionales es coherente con el nicho identificado en el estado del arte: una herramienta gratuita, en español y respetuosa de la privacidad.'),
  num2('Como trabajo futuro quedan la validación con usuarios reales (pre y post test de amplitud), la sincronización en la nube para el plan Pro y los ejercicios adicionales (¿Qué cambió?, Palacio de la memoria). Las afirmaciones sobre beneficios se mantienen dentro de lo que la evidencia respalda: mejora en las tareas entrenadas.'));

// 11 Bibliografía
const refs = [
  'Apple Inc. (2018). Designing fluid interfaces [Sesión 803, WWDC 2018]. Apple Developer. https://developer.apple.com/videos/play/wwdc2018/803/',
  'Atkinson, R. C., & Shiffrin, R. M. (1968). Human memory: A proposed system and its control processes. En K. W. Spence & J. T. Spence (Eds.), The psychology of learning and motivation (Vol. 2, pp. 89–195). Academic Press. https://doi.org/10.1016/S0079-7421(08)60422-3',
  'Baddeley, A. D., & Hitch, G. (1974). Working memory. En G. H. Bower (Ed.), The psychology of learning and motivation (Vol. 8, pp. 47–89). Academic Press. https://doi.org/10.1016/S0079-7421(08)60452-1',
  'Corsi, P. M. (1972). Human memory and the medial temporal region of the brain [Tesis doctoral, McGill University].',
  'Deming, W. E. (1986). Out of the crisis. MIT Center for Advanced Engineering Study.',
  'Deming, W. E. (1993). The new economics for industry, government, education. MIT Center for Advanced Engineering Study.',
  'Hardy, J. L., Nelson, R. A., Thomason, M. E., Sternberg, D. A., Katovich, K., Farzin, F., & Scanlon, M. (2015). Enhancing cognitive abilities with comprehensive training: A large, online, randomized, active-controlled trial. PLOS ONE, 10(9), e0134467. https://doi.org/10.1371/journal.pone.0134467',
  'Jaeggi, S. M., Buschkuehl, M., Jonides, J., & Perrig, W. J. (2008). Improving fluid intelligence with training on working memory. Proceedings of the National Academy of Sciences, 105(19), 6829–6833. https://doi.org/10.1073/pnas.0801268105',
  'Kirchner, W. K. (1958). Age differences in short-term retention of rapidly changing information. Journal of Experimental Psychology, 55(4), 352–358. https://doi.org/10.1037/h0043688',
  'Miller, G. A. (1956). The magical number seven, plus or minus two: Some limits on our capacity for processing information. Psychological Review, 63(2), 81–97. https://doi.org/10.1037/h0043158',
  'Osterwalder, A., & Pigneur, Y. (2010). Business model generation: A handbook for visionaries, game changers, and challengers. Wiley.',
  'Shatil, E. (2013). Does combined cognitive training and physical activity training enhance cognitive abilities more than either alone? A four-condition randomized controlled trial among healthy older adults. Frontiers in Aging Neuroscience, 5, 8. https://doi.org/10.3389/fnagi.2013.00008',
  'Simons, D. J., Boot, W. R., Charness, N., Gathercole, S. E., Chabris, C. F., Hambrick, D. Z., & Stine-Morrow, E. A. L. (2016). Do "brain-training" programs work? Psychological Science in the Public Interest, 17(3), 103–186. https://doi.org/10.1177/1529100616661983',
  'Strobach, T., & Huestegge, L. (2017). Evaluating the effectiveness of commercial brain game training with working-memory tasks. Journal of Cognitive Enhancement, 1(4), 539–558. https://doi.org/10.1007/s41465-017-0053-0'
];
children.push(H1('11. Bibliografía (norma APA, 7.ª edición)'),
  ...refs.map(r => new Paragraph({ spacing: { after: 120, line: 276 }, indent: { left: 720, hanging: 720 }, children: [R(r)] })));

// Anexos
children.push(pb(), H1('Anexo A. Enlaces y entregables'),
  bullet([B('Juego en línea: '), link(URL_JUEGO, URL_JUEGO)]),
  bullet([B('Archivos editables: '), R('carpeta gimnasio-memoria (repositorio Git) con index.html, css/, js/, tools/ y docs/.')]),
  bullet([B('Capturas: '), R('docs/capturas/ (18 imágenes PNG, escritorio, móvil y tema oscuro).')]),
  bullet([B('Video demostrativo: '), R('docs/video/demo.mp4 (una partida completa de los tres ejercicios y el panel de progreso).')]),
  bullet([B('Prueba automatizada: '), R('tools/test.mjs — ejecutar con npm test tras npm install.')]),
  H1('Anexo B. Cómo ejecutar y desplegar'),
  ...code(['npm install          # instala esbuild y Playwright (solo para build y pruebas)', 'npm start            # sirve la carpeta en http://localhost:5173', 'npm run build        # genera dist/index.html (un solo archivo)', 'npm test             # ejecuta las 30 comprobaciones', 'npm run capturas     # regenera docs/capturas', 'npm run video        # regenera docs/video/demo.webm']),
  spacer(),
  P('Despliegue en Vercel: importar el repositorio de GitHub en vercel.com (framework: Other, sin comando de build, directorio de salida: raíz) o arrastrar la carpeta del proyecto en el panel. Cada push a la rama principal publica una nueva versión.'));

/* ---------- documento ---------- */
const doc = new Document({
  creator: 'Adriel Gudiel Urquizo',
  title: 'Gimnasio de Memoria — Informe final',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, color: ACCENT, font: FONT }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: '17203A', font: FONT }, paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: '5D6782', font: FONT }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }, { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1440, hanging: 360 } } } }] },
      { reference: 'nums2', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  features: { updateFields: true },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Gimnasio de Memoria · Informe final', font: FONT, size: 16, color: '8A93AD' })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Página ', PageNumber.CURRENT], font: FONT, size: 16, color: '8A93AD' })] })] }) },
    children
  }]
});

const buf = await Packer.toBuffer(doc);
const out = `${OUT}/Informe-Gimnasio-de-Memoria.docx`;
writeFileSync(out, buf);
console.log('Informe:', out, (buf.length / 1024).toFixed(0), 'KB');
