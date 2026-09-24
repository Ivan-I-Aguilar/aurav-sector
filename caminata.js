// Etapa «Aproximación a pie» — autoridad de la etapa 2.
// El ET baja de la camioneta y camina hasta la válvula de carga respetando los ángulos de aproximación del MOE 3.4:
//   rojo (±80° adelante): prohibido con motor encendido · naranja (80–100°, a la altura del motor): solo personal autorizado
//   verde (100–150°): aproximación a la cabina · amarillo (150–210°, atrás): precaución, vientos fuertes (estela hasta 32 m).
// Después vuelve a su puesto junto a la puntera del ala (posición del ET: A VALIDAR con AAXOD).
import * as THREE from './three.module.js';

export const REGLAS = { radio: 11, rojo: 80, naranja: 100, verde: 150, radioLlegada: 1.6, radioPuesto: 1.4 };

export const TEXTOS = {
  intro: ['Bajaste de la camioneta. Ahora tenés que llegar caminando hasta la válvula de carga del avión, que está con el motor en marcha.',
    'MOE 3.4: adelante del avión (rojo) está prohibido; a la altura del motor (naranja) solo personal autorizado; la aproximación es por el sector verde; atrás (amarillo) hay que tener cuidado con el soplido de la hélice.',
    'Seguí el marcador hasta la válvula. Después volvé a tu puesto, junto a la puntera del ala.'],
  rojo: { titulo: 'Zona prohibida', texto: 'MOE 3.4: adelante del avión, con el motor encendido, no se puede estar. Retrocedé y rodeá por el sector verde.' },
  naranja: { titulo: 'A la altura del motor', texto: 'MOE 3.4: el sector naranja, a la altura del motor y la hélice, es solo para personal autorizado. Acercate por el sector verde.' },
  amarillo: { titulo: 'Detrás del avión', texto: 'MOE 3.4: atrás del avión hay vientos fuertes por la hélice, hasta unos 32 m. Se puede pasar, con precaución.' },
  valvula: { titulo: 'Llegaste a la válvula', texto: 'Conectás la manguera de la motobomba al acople de carga (los pasos de conexión no están en el MOE: a validar con AAXOD). Ahora volvé a tu puesto junto a la puntera del ala.' },
  puesto: { titulo: 'En tu puesto', texto: 'Desde acá ves todo el sector. Empieza la carga: sos responsable de lo que pase alrededor del avión.' },
};

export class Caminata {
  constructor(avion, valvula, puesto) {
    this.avion = avion;         // { pos: Vector3, rumbo: rad }
    this.valvula = valvula;     // Vector3 (mundo)
    this.puesto = puesto;       // Vector3 (mundo)
    this.reset();
  }
  reset() {
    this.fase = 'intro';        // intro → valvula → puesto → fin
    this.t = 0; this.zona = 'fuera';
    this.entradas = { rojo: 0, naranja: 0, amarillo: 0 };
    this.avisoAmarillo = false;
    this.fin = null;
  }
  empezar() { if (this.fase === 'intro') { this.fase = 'valvula'; this.t = 0; } }
  zonaDe(pos) {
    const dx = pos.x - this.avion.pos.x, dz = pos.z - this.avion.pos.z, d = Math.hypot(dx, dz);
    if (d > REGLAS.radio) return 'fuera';
    let a = Math.atan2(-dz, dx) - this.avion.rumbo; while (a > Math.PI) a -= 2 * Math.PI; while (a <= -Math.PI) a += 2 * Math.PI;
    const g = Math.abs(THREE.MathUtils.radToDeg(a));
    return g < REGLAS.rojo ? 'rojo' : g < REGLAS.naranja ? 'naranja' : g < REGLAS.verde ? 'verde' : 'amarillo';
  }
  // pos = posición del jugador (mundo) → sucesos [{tipo:'rojo'|'naranja'|'amarillo'|'valvula'|'puesto'}]
  avanzar(dt, pos) {
    const s = [];
    if (this.fase !== 'valvula' && this.fase !== 'puesto') return s;
    this.t += dt;
    const z = this.zonaDe(pos);
    if (z !== this.zona) {
      if (z === 'rojo' || z === 'naranja') { this.entradas[z]++; s.push({ tipo: z }); }
      if (z === 'amarillo' && !this.avisoAmarillo) { this.avisoAmarillo = true; this.entradas.amarillo++; s.push({ tipo: 'amarillo' }); }
      this.zona = z;
    }
    if (this.fase === 'valvula' && pos.distanceTo(this.valvula) < REGLAS.radioLlegada) { this.fase = 'puesto'; s.push({ tipo: 'valvula' }); }
    else if (this.fase === 'puesto' && Math.hypot(pos.x - this.puesto.x, pos.z - this.puesto.z) < REGLAS.radioPuesto) { this.terminar(); s.push({ tipo: 'puesto' }); }
    return s;
  }
  terminar() {
    this.fase = 'fin';
    let nota = 100; const d = [];
    const e = this.entradas;
    if (e.rojo) { nota -= 30 * e.rojo; d.push({ titulo: 'Zona prohibida (adelante)', texto: `${e.rojo} ${e.rojo > 1 ? 'entradas' : 'entrada'}`, ok: false }); } else d.push({ titulo: 'Zona prohibida (adelante)', texto: 'no entró', ok: true });
    if (e.naranja) { nota -= 15 * e.naranja; d.push({ titulo: 'Altura del motor (solo autorizados)', texto: `${e.naranja} ${e.naranja > 1 ? 'entradas' : 'entrada'}`, ok: false }); } else d.push({ titulo: 'Altura del motor (solo autorizados)', texto: 'no entró', ok: true });
    d.push({ titulo: 'Aproximación por el sector verde', texto: e.rojo || e.naranja ? 'con desvíos' : 'correcta', ok: !(e.rojo || e.naranja) });
    d.push({ titulo: 'Tiempo', texto: `${this.t.toFixed(0)} s`, ok: true });
    this.fin = { nota: Math.max(0, Math.round(nota)), detalle: d, tiempo: this.t };
    return this.fin;
  }
  textoResultado() {
    const f = this.fin; if (!f) return '';
    return [`Etapa 2 · Aproximación a pie — Nota: ${f.nota}/100`, ...f.detalle.map(x => `  · ${x.titulo} — ${x.texto}`)].join('\n');
  }
}
