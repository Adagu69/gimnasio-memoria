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
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 1400 }, children: [new TextRun({ text: 'Programa web de entrenamiento de la memoria con estética Pixel-3D: prueba de nivel, sesión diaria y cuatro ejercicios adaptativos, fundamentado en la psicología cognitiva y desarrollado bajo los principios de calidad total de W. Edwards Deming', font: FONT, size: 24, italics: true, color: '17203A' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'Informe final del trabajo', font: FONT, size: 22, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Integrantes:', font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Adriel Gudiel Urquizo', font: FONT, size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: '[Integrante 2]', font: FONT, size: 22, color: 'C97D12' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: '[Integrante 3]', font: FONT, size: 22, color: 'C97D12' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [new TextRun({ text: 'Juego en línea: ', font: FONT, size: 22 }), link(URL_JUEGO, URL_JUEGO)] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Lima, noviembre de 2026', font: FONT, size: 22 })] }),
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
  P([B('Gimnasio de Memoria: '), R('programa web de entrenamiento de la memoria con prueba de nivel, sesión diaria e índice de memoria, basado en cuatro ejercicios adaptativos (Pares, Secuencia, N-Back y Palacio de la memoria), fundamentado en la psicología cognitiva y desarrollado bajo los principios de calidad total de W. Edwards Deming.')]));

// 2 Descripción
children.push(H1('2. Descripción'),
  P('Gimnasio de Memoria es una aplicación web gratuita, sin instalación, que organiza el entrenamiento de la memoria como un programa personal, siguiendo la estructura de las plataformas comerciales de entrenamiento cognitivo (ver sección 5) en una versión simplificada:'),
  num('Bienvenida y configuración: el usuario indica su nombre, su objetivo, las áreas de memoria que quiere entrenar, su rango de edad y la dificultad que prefiere.', 'nums3'),
  num('Prueba de nivel: juega una vez cada ejercicio, con una tarjeta de introducción que explica qué capacidad se pone a prueba y una tarjeta de resultado que la interpreta. Al final obtiene su Índice de Memoria inicial por área y global.', 'nums3'),
  num('Plan de 30 días: a partir de la línea base se fija una meta de práctica (+25 % o +35 % según la dificultad).', 'nums3'),
  num('Gimnasio 3D: pantalla principal con cinco estaciones (Pares, Secuencia, N-Back, Palacio y vitrina de progreso). Desde allí se inicia la sesión diaria, con los ejercicios del programa, calendario de días entrenados con racha e Índice de Memoria actual por área.', 'nums3'),
  P('Los cuatro ejercicios entrenan componentes distintos de la memoria descritos por la psicología cognitiva y comparten una regla de dificultad adaptativa que mantiene al jugador cerca del límite de su capacidad:'),
  bullet([B('Pares '), R('(memoria visual a corto plazo). El tablero se muestra destapado unos segundos para que el jugador codifique la posición de cada símbolo; luego se tapa y hay que encontrar las parejas en el menor número de intentos. Ocho niveles, de 4×3 a 8×6 cartas; se otorgan estrellas según la eficiencia.')]),
  bullet([B('Secuencia '), R('(memoria espacial, adaptación de la tarea de bloques de Corsi). Nueve bloques, dispuestos en un tablero de posiciones irregulares inspirado en el de Corsi, se encienden en un orden que el jugador debe repetir, en modo directo o inverso. Comienza con tres bloques; cada acierto añade uno y se permiten dos intentos por longitud. La amplitud (span) es la longitud más larga superada.')]),
  bullet([B('N-Back espacial '), R('(memoria de trabajo). Un estímulo aparece cada 2,5 s en una de nueve celdas; el jugador avisa cuando la posición coincide con la de N turnos atrás (N de 1 a 4). Se registran aciertos, omisiones y falsas alarmas; con precisión ≥ 85 % el juego sube N y con menos de 60 % lo baja.')]),
  bullet([B('Palacio de la memoria '), R('(memoria asociativa, método de loci). Una habitación tridimensional con una ruta fija de 12 lugares: el jugador observa un objeto en cada lugar y después elige, entre cuatro opciones, el objeto que correspondía a cada lugar. El número de lugares (de 4 a 12) se adapta con la misma regla 85 %/60 %.')]),
  P('Complementan el programa un gimnasio tridimensional como pantalla principal, una biblioteca de juegos para practicar libremente, un panel de progreso con historial, gráficos y diez logros, ayuda contextual que explica la base teórica de cada ejercicio, ajustes (nombre, sonido, tema claro/oscuro, estilo visual Pixel-3D o clásico, repetir la prueba de nivel) y una vista de Planes que materializa el modelo de negocio freemium. El progreso se guarda en el navegador (localStorage), sin enviar datos a ningún servidor.'),
  P([R('La aplicación está publicada en '), link(URL_JUEGO, URL_JUEGO), R(' y su código fuente editable (HTML, CSS y JavaScript en módulos, con Three.js y Matter.js empaquetados en un solo archivo) acompaña a este informe.')]));

// 3 Objetivos
children.push(H1('3. Objetivo general y objetivos específicos'),
  H2('3.1 Objetivo general'),
  P('Diseñar y desarrollar una aplicación web en JavaScript que permita ejercitar y reforzar la memoria a corto plazo, la amplitud visoespacial y la memoria de trabajo mediante ejercicios adaptativos fundamentados en la psicología cognitiva, aplicando los principios de calidad total de W. Edwards Deming en el proceso de desarrollo.'),
  H2('3.2 Objetivos específicos'),
  num('Fundamentar cada ejercicio en un modelo o tarea reconocida de la psicología de la memoria (Atkinson y Shiffrin, Miller, Baddeley y Hitch; tareas de Corsi y N-Back; método de loci de Yates, 1966, y Bower, 1970).'),
  num('Implementar cuatro minijuegos con dificultad adaptativa y métricas de desempeño medibles (eficiencia, amplitud, precisión, lugares recordados).'),
  num('Rediseñar la interfaz con una estética Pixel-3D intuitiva y de juego, sin alterar los tiempos ni las métricas de los ejercicios.'),
  num('Estructurar el entrenamiento como un programa personal: prueba de nivel inicial, índice de memoria por área, meta a 30 días y sesión diaria con calendario y racha.'),
  num('Registrar el progreso del usuario en el dispositivo y presentarlo en un panel con historial, gráficos y logros que fomenten la constancia.'),
  num('Aplicar el ciclo PDCA y los 14 puntos de Deming al proceso de desarrollo, con pruebas automatizadas y verificación de cada entrega.'),
  num('Publicar el juego en un servidor remoto, con sus archivos editables, capturas y video demostrativo, y formular un modelo de negocio sostenible para su distribución.'));

// 4 Marco teórico
children.push(H1('4. Marco teórico'),
  P('Se seleccionaron los autores y modelos cuyas teorías describen los componentes de la memoria que cada ejercicio ejercita. Las tareas experimentales de Corsi y Kirchner se usan como instrumento de implementación, y el método de loci sirve de base al cuarto ejercicio, el Palacio de la memoria.'),
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
    ['N-Back', 'Memoria de trabajo (mantener y actualizar)', 'Baddeley y Hitch (1974)', 'N-Back (Kirchner, 1958; Jaeggi et al., 2008)', 'Precisión (%), aciertos, omisiones, falsas alarmas, N'],
    ['Palacio de la memoria', 'Memoria asociativa (objeto–lugar)', 'Yates (1966); Bower (1970)', 'Método de loci: ruta de 4 a 12 lugares con elección entre cuatro opciones', 'Precisión (%), lugares (L), puntaje normalizado']
  ], [1400, 2000, 2000, 2200, 1760]),
  spacer(),
  H2('4.5 Método de loci: el Palacio de la memoria'),
  P('El método de loci es una técnica mnemotécnica clásica que asocia los elementos que hay que recordar a los lugares de un recorrido conocido, y los recupera al recorrer de nuevo ese camino. Yates (1966) documentó su historia como arte de la memoria, y Bower (1970) analizó su funcionamiento: la imagen vincula cada elemento con un lugar, y el orden del recorrido guía la recuperación. Tulving y Thomson (1973) explican por qué el contexto ayuda: una pista de recuperación es eficaz cuando se codificó junto con el elemento. Legge et al. (2012) hallaron que un palacio de memoria construido en un entorno virtual rinde de forma equivalente a uno construido en un entorno convencional, y Dresler et al. (2017) asociaron el entrenamiento con esta técnica con una reorganización de las redes cerebrales de memoria. El Palacio de la memoria traslada ese formato a un juego: el jugador liga cada objeto a su lugar y, después, lo recupera en el mismo orden, eligiendo entre cuatro opciones.'),
  spacer());

