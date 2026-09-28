// Celebración final: el piloto saluda, el avión rueda por la calle de rodaje hasta la pista y despega.
// Cinemática simple sobre el escenario de escenario.js: calle de rodaje a lo largo de +x hasta la pista
// (x = 30), pista a lo largo de −z. Ejes del avión: +x nariz, +y arriba, +z derecha; heading 0 = +x.
import * as THREE from './three.module.js';

const X_PISTA = 30;      // eje de la pista
const RADIO = 8;         // radio del viraje para entrar a la pista
const V_RODAJE = 5;      // m/s
const V_ROTACION = 36;   // m/s: levanta la nariz
const V_DESPEGUE = 42;   // m/s: se despega
const ACEL = 6;          // m/s² en la carrera de despegue

export class Despegue {
  constructor(avion, piloto, { sonidoTurbina = null, manguera = null } = {}) {
    this.avion = avion; this.piloto = piloto; this.sonido = sonidoTurbina; this.manguera = manguera;
    this.reset();
  }
  reset() {
    this.fase = 'quieto'; this.t = 0; this.v = 0; this.rumbo = 0; this.cabeceo = 0; this.alabeo = 0; this.altura = 0; this.vy = 0;
    this.pos = new THREE.Vector3(0, 0, 0);
    this.avion.position.set(0, 0, 0); this.avion.rotation.set(0, 0, 0);
    if (this.manguera) this.manguera.visible = true;
    if (this.piloto) this.piloto.userData.seña = false;
  }
  empezar() {
    this.reset(); this.fase = 'saludo'; this.t = 0;
    this.avion.userData.ponerMotor(true);
    if (this.sonido && !this.sonido.isPlaying) this.sonido.play();
    if (this.piloto) this.piloto.userData.seña = true;
  }
  get terminado() { return this.fase === 'fin'; }
  // Devuelve un texto corto para el HUD (o null)
  actualizar(dt) {
    if (this.fase === 'quieto' || this.fase === 'fin') return null;
    this.t += dt;
    const a = this.avion;
    if (this.fase === 'saludo') {
      if (this.t > 2.2 && this.manguera) this.manguera.visible = false;       // el ET retira la manguera
      if (this.t > 3.5) { this.fase = 'rodaje'; if (this.piloto) this.piloto.userData.seña = false; }
    } else if (this.fase === 'rodaje') {
      this.v = Math.min(V_RODAJE, this.v + 1.5 * dt);
      if (this.pos.x >= X_PISTA - RADIO) this.fase = 'viraje';
    } else if (this.fase === 'viraje') {
      this.v = V_RODAJE;
      this.rumbo = Math.min(Math.PI / 2, this.rumbo + (this.v / RADIO) * dt);
      if (this.rumbo >= Math.PI / 2) { this.fase = 'carrera'; this.pos.x = X_PISTA; }
    } else if (this.fase === 'carrera') {
      this.v += ACEL * dt;
      if (this.v > V_ROTACION) this.cabeceo = Math.min(0.16, this.cabeceo + 0.12 * dt);
      if (this.v > V_DESPEGUE) { this.fase = 'vuelo'; this.t = 0; }
    } else if (this.fase === 'vuelo') {
      this.v = Math.min(60, this.v + 2 * dt);
      this.cabeceo = Math.min(0.2, this.cabeceo + 0.08 * dt);
      this.vy = Math.min(9, this.vy + 3 * dt);
      this.altura += this.vy * dt;
      if (this.t > 5) this.alabeo = Math.max(-0.35, this.alabeo - 0.15 * dt);      // se inclina hacia el incendio
      if (this.t > 5) this.rumbo += 0.04 * dt;
      if (this.t > 22 || this.altura > 260) { this.fase = 'fin'; if (this.sonido && this.sonido.isPlaying) this.sonido.stop(); }
    }
    // integrar
    this.pos.x += Math.cos(this.rumbo) * this.v * dt;
    this.pos.z -= Math.sin(this.rumbo) * this.v * dt;
    a.position.set(this.pos.x, this.altura, this.pos.z);
    a.rotation.set(this.alabeo, this.rumbo, this.cabeceo, 'YZX');
    // sonido: la turbina sube de vueltas en la carrera y se apaga con la distancia (PositionalAudio ya atenúa)
    if (this.sonido) this.sonido.setPlaybackRate(this.fase === 'carrera' || this.fase === 'vuelo' ? 1.25 : 1);
    return { saludo: 'El piloto te saluda: carga completa', rodaje: 'Rueda hacia la pista', viraje: 'Alinea con la pista', carrera: 'Carrera de despegue', vuelo: 'Sale hacia el incendio' }[this.fase] ?? null;
  }
}
