// Etapa «Control del sector» — la única autoridad del juego.
// main.js pregunta y obedece; acá se decide qué pasa, qué es correcto y cuánto vale.
// Contenido basado en el MOE Vol. I de AAXOD (Procedimientos Estándar de Operación AT8T).
// Todo texto que no sale literalmente del MOE está marcado como «a validar» en el documento del proyecto.

// En cada evento la opción correcta es SIEMPRE la primera (correct: 0); la interfaz rota el orden.
export const EVENTOS = [
  {
    id: 'brigadista', titulo: 'Brigadista hacia la hélice', cuando: 5,
    aviso: 'Alguien se acerca al avión por adelante.',
    pregunta: 'Un brigadista viene caminando hacia la nariz del avión para ofrecer ayuda. El motor está en marcha. ¿Qué hacés?',
    opciones: [
      'Lo freno antes de que entre al sector y lo alejo del frente del avión',
      'Lo dejo pasar: es personal de apoyo al incendio',
      'Le hago señas al piloto para que corte el motor'],
    pista: 'MOE 3.4 y 2.x: el ET no permite que personal ajeno se acerque durante la carga. Adelante de la hélice es zona prohibida con motor encendido.',
  },
  {
    id: 'celular', titulo: 'Te suena el celular', cuando: 15,
    aviso: 'Te está sonando el celular.',
    pregunta: 'En plena carga te suena el celular. ¿Qué hacés?',
    opciones: [
      'No lo atiendo: durante la carga está prohibido usarlo',
      'Atiendo rápido, puede ser algo de la operación',
      'Miro quién es sin dejar de trabajar'],
    pista: 'MOE 3.4: durante el reabastecimiento está totalmente prohibido usar el celular o cualquier elemento que distraiga.',
  },
  {
    id: 'bolsa', titulo: 'Objeto suelto', cuando: 25,
    aviso: 'Algo se mueve con el viento cerca del ala.',
    pregunta: 'Una bolsa de nailon se vuela cerca del ala, hacia adelante del avión. ¿Qué hacés?',
    opciones: [
      'La retiro y la aseguro para que no vuelva al sector',
      'La dejo: la hélice la va a despedir',
      'Espero a que termine la carga para juntarla'],
    pista: 'MOE 3.4: el ET verifica que ningún elemento se haya desplazado y pueda ser una amenaza. Mantener el sector limpio y ordenado.',
  },
  {
    id: 'periodista', titulo: 'Periodista en el sector', cuando: 36,
    aviso: 'Alguien con una cámara viene desde atrás tuyo.',
    pregunta: 'Un periodista entra al sector y te pide una nota sobre el incendio. ¿Qué hacés?',
    opciones: [
      'No doy notas y lo acompaño fuera del sector de operaciones',
      'Le doy una nota corta mientras sigue la carga',
      'Le pido que espere al lado de la cisterna'],
    pista: 'MOE 4.3: el ET no brinda notas periodísticas. MOE 3.4: nadie ajeno a la operación se acerca durante la carga.',
  },
  {
    id: 'piloto', titulo: 'Seña del piloto', cuando: 46,
    aviso: 'El piloto te está haciendo una seña.',
    pregunta: 'Desde la cabina, el piloto te hace una seña con la mano. ¿Qué hacés?',
    opciones: [
      'Lo miro y atiendo su indicación',
      'Sigo con la manguera; si es importante va a insistir',
      'Me acerco a la cabina por adelante del ala para escucharlo'],
    pista: 'MOE 3.4: el ET tiene que estar atento a cualquier directiva visual del piloto. Nunca acercarse por adelante: zona prohibida.',
  },
  {
    id: 'curioso', titulo: 'Persona detrás de la cola', cuando: 57,
    aviso: 'Alguien cruza por detrás del avión.',
    pregunta: 'Un vecino que miraba la operación camina por detrás de la cola, a pocos metros. ¿Qué hacés?',
    opciones: [
      'Lo alejo: atrás del avión está el soplido de la hélice y es parte del sector',
      'No pasa nada: atrás del avión no hay peligro',
      'Le pido que se quede ahí quieto hasta que despegue'],
    pista: 'MOE 3.4 (ángulos de aproximación): detrás del avión es zona de precaución por vientos fuertes, hasta unos 32 m. Y nadie ajeno a la operación en el sector.',
  },
  {
    id: 'bombero', titulo: 'Bombero con ganas de ayudar', cuando: 67,
    aviso: 'Un bombero se mete debajo del ala.',
    pregunta: 'Un bombero quiere ayudarte con la manguera y se mete debajo del ala, hacia la raíz. ¿Qué hacés?',
    opciones: [
      'Lo detengo y coordino yo qué hace y por dónde, lejos del motor',
      'Acepto la ayuda: sabe trabajar con mangueras',
      'Le doy la manguera y voy a controlar la motobomba'],
    pista: 'MOE (responsabilidades del ET): coordina y controla al personal ajeno que asiste la carga. Muchos no están capacitados para trabajar cerca de una hélice en movimiento.',
  },
  {
    id: 'radio', titulo: 'Llamado del Coordinador', cuando: 78,
    aviso: 'Te llaman por la radio.',
    pregunta: 'Te llama el Coordinador del incendio para preguntarte cuándo sale el avión. ¿Qué hacés?',
    opciones: [
      'Le digo que se comunique con el piloto: es el único que coordina con él',
      'Le paso la estimación de salida yo mismo',
      'Le contesto después de la carga'],
    pista: 'MOE: la única persona autorizada para comunicarse y coordinar las cuestiones operativas con el Coordinador es el piloto.',
  },
];

