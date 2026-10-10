// AURAV · Control del sector — carga de agua de un AT-802 con motor en marcha.
// La interfaz pregunta; mision.js decide.
import * as THREE from './three.module.js';
import { crearAT802 } from './at802.js?v=20261006a';
import { crearAT802GLB } from './at802glb.js?v=20261006a';
import { crearConjunto } from './vehiculos.js?v=20261006a';
import { crearEscenario, crearZonas, crearEquipoCarga } from './escenario.js?v=20261010a';
import { crearPersona, crearPiloto, caminarHacia, cargarGLB, crearPersonaGLB, crearPilotoGLB } from './personajes.js?v=20261006a';
import { crearAudio } from './audio.js?v=20261006a';
import { Panel } from './panel.js?v=20261006a';
import { Mision, EVENTOS } from './mision.js?v=20261006a';
import { Llegada, TEXTOS as TXT_LLEGADA } from './llegada.js?v=20261006a';
import { Manejo, Entrada } from './manejo.js?v=20261006a';
import { Caminata, TEXTOS as TXT_CAMINATA } from './caminata.js?v=20261006a';
import { Despegue } from './despegue.js?v=20261010a';
import { Constancia } from './constancia.js?v=20261006a';
import { crearSenaleroGLB } from './senalero.js?v=20261010a';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------- Render, escena, jugador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
document.getElementById('lienzo').appendChild(renderer.domElement);

const escena = new THREE.Scene();
const camara = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 900);
const rig = new THREE.Group(); rig.add(camara); escena.add(rig);
const POS_JUGADOR = V(-3.2, 0, 10.6); // afuera de la puntera del ala, detrás (zona verde)
rig.position.copy(POS_JUGADOR);
camara.position.y = 1.65;
let yaw = 0.25, pitch = -0.08;
function aplicarMirada() { camara.rotation.set(pitch, yaw, 0, 'YXZ'); }
aplicarMirada();

// niebla por distancia real (no por profundidad de pantalla): en el Quest la bruma de las sierras «saltaba» al girar la cabeza
THREE.ShaderChunk.fog_vertex = '#ifdef USE_FOG\n\tvFogDepth = length( mvPosition.xyz );\n#endif';
const ambiente = crearEscenario(escena);
// Entorno de reflejos procedural (cielo/horizonte/suelo) para que metales y vidrios del avión y la cisterna no queden opacos.
{
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const g = cv.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#6f97c0'); gr.addColorStop(0.48, '#e8eef2'); gr.addColorStop(0.52, '#9a9c8b'); gr.addColorStop(1, '#4a4f40');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer); escena.environment = pm.fromEquirectangular(t).texture; escena.environmentIntensity = 0.8; pm.dispose(); t.dispose();
}
const zonas = crearZonas(11); zonas.position.x = 0.4; escena.add(zonas);

// Lado por el que se carga: en AAXOD se carga por cualquiera de las dos válvulas según dónde quede el avión
// en la plataforma. El jugador y la motobomba están del lado +z, que en este modelo es el lado DERECHO del avión.
const LADO_CARGA = 'derecho'; // 'izquierdo' | 'derecho'
// Avión: modelo Tripo (at802.glb) con las fotos de AAXOD; si no carga, el procedural de at802.js.
// USAR_AVION_TRIPO: false = avión de código (at802.js, GPT rev.04 + fotos AAXOD); true = at802.glb de Tripo (a mejorar texturizando el modelo de código en Tripo).
const USAR_AVION_TRIPO = true;
let avion;
if (USAR_AVION_TRIPO) { try { avion = await crearAT802GLB(); } catch (e) { console.warn('No se pudo cargar at802.glb, se usa el modelo procedural', e); avion = crearAT802(); } }
else avion = crearAT802();
escena.add(avion);
avion.userData.ponerMotor(true);
avion.updateMatrixWorld(true);
const asiento = avion.getObjectByName('cabina-piloto');
let piloto; try { piloto = crearPilotoGLB(await cargarGLB('./piloto.glb')); } catch (e) { console.warn('piloto.glb no cargó', e); piloto = crearPiloto(); }
piloto.position.set(0, -0.05, 0); asiento.add(piloto);
piloto.visible = false;   // 29/9: en el visor se lo veía parado sobre el ala; se lo oculta (la situación «seña del piloto» sigue funcionando con el proxy)
// personas escaneadas (Sketchfab, CC BY) para el vecino y el periodista; el resto, procedurales
const MODELOS_PERSONA = {};
for (const [tipo, url, op] of [['vecino', './vecino.glb', {}], ['periodista', './periodista.glb', { camara: true }], ['bombero', './bombero.glb', {}]]) { try { MODELOS_PERSONA[tipo] = { gltf: await cargarGLB(url), op }; } catch (e) { console.warn(url, 'no cargó', e); } }
// Personas articuladas (Tripo + esqueleto, el mismo personal de rampa del juego de señaleros) para el brigadista y el
// compañero de apoyo: caminan moviendo las piernas en vez de deslizarse. Mira a +x como las demás personas.
async function crearPersonaRig() {
  const gltf = await cargarGLB('./senalero.glb'); const p = new THREE.Group(); p.name = 'persona-rig';
  const fig = crearSenaleroGLB(gltf, { alto: 1.74 }); fig.rotation.y = Math.PI / 2; p.add(fig);
  fig.children.forEach(c => { if (c !== gltf.scene) c.visible = false; });   // sin paletas
  const estado = { caminando: false };
  p.userData = { estado, actualizar(dt) { fig.userData.caminar(estado.caminando ? 1.4 : 0); fig.userData.actualizar(dt); } };
  return p;
}
const RIG = {}; try { RIG.brigadista = await crearPersonaRig(); RIG.apoyo = await crearPersonaRig(); } catch (e) { console.warn('senalero.glb no cargó', e); }
const posAcople = avion.getObjectByName(LADO_CARGA === 'derecho' ? 'acople-carga-derecho' : 'acople-carga').getWorldPosition(new THREE.Vector3());

