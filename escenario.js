// Escenario: pista de tierra en el campo, cielo, arboleda, humo de incendio a lo lejos,
// y el diagrama de ángulos de aproximación del MOE 3.4 dibujado en el suelo.
import * as THREE from './three.module.js';

const mat = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9, ...e });

function texturaRuido(base, variacion, tam = 256, repetir = 40) {
  const cv = document.createElement('canvas'); cv.width = cv.height = tam; const g = cv.getContext('2d');
  const img = g.createImageData(tam, tam);
  const [r, gg, b] = base;
  for (let i = 0; i < tam * tam; i++) {
    const n = (Math.random() - 0.5) * variacion;
    img.data[i * 4] = r + n; img.data[i * 4 + 1] = gg + n; img.data[i * 4 + 2] = b + n * 0.7; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repetir, repetir);
  t.colorSpace = THREE.SRGBColorSpace; return t;
}

function cielo() {
  const g = new THREE.SphereGeometry(400, 32, 16);
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { arriba: { value: new THREE.Color(0x4f86c6) }, horizonte: { value: new THREE.Color(0xc7d6d0) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 arriba; uniform vec3 horizonte; varying vec3 vP; void main(){ float h = clamp(vP.y*2.2, 0.0, 1.0); gl_FragColor = vec4(mix(horizonte, arriba, pow(h,0.7)), 1.0); }',
  });
  return new THREE.Mesh(g, m);
}

// Zonas del MOE 3.4 alrededor del avión (coordenadas del avión: +x nariz, z lateral).
export function crearZonas(radio = 11) {
  const g = new THREE.Group(); g.name = 'zonas';
  const zona = (desde, hasta, color, r = radio, r0 = 0) => {
    const geo = new THREE.RingGeometry(r0, r, 48, 1, desde, hasta - desde);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.3, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.02; m.renderOrder = 1; g.add(m);
  };
  // En RingGeometry el ángulo 0 es +x del plano; tras rotar -90° en x, +y del plano pasa a -z del mundo.
  const d = THREE.MathUtils.degToRad;
  zona(d(-80), d(80), 0xe02020);                     // adelante: prohibido con motor encendido
  zona(d(80), d(100), 0xf07a1a); zona(d(-100), d(-80), 0xf07a1a); // a la altura del motor: solo personal autorizado
  zona(d(100), d(150), 0x2fbf4a); zona(d(-150), d(-100), 0x2fbf4a); // aproximación a la cabina
  zona(d(150), d(210), 0xf2c200);                    // atrás: precaución vientos fuertes
  // estela: franja amarilla tenue hasta 32 m detrás
  const est = new THREE.Mesh(new THREE.PlaneGeometry(21, 4.5), new THREE.MeshBasicMaterial({ color: 0xf2c200, transparent: true, opacity: 0.12, depthWrite: false }));
  est.rotation.x = -Math.PI / 2; est.position.set(-21.5, 0.021, 0); g.add(est);
  return g;
}