children.push(H2('4.6 Teorías de apoyo al diseño del entrenamiento'),
  P('Además de los modelos de la memoria, el diseño del programa se apoya en teorías del aprendizaje y de la motivación que explican por qué la aplicación está organizada como está:'),
  bullet([B('Codificación dual (Paivio, 1971). '), R('Los símbolos de Pares combinan forma y color, y los objetos del Palacio son imágenes concretas, porque un elemento codificado por dos vías (visual y verbal) se recuerda mejor que uno codificado por una sola.')]),
  bullet([B('Especificidad de la codificación (Tulving y Thomson, 1973). '), R('Una pista de recuperación funciona cuando estuvo presente durante la codificación. Por eso el Palacio pregunta por cada lugar en el mismo orden y con la misma escena en que se observó el objeto.')]),
  bullet([B('Carga cognitiva (Sweller, 1988) y principio de coherencia (Mayer, 2009). '), R('Durante las fases de observación y respuesta no hay animaciones ambientales, partículas ni física: todo lo que no es el estímulo es carga extrínseca y se elimina. El banner OBSERVA → TU TURNO → RESULTADO es idéntico en los cuatro juegos para que el usuario no tenga que reaprender la estructura.')]),
  bullet([B('Dificultad deseable y zona de desarrollo próximo. '), R('La regla de adaptación (85 % / 60 % en N-Back y Palacio, +1 nivel en Pares, +1 bloque en Secuencia) mantiene la tarea justo por encima de lo que el jugador domina, condición que la literatura sobre entrenamiento de memoria de trabajo asocia con la mejora en las tareas practicadas (Jaeggi et al., 2008).')]),
  bullet([B('Motivación: autodeterminación (Deci y Ryan, 2000) y flujo (Csikszentmihalyi, 1990). '), R('El usuario elige qué áreas entrena y a qué dificultad (autonomía), ve su índice subir frente a la línea base (competencia) y recibe la dificultad ajustada que mantiene el reto equilibrado con la habilidad (flujo).')]),
  bullet([B('Formación de hábitos (Lally et al., 2010) y gradiente de meta (Kivetz, Urminsky y Zheng, 2006). '), R('La sesión diaria corta, el calendario con racha y la Torre de constancia con la meta de 30 días hacen visible el progreso hacia un objetivo cercano, lo que acelera la repetición del comportamiento.')]),
  bullet([B('Ley del efecto (Thorndike, 1911). '), R('La recompensa visual (estrellas y bloques que caen con física) llega inmediatamente después de la respuesta correcta, nunca durante la tarea.')]),
  bullet([B('Límites del entrenamiento (Melby-Lervåg y Hulme, 2013; Simons et al., 2016). '), R('Los metaanálisis muestran mejoras en las tareas entrenadas y en tareas cercanas, pero no transferencia general. Por eso la aplicación mide el progreso en sus propios ejercicios y advierte que la meta es un objetivo de práctica, no una predicción.')]),
  table(['Teoría', 'Autor(es)', 'Dónde se aplica en el juego'], [
    ['Modelo multialmacén', 'Atkinson y Shiffrin (1968)', 'Pares: fase de memorización (codificación) y fase de búsqueda (recuperación); banner OBSERVA / TU TURNO'],
    ['Amplitud 7 ± 2 y agrupamiento', 'Miller (1956)', 'Secuencia: longitud creciente desde 3; tonos por bloque que facilitan el agrupamiento'],
    ['Memoria de trabajo', 'Baddeley y Hitch (1974)', 'N-Back (ejecutivo central + agenda visoespacial); modo inverso de Secuencia'],
    ['Tarea de bloques de Corsi', 'Corsi (1972); Berch et al. (1998)', 'Secuencia: nueve bloques en posiciones irregulares, dos intentos por longitud'],
    ['Tarea N-Back', 'Kirchner (1958); Jaeggi et al. (2008)', 'N-Back: ISI 2,5 s, ~⅓ de objetivos, N adaptativo'],
    ['Método de loci', 'Yates (1966); Bower (1970); Legge et al. (2012)', 'Palacio de la memoria: ruta fija de 4 a 12 lugares, objeto por lugar'],
    ['Codificación dual', 'Paivio (1971)', 'Símbolos con forma y color; objetos concretos en el Palacio'],
    ['Especificidad de la codificación', 'Tulving y Thomson (1973)', 'Palacio: recuperación en el mismo orden y escena'],
    ['Carga cognitiva y coherencia', 'Sweller (1988); Mayer (2009)', 'Sin animación ni física durante OBSERVA / TU TURNO; cámara fija'],
    ['Autodeterminación y flujo', 'Deci y Ryan (2000); Csikszentmihalyi (1990)', 'Elección de áreas y dificultad; adaptación continua'],
    ['Hábito y gradiente de meta', 'Lally et al. (2010); Kivetz et al. (2006)', 'Sesión diaria, racha, Torre de constancia a 30 días'],
    ['Límites de la transferencia', 'Melby-Lervåg y Hulme (2013); Simons et al. (2016)', 'Índice medido en las propias tareas; aviso en el plan de 30 días']
  ], [2500, 2800, 4060]),
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
  H2('5.4 Otros precedentes'),
  P('Dos precedentes más orientan el proyecto. Primero, los portales de juegos casuales (Poki, MiniJuegos) ofrecen "juegos mentales" de gran alcance, pero la mayoría son de razonamiento espacial o lógica, con toda la información siempre visible; un juego entrena memoria solo cuando la información desaparece y hay que recuperarla, criterio que cumplen los cuatro ejercicios del proyecto. Segundo, en 2016 la Comisión Federal de Comercio de Estados Unidos sancionó a Lumos Labs, la empresa de Lumosity, por publicidad engañosa sobre los beneficios de su entrenamiento (FTC, 2016). Ese antecedente justifica la redacción prudente de los objetivos y el aviso que la aplicación muestra junto a la meta de 30 días.'),
  H2('5.5 Comparación y posición del proyecto'),
  table(['Criterio', 'Lumosity', 'CogniFit', 'NeuroNation', 'Gimnasio de Memoria'], [
    ['Plataforma', 'Web y móvil', 'Web y móvil', 'Web y móvil', 'Web (cualquier navegador), sin instalación'],
    ['Número de ejercicios', '> 50', '> 30', '> 30', '4 (enfocados en memoria) + rutina diaria'],
    ['Base teórica explícita al usuario', 'Parcial', 'Parcial', 'Parcial', 'Sí: ayuda de cada juego cita el modelo que ejercita'],
    ['Estructura del programa', 'Objetivos → prueba de nivel → plan → sesión diaria; índice LPI', 'Evaluación inicial → entrenamiento personalizado', 'Evaluación → plan → sesiones', 'Objetivos → prueba de nivel → plan de 30 días → sesión diaria; Índice de Memoria (0–100)'],
    ['Adaptación de dificultad', 'Sí', 'Sí', 'Sí', 'Sí: por nivel, por longitud y por N (regla 85 %/60 %)'],
    ['Precio', 'Suscripción (≈ US$ 12/mes)', 'Suscripción (≈ US$ 20/mes)', 'Suscripción (≈ € 10/mes)', 'Gratis; plan Pro S/ 9.90/mes'],
    ['Datos del usuario', 'Servidor del proveedor', 'Servidor del proveedor', 'Servidor del proveedor', 'Solo en el dispositivo (sin registro)'],
    ['Idioma y contexto', 'Español disponible', 'Español disponible', 'Alemán/Inglés principalmente', 'Español nativo, precios en soles']
  ], [1900, 1800, 1800, 1800, 2060]),
  spacer(),
  P('El proyecto toma de estas plataformas la estructura de programa (objetivos, prueba de nivel, plan y sesión diaria) como precedente de diseño, en una versión simplificada, y no pretende competir en catálogo con ellas, sino ocupar un nicho: una herramienta ligera, gratuita, en español, transparente en su fundamento teórico y respetuosa de la privacidad, con un camino de monetización coherente con el mercado latinoamericano.'));