const ESTACIONAMIENTO = { pos: V(-7.5, 0, 19.5), rumbo: 0.05 };     // A VALIDAR con AAXOD: lugar de la camioneta durante la carga
const INICIO_LLEGADA = { pos: V(40, 0, 22), rumbo: Math.PI };         // llega desde adelante-derecha, con la nariz del avión a la vista
const conjunto = await crearConjunto({ anguloCisterna: 0.12 }); conjunto.position.copy(ESTACIONAMIENTO.pos); conjunto.rotation.y = ESTACIONAMIENTO.rumbo; escena.add(conjunto);
// rectángulo de estacionamiento pintado en el piso
{
  const g = new THREE.Group(); const mLinea = new THREE.MeshBasicMaterial({ color: 0xf2c200 });
  const L = 11, A = 3.8, e = 0.12;
  for (const [w, d, x, z] of [[L, e, 0, A / 2], [L, e, 0, -A / 2], [e, A, L / 2, 0], [e, A, -L / 2, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.01, d), mLinea); m.position.set(x, 0.03, z); g.add(m); }
  g.position.set(ESTACIONAMIENTO.pos.x - 2.2, 0, ESTACIONAMIENTO.pos.z); g.rotation.y = ESTACIONAMIENTO.rumbo; escena.add(g);
}
const manejo = new Manejo(conjunto), entrada = new Entrada();
const llegada = new Llegada({ pos: V(0.4, 0, 0), rumbo: 0 }, ESTACIONAMIENTO.pos);
const ASIENTO_CHOFER = conjunto.userData.asiento ? V(...conjunto.userData.asiento) : V(-0.35, -0.2, -0.42); // respecto del origen de la camioneta (piso); la cámara suma su propia altura
// ---------- Etapa 2: aproximación a pie
const caminata = new Caminata({ pos: V(0.4, 0, 0), rumbo: 0 }, posAcople.clone().setY(0), POS_JUGADOR);
const VEL_CAMINAR = 1.6;
const velCaminar = new THREE.Vector2();
// Movimiento en VR: 'suave' (palanca izquierda camina, derecha gira suave) o 'teleport' (apuntar al piso y gatillo; giro de a 45°).
let modoVR = null;
const marcaTeleport = (() => { const m = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.4, 32), new THREE.MeshBasicMaterial({ color: 0x29b6f6, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.03; m.visible = false; escena.add(m); return m; })();
let puntoTeleport = null;
function caminataActiva() { return caminata.fase === 'valvula' || caminata.fase === 'puesto'; }
function panelModoVR(despues) {
  pausa = true;
  panel.mostrar({ eyebrow: 'Meta Quest', titulo: '¿Cómo te querés mover?',
    texto: ['Caminar con la palanca: la izquierda camina hacia donde mirás y la derecha gira suave.', 'Teletransporte: apuntá al piso con el control y apretá el gatillo para aparecer ahí; la palanca derecha gira de a 45°.', 'Se puede cambiar volviendo al inicio (✕).'],
    botones: [{ texto: 'Caminar con la palanca', id: 'suave' }, { texto: 'Teletransporte', id: 'teleport' }], altoBoton: 80 });
  colocarPanel(panel);
  accionPanel = id => { modoVR = id; panel.ocultar(); pausa = false; despues && despues(); };
}
function teleportar(p) { const c = camara.getWorldPosition(new THREE.Vector3()); rig.position.x += p.x - c.x; rig.position.z += p.z - c.z; rig.position.y = 0; audio.aviso(); }
function apuntarPiso() {
  puntoTeleport = null; marcaTeleport.visible = false;
  if (!renderer.xr.isPresenting || modoVR !== 'teleport' || !caminataActiva() || panel.mesh.visible) return;
  for (const c of controles) {
    if (!c.userData.fuente) continue;
    const { o, d } = rayoDe(c); if (d.y >= -0.05) continue;
    const t = -o.y / d.y, p = o.clone().addScaledVector(d, t);
    if (t < 14) { puntoTeleport = p; marcaTeleport.position.set(p.x, 0.03, p.z); marcaTeleport.visible = true; return; }
  }
}
function giroSuave(dt) {
  for (const c of controles) {
    const gp = c.userData.fuente?.gamepad; if (!gp || c.userData.fuente.handedness !== 'right') continue;
    const x = gp.axes[2] ?? 0; if (Math.abs(x) < 0.2) continue;
    const cabeza = camara.getWorldPosition(new THREE.Vector3()), ang = -x * dt * 1.6;
    rig.position.sub(cabeza).applyAxisAngle(V(0, 1, 0), ang).add(cabeza); rig.rotation.y += ang;
  }
}
function marcador(color) {
  const g = new THREE.Group(); g.visible = false;
  const anillo = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
  anillo.rotation.x = -Math.PI / 2; anillo.position.y = 0.04; g.add(anillo);
  const flecha = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 10), new THREE.MeshBasicMaterial({ color })); flecha.rotation.x = Math.PI; flecha.position.y = 1.9; g.add(flecha);
  g.userData.actualizar = dt => { flecha.position.y = 1.9 + Math.sin(performance.now() / 300) * 0.1; flecha.rotation.y += dt * 2; };
  escena.add(g); return g;
}
const marcaValvula = marcador(0x29b6f6), marcaPuesto = marcador(0x2fbf4a);
marcaValvula.position.set(posAcople.x, 0, posAcople.z + 0.9); marcaPuesto.position.copy(POS_JUGADOR);
function panelIntroCaminata() {
  pausa = true;
  panel.mostrar({ eyebrow: 'Etapa 2 · Aproximación a pie', titulo: 'Caminá hasta la válvula', texto: TXT_CAMINATA.intro, botones: [{ texto: 'Empezar a caminar', id: 'caminar' }] });
  colocarPanel(panel);
  accionPanel = id => { if (id === 'caminar') empezarCaminata(); };
}
function empezarCaminata() {
  audio.reanudar(); if (!sonidoTurbina.isPlaying) sonidoTurbina.play();
  if (rig.parent !== escena) escena.add(rig);
  // baja por la puerta del chofer, al lado de la camioneta estacionada
  const p = conjunto.position.clone().add(V(0, 0, -1.6).applyAxisAngle(V(0, 1, 0), conjunto.rotation.y)); rig.position.set(p.x, 0, p.z);
  rig.rotation.y = 0; yaw = Math.atan2(-(posAcople.x - p.x), -(posAcople.z - p.z)); pitch = -0.05; aplicarMirada();
  caminata.empezar(); marcaValvula.visible = true; panel.ocultar(); pausa = false;
  document.body.classList.add('jugando', 'manejando');
  document.getElementById('ayuda').textContent = 'W/S o ▲▼: caminar · A/D: de costado · flechas ◀▶: girar · Quest: palanca izquierda camina, derecha gira';
}
function panelAvisoCaminata(tx, grave) {
  pausa = true;
  panel.mostrar({ eyebrow: 'Etapa 2 · Aproximación a pie', borde: grave ? '#d32f2f' : '#f2c200', titulo: tx.titulo, texto: tx.texto, botones: [{ texto: 'Seguir', id: 'seguir' }] });
  colocarPanel(panel);
  accionPanel = () => { panel.ocultar(); pausa = false; };
}
function panelValvula() {
  pausa = true; marcaValvula.visible = false; marcaPuesto.visible = true;
  panel.mostrar({ eyebrow: 'Etapa 2 · Aproximación a pie', borde: '#2e9e5b', titulo: TXT_CAMINATA.valvula.titulo, texto: TXT_CAMINATA.valvula.texto, botones: [{ texto: 'Volver al puesto', id: 'seguir' }] });
  colocarPanel(panel);
  accionPanel = () => { panel.ocultar(); pausa = false; };
}
function panelFinCaminata() {
  pausa = true; marcaPuesto.visible = false;
  const f = caminata.fin;
  panel.mostrar({ eyebrow: 'Etapa 2 · Aproximación a pie', borde: '#2e9e5b', titulo: `${TXT_CAMINATA.puesto.titulo} · Nota ${f.nota}/100`,
    texto: [TXT_CAMINATA.puesto.texto, ...f.detalle.map(d => `· ${d.titulo}: ${d.texto}`)], botones: [{ texto: 'Empezar la carga', id: 'carga' }] });
  colocarPanel(panel);
  accionPanel = () => { document.body.classList.remove('manejando'); rig.position.copy(POS_JUGADOR); panel.ocultar(); document.getElementById('ayuda').textContent = 'Arrastrá para mirar alrededor · tocá o hacé clic sobre lo que veas'; empezar(); };
}
function caminar(dt) {
  if (renderer.xr.isPresenting && modoVR === 'teleport') return;
  const { adelante, lateral, giro } = entrada.leerCaminar(renderer.xr.isPresenting ? controles : []);
  if (giro) { yaw += giro * dt * 1.6; aplicarMirada(); }
  // velocidad suavizada (arranca y frena en ~0,3 s) para que la palanca del Quest no dé tirones
  const k = Math.min(1, dt / 0.3);
  velCaminar.x += (adelante - velCaminar.x) * k; velCaminar.y += (lateral - velCaminar.y) * k;
  if (Math.abs(velCaminar.x) < 0.01 && Math.abs(velCaminar.y) < 0.01) { velCaminar.set(0, 0); return; }
  const dir = camara.getWorldDirection(new THREE.Vector3()); dir.y = 0; dir.normalize();
  const lado = V(dir.z, 0, -dir.x);
  rig.position.addScaledVector(dir, velCaminar.x * VEL_CAMINAR * dt).addScaledVector(lado, velCaminar.y * VEL_CAMINAR * dt);   // lado = izquierda de la mirada; A (lateral +1) va a la izquierda
  rig.position.y = 0;
}
const POS_BOMBA = V(-4.4, 0, 12.2);
const equipo = crearEquipoCarga(POS_BOMBA, posAcople); escena.add(equipo);

