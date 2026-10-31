// Captura pantallas de una web (el producto que se va a mostrar en la compu y el celular).
// Uso: node capture.mjs <carpeta> "nombre|url|ancho|alto|escala|movil(0/1)" ["…"]
//   compu:   "laptop|https://app.ejemplo.com/panel|1600|1000|1.2|0"   → 1920×1200
//   celular: "phone|https://app.ejemplo.com/vender|390|845|2|1"       → 780×1690
// Inicio de sesión opcional: LOGIN_URL, LOGIN_USER, LOGIN_PASS (llena el primer campo de texto y el de contraseña y envía).
// Variable CHROME para la ruta del navegador.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

const [out, ...shots] = process.argv.slice(2);
if (!out || !shots.length) { console.error('Uso: node capture.mjs <carpeta> "nombre|url|ancho|alto|escala|movil" …'); process.exit(1); }
mkdirSync(out, { recursive: true });
const CHROME = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn(CHROME, ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${tmpdir()}/promo-cap-${port}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets; for (let k = 0; k < 80; k++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.find(t => t.type === 'page')) break; } catch {} await sleep(250); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async e => (await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true })).result.result?.value;
const size = (w, h, s, mobile) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: s, mobile });
await send('Page.enable'); await send('Runtime.enable');
if (process.env.LOGIN_URL) {
  await size(1440, 900, 1, false);
  await send('Page.navigate', { url: process.env.LOGIN_URL }); await sleep(4000);
  const type = async (sel, txt) => { await ev(`document.querySelector(${JSON.stringify(sel)}).focus()`); await send('Input.insertText', { text: txt }); };
  await type('input:not([type=password]):not([type=checkbox]):not([type=hidden])', process.env.LOGIN_USER); await type('input[type=password]', process.env.LOGIN_PASS);
  await ev(`(document.querySelector('button[type=submit]')||[...document.querySelectorAll('button')].pop()).click()`); await sleep(5000);
  console.log('después de iniciar sesión:', await ev('location.href'));
}
for (const s of shots) {
  const [name, url, w, h, sc, mob] = s.split('|');
  await size(+w, +h, +sc, mob === '1');
  await send('Page.navigate', { url }); await sleep(5500);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${out}/${name}.png`, Buffer.from(r.result.data, 'base64')); console.log(name, '←', await ev('location.href'));
}
ws.close(); chrome.kill(); process.exit(0);
