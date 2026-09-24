# AURAV · Control del sector (prototipo de demostración)

Juego WebXR de apoyo terrestre durante la carga de agua de un Air Tractor AT-802 con motor en marcha.
Se juega en computadora, celular y Meta Quest (botón «Entrar en VR»).

- Contenido basado en el MOE Vol. I de AAXOD (Procedimientos Estándar de Operación AT8T). **A validar por la Dirección de Operaciones.**
- Avión: `at802.js`, modelo procedural (base ChatGPT rev. 04, corregido por AURAV con las fotos del AT-802 de AAXOD del 24/9/2026: franjas, deriva, cabina, válvulas de carga). Camioneta y cisterna: `frontier.js` y `cisterna.js` (procedurales, ChatGPT rev. 04). Personas y sonidos: modelados en código por AURAV. Sin modelos ni sonidos de terceros.
- Escenario: plataforma, pista, hangares y paisaje compartidos con «La vuelta al avión» (`aurav-prevuelo`), para que los dos juegos ocurran en el mismo aeródromo.
- Carga por la válvula derecha (`LADO_CARGA` en `main.js`); en AAXOD se carga por cualquiera de las dos según la posición en plataforma.
- Three.js 0.180.0 (licencia MIT) incluido en el repositorio: no se descarga de ningún CDN.
- `mision.js` es la única autoridad del juego; la interfaz pregunta y obedece.

## Etapas

- **Etapa 1 · Llegada al sector** (`llegada.js` autoridad, `manejo.js` cinemática): el alumno maneja la camioneta con la cisterna en primera persona (PC: W/S/A/D o flechas; celular: botones; Quest: palanca izquierda acelera/frena, derecha dobla) desde adelante-derecha del avión hasta el rectángulo amarillo detrás. Regla MOE 3.1.5: acercarse describiendo un círculo, nunca de frente; MOE 3.4: no entrar a la zona roja adelante del avión. Nota: 100 − 30 por entrada a la zona roja − 15 por cada aproximación de frente. Lugar de estacionamiento y distancias: **a validar** con AAXOD.
- **Etapa 2 · Aproximación a pie** (`caminata.js`): el ET baja de la camioneta y camina hasta la válvula de carga siguiendo un marcador, respetando los ángulos del MOE 3.4 (rojo prohibido −30, naranja solo autorizados −15, amarillo con aviso sin descuento, verde correcto); luego vuelve a su puesto junto a la puntera del ala (posición del ET y pasos de conexión: **a validar**). PC: W/S caminar, A/D de costado, flechas girar; celular: botones; Quest: palanca izquierda camina, derecha gira.
- **Etapa 3 · Control del sector** (`mision.js`): las 8 situaciones durante la carga.
- La intro permite empezar por la etapa 1, la 2 o ir directo a la carga; las etapas se encadenan 1 → 2 → 3. El resultado final incluye las tres notas.