// ---------- Audio
const audio = crearAudio(camara);
const sonidoTurbina = audio.posicional(avion.getObjectByName('helice'), audio.buffers.turbina, { loop: true, volumen: 1.1, ref: 7 });
// ---------- Cierre: despegue de celebración y constancia
const despegue = new Despegue(avion, piloto, { sonidoTurbina, manguera: equipo.getObjectByName('manguera-impulsion') });
const constancia = new Constancia(); escena.add(constancia.mesh);
let celebrando = false;
function datosConstancia() {
  const etapas = [];
  if (llegada.fin) etapas.push({ nombre: 'Etapa 1 · Llegada con la camioneta (MOE 3.1.5)', nota: llegada.fin.nota });
  if (caminata.fin) etapas.push({ nombre: 'Etapa 2 · Aproximación a pie por zonas (MOE 3.4)', nota: caminata.fin.nota });
  if (mision.fin) etapas.push({ nombre: 'Etapa 3 · Control del sector durante la carga', nota: mision.fin.nota });
  return { nombre: document.getElementById('alumno').value, etapas, fecha: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) };
}

// ---------- Actores de cada situación
const mision = new Mision();
const actores = {};
function proxy(radio, padre, pos = V(0, 0, 0)) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radio, 10, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
  m.position.copy(pos); padre.add(m); return m;
}
function persona(tipo, inicio, destino, salida, vel = 1.25) {
  const p = RIG[tipo] || (MODELOS_PERSONA[tipo] ? crearPersonaGLB(MODELOS_PERSONA[tipo].gltf, MODELOS_PERSONA[tipo].op) : crearPersona(tipo)); p.position.copy(inicio); p.visible = false; escena.add(p);
  const hit = proxy(0.75, p, V(0, 1.0, 0));
  return { obj: p, hit, inicio, destino, salida, vel, fase: 'oculto',
    aparecer() { p.position.copy(inicio); p.visible = true; this.fase = 'entra'; },
    retirar() { this.fase = 'sale'; },
    actualizar(dt) {
      p.userData.actualizar(dt);
      if (this.fase === 'entra') { if (caminarHacia(p, destino, vel, dt)) this.fase = 'espera'; }
      else if (this.fase === 'espera') { const d = V(POS_JUGADOR.x - p.position.x, 0, POS_JUGADOR.z - p.position.z); p.rotation.y = Math.atan2(-d.z, d.x); }
      else if (this.fase === 'sale') { if (caminarHacia(p, salida, vel * 1.3, dt)) { p.visible = false; this.fase = 'oculto'; } }
    } };
}
actores.brigadista = persona('brigadista', V(18, 0, 15), V(6.8, 0, 3.0), V(22, 0, 22));
actores.periodista = persona('periodista', V(-4, 0, 36), V(-2.4, 0, 13.4), V(-5, 0, 42), 1.1);
actores.curioso = persona('vecino', V(-13, 0, 18), V(-13, 0, -9), V(-13, 0, -30), 0.9);
actores.bombero = persona('bombero', V(-6.5, 0, 16), V(0.4, 0, 2.4), V(-8, 0, 22), 1.0);
// el vecino no se queda quieto: cruza toda la cola
actores.curioso.actualizar = function (dt) {
  const p = this.obj; p.userData.actualizar(dt);
  if (this.fase === 'entra') { if (caminarHacia(p, this.destino, this.vel, dt)) { [this.inicio, this.destino] = [this.destino, this.inicio]; } }
  else if (this.fase === 'sale') { if (caminarHacia(p, V(-13, 0, 30), 1.4, dt)) { p.visible = false; this.fase = 'oculto'; } }
};