export function crearEscenario(escena) {
  // Plataforma, pista, hangares y paisaje portados de «La vuelta al avión» (aurav-prevuelo), para que
  // los dos juegos de AURAV compartan el mismo aeródromo. El avión queda estacionado en la plataforma
  // de hormigón, de frente a la pista.
  escena.add(cielo());
  escena.fog = new THREE.Fog(0xc7d6d0, 90, 440);
  const M = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.86, ...e });
  const mats = { ground: M('#85916f'), concrete: M('#c9c7af'), asphalt: M('#59615b'), paint: M('#e9d49a'), white: M('#e5e5d2'), dark: M('#173247'), wall: M('#8a9caa'), roof: M('#143b59'), junta: M('#b7b7a4') };
  const box = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.receiveShadow = true; escena.add(b); return b; };
  const cartel = (texto, w = 2, h = 0.45, fg = '#f4f9ff', bg = '#082440') => {
    const cv = document.createElement('canvas'); cv.width = 768; cv.height = 160; const c = cv.getContext('2d');
    c.fillStyle = bg; c.fillRect(0, 0, 768, 160); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '600 46px Arial'; c.fillText(texto, 384, 80);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }));
  };
  const carteles = [];
  const marca = ancho => { const s = cartel('AURAV / PLANO AÉREO', ancho, ancho * 0.572, '#ffffff', '#082440'); carteles.push(s); return s; };

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200), mats.ground); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; escena.add(ground);
  box(39, 0.06, 46, -1, -0.025, 2, mats.concrete);                    // plataforma de hormigón
  box(18, 0.07, 1300, 30, -0.012, -500, mats.asphalt);               // pista
  box(33, 0.071, 9, 11, -0.01, 15, mats.asphalt);                    // calle de rodaje
  for (let z = -1100; z < 120; z += 23) box(0.18, 0.015, 7, 30, 0.034, z, mats.white);
  for (const x of [22, 38]) box(0.13, 0.015, 1280, x, 0.034, -510, mats.white);
  for (let x = 24; x <= 36; x += 2) box(0.8, 0.015, 12, x, 0.04, -12, mats.white);
  for (let x = -15; x < 18; x += 3) box(0.025, 0.006, 46, x, 0.015, 2, mats.junta);   // juntas del hormigón
  for (let z = -18; z < 24; z += 4) box(39, 0.006, 0.025, -1, 0.015, z, mats.junta);
  for (let i = 0; i < 3; i++) {                                       // hangares
    const x = -31 - i * 21, z = 18 + i * 5;
    box(18, 8, 20, x, 4, z, mats.wall).castShadow = true;
    box(18.6, 0.5, 20.6, x, 8, z, mats.roof);
    box(14, 6.3, 0.08, x, 3.2, z - 10.1, mats.dark);
    for (let p = -6; p <= 6; p += 2) box(0.06, 6.2, 0.1, x + p, 3.2, z - 10.18, mats.roof);
    const l = i === 0 ? marca(6) : cartel(`HANGAR 0${i + 1}`, 8, 0.95); l.position.set(x, i === 0 ? 6.4 : 7.1, z - 10.25); l.rotation.y = Math.PI; escena.add(l);
  }
  let seed = 721; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const ridgeGeo = new THREE.IcosahedronGeometry(1, 2), v = ridgeGeo.attributes.position;
  for (let i = 0; i < v.count; i++) { const x = v.getX(i), y = v.getY(i), z = v.getZ(i), r = 1 + 0.12 * Math.sin(x * 13 + z * 7) * Math.cos(y * 9); v.setXYZ(i, x * r, y * r, z * r); } ridgeGeo.computeVertexNormals();
  const ridges = new THREE.InstancedMesh(ridgeGeo, M('#a5b3a5', { flatShading: true }), 28), o = new THREE.Object3D();
  for (let i = 0; i < 28; i++) { const side = i % 2 ? -1 : 1, h = 42 + rnd() * 72; o.position.set(side * (270 + rnd() * 140), -h * 0.22, 150 - Math.floor(i / 2) * 100); o.rotation.set(0, rnd() * Math.PI, 0); o.scale.set(70 + rnd() * 90, h, 95 + rnd() * 65); o.updateMatrix(); ridges.setMatrixAt(i, o.matrix); ridges.setColorAt(i, new THREE.Color(i % 3 ? '#94a695' : '#b2b5a3')); } escena.add(ridges);
  const N = 110, trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.25, 1, 6), M('#66513b'), N);
  const crowns = Array.from({ length: 3 }, () => new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 7), M('#526f55', { flatShading: true }), N));
  for (let i = 0; i < N; i++) {
    const a = rnd() * Math.PI * 2, r = 75 + rnd() * 140, h = 6 + rnd() * 7; let x = Math.cos(a) * r; const z = Math.sin(a) * r; if (Math.abs(x - 30) < 20) x += x >= 30 ? 40 : -40; const rot = rnd() * Math.PI;
    o.rotation.set(0, rot, 0); o.position.set(x, h * 0.21, z); o.scale.set(1, h * 0.42, 1); o.updateMatrix(); trunks.setMatrixAt(i, o.matrix);
    for (let k = 0; k < 3; k++) { o.position.set(x, h * (0.32 + k * 0.23), z); o.scale.set(h * (0.27 - k * 0.065), h * 0.55, h * (0.27 - k * 0.065)); o.rotation.y = rot + k * 0.5; o.updateMatrix(); crowns[k].setMatrixAt(i, o.matrix); crowns[k].setColorAt(i, new THREE.Color().setHSL(0.29 + rnd() * 0.05, 0.16 + rnd() * 0.12, 0.62 + k * 0.055)); }
  } escena.add(trunks, ...crowns);
  for (let i = 0; i < 18; i++) { const x = -200 + rnd() * 430, z = -90 - rnd() * 1000; box(25 + rnd() * 45, 0.05, 35 + rnd() * 80, x, 0.04, z, M(i % 2 ? '#a2a477' : '#748867')); }
  // manga de viento
  { const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 8, 12), mats.white); palo.position.set(14, 4, 7); escena.add(palo);
    const sock = new THREE.Group(); sock.position.set(14, 8, 7); sock.rotation.z = -Math.PI / 2.5;
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35 - i * 0.04, 0.39 - i * 0.04, 0.4, 12, 1, true), M(i % 2 ? '#eee6cb' : '#d78955', { side: THREE.DoubleSide })); m.position.y = i * 0.4; sock.add(m); } escena.add(sock); }
  // cartel AURAV en el borde de la plataforma (fuera del sector de carga)
  { const b = marca(3); b.position.set(-16, 1.8, -12); b.rotation.y = 0.8; escena.add(b); box(0.09, 1.6, 0.09, -16, 0.8, -12, mats.dark); }
  const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(13, 16, 12), new THREE.MeshBasicMaterial({ color: '#fff1c5', fog: false })); sunDisc.position.set(-280, 150, -390); escena.add(sunDisc);
  // logo real si está el archivo (mismo que en «La vuelta al avión»)
  const img = new Image(); img.onload = () => { const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; for (const s of carteles) { s.material.map = t; s.material.needsUpdate = true; } }; img.src = './aurav-plano-aereo.webp';

  // columna de humo del incendio en el horizonte
  const humo = crearHumo(); humo.position.set(180, 0, -230); escena.add(humo);

  // luces (mismas que el primer juego)
  escena.add(new THREE.HemisphereLight(0xedf5ff, 0x797750, 1.6));
  const sol = new THREE.DirectionalLight(0xffdfac, 2.6);
  sol.position.set(-16, 30, -18); sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024); Object.assign(sol.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, far: 120 });
  sol.shadow.bias = -0.0005;
  escena.add(sol);

  return { actualizar: dt => humo.userData.actualizar(dt) };
}

