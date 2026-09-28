// Camioneta Nissan Frontier doble cabina y cisterna de combustible sobre tráiler de dos ejes.
// Modelos procedurales de la revisión 04 de ChatGPT (frontier.js, cisterna.js), integrados por AURAV.
// Ejes: +x adelante, +y arriba. Unidades en metros. La cisterna cuelga del enganche de la camioneta.
import * as THREE from './three.module.js';
import { crearFrontier } from './frontier.js';
import { crearCisterna } from './cisterna.js';
export { crearFrontier, crearCisterna };

import { GLTFLoader } from './GLTFLoader.js';
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
  if (camioneta.userData.modelo === 'd21') return camioneta;   // la D21 ya trae volante e interior
  const negro = new THREE.MeshStandardMaterial({ color: 0x1a1d20, roughness: 0.7 });
  const volante = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 24), negro); volante.position.set(0.42, 1.27, -0.42); volante.rotation.y = Math.PI / 2; volante.rotation.x = 0.35; camioneta.add(volante);
  const columna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), negro); columna.position.set(0.55, 1.2, -0.42); columna.rotation.z = -1.1; camioneta.add(columna);
  camioneta.userData.volante = volante;
  camioneta.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return camioneta;
}
