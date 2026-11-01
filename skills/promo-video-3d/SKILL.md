---
name: promo-video-3d
description: Crea videos promocionales de ~30 segundos estilo Apple para un producto digital (app, sistema, SaaS): fondo blanco, laptop y celular 3D (Three.js) mostrando capturas reales, tipografía cinética que entra en cada golpe de la música (palabras tachadas, letras que se descifran, golpes de a uno), motion blur real y salida en horizontal, vertical y cuadrado. Úsala cuando pidan un video promocional, un comercial, un reel, un video corporativo o "un video tipo Apple" de un sistema o app, con música, 3D o animaciones de texto.
---

# Videos promocionales con dispositivos 3D y letras al ritmo

Un video de ~30 s que se arma en HTML (Three.js + DOM) y se graba cuadro por cuadro con Chrome sin ventana. Nada de editor de video: la página expone `window.seek(t)` y `scripts/rec.mjs` la recorre. Por eso el resultado es exacto al cuadro y se puede sacar en cualquier formato.

Punto de partida: copia `template/index.html` a la carpeta del usuario y edita solo el bloque `CONFIG` del principio.

## Flujo de trabajo

1. **Guion primero.** Antes de tocar el HTML, escribe el guion en 6 tiempos (ver `references/patterns.md`): lo de antes (tachado) → el problema → la promesa → la compu → el celular → los dos juntos → cierre. Frases de 1 a 4 palabras. Pregunta por el nombre de la marca, el slogan, la web y si la app está en App Store y Google Play.
2. **La música.** Pide el audio (sirve un `.mp4`: se le saca la pista). Recórtalo a 30 s con un fundido al final:
   `ffmpeg -i musica.mp4 -t 30 -vn -af "afade=t=in:d=0.3,afade=t=out:st=28:d=2" audio.m4a`
3. **El ritmo.** `node scripts/beats.mjs audio.m4a` da los BPM, el primer golpe y los grupos de «3 golpes» candidatos. Pon `bpm`, `firstBeat` y `hits` en `CONFIG`. **Los golpes los confirma el usuario de oído**: si te da tiempos como `00:05:09`, son mm:ss:cuadro a 30 fps → `5 + 9/30 = 5.30`.
4. **Las pantallas.** Captura el producto real con `scripts/capture.mjs` (compu 1600×1000 a 1.2 → 1920×1200; celular 390×845 a 2 → 780×1690). Si el sistema pide inicio de sesión, usa `LOGIN_URL`, `LOGIN_USER` y `LOGIN_PASS`. Mira las capturas antes de usarlas: indicadores de desarrollo, nombres viejos, datos personales.
5. **Empaqueta.** `node scripts/pack.mjs <carpeta> laptop=… phone=… logo=… p1=foto.jpg …` genera `assets.js`. Las fotos extra (productos, etc.) se pegan sobre las capturas con `CONFIG.patches` (coordenadas en píxeles de la captura).
6. **Revisa con capturas sueltas** antes de renderizar: `node scripts/rec.mjs video.html revision "1,3,6,10,14,19,22,24,28"` en 1920×1080 y también con `VW=1080 VH=1920` y `VW=1080 VH=1080`. Mira el texto que se pisa con los equipos, equipos cortados en vertical y palabras que no caben.
7. **Render final.** `bash scripts/render.sh video.html audio.m4a NOMBRE` saca `NOMBRE-horizontal.mp4`, `NOMBRE-vertical.mp4` y `NOMBRE-cuadrado.mp4`. Tarda unos 5 min por formato con GPU. Córrelo en segundo plano y avisa cuando termine cada uno.
8. **Abre el video** y resume las tomas con sus tiempos.

## Diseño (lo que hace que se vea bien)

