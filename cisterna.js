import * as THREE from './three.module.js';

/** Cisterna: +x hacia vehículo tractor. Origen centro del acople (no suelo).
 * Montada con origen mundial y=.48, los cuatro neumáticos apoyan en y=0.
 * Colgar de frontier.userData.enganche; rotation.y articula el tráiler.
 * Dimensiones no cotadas en fotos: aproximadas, tanque longitudinal 2.5 m.
 */
export function crearCisterna() {
  const root=new THREE.Group();root.name='Cisterna combustible doble eje';
  const orange=material(0xe87810),steel=material(0xb8c1c8,{metalness:.88,roughness:.28}),dark=material(0x24292c),rubber=material(0x14191c),red=material(0xb51123),white=material(0xeae5d9);
  const yGround=-.48,wheelY=yGround+.32;
  // Lanza triangular naranja y acople en el origen.
  for(const s of [-1,1]){
    rod(root,[-.08,-.05,0],[-1.34,-.05,s*.64],.065,orange);
    box(root,[2.9,.13,.10],[-2.69,-.05,s*.64],orange);
  }
  box(root,[.27,.11,.115],[-.10,0,0],steel);box(root,[.13,.035,.04],[-.12,.09,0],dark);
  for(const x of [-1.30,-1.85,-2.65,-3.5,-4.08])box(root,[.10,.12,1.39],[x,-.05,0],orange);
  // Dos ejes y cuatro ruedas: centros 0.82 m separados.
  for(const x of [-2.58,-3.40]){
    cylinder(root,.05,1.70,[x,wheelY,0],dark,'z',8);
    for(const s of [-1,1]){
      wheel(root,x,wheelY,s*.86,.32,.20,rubber,steel);
      rod(root,[x-.24,-.01,s*.56],[x,wheelY+.04,s*.66],.025,dark);
    }
  }
  // Guardabarros continuos de chapa plegada sobre los ejes.
  for(const s of [-1,1]){
    poly(root,[[-3.91,-.02],[-3.72,.28],[-2.26,.28],[-2.04,-.02],[-2.10,-.02],[-2.30,.23],[-3.68,.23],[-3.85,-.02]],.39,orange,s*.84);
    box(root,[.025,.30,.34],[-3.94,-.16,s*.85],rubber);
  }
  // Sección elíptica transversal, tapas abombadas incluidas en largo 2.5.
  const centerY=.78,ry=.63,rz=.76;
  const sections=[[-1.32,.12],[-1.39,.62],[-1.51,.92],[-1.63,1],[-3.51,1],[-3.65,.92],[-3.77,.62],[-3.82,.12]];
  const ellipse=(x,k)=>Array.from({length:32},(_,j)=>{const a=j*Math.PI/16;return[x,centerY+Math.sin(a)*ry*k,Math.cos(a)*rz*k];});
  smoothLoft(root,sections.map(([x,k])=>ellipse(x,k)),steel);
  for(const x of [-1.64,-3.48]){
    // Cinchas metálicas ligeramente elevadas sobre la envolvente.
    loft(root,[ellipse(x-.032,1.011),ellipse(x+.032,1.011)],steel);
    for(const s of [-1,1])box(root,[.18,.18,.16],[x,.13,s*.57],orange);
  }
  cylinder(root,.19,.09,[-2.25,1.44,0],steel,'y',20);
  box(root,[.18,.04,.045],[-2.25,1.51,0],dark);
  box(root,[.20,.25,.20],[-2.94,1.48,0],steel);
  // Gabinete trasero, dos puertas y manijas.
  roundedBox(root,[.49,1.04,1.26],[-3.85,.50,0],steel,.025);
  box(root,[.015,.95,.014],[-4.10,.51,0],dark);
  for(const s of [-1,1]){
    rod(root,[-4.12,.40,s*.09],[-4.12,.64,s*.09],.015,steel);
    box(root,[.02,.05,.08],[-4.12,.37,s*.09],dark);
  }
  box(root,[.10,.13,1.84],[-4.16,-.06,0],orange);
  for(const s of [-1,1]){box(root,[.025,.10,.20],[-4.225,-.02,s*.65],red);box(root,[.026,.10,.075],[-4.227,-.02,s*.79],orange);}
  // Auxilio vertical sobre la lanza y gato desplegado con pie levantado para remolque.
  rod(root,[-.92,-.03,0],[-.92,.47,0],.045,orange);
  wheel(root,-.92,.46,0,.32,.19,rubber,steel);
  rod(root,[-.60,.08,.25],[-.60,-.32,.25],.035,steel);
  box(root,[.18,.035,.15],[-.60,-.35,.25],steel);
  rod(root,[-.60,.10,.25],[-.44,.10,.25],.017,dark);
  // Rótulos generados con Canvas, sin imágenes ni tipografías descargadas.
  const panel=canvasMaterial(256,256,(c,w,h)=>{c.fillStyle='#f38a1b';c.fillRect(0,0,w,h);c.strokeStyle='#151515';c.lineWidth=13;c.strokeRect(7,7,w-14,h-14);c.lineWidth=6;c.beginPath();c.moveTo(7,h/2);c.lineTo(w-7,h/2);c.stroke();c.fillStyle='#111';c.font='bold 92px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('30',w/2,65);c.fillText('1863',w/2,190,220);});
  const hazard=canvasMaterial(256,256,(c,w,h)=>{
    c.fillStyle='#b8c1c8';c.fillRect(0,0,w,h);c.beginPath();c.moveTo(128,6);c.lineTo(250,128);c.lineTo(128,250);c.lineTo(6,128);c.closePath();c.fillStyle='#c31826';c.fill();c.strokeStyle='white';c.lineWidth=6;c.stroke();
    // Silueta propia de llama; no un emoji dependiente del sistema.
    c.beginPath();c.moveTo(129,42);c.bezierCurveTo(160,81,113,84,155,108);c.bezierCurveTo(164,84,180,94,177,125);c.bezierCurveTo(184,171,96,174,89,135);c.bezierCurveTo(80,112,111,97,105,72);c.bezierCurveTo(113,86,124,92,124,100);c.bezierCurveTo(144,77,119,67,129,42);c.fillStyle='white';c.fill();
    c.fillRect(92,168,76,7);c.font='bold 47px Arial';c.textAlign='center';c.fillText('3',128,222);
  });
  for(const s of [-1,1]){
    label(root,panel,.38,.38,[-2.85,.89,s*.774],s<0?Math.PI:0);
    label(root,hazard,.46,.46,[-2.12,.89,s*.776],s<0?Math.PI:0);
  }
  label(root,panel,.36,.36,[-4.116,.55,-.34],-Math.PI/2);
  label(root,hazard,.43,.43,[-4.117,.55,.32],-Math.PI/2);
  // Manguera enrollada junto al gabinete, abrazaderas y peldaño.
  for(let i=0;i<3;i++){const hose=mesh(root,new THREE.TorusGeometry(.20,.018,6,24),rubber,[-3.55,.56,.80+i*.039]);}
  rod(root,[-3.55,.36,.88],[-3.08,.17,.79],.023,rubber);
  cylinder(root,.032,.11,[-3.06,.17,.79],steel,'x',10);
  box(root,[.26,.045,.8],[-4.09,-.14,0],dark);
  root.userData.alturaEnganche=.48;root.userData.cotas={largoTanque:2.5,anchoTanque:1.52,altoTanque:1.26,separacionEjes:.82};
  compact(root);return finish(root);
}
// Helpers privados: sin dependencias adicionales; duplicados para módulos autónomos.
const V = (a) => new THREE.Vector3(...a);
function material(color, extra={}) {
  const paint=[0xf4f5f0,0xf0f1ed,0xb60825,0xbd0927,0xe87810].includes(color);
  return paint ? new THREE.MeshPhysicalMaterial({color,roughness:.32,clearcoat:.42,clearcoatRoughness:.24,...extra}) : new THREE.MeshStandardMaterial({color,roughness:.45,...extra});
}
function mesh(parent, geometry, mat, pos=[0,0,0]) {
  const m=new THREE.Mesh(geometry,mat);m.position.set(...pos);
  m.castShadow=m.receiveShadow=true;parent.add(m);return m;
}
function box(p, size, pos, mat) { return mesh(p,new THREE.BoxGeometry(...size),mat,pos); }
function rod(p,a,b,r,mat,n=8) {
  const d=V(b).sub(V(a));const m=mesh(p,new THREE.CylinderGeometry(r,r,d.length(),n),mat,V(a).add(V(b)).multiplyScalar(.5).toArray());
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;
}
function cylinder(p,r,length,pos,mat,axis='z',n=20) {
  const m=mesh(p,new THREE.CylinderGeometry(r,r,length,n),mat,pos);
  if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=-Math.PI/2;return m;
}
function poly(p, points, depth, mat, z=0) {
  const s=new THREE.Shape(points.map(a=>new THREE.Vector2(...a)));
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:1,steps:1});g.translate(0,0,z-depth/2);return mesh(p,g,mat);
}
function face(p, points, mat) {
  const a=[];for(let i=1;i<points.length-1;i++)a.push(...points[0],...points[i],...points[i+1]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.computeVertexNormals();return mesh(p,g,mat);
}
// Anillos de igual cantidad de vértices; normales corregidas hacia fuera.
function loft(p,rings,mat) {
  const a=[],n=rings[0].length;
  const emit=(u,v,w,center)=>{
    const normal=V(v).sub(V(u)).cross(V(w).sub(V(u)));
    const out=V(u).add(V(v)).add(V(w)).multiplyScalar(1/3).sub(center);
    if(normal.dot(out)<0)a.push(...u,...w,...v);else a.push(...u,...v,...w);
  };
  for(let k=0;k<rings.length-1;k++){
    const c=new THREE.Vector3();[...rings[k],...rings[k+1]].forEach(v=>c.add(V(v)));c.divideScalar(n*2);
    for(let i=0;i<n;i++){const j=(i+1)%n;emit(rings[k][i],rings[k+1][i],rings[k+1][j],c);emit(rings[k][i],rings[k+1][j],rings[k][j],c);}
  }
  const c=new THREE.Vector3();rings.flat().forEach(v=>c.add(V(v)));c.divideScalar(rings.length*n);
  for(const ring of [rings[0],rings.at(-1)])for(let i=1;i<n-1;i++)emit(ring[0],ring[i],ring[i+1],c);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.computeVertexNormals();return mesh(p,g,mat);
}
function wheel(p,x,y,z,r,w,rubber,metal) {
  const points=[[r*.49,-w*.40],[r*.73,-w*.51],[r*.92,-w*.44],[r*.99,-w*.27],[r,-w*.13],[r,w*.13],[r*.99,w*.27],[r*.92,w*.44],[r*.73,w*.51],[r*.49,w*.40]];
  const tire=mesh(p,new THREE.LatheGeometry(points.map(a=>new THREE.Vector2(...a)),24),tireMaterial(rubber),[x,y,z]);tire.rotation.x=Math.PI/2;
  for(const s of [-1,1]){
    cylinder(p,r*.52,.026,[x,y,z+s*w*.42],metal,'z',16);
    const rim=mesh(p,new THREE.TorusGeometry(r*.48,r*.026,4,16),metal,[x,y,z+s*w*.455]);
    cylinder(p,r*.18,.04,[x,y,z+s*w*.47],metal,'z',12);
    for(let j=0;j<6;j++){const a=j*Math.PI/3;const hole=mesh(p,new THREE.CircleGeometry(r*.065,8),rubber,[x+Math.sin(a)*r*.34,y+Math.cos(a)*r*.34,z+s*w*.466]);if(s<0)hole.rotation.y=Math.PI;cylinder(p,r*.026,.018,[x+Math.sin(a)*r*.245,y+Math.cos(a)*r*.245,z+s*w*.465],metal,'z',3);}
  }
  return tire;
}
function canvasMaterial(w,h,draw) {
  const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):document.createElement('canvas');canvas.width=w;canvas.height=h;
  draw(canvas.getContext('2d'),w,h);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  return material(0xffffff,{map,transparent:false,roughness:.6});
}
function label(p,mat,w,h,pos,ry=0) {const m=mesh(p,new THREE.PlaneGeometry(w,h),mat,pos);m.rotation.y=ry;return m;}
// Unifica geometrías estáticas por material. No usa BufferGeometryUtils.
// Los grupos marcados dynamic conservan transformaciones independientes.
function compact(root) {
  root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),buckets=new Map(),old=[];
  function visit(o){if(o!==root&&o.userData.dynamic)return;
    if(o.isMesh){const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
      if(!buckets.has(o.material))buckets.set(o.material,{p:[],n:[],uv:[]});const b=buckets.get(o.material);
      for(const v of g.attributes.position.array)b.p.push(v);for(const v of g.attributes.normal.array)b.n.push(v);
      if(g.attributes.uv)b.uv.push(...g.attributes.uv.array);else b.uv.push(...new Float32Array(g.attributes.position.count*2));g.dispose();old.push(o);
    }else o.children.forEach(visit);
  }visit(root);old.forEach(m=>{m.removeFromParent();m.geometry.dispose();});
  for(const [mat,b]of buckets){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));g.computeBoundingSphere();mesh(root,g,mat);}
}
function finish(root){let triangles=0,meshes=0;root.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;meshes++;}});root.userData.triangles=triangles;root.userData.meshes=meshes;return root;}

