// Manejo de la camioneta con cisterna: cinemática simple (modelo bicicleta) y articulación del tráiler.
// Entradas: acelerador [-1..1] (negativo = freno/marcha atrás) y dirección [-1..1] (positivo = izquierda).
// Convención de rumbo: rotation.y de Three.js; el vehículo avanza por su +x local.
import * as THREE from './three.module.js';

export const LIMITES = { velMax: 9, velMaxAtras: 3, acel: 3.2, freno: 6.5, rozamiento: 1.2, giroMax: THREE.MathUtils.degToRad(32), entreEjes: 3.15, lanzaTrailer: 3.0 };

export class Manejo {
  constructor(conjunto) {
    this.conjunto = conjunto;             // Group de la camioneta; la cisterna cuelga de userData.enganche
    this.cisterna = conjunto.userData.cisterna;
    this.vel = 0; this.giro = 0;
    this.acelerador = 0; this.direccion = 0;
    this.activo = false;
  }
  colocar(x, z, rumbo) {
    this.conjunto.position.set(x, 0, z); this.conjunto.rotation.y = rumbo;
    this.vel = 0; this.giro = 0; if (this.cisterna) this.cisterna.rotation.y = 0;
  }
  get rumbo() { return this.conjunto.rotation.y; }
  actualizar(dt) {
    if (!this.activo) return;
    const L = LIMITES;
    // dirección con retorno suave
    const giroObjetivo = this.direccion * L.giroMax;
    this.giro += (giroObjetivo - this.giro) * Math.min(1, dt * 6);
    // velocidad
    if (this.acelerador > 0.05) this.vel += L.acel * this.acelerador * dt;
    else if (this.acelerador < -0.05) { if (this.vel > 0.1) this.vel -= L.freno * -this.acelerador * dt; else this.vel -= L.acel * 0.6 * -this.acelerador * dt; }
    else this.vel -= Math.sign(this.vel) * Math.min(Math.abs(this.vel), L.rozamiento * dt);
    this.vel = THREE.MathUtils.clamp(this.vel, -L.velMaxAtras, L.velMax);
    // giro del vehículo (bicicleta) y avance
    const dTheta = this.vel / L.entreEjes * Math.tan(this.giro) * dt;
    const c = this.conjunto;
    const rumboAnterior = c.rotation.y;
    c.rotation.y += dTheta;
    c.position.x += Math.cos(c.rotation.y) * this.vel * dt;
    c.position.z -= Math.sin(c.rotation.y) * this.vel * dt;
    // tráiler: el ángulo relativo tiende a alinearse con el movimiento del enganche
    if (this.cisterna) {
      const rel = this.cisterna.rotation.y;               // ángulo tráiler respecto de la camioneta
      const dRel = -(this.vel / L.lanzaTrailer) * Math.sin(rel) * dt - dTheta;
      this.cisterna.rotation.y = THREE.MathUtils.clamp(rel + dRel, -1.2, 1.2);
    }
  }
  estado() { return { pos: this.conjunto.position, rumbo: this.rumbo, vel: this.vel }; }
}

// Lee teclado (PC) y palancas del Quest. Los botones táctiles se conectan desde main.js con setTactil.
export class Entrada {
  constructor() {
    this.teclas = new Set(); this.tactil = { acel: 0, dir: 0 };
    addEventListener('keydown', e => { this.teclas.add(e.key.toLowerCase()); });
    addEventListener('keyup', e => { this.teclas.delete(e.key.toLowerCase()); });
  }
  setTactil(acel, dir) { this.tactil.acel = acel; this.tactil.dir = dir; }
  // Palancas del Quest: zona muerta de 0,25 reescalada y respuesta cuadrática (fino cerca del centro)
  static palanca(v, zm = 0.25) { const a = Math.abs(v); if (a < zm) return 0; const r = (a - zm) / (1 - zm); return Math.sign(v) * r * r; }
  leer(controles) {
    let acel = 0, dir = 0;
    const t = this.teclas;
    if (t.has('w') || t.has('arrowup')) acel += 1; if (t.has('s') || t.has('arrowdown')) acel -= 1;
    if (t.has('a') || t.has('arrowleft')) dir += 1; if (t.has('d') || t.has('arrowright')) dir -= 1;
    acel += this.tactil.acel; dir += this.tactil.dir;
    for (const c of controles || []) {
      const gp = c.userData.fuente?.gamepad; if (!gp) continue;
      const mano = c.userData.fuente?.handedness;
      const x = gp.axes[2] ?? 0, y = gp.axes[3] ?? 0;
      const px = Entrada.palanca(x), py = Entrada.palanca(y);
      if (mano === 'left') { acel += -py; if (!controles.some(o => o.userData.fuente?.handedness === 'right')) dir += -px; }
      else dir += -px;
    }
    return { acel: THREE.MathUtils.clamp(acel, -1, 1), dir: THREE.MathUtils.clamp(dir, -1, 1) };
  }
  // Para caminar: adelante/atrás, desplazamiento lateral (solo palanca izquierda del Quest) y giro (PC/celular).
  leerCaminar(controles) {
    let adelante = 0, lateral = 0, giro = 0;
    const t = this.teclas;
    if (t.has('w') || t.has('arrowup')) adelante += 1; if (t.has('s') || t.has('arrowdown')) adelante -= 1;
    if (t.has('a')) lateral += 1; if (t.has('d')) lateral -= 1;
    if (t.has('arrowleft')) giro += 1; if (t.has('arrowright')) giro -= 1;
    adelante += this.tactil.acel; giro += this.tactil.dir;
    for (const c of controles || []) {
      const gp = c.userData.fuente?.gamepad; if (!gp || c.userData.fuente?.handedness !== 'left') continue;
      const x = gp.axes[2] ?? 0, y = gp.axes[3] ?? 0;
      adelante += -Entrada.palanca(y); lateral += -Entrada.palanca(x);
    }
    return { adelante: THREE.MathUtils.clamp(adelante, -1, 1), lateral: THREE.MathUtils.clamp(lateral, -1, 1), giro: THREE.MathUtils.clamp(giro, -1, 1) };
  }
}
