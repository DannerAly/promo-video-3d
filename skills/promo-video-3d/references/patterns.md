# Guion y tomas

La plantilla trae esta estructura de 14 compases (~30 s a 110–120 BPM). Cada fila es una toma; los campos son los de `CONFIG`.

| Compás | Toma | Campo | Animación |
|---|---|---|---|
| 0 | Lo de antes, tachado | `strike` (4 palabras) | Una palabra por pulso, entra de golpe y una línea en degradado la tacha |
| 1 | El problema | `problem` (2 líneas) | La 1ª sube letra por letra; la 2ª se descifra y estalla al salir |
| 2 → 1er golpe | La promesa | `promise` + logo | Logo con rebote, frase letra por letra y píldora punteada con «+» que gira |
| golpes 1 | Tres palabras | `hitWords[0]` | Una por golpe (`hits[0]`), grandes y desenfocadas que se asientan |
| → 6 | La compu de cerca | `laptopHead` | Entra desde abajo, abre la tapa, la cámara se acerca y se mete en la pantalla |
| 6 | Lista que se resume | `stack` + `stackEnd` | Una línea por pulso, de lados alternados; en el 4º pulso, la frase final |
| 7 | Puente | `bridge` | Letras que suben y giran |
| golpes 2 | Tres palabras | `hitWords[1]` | Igual que el primer grupo |
| → 10 | El celular de cerca | `phoneHead` + `tiles` | Entra girando, casi llena el alto; fichas flotando detrás |
| 10 | Texto que se descifra | `decode` | Letras al azar que se fijan una por una |
| 11 → golpes 3 | Compu y celular juntos | `duoHead` | Los dos entran escalonados |
| golpes 3 | Tres palabras | `hitWords[2]` | Igual |
| final | Cierre | `brand` | Logo, nombre letra por letra, slogan, web y botones de tiendas, uno por pulso |

## Guiones que funcionaron

**Ejemplo real: sistema de ventas para negocios (Maximo, el del demo):**

- strike: Cuaderno. · Excel. · Calculadora. · Papelitos.
- problem: No más · *descontrol.*
- promise: Todo simple, · + a la mano
- golpes: Vende. · Cobra. · *Controla.*
- laptop: Tus ventas, *al instante.*
- stack: Cada venta. · Cada peso. · Cada producto. → Bajo *control.*
- bridge: Cobra como *quieras.*
- golpes: Efectivo. · *QR.* · Tarjeta.
- phone: Cobra *con QR.*
- decode: Tu stock, *al día.*
- duo: *Compu y celular.*
- golpes: Más ágil. · Más ventas. · *Al máximo.*
- cierre: Maximo · Agiliza tu negocio al máximo. · maximo.work

Plantilla de ideas para otro producto:

1. **Lo de antes** (tachado): las herramientas o hábitos que el producto reemplaza.
2. **El problema**: «No más» + una palabra que duela (descontrol, papeleo, esperas).
3. **La promesa**: la idea en 2 + 2 palabras.
4. **Golpes**: tres verbos de lo que haces con el producto.
5. **Compu**: el beneficio principal en 3–4 palabras.
6. **Lista**: «Cada X.» × 3 y un remate.
7. **Golpes**: tres opciones u objetos concretos (formas de pago, canales, plataformas).
8. **Celular**: la acción estrella.
9. **Descifrar**: una frase corta de resultado.
10. **Golpes finales**: tres palabras que suben de intensidad y terminan en el slogan.

## Parches sobre capturas

Coordenadas en píxeles de la captura original (la plantilla la ajusta al ancho de la pantalla 3D).

```js
patches: {
  laptop: [
    { fill: '#fff', x: 64, y: 22, w: 160, h: 40 },                                // tapa el nombre viejo
    { text: 'Maximo', x: 68, y: 49, font: '700 21px "Segoe UI", Poppins' },       // y escribe el nuevo
  ],
  phone: [
    { img: 'p1', x: 34, y: 638, w: 346, h: 345, r: [22, 22, 0, 0] },              // foto de producto en una tarjeta
    { fill: '#fff', x: 38, y: 987, w: 338, h: 168 },
    { text: 'Alitas con papas', x: 54, y: 1033, font: '500 29px "Segoe UI", Poppins' },
    { text: 'Bs 45,00', x: 54, y: 1128, font: '600 33px "Segoe UI", Poppins' },
  ],
},
```

Para encontrar las coordenadas, abre la captura y mide, o recórtala con ffmpeg (`-vf crop=w:h:x:y`) hasta dar con el rectángulo.