function crearHumo() {
  const g = new THREE.Group();
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  const gr = c.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(120,112,104,0.9)'); gr.addColorStop(1, 'rgba(120,112,104,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  const bolas = [];
  for (let i = 0; i < 26; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0.8 }));
    sp.userData.t = i / 26; g.add(sp); bolas.push(sp);
  }
  g.userData.actualizar = dt => {
    for (const b of bolas) {
      b.userData.t = (b.userData.t + dt * 0.02) % 1;
      const t = b.userData.t;
      b.position.set(t * 60 + Math.sin(t * 9) * 4, 5 + t * 110, Math.cos(t * 7) * 5);
      const k = 14 + t * 55; b.scale.set(k, k, 1);
      b.material.opacity = 0.75 * (1 - t);
    }
  };
  return g;
}

// Motobomba, tanque de agua y manguera hasta el acople del avión
export function crearEquipoCarga(desde, hasta) {
  const g = new THREE.Group(); g.name = 'equipo-carga';
  // tanque de agua (fuente a validar con AAXOD)
  const tanque = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.4, 28), mat(0x8e969c, { roughness: 0.6, metalness: 0.4 }));
  tanque.position.set(desde.x - 3.2, 0.7, desde.z + 0.6); g.add(tanque);
  // motobomba
  const mb = new THREE.Group(); mb.name = 'motobomba';
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.6), mat(0x2a2a2a)); base.position.y = 0.04; mb.add(base);
  const motor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.36), mat(0xc0171d, { roughness: 0.5 })); motor.position.set(-0.12, 0.26, 0); mb.add(motor);
  const bomba = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 14), mat(0x777c80, { metalness: 0.6, roughness: 0.4 })); bomba.rotation.z = Math.PI / 2; bomba.position.set(0.22, 0.22, 0); mb.add(bomba);
  const marco = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 6, 16, Math.PI), mat(0x2a2a2a)); marco.position.set(0, 0.08, 0); marco.rotation.y = Math.PI / 2; mb.add(marco);
  mb.position.copy(desde); g.add(mb);
  // manguera de aspiración (tanque → bomba) y de impulsión (bomba → acople)
  const mManguera = mat(0x1d3d6b, { roughness: 0.7 });
  const tubo = (pts, r) => { const c = new THREE.CatmullRomCurve3(pts); const m = new THREE.Mesh(new THREE.TubeGeometry(c, 40, r, 8), mManguera); m.castShadow = true; g.add(m); return m; };
  tubo([new THREE.Vector3(desde.x - 1.7, 0.5, desde.z + 0.4), new THREE.Vector3(desde.x - 0.8, 0.08, desde.z + 0.2), new THREE.Vector3(desde.x + 0.35, 0.22, desde.z)], 0.045);
  const medio = new THREE.Vector3().lerpVectors(desde, hasta, 0.5);
  tubo([new THREE.Vector3(desde.x + 0.35, 0.22, desde.z), new THREE.Vector3(desde.x + 1.2, 0.06, desde.z - 0.3), new THREE.Vector3(medio.x, 0.06, medio.z + 0.4),
    new THREE.Vector3(hasta.x - 0.2, 0.08, hasta.z + 0.5), new THREE.Vector3(hasta.x, hasta.y - 0.25, hasta.z + 0.25), hasta.clone()], 0.04).name = 'manguera-impulsion';
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
