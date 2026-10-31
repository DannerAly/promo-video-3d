// Graba la página cuadro por cuadro con Chrome sin ventana (llama a window.seek(t) y saca una captura).
// Uso:
//   node rec.mjs <video.html> <carpeta> all [submuestras=4]   → 30 fps × submuestras JPG para render.sh (motion blur)
//   node rec.mjs <video.html> <carpeta> "2.5,9,20"            → capturas sueltas para revisar (t2.5.jpg …)
// Variables: VW, VH (tamaño, 1920×1080 por defecto), DUR (segundos, 30), CHROME (ruta al navegador).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const [html, out, times, subArg] = process.argv.slice(2);
const VW = +(process.env.VW || 1920), VH = +(process.env.VH || 1080), DUR = +(process.env.DUR || 30), SUB = +(subArg || 4), FPS = 30, SHUTTER = 0.5;
const CHROME = process.env.CHROME || [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
if (!CHROME) { console.error('No encuentro Chrome: define CHROME=/ruta/al/navegador'); process.exit(1); }
mkdirSync(out, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
// Con GPU real el render va ~10× más rápido que con SwiftShader; si la GPU falla, CHROME_FLAGS="--use-angle=swiftshader".
const flags = (process.env.CHROME_FLAGS || '--enable-gpu --ignore-gpu-blocklist').split(' ');
const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', ...flags, `--window-size=${VW},${VH}`, `--remote-debugging-port=${port}`,
  `--user-data-dir=${tmpdir()}/promo-rec-${port}`, '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let k = 0; k < 80; k++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.find(t => t.type === 'page')) break; } catch {} await sleep(250); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') console.log('ERROR', m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: VW, height: VH, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pathToFileURL(resolve(html)).href + `?rec&w=${VW}&h=${VH}` });
let ready = false;
for (let k = 0; k < 160 && !ready; k++) { ready = (await send('Runtime.evaluate', { expression: '!!window.__ready' })).result.result.value; if (!ready) await sleep(250); }
if (!ready) { console.error('La página no terminó de cargar (¿sin internet para Three.js y las fuentes?)'); chrome.kill(); process.exit(1); }
await sleep(800);
const shot = async (t, name) => {
  await send('Runtime.evaluate', { expression: `seek(${t})` });
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 93 });
  writeFileSync(`${out}/${name}.jpg`, Buffer.from(r.result.data, 'base64'));
};
if (times === 'all') {
  // Motion blur: cada cuadro de salida promedia SUB submuestras dentro de medio cuadro (obturador de 180°).
  const N = FPS * DUR; let n = 0; const st = Date.now();
  for (let f = 0; f < N; f++) for (let s = 0; s < SUB; s++) {
    await shot((f + (s / SUB) * SHUTTER) / FPS, String(n++).padStart(5, '0'));
    if (n % 600 === 0) console.log(`${n}/${N * SUB} cuadros · ${((Date.now() - st) / 1000).toFixed(0)} s`);
  }
} else for (const t of times.split(',')) await shot(+t, 't' + t);
ws.close(); chrome.kill(); process.exit(0);
