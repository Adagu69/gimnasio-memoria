// store.js — persistencia en localStorage.
// Estructura: { profile:{name,createdAt}, settings:{sound,volume,theme,nbackN}, sessions:[...], routines:[...] }

const KEY = 'gimnasio-memoria.v2';

const DEFAULTS = () => ({
  profile: { name: '', createdAt: Date.now(), onboarded: false, goal: '', areas: ['pares', 'secuencia', 'nback'], ageRange: '', difficulty: 'estandar', calibration: null },
  settings: { sound: true, volume: 60, theme: 'system', nbackN: 2, paresLevel: 1 },
  sessions: [],
  routines: []
});

let cache = null;
const listeners = new Set();

function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULTS(), ...JSON.parse(raw) } : DEFAULTS();
    cache.settings = { ...DEFAULTS().settings, ...cache.settings };
    cache.profile = { ...DEFAULTS().profile, ...cache.profile };
  } catch (e) {
    cache = DEFAULTS();
  }
  return cache;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* sin almacenamiento: seguimos en memoria */ }
  listeners.forEach(fn => fn(cache));
}

export const store = {
  get data() { return load(); },
  get sessions() { return load().sessions; },
  get settings() { return load().settings; },
  get profile() { return load().profile; },
  get routines() { return load().routines; },

  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  setName(name) { load().profile.name = String(name || '').trim().slice(0, 24); save(); },
  setProfile(patch) { Object.assign(load().profile, patch); save(); },
  setSetting(k, v) { load().settings[k] = v; save(); },

  /** Guarda una sesión de juego. s.game ∈ pares|secuencia|nback */
  addSession(s) {
    const d = load();
    s.t = Date.now();
    d.sessions.push(s);
    if (d.sessions.length > 500) d.sessions = d.sessions.slice(-500);
    save();
    return s;
  },

  byGame(g) { return load().sessions.filter(s => s.game === g); },

  /** Guarda el resultado de una sesión diaria (puntaje 0-100); una por día. */
  addRoutine(r) {
    const d = load();
    r.t = Date.now();
    r.day = dayKey(r.t);
    d.routines.push(r);
    save();
    return r;
  },

  trainedToday() { return load().routines.some(r => r.day === dayKey(Date.now())); },

  /** Racha: días consecutivos (hasta hoy o ayer) con al menos una sesión diaria. */
  streak() {
    const days = new Set(load().routines.map(r => r.day));
    if (!days.size) return 0;
    let n = 0;
    let cur = new Date();
    // si hoy no hay rutina, la racha puede seguir viva desde ayer
    if (!days.has(dayKey(cur))) cur.setDate(cur.getDate() - 1);
    while (days.has(dayKey(cur))) { n++; cur.setDate(cur.getDate() - 1); }
    return n;
  },

  welcomed() { try { return !!localStorage.getItem(KEY + '.welcomed'); } catch (e) { return true; } },
  markWelcomed() { try { localStorage.setItem(KEY + '.welcomed', '1'); } catch (e) {} },

  clear() {
    cache = DEFAULTS();
    try { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '.welcomed'); } catch (e) {}
    save();
  }
};

export function dayKey(t) {
  const d = new Date(t);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