// Fin de la carga: el compañero de apoyo camina desde la motobomba hasta la válvula (por detrás del ala, lejos de la
// hélice), desconecta la manguera y se retira; recién entonces empieza el rodaje.
const desconexion = (() => {
  const ap = RIG.apoyo || crearPersona('brigadista'); ap.visible = false; escena.add(ap);
  const manguera = equipo.getObjectByName('manguera-impulsion');
  const DESDE = V(POS_BOMBA.x - 1.5, 0, POS_BOMBA.z + 2.5), VALVULA = V(posAcople.x - 0.35, 0, posAcople.z + 1.25), VUELTA = V(POS_BOMBA.x - 2.5, 0, POS_BOMBA.z + 3.5);
  let fase = null, t = 0;
  return {
    get activa() { return !!fase; },
    reset() { fase = null; ap.visible = false; if (manguera) manguera.visible = true; },
    empezar() { fase = 'va'; t = 0; ap.position.copy(DESDE); ap.visible = true; },
    actualizar(dt) {
      ap.userData.actualizar(dt);
      if (fase === 'va') { if (caminarHacia(ap, VALVULA, 1.3, dt)) { fase = 'desconecta'; t = 0; } return 'El apoyo va a la válvula (por detrás del ala)'; }
      if (fase === 'desconecta') { t += dt; const d = V(posAcople.x - ap.position.x, 0, posAcople.z - ap.position.z); ap.rotation.y = Math.atan2(-d.z, d.x);
        if (t > 2.5 && manguera?.visible) manguera.visible = false; if (t > 3.5) fase = 'vuelve'; return 'Desconecta la manguera'; }
      if (fase === 'vuelve') { if (caminarHacia(ap, VUELTA, 1.5, dt)) { fase = null; ap.visible = false; celebrando = true; despegue.empezar({ mangueraRetirada: true }); } return 'Se aleja del avión'; }
      return null;
    } };
})();

// Celular: suena a tu lado, a la altura de la cintura
{
  const g = new THREE.Group(); g.visible = false; rig.add(g); g.position.set(0.3, 1.0, -0.35);
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.012), new THREE.MeshStandardMaterial({ color: 0x111111 })); g.add(cuerpo);
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.14), new THREE.MeshBasicMaterial({ color: 0x7fd3ff })); pantalla.position.z = 0.007; g.add(pantalla);
  g.rotation.x = -0.5;
  const son = audio.posicional(g, audio.buffers.celular, { loop: true, volumen: 1.4, ref: 1 });
  const hit = proxy(0.22, g);
  let t = 0;
  actores.celular = { obj: g, hit, aparecer() { g.visible = true; son.play(); }, retirar() { g.visible = false; son.isPlaying && son.stop(); },
    actualizar(dt) { if (g.visible) { t += dt; g.position.y = 1.0 + Math.sin(t * 30) * 0.004; pantalla.material.color.setHSL(0.55, 0.9, 0.6 + 0.2 * Math.sin(t * 8)); } } };
}
// Radio portátil: te llama el Coordinador
{
  const g = new THREE.Group(); g.visible = false; rig.add(g); g.position.set(-0.32, 1.0, -0.3);
  const c = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.035), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); g.add(c);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0x1a1a1a })); ant.position.set(0.018, 0.12, 0); g.add(ant);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), new THREE.MeshBasicMaterial({ color: 0x33ff66 })); led.position.set(-0.018, 0.08, 0.02); g.add(led);
  const son = audio.posicional(g, audio.buffers.radio, { loop: true, volumen: 1.3, ref: 1 });
  const hit = proxy(0.22, g); let t = 0;
  actores.radio = { obj: g, hit, aparecer() { g.visible = true; son.play(); }, retirar() { g.visible = false; son.isPlaying && son.stop(); },
    actualizar(dt) { if (g.visible) { t += dt; led.visible = Math.sin(t * 10) > 0; } } };
}
// Bolsa de nailon que el viento arrastra hacia adelante del avión
{
  const g = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), new THREE.MeshStandardMaterial({ color: 0xf3f3f0, transparent: true, opacity: 0.85, roughness: 0.3, flatShading: true }));
  g.geometry.attributes.position.array.forEach((_, i, a) => { if (i % 3 === 1) a[i] *= 0.6; a[i] *= 0.85 + Math.random() * 0.3; });
  g.geometry.computeVertexNormals(); g.visible = false; g.castShadow = true; escena.add(g);
  const hit = proxy(0.6, g);
  const desde = V(-1.2, 0.2, 5.0), hacia = V(5.2, 0.2, 2.6); let t = 0;
  actores.bolsa = { obj: g, hit, aparecer() { g.position.copy(desde); g.visible = true; t = 0; }, retirar() { g.visible = false; },
    actualizar(dt) {
      if (!g.visible) return; t += dt;
      const k = Math.min(1, t / 26); g.position.lerpVectors(desde, hacia, k);
      g.position.y = 0.2 + Math.abs(Math.sin(t * 2.3)) * 0.35; g.rotation.x += dt * 3; g.rotation.z += dt * 2;
    } };
}
// Piloto que hace señas
{
  const hit = proxy(0.9, piloto, V(0, 0.5, 0));
  actores.piloto = { obj: piloto, hit, aparecer() { piloto.userData.seña = true; }, retirar() { piloto.userData.seña = false; }, actualizar(dt) { piloto.userData.actualizar(dt); } };
}

