// Camioneta Nissan Frontier doble cabina y cisterna de combustible sobre tráiler de dos ejes.
// Modelos procedurales de la revisión 04 de ChatGPT (frontier.js, cisterna.js), integrados por AURAV.
// Ejes: +x adelante, +y arriba. Unidades en metros. La cisterna cuelga del enganche de la camioneta.
import * as THREE from './three.module.js';
import { crearFrontier } from './frontier.js';
import { crearCisterna } from './cisterna.js';
export { crearFrontier, crearCisterna };

export function crearConjunto({ anguloCisterna = 0 } = {}) {
  const camioneta = crearFrontier(); camioneta.name = 'conjunto-camioneta-cisterna';
  const cisterna = crearCisterna();
  camioneta.userData.enganche.add(cisterna);
  cisterna.rotation.y = anguloCisterna;
  camioneta.userData.cisterna = cisterna;
  // volante y columna del lado del chofer (izquierda, -z), para la etapa de manejo en primera persona
  const negro = new THREE.MeshStandardMaterial({ color: 0x1a1d20, roughness: 0.7 });
  const volante = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.02, 8, 24), negro); volante.position.set(0.42, 1.27, -0.42); volante.rotation.y = Math.PI / 2; volante.rotation.x = 0.35; camioneta.add(volante);
  const columna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), negro); columna.position.set(0.55, 1.2, -0.42); columna.rotation.z = -1.1; camioneta.add(columna);
  camioneta.userData.volante = volante;
  camioneta.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return camioneta;
}