// 6 Justificación
children.push(H1('6. Justificación'),
  H2('6.1 Justificación social'),
  P('La memoria de trabajo y la memoria a corto plazo intervienen en el aprendizaje escolar, el rendimiento laboral y la autonomía de las personas mayores. En el Perú y en América Latina la población mayor de 60 años crece y la mayoría de las herramientas de entrenamiento cognitivo son de pago, están en inglés y guardan datos personales en servidores externos, lo que limita su adopción. Una aplicación web gratuita, en español, sin registro y que funciona en cualquier navegador (incluidos teléfonos de gama media) reduce esas barreras.'),
  H2('6.2 Justificación teórica'),
  P('Cada ejercicio implementa una tarea experimental reconocida (parejas con codificación previa, bloques de Corsi, N-Back, método de loci) y se vincula a un modelo de la psicología cognitiva (Atkinson y Shiffrin; Miller; Baddeley y Hitch; Yates y Bower). Las decisiones de diseño (fases, tiempos, cámara fija, adaptación, racha) se derivan de teorías del aprendizaje y de la motivación (sección 4.6) y no solo de criterios estéticos. Esto permite explicar al usuario, en la ayuda de cada juego, qué capacidad ejercita y por qué.'),
  H2('6.3 Justificación tecnológica'),
  P('La elección de JavaScript sobre Unity se justifica por el tipo de juego (tableros 2D y una escena 3D ligera), por el tiempo de desarrollo (horas frente a días para el primer prototipo), por el peso de la publicación (unos 200 KB comprimidos, incluidas Three.js y Matter.js, frente a decenas de megabytes de un build WebGL de Unity) y porque los archivos editables quedan en texto plano, fáciles de revisar, probar y versionar. Three.js se usa solo como piel visual: la lógica de cada juego vive en el DOM, de modo que el juego funciona también sin WebGL con la piel clásica.'),
  H2('6.4 Justificación académica y de calidad'),
  P('El proyecto integra tres áreas del curso: el diseño de mecánicas de juego con propósito (juego serio), la fundamentación en teorías de la psicología cognitiva y la aplicación de un sistema de calidad al proceso de desarrollo. El ciclo PDCA de Deming estructuró seis iteraciones verificables, con pruebas automatizadas (unitarias y de punta a punta) que se ejecutan en cada cambio.'),
  H2('6.5 Alcance de las afirmaciones'),
  P([R('La evidencia disponible respalda que el entrenamiento mejora el desempeño en las tareas practicadas y en tareas similares, pero la transferencia a la inteligencia general está cuestionada (Melby-Lervåg y Hulme, 2013; Simons et al., 2016), y existe el antecedente de la sanción a Lumosity por prometer más de lo demostrado (FTC, 2016). Por ello los objetivos del proyecto hablan de '), I('ejercitar y reforzar la memoria'), R(', la aplicación mide el progreso en las propias tareas (Índice de Memoria frente a la línea base) y el plan de 30 días advierte que la meta es un objetivo de práctica, no una predicción.')]));

// 7 Modelo de negocio
children.push(H1('7. Modelo de negocio'),
  P('El modelo se formuló con el lienzo de Osterwalder y Pigneur (2010) bajo un esquema freemium: el entrenamiento básico es gratuito y el crecimiento se financia con un plan Pro individual y licencias institucionales. La vista Planes de la aplicación ya presenta la oferta y mide el interés con el botón "Me interesa".'),
  H2('7.1 Lienzo de modelo de negocio (Business Model Canvas)'),
  table(['Bloque', 'Contenido'], [
    ['Segmentos de clientes', 'B2C: estudiantes de secundaria y universidad (preparación de exámenes), adultos de 25 a 59 que quieren mantener su agilidad mental, adultos mayores y sus familias. B2B: colegios y academias, centros de adulto mayor, áreas de bienestar de empresas.'],
    ['Propuesta de valor', 'Entrenar la memoria en cinco minutos al día con cuatro ejercicios fundamentados científicamente, en español, gratis, sin instalación ni registro, con prueba de nivel, Índice de Memoria, plan de 30 días y racha que motiva la constancia, y con una estética de juego (Pixel-3D) que no parece un panel clínico.'],
    ['Canales', 'Enlace web directo (Vercel) y versión instalable (PWA) en una fase posterior; redes sociales con retos semanales de memoria; convenios con colegios y centros de adulto mayor; charlas en universidades.'],
    ['Relación con clientes', 'Autoservicio; recordatorio de sesión diaria; informe semanal por correo (Pro); panel de seguimiento y capacitación para instituciones; comunidad de retos.'],
    ['Fuentes de ingresos', 'Plan Pro individual (suscripción mensual o anual); licencia institucional por asiento; en el futuro, contenido adicional (paquetes de ejercicios) sin publicidad.'],
    ['Recursos clave', 'Código de la aplicación y su fundamento teórico documentado; marca; infraestructura de hosting (Vercel); base de usuarios y sus métricas de progreso (anónimas).'],
    ['Actividades clave', 'Desarrollo e iteración de ejercicios bajo PDCA; pruebas automatizadas; validación con usuarios; análisis de métricas de uso; producción de contenido educativo para redes.'],
    ['Socios clave', 'Facultades de psicología (validación y pruebas con usuarios); colegios y centros de adulto mayor (distribución); pasarela de pagos (Culqi o Niubiz); hosting (Vercel).'],
    ['Estructura de costos', 'Hosting (gratuito en el nivel actual, ≈ US$ 20/mes al crecer), dominio (≈ US$ 15/año), comisiones de pasarela (≈ 4 % + S/ 1 por transacción), horas de desarrollo y diseño, marketing de contenidos.']
  ], [2400, 6960]),
  spacer(),
  H2('7.2 Planes y precios'),
  table(['Característica', 'Gratis', 'Pro (S/ 9.90/mes · S/ 79/año)', 'Institucional (S/ 4/asiento/mes, mín. 30)'], [
    ['Cuatro ejercicios y prueba de nivel', 'Sí', 'Sí', 'Sí'],
    ['Sesión diaria, racha y plan de 30 días', 'Sí', 'Sí', 'Sí'],
    ['Progreso', 'Solo en este dispositivo', 'Sincronizado en la nube', 'Sincronizado; panel del docente o cuidador'],
    ['Informe semanal y comparación por edad', 'No', 'Sí', 'Sí, por grupo'],
    ['Ejercicios adicionales (¿Qué cambió?, modo inverso avanzado)', 'No', 'Sí', 'Sí'],
    ['Perfiles', '1', 'Familia: hasta 4', 'Por asiento'],
    ['Publicidad', 'Ninguna', 'Ninguna', 'Ninguna'],
    ['Soporte', 'Comunidad', 'Correo', 'Capacitación y soporte prioritario']
  ], [3000, 1700, 2300, 2360]),
  spacer(),
  P('El precio del plan Pro se fijó por debajo de la mitad de las suscripciones de referencia (Lumosity ≈ US$ 12, CogniFit ≈ US$ 20, NeuroNation ≈ € 10 al mes) para ajustarse al poder adquisitivo del mercado peruano, y el plan anual con descuento del 33 % favorece la retención. La licencia institucional se cobra por asiento para que un colegio o un centro de adulto mayor pueda empezar con un grupo pequeño.'),
  H2('7.3 Proyección del primer año'),
  P('Supuestos: crecimiento orgánico y por convenios hasta 10 000 usuarios activos mensuales al final del primer año; conversión al plan Pro del 3 % (valor habitual en aplicaciones freemium de salud y aprendizaje); dos instituciones con 50 asientos cada una a partir del segundo semestre.'),
  table(['Concepto', 'Mes 6 (escenario conservador)', 'Mes 12 (escenario base)'], [
    ['Usuarios activos mensuales', '3 000', '10 000'],
    ['Suscriptores Pro (3 %)', '90 × S/ 9.90 = S/ 891', '300 × S/ 9.90 = S/ 2 970'],
    ['Asientos institucionales', '0', '100 × S/ 4 = S/ 400'],
    ['Ingresos mensuales', 'S/ 891', 'S/ 3 370'],
    ['Costos mensuales (hosting, dominio, pasarela)', '≈ S/ 150', '≈ S/ 350'],
    ['Margen operativo mensual', '≈ S/ 740', '≈ S/ 3 020']
  ], [3600, 2900, 2860]),
  spacer(),
  P('Las cifras son supuestos de planificación, no proyecciones validadas. El margen del escenario base permitiría financiar nuevos ejercicios y la sincronización en la nube del plan Pro.'),
  H2('7.4 Métricas de validación'),
  bullet([B('Activación: '), R('porcentaje de usuarios que completan la prueba de nivel (objetivo: ≥ 60 %).')]),
  bullet([B('Retención: '), R('porcentaje que completa una sesión diaria al menos 3 días en la primera semana (racha ≥ 3; objetivo: ≥ 25 %).')]),
  bullet([B('Progreso: '), R('variación del Índice de Memoria a los 30 días frente a la línea base (objetivo: mejora en al menos el 50 % de los usuarios activos).')]),
  bullet([B('Interés comercial: '), R('clics en "Me interesa" del plan Pro sobre usuarios activos (objetivo: ≥ 5 %) antes de implementar el cobro.')]),
  H2('7.5 Riesgos y mitigación'),
  table(['Riesgo', 'Mitigación'], [
    ['Baja conversión al plan Pro', 'Mantener el plan gratuito completo para crecer en usuarios; concentrar el valor de pago en la nube, los informes y el modo familia; probar precios con la métrica de interés.'],
    ['Afirmaciones sobre beneficios cuestionadas (precedente FTC–Lumosity)', 'Objetivos redactados como "ejercitar y reforzar"; aviso explícito de que la meta no es una predicción; medir solo en las propias tareas.'],
    ['Privacidad de datos de salud', 'La versión gratuita no envía datos; la sincronización Pro será opcional, con datos mínimos y consentimiento explícito.'],
    ['Competencia con catálogo mayor', 'Nicho: gratuito, en español, con precios en soles, transparente en su base teórica; convenios locales que las plataformas globales no atienden.'],
    ['Dependencia del hosting', 'Sitio estático empaquetado en un solo archivo: se puede publicar en cualquier proveedor en minutos.']
  ], [3400, 5960]),
  spacer());