// ---------- Tableros
const panel = new Panel(1.3, 0.9); escena.add(panel.mesh);
const hudPanel = new Panel(0.5, 0.12); // reloj chico en el visor
function colocarPanel(p, dist = 1.35, bajar = 0.12) {
  const pos = camara.getWorldPosition(new THREE.Vector3());
  const dir = camara.getWorldDirection(new THREE.Vector3()); dir.y = 0; dir.normalize();
  p.mesh.position.copy(pos).addScaledVector(dir, dist); p.mesh.position.y = pos.y - bajar;
  p.mesh.lookAt(pos.x, p.mesh.position.y, pos.z);
}

let pausa = false;       // un tablero de aviso detiene el reloj de la carga
let accionPanel = null;  // qué hacer con el botón elegido

function panelIntro() {
  pausa = true;
  panel.mostrar({
    eyebrow: 'AURAV · AAXOD · Prototipo de demostración', titulo: 'Control del sector',
    texto: ['Sos el Equipo de Tierra. El AT-802 está cargando agua por la válvula derecha con el motor en marcha y vos sos responsable del sector.',
      'Durante la carga van a pasar cosas a tu alrededor. Mirá para todos lados: cuando veas algo, apuntalo y elegí qué hacer.',
      'Basado en el MOE Vol. I de AAXOD. Contenido a validar por la Dirección de Operaciones.'],
    botones: [{ texto: 'Etapa 1 · Llegar con la camioneta', id: 'llegada', fuente: 30 }, { texto: 'Etapa 2 · Acercarse a pie', id: 'caminata', fuente: 30 }, { texto: 'Etapa 3 · Ir directo a la carga', id: 'empezar', fuente: 30 }], altoBoton: 62,
  });
  colocarPanel(panel);
  accionPanel = id => { if (id === 'empezar') empezar(); if (id === 'llegada') panelIntroLlegada(); if (id === 'caminata') panelIntroCaminata(); };
}
// ---------- Etapa 1: llegada manejando la camioneta
function panelIntroLlegada() {
  pausa = true;
  panel.mostrar({ eyebrow: 'Etapa 1 · Llegada al sector', titulo: 'Manejá la camioneta', texto: TXT_LLEGADA.intro, botones: [{ texto: 'Subir a la camioneta', id: 'subir' }] });
  colocarPanel(panel);
  accionPanel = id => { if (id === 'subir') empezarLlegada(); };
}
function subirALaCamioneta() {
  conjunto.add(rig); rig.position.copy(ASIENTO_CHOFER); rig.rotation.y = -Math.PI / 2; yaw = 0; pitch = -0.05; aplicarMirada();
}
function bajarDeLaCamioneta() {
  escena.add(rig); rig.position.copy(POS_JUGADOR); rig.rotation.y = 0; yaw = 0.25; pitch = -0.08; aplicarMirada();
}
function empezarLlegada() {
  audio.reanudar(); if (!sonidoTurbina.isPlaying) sonidoTurbina.play();
  manejo.colocar(INICIO_LLEGADA.pos.x, INICIO_LLEGADA.pos.z, INICIO_LLEGADA.rumbo);
  subirALaCamioneta();
  llegada.empezar(); manejo.activo = true; panel.ocultar(); pausa = false;
  document.body.classList.add('jugando', 'manejando');
  document.getElementById('ayuda').textContent = 'W/S o ▲▼: acelerar y frenar · A/D o ◀▶: doblar · Quest: palanca izquierda acelera, derecha dobla';
}
function panelAvisoLlegada(tx) {
  manejo.activo = false; manejo.vel = 0; pausa = true;
  panel.mostrar({ eyebrow: 'Etapa 1 · Llegada al sector', borde: '#d32f2f', titulo: tx.titulo, texto: tx.texto, botones: [{ texto: 'Seguir manejando', id: 'seguir' }] });
  colocarPanel(panel);
  accionPanel = () => { panel.ocultar(); pausa = false; manejo.activo = true; };
}
function panelFinLlegada() {
  manejo.activo = false; manejo.vel = 0; pausa = true;
  const f = llegada.fin;
  panel.mostrar({ eyebrow: 'Etapa 1 · Llegada al sector', borde: '#2e9e5b', titulo: `${TXT_LLEGADA.llegada.titulo} · Nota ${f.nota}/100`,
    texto: [TXT_LLEGADA.llegada.texto, ...f.detalle.map(d => `· ${d.titulo}: ${d.texto}`)], botones: [{ texto: 'Bajar y controlar el sector', id: 'bajar' }] });
  colocarPanel(panel);
  accionPanel = () => { document.body.classList.remove('manejando'); panel.ocultar(); panelIntroCaminata(); };
}
function textoResultadoCompleto(nombre) {
  const t = mision.textoResultado(nombre);
  return t + (llegada.fin ? '\n\n' + llegada.textoResultado() : '') + (caminata.fin ? '\n\n' + caminata.textoResultado() : '');
}
function empezar() {
  audio.reanudar();
  if (!sonidoTurbina.isPlaying) sonidoTurbina.play();
  mision.empezar(); panel.ocultar(); pausa = false;
  document.body.classList.add('jugando');
}

