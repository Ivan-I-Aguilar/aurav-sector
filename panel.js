// Tablero 3D dibujado en canvas. Sirve igual en PC, celular y visor: se apunta con el rayo
// (mouse, dedo o control del Quest) y se elige un botón por coordenadas UV.
import * as THREE from './three.module.js';

const AZUL = '#082440', ACENTO = '#29b6f6', ROJO = '#d32f2f', VERDE = '#2e9e5b';

function envolver(g, texto, ancho) {
  const palabras = texto.split(' '), lineas = []; let l = '';
  for (const p of palabras) { const prueba = l ? l + ' ' + p : p; if (g.measureText(prueba).width > ancho && l) { lineas.push(l); l = p; } else l = prueba; }
  if (l) lineas.push(l); return lineas;
}

export class Panel {
  constructor(anchoM = 1.3, altoM = 0.86) {
    this.W = 1200; this.H = Math.round(1200 * altoM / anchoM);
    this.cv = document.createElement('canvas'); this.cv.width = this.W; this.cv.height = this.H;
    this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(anchoM, altoM),
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false, fog: false, toneMapped: false }));
    this.mesh.renderOrder = 10; this.mesh.name = 'panel'; this.mesh.visible = false;
    this.botones = []; this.hover = -1; this.datos = null;
  }
  mostrar(datos) { this.datos = datos; this.hover = -1; this.dibujar(); this.mesh.visible = true; }
  ocultar() { this.mesh.visible = false; this.datos = null; this.botones = []; }
  dibujar() {
    const { g, W, H } = this, d = this.datos; if (!d) return;
    g.clearRect(0, 0, W, H);
    const r = 34;
    g.fillStyle = 'rgba(247,250,252,0.97)';
    g.beginPath(); g.roundRect(6, 6, W - 12, H - 12, r); g.fill();
    g.lineWidth = 6; g.strokeStyle = d.borde || ACENTO; g.stroke();
    let y = 70;
    if (d.eyebrow) { g.fillStyle = '#4a6a86'; g.font = '600 30px Arial'; g.fillText(d.eyebrow.toUpperCase(), 60, y); y += 56; }
    if (d.titulo) { g.fillStyle = AZUL; g.font = 'bold 50px Arial'; for (const l of envolver(g, d.titulo, W - 120)) { g.fillText(l, 60, y); y += 60; } y += 6; }
    if (d.texto) {
      g.fillStyle = '#23384d'; g.font = '34px Arial';
      for (const parr of [].concat(d.texto)) { for (const l of envolver(g, parr, W - 120)) { g.fillText(l, 60, y); y += 44; } y += 14; }
    }
    if (d.aviso) {
      g.fillStyle = d.avisoColor || ROJO; g.font = 'bold 32px Arial';
      for (const l of envolver(g, d.aviso, W - 120)) { g.fillText(l, 60, y); y += 42; } y += 10;
    }
    // botones abajo, apilados
    this.botones = [];
    const bs = d.botones || [], alto = d.altoBoton || 92, sep = 16;
    let by = H - 50 - bs.length * (alto + sep) + sep;
    bs.forEach((b, i) => {
      const x = 60, w = W - 120;
      const activo = i === this.hover;
      g.fillStyle = b.estilo === 'peligro' ? (activo ? '#b71c1c' : ROJO) : b.estilo === 'secundario' ? (activo ? '#d4e3ee' : '#e6eef4') : (activo ? '#0b3a66' : AZUL);
      g.beginPath(); g.roundRect(x, by, w, alto, 22); g.fill();
      if (activo) { g.lineWidth = 5; g.strokeStyle = ACENTO; g.stroke(); }
      g.fillStyle = b.estilo === 'secundario' ? AZUL : '#fff';
      g.font = `${b.negrita === false ? '' : 'bold '}${b.fuente || 32}px Arial`;
      const lineas = envolver(g, b.texto, w - 60);
      const lh = (b.fuente || 32) + 8, y0 = by + alto / 2 - (lineas.length - 1) * lh / 2 + 11;
      lineas.forEach((l, k) => g.fillText(l, x + 30, y0 + k * lh));
      this.botones.push({ x: x / W, y: by / H, w: w / W, h: alto / H, id: b.id ?? i });
      by += alto + sep;
    });
    this.tex.needsUpdate = true;
  }
  botonEn(uv) {
    const u = uv.x, v = 1 - uv.y;
    const i = this.botones.findIndex(b => u >= b.x && u <= b.x + b.w && v >= b.y && v <= b.y + b.h);
    return i;
  }
  setHover(i) { if (i !== this.hover) { this.hover = i; this.dibujar(); } }
  idBoton(i) { return this.botones[i]?.id; }
}
