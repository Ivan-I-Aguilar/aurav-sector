import * as THREE from './three.module.js';

/** AT-802F procedural. Metros, +x proa, +y arriba, origen en el suelo entre los centros de las ruedas principales.
 * Geometría exterior basada en las fotos y plano AT-802 suministrados.
 * Cotas mandatorias del encargo prevalecen sobre planos de otras variantes.
 * userData.helice: THREE.Group; rotar helice.rotation.x (radianes).
 * Largo nominal 11 m en ejes de fuselaje; su proyección en tierra cambia con el cabeceo.
 */
export function crearAT802() {
  const root=new THREE.Group();root.name='AT-802F AUR-AV';
  const white=material(0xf4f5f0,{roughness:.3}),red=material(0xb60825,{roughness:.26}),bordo=material(0x6f132b,{roughness:.28}),black=material(0x181b1d,{roughness:.8}),
    metal=material(0xbcc4cd,{metalness:.85,roughness:.24}),chrome=material(0xe0e5ec,{metalness:1,roughness:.13}),
    glass=new THREE.MeshPhysicalMaterial({color:0x91a8ab,metalness:0,roughness:.07,clearcoat:1,clearcoatRoughness:.035,transparent:true,opacity:.37,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:1.6}), exhaust=material(0xc9ccd0,{metalness:.9,roughness:.3});
  const body=new THREE.Group();body.name='Fuselaje inclinado 9.5 grados';body.rotation.z=THREE.MathUtils.degToRad(9.5);body.position.y=1.70;root.add(body);
  // x, fondo, techo, semiancho: tolva amplia delante de la cabina, cola afilada.
  const stations=[[-6.65,-.10,.15,.065],[-6.1,-.17,.22,.18],[-5.4,-.23,.32,.27],[-4.4,-.34,.47,.39],[-3.3,-.48,.65,.53],[-2.4,-.57,.78,.65],[-1.2,-.63,.85,.72],[.15,-.63,.87,.74],[1.25,-.56,.86,.69],[2.1,-.38,.79,.55],[3.1,-.19,.68,.44],[3.65,-.09,.57,.34],[3.80,.06,.48,.255]];
  let hullPaint=canvasMaterial(2048,512,(c,w,h)=>{
    // Atlas simétrico: pintura definida en metros sobre cada sección del fuselaje.
    // CanvasTexture invierte Y: el ángulo recorre 2π(1 - pixelY/alto).
    const paint=c.createImageData(w,h);
    for(let px=0;px<w;px++){
      const x=-6.65+(3.80+6.65)*(px+.5)/w;
      let k=0;while(k<stations.length-2 && x>stations[k+1][0])k++;
      const a=stations[k],b=stations[k+1],t=(x-a[0])/(b[0]-a[0]);
      const bottom=THREE.MathUtils.lerp(a[1],b[1],t),top=THREE.MathUtils.lerp(a[2],b[2],t),cy=(top+bottom)/2;
      // La banda asciende respecto del centro del fuselaje al acercarse a la deriva.
      const lift=.42*THREE.MathUtils.smoothstep(-x,2.5,6.65);
      const center=cy+lift;
      const redLine=x>1.0?THREE.MathUtils.lerp(-.32,.14,(x-1)/2.8):-.46;
      for(let py=0;py<h;py++){
        const angle=2*Math.PI*(1-(py+.5)/h),sample=(1-(py+.5)/h)*24,j=Math.floor(sample),f=sample-j;
        // Coincidir con la interpolación lineal real de los 24 vértices del anillo.
        const sy=(st,index)=>{const sn=Math.sin(index*Math.PI/12);return(st[1]+st[2])/2+(st[2]-st[1])/2*Math.sign(sn)*Math.abs(sn)**(st[0]>-3.3?.48:.65);};
        const y=THREE.MathUtils.lerp(THREE.MathUtils.lerp(sy(a,j),sy(a,j+1),f),THREE.MathUtils.lerp(sy(b,j),sy(b,j+1),f),t);
        let color=[239,241,237];
        const blend=(ink,coverage)=>{color=color.map((v,i)=>Math.round(THREE.MathUtils.lerp(v,ink[i],coverage)));};
        if(x>=-1.50)blend([182,8,37],THREE.MathUtils.clamp((redLine-y)/.008+.5,0,1));
        const lateral=Math.abs(Math.cos(angle))>.35;
        const band=(lo,hi)=>THREE.MathUtils.clamp(Math.min(y-lo,hi-y)/.006+.5,0,1);
        // Esquema AAXOD: tres franjas bordó (fina arriba, gruesa, media abajo) separadas por filetes blancos;
        // se afinan hacia la nariz y suben en diagonal hacia la cola.
        const k=x>1.4?THREE.MathUtils.lerp(1,.35,(x-1.4)/2.4):1;
        if(lateral&&x<3.7)blend([111,19,43],Math.max(band(center+.115*k,center+.145*k),band(center-.06*k,center+.08*k),band(center-.165*k,center-.09*k)));
        // Panel de persianas verticales detrás de la cabina (fotos AAXOD): relieve claro/oscuro sobre la pintura.
        if(lateral&&x>-3.6&&x<-2.85&&y>center-.24&&y<center+.19){const f=((x+3.6)/.03)%1;const sh=f<.35?.22:f<.5?-.12:0;color=color.map(v=>Math.round(THREE.MathUtils.clamp(v*(1-sh),0,255)));}
        const n=(py*w+px)*4;paint.data[n]=color[0];paint.data[n+1]=color[1];paint.data[n+2]=color[2];paint.data[n+3]=255;
      }
    }
    c.putImageData(paint,0,0);
    c.strokeStyle='#9ba2a3';c.lineWidth=.7;
    for(let x=72;x<w;x+=152){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();for(let y=6;y<h;y+=15){c.fillStyle='#747e83';c.fillRect(x+3,y,1.6,1.6);}}
    for(const y of [62,194,318,450]){c.strokeStyle='#c4c9c9';c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();for(let x=8;x<w;x+=13){c.fillStyle='#879194';c.fillRect(x,y+3,1.3,1.3);}}
  });
  const bump=canvasMaterial(2048,512,(c,w,h)=>{
    c.fillStyle='#808080';c.fillRect(0,0,w,h);
    for(let x=72;x<w;x+=152){c.fillStyle='#676767';c.fillRect(x,0,1,h);for(let y=6;y<h;y+=15){c.fillStyle='#bcbcbc';c.beginPath();c.arc(x+4,y,1.35,0,Math.PI*2);c.fill();}}
    for(const y of [62,194,318,450]){c.fillStyle='#737373';c.fillRect(0,y,w,1);for(let x=8;x<w;x+=13){c.fillStyle='#aeaeae';c.fillRect(x,y+3,1.3,1.3);}}
  });bump.map.colorSpace=THREE.NoColorSpace;
  const paintMap=hullPaint.map;hullPaint.dispose();hullPaint=new THREE.MeshPhysicalMaterial({map:paintMap,bumpMap:bump.map,bumpScale:.005,roughness:.32,clearcoat:.42,clearcoatRoughness:.24});hullPaint.map.anisotropy=8;hullPaint.bumpMap.anisotropy=4;bump.map=null;bump.dispose();
  // 24 puntos por sección, hombros redondeados y laterales de la tolva robustos.
  const ring=([x,b,t,w])=>Array.from({length:24},(_,j)=>{const a=j*Math.PI/12,cs=Math.cos(a),sn=Math.sin(a);return[x,(t+b)/2+(t-b)/2*Math.sign(sn)*Math.abs(sn)**(x>-3.3?.48:.65),w*Math.sign(cs)*Math.abs(cs)**(x>-3.3?.48:.65)];});
  smoothLoft(body,stations.map(ring),hullPaint);
  // Capó y conjunto de carga visibles en las fotos de la parte superior.
  smoothLoft(body,[[3.48,.626,.18],[2.1,.802,.33],[1.22,.882,.41],[.20,.892,.49],[-.32,.881,.48]].map(([x,y,w])=>[[x,y,-w],[x,y,w],[x,y+.010,w],[x,y+.010,-w]]),black);
  const hatchMat=material(0x414632,{metalness:.45,roughness:.33});
  roundedBox(body,[1.10,.035,.94],[.30,.903,0],hatchMat,.025);
  box(body,[.54,.025,.55],[.06,.93,0],black);
  for(const side of [-1,1]){
    rod(body,[-.18,.951,side*.41],[.83,.951,side*.41],.018,metal);
    for(const x of [-.16,.3,.78]){box(body,[.075,.04,.09],[x,.95,side*.4],metal);rod(body,[x,.97,side*.43],[x+.10,.98,side*.30],.013,metal);}
  }
  cylinder(body,.12,.014,[.69,.941,0],red,'y',20);
  // Cabina biplaza alargada con volumen posterior curvo, sin pared detrás de los vidrios.
  // Aft cabin fairing: curved crown, taper into the upper fuselage.
  smoothLoft(body,[[-3.60,.59,.40],[-3.27,.79,.46],[-2.97,1.15,.47],[-2.70,1.47,.45],[-2.40,1.65,.43]].map(([x,y,w])=>{
    const a=[[x,.51,-w],[x,.51,w]];
    for(let i=0;i<=10;i++){const t=i*Math.PI/10;a.push([x,.57+(y-.57)*Math.sin(t)**.42,w*Math.cos(t)]);}return a;
  }),white);
  const sideZ=y=>.63-(y-.79)*.20;
  const A=[-.16,.86],B=[-.89,1.75],C=[-2.39,1.65],D=[-2.75,.78];
  const wnd=[[[ -.35,.92],[-.94,1.66],[-1.45,1.64],[-1.28,.87]], [[-1.40,.88],[-1.57,1.62],[-2.30,1.55],[-2.53,.84]]];
  for(const side of [-1,1]){
    // Continuous sheet-metal door frame with true window openings.
    const door=new THREE.Shape([A,B,C,D].map(a=>new THREE.Vector2(...a)));
    for(const window of wnd)door.holes.push(new THREE.Path(window.map(a=>new THREE.Vector2(...a))));
    const dg=new THREE.ShapeGeometry(door),dp=dg.attributes.position;
    for(let j=0;j<dp.count;j++)dp.setZ(j,side*(sideZ(dp.getY(j))+.001));
    if(side<0){const di=dg.index;for(let j=0;j<di.count;j+=3){const a=di.getX(j+1);di.setX(j+1,di.getX(j+2));di.setX(j+2,a);}}
    dg.computeVertexNormals();mesh(body,dg,white);
    const pts=[A,B,C,D].map(([x,y])=>[x,y,side*sideZ(y)]);
    for(let i=0;i<4;i++)beam(body,pts[i],pts[(i+1)%4],.057,.040,white);
    beam(body,[-1.34,.83,side*sideZ(.83)],[-1.52,1.68,side*sideZ(1.68)],.060,.040,white);
    for(const w of wnd){face(body,w.map(([x,y])=>[x,y,side*(sideZ(y)+.005)]),glass);for(let i=0;i<4;i++){const a=w[i],b=w[(i+1)%4];rod(body,[a[0],a[1],side*(sideZ(a[1])+.007)],[b[0],b[1],side*(sideZ(b[1])+.007)],.009,black,6);}}
    box(body,[2.27,.11,.045],[-1.44,.80,side*.646],white);
    rod(body,[-2.35,.81,side*.683],[-2.18,.81,side*.683],.018,metal);
    rod(body,[-1.03,.83,side*.683],[-.87,.83,side*.683],.018,metal);
  }
  // Techo blanco redondeado y parabrisas frontal dividido.
  smoothLoft(body,[[-2.44,1.65,.43],[-2.13,1.73,.43],[-1.22,1.80,.43],[-.88,1.76,.43]].map(([x,y,w])=>[[x,y-.04,-w],[x,y,-w*.78],[x,y,w*.78],[x,y-.04,w]]),white);
  const windshield=[[-.19,.9,-.60],[-.89,1.73,-.425],[-.89,1.73,.425],[-.19,.9,.60]];
  face(body,windshield,glass);beam(body,[-.19,.9,0],[-.89,1.75,0],.045,.035,white);
  rod(body,[-.17,.87,-.62],[-.17,.87,.62],.043,white);
  // Limpiaparabrisas del lado del piloto, antena de techo y barra roja RESCUE de la puerta (fotos AAXOD).
  rod(body,[-.30,1.02,-.20],[-.72,1.58,-.36],.012,black,5);box(body,[.07,.05,.06],[-.30,1.00,-.22],white);
  {const ant=box(body,[.03,.20,.12],[-1.55,1.88,0],white);ant.rotation.z=-.25;}
  for(const side of [-1,1]){rod(body,[-1.30,.685,side*.715],[-2.25,.685,side*.715],.012,red,6);for(const x of [-1.32,-2.22])box(body,[.06,.06,.03],[x,.685,side*.712],white);}
  // Interior según fotos AAXOD: asientos de malla roja con laterales negros, arneses, tablero gris con relojes,
  // placas amarillas, palanca negra con botón rojo, jaula antivuelco de tubos grises y cuadrante de gases con perilla naranja.
  const malla=material(0xc41a2a,{roughness:.95}),negroMate=material(0x1a1a1a,{roughness:.95}),tubo=material(0x9a9ea3,{metalness:.4,roughness:.5}),
    panelMat=material(0x3b3f43,{roughness:.8}),amarillo=material(0xd9b620,{roughness:.7}),naranja=material(0xe07a20,{roughness:.6});
  for(const x of [-1.05,-2.05]){
    box(body,[.50,.12,.52],[x,.81,0],malla);
    const back=box(body,[.11,.66,.50],[x-.22,1.11,0],malla);back.rotation.z=.12;
    for(const side of [-1,1]){const b=box(body,[.12,.60,.06],[x-.215,1.10,side*.26],negroMate);b.rotation.z=.12;}
    const bol=box(body,[.12,.10,.50],[x-.255,1.43,0],negroMate);bol.rotation.z=.12;
    for(const side of [-1,1]){const h=box(body,[.012,.55,.05],[x-.17,1.13,side*.09],negroMate);h.rotation.z=.12;h.rotation.x=side*.15;}
  }
  box(body,[.13,.28,.84],[-.44,1.03,0],panelMat);
  for(const z of [-.26,0,.26]){cylinder(body,.085,.012,[-.51,1.09,z],negroMate,'x',10);mesh(body,new THREE.TorusGeometry(.085,.006,3,10),metal,[-.51,1.09,z]).rotation.y=Math.PI/2;}
  for(const z of [-.13,.13])cylinder(body,.045,.012,[-.51,.95,z],negroMate,'x',8);
  for(const side of [-1,1])box(body,[.012,.16,.10],[-.512,1.03,side*.37],amarillo);
  rod(body,[-.86,.75,0],[-.87,1.06,0],.014,metal,6);const mango=box(body,[.05,.14,.045],[-.87,1.12,0],negroMate);mango.rotation.z=.15;
  mesh(body,new THREE.SphereGeometry(.012,6,4),red,[-.88,1.19,.012]);
  const arco=(x,zb,zt,yt)=>{rod(body,[x,.78,-zb],[x,yt,-zt],.02,tubo,6);rod(body,[x,yt,-zt],[x,yt,zt],.02,tubo,6);rod(body,[x,yt,zt],[x,.78,zb],.02,tubo,6);};
  arco(-1.55,.58,.40,1.66);arco(-2.45,.55,.38,1.55);
  for(const side of [-1,1]){rod(body,[-.90,1.60,side*.40],[-1.55,1.66,side*.40],.02,tubo,6);rod(body,[-1.55,1.66,side*.40],[-2.45,1.55,side*.38],.02,tubo,6);}
  box(body,[.28,.06,.10],[-1.30,.90,-.52],panelMat);
  rod(body,[-1.34,.92,-.50],[-1.20,1.16,-.49],.012,tubo,6);mesh(body,new THREE.CylinderGeometry(.02,.02,.09,7),naranja,[-1.18,1.20,-.49]).rotation.z=.5;
  rod(body,[-1.26,.92,-.53],[-1.16,1.08,-.53],.008,tubo,5);mesh(body,new THREE.SphereGeometry(.018,6,4),material(0x2c7fd0),[-1.15,1.10,-.53]);
  rod(body,[-1.40,.92,-.53],[-1.32,1.05,-.53],.008,tubo,5);mesh(body,new THREE.SphereGeometry(.016,6,4),red,[-1.31,1.07,-.53]);
  box(body,[2.4,.02,1.0],[-1.6,.74,0],material(0x8d9196,{roughness:.9}));
  // Etiquetas de puertas con geometría plana y alfa recortada.
  const emergency=canvasMaterial(512,64,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#272b2e';c.font='bold 33px Arial';c.textAlign='center';c.fillText('SALIDA DE EMERGENCIA',w/2,43);});emergency.alphaTest=.5;
  for(const side of [-1,1])for(const x of [-.93,-2.06])label(body,emergency,.62,.08,[x,.785,side*.713],side<0?Math.PI:0);
  // Toma de aire (cajita negra) detrás de las persianas, según fotos AAXOD.
  for(const side of [-1,1]){box(body,[.13,.24,.06],[-3.95,.30,side*.51],black);box(body,[.02,.26,.07],[-3.88,.30,side*.515],white);}
  // Alas con perfil grueso y cuerda constante 2.08. Envergadura proyectada en z=18.06.
  const profile=[[0,0],[.008,.021],[.025,.037],[.06,.055],[.12,.073],[.22,.085],[.33,.082],[.47,.069],[.64,.048],[.80,.027],[.94,.009],[1,0],[.94,-.004],[.8,-.011],[.64,-.019],[.47,-.027],[.33,-.032],[.22,-.033],[.12,-.029],[.06,-.020],[.025,-.013],[.008,-.006]];
  function wing(z0,z1,mat,le=1.23,chord=2.08,base=-.26,thickness=1){
    return smoothLoft(body,[z0,z1].map(z=>profile.map(([u,h])=>[le-u*chord,base+Math.abs(z)*Math.tan(THREE.MathUtils.degToRad(3.5))+h*chord*thickness,z])),mat,'z');
  }
  for(const s of [-1,1]){
    wing(s*.56,s*8.50,white);wing(s*8.50,s*9.03,red);
    // Juntas alerón/flap y bisagras bajo ala, sin superficies coplanares.
    const wy=z=>-.26+Math.abs(z)*Math.tan(THREE.MathUtils.degToRad(3.5));
    rod(body,[-.28,wy(s*.9)+.075,s*.9],[-.28,wy(s*8.45)+.075,s*8.45],.008,metal,6);
    for(const z of [1.1,2.6,4.2,5.8,7.4]){
      rod(body,[-.33,wy(s*z)-.055,s*z],[-.69,wy(s*z)-.15,s*z],.016,white,6);
    }
    box(body,[.65,.025,.35],[.12,wy(s*.86)+.21,s*.86],black);
  }
  // Wing-root fairings, tapering from the fuselage into the normal airfoil.
  for(const side of [-1,1]){
    const cuffs=[ [.59,.19], [.73,.12], [.90,.043], [1.12,0] ].map(([z,rise])=>profile.map(([u,h])=>[
      1.23-u*2.08,-.26+z*Math.tan(THREE.MathUtils.degToRad(3.5))+h*2.08+(h>0?rise*Math.sin(Math.PI*u)**.55+.002:-.002),side*z
    ]));smoothLoft(body,cuffs,white,'z');
  }
  // Estabilizador de aproximadamente 6 m: borde de ataque casi recto.
  for(const s of [-1,1]){
    const tailRing=(z)=>profile.map(([u,h])=>[-4.95-u*1.48,.24+h*1.48*.5,z]);
    smoothLoft(body,[tailRing(s*.10),tailRing(s*2.60)],white,'z');smoothLoft(body,[tailRing(s*2.60),tailRing(s*3)],bordo,'z');
    for(const y of [.24+1.48*.5*.085+.004,.24-1.48*.5*.033-.004]){const f=box(body,[.03,.004,.62],[-5.69,y,s*2.80],white);f.rotation.y=s*.55;}
    rod(body,[-5.65,-.10,s*.15],[-5.55,.22,s*2.30],.035,white);
  }
  poly(body,[[-6.65,.03],[-6.65,1.92],[-6.15,2.18],[-5.82,2.19],[-4.82,.27]],.105,white);
  poly(body,[[-6.65,1.42],[-6.65,1.92],[-6.15,2.18],[-5.82,2.19],[-5.42,1.42]],.11,bordo);
  poly(body,[[-6.65,1.31],[-6.65,1.36],[-5.39,1.36],[-5.36,1.31]],.11,bordo);
  // Las franjas del fuselaje siguen en diagonal por la base de la deriva y el timón.
  for(const [lo,hi] of [[-.165,-.09],[-.06,.08],[.115,.145]]){const c0=.37,sl=.35,x0=-5.3,x1=-6.65;
    poly(body,[[x0,c0+lo],[x1,c0+lo+sl*(x0-x1)],[x1,c0+hi+sl*(x0-x1)],[x0,c0+hi]],.112,bordo);}
  for(const s of [-1,1])rod(body,[-6.30,.2,s*.058],[-6.30,1.92,s*.058],.009,metal,6);
  rod(body,[-1.25,1.82,0],[-6.04,2.21,0],.008,black,6);
  // Compuerta de descarga y carenado rojo, entre las patas del tren.
  const hopperRing=(x,top,depth,w)=>{
    const a=[[x,top,-w],[x,top,w]];
    for(let i=0;i<=12;i++){const t=i*Math.PI/12;a.push([x,top-depth*Math.sin(t)**.7,w*Math.cos(t)]);}return a;
  };
  smoothLoft(body,[hopperRing(-1.50,-.54,.09,.31),hopperRing(-1.22,-.56,.27,.43),hopperRing(-.68,-.56,.44,.52),hopperRing(.40,-.54,.40,.52),hopperRing(.91,-.49,.22,.40),hopperRing(1.05,-.47,.07,.25)],red);
  rod(body,[-1.18,-.83,0],[.79,-.82,0],.013,black);
  // Open exhausts with continuous elbow, lip thickness and dark recess.
  for(const side of [-1,1]){
    const path=new THREE.CatmullRomCurve3([[3.12,.44,side*.36],[2.94,.41,side*.56],[2.73,.40,side*.62],[2.47,.40,side*.62]].map(V));
    mesh(body,new THREE.TubeGeometry(path,8,.128,12,false),exhaust);
    const lip=mesh(body,new THREE.TorusGeometry(.120,.008,4,12),metal,[2.47,.40,side*.62]);lip.rotation.y=Math.PI/2;
    const bore=mesh(body,new THREE.CylinderGeometry(.113,.113,.20,12,1,true),exhaust,[2.57,.40,side*.62]);bore.rotation.z=Math.PI/2;
    cylinder(body,.113,.006,[2.675,.40,side*.62],black,'x',12);
  }
  cylinder(body,.14,.06,[3.75,-.02,0],black,'x',16);
  // Hélice: pivote sobre x, diámetro 2.90 m, cinco palas con torsión discreta.
  const helice=new THREE.Group();helice.name='helice';helice.userData.dynamic=true;helice.position.set(3.82,.29,0);body.add(helice);
  const spinnerProfile=[[0,0],[0,.27],[.15,.26],[.37,.16],[.53,0]];
  const spinner=mesh(helice,new THREE.LatheGeometry(spinnerProfile.map(([x,r])=>new THREE.Vector2(r,x)),24),chrome);spinner.rotation.z=-Math.PI/2;
  for(let i=0;i<5;i++){
    const blade=new THREE.Group();blade.rotation.x=i*Math.PI*2/5;helice.add(blade);
    const sections=[[.22,.0,.105,.38],[.46,.02,.16,.26],[.92,.09,.145,.13],[1.32,.17,.10,.05],[1.45,.15,.035,0]];
    const rings=sections.map(([r,sweep,w,twist])=>[[-.024,r,sweep-w],[.024,r,sweep-w],[.024,r,sweep+w],[-.024,r,sweep+w]].map(([x,y,z])=>[x*Math.cos(twist)-z*Math.sin(twist),Math.sqrt(Math.max(0,y*y-(x*Math.sin(twist)+z*Math.cos(twist))**2)),x*Math.sin(twist)+z*Math.cos(twist)]));
    loft(blade,rings.slice(0,4),black);loft(blade,rings.slice(3),white);
  }
  compact(helice);
  // Matrícula en dos planos con orientación propia, nunca escala negativa.
  const registration=canvasMaterial(1024,192,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#28282a';c.font='bold 145px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('AUR-AV',w/2,h/2,w*.94);});
  registration.alphaTest=.5;for(const s of [-1,1]){label(body,registration,1.05,.17,[-4.3,-.13,s*.345],s<0?Math.PI+.12:-.12);}
  // Tren en coordenadas de suelo: apoyo exacto, trocha entre centros y batalla horizontal.
  body.updateMatrixWorld(true);const attach=(p)=>body.localToWorld(V(p)).toArray();
  for(const s of [-1,1]){
    const a=attach([.72,-.51,s*.55]),b=[.90,.50,s*1.535];const strut=box(root,[.18,V(b).sub(V(a)).length(),.085],V(a).add(V(b)).multiplyScalar(.5).toArray(),red);strut.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),V(b).sub(V(a)).normalize());rod(root,[b[0],b[1],b[2]],[b[0],b[1]+.14,b[2]],.065,metal);
    rod(root,attach([-.10,-.45,s*.51]),[.90,.56,s*1.535],.045,red);
    wheel(root,.90,.48,s*1.535,.48,.29,black,metal);
  }
  const tx=.90-7.26;
  rod(root,attach([-6.20,-.08,0]),[tx+.13,.29,0],.042,red);
  for(const s of [-1,1])rod(root,[tx+.13,.31,s*.085],[tx,.19,s*.085],.025,red);
  wheel(root,tx,.19,0,.19,.13,black,metal);
  cylinder(root,.066,.24,[tx+.13,.46,0],red,'y',12);
  for(const side of [-1,1]){rod(root,[tx+.11,.50,side*.075],[tx+.39,.67,side*.12],.016,metal);rod(root,[tx+.12,.34,side*.115],[tx,.19,side*.115],.035,red);}

  // Escalones, manijas y líneas hidráulicas localizadas con las fotos reales.
  for(const side of [-1,1]){
    rod(body,[-1.68,-.42,side*.66],[-1.78,-1.02,side*.92],.025,metal);
    rod(body,[-2.04,-.40,side*.61],[-2.12,-1.02,side*.92],.025,metal);
    rod(body,[-1.78,-1.02,side*.92],[-2.12,-1.02,side*.92],.024,black);
    for(const x of [1.27,.78]){rod(body,[x-.07,.04,side*.70],[x-.07,.12,side*.735],.013,metal);rod(body,[x+.07,.04,side*.70],[x+.07,.12,side*.735],.013,metal);rod(body,[x-.07,.12,side*.735],[x+.07,.12,side*.735],.013,metal);}
    rod(body,[-1.20,-.68,side*.30],[.68,-.68,side*.30],.017,metal);
  }
  // Barras y bisagras de la compuerta; costuras de panel bajo el vientre.
  for(const x of [-1.0,-.48,.12,.55])rod(body,[x,-.93,-.37],[x,-.93,.37],.020,metal);
  const lidSeam=material(0x929b9d,{roughness:.9});
  for(const side of [-1,1]){
    for(const z of [1.5,3,4.5,6,7.5])rod(body,[1.13,-.22+z*.061,side*z],[-.76,-.20+z*.061,side*z],.003,lidSeam,4);
    for(const z of [1.15,2.1,3.05,4,4.95,5.9,6.85,7.8]){const ring=mesh(body,new THREE.TorusGeometry(.075,.003,3,10),lidSeam,[.37,-.26+z*.061+.178,side*z]);ring.rotation.x=Math.PI/2;}
    const nav=material(side>0?0x208845:0xc82521,{emissive:side>0?0x124925:0x601014,emissiveIntensity:.35});mesh(body,new THREE.SphereGeometry(.043,10,6),nav,[.62,.36,side*8.97]);
  }
  // Anclajes vacíos, conservados por la combinación de mallas.
  // +z es estribor; babor/izquierda corresponde a -z.
  // Válvulas de carga de agua (fotos AAXOD 24/9): caño transversal bajo la panza detrás de la tolva, con mangueras verdes
  // y abrazaderas, cuerpo de válvula cuadrado a cada lado y codo con acople camlock apuntando abajo y afuera. Palanca colgante.
  {
    const verde=material(0x1f8f7a,{roughness:.7}),xa=-1.62,ya=-.62;
    rod(body,[xa,ya,-.62],[xa,ya,.62],.04,metal,10);
    for(const z of [-.32,.32]){rod(body,[xa,ya,z-.11],[xa,ya,z+.11],.052,verde,10);for(const dz of [-.08,.08])mesh(body,new THREE.TorusGeometry(.055,.006,3,10),metal,[xa,ya,z+dz]);}
    for(const s of [-1,1]){
      box(body,[.24,.26,.18],[xa,ya,s*.70],metal);
      cylinder(body,.10,.02,[xa+.13,ya,s*.70],metal,'x',12);
      const codo=new THREE.CatmullRomCurve3([[xa,ya,s*.79],[xa,ya-.02,s*.90],[xa,ya-.14,s*.98],[xa,ya-.30,s*1.00]].map(V));
      mesh(body,new THREE.TubeGeometry(codo,8,.075,10,false),metal);
      mesh(body,new THREE.TorusGeometry(.08,.012,4,12),metal,[xa,ya-.30,s*1.00]).rotation.x=Math.PI/2;
      cylinder(body,.06,.06,[xa,ya-.33,s*1.00],black,'y',10);
      rod(body,[xa+.04,ya-.12,s*.66],[xa+.02,ya-.62,s*.62],.012,metal,6);box(body,[.10,.04,.03],[xa+.02,ya-.63,s*.62],metal);
    }
  }
  const acople=new THREE.Object3D();acople.name='acople-carga';
  acople.position.set(-1.62,-.96,-1.00);acople.rotation.z=Math.PI/2;
  acople.userData.descripcion='Boca camlock de la válvula de carga izquierda (babor), bajo la panza detrás de la tolva; +x local apunta hacia abajo.';
  body.add(acople);
  const acopleD=new THREE.Object3D();acopleD.name='acople-carga-derecho';acopleD.position.set(-1.62,-.96,1.00);acopleD.rotation.z=Math.PI/2;body.add(acopleD);
  const piloto=new THREE.Object3D();piloto.name='cabina-piloto';
  piloto.position.set(-1.05,.88,0);piloto.userData.descripcion='Centro superior del asiento delantero; +x local hacia la nariz.';
  body.add(piloto);
  root.userData.version=4;
  // Integración con el juego «Control del sector»: disco de hélice en marcha, motor encendido/apagado y actualización por cuadro.
  const disco=new THREE.Mesh(new THREE.CircleGeometry(1.45,40),new THREE.MeshBasicMaterial({color:0x333333,transparent:true,opacity:.12,side:THREE.DoubleSide,depthWrite:false}));
  disco.rotation.y=Math.PI/2;disco.position.x=.1;disco.visible=false;disco.name='disco';helice.add(disco);
  root.userData.motor=false;
  root.userData.ponerMotor=en=>{root.userData.motor=en;disco.visible=en;};
  root.userData.actualizar=dt=>{if(root.userData.motor)helice.rotation.x+=dt*40;};
  root.userData.helice=helice;root.userData.cotas={envergadura:18.06,largoFuselaje:11,cuerda:2.08,diedro:3.5,cabeceo:9.5,trocha:3.07,batalla:7.26};
  root.userData.contactos=[[0,0,-1.535],[0,0,1.535],[-7.26,0,0]];
  compact(root);
  // Recentrar toda la geometría y los pivotes, sin mover el Group devuelto.
  for(const child of root.children)child.position.x-=.90;
  root.updateMatrixWorld(true);
  return finish(root);
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
