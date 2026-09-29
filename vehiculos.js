// Camioneta Nissan Frontier doble cabina y cisterna de combustible sobre tráiler de dos ejes.
// Modelos procedurales de la revisión 04 de ChatGPT (frontier.js, cisterna.js), integrados por AURAV.
// Ejes: +x adelante, +y arriba. Unidades en metros. La cisterna cuelga del enganche de la camioneta.
import * as THREE from './three.module.js';
import { crearFrontier } from './frontier.js?v=20260929b';
import { crearCisterna } from './cisterna.js?v=20260929b';
export { crearFrontier, crearCisterna };

import { GLTFLoader } from './GLTFLoader.js?v=20260929b';
// Nissan D21 1997 (Sketchfab, MAXVERSTAPPEN2025, CC BY 4.0), reducida a 54k triángulos, blanca. Si no carga, la Frontier procedural.
async function crearD21() {
  const g = await new GLTFLoader().loadAsync('./d21.glb');
  const c = new THREE.Group(); c.add(g.scene); c.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const enganche = new THREE.Object3D(); enganche.name = 'enganche'; enganche.position.set(-2.55, 0.48, 0); c.add(enganche);
  c.userData.enganche = enganche; c.userData.asiento = [-0.05, -0.25, -0.42]; c.userData.modelo = 'd21';
  return c;
}
export async function crearConjunto({ anguloCisterna = 0 } = {}) {
  let camioneta; try { camioneta = await crearD21(); } catch (e) { console.warn('No se pudo cargar d21.glb, se usa la Frontier procedural', e); camioneta = crearFrontier(); }
  camioneta.name = 'conjunto-camioneta-cisterna';
  const cisterna = crearCisterna();
  camioneta.userData.enganche.add(cisterna);
  cisterna.rotation.y = anguloCisterna;
  camioneta.userData.cisterna = cisterna;
  // volante y columna del lado del chofer (izquierda, -z), para la etapa de manejo en primera persona
  // (la D21 de Sketchfab viene sin volante ni tablero: se agregan por código en el asiento del chofer)
  const d21 = camioneta.userData.modelo === 'd21';
  const negro = new THREE.MeshStandardMaterial({ color: 0x1a1d20, roughness: 0.7 });
  const px = d21 ? 0.52 : 0.42, py = d21 ? 1.04 : 1.27, pz = -0.42;
  const volante = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 24), negro); volante.position.set(px, py, pz); volante.rotation.y = Math.PI / 2; volante.rotation.x = 0.35; camioneta.add(volante);
  for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.025), negro); r.position.set(0, 0.075, 0); const rr = new THREE.Group(); rr.add(r); rr.rotation.x = k * Math.PI * 2 / 3; volante.add(rr); }
  const columna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), negro); columna.position.set(px + 0.13, py - 0.07, pz); columna.rotation.z = -1.1; camioneta.add(columna);
  if (d21) { const tablero = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 1.45), new THREE.MeshStandardMaterial({ color: 0x2b2e31, roughness: 0.85 })); tablero.position.set(px + 0.38, py + 0.02, 0); tablero.rotation.z = 0.25; camioneta.add(tablero);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const c = cv.getContext('2d'); c.fillStyle = '#111'; c.fillRect(0, 0, 256, 128); for (const x of [64, 192]) { c.strokeStyle = '#ddd'; c.lineWidth = 3; c.beginPath(); c.arc(x, 64, 44, 0, Math.PI * 2); c.stroke(); c.strokeStyle = '#e33'; c.beginPath(); c.moveTo(x, 64); c.lineTo(x + 20, 30); c.stroke(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const relojes = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.17), new THREE.MeshBasicMaterial({ map: t })); relojes.position.set(px + 0.2, py + 0.05, pz); relojes.rotation.y = -Math.PI / 2; relojes.rotation.x = -0.25; camioneta.add(relojes); }
  camioneta.userData.volante = volante;
  camioneta.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return camioneta;
}
