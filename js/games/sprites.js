// sprites.js — objetos del Palacio de la memoria en pixel art de 12×12.
// El mismo dibujo se usa en 3D (extruido en vóxeles) y en el DOM (canvas pixelado en las opciones).
// Objetos fáciles de nombrar y visualmente distintos: favorecen la codificación dual imagen + palabra (Paivio, 1971).

export const SPRITE_COLORS = Object.freeze({
  k: '#2b2140', w: '#ffffff', l: '#c9cfdc', m: '#8890a8',
  r: '#e2503c', R: '#a8322a', P: '#f08aa8', o: '#e8862a', y: '#f2c037',
  g: '#3fae5a', G: '#23804a', c: '#4fc7d9', b: '#3b6fe0', B: '#23439a',
  p: '#9a55e0', n: '#8a5a33', N: '#5e3b20'
});

export const SPRITES = Object.freeze({
  manzana: [
    '.....nG.....', '.....nGG....', '...rr.n.rr..', '..rrrrrrrrr.', '.rrwrrrrrrrr', '.rwrrrrrrrrr',
    '.rrrrrrrrrrr', '.rrrrrrrrrrr', '.RrrrrrrrrrR', '..RrrrrrrrR.', '...RRrrRRR..', '....RR.RR...'],
  llave: [
    '............', '............', '............', '.yyyy.......', 'yy..yy......', 'yy..yyyyyyyy',
    'yy..yy..y.y.', '.yyyy...y.y.', '............', '............', '............', '............'],
  pez: [
    '............', '............', '......bb....', '....bbbbb..b', '...bbbbbbbbb', '..bwkbbbbbbb',
    '..bbbbbbbbbb', '...bbbbbbbbb', '....bbbbb..b', '......bb....', '............', '............'],
  paraguas: [
    '.....pp.....', '...pppppp...', '..pppppppp..', '.pppppppppp.', 'pppppppppppp', 'p.p..k..p.p.',
    '.....k......', '.....k......', '.....k......', '.....k..k...', '......kk....', '............'],
  reloj: [
    '...kkkkkk...', '..kwwwwwwk..', '.kwwwkwwwwk.', 'kwwwwkwwwwwk', 'kwwwwkwwwwwk', 'kwwwwkkkkwwk',
    'kwwwwwwwwwwk', 'kwwwwwwwwwwk', '.kwwwwwwwwk.', '..kwwwwwwk..', '...kkkkkk...', '............'],
  corona: [
    '............', '............', 'y....y....y.', 'yy..yyy..yy.', 'yyy.yyy.yyy.', 'yyyyyyyyyyy.',
    'yyryyybyyry.', 'yyyyyyyyyyy.', 'ooooooooooo.', '............', '............', '............'],
  taza: [
    '............', '...l..l.....', '....l..l....', '............', '.wwwwwwww...', '.wbbbbbbwww.',
    '.wwwwwwwww.w', '.wwwwwwwww.w', '.wwwwwwwwww.', '..wwwwwww...', '.llllllllll.', '............'],
  campana: [
    '.....yy.....', '....yyyy....', '...yyyyyy...', '...yyyyyy...', '..yyyyyyyy..', '..yyyyyyyy..',
    '..yyyyyyyy..', '.yyyyyyyyyy.', 'oooooooooooo', '.....kk.....', '............', '............'],
  barco: [
    '.....w......', '.....ww.....', '.....www....', '.....wwww...', '.....wwwww..', '.....n......',
    'nnnnnnnnnnnn', '.nnnnnnnnnn.', '..NNNNNNNN..', 'bbbbbbbbbbbb', '.b.b.b.b.b.b', '............'],
  cohete: [
    '.....rr.....', '....rwwr....', '....wwww....', '....wbbw....', '....wbbw....', '....wwww....',
    '...rwwwwr...', '..rrwwwwrr..', '..rr.oo.rr..', '.....yy.....', '.....o......', '............'],
  sombrero: [
    '............', '............', '....BBBB....', '...BBBBBB...', '...BBBBBB...', '...BBBBBB...',
    '...rrrrrr...', '...BBBBBB...', 'BBBBBBBBBBBB', '.BBBBBBBBBB.', '............', '............'],
  libro: [
    '............', '.bbbbbbbbb..', '.bwwwwwwwbb.', '.bwkkkkkwbb.', '.bwwwwwwwbb.', '.bwkkkkwwbb.',
    '.bwwwwwwwbb.', '.bwkkkkkwbb.', '.bwwwwwwwbb.', '.bbbbbbbbbb.', '..lllllllll.', '............'],
  flor: [
    '....PP......', '...PPPP.....', '.PP.PP.PP...', 'PPPPyyPPPP..', '.PPPyyPPP...', '..PP.PP.....',
    '....g.......', '....g..gg...', '....g.gg....', '...gg.......', '....g.......', '............'],
  vela: [
    '.....o......', '....oyo.....', '....oyo.....', '.....y......', '.....k......', '....wwww....',
    '....wwww....', '....wwww....', '....wwww....', '....wwww....', '..llllllll..', '............'],
  ancla: [
    '.....mm.....', '....m..m....', '.....mm.....', '.....mm.....', '..mmmmmmmm..', '.....mm.....',
    '.....mm.....', 'm....mm....m', 'mm...mm...mm', '.mm..mm..mm.', '..mmmmmmmm..', '............'],
  pelota: [
    '............', '....bbbb....', '..bbwwwwbb..', '.bwwwwwwwwb.', '.bwwbbbbwwb.', 'bbbbbbbbbbbb',
    'bbbbbbbbbbbb', '.bwwbbbbwwb.', '.bwwwwwwwwb.', '..bbwwwwbb..', '....bbbb....', '............'],
  bombilla: [
    '....yyyy....', '...yyyyyy...', '..yywyyyyy..', '..ywyyyyyy..', '..yyyyyyyy..', '...yyyyyy...',
    '....yyyy....', '....llll....', '....mmmm....', '....llll....', '.....mm.....', '............'],
  corazon: [
    '............', '.rrr...rrr..', 'rrrrr.rrrrr.', 'rwrrrrrrrrr.', 'rwrrrrrrrrr.', 'rrrrrrrrrrr.',
    '.rrrrrrrrr..', '..rrrrrrr...', '...rrrrr....', '....rrr.....', '.....r......', '............'],
  hongo: [
    '....rrrr....', '..rrwrrrrr..', '.rrwwrrrwrr.', '.rrrrrrwwwr.', 'rrwrrrrrwrrr', 'rwwwrrrrrrrr',
    'rrrrrrrrrrrr', '...wwwwww...', '...wwwwww...', '...wwwwww...', '....wwww....', '............'],
  arbol: [
    '.....gg.....', '....gggg....', '...gggggg...', '..ggGgggggg.', '..gggggGgg..', '.gggGggggggg',
    '.gggggggGgg.', '..gggggggg..', '.....nn.....', '.....nn.....', '....nnnn....', '............']
});

/** Dibuja el objeto en un <canvas> (12×12 texels; el CSS lo escala con image-rendering: pixelated). */
export function drawSprite(canvas, id) {
  const rows = SPRITES[id];
  if (!rows) return;
  canvas.width = rows[0].length; canvas.height = rows.length;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.') return;
    ctx.fillStyle = SPRITE_COLORS[ch];
    ctx.fillRect(x, y, 1, 1);
  }));
}