let ordenActual = [];
function panelPregunta(id, avisoTexto) {
  const i = EVENTOS.findIndex(e => e.id === id), e = EVENTOS[i];
  ordenActual = [0, 1, 2].map(k => (k + i) % 3);
  panel.mostrar({
    eyebrow: `Situación ${i + 1} de ${EVENTOS.length}`, titulo: e.titulo, texto: e.pregunta,
    aviso: avisoTexto, botones: ordenActual.map(o => ({ texto: e.opciones[o], id: o, fuente: 30 })), altoBoton: 100,
  });
  colocarPanel(panel);
  accionPanel = opcion => {
    const r = mision.responder(opcion);
    if (!r) return;
    if (r.correcto) { audio.ok(); actores[id].retirar(); panelExplicacion(e, true); }
    else { audio.mal(); panelPregunta(id, 'No es lo indicado. ' + r.pista); }
  };
}
function panelExplicacion(e, bien) {
  pausa = true;
  panel.mostrar({
    eyebrow: bien ? 'Correcto' : 'No lo detectaste a tiempo', borde: bien ? '#2e9e5b' : '#d32f2f',
    titulo: e.titulo, texto: e.pista, botones: [{ texto: 'Seguir con la carga', id: 'seguir' }],
  });
  colocarPanel(panel);
  accionPanel = () => { panel.ocultar(); pausa = false; if (mision.fase === 'fin') panelFin(); };
}
function panelFin() {
  // 1) tablero corto; 2) despegue de celebración; 3) nota; 4) constancia
  pausa = true;
  avion.userData.ponerMotor(true);
  panel.mostrar({
    eyebrow: 'Carga terminada', titulo: 'Sector controlado. El avión sale a la misión.',
    texto: ['Carga completa. Tu compañero de apoyo va a desconectar la manguera de la válvula; recién después el avión rueda hacia la pista y despega.'],
    botones: [{ texto: 'Ver el despegue', id: 'despegue' }], altoBoton: 80,
  });
  colocarPanel(panel, 1.45, 0.02);
  accionPanel = () => { panel.ocultar(); desconexion.empezar(); };
}
function panelNota() {
  pausa = true; celebrando = false;
  const f = mision.fin;
  const lineas = f.detalle.filter(d => !d.ok).map(d => `· ${d.titulo}: ${d.texto}`).slice(0, 4);
  if (caminata.fin) lineas.unshift(`Etapa 2 (a pie): nota ${caminata.fin.nota}/100`);
  if (llegada.fin) lineas.unshift(`Etapa 1 (llegada): nota ${llegada.fin.nota}/100`);
  panel.mostrar({
    eyebrow: 'Misión cumplida', titulo: `Nota ${f.nota}/100`,
    texto: [`Detectaste ${f.detectados} de ${f.total} situaciones · ${f.sinErrores} sin errores.`, ...lineas],
    botones: [{ texto: 'Ver mi constancia', id: 'constancia' }, { texto: 'Volver a empezar', id: 'reiniciar', estilo: 'secundario' }], altoBoton: 76,
  });
  colocarPanel(panel, 1.45, 0.02);
  accionPanel = id => { if (id === 'constancia') panelConstancia(); else reiniciar(); };
  document.body.classList.add('fin');
  document.getElementById('resultado-texto').textContent = textoResultadoCompleto('');
}
function panelConstancia() {
  constancia.mostrar(datosConstancia());
  colocarPanel(constancia, 1.5, -0.05);
  panel.mostrar({ eyebrow: 'Constancia', titulo: 'Tu constancia de participación', texto: ['En PC o celular podés descargarla como imagen con el botón de abajo a la derecha.'],
    botones: [{ texto: 'Volver a empezar', id: 'reiniciar' }], altoBoton: 76 });
  panel.mesh.scale.set(0.62, 0.62, 1);
  colocarPanel(panel, 1.3, 0.62);
  accionPanel = () => { panel.mesh.scale.set(1, 1, 1); constancia.ocultar(); reiniciar(); };
}
function reiniciar() {
  for (const a of Object.values(actores)) { a.retirar(); if (a.obj.isGroup && a.fase !== undefined) { a.obj.visible = false; a.fase = 'oculto'; } }
  actores.piloto.retirar();
  mision.reset(); desconexion.reset(); despegue.reset(); constancia.ocultar(); celebrando = false; panel.mesh.scale.set(1, 1, 1); avion.userData.ponerMotor(true);
  caminata.reset(); marcaValvula.visible = marcaPuesto.visible = false; marcaTeleport.visible = false; if (renderer.xr.isPresenting) modoVR = null;
  llegada.reset(); manejo.activo = false; manejo.colocar(ESTACIONAMIENTO.pos.x, ESTACIONAMIENTO.pos.z, ESTACIONAMIENTO.rumbo); conjunto.userData.cisterna.rotation.y = 0.12;
  if (rig.parent !== escena) bajarDeLaCamioneta();
  document.body.classList.remove('fin', 'jugando', 'manejando');
  if (renderer.xr.isPresenting && !modoVR) panelModoVR(() => panelIntro()); else panelIntro();
}

// ---------- Selección: mouse / dedo / controles
const ray = new THREE.Raycaster();
function objetivos() {
  if (panel.mesh.visible) return [panel.mesh];
  return mision.activos.map(id => actores[id].hit);
}
function probar(origen, direccion, elegir) {
  ray.set(origen, direccion); ray.far = 60;
  const hits = ray.intersectObjects(objetivos(), false);
  if (!hits.length) { if (panel.mesh.visible) panel.setHover(-1); return false; }
  const h = hits[0];
  if (h.object === panel.mesh) {
    const b = panel.botonEn(h.uv); panel.setHover(b);
    if (elegir && b >= 0) { const id = panel.idBoton(b); accionPanel && accionPanel(id); }
    return true;
  }
  if (elegir) {
    const id = mision.activos.find(k => actores[k].hit === h.object);
    if (id && mision.detectar(id)) { audio.aviso(); panelPregunta(id); }
  }
  return true;
}

// Mouse y táctil: arrastrar para mirar, tocar sin arrastrar para elegir
const puntero = new THREE.Vector2(); let arrastre = null;
renderer.domElement.addEventListener('pointerdown', e => { arrastre = { x: e.clientX, y: e.clientY, yaw, pitch, movio: false }; renderer.domElement.setPointerCapture(e.pointerId); });
renderer.domElement.addEventListener('pointermove', e => {
  puntero.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (arrastre) {
    const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
    if (Math.hypot(dx, dy) > 6) arrastre.movio = true;
    if (arrastre.movio) { yaw = arrastre.yaw + dx * 0.004; pitch = THREE.MathUtils.clamp(arrastre.pitch + dy * 0.003, -1.2, 1.0); aplicarMirada(); }
  }
});
renderer.domElement.addEventListener('pointerup', e => {
  if (arrastre && !arrastre.movio) { puntero.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(puntero, camara); probar(ray.ray.origin.clone(), ray.ray.direction.clone(), true); }
  arrastre = null;
});
addEventListener('keydown', e => { if (caminata.fase === 'valvula' || caminata.fase === 'puesto') return; if (e.key === 'ArrowLeft') { yaw += 0.2; aplicarMirada(); } if (e.key === 'ArrowRight') { yaw -= 0.2; aplicarMirada(); } });

