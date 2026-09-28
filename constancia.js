// Constancia de participación: se dibuja en un canvas (1600×1130), se muestra como cartel 3D en el visor
// y en PC/celular se puede descargar como PNG. Es un prototipo de demostración: no acredita habilitación.
import * as THREE from './three.module.js';

const AZUL = '#082440', BORDO = '#7a1230', GRIS = '#4a6a86', TINTA = '#1d2d3d';

function envolver(g, texto, ancho) {
  const out = []; let linea = '';
  for (const p of String(texto).split(' ')) { const t = linea ? linea + ' ' + p : p; if (g.measureText(t).width > ancho && linea) { out.push(linea); linea = p; } else linea = t; }
  if (linea) out.push(linea); return out;
}

export class Constancia {
  constructor() {
    this.W = 1600; this.H = 1130;
    this.cv = document.createElement('canvas'); this.cv.width = this.W; this.cv.height = this.H;
    this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.13),
      new THREE.MeshBasicMaterial({ map: this.tex, depthTest: false, fog: false, toneMapped: false }));
    this.mesh.renderOrder = 9; this.mesh.name = 'constancia'; this.mesh.visible = false;
    this.logo = null; const img = new Image(); img.onload = () => { this.logo = img; if (this.datos) this.dibujar(this.datos); }; img.src = './aurav-plano-aereo.webp';
    this.datos = null;
  }
  // datos: { nombre, etapas: [{ nombre, nota }], fecha }
  dibujar(datos) {
    this.datos = datos;
    const { g, W, H } = this;
    g.fillStyle = '#fbfcfd'; g.fillRect(0, 0, W, H);
    // marco doble
    g.lineWidth = 10; g.strokeStyle = AZUL; g.strokeRect(28, 28, W - 56, H - 56);
    g.lineWidth = 3; g.strokeStyle = BORDO; g.strokeRect(48, 48, W - 96, H - 96);
    // franjas bordó (guiño a la pintura del AT-802)
    g.fillStyle = BORDO; for (const [y, h] of [[92, 14], [112, 6], [124, 3]]) g.fillRect(70, y, W - 140, h);
    // logo
    if (this.logo) { const lw = 230, lh = lw * this.logo.height / this.logo.width; g.drawImage(this.logo, W - 90 - lw, 150, lw, lh); }
    g.textBaseline = 'alphabetic'; g.fillStyle = GRIS; g.font = '600 30px Arial'; g.fillText('AURAV · PLANO AÉREO  ·  PROTOTIPO DE DEMOSTRACIÓN', 90, 190);
    g.fillStyle = AZUL; g.font = 'bold 74px Arial'; g.fillText('Constancia de participación', 90, 280);
    g.fillStyle = TINTA; g.font = '36px Arial'; g.fillText('Juego «Control del sector» — carga de agua del AT-802', 90, 340);
    g.fillStyle = GRIS; g.font = '30px Arial'; g.fillText('Se deja constancia de que', 90, 430);
    g.fillStyle = AZUL; g.font = 'bold 64px Arial';
    const nombre = (datos.nombre || '').trim() || 'Integrante del Equipo de Tierra';
    g.fillText(nombre, 90, 505);
    g.fillStyle = TINTA; g.font = '32px Arial';
    const intro = 'completó las tres etapas del juego: llegada con la camioneta (MOE 3.1.5), aproximación a pie respetando las zonas (MOE 3.4) y control del sector durante la carga con motor en marcha.';
    let y = 565; for (const l of envolver(g, intro, W - 180)) { g.fillText(l, 90, y); y += 42; }
    // tabla de notas
    y += 20; const x0 = 90, w = W - 180, filas = datos.etapas;
    g.fillStyle = '#e9eff4'; g.fillRect(x0, y, w, 54); g.fillStyle = GRIS; g.font = '600 28px Arial'; g.fillText('ETAPA', x0 + 24, y + 37); g.fillText('NOTA', x0 + w - 200, y + 37); y += 54;
    g.font = '32px Arial';
    let suma = 0;
    for (const f of filas) { g.fillStyle = TINTA; g.fillText(f.nombre, x0 + 24, y + 40); g.fillStyle = f.nota >= 70 ? '#1f7a3f' : BORDO; g.font = 'bold 34px Arial'; g.fillText(`${f.nota} / 100`, x0 + w - 200, y + 40); g.font = '32px Arial'; g.strokeStyle = '#d5dee6'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y + 58); g.lineTo(x0 + w, y + 58); g.stroke(); y += 58; suma += f.nota; }
    const prom = filas.length ? Math.round(suma / filas.length) : 0;
    g.fillStyle = AZUL; g.font = 'bold 34px Arial'; g.fillText('Promedio', x0 + 24, y + 44); g.fillText(`${prom} / 100`, x0 + w - 200, y + 44); y += 70;
    // pie
    g.fillStyle = GRIS; g.font = '28px Arial'; g.fillText(`Fecha: ${datos.fecha}`, 90, Math.max(y + 45, H - 165));
    g.font = 'italic 25px Arial'; g.fillStyle = '#6b7c8c';
    const pie = 'Basado en el MOE Vol. I de AAXOD (AT8T rev. 2). Contenido a validar por la Dirección de Operaciones. Esta constancia documenta la práctica en un simulador de demostración y no acredita habilitación ni capacitación formal alguna.';
    y = H - 110; for (const l of envolver(g, pie, W - 180)) { g.fillText(l, 90, y); y += 31; }
    this.tex.needsUpdate = true;
  }
  mostrar(datos) { this.dibujar(datos); this.mesh.visible = true; }
  ocultar() { this.mesh.visible = false; }
  descargar(nombreArchivo = 'constancia-aurav.png') {
    this.cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = nombreArchivo; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }, 'image/png');
  }
}