// Superficie soldada: normales suaves sin cargar utilidades externas.
function smoothLoft(p,rings,mat,axis='x') {
 const n=rings[0].length,pos=[],uv=[],idx=[];let lo=Infinity,hi=-Infinity;
 for(const ring of rings)for(const v of ring){lo=Math.min(lo,v[axis==='z'?2:0]);hi=Math.max(hi,v[axis==='z'?2:0]);}
 rings.forEach(ring=>{for(let j=0;j<=n;j++){const v=ring[j%n];pos.push(...v);uv.push((v[axis==='z'?2:0]-lo)/(hi-lo||1),j/n);}});
 const point=i=>new THREE.Vector3().fromArray(pos,i*3);
 const tri=(a,b,c,center)=>{const normal=point(b).sub(point(a)).cross(point(c).sub(point(a)));const out=point(a).add(point(b)).add(point(c)).multiplyScalar(1/3).sub(center);idx.push(...(normal.dot(out)<0?[a,c,b]:[a,b,c]));};
 for(let k=0;k<rings.length-1;k++){const center=new THREE.Vector3();[...rings[k],...rings[k+1]].forEach(v=>center.add(V(v)));center.divideScalar(n*2);for(let j=0;j<n;j++){const a=k*(n+1)+j,b=a+n+1;tri(a,b,b+1,center);tri(a,b+1,a+1,center);}}
 const center=new THREE.Vector3();rings.flat().forEach(v=>center.add(V(v)));center.divideScalar(rings.length*n);
 for(const k of [0,rings.length-1]){
   const base=pos.length/3;
   for(let j=0;j<n;j++){pos.push(...rings[k][j]);uv.push(0,0);}
   for(let j=1;j<n-1;j++)tri(base,base+j,base+j+1,center);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const normals=g.attributes.normal;
 for(let k=0;k<rings.length;k++){const a=k*(n+1),b=a+n,v=new THREE.Vector3().fromBufferAttribute(normals,a).add(new THREE.Vector3().fromBufferAttribute(normals,b)).normalize();normals.setXYZ(a,v.x,v.y,v.z);normals.setXYZ(b,v.x,v.y,v.z);}
 return mesh(p,g,mat);
}
function roundedBox(p,size,pos,mat,r=.035) {
 const [x,y,z]=size,r0=Math.min(r,x/4,y/4,z/4),s=new THREE.Shape();
 s.moveTo(-x/2+r0,-y/2);s.lineTo(x/2-r0,-y/2);s.quadraticCurveTo(x/2,-y/2,x/2,-y/2+r0);s.lineTo(x/2,y/2-r0);s.quadraticCurveTo(x/2,y/2,x/2-r0,y/2);s.lineTo(-x/2+r0,y/2);s.quadraticCurveTo(-x/2,y/2,-x/2,y/2-r0);s.lineTo(-x/2,-y/2+r0);s.quadraticCurveTo(-x/2,-y/2,-x/2+r0,-y/2);
 const g=new THREE.ExtrudeGeometry(s,{depth:z-2*r0,bevelEnabled:true,bevelSize:r0/2,bevelThickness:r0,bevelSegments:2,curveSegments:2,steps:1});g.translate(0,0,-z/2+r0);return mesh(p,g,mat,pos);
}

// Textura de relieve de neumático; un material compartido por objeto, no por rueda.
const tireCache=new WeakMap();
function tireMaterial(base){
 if(tireCache.has(base))return tireCache.get(base);
 const m=base.clone();m.color.setHex(0x181b1d);m.roughness=.91;
 const t=canvasMaterial(512,256,(c,w,h)=>{c.fillStyle='#b7b7b7';c.fillRect(0,0,w,h);for(const v of [.27,.38,.50,.62,.73]){c.fillStyle='#353535';c.fillRect(0,h*v,w,3);c.fillStyle='#dedede';c.fillRect(0,h*v+3,w,1);}c.strokeStyle='#656565';c.lineWidth=2;for(let x=-20;x<w;x+=22){c.beginPath();c.moveTo(x,70);c.lineTo(x+10,125);c.moveTo(x+10,132);c.lineTo(x,185);c.stroke();}});
 m.bumpMap=t.map;m.bumpMap.colorSpace=THREE.NoColorSpace;m.bumpScale=.004;m.bumpMap.anisotropy=4;t.map=null;t.dispose();tireCache.set(base,m);return m;
}
function beam(p,a,b,width,depth,mat){const d=V(b).sub(V(a)),m=box(p,[width,d.length(),depth],V(a).add(V(b)).multiplyScalar(.5).toArray(),mat);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