- **Fondo blanco** y limpio. Nada de burbujas, esferas ni partículas de relleno: quitan protagonismo.
- **Una sola tipografía** (Poppins 600/700), títulos con `letter-spacing:-.05em`. El degradado naranja → rosa → violeta → azul va en 1 o 2 palabras clave por frase (con `*` en el `CONFIG`).
- **Poco texto, mucho ritmo.** Las tomas de solo letras son lo que más gusta; las de dispositivos van entre ellas.
- **Los equipos de cerca.** La pantalla tiene que leerse: la compu ocupa casi todo el cuadro y la cámara se acerca hasta meterse en la pantalla; el celular casi llena el alto.
- **Solo compu y celular.** Con la tablet además se ve recargado.
- **Capturas reales** del producto, nunca interfaces inventadas, y fotos reales de productos si es un punto de venta o catálogo.
- **Curvas de velocidad**: entradas con `cubic-bezier(.16,1,.3,1)`, movimientos con `(.65,0,.35,1)`, salidas con `(.55,0,.9,.3)` y un poco de rebote (`back`) en logo y botones.
- **Motion blur** de verdad: 4 submuestras por cuadro en medio cuadro (obturador de 180°) que ffmpeg promedia.

## Ritmo (lo que la hace sentir sincronizada)

- Todo se escribe en **compases y pulsos** (`br(k)`, `bt(n)`), no en segundos sueltos: si cambia el BPM, todo se mueve junto.
- **Cada palabra entra en un golpe** y sale justo en el siguiente.
- **Los «3 golpes»** (tres impactos rápidos que cierran una frase musical) llevan tres palabras, una por golpe. Las tomas de dispositivos empiezan un pulso después del tercero.
- **No hagas pulsar ni vibrar las cosas con el ritmo** (escalas que laten, cámara que salta). Se ve mal: el ritmo se marca con los cortes y las entradas, no con temblores.

## Formatos

`?w=&h=` en la URL. `--s` escala el texto según el ancho. En vertical (`.port`) los titulares grandes bajan de tamaño y las frases largas del puente van en dos líneas. La cámara se aleja con `MUL` y los equipos se apilan. Revisa siempre los tres formatos con capturas.

## Cómo funciona la plantilla (para editarla sin romperla)

- `render(t)` dibuja el estado exacto del segundo `t`, sin depender del cuadro anterior. Por eso se puede grabar a cualquier velocidad y con submuestras.
- `track(keys, t)` interpola poses `{x,y,z,rx,ry,rz,s}` con su curva. `T.laptop`, `T.phone` y `T.cam` son las pistas.
- `rise` (letras que suben, giran y se enfocan), `slam` (golpe), `seq` (una palabra por golpe), `scramble` (letras al azar que se fijan; con `shatter` estallan al salir) y la barra de `#strike` (tachado) son las animaciones de texto.
- Las pantallas son `CanvasTexture`: `drawScreen` pinta la captura y luego los `patches`.

## Cosas que ya fallaron (evítalas)

- **Imágenes por `file://` como textura**: WebGL las rechaza. Van como data URI en `assets.js` (`pack.mjs`).
- **Degradado en letras animadas por separado**: cada letra mostraba el degradado completo. La plantilla calcula `background-size/position` por línea; si agregas texto con degradado, que quede dentro de `.mega`, `.head`, `.big`, `.url` o `.line`.
- **Un equipo que cruza la toma de solo letras**: pasa al interpolar entre una pose «arriba» y otra «abajo». Repite la pose fuera de cuadro justo antes del salto (`[t - .11, above(…)], [t - .1, below(…)]`).
- **Titular encima de la pantalla** en tomas cercanas: sube el punto de mira de la cámara (`ty`) en vez de achicar el equipo.
- **Fichas flotantes que tapan la pantalla del celular**: van detrás (`z` negativo).
- **Nombres de variables**: el módulo ya usa `scr`, `lid`, `tiles`, `T`. Un `const` repetido rompe todo sin mostrar nada; mira la consola de `rec.mjs` (imprime `ERROR`).
- **Emojis en las fichas**: según la máquina no se dibujan. Usa símbolos (`$`, `QR`, `+1`, `✓`, `%`, `★`).
- **El nombre del producto cambió** y las capturas son de antes: tápalo con un parche (`fill` + `text`) en vez de volver a capturar.
- **Botones de tiendas**: los de la plantilla son dibujos parecidos a los oficiales. Si el video se va a publicar, avisa que conviene usar las insignias oficiales de Apple y Google, y quita la tienda en la que la app todavía no está.
- **Precios y cifras**: si los inventas para el ejemplo, dilo. Nunca presentes métricas inventadas como reales.

## Requisitos

Node 22+, Google Chrome y ffmpeg. Internet al grabar (Three.js y las fuentes vienen de CDN).