// Controles del Quest
const controles = [0, 1].map(i => {
  const c = renderer.xr.getController(i); rig.add(c);
  const linea = new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(0, 0, 0), V(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0x29b6f6 }));
  linea.scale.z = 8; c.add(linea);
  const punta = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshBasicMaterial({ color: 0x29b6f6 })); c.add(punta);
  c.addEventListener('select', () => { const { o, d } = rayoDe(c); if (!probar(o, d, true) && puntoTeleport && modoVR === 'teleport' && caminataActiva()) teleportar(puntoTeleport); });
  c.addEventListener('connected', ev => { c.userData.fuente = ev.data; });
  return c;
});
function rayoDe(c) {
  const m = new THREE.Matrix4().extractRotation(c.matrixWorld);
  return { o: new THREE.Vector3().setFromMatrixPosition(c.matrixWorld), d: V(0, 0, -1).applyMatrix4(m).normalize() };
}
let giroListo = true;
function giroConPalanca() {
  for (const c of controles) {
    const gp = c.userData.fuente?.gamepad; if (!gp) continue;
    const x = gp.axes[2] ?? 0;
    if (Math.abs(x) > 0.7 && giroListo) {
      giroListo = false;
      const cabeza = camara.getWorldPosition(new THREE.Vector3());
      rig.position.sub(cabeza).applyAxisAngle(V(0, 1, 0), -Math.sign(x) * Math.PI / 4).add(cabeza);
      rig.rotation.y -= Math.sign(x) * Math.PI / 4;
    }
    if (Math.abs(x) < 0.3) giroListo = true;
  }
}

