// AT-802 de AAXOD generado con Tripo a partir de las fotos del hangar (27/9/2026) y procesado por AURAV:
// sin barra de aspersión, escala real (envergadura 18,06 m), +x nariz, +z derecha, origen en el suelo entre las
// ruedas principales, actitud de tres puntos, hélice en un nodo 'helice', ~69.000 triángulos, textura 2K.
// Expone la misma API que el modelo procedural de at802.js: userData.ponerMotor / actualizar, y los anclajes
// 'acople-carga', 'acople-carga-derecho', 'cabina-piloto' y 'helice'.
import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js?v=20260928b';

// Anclajes en coordenadas del avión (metros). Válvulas: bajo la panza detrás de la tolva (fotos AAXOD 24/9).
const ANCLAJES = {
  'acople-carga': [-2.4, 0.72, -1.0],
  'acople-carga-derecho': [-2.4, 0.72, 1.0],
  'cabina-piloto': [-2.0, 2.15, 0],
};

function matricula(texto) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 192; const g = cv.getContext('2d');
  g.clearRect(0, 0, 1024, 192); g.fillStyle = '#2a2a2c'; g.font = 'bold 150px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texto, 512, 96, 960);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.4, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
}

export async function crearAT802GLB({ matricula: mat = 'AUR-AV', url = './at802.glb' } = {}) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const avion = new THREE.Group(); avion.name = 'AT-802';
  const modelo = gltf.scene; avion.add(modelo);
  modelo.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material) { o.material.roughness = 0.55; o.material.metalness = 0.05; } } });

  const helice = modelo.getObjectByName('helice');
  for (const [nombre, pos] of Object.entries(ANCLAJES)) { const a = new THREE.Object3D(); a.name = nombre; a.position.set(...pos); avion.add(a); }
  // matrícula a ambos lados del fuselaje trasero
  const mMat = matricula(mat);
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.24), mMat);
    m.position.set(-5.2, 1.75, s * 0.56); m.rotation.y = s > 0 ? Math.PI / 2 - 0.2 : -Math.PI / 2 + 0.2; m.rotation.x = s * 0.15; m.name = 'matricula'; avion.add(m);
  }
  // disco de hélice en marcha
  const disco = new THREE.Mesh(new THREE.CircleGeometry(1.45, 40), new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  disco.name = 'disco'; disco.visible = false;
  if (helice) { helice.add(disco); disco.position.set(0, 0, 0.02); }

  avion.userData.motor = false;
  avion.userData.ponerMotor = en => { avion.userData.motor = en; disco.visible = en; };
  avion.userData.actualizar = dt => { if (avion.userData.motor && helice) helice.rotation.z += dt * 40; };
  avion.userData.origen = 'tripo';
  return avion;
}
