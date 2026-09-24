// Etapa «Llegada al sector» — autoridad de la etapa 1.
// main.js informa dónde está la camioneta y obedece; acá se decide qué está mal y cuánto vale.
// Base: MOE Vol. I de AAXOD, 3.1.5: el vehículo se acerca al avión DESCRIBIENDO UN CÍRCULO, NUNCA DE FRENTE.
// Zonas del MOE 3.4 (ángulos de aproximación): adelante del avión está prohibido con el motor encendido.
// Lo que no está en el MOE (lugar de estacionamiento, distancia, velocidad) queda marcado «a validar».
import * as THREE from './three.module.js';

export const REGLAS = {
  radioZonaRoja: 11,        // igual que el diagrama pintado en el piso (crearZonas)
  anguloZonaRoja: 80,       // ± grados desde la nariz
  distFrente: 32,           // metros: más cerca que esto, ir apuntando al avión cuenta como «de frente»
  anguloFrente: 14,         // ± grados entre el rumbo y la dirección al avión
  tiempoFrente: 1.2,        // segundos sostenidos antes de contarlo
  radioEstacionar: 3.0,     // metros al punto de estacionamiento (A VALIDAR con AAXOD)
  velDetenido: 0.15,        // m/s para considerar detenida
  tiempoDetenido: 1.0,
};

export const TEXTOS = {
  intro: ['Sos el chofer del Equipo de Tierra. Traés la camioneta con la cisterna hasta el sector de carga. El avión está con el motor en marcha.',
    'MOE 3.1.5: el vehículo se acerca al avión describiendo un círculo, nunca de frente. Adelante del avión (zona roja) está prohibido.',
    'Estacioná en el rectángulo marcado, detrás del avión y de este lado, y frená del todo.'],
  rojo: { titulo: 'Entraste a la zona prohibida', texto: 'MOE 3.4: adelante del avión, con el motor encendido, no puede haber personas ni vehículos. Salí de la zona roja y rodeá el avión.' },
  frente: { titulo: 'Vas de frente al avión', texto: 'MOE 3.1.5: el vehículo se acerca describiendo un círculo, nunca de frente. Corregí el rumbo y acercate por el costado.' },
  llegada: { titulo: 'Camioneta estacionada', texto: 'Llegaste al sector rodeando el avión y sin entrar a la zona prohibida. Ahora bajás y tomás el control del sector.' },
};

export class Llegada {
  constructor(avion, destino) {
    this.avion = avion;                 // { pos: Vector3, rumbo: rad }  (+x nariz)
    this.destino = destino;             // Vector3 del centro del rectángulo de estacionamiento
    this.reset();
  }
  reset() {
    this.fase = 'intro';                // intro → manejo → fin
    this.t = 0;
    this.rojoDentro = false; this.entradasRojo = 0;
    this.frenteAcum = 0; this.frenteActivo = false; this.episodiosFrente = 0;
    this.detenidoAcum = 0;
    this.distMin = Infinity;
    this.fin = null;
  }
  empezar() { if (this.fase === 'intro') { this.fase = 'manejo'; this.t = 0; } }

  // estado = { pos: Vector3 (camioneta), rumbo: rad, vel: m/s }  → sucesos [{tipo:'rojo'|'frente'|'llegada'}]
  avanzar(dt, estado) {
    const s = [];
    if (this.fase !== 'manejo') return s;
    this.t += dt;
    const dx = estado.pos.x - this.avion.pos.x, dz = estado.pos.z - this.avion.pos.z;
    const dist = Math.hypot(dx, dz); this.distMin = Math.min(this.distMin, dist);
    // zona roja: cono adelante de la nariz
    const angDesdeNariz = Math.abs(THREE.MathUtils.radToDeg(anguloRel(Math.atan2(-dz, dx), this.avion.rumbo)));
    const enRojo = dist < REGLAS.radioZonaRoja && angDesdeNariz < REGLAS.anguloZonaRoja;
    if (enRojo && !this.rojoDentro) { this.entradasRojo++; s.push({ tipo: 'rojo' }); }
    this.rojoDentro = enRojo;
    // de frente: rumbo apuntando al avión, acercándose, a menos de distFrente
    const haciaAvion = Math.atan2(dz, -dx) ; // ángulo (convención rumbo: 0 = +x, positivo hacia -z) del vector camioneta→avión
    const dif = Math.abs(THREE.MathUtils.radToDeg(anguloRel(estado.rumbo, haciaAvion)));
    const deFrente = dist < REGLAS.distFrente && estado.vel > 0.5 && dif < REGLAS.anguloFrente;
    if (deFrente) { this.frenteAcum += dt; if (this.frenteAcum > REGLAS.tiempoFrente && !this.frenteActivo) { this.frenteActivo = true; this.episodiosFrente++; s.push({ tipo: 'frente' }); } }
    else { this.frenteAcum = 0; this.frenteActivo = false; }
    // llegada: dentro del rectángulo y detenida
    const dDest = Math.hypot(estado.pos.x - this.destino.x, estado.pos.z - this.destino.z);
    if (dDest < REGLAS.radioEstacionar && Math.abs(estado.vel) < REGLAS.velDetenido) { this.detenidoAcum += dt; if (this.detenidoAcum >= REGLAS.tiempoDetenido) { this.terminar(); s.push({ tipo: 'llegada' }); } }
    else this.detenidoAcum = 0;
    return s;
  }
  terminar() {
    this.fase = 'fin';
    let nota = 100;
    const detalle = [];
    if (this.entradasRojo) { nota -= 30 * this.entradasRojo; detalle.push({ titulo: 'Zona prohibida (adelante del avión)', texto: `${this.entradasRojo} ${this.entradasRojo > 1 ? 'entradas' : 'entrada'}`, ok: false }); }
    else detalle.push({ titulo: 'Zona prohibida (adelante del avión)', texto: 'no entró', ok: true });
    if (this.episodiosFrente) { nota -= 15 * this.episodiosFrente; detalle.push({ titulo: 'Aproximación de frente', texto: `${this.episodiosFrente} ${this.episodiosFrente > 1 ? 'veces' : 'vez'}`, ok: false }); }
    else detalle.push({ titulo: 'Aproximación en círculo', texto: 'correcta', ok: true });
    detalle.push({ titulo: 'Tiempo de llegada', texto: `${this.t.toFixed(0)} s`, ok: true });
    this.fin = { nota: Math.max(0, Math.round(nota)), detalle, tiempo: this.t };
    return this.fin;
  }
  textoResultado() {
    const f = this.fin; if (!f) return '';
    return [`Etapa 1 · Llegada al sector — Nota: ${f.nota}/100`, ...f.detalle.map(d => `  · ${d.titulo} — ${d.texto}`)].join('\n');
  }
}

// diferencia de ángulos en (-π, π]
function anguloRel(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d <= -Math.PI) d += 2 * Math.PI; return d; }