// Entrar en VR
const botonVR = document.getElementById('entrar-vr');
if (navigator.xr) navigator.xr.isSessionSupported('immersive-vr').then(ok => { if (ok) botonVR.hidden = false; });
botonVR.addEventListener('click', async () => {
  const s = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] });
  camara.position.set(0, 0, 0); camara.rotation.set(0, 0, 0);
  await renderer.xr.setSession(s);
  audio.reanudar();
  s.addEventListener('end', () => { camara.position.y = 1.65; aplicarMirada(); rig.rotation.y = 0; rig.position.copy(POS_JUGADOR); });
  setTimeout(() => { if (!modoVR) { const anterior = panel.mesh.visible && panel.datos ? { ...panel.datos } : null, accionAnterior = accionPanel; panelModoVR(() => { if (mision.fase === 'intro' && llegada.fase === 'intro' && caminata.fase === 'intro') panelIntro(); else if (anterior) { panel.mostrar(anterior); colocarPanel(panel); pausa = true; accionPanel = accionAnterior; } }); } else if (panel.mesh.visible) colocarPanel(panel); }, 400);
});
document.getElementById('empezar-pc').addEventListener('click', () => { if (mision.fase === 'intro') empezar(); });
{ // mandos táctiles para celular
  const m = { acel: 0, dir: 0 };
  for (const b of document.querySelectorAll('#mandos button')) {
    const [k, v] = b.dataset.m.split(':');
    const on = e => { e.preventDefault(); m[k] = +v; entrada.setTactil(m.acel, m.dir); };
    const off = e => { e.preventDefault(); m[k] = 0; entrada.setTactil(m.acel, m.dir); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
  }
}
document.getElementById('salir').addEventListener('click', () => panelPausa());
// Menú de pausa: ✕ en pantalla, tecla Esc en PC, botón B o Y del control en el Quest
let enPausaMenu = false;
function panelPausa() {
  if (enPausaMenu) return;
  const enIntro = mision.fase === 'intro' && llegada.fase === 'intro' && caminata.fase === 'intro';
  if (enIntro && !renderer.xr.isPresenting) return;
  const anterior = panel.mesh.visible && panel.datos ? { ...panel.datos } : null, accionAnterior = accionPanel, pausaAnterior = pausa;
  enPausaMenu = true; pausa = true;
  const botones = [{ texto: 'Seguir', id: 'seguir' }];
  if (!enIntro) botones.push({ texto: 'Volver al inicio', id: 'inicio' });
  if (renderer.xr.isPresenting) botones.push({ texto: 'Salir de la realidad virtual', id: 'salirvr' });
  panel.mostrar({ eyebrow: 'Pausa', titulo: 'Juego en pausa', texto: [enIntro ? 'Podés salir del visor y seguir en la pantalla de la PC.' : 'El reloj está detenido. ¿Qué querés hacer?'], botones, altoBoton: 74 });
  colocarPanel(panel);
  accionPanel = id => {
    enPausaMenu = false;
    if (id === 'seguir') { if (anterior) { panel.mostrar(anterior); colocarPanel(panel); pausa = pausaAnterior; accionPanel = accionAnterior; } else { panel.ocultar(); pausa = false; accionPanel = accionAnterior; } }
    else if (id === 'inicio') { panel.mesh.scale.set(1, 1, 1); constancia.ocultar(); reiniciar(); }
    else if (id === 'salirvr') { const ses = renderer.xr.getSession(); panel.mesh.scale.set(1, 1, 1); constancia.ocultar(); panel.ocultar(); if (ses) ses.end().then(() => reiniciar()); else reiniciar(); }
  };
}
addEventListener('keydown', e => { if (e.key === 'Escape') panelPausa(); });
let botonMenuListo = true;
function botonMenuVR() {
  let apretado = false;
  for (const c of controles) { const gp = c.userData.fuente?.gamepad; if (gp && gp.buttons[5]?.pressed) apretado = true; }
  if (apretado && botonMenuListo) { botonMenuListo = false; panelPausa(); }
  if (!apretado) botonMenuListo = true;
}
document.getElementById('descargar').addEventListener('click', () => { constancia.dibujar(datosConstancia()); constancia.descargar(); });
document.getElementById('copiar').addEventListener('click', async () => {
  const txt = textoResultadoCompleto(document.getElementById('alumno').value.trim());
  try { await navigator.clipboard.writeText(txt); document.getElementById('copiar').textContent = 'Copiado ✓'; } catch { }
  document.getElementById('resultado-texto').textContent = txt;
});

// ---------- Bucle
const reloj = new THREE.Clock();
const hud = document.getElementById('hud-tiempo');
renderer.setAnimationLoop(() => {
  const dt = Math.min(reloj.getDelta(), 0.05);
  avion.userData.actualizar(dt);
  ambiente.actualizar(dt);
  let textoDespegue = null;
  if (desconexion.activa) textoDespegue = desconexion.actualizar(dt);
  if (celebrando) {
    textoDespegue = despegue.actualizar(dt);
    if (!renderer.xr.isPresenting && !arrastre) { // en PC/celular la cámara sigue al avión
      const p = avion.getWorldPosition(new THREE.Vector3()), c = camara.getWorldPosition(new THREE.Vector3());
      const yawO = Math.atan2(-(p.x - c.x), -(p.z - c.z)), pitchO = Math.atan2(p.y + 1 - c.y, Math.hypot(p.x - c.x, p.z - c.z));
      let dy = yawO - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); yaw += dy * Math.min(1, dt * 2.5); pitch += (pitchO - pitch) * Math.min(1, dt * 2.5); aplicarMirada();
    }
    if (despegue.terminado) panelNota();
  }
  marcaValvula.userData.actualizar(dt); marcaPuesto.userData.actualizar(dt);
  if ((caminata.fase === 'valvula' || caminata.fase === 'puesto') && !pausa) {
    caminar(dt);
    const pos = camara.getWorldPosition(new THREE.Vector3()); pos.y = 0;
    for (const s of caminata.avanzar(dt, pos)) {
      if (s.tipo === 'rojo') { audio.mal(); panelAvisoCaminata(TXT_CAMINATA.rojo, true); }
      if (s.tipo === 'naranja') { audio.mal(); panelAvisoCaminata(TXT_CAMINATA.naranja, true); }
      if (s.tipo === 'amarillo') { audio.aviso(); panelAvisoCaminata(TXT_CAMINATA.amarillo, false); }
      if (s.tipo === 'valvula') { audio.ok(); panelValvula(); }
      if (s.tipo === 'puesto') { audio.ok(); panelFinCaminata(); }
    }
  }
  if (llegada.fase === 'manejo' && !pausa) {
    const { acel, dir } = entrada.leer(renderer.xr.isPresenting ? controles : []);
    manejo.acelerador = acel; manejo.direccion = dir; manejo.actualizar(dt);
    if (conjunto.userData.volante) conjunto.userData.volante.rotation.z = -manejo.giro * 2.5;
    for (const s of llegada.avanzar(dt, manejo.estado())) {
      if (s.tipo === 'rojo') { audio.mal(); panelAvisoLlegada(TXT_LLEGADA.rojo); }
      if (s.tipo === 'frente') { audio.mal(); panelAvisoLlegada(TXT_LLEGADA.frente); }
      if (s.tipo === 'llegada') { audio.ok(); panelFinLlegada(); }
    }
  }
  for (const a of Object.values(actores)) a.actualizar(dt);
  if (!pausa && mision.fase === 'carga') {
    for (const s of mision.avanzar(dt)) {
      if (s.tipo === 'aparece') actores[s.id].aparecer();
      if (s.tipo === 'vencido') { actores[s.id].retirar(); audio.mal(); panelExplicacion(EVENTOS.find(e => e.id === s.id), false); }
    }
    if (mision.fase === 'fin' && !panel.mesh.visible) panelFin();
  }
  const resueltos = EVENTOS.filter(e => ['resuelto', 'vencido'].includes(mision.registro[e.id].estado)).length;
  const t = Math.floor(mision.t), mm = String(Math.floor(t / 60)).padStart(2, '0'), ss = String(t % 60).padStart(2, '0');
  hud.textContent = textoDespegue ? `Despegue · ${textoDespegue}` : (caminata.fase === 'valvula' || caminata.fase === 'puesto') ? `A pie · zona ${caminata.zona} · ${Math.floor(caminata.t)} s` : llegada.fase === 'manejo' ? `Llegada · ${Math.round(Math.abs(manejo.vel) * 3.6)} km/h · ${Math.floor(llegada.t)} s` : `Carga ${mm}:${ss} · Situaciones ${resueltos}/${EVENTOS.length}`;
  if (renderer.xr.isPresenting) {
    botonMenuVR();
    if (llegada.fase !== 'manejo') { if (modoVR === 'suave') giroSuave(dt); else giroConPalanca(); }
    apuntarPiso();
    // en VR el giro se hace con la palanca derecha; al caminar, la cabeza define la dirección
    if (panel.mesh.visible) { let algo = false; for (const c of controles) { const { o, d } = rayoDe(c); algo = probar(o, d, false) || algo; } if (!algo) panel.setHover(-1); }
  } else if (panel.mesh.visible && !arrastre) { ray.setFromCamera(puntero, camara); probar(ray.ray.origin.clone(), ray.ray.direction.clone(), false); }
  renderer.render(escena, camara);
});
addEventListener('resize', () => { camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

panelIntro();
window.__juego = { desconexion, mision, actores, panel, camara, empezar, probar, EVENTOS, llegada, manejo, entrada, empezarLlegada, conjunto, rig, caminata, empezarCaminata, posAcople, despegue, constancia, panelFin, panelNota, panelConstancia, avion, accion: id => accionPanel && accionPanel(id),
  mirar(p) { const c = camara.getWorldPosition(new THREE.Vector3()); yaw = Math.atan2(-(p.x - c.x), -(p.z - c.z)); pitch = Math.atan2(p.y - c.y, Math.hypot(p.x - c.x, p.z - c.z)); aplicarMirada(); camara.updateMatrixWorld(); } };
