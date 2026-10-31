// Empaqueta imágenes en assets.js como data URI (WebGL no acepta texturas de file://).
// Uso: node pack.mjs <carpeta-del-video> laptop=panel.png phone=pos.png logo=logo.png p1=foto1.jpg p2=foto2.jpg …
// Las claves laptop, phone y logo las usa la plantilla; las demás se usan desde CONFIG.patches ({ img: 'p1', … }).
import { readFileSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const [dir, ...pairs] = process.argv.slice(2);
if (!dir || !pairs.length) { console.error('Uso: node pack.mjs <carpeta> clave=archivo …'); process.exit(1); }
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const out = {};
for (const p of pairs) {
  const [k, f] = p.split('='); const mime = MIME[extname(f).toLowerCase()];
  if (!mime) { console.error(`Formato no soportado: ${f}`); process.exit(1); }
  out[k] = `data:${mime};base64,` + readFileSync(f).toString('base64');
  console.log(`${k} ← ${f} (${Math.round(readFileSync(f).length / 1024)} KB)`);
}
writeFileSync(join(dir, 'assets.js'), 'window.ASSETS=' + JSON.stringify(out));
console.log(`→ ${join(dir, 'assets.js')}`);
