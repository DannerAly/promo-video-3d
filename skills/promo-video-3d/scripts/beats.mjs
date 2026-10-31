// Mide el ritmo de una canción para sincronizar el video.
// Uso: node beats.mjs <audio o video> [segundos=30]
// Imprime: BPM, primer golpe (firstBeat), los inicios de compás y los grupos de «3 golpes» rápidos candidatos.
// Necesita ffmpeg en el PATH.
import { execFileSync } from 'node:child_process';

const [file, durArg] = process.argv.slice(2);
if (!file) { console.error('Uso: node beats.mjs <audio> [segundos]'); process.exit(1); }
const SR = 22050, HOP = 220, DUR = +(durArg || 30);
const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-t', String(DUR), '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
const s = new Int16Array(raw.buffer, raw.byteOffset, raw.length / 2);
const env = []; // energía por ventana de 10 ms
for (let i = 0; i + HOP < s.length; i += HOP) { let x = 0; for (let j = 0; j < HOP; j++) x += s[i + j] ** 2; env.push(Math.sqrt(x / HOP)); }
const flux = env.map((v, i) => Math.max(0, v - (env[i - 2] ?? 0)));
const dt = HOP / SR, T = i => +(i * dt).toFixed(2);

// golpes: máximos locales de la subida de energía
const peaks = [];
for (let i = 3; i < flux.length - 3; i++) {
  const lo = Math.max(0, i - 8), hi = i + 9;
  if (flux[i] > 0 && flux[i] >= Math.max(...flux.slice(lo, hi))) peaks.push({ i, t: i * dt, v: flux[i] });
}
const vmax = Math.max(...peaks.map(p => p.v)); peaks.forEach(p => p.n = p.v / vmax);
const strong = peaks.filter(p => p.n > .35);

// tempo: autocorrelación de la curva de golpes entre 70 y 180 BPM
let best = { bpm: 0, score: -1 };
for (let bpm = 70; bpm <= 180; bpm += .25) {
  const lag = 60 / bpm / dt; let sc = 0;
  for (let i = 0; i + lag < flux.length; i++) { const j = i + lag, a = Math.floor(j), f = j - a; sc += flux[i] * (flux[a] * (1 - f) + (flux[a + 1] ?? 0) * f); }
  if (sc > best.score) best = { bpm, score: sc };
}
const beat = 60 / best.bpm;
// fase: el desplazamiento que más energía junta sobre la grilla de pulsos
let phase = { off: 0, sc: -1 };
for (let off = 0; off < beat; off += dt) { let sc = 0; for (let t = off; t < DUR; t += beat) sc += flux[Math.round(t / dt)] ?? 0; if (sc > phase.sc) phase = { off, sc }; }
// compás: de los 4 pulsos posibles, el que tiene los golpes más fuertes
let bar = { k: 0, sc: -1 };
for (let k = 0; k < 4; k++) { let sc = 0; for (let t = phase.off + k * beat; t < DUR; t += beat * 4) sc += flux[Math.round(t / dt)] ?? 0; if (sc > bar.sc) bar = { k, sc }; }
const first = phase.off + bar.k * beat - Math.floor((phase.off + bar.k * beat) / (beat * 4)) * beat * 4;

// «3 golpes»: tres golpes fuertes seguidos, más juntos que un pulso, que suelen cerrar una frase musical
const triples = [];
for (let i = 0; i + 2 < strong.length; i++) {
  const [a, b, c] = strong.slice(i, i + 3);
  const toBar = ((first - c.t) % (beat * 4) + beat * 4) % (beat * 4); // cuánto falta para el próximo compás
  if (c.t - a.t < beat * .9 && b.t - a.t > .1 && c.t - b.t > .1 && Math.min(a.n, b.n, c.n) > .5 && toBar > .2 && toBar < .65) { triples.push([a, b, c]); i += 2; }
}
const frames = t => { const m = Math.floor(t / 60), sec = Math.floor(t % 60), f = Math.round((t % 1) * 30); return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(f).padStart(2, '0')}`; };
console.log(`BPM ${best.bpm.toFixed(1)} · pulso ${beat.toFixed(4)} s · compás ${(beat * 4).toFixed(3)} s`);
console.log(`firstBeat ${first.toFixed(3)}  (en CONFIG: bpm: ${best.bpm.toFixed(1)}, firstBeat: ${first.toFixed(2)})`);
console.log('inicios de compás:', Array.from({ length: Math.ceil(DUR / beat / 4) }, (_, k) => (first + k * beat * 4).toFixed(2)).filter(x => x < DUR).join('  '));
console.log('grupos de 3 golpes que cierran un compás (candidatos para CONFIG.hits; confírmalos de oído con el usuario):');
for (const tr of triples) console.log('  ', tr.map(p => `${p.t.toFixed(2)} s (${frames(p.t)})`).join('  ·  '), `fuerza ${tr.map(p => Math.round(p.n * 99)).join('/')}`);
console.log('golpes fuertes:', strong.map(p => T(p.i)).join(' '));
