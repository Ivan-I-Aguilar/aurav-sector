// Personas low-poly con caminata simple. Modelos propios en código (AURAV).
import * as THREE from './three.module.js';

const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...e });

export const ATUENDOS = {
  brigadista: { torso: 0xe8a317, piernas: 0x3b4a2f, casco: 0xf2c200, reflectivo: true },
  bombero: { torso: 0x2a2a2a, piernas: 0x2a2a2a, casco: 0xd11f1f, reflectivo: true },
  periodista: { torso: 0x3c5a8a, piernas: 0x2b2f38, casco: null, camara: true },
  vecino: { torso: 0x8b5a3c, piernas: 0x4a4a55, casco: null, gorra: 0x2d5a8a },
  et: { torso: 0x1f3f8f, piernas: 0x2b2f38, casco: null, gorra: 0x1f3f8f, reflectivo: true },
};

export function crearPersona(tipo = 'vecino') {
  const a = ATUENDOS[tipo];
  const p = new THREE.Group(); p.name = 'persona-' + tipo;
  const piel = mat(0xc99a7a);
  const mTorso = mat(a.torso), mPiernas = mat(a.piernas), mCalzado = mat(0x1d1a17);

  const cadera = new THREE.Group(); cadera.position.y = 0.92; p.add(cadera);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.42, 4, 10), mTorso);
  torso.scale.z = 0.7; torso.position.y = 0.33; cadera.add(torso);
  if (a.reflectivo) {
    for (const y of [0.2, 0.42]) {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.195, 0.195, 0.05, 14, 1, true), mat(0xd9e0d0, { emissive: 0x555555, roughness: 0.3 }));
      f.scale.z = 0.72; f.position.y = y; cadera.add(f);
    }
  }
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 10), piel);
  cabeza.position.y = 0.8; cadera.add(cabeza);
  if (a.casco) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(a.casco, { roughness: 0.4 }));
    c.position.y = 0.83; cadera.add(c);
    const ala = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.015, 16), mat(a.casco, { roughness: 0.4 })); ala.position.y = 0.83; cadera.add(ala);
  }
  if (a.gorra) {
    const g = new THREE.Mesh(new THREE.SphereGeometry(0.125, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(a.gorra)); g.position.y = 0.85; cadera.add(g);
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 0.12), mat(a.gorra)); v.position.set(0.12, 0.86, 0); cadera.add(v);
  }
  const brazo = lado => {
    const hombro = new THREE.Group(); hombro.position.set(0, 0.62, lado * 0.23); cadera.add(hombro);
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.5, 3, 8), mTorso); b.position.y = -0.28; hombro.add(b);
    const mano = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), piel); mano.position.y = -0.58; hombro.add(mano);
    return hombro;
  };
  const brazos = [brazo(1), brazo(-1)];
  const pierna = lado => {
    const art = new THREE.Group(); art.position.set(0, 0, lado * 0.1); cadera.add(art);
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.72, 3, 8), mPiernas); l.position.y = -0.44; art.add(l);
    const z = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.1), mCalzado); z.position.set(0.05, -0.88, 0); art.add(z);
    return art;
  };
  const piernas = [pierna(1), pierna(-1)];
  if (a.camara) {
    const cam = new THREE.Group();
    const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.14), mat(0x111111)); cam.add(cuerpo);
    const obj = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.18, 10), mat(0x222222)); obj.rotation.z = Math.PI / 2; obj.position.x = 0.2; cam.add(obj);
    cam.position.set(0.05, 0.75, -0.2); cadera.add(cam);
    brazos[1].rotation.z = -1.2;
  }

  p.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const estado = { fase: 0, caminando: false, saludo: false };
  p.userData = {
    estado, brazos, piernas,
    // mira hacia +x local; orientar con lookAt en XZ
    actualizar(dt) {
      if (estado.caminando) {
        estado.fase += dt * 7;
        const s = Math.sin(estado.fase) * 0.5;
        piernas[0].rotation.z = s; piernas[1].rotation.z = -s;
        brazos[0].rotation.z = -s * 0.8; if (!a.camara) brazos[1].rotation.z = s * 0.8;
        cadera.position.y = 0.92 + Math.abs(Math.cos(estado.fase)) * 0.03;
      } else { piernas[0].rotation.z = piernas[1].rotation.z = 0; if (!estado.saludo) brazos[0].rotation.z = 0; }
      if (estado.saludo) { estado.fase += dt * 9; brazos[0].rotation.x = -2.6 + Math.sin(estado.fase) * 0.4; }
      else brazos[0].rotation.x = 0;
    },
  };
  return p;
}

// Camina de un punto a otro a velocidad v (m/s). Devuelve true al llegar.
export function caminarHacia(p, destino, v, dt) {
  const d = new THREE.Vector3(destino.x - p.position.x, 0, destino.z - p.position.z);
  const dist = d.length();
  if (dist < 0.05) { p.userData.estado.caminando = false; return true; }
  p.userData.estado.caminando = true;
  const paso = Math.min(dist, v * dt);
  p.position.addScaledVector(d.normalize(), paso);
  p.rotation.y = Math.atan2(-d.z, d.x);
  return false;
}

// Piloto sentado en la cabina (torso, cabeza con casco y brazo que puede hacer señas)
export function crearPiloto() {
  const g = new THREE.Group(); g.name = 'piloto';
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.3, 4, 10), mat(0x3a4a3a)); torso.position.y = 0.25; g.add(torso);
  const casco = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), mat(0xeeeeee, { roughness: 0.3 })); casco.position.y = 0.62; g.add(casco);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.142, 14, 8, -0.9, 1.8, 1.2, 0.7), mat(0x222a33, { roughness: 0.1, metalness: 0.5 }));
  visor.position.y = 0.62; g.add(visor);
  const hombro = new THREE.Group(); hombro.position.set(0, 0.42, 0.2); g.add(hombro);
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.4, 3, 8), mat(0x3a4a3a)); b.position.y = -0.22; hombro.add(b);
  const guante = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), mat(0x222222)); guante.position.y = -0.46; hombro.add(guante);
  let fase = 0;
  g.userData = {
    seña: false,
    actualizar(dt) {
      if (g.userData.seña) { fase += dt * 8; hombro.rotation.x = -2.3 + Math.sin(fase) * 0.45; }
      else hombro.rotation.x = 0;
    },
  };
  return g;
}
