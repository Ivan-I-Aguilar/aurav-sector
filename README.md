# AURAV · Control del sector (prototipo de demostración)

Juego WebXR de apoyo terrestre durante la carga de agua de un Air Tractor AT-802 con motor en marcha.
Se juega en computadora, celular y Meta Quest (botón «Entrar en VR»).

- Contenido basado en el MOE Vol. I de AAXOD (Procedimientos Estándar de Operación AT8T). **A validar por la Dirección de Operaciones.**
- Avión: el mismo AT-802 del simulador de cabina (ver «Avión», abajo); si no carga, el procedural `at802.js`. Camioneta y cisterna: `frontier.js` y `cisterna.js` (procedurales, ChatGPT rev. 04). Personas y sonidos: modelados en código por AURAV.
- Escenario: plataforma, pista, hangares y paisaje compartidos con «La vuelta al avión» (`aurav-prevuelo`), para que los dos juegos ocurran en el mismo aeródromo.
- Carga desde el lado derecho (`LADO_CARGA` en `main.js`): la manguera llega por debajo de la panza a la boca de carga del avión (la del AT-802 de AAXOD de las fotos: un caño centro-izquierda, detrás de la tolva). La marca de la válvula y el apoyo quedan al costado del fuselaje, del lado de la carga.
- Three.js 0.180.0 (licencia MIT) incluido en el repositorio: no se descarga de ningún CDN.
- `mision.js` es la única autoridad del juego; la interfaz pregunta y obedece.

## Etapas

- **Etapa 1 · Llegada al sector** (`llegada.js` autoridad, `manejo.js` cinemática): el alumno maneja la camioneta con la cisterna en primera persona (PC: W/S/A/D o flechas; celular: botones; Quest: palanca izquierda acelera/frena, derecha dobla) desde adelante-derecha del avión hasta el rectángulo amarillo detrás. Regla MOE 3.1.5: acercarse describiendo un círculo, nunca de frente; MOE 3.4: no entrar a la zona roja adelante del avión. Nota: 100 − 30 por entrada a la zona roja − 15 por cada aproximación de frente. Lugar de estacionamiento y distancias: **a validar** con AAXOD.
- **Etapa 2 · Aproximación a pie** (`caminata.js`): el ET baja de la camioneta y camina hasta la válvula de carga siguiendo un marcador, respetando los ángulos del MOE 3.4 (rojo prohibido −30, naranja solo autorizados −15, amarillo con aviso sin descuento, verde correcto); luego vuelve a su puesto junto a la puntera del ala (posición del ET y pasos de conexión: **a validar**). PC: W/S caminar, A/D de costado, flechas girar; celular: botones; Quest: palanca izquierda camina, derecha gira.
- **Etapa 3 · Control del sector** (`mision.js`): las 8 situaciones durante la carga.
- La intro permite empezar por la etapa 1, la 2 o ir directo a la carga; las etapas se encadenan 1 → 2 → 3. El resultado final incluye las tres notas.

## Avión

Desde el 15/11, `at802.glb` es el mismo AT-802 del simulador de cabina (`aurav-cabina-at802`): exterior, cúpula y cabina liviana
(2,5 MB, 71 k triángulos, 9 llamadas), en actitud de tres puntos, con la hélice en el nodo `helice` y los anclajes como nodos del GLB
(`acople-carga`, `cabina-piloto`, `ojo-piloto`, `nariz`, ruedas, punteras). Lo exporta `herramientas/avion_juegos.py` de ese repo
(ver `juegos/LEEME.md` allá); para cambiarlo se corre ahí, se copia acá y se sube `V_AVION` en `at802glb.js`. Lo carga
`at802glb.js`; si falla, `main.js` vuelve al modelo procedural `at802.js`. El exterior sale de un modelo freeware de simulador
(familia FSN): uso interno. El despegue (`despegue.js`) levanta la cola en la carrera, como un avión de rueda de cola.

## Modelos de terceros (Sketchfab, licencia CC BY 4.0 — se debe mantener este crédito)

- **Camioneta** `hilux.glb`: «Toyota Hilux 2007» de David_Holiday — https://sketchfab.com/3d-models/toyota-hilux-2007-0234ebed01ee4b87affed0e58673247e — sin líneas de borde, reducida a ~65 k triángulos, pintada de blanco, vidrios aclarados.
- **Camioneta anterior (respaldo)** `d21.glb`: «Nissan d21 1997» de MAXVERSTAPPEN2025 — https://sketchfab.com/3d-models/nissan-d21-1997-eba0b6d767c84ccdafa973e966e1d7db — reducida de 1,7 M a 54 k triángulos, pintada de blanco con neumáticos oscuros (colores por vértice).
- **Vecino** `vecino.glb`: «Casual Stride» de restore50 — https://sketchfab.com/3d-models/casual-stride-26bcaa5dcc9b4f00b449 — escaneo reducido a 13 k triángulos, texturas 1K.
- **Periodista** `periodista.glb`: «Stride Forward» de restore50 — https://sketchfab.com/3d-models/stride-forward-adfa2206a63d4dae8b7 — ídem, con cámara agregada en código.
- **Piloto** `piloto.glb`: «Pilot low poly character» de 00amza — https://sketchfab.com/3d-models/pilot-low-poly-character-867084949893461 — rig Mixamo; en el juego levanta el brazo para la seña.
- **Bombero** `bombero.glb`: «Firefighter (free download)» de jakobscheidt — https://sketchfab.com/3d-models/firefighter-free-download-042691a0afb8497798bc50174f633e68 — reducido de 51 k a 26 k triángulos, texturas WebP 1K/512.
- Descartados: «Fuel truck» (camión cisterna de 15 m, no corresponde a AAXOD) y «Cane and Confidence».
Si alguno no carga, el juego vuelve a los modelos procedurales de `vehiculos.js` / `personajes.js`.