const T_LIMITE = 15;   // segundos para detectar un evento antes de que cuente como «no detectado»
const T_RAPIDO = 8;    // detectado en menos de esto: reacción a tiempo

export class Mision {
  constructor() { this.reset(); }
  reset() {
    this.fase = 'intro';          // intro → carga → pregunta → fin
    this.t = 0;
    this.activos = [];            // ids en curso (visibles, sin detectar)
    this.registro = Object.fromEntries(EVENTOS.map(e => [e.id, { estado: 'pendiente', errores: 0, reaccion: null, inicio: null }]));
    this.abierto = null;          // evento con la pregunta abierta
    this.fin = null;
    this.alumno = '';
  }
  empezar() { if (this.fase === 'intro') { this.fase = 'carga'; this.t = 0; } }
  // Devuelve una lista de sucesos para que la interfaz reaccione: {tipo:'aparece'|'vencido', id}
  avanzar(dt) {
    const sucesos = [];
    if (this.fase !== 'carga') return sucesos;
    this.t += dt;
    for (const e of EVENTOS) {
      const r = this.registro[e.id];
      if (r.estado === 'pendiente' && this.t >= e.cuando) { r.estado = 'activo'; r.inicio = this.t; this.activos.push(e.id); sucesos.push({ tipo: 'aparece', id: e.id }); }
      if (r.estado === 'activo' && this.t - r.inicio > T_LIMITE) {
        r.estado = 'vencido'; this.activos = this.activos.filter(x => x !== e.id); sucesos.push({ tipo: 'vencido', id: e.id });
      }
    }
    if (this.activos.length === 0 && EVENTOS.every(e => ['resuelto', 'vencido'].includes(this.registro[e.id].estado))) this.terminar();
    return sucesos;
  }
  detectar(id) {
    if (this.fase !== 'carga' || !this.activos.includes(id)) return false;
    const r = this.registro[id]; r.reaccion = this.t - r.inicio;
    this.abierto = id; this.fase = 'pregunta';
    return true;
  }
  responder(indice) {
    if (this.fase !== 'pregunta') return null;
    const e = EVENTOS.find(x => x.id === this.abierto), r = this.registro[e.id];
    if (indice === 0) {
      r.estado = 'resuelto'; this.activos = this.activos.filter(x => x !== e.id);
      this.abierto = null; this.fase = 'carga';
      return { correcto: true, id: e.id };
    }
    r.errores++;
    return { correcto: false, id: e.id, pista: e.pista };
  }
  terminar() {
    this.fase = 'fin';
    let nota = 100;
    const detalle = EVENTOS.map(e => {
      const r = this.registro[e.id];
      let texto;
      if (r.estado === 'vencido') { nota -= 15; texto = 'no detectado'; }
      else {
        nota -= 6 * r.errores;
        if (r.reaccion > T_RAPIDO) nota -= 4;
        texto = (r.errores ? `${r.errores} error${r.errores > 1 ? 'es' : ''}` : 'correcto') + ` · reacción ${r.reaccion.toFixed(1)} s`;
      }
      return { titulo: e.titulo, texto, ok: r.estado === 'resuelto' && !r.errores };
    });
    this.fin = { nota: Math.max(0, Math.round(nota)), detalle, tiempo: this.t,
      detectados: EVENTOS.filter(e => this.registro[e.id].estado === 'resuelto').length,
      sinErrores: detalle.filter(d => d.ok).length, total: EVENTOS.length };
    return this.fin;
  }
  textoResultado(nombre) {
    const f = this.fin; if (!f) return '';
    const fecha = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    return [
      'AURAV · Control del sector — carga de agua AT-802 (prototipo de demostración)', '',
      `Alumno: ${nombre || '—'}`, `Fecha: ${fecha}`, '',
      `Situaciones detectadas: ${f.detectados} de ${f.total}`,
      `Resueltas sin errores: ${f.sinErrores} de ${f.total}`,
      `Nota: ${f.nota}/100`, '',
      'Detalle:', ...f.detalle.map((d, i) => `  ${String(i + 1).padStart(2, '0')} · ${d.titulo} — ${d.texto}`),
    ].join('\n');
  }
}