// 8 Desarrollo
children.push(pb(), H1('8. Desarrollo'),
  H2('8.1 Plataforma y tecnologías'),
  table(['Criterio', 'JavaScript (elegido)', 'Unity (WebGL)'], [
    ['Tiempo hasta un primer juego funcional', 'Horas', 'Días'],
    ['Peso de la publicación', '≈ 200 KB comprimidos, con Three.js y Matter.js', 'Decenas de MB, carga lenta'],
    ['Publicación', 'Empaquetar con esbuild y publicar la carpeta dist/ (Vercel)', 'Compilar WebGL y configurar compresión'],
    ['Archivos editables', 'Texto plano en un repositorio Git', 'Proyecto binario de varios GB'],
    ['Adecuación a cartas y cuadrículas 2D', 'Directa con HTML y CSS', 'Sobredimensionado']
  ], [3200, 3080, 3080]),
  spacer(),
  P('Pila tecnológica: HTML5, CSS3 (variables, grid, backdrop-filter, curvas linear()) y JavaScript en módulos ES. Desde la versión 3.0 se añaden dos librerías, empaquetadas junto con el código: Three.js 0.187, para el render tridimensional con RenderPixelatedPass que produce la estética pixelada, y Matter.js 0.20, para la física 2D decorativa. La fuente Pixelify Sans (licencia OFL) se usa solo en títulos, marcadores y cifras. Web Audio API para el sonido (tonos sintetizados, sin archivos), Vibration API para la respuesta háptica en móviles y localStorage para el progreso. Herramientas de desarrollo: esbuild (servidor de desarrollo y empaquetado en un solo archivo), Playwright (pruebas de punta a punta, capturas y video), node:test (pruebas unitarias) y Vercel (publicación de dist/).'),
  H2('8.2 Arquitectura'),
  ...img('docs/diseno/arquitectura.png', 16, 'Figura 1. Arquitectura del sistema: flujo de entrada y aplicación, módulos de lógica, servicios del navegador, calidad y publicación (en la versión 3.0 se añaden la piel Pixel-3D, la física decorativa y el Palacio; ver 8.9).'),
  ...img('docs/diseno/flujo-pantallas.png', 16, 'Figura 2. Flujo de pantallas: primera vez (configuración, prueba de nivel, resultados, plan) y uso diario (Hoy, sesión diaria, juegos, progreso, ajustes).'),
  P('La aplicación es una página única con dos tipos de vistas: las de pantalla completa del flujo de entrada (bienvenida, configuración, prueba de nivel, resultados y plan) y las de la aplicación (en la versión 2.0, un menú lateral con Hoy, Juegos, Mi progreso y Ajustes; desde la versión 3.0, el gimnasio 3D de la sección 9). Un enrutador muestra una vista a la vez y avisa a los módulos cuando se entra o se sale de ella (para detener un juego en curso o cancelar una sesión). Los cuatro minijuegos exponen la misma interfaz (init, start con un callback de fin, stop), lo que permite que el módulo de sesión los encadene, tanto en la prueba de nivel como en la sesión diaria, con una tarjeta de introducción y otra de resultado por juego. Un almacén central guarda perfil (objetivo, áreas, edad, dificultad, prueba de nivel), ajustes, sesiones y sesiones diarias, y el módulo de índice calcula el Índice de Memoria a partir de las últimas tres sesiones de cada área.'),
  H2('8.3 Estructura del código'),
  ...code([
    'index.html            Página única: vistas, HUD del gimnasio y contenedores 3D',
    'css/styles.css        Importa base, pixel, juegos y mundo',
    'css/base.css          Tokens de color y movimiento, tema claro/oscuro',
    'css/pixel.css         Estética Pixel-3D: biseles, paneles, banner de fase, fuente pixel',
    'css/juegos.css        Tableros y controles de los ejercicios',
    'css/mundo.css         Gimnasio 3D: HUD, panel de estación, camino del día',
    'js/main.js            Punto de entrada: inicializa módulos y vistas',
    'js/router.js          Navegación entre vistas; monta y desmonta la escena 3D',
    'js/store.js           Persistencia: perfil, ajustes (incluido el estilo visual), sesiones, racha',
    'js/audio.js           Tonos sintetizados (Web Audio)',
    'js/ui.js              Modal anclado a su origen, toast, formato, háptica',
    'js/indice.js          Índice de Memoria: normalización de los 4 juegos, índice por área y global',
    'js/games/pares.js     Pares: 8 niveles, fase de memorización, estrellas',
    'js/games/secuencia.js Secuencia: Corsi directo/inverso, 2 intentos por longitud',
    'js/games/corsi-layout.js  Nueve posiciones irregulares, comunes a las dos pieles',
    'js/games/nback.js     N-Back: 20 turnos, regla adaptativa 85 % / 60 %',
    'js/games/palacio.js   Palacio de la memoria: controlador DOM (OBSERVA y TU TURNO)',
    'js/games/palacio-logic.js  Lógica pura: ensayos, distractores, puntuación y niveles',
    'js/three/             Piel Pixel-3D: engine, skin, anchor, voxel, palette, tween y scenes/',
    'js/physics/           Física decorativa con Matter.js: world2d, presets, bridge3d, bridge-dom',
    'js/views/config.js    Bienvenida y asistente de configuración',
    'js/views/sesion.js    Prueba de nivel y sesión diaria: intro → juego → resultado por cada ejercicio',
    'js/views/mundo.js     Gimnasio 3D: HUD, panel de estación, camino del día, cajón Diario',
    'js/views/fase.js      Banner común OBSERVA → TU TURNO → RESULTADO',
    'js/views/*.js         Juegos, progreso y logros, ajustes, ayuda',
    'tools/dev.mjs         Servidor de desarrollo con esbuild',
    'tools/build.mjs       Empaqueta todo en un solo HTML (dist/index.html)',
    'tools/test.mjs        Prueba de punta a punta en las dos pieles (Pixel-3D y clásica)',
    'tools/unit/           Pruebas unitarias con node --test (física, anclaje, Corsi, Palacio)',
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
  P('La secuencia se genera sin repetir el bloque inmediatamente anterior y se reproduce sobre el tablero de nueve bloques en posiciones irregulares (js/games/corsi-layout.js, común a las dos pieles), con una duración de encendido que disminuye con la longitud, max(380, 700 − 35 · longitud) ms, lo que mantiene el ritmo. En modo inverso la secuencia esperada es la misma invertida. Un error concede un segundo intento con una secuencia nueva de la misma longitud; el segundo error termina la sesión y registra la amplitud:'),
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
  H3('Índice de Memoria, prueba de nivel y sesión diaria'),
  P('Cada sesión se normaliza a 0–100: la eficiencia de Pares, la amplitud de Secuencia sobre 8 y la precisión de N-Back ponderada por N (×0,7 para N = 1 hasta ×1,1 para N = 4) y la precisión del Palacio ponderada por su número de lugares (×0,7 para 4 lugares hasta ×1,1 para 12). El índice de un área es el promedio de sus últimas tres sesiones y el índice global, el promedio de las áreas del programa. La prueba de nivel registra la línea base; el plan fija como meta subirla un 25 % (estándar) o un 35 % (avanzado). La sesión diaria encadena los ejercicios del programa y guarda un puntaje por día; la racha cuenta días consecutivos con sesión y se mantiene viva si la última fue ayer.'),
  ...code([
    'export function areaIndex(game, n = 3) {',
    '  const last = store.byGame(game).slice(-n);',
    '  return last.length ? Math.round(last.reduce((a, s) => a + normalize(s), 0) / last.length) : null;',
    '}',
    "export function goal(v) { return Math.min(100, Math.round(v * (1 + goalPct() / 100))); }"
  ]),
  spacer(),
  H2('8.5 Diseño de la interfaz'),
  P('La versión 2.0 reorganizó la aplicación como un programa de entrenamiento tomando como precedente el flujo de las plataformas revisadas en el estado del arte: pantallas de pantalla completa para el flujo de entrada (bienvenida, asistente de configuración con barra de progreso, prueba de nivel con stepper y tarjeta protagonista por juego, resultados con curva de distribución y plan de 30 días) y un panel con menú lateral para el uso diario (Hoy, Juegos, Mi progreso, Ajustes), que en teléfonos se convierte en barra inferior. La versión 3.0 sustituye ese menú por el gimnasio 3D navegable (sección 8.9). La iteración anterior (1.1) había aplicado los principios de interfaces fluidas de Apple (Designing Fluid Interfaces, WWDC 2018) traducidos a la web, que se mantienen:'),
  bullet([B('Respuesta inmediata: '), R('todos los controles reaccionan al bajar el puntero (pointer-down), no al soltar; en N-Back el acierto se registra en ese instante, lo que reduce la latencia de respuesta.')]),
  bullet([B('Comportamiento sobre animación: '), R('las transiciones usan curvas de resorte expresadas con la función CSS linear() (razón de amortiguación 1,0 por defecto; 0,72 solo en celebraciones: estrellas, logros, racha).')]),
  bullet([B('Interrupción: '), R('solo se animan transform y opacity con transiciones CSS, que parten del valor actual y pueden revertirse a mitad de camino sin saltos.')]),
  bullet([B('Materiales y profundidad: '), R('la barra superior y los diálogos son translúcidos (backdrop-filter) y el contenido pasa por debajo; el diálogo nace desde el control que lo abrió y, al abrirse, el fondo se atenúa y se empuja hacia atrás.')]),
  bullet([B('Tipografía: '), R('fuente del sistema (SF en Apple, Segoe en Windows) para el texto largo; desde la versión 3.0, la fuente pixel Pixelify Sans solo en títulos, marcadores y cifras. Tracking negativo en títulos grandes y positivo en etiquetas pequeñas, cifras tabulares en todos los indicadores.')]),
  bullet([B('Accesibilidad: '), R('se respetan prefers-reduced-motion (fundidos en lugar de resortes), prefers-reduced-transparency (superficies sólidas) y prefers-contrast (bordes definidos); foco visible y regiones aria-live para los mensajes.')]),
  H2('8.6 Pruebas'),
  P('Hay dos pruebas automatizadas. Las unitarias (npm run test:unit, con node --test) cubren la física (asentamiento y límites), el anclaje entre DOM y 3D, el layout de Corsi y la lógica del Palacio: 33 pruebas, todas correctas en la versión 3.0. La prueba de punta a punta (tools/test.mjs, con Playwright) recorre el flujo completo leyendo el estado del DOM: bienvenida y configuración, prueba de nivel con los cuatro juegos, resultados, plan, gimnasio 3D, sesión diaria completa, torre de constancia, progreso, juego libre y ajustes. Se ejecuta dos veces, con la piel Pixel-3D y con la clásica, y comprueba además que la duración de los estímulos no se desvía más de 20 ms con el 3D, que no hay física activa durante OBSERVA ni TU TURNO, y que no hay errores de consola. La prueba se ejecuta tras cada cambio (ver sección 9).'),
  H2('8.7 Publicación'),
  P([R('El juego se publica en Vercel desde la carpeta dist/ (generada con npm run build), en '), link(URL_JUEGO, URL_JUEGO), R('. Tras cada despliegue se compara el hash SHA-1 de cada archivo publicado con el de los archivos que pasaron las pruebas, de modo que lo que está en línea es exactamente lo verificado. El código fuente editable se entrega como repositorio Git.')]),
  H2('8.8 Pantallazos de la funcionalidad'),
  P('Las capturas que siguen corresponden a la versión 3.0 (estilo Pixel-3D) y se generan automáticamente con npm run capturas, jugando el flujo completo.'));

const caps = [
  ['01-bienvenida.png', 'Figura 3. Bienvenida: los tres pasos del programa (objetivos, nivel actual, plan).'],
  ['03-config-areas.png', 'Figura 4. Configuración: áreas de memoria que se entrenarán (cada una ligada a un ejercicio).'],
  ['06-prueba-intro-pares.png', 'Figura 5. Prueba de nivel: tarjeta de introducción de Pares con la maqueta 3D de la estación y el stepper de 4 juegos.'],
  ['07-pares-memorizar.png', 'Figura 6. Pares, fase OBSERVA: cartas vóxel destapadas, banner de fase y anillo de cuenta atrás.'],
  ['09-prueba-resultado-pares.png', 'Figura 7. Tarjeta de resultado: caen tantas estrellas como obtuvo el jugador (Matter.js) junto al puntaje.'],
  ['11-secuencia-correcto.png', 'Figura 8. Secuencia: tablero de Corsi con bloques en posiciones irregulares; respuesta correcta.'],
  ['12-nback-jugando.png', 'Figura 9. N-Back espacial en juego: ficha vóxel en la rejilla 3×3, contadores y barra de turnos.'],
  ['14-resultados-prueba-nivel.png', 'Figura 10. Resultados de la prueba de nivel: columnas de bloques con física (1 bloque = 10 puntos) e Índice de Memoria global.'],
  ['15-plan-30-dias.png', 'Figura 11. Plan de 30 días: línea base y meta por área.'],
  ['18-hoy-completado.png', 'Figura 12. Gimnasio 3D con la sesión diaria completada: estaciones, camino del día y Torre de constancia.'],
  ['19-progreso.png', 'Figura 13. Mi progreso: índice frente a la línea base, tarjetas por juego, logros e historial.'],
  ['22-planes.png', 'Figura 14. Planes: materialización del modelo de negocio freemium.'],
  ['24-hoy-oscuro.png', 'Figura 15. Gimnasio en tema oscuro: la paleta 3D se toma de los mismos tokens CSS.'],
  ['26-movil-hoy.png', 'Figura 16. Vista en teléfono (390 px de ancho): gimnasio con rótulos compactos y barra de navegación inferior.'],
  ['28-palacio-observa.png', 'Figura 17. Palacio de la memoria, fase OBSERVA: la cámara recorre la ruta y cada objeto aparece en su lugar.'],
  ['29-palacio-turno.png', 'Figura 18. Palacio de la memoria, fase TU TURNO: cuatro opciones, con distractores de otros lugares del mismo recorrido.'],
  ['30-mundo-estacion.png', 'Figura 19. Gimnasio: al elegir una estación la cámara se acerca y se abre su panel (Jugar, ¿Cómo se juega?).'],
  ['31-resultado-fisica-palacio.png', 'Figura 20. Resultado del Palacio: los objetos recordados caen al cofre (física decorativa, solo después de la tarea).']
];
for (const [f, c] of caps) children.push(...img('docs/capturas/' + f, f.startsWith('26') ? 7 : 15, c));

// 9 Rediseño Pixel-3D (versión 3)
children.push(H2('8.9 Rediseño Pixel-3D (versión 3.0)'),
  P('La versión 3.0 conserva la lógica, las métricas y los tiempos de los ejercicios de la versión 2.0 y cambia su presentación. El objetivo fue que la aplicación se perciba como un juego y no como un panel administrativo, sin perder la justificación psicológica de cada ejercicio. Las decisiones se fijaron en un plan previo a la implementación, que definió qué cambia, qué no cambia y por qué.'),
  H3('8.9.1 Dirección visual'),
  P('El estilo Pixel-3D combina una escena tridimensional de baja resolución con contornos definidos. La escena se dibuja con Three.js 0.187 y un pase de píxeles (RenderPixelatedPass) que agrupa el render en bloques de 3 a 4 píxeles y marca los bordes según la normal y la profundidad; los materiales son de tono toon de tres niveles. La paleta es limitada (unos 16 colores) y se toma de los tokens CSS de la aplicación, de modo que los temas claro y oscuro se ven igual en 3D.'),
  P('La tipografía separa dos funciones. La fuente pixel Pixelify Sans (licencia OFL) se usa solo en títulos, marcadores y cifras, mientras que el texto largo conserva la fuente del sistema, por legibilidad para usuarios de 60 años o más. Los botones tienen bisel de píxel que se hunde al pulsarlos, y el banner de fase (OBSERVA, TU TURNO, RESULTADO) ocupa siempre el mismo lugar.'),
  H3('8.9.2 Arquitectura: el DOM es la verdad, el 3D es la piel'),
  P('La lógica de los juegos no cambió: sigue manipulando botones y clases del DOM, de modo que se conservan los tiempos, las métricas, la accesibilidad por teclado y lector de pantalla, y las pruebas automatizadas. Solo la disposición de los bloques de Secuencia pasó a un módulo común. Una capa nueva observa ese DOM con MutationObserver y refleja su estado en una escena WebGL que se dibuja detrás del tablero. Los botones DOM quedan encima, con fondo transparente y contorno de foco visible; un elemento transparente sigue siendo visible y accesible para las herramientas de prueba.'),
  P('En los tableros, el diseño responsivo sigue definido en CSS: la escena desproyecta el centro y las esquinas de cada celda sobre el plano de la mesa, de modo que el 3D coincide con la zona de toque. En el gimnasio, en cambio, las estaciones viven en el mundo tridimensional y sus botones se reposicionan proyectando su posición 3D cada vez que la cámara se mueve.'),
  P('Existe una piel clásica alternativa, que conserva la presentación de la versión 2.0 con las mismas posiciones y tiempos. Se activa por elección del usuario (ajuste “Estilo visual” o parámetro visual=clasico), si WebGL no está disponible o se pierde el contexto, o si el rendimiento es bajo (la media de 60 cuadros supera 50 ms). Como ambas pieles usan las mismas posiciones y tiempos, la medida no depende de la piel.'),
  H3('8.9.3 Justificación psicológica de cada decisión'),
  P('Cada decisión de diseño se evaluó por su efecto sobre la tarea y no solo por su apariencia. La tabla resume el fundamento de cada una:'),
  table(['Decisión de diseño', 'Fundamento'], [
    ['Fases visuales idénticas en los cuatro juegos: OBSERVA (ojo, ámbar) → TU TURNO (mano, verde) → RESULTADO', 'Separa codificación y recuperación (Atkinson y Shiffrin, 1968). Una señal de estado constante reduce la carga cognitiva extrínseca (Sweller, 1988).'],
    ['Cámara ortográfica fija en Pares, Secuencia y N-Back, sin movimiento ambiental ni partículas durante la codificación', 'Todos los estímulos se ven del mismo tamaño; con perspectiva, los bloques lejanos se verían más pequeños y la medida quedaría sesgada. Principio de coherencia (Mayer, 2009).'],
    ['Tiempos sin cambios: vista previa de Pares de 1500 + 150·parejas ms, encendido de Corsi, ISI de 2500 ms y ON de 1500 ms en N-Back', 'Si cambia la exposición efectiva, deja de ser válida la comparación con la línea base y con las normas. Un estímulo se enciende en como máximo un cuadro de render, sin fundidos lentos.'],
    ['Secuencia en un tablero de Corsi con nueve bloques en posiciones irregulares, no en una cuadrícula 3×3', 'Es fiel al paradigma de Corsi (1972). Reduce la recodificación verbal (“la esquina de arriba”) y favorece una medida de amplitud visoespacial más pura (Berch, Krikorian y Huha, 1998). La disposición se inspira en la original y no reproduce las coordenadas de Kessels et al. (2000), que quedan pendientes de verificación.'],
    ['N-Back en una rejilla 3×3 de baldosas', 'Igual que el N-Back espacial de Jaeggi et al. (2008).'],
    ['Pares: cada carta lleva símbolo y color', 'Codificación dual (Paivio, 1971) y redundancia para personas con daltonismo.'],
    ['Palacio de la memoria: recorrido fijo por una habitación tridimensional, un objeto por lugar y recuperación en el mismo orden', 'Método de loci (Yates, 1966; Bower, 1970). Un palacio virtual rinde de forma equivalente a uno convencional (Legge et al., 2012). El entrenamiento con esta técnica se asocia con reorganización de redes cerebrales de memoria (Dresler et al., 2017). El contexto espacial actúa como clave de recuperación (Tulving y Thomson, 1973).'],
    ['En el Palacio, los distractores son objetos de otros lugares del mismo ensayo', 'Reconocer el objeto no basta: se mide la asociación objeto–lugar.'],
    ['Estaciones del gimnasio en posiciones fijas que nunca cambian, con un “camino del día” iluminado', 'Reconocer antes que recordar, y consistencia de la navegación (Nielsen, 1994). Una señal diaria ayuda a formar el hábito (Lally et al., 2010).'],
    ['Dificultad adaptativa y retroalimentación inmediata; los errores no se castigan', 'Flujo (Csikszentmihalyi, 1990); autonomía y competencia (Deci y Ryan, 2000).'],
    ['Torre de constancia física, con la marca de la meta de 30 días', 'Efecto de gradiente de meta: el esfuerzo aumenta al ver cerca el objetivo (Kivetz, Urminsky y Zheng, 2006). Además apoya la formación del hábito (Lally et al., 2010).'],
    ['Objetos que caen en el resultado y representan la métrica (la amplitud se muestra como bloques apilados)', 'Ley del efecto: la consecuencia positiva inmediata refuerza la conducta (Thorndike, 1911). Ver la amplitud en objetos ayuda a entender el puntaje. Como ocurre solo después de la tarea, no añade carga durante la codificación ni la recuperación (Sweller, 1988).'],
    ['Aviso de que la meta es un objetivo de práctica y no una predicción', 'Honestidad: el entrenamiento de memoria de trabajo transfiere poco a otras habilidades (Melby-Lervåg y Hulme, 2013).']
  ], [3400, 5960]),
  spacer(),
  H3('8.9.4 Uso de Matter.js'),
  P('Matter.js (versión 0.20) es un motor de física 2D. En la versión 3.0 se usa solo con fines decorativos y de retroalimentación: nunca forma parte del estado del juego, de los datos guardados ni de la medida. Simula cuerpos en un plano vertical; un puente copia sus posiciones a mallas de Three.js (piel Pixel-3D) o a transformaciones de elementos DOM (piel clásica).'),
  table(['Lugar', 'Qué hace la física', 'Para qué'], [
    ['Torre de constancia (vitrina del gimnasio)', 'Cada sesión diaria completada es un bloque con su fecha. Al volver al gimnasio tras terminar la sesión, el bloque nuevo cae y se apila. Una marca indica la meta de 30 días.', 'Hace tangible el esfuerzo acumulado y la cercanía a la meta del plan.'],
    ['Tarjeta de resultado de cada juego', 'Caen objetos que representan la métrica: estrellas (Pares, de 1 a 3), un bloque por elemento de amplitud lograda (Secuencia), N fichas (N-Back) y los objetos acertados, que caen a un cofre (Palacio).', 'Convierte el puntaje abstracto en algo concreto y ofrece retroalimentación positiva inmediata.'],
    ['Resultados de la prueba de nivel', 'Las columnas de cada área se construyen con bloques que caen y se apilan (1 bloque = 10 puntos). El número exacto sigue en el DOM.', 'Comparar áreas de un vistazo.'],
    ['Logros', 'El trofeo nuevo cae dentro de la vitrina del gimnasio.', 'Refuerzo visible del logro.']
  ], [2500, 4360, 2500]),
  spacer(),
  P('Reglas técnicas: el paso de simulación es fijo (1000/60 ms) para que el resultado sea reproducible; el motor se detiene cuando todos los cuerpos duermen, de modo que el dibujo es bajo demanda; la simulación se pausa al ocultar la vista o la pestaña; las posiciones iniciales dependen de una semilla derivada de la fecha o del resultado, de modo que la torre se ve igual en cada recarga; y con “prefers-reduced-motion” se dibuja directamente el estado de reposo, sin caída. Hay como máximo unos 60 cuerpos activos a la vez.'),
  H3('8.9.5 Palacio de la memoria (cuarto ejercicio)'),
  P('El Palacio de la memoria se fundamenta en el método de loci y evalúa la memoria asociativa: no basta con reconocer un objeto, hay que ligarlo al lugar donde estaba. Es el cuarto juego del programa y es gratuito.'),
  bullet([B('Escenario: '), R('una habitación vóxel con 12 lugares fijos en una ruta: perchero, espejo, sofá, lámpara, ventana, estantería, mesa, chimenea, piano, cama, reloj y alfombra.')]),
  bullet([B('Fase OBSERVA: '), R('la cámara recorre L lugares. En cada uno aparece un objeto con un rótulo (por ejemplo, “Una llave en el perchero”): 600 ms de desplazamiento y 2400 ms de exposición por lugar.')]),
  bullet([B('Fase TU TURNO: '), R('la cámara repite la ruta y, en cada lugar, el jugador elige entre cuatro opciones. La correcta se acompaña de tres objetos tomados de otros lugares del mismo ensayo, de modo que los distractores también son objetos vistos, pero asociados a otro lugar.')]),
  bullet([B('Niveles: '), R('L ∈ {4, 5, 6, 7, 8, 10, 12}. Se empieza en 4 lugares (en 6 con dificultad Avanzado). Con precisión de al menos 85 % se sube un nivel y con menos de 60 % se baja, la misma regla que el N-Back.')]),
  bullet([B('Puntaje: '), R('min(100, round(acc · w(L))), con w(L) = 0,7 / 0,8 / 0,9 / 0,95 / 1 / 1,05 / 1,1 para L = 4 / 5 / 6 / 7 / 8 / 10 / 12. Así un ensayo con más lugares pesa más, igual que la ponderación por N del N-Back.')]),
  bullet([B('Logro: '), R('“Palacio de 8” se obtiene con al menos 8 lugares y precisión de al menos 85 %.')]),
  P('La lógica (generación del ensayo, distractores, puntuación y niveles) está en un módulo puro, sin DOM, y se verifica con pruebas unitarias. Durante la fase de tarea no hay física activa, como en el resto de ejercicios.'),
  H3('8.9.6 Gimnasio 3D navegable'),
  P('El gimnasio es la pantalla principal y sustituye al menú lateral. Es un diorama isométrico con cámara ortográfica y cinco estaciones fijas: Pares (mesa de cartas), Secuencia (tablero de Corsi), N-Back (pista de luces), Palacio (casa del palacio) y Vitrina de progreso, que incluye la torre de constancia. Un camino del día une en orden las estaciones de la sesión diaria, y las completadas se iluminan.'),
  P('Al tocar una estación, la cámara se desliza hacia ella y aparece un panel con los botones Jugar, ¿Cómo se juega? y el mejor resultado. El botón “Ver como lista” está siempre disponible y abre la vista de juegos en formato lineal, accesible con teclado y lector de pantalla. Las estaciones tienen posición fija y rótulo permanente, para que puedan reconocerse con facilidad. El HUD muestra el saludo, la racha, el Índice de Memoria global, el botón principal de la sesión de hoy y un cajón Diario con el calendario y las barras por área.'),
  H3('8.9.7 Medidas de validez'),
  P('Un rediseño visual puede alterar lo que se mide si cambia la duración, el tamaño o la posición de los estímulos. Para evitarlo, la versión 3.0 fija las siguientes condiciones:'),
  bullet([B('Cámara ortográfica fija '), R('en los tableros de Pares, Secuencia y N-Back: todos los estímulos tienen el mismo tamaño en pantalla, sin efecto de perspectiva.')]),
  bullet([B('Tiempos sin cambios: '), R('vista previa de Pares de 1500 + 150·parejas ms; encendido de Corsi de max(380, 700 − 35·longitud) ms; ISI de 2500 ms y ON de 1500 ms en N-Back. Una prueba de punta a punta mide con performance.now() que la duración de los estímulos con la piel 3D no se desvía más de 20 ms respecto de la clásica.')]),
  bullet([B('Pares: '), R('al terminar la vista previa, todas las cartas se tapan a la vez, de modo que ninguna queda visible más tiempo que las demás.')]),
  bullet([B('Secuencia: '), R('el bloque encendido se muestra en dorado, de alto contraste, y el encendido es instantáneo, sin fundidos lentos.')]),
  bullet([B('Física fuera de la tarea: '), R('ningún cuerpo de Matter.js está activo durante OBSERVA ni TU TURNO. Una prueba de punta a punta lo comprueba con un contador de depuración que solo existe en las pruebas.')]),
  bullet([B('Coordenadas de Corsi: '), R('la disposición de los nueve bloques es la misma en ambas pieles. Se documenta como una disposición irregular inspirada en la original, pendiente de contrastarse con Kessels et al. (2000).')]),
  P('Estas condiciones hacen que el rediseño cambie la presentación, pero no la medida. Las mismas comprobaciones se ejecutan en las dos pieles visuales.'));

// 10 Calidad total
children.push(pb(), H1('9. Principios de calidad total: W. Edwards Deming'),
  P('Se eligió a W. Edwards Deming porque su propuesta se centra en el proceso y en la mejora continua, lo que encaja con un desarrollo de software iterativo. Deming (1986) sostiene que la calidad se construye en el proceso y no se inspecciona al final, que la variación debe entenderse con datos y que la mejora es una espiral sin fin. Dos instrumentos suyos guiaron el proyecto: el ciclo PDCA (Planificar, Hacer, Verificar, Actuar) y los 14 puntos para la gestión.'),
  H2('9.1 El ciclo PDCA en el desarrollo'),
  table(['Iteración', 'Planificar', 'Hacer', 'Verificar', 'Actuar'], [
    ['1. Planificación', 'Lluvia de ideas (8 mecánicas), criterios: base teórica, esfuerzo, demostrabilidad', 'Matriz de decisión; elección de Web + JavaScript', 'Revisión contra los entregables del curso (URL, editables, video)', 'Idea elegida: tres minijuegos con una interfaz común'],
    ['2. Prototipo (Avance 1)', 'Un solo archivo HTML con los tres juegos y progreso', 'Desarrollo del prototipo; publicación como artefacto', 'Revisión visual en escritorio y móvil', 'Reestructurar en módulos; añadir rutina, logros y ajustes'],
    ['3. Versión 1.0', 'Arquitectura modular, fase de memorización, modo inverso, N adaptativo, rutina diaria', 'Implementación en 15 módulos; empaquetador', 'Prueba automatizada de 30 comprobaciones; se detectó y corrigió un defecto del empaquetador ($$ interpretado como patrón)', 'Despliegue en Vercel; hashes verificados; capturas y video'],
    ['4. Versión 1.1', 'Rediseño con principios de interfaces fluidas; respuesta en pointer-down; accesibilidad', 'Nueva hoja de estilos, resortes, materiales, háptica', 'Las 30 comprobaciones siguen pasando; revisión en tema claro, oscuro y móvil', 'Regeneración de capturas y video; informe'],
    ['5. Versión 2.0', 'Reestructurar como programa de entrenamiento tomando como precedente las plataformas del estado del arte: configuración, prueba de nivel, índice, plan y sesión diaria', 'Nuevos módulos config, sesion, hoy e indice; menú lateral; 7 pantallas nuevas', 'Prueba ampliada a 39 comprobaciones; revisión en escritorio, móvil y tema oscuro', 'Capturas y video del nuevo flujo; informe final actualizado'],
    ['6. Versión 3.0 (Pixel-3D)', 'Plan de rediseño: estética pixel tridimensional, gimnasio navegable, física decorativa y cuarto ejercicio (Palacio de la memoria), con la justificación psicológica de cada decisión', 'Piel 3D sobre la lógica existente (el DOM es la verdad); lógica del Palacio en un módulo puro; empaquetado con esbuild junto con Three.js y Matter.js', 'Pruebas unitarias (node --test) y de punta a punta en las dos pieles visuales; control de tiempos de los estímulos y de la física fuera de las tareas', 'Capturas, video e informe a regenerar con la nueva versión']
  ], [1500, 2200, 2000, 2000, 1660]),
  spacer(),
  P('Dentro del juego, cada ronda también es un ciclo PDCA: la regla de adaptación planifica el nivel, el jugador lo ejecuta, la métrica lo verifica y la recomendación actúa sobre la siguiente sesión. Así el principio de mejora continua no solo gobernó el desarrollo sino que está codificado en la mecánica.'),
  H2('9.2 Los 14 puntos de Deming aplicados'),
  table(['Punto de Deming', 'Aplicación en el proyecto'], [
    ['1. Constancia en el propósito de mejorar', 'Un objetivo estable en todas las iteraciones: ejercitar la memoria con ejercicios fundamentados; cada versión mejora sobre la anterior sin cambiar el propósito.'],
    ['3. Dejar de depender de la inspección masiva; construir la calidad desde el principio', 'La prueba automatizada se escribió junto con el código y se ejecuta en cada cambio; los módulos exponen una interfaz común que evita errores de integración.'],
    ['5. Mejorar constantemente el sistema de producción y servicio', 'Seis iteraciones PDCA documentadas; el empaquetador, las capturas, el video y este informe se generan con scripts repetibles, no a mano.'],
    ['6. Instituir la capacitación', 'La ayuda de cada minijuego enseña al usuario qué ejercita y por qué; el código está comentado para que cualquier integrante pueda continuarlo.'],
    ['9. Derribar las barreras entre departamentos', 'Diseño, código y pruebas se trabajaron juntos: la hoja de estilos documenta los principios de diseño y la prueba verifica el comportamiento que el diseño promete.'],
    ['10. Eliminar lemas y exhortaciones; 11. Eliminar cuotas numéricas', 'No se fijaron metas de "líneas de código" ni fechas por encima de la calidad; el criterio de terminado de cada versión fue que todas las pruebas pasaran (30, 39 y, en la 3.0, 33 unitarias más la prueba de punta a punta en dos pieles) y que lo publicado coincidiera con lo probado.'],
    ['12. Eliminar barreras al orgullo por el trabajo bien hecho', 'Entregables verificables: URL pública, hashes comparados, video de una partida real.'],
    ['14. Poner a todos a trabajar en la transformación', 'El modelo de negocio y el plan de pendientes (sección 10) involucran a todo el equipo en la siguiente iteración: pruebas con usuarios y análisis de datos de uso.']
  ], [3200, 6160]),
  spacer(),
  P('Deming también advierte contra las "enfermedades mortales" de la gestión, entre ellas la falta de constancia y el énfasis en resultados a corto plazo. El proyecto evitó la primera con un plan de iteraciones y la segunda con métricas de proceso (pruebas, hashes) en lugar de solo métricas de resultado.'));

// 11 Conclusiones
children.push(H1('10. Conclusiones'),
  num2('Se diseñó y desarrolló una aplicación web funcional que ejercita cuatro componentes de la memoria con mecánicas tomadas de tareas experimentales reconocidas (parejas con codificación previa, bloques de Corsi, N-Back y el método de loci), cada una vinculada a un modelo teórico: Atkinson y Shiffrin, Miller, Baddeley y Hitch, y Yates y Bower.'),
  num2('Estructurar la aplicación como un programa (configuración, prueba de nivel, índice de memoria, plan y sesión diaria), siguiendo el precedente de las plataformas comerciales en una versión simplificada, convierte cuatro minijuegos sueltos en un entrenamiento con línea base, meta y seguimiento, que es lo que da sentido a la medición del progreso.'),
  num2('La elección de JavaScript sobre Unity permitió llegar a un prototipo demostrable en horas, publicar un sitio de unos 200 KB comprimidos, con librerías 3D, sin instalación y entregar archivos editables en texto plano; para un juego 2D de cartas y cuadrículas fue la decisión correcta.'),
  num2('La dificultad adaptativa (niveles, longitud y N) mantiene al jugador cerca de su límite, condición que la literatura identifica como necesaria para que el entrenamiento tenga efecto en las tareas practicadas.'),
  num2('Aplicar el ciclo PDCA de Deming estructuró el trabajo en seis iteraciones verificables; la prueba automatizada detectó un defecto real antes de publicar y la comparación de hashes garantizó que lo publicado fuera lo probado. La calidad se construyó en el proceso, no se inspeccionó al final.'),
  num2('El rediseño de la interfaz con principios de interfaces fluidas mejoró la respuesta percibida (realimentación en pointer-down), la coherencia espacial y la accesibilidad, con Three.js y Matter.js como únicas librerías, empaquetadas en un solo archivo.'),
  num2('El modelo freemium con un plan Pro en soles y licencias institucionales es coherente con el nicho identificado en el estado del arte: una herramienta gratuita, en español y respetuosa de la privacidad.'),
  num2('Como trabajo futuro quedan la validación con usuarios reales (pre y post test de amplitud), la sincronización en la nube para el plan Pro y los ejercicios adicionales (¿Qué cambió?). El Palacio de la memoria ya está implementado en la versión 3.0. Queda pendiente verificar las coordenadas del tablero de Corsi frente a la figura de Kessels et al. (2000): la disposición actual es irregular e inspirada en la original, no reproduce las coordenadas de esa fuente. Las afirmaciones sobre beneficios se mantienen dentro de lo que la evidencia respalda: mejora en las tareas entrenadas.'));

// 11 Bibliografía
const refs = [
  'Apple Inc. (2018). Designing fluid interfaces [Sesión 803, WWDC 2018]. Apple Developer. https://developer.apple.com/videos/play/wwdc2018/803/',
  'Atkinson, R. C., & Shiffrin, R. M. (1968). Human memory: A proposed system and its control processes. En K. W. Spence & J. T. Spence (Eds.), The psychology of learning and motivation (Vol. 2, pp. 89–195). Academic Press. https://doi.org/10.1016/S0079-7421(08)60422-3',
  'Baddeley, A. D., & Hitch, G. (1974). Working memory. En G. H. Bower (Ed.), The psychology of learning and motivation (Vol. 8, pp. 47–89). Academic Press. https://doi.org/10.1016/S0079-7421(08)60452-1',
  'Berch, D. B., Krikorian, R., & Huha, E. M. (1998). The Corsi block-tapping task: Methodological and theoretical considerations. Brain and Cognition, 38(3).',
  'Bower, G. H. (1970). Analysis of a mnemonic device. American Scientist, 58(5).',
  'Corsi, P. M. (1972). Human memory and the medial temporal region of the brain [Tesis doctoral, McGill University].',
  'Csikszentmihalyi, M. (1990). Flow: The psychology of optimal experience. Harper & Row.',
  'Deci, E. L., & Ryan, R. M. (2000). The "what" and "why" of goal pursuits: Human needs and the self-determination of behavior. Psychological Inquiry, 11(4), 227–268.',
  'Deming, W. E. (1986). Out of the crisis. MIT Center for Advanced Engineering Study.',
  'Deming, W. E. (1993). The new economics for industry, government, education. MIT Center for Advanced Engineering Study.',
  'Dresler, M., Shirer, W. R., Konrad, B. N., Müller, N. C. J., Wagner, I. C., Fernández, G., Czisch, M., & Greicius, M. D. (2017). Mnemonic training reshapes brain networks to support superior memory. Neuron, 93(5).',
  'Federal Trade Commission. (2016, 5 de enero). Lumosity to pay $2 million to settle FTC deceptive advertising charges for its "brain training" program [Comunicado de prensa]. https://www.ftc.gov/news-events/news/press-releases/2016/01/lumosity-pay-2-million-settle-ftc-deceptive-advertising-charges-its-brain-training-program',
  'Hardy, J. L., Nelson, R. A., Thomason, M. E., Sternberg, D. A., Katovich, K., Farzin, F., & Scanlon, M. (2015). Enhancing cognitive abilities with comprehensive training: A large, online, randomized, active-controlled trial. PLOS ONE, 10(9), e0134467. https://doi.org/10.1371/journal.pone.0134467',
  'Jaeggi, S. M., Buschkuehl, M., Jonides, J., & Perrig, W. J. (2008). Improving fluid intelligence with training on working memory. Proceedings of the National Academy of Sciences, 105(19), 6829–6833. https://doi.org/10.1073/pnas.0801268105',
  'Kirchner, W. K. (1958). Age differences in short-term retention of rapidly changing information. Journal of Experimental Psychology, 55(4), 352–358. https://doi.org/10.1037/h0043688',
  'Kivetz, R., Urminsky, O., & Zheng, Y. (2006). The goal-gradient hypothesis resurrected: Purchase acceleration, illusionary goal progress, and customer retention. Journal of Marketing Research, 43(1).',
  'Lally, P., van Jaarsveld, C. H. M., Potts, H. W. W., & Wardle, J. (2010). How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology, 40(6).',
  'Legge, E. L. L., Madan, C. R., Ng, E. T., & Caplan, J. B. (2012). Building a memory palace in minutes: Equivalent memory performance using virtual versus conventional environments with the method of loci. Acta Psychologica, 141(3).',
  'Mayer, R. E. (2009). Multimedia learning (2nd ed.). Cambridge University Press.',
  'Melby-Lervåg, M., & Hulme, C. (2013). Is working memory training effective? A meta-analytic review. Developmental Psychology, 49(2).',
  'Miller, G. A. (1956). The magical number seven, plus or minus two: Some limits on our capacity for processing information. Psychological Review, 63(2), 81–97. https://doi.org/10.1037/h0043158',
  'Nielsen, J. (1994). Enhancing the explanatory power of usability heuristics. En Actas de la conferencia SIGCHI sobre factores humanos en sistemas informáticos (CHI \'94).',
  'Osterwalder, A., & Pigneur, Y. (2010). Business model generation: A handbook for visionaries, game changers, and challengers. Wiley.',
  'Paivio, A. (1971). Imagery and verbal processes. Holt, Rinehart & Winston.',
  'Shatil, E. (2013). Does combined cognitive training and physical activity training enhance cognitive abilities more than either alone? A four-condition randomized controlled trial among healthy older adults. Frontiers in Aging Neuroscience, 5, 8. https://doi.org/10.3389/fnagi.2013.00008',
  'Simons, D. J., Boot, W. R., Charness, N., Gathercole, S. E., Chabris, C. F., Hambrick, D. Z., & Stine-Morrow, E. A. L. (2016). Do "brain-training" programs work? Psychological Science in the Public Interest, 17(3), 103–186. https://doi.org/10.1177/1529100616661983',
  'Strobach, T., & Huestegge, L. (2017). Evaluating the effectiveness of commercial brain game training with working-memory tasks. Journal of Cognitive Enhancement, 1(4), 539–558. https://doi.org/10.1007/s41465-017-0053-0',
  'Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. Cognitive Science, 12(2), 257–285.',
  'Thorndike, E. L. (1911). Animal intelligence: Experimental studies. Macmillan.',
  'Tulving, E., & Thomson, D. M. (1973). Encoding specificity and retrieval processes in episodic memory. Psychological Review, 80(5).',
  'Yates, F. A. (1966). The art of memory. Routledge & Kegan Paul.'
];
children.push(H1('11. Bibliografía (norma APA, 7.ª edición)'),
  ...refs.map(r => new Paragraph({ spacing: { after: 120, line: 276 }, indent: { left: 720, hanging: 720 }, children: [R(r)] })));

// Anexos
children.push(pb(), H1('Anexo A. Enlaces y entregables'),
  bullet([B('Juego en línea: '), link(URL_JUEGO, URL_JUEGO)]),
  bullet([B('Archivos editables: '), R('carpeta gimnasio-memoria (repositorio Git) con index.html, css/, js/, tools/ y docs/.')]),
  bullet([B('Capturas: '), R('docs/capturas/ (31 imágenes PNG: flujo de entrada, prueba de nivel con los cuatro juegos, gimnasio 3D, móvil, tema oscuro y Palacio).')]),
  bullet([B('Video demostrativo: '), R('docs/video/demo.mp4 (configuración, prueba de nivel completa, resultados, plan, panel Hoy y progreso).')]),
  bullet([B('Pruebas automatizadas: '), R('tools/test.mjs (punta a punta, en las dos pieles visuales; npm test) y tools/unit/ (unitarias con node --test; npm run test:unit).')]),
  H1('Anexo B. Cómo ejecutar y desplegar'),
  ...code(['npm install          # instala Three.js, Matter.js, esbuild y Playwright', 'npm start            # servidor de desarrollo con esbuild en http://localhost:5173', 'npm run build        # genera dist/index.html (un solo archivo) e informa del tamaño', 'npm test             # prueba de punta a punta en las dos pieles (Pixel-3D y clásica)', 'npm run test:unit    # pruebas unitarias con node --test', 'npm run capturas     # regenera docs/capturas', 'npm run video        # regenera docs/video/demo.webm', 'npm run informe      # regenera este informe']),
  spacer(),
  P('Despliegue en Vercel: importar el repositorio de GitHub en vercel.com. El archivo vercel.json define el comando de compilación (npm run build) y el directorio de salida (dist/). Cada push a la rama principal publica una nueva versión.'));

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
      { reference: 'nums3', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
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
