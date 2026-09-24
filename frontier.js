import * as THREE from './three.module.js';

/** Nissan Frontier doble cabina según foto suministrada (frente anterior al facelift).
 * Cuerpo 5.26 x 1.85 x 1.83 m; espejos y enganche sobresalen de esa envolvente.
 * Origen suelo, +x adelante. userData.enganche es un Object3D local en la bocha.
 */
export function crearFrontier() {
  const root=new THREE.Group();root.name='Frontier doble cabina';
  const white=material(0xf0f1ed),black=material(0x171b20),dark=material(0x353c43),chrome=material(0xcbd1d8,{metalness:.88,roughness:.22}),glass=material(0x243c49,{roughness:.16,metalness:.18,side:THREE.DoubleSide,transparent:true,opacity:.32,depthWrite:false}),red=material(0x9f1522),lamp=material(0xecf0e4,{emissive:0x302b12,emissiveIntensity:.3}),amber=material(0xe18b20);
  box(root,[4.90,.19,1.36],[0,.53,0],black);
  // Piso de habitáculo y vano motor; ancho interior evita tapar las ruedas.
  box(root,[3.43,.34,1.38],[.90,.86,0],white);
  for(const x of [1.48,-1.67]){
    cylinder(root,.055,1.68,[x,.385,0],black,'z',8);
    for(const s of [-1,1])wheel(root,x,.385,s*.7975,.385,.245,black,chrome);
  }
  // Paneles con recortes reales para pasos de rueda, no discos superpuestos.
  const outline=[[2.63,.84],[2.56,1.07],[1.02,1.17],[-.95,1.14],[-2.58,1.14],[-2.63,.57]];
  for(let i=0;i<=150;i++){
    const x=-2.63+5.26*i/150;let y=.60;
    for(const wx of [1.48,-1.67]){const dx=x-wx;if(Math.abs(dx)<.445)y=Math.max(y,.385+Math.sqrt(.445*.445-dx*dx));}
    outline.push([x,y]);
  }
  for(const s of [-1,1])poly(root,outline,.16,white,s*.845);
  // Capó descendente y cabina facetada.
  loft(root,[[2.53,1.035,.78],[1.08,1.16,.82]].map(([x,y,w])=>[[x,.88,-w],[x,y,-w],[x,y,w],[x,.88,w]]),white);
  loft(root,[[-1.02,1.14,.84],[-.85,1.80,.73],[.42,1.80,.73],[1.10,1.15,.84]].map(([x,y,w])=>[[x,1.06,-w],[x,y,-w],[x,y,w],[x,1.06,w]]),white);
  roundedBox(root,[1.26,.035,1.47],[-.215,1.808125,0],white,.012);
  for(const s of [-1,1]){
    face(root,[[.97,1.23,s*.832],[.39,1.73,s*.749],[-.13,1.73,s*.749],[-.13,1.23,s*.836]],glass);
    face(root,[[-.23,1.23,s*.836],[-.23,1.73,s*.749],[-.80,1.73,s*.749],[-.94,1.23,s*.836]],glass);
    rod(root,[-.18,.65,s*.932],[-.18,1.17,s*.932],.006,dark,6);
    rod(root,[-.96,.69,s*.932],[-.96,1.17,s*.932],.006,dark,6);
    for(const x of [-.74,.04])box(root,[.16,.038,.025],[x,1.13,s*.941],black);
    box(root,[1.90,.065,.15],[-.04,.48,s*.96],dark);
    rod(root,[.90,1.23,s*.82],[.81,1.31,s*1.025],.023,black);
    box(root,[.24,.17,.13],[.80,1.34,s*1.055],black);
    box(root,[.16,.11,.007],[.74,1.345,s*1.126],chrome);
  }
  face(root,[[1.08,1.21,-.77],[.44,1.745,-.70],[.44,1.745,.70],[1.08,1.21,.77]],glass);
  face(root,[[-1.035,1.22,.70],[-.875,1.72,.65],[-.875,1.72,-.65],[-1.035,1.22,-.70]],glass);
  for(const s of [-1,1])rod(root,[1.085,1.222,s*.1],[.93,1.34,s*.56],.009,black,6);
  // Caja abierta: piso, laterales, portón y cabecera; sin tapa superior.
  box(root,[1.50,.09,1.51],[-1.81,.79,0],dark);
  for(const s of [-1,1]){
    box(root,[1.57,.33,.09],[-1.80,.985,s*.85],white);
    box(root,[1.58,.035,.105],[-1.80,1.167,s*.85],black);
    box(root,[.65,.20,.19],[-1.67,.865,s*.65],dark);
    for(let i=0;i<3;i++)box(root,[.025,.20,.013],[-1.28-i*.45,.99,s*.797],dark);
  }
  box(root,[.09,.37,1.64],[-1.025,.98,0],white);
  box(root,[.13,.38,1.71],[-2.565,.96,0],white);
  box(root,[.014,.055,.23],[-2.64,1.09,0],black);
  for(let i=0;i<7;i++)box(root,[1.40,.018,.027],[-1.80,.844,-.60+i*.20],black);
  // Frente negro con marco cromado, insignia creada con geometría.
  box(root,[.05,.31,1.13],[2.59,.94,0],chrome);
  box(root,[.055,.245,1.00],[2.621,.94,0],black);
  for(const y of [.86,.94,1.02])box(root,[.016,.018,.95],[2.655,y,0],dark);
  const badge=mesh(root,new THREE.TorusGeometry(.072,.012,6,20),chrome,[2.668,.95,0]);badge.rotation.y=Math.PI/2;
  box(root,[.025,.025,.16],[2.68,.95,0],chrome);
  for(const s of [-1,1]){
    box(root,[.055,.235,.28],[2.585,.94,s*.713],lamp);
    box(root,[.061,.12,.06],[2.587,.91,s*.86],amber);
    box(root,[.046,.28,.18],[-2.64,.985,s*.77],red);
    box(root,[.048,.09,.18],[-2.643,1.00,s*.77],lamp);
  }
  box(root,[.18,.21,1.79],[2.54,.645,0],white);box(root,[.06,.13,.81],[2.636,.64,0],black);
  box(root,[.17,.16,1.78],[-2.58,.56,0],chrome);box(root,[.19,.045,1.72],[-2.58,.66,0],black);
  for(const s of [-1,1])cylinder(root,.067,.02,[2.641,.645,s*.66],lamp,'x',16);
  // Ópticas y líneas del capó aportan escala sin texturas externas.
  for(const side of [-1,1]){
    for(const z of [.64,.78])cylinder(root,.063,.023,[2.625,.96,side*z],chrome,'x',16);
    rod(root,[1.15,1.17,side*.64],[2.47,1.056,side*.59],.006,dark,6);
    rod(root,[-.9,1.17,side*.926],[1.0,1.17,side*.926],.005,dark,6);
    box(root,[.025,.06,.1],[-2.641,.93,side*.765],chrome);
  }
  // Centro de la bocha en x=-2.86, y=.48.
  rod(root,[-2.45,.40,0],[-2.86,.40,0],.045,black);rod(root,[-2.86,.40,0],[-2.86,.48,0],.027,chrome);
  mesh(root,new THREE.SphereGeometry(.035,12,8),chrome,[-2.86,.48,0]);
  const enganche=new THREE.Object3D();enganche.name='enganche';enganche.position.set(-2.86,.48,0);root.add(enganche);
  root.userData.enganche=enganche;root.userData.cotas={largoCarroceria:5.26,anchoCarroceria:1.85,alto:1.83,entreEjes:3.15};
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
