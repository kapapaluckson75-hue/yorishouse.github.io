import * as THREE from 'three';

/* ============================== CORE ============================== */
let renderer;
try{
  renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
}catch(e){ document.getElementById('fallback').style.display='flex'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.className='webgl';
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfe6f0, 90, 430);
const camera = new THREE.PerspectiveCamera(68, innerWidth/innerHeight, 0.1, 1200);

const rand=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
const angDamp=(a,b,k,dt)=>{let d=((b-a+Math.PI*3)%(Math.PI*2))-Math.PI;return a+d*(1-Math.exp(-k*dt));};

/* ============================== SKY / LIGHT ============================== */
const skyUni = {
  topColor:{value:new THREE.Color(0x5f9fd4)}, horColor:{value:new THREE.Color(0xcfe6f0)},
  sunDir:{value:new THREE.Vector3(0,1,0)}, sunColor:{value:new THREE.Color(0xfff8ea)}, sunI:{value:1}
};
const skyMat = new THREE.ShaderMaterial({
  uniforms:skyUni, side:THREE.BackSide, depthWrite:false, fog:false,
  vertexShader:`varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader:`
    varying vec3 vDir; uniform vec3 topColor,horColor,sunColor; uniform vec3 sunDir; uniform float sunI;
    void main(){
      vec3 d=normalize(vDir);
      float h=clamp(d.y,0.0,1.0);
      vec3 col=mix(horColor,topColor,pow(h,0.55));
      float s=max(dot(d,normalize(sunDir)),0.0);
      col+=sunColor*(pow(s,420.0)*1.6+pow(s,10.0)*0.22)*sunI;
      col=mix(col,horColor*0.92,smoothstep(0.0,-0.25,d.y));
      gl_FragColor=vec4(col,1.0);
    }`
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(560,32,16), skyMat));

const starGeo=new THREE.BufferGeometry();
{ const p=[]; for(let i=0;i<700;i++){ const t=Math.random()*Math.PI*2, e=Math.acos(Math.random()*0.95);
  p.push(520*Math.sin(e)*Math.cos(t), 520*Math.cos(e)+20, 520*Math.sin(e)*Math.sin(t)); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(p,3)); }
const starMat=new THREE.PointsMaterial({color:0xcfe0ff,size:1.7,transparent:true,opacity:0,fog:false,depthWrite:false});
scene.add(new THREE.Points(starGeo,starMat));

const moonMesh=new THREE.Mesh(new THREE.CircleGeometry(14,24),
  new THREE.MeshBasicMaterial({color:0xe9edf6,transparent:true,opacity:0,fog:false,depthWrite:false}));
scene.add(moonMesh);

const sunLight=new THREE.DirectionalLight(0xffffff,3.2);
sunLight.castShadow=true;
sunLight.shadow.mapSize.set(2048,2048);
Object.assign(sunLight.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:20,far:320});
sunLight.shadow.bias=-0.0004; sunLight.shadow.normalBias=0.03;
scene.add(sunLight, sunLight.target);
const moonLight=new THREE.DirectionalLight(0x8fa3d8,0); scene.add(moonLight);
const hemi=new THREE.HemisphereLight(0xbcd4e8,0x3a3f45,0.6); scene.add(hemi);

/* ============================== TEXTURES ============================== */
function canvasTex(w,h,draw){ const c=document.createElement('canvas'); c.width=w;c.height=h;
  draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t; }

const pavementTex=canvasTex(256,256,(g)=>{ g.fillStyle='#b6b3a9'; g.fillRect(0,0,256,256);
  for(let i=0;i<900;i++){g.fillStyle=`rgba(${Math.random()>0.5?60:250},${100+Math.random()*60|0},90,${Math.random()*0.06})`;g.fillRect(Math.random()*256,Math.random()*256,2,2);}
  g.strokeStyle='#98958b';g.lineWidth=3;
  for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*64,0);g.lineTo(i*64,256);g.stroke();g.beginPath();g.moveTo(0,i*64);g.lineTo(256,i*64);g.stroke();}});
pavementTex.wrapS=pavementTex.wrapT=THREE.RepeatWrapping; pavementTex.repeat.set(10,7); pavementTex.anisotropy=4;

const gravelTex=canvasTex(256,256,(g)=>{ g.fillStyle='#8d8a84'; g.fillRect(0,0,256,256);
  for(let i=0;i<2600;i++){const v=90+Math.random()*80|0;g.fillStyle=`rgb(${v},${v-4},${v-8})`;g.fillRect(Math.random()*256,Math.random()*256,2,2);}});
gravelTex.wrapS=gravelTex.wrapT=THREE.RepeatWrapping; gravelTex.repeat.set(6,4);

const facadeTex=canvasTex(128,256,(g)=>{ g.fillStyle='#232a33'; g.fillRect(0,0,128,256);
  for(let y=0;y<8;y++)for(let x=0;x<4;x++){ const lit=Math.random()<0.32;
    g.fillStyle=lit?`rgba(255,${200+Math.random()*40|0},${140+Math.random()*50|0},0.95)`:'#39434f';
    g.fillRect(8+x*30,10+y*30,22,20); }});
facadeTex.wrapS=facadeTex.wrapT=THREE.RepeatWrapping;

const signTex=canvasTex(1024,160,(g)=>{ g.fillStyle='#0d141c'; g.fillRect(0,0,1024,160);
  g.fillStyle='#ff7a1a'; g.fillRect(24,40,14,80);
  g.fillStyle='#f2f6f8'; g.font='900 92px Arial'; g.textBaseline='middle';
  g.fillText('MERIDIAN TOWER',70,86); });

const clockTex=canvasTex(128,128,(g)=>{ g.fillStyle='#f4f4ef'; g.beginPath(); g.arc(64,64,62,0,7); g.fill();
  g.strokeStyle='#222'; g.lineWidth=4;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2; g.beginPath();
    g.moveTo(64+Math.sin(a)*52,64-Math.cos(a)*52); g.lineTo(64+Math.sin(a)*58,64-Math.cos(a)*58); g.stroke();}
  g.lineWidth=5; g.beginPath(); g.moveTo(64,64); g.lineTo(64-26,64-18); g.stroke();
  g.beginPath(); g.moveTo(64,64); g.lineTo(64+14,64-38); g.stroke();
  g.fillStyle='#c0392b'; g.beginPath(); g.arc(64,64,4,0,7); g.fill(); });

const heliTex=canvasTex(256,256,(g)=>{ g.fillStyle='#3a3d42'; g.fillRect(0,0,256,256);
  g.strokeStyle='#e8c23a'; g.lineWidth=10; g.beginPath(); g.arc(128,128,100,0,7); g.stroke();
  g.fillStyle='#e8c23a'; g.font='900 130px Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('H',128,134); });

const dirTex=canvasTex(256,320,(g)=>{ g.fillStyle='#101a24'; g.fillRect(0,0,256,320);
  g.fillStyle='#ff7a1a'; g.font='700 26px Arial'; g.fillText('MERIDIAN TOWER',20,42);
  g.fillStyle='#39d0b8'; g.font='600 17px monospace';
  ['L3  ATLAS STUDIO','L2  NORTHWIND LABS','L1  LOBBY · RECEPTION','G   PLAZA · PARKING'].forEach((s,i)=>g.fillText(s,20,100+i*52));
  g.strokeStyle='#2a3a48'; for(let i=0;i<3;i++){g.beginPath();g.moveTo(20,120+i*52);g.lineTo(236,120+i*52);g.stroke();}});

const wbTex=canvasTex(320,200,(g)=>{ g.fillStyle='#fafafa'; g.fillRect(0,0,320,200);
  g.strokeStyle='#2456a8'; g.lineWidth=3; g.beginPath(); g.moveTo(24,40); g.bezierCurveTo(90,10,150,70,230,34); g.stroke();
  g.strokeStyle='#c0392b'; g.strokeRect(24,80,110,60); g.beginPath(); g.moveTo(24,80); g.lineTo(134,140); g.stroke();
  g.fillStyle='#1c7a4a'; g.font='700 20px Arial'; g.fillText('Q3 → SHIP IT',170,110);
  g.strokeStyle='#444'; g.beginPath(); g.arc(250,150,22,0,4.5); g.stroke(); });

const flagTex=canvasTex(160,100,(g)=>{ g.fillStyle='#ff7a1a'; g.fillRect(0,0,160,100);
  g.fillStyle='#fff'; g.beginPath(); g.arc(80,50,26,0,7); g.fill();
  g.fillStyle='#ff7a1a'; g.font='900 34px Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('M',80,52); });

const rugTex=canvasTex(256,256,(g)=>{ g.fillStyle='#54606e'; g.fillRect(0,0,256,256);
  g.strokeStyle='#3e4854'; g.lineWidth=6; g.strokeRect(14,14,228,228); g.strokeRect(40,40,176,176); });

/* ============================== MATERIALS ============================== */
const M={
  concrete:new THREE.MeshStandardMaterial({color:0xc9c6bd,roughness:.9}),
  slab:new THREE.MeshStandardMaterial({color:0xd6d3ca,roughness:.85}),
  fascia:new THREE.MeshStandardMaterial({color:0x2b3138,roughness:.6,metalness:.3}),
  mullion:new THREE.MeshStandardMaterial({color:0x262b31,roughness:.5,metalness:.5}),
  glass:new THREE.MeshStandardMaterial({color:0x9fc6d8,roughness:.06,metalness:.45,transparent:true,opacity:.16,
    side:THREE.DoubleSide,depthWrite:false,emissive:0xffcf90,emissiveIntensity:0}),
  shaftGlass:new THREE.MeshStandardMaterial({color:0xaad4e4,roughness:.08,metalness:.4,transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false}),
  steel:new THREE.MeshStandardMaterial({color:0x9aa1a8,roughness:.4,metalness:.7}),
  dark:new THREE.MeshStandardMaterial({color:0x2e3238,roughness:.7}),
  wood:new THREE.MeshStandardMaterial({color:0xa97c50,roughness:.7}),
  deskTop:new THREE.MeshStandardMaterial({color:0xd8cbb4,roughness:.6}),
  deskLeg:new THREE.MeshStandardMaterial({color:0x6b7076,roughness:.5,metalness:.4}),
  monitor:new THREE.MeshStandardMaterial({color:0x1c1f24,roughness:.4,metalness:.3}),
  screen:new THREE.MeshStandardMaterial({color:0x0a1420,emissive:0x9fd0ff,emissiveIntensity:.9,roughness:.3}),
  keyboard:new THREE.MeshStandardMaterial({color:0x33373d,roughness:.6}),
  paper:new THREE.MeshStandardMaterial({color:0xf2f0e8,roughness:.9}),
  mugA:new THREE.MeshStandardMaterial({color:0xc05a3a,roughness:.5}),
  chairSeat:new THREE.MeshStandardMaterial({color:0x37414d,roughness:.8}),
  chairBack:new THREE.MeshStandardMaterial({color:0x2f3843,roughness:.8}),
  chairBase:new THREE.MeshStandardMaterial({color:0x20242a,roughness:.4,metalness:.6}),
  cabinet:new THREE.MeshStandardMaterial({color:0x8f959c,roughness:.5,metalness:.3}),
  cabHandle:new THREE.MeshStandardMaterial({color:0x3a3f45,roughness:.4,metalness:.5}),
  pot:new THREE.MeshStandardMaterial({color:0x8a5a3a,roughness:.8}),
  leaf:new THREE.MeshStandardMaterial({color:0x3e7a44,roughness:.9}),
  leaf2:new THREE.MeshStandardMaterial({color:0x54915a,roughness:.9}),
  cooler:new THREE.MeshStandardMaterial({color:0xe8e8e4,roughness:.5}),
  bottle:new THREE.MeshStandardMaterial({color:0x6ab8e8,roughness:.1,transparent:true,opacity:.55}),
  sofa:new THREE.MeshStandardMaterial({color:0xb06a3e,roughness:.9}),
  sofa2:new THREE.MeshStandardMaterial({color:0x4a6a78,roughness:.9}),
  white:new THREE.MeshStandardMaterial({color:0xf0efe8,roughness:.6}),
  ceil:new THREE.MeshStandardMaterial({color:0xe4e2da,roughness:.9}),
  ceilPanel:new THREE.MeshStandardMaterial({color:0xf4f2ea,emissive:0xffe6bf,emissiveIntensity:.2,roughness:.4}),
  trunk:new THREE.MeshStandardMaterial({color:0x6e4f34,roughness:.9}),
  fol1:new THREE.MeshStandardMaterial({color:0x4c7a3e,roughness:.95}),
  fol2:new THREE.MeshStandardMaterial({color:0x5f8f4a,roughness:.95}),
  road:new THREE.MeshStandardMaterial({color:0x3d4148,roughness:.95}),
  dash:new THREE.MeshStandardMaterial({color:0xd8d5c8,roughness:.8}),
  walk:new THREE.MeshStandardMaterial({color:0xc6c3ba,roughness:.9}),
  bench:new THREE.MeshStandardMaterial({color:0x7a5a3a,roughness:.8}),
  lampPost:new THREE.MeshStandardMaterial({color:0x3a4046,roughness:.5,metalness:.5}),
  lampHead:new THREE.MeshStandardMaterial({color:0xf8f4e0,emissive:0xffdf9e,emissiveIntensity:0,roughness:.4}),
  carGlass:new THREE.MeshStandardMaterial({color:0x1a2530,roughness:.1,metalness:.6}),
  tire:new THREE.MeshStandardMaterial({color:0x1c1e22,roughness:.9}),
  headlight:new THREE.MeshStandardMaterial({color:0xfff8dc,emissive:0xfff2c0,emissiveIntensity:0}),
  taillight:new THREE.MeshStandardMaterial({color:0x661a1a,emissive:0xff2a2a,emissiveIntensity:0}),
  beacon:new THREE.MeshStandardMaterial({color:0x551111,emissive:0xff2222,emissiveIntensity:.3}),
  elevator:new THREE.MeshStandardMaterial({color:0xb8bcc2,roughness:.35,metalness:.6}),
  elevDoor:new THREE.MeshStandardMaterial({color:0x9aa0a8,roughness:.3,metalness:.7}),
  carBody:c=>new THREE.MeshStandardMaterial({color:c,roughness:.3,metalness:.5}),
  callLed:c=>new THREE.MeshStandardMaterial({color:0x222222,emissive:c,emissiveIntensity:.15}),
};
const binderMats=[0xb0543a,0x3a6ab0,0x3e8a5a,0xc8a03c,0x6a5aa0,0x48606e].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.8}));
const carpetMats=[0x8b9db0,0x9aa88f,0xb09a8c].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:1}));

/* ============================== INSTANCING ============================== */
const boxCache={};
const B=(w,h,d)=>{const k=w+','+h+','+d; if(!boxCache[k])boxCache[k]=new THREE.BoxGeometry(w,h,d); return boxCache[k];};
const CYL=(rt,rb,h,s=12)=>new THREE.CylinderGeometry(rt,rb,h,s);
const INST={};
const reg=(k,g,m)=>{INST[k]={g,m,list:[]};};
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_s=new THREE.Vector3();
function put(k,x,y,z,ry=0,sx=1,sy=1,sz=1,rx=0,rz=0){
  _e.set(rx,ry,rz); _q.setFromEuler(_e); _p.set(x,y,z); _s.set(sx,sy,sz);
  _m.compose(_p,_q,_s); INST[k].list.push(_m.clone());
}
function bake(){
  for(const k in INST){ const o=INST[k]; if(!o) continue; const {g,m,list}=o; if(!list.length)continue;
    const im=new THREE.InstancedMesh(g,m,list.length);
    list.forEach((mm,i)=>im.setMatrixAt(i,mm));
    im.castShadow=true; im.receiveShadow=true; scene.add(im); }
}
reg('deskTop',B(1.5,.05,.72),M.deskTop); reg('deskPanel',B(.05,.7,.66),M.deskLeg); reg('deskModesty',B(1.4,.35,.04),M.deskLeg);
reg('monBody',B(.52,.34,.045),M.monitor); reg('monStand',B(.06,.14,.1),M.monitor); reg('monFoot',B(.22,.02,.14),M.monitor);
reg('monScreen',new THREE.PlaneGeometry(.47,.29),M.screen);
reg('kbd',B(.36,.022,.13),M.keyboard); reg('mouse',B(.06,.02,.1),M.keyboard);
reg('mug',CYL(.035,.03,.09,10),M.mugA); reg('pen',CYL(.006,.006,.13,6),M.dark);
reg('paper',B(.22,.006,.3),M.paper); reg('tray',B(.26,.05,.34),M.dark); reg('stapler',B(.12,.04,.05),M.mugA);
reg('chSeat',B(.46,.06,.46),M.chairSeat); reg('chBack',B(.44,.55,.06),M.chairBack);
reg('chPole',CYL(.03,.03,.32,8),M.chairBase); reg('chBase',B(.5,.04,.08),M.chairBase);
reg('cabinet',B(.46,1.32,.56),M.cabinet); reg('cabFront',B(.4,.26,.02),M.cabHandle); reg('cabH',B(.14,.02,.02),M.cabHandle);
reg('pot',CYL(.2,.15,.3,10),M.pot); reg('leafA',new THREE.SphereGeometry(.28,8,6),M.leaf); reg('leafB',new THREE.SphereGeometry(.22,8,6),M.leaf2);
reg('coolBody',B(.34,1.0,.34),M.cooler); reg('coolBottle',CYL(.13,.13,.34,10),M.bottle);
binderMats.forEach((m,i)=>reg('binder'+i,B(.05,.3,.24),m));
reg('col',B(.34,3.3,.34),M.slab); reg('mullV',B(.09,3.3,.09),M.mullion); reg('mullH',B(1,0.09,0.09),M.mullion);
reg('glassPane',B(1,3.3,.05),M.glass);
reg('parapet',B(1,1.0,.16),M.fascia); reg('fascia',B(1,.5,.1),M.fascia);
reg('ceilPanel',B(1.3,.05,.7),M.ceilPanel);
reg('treeTrunk',CYL(.12,.16,1.6,7),M.trunk); reg('folRound',new THREE.SphereGeometry(1,8,6),M.fol1); reg('folCone',new THREE.ConeGeometry(.9,2.4,8),M.fol2);
reg('lampPole',CYL(.06,.08,5,8),M.lampPost); reg('lampArm',B(.9,.07,.07),M.lampPost); reg('lampHeadB',B(.5,.12,.28),M.lampHead);
reg('benchSlat',B(1.7,.07,.16),M.bench); reg('benchLeg',B(.08,.4,.5),M.dark);
reg('dashW',B(.16,.02,1.4),M.dash);
reg('planter',B(1.1,.55,1.1),M.concrete); reg('shrub',new THREE.SphereGeometry(.5,8,6),M.fol2);
reg('postBollard',CYL(.07,.07,.8,8),M.dark);
reg('shelfBoard',B(1.8,.04,.3),M.wood); reg('shelfSide',B(.04,1.5,.3),M.wood);
reg('vent',B(.7,.03,.7),M.steel);

/* ============================== GROUND / CITY ============================== */
const grass=new THREE.Mesh(new THREE.PlaneGeometry(700,700),new THREE.MeshStandardMaterial({color:0x7d9a68,roughness:1}));
grass.rotation.x=-Math.PI/2; grass.receiveShadow=true; scene.add(grass);

const plaza=new THREE.Mesh(new THREE.PlaneGeometry(68,48),new THREE.MeshStandardMaterial({map:pavementTex,roughness:.95}));
plaza.rotation.x=-Math.PI/2; plaza.position.y=.01; plaza.receiveShadow=true; scene.add(plaza);

{ const roadShape=new THREE.Shape();
  roadShape.moveTo(-44,-32); roadShape.lineTo(44,-32); roadShape.lineTo(44,32); roadShape.lineTo(-44,32); roadShape.closePath();
  const hole=new THREE.Path(); hole.moveTo(-36,-24); hole.lineTo(-36,24); hole.lineTo(36,24); hole.lineTo(36,-24); hole.closePath();
  roadShape.holes.push(hole);
  const roadMesh=new THREE.Mesh(new THREE.ShapeGeometry(roadShape),M.road);
  roadMesh.rotation.x=-Math.PI/2; roadMesh.position.y=.02; roadMesh.receiveShadow=true; scene.add(roadMesh);
  for(let x=-36;x<=36;x+=4){ put('dashW',x,.045,28); put('dashW',x,.045,-28); }
  for(let z=-24;z<=24;z+=4){ put('dashW',40,.045,z,Math.PI/2); put('dashW',-40,.045,z,Math.PI/2); }
}
{ const w=new THREE.Mesh(new THREE.PlaneGeometry(6,10),M.walk); w.rotation.x=-Math.PI/2; w.position.set(0,.03,13); w.receiveShadow=true; scene.add(w); }

const cityMats=[];
for(let i=0;i<16;i++){
  const w=rand(14,30),h=rand(18,72),d=rand(14,30);
  const t=facadeTex.clone(); t.needsUpdate=true; t.repeat.set(Math.max(1,Math.round(w/10)),Math.max(1,Math.round(h/12)));
  const m=new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:0xffcf8a,emissiveIntensity:0,roughness:.9,color:0xb8bcc4});
  cityMats.push(m);
  const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
  const a=i/16*Math.PI*2+rand(-.15,.15), r=rand(130,230);
  b.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r); b.rotation.y=rand(0,Math.PI);
  scene.add(b);
}

function tree(x,z,conifer=false,s=1){
  put('treeTrunk',x,.8*s,z,0,s,s,s);
  if(conifer){ put('folCone',x,2.3*s,z,0,s,s,s); put('folCone',x,3.4*s,z,0,s*.7,s*.7,s*.7); }
  else{ put('folRound',x,2.2*s,z,rand(0,3),1.15*s,0.95*s,1.15*s);
        put('folRound',x+.5*s,1.8*s,z+.3*s,0,.7*s,.6*s,.7*s);
        put('folRound',x-.5*s,1.9*s,z-.2*s,0,.65*s,.6*s,.65*s); }
}
[[-30,-18],[-20,-21],[-8,-21],[8,-21],[20,-21],[30,-18],[32,-6],[32,8],[-32,-6],[-32,8],[-26,19],[26,19]].forEach(p=>tree(p[0],p[1],Math.random()<.3,rand(.9,1.4)));
tree(18,14,false,1.5); tree(-16,15,false,1.3);

const lampLights=[];
[[-30,-20],[30,-20],[-30,20],[30,20]].forEach(p=>{
  put('lampPole',p[0],2.5,p[1]); put('lampArm',p[0]+ (p[0]>0?-.4:.4),4.95,p[1]);
  put('lampHeadB',p[0]+(p[0]>0?-.75:.75),4.9,p[1]);
  const L=new THREE.PointLight(0xffdf9e,0,26,2); L.position.set(p[0]+(p[0]>0?-.75:.75),4.75,p[1]); scene.add(L); lampLights.push(L);
});
function bench(x,z,ry){ put('benchSlat',x,.45,z,ry); put('benchLeg',x-.6,.22,z,ry); put('benchLeg',x+.6,.22,z,ry); }
bench(-9,13.5,0); bench(9,13.5,0);
put('planter',-3.6,.275,9.6); put('shrub',-3.6,1.0,9.6,0,1,1.2,1);
put('planter',3.6,.275,9.6); put('shrub',3.6,1.0,9.6,0,1.1,1,1.1);
for(let x=-6;x<=6;x+=3) put('postBollard',x,.4,17.5);

const flagGroup=new THREE.Group(); flagGroup.position.set(14,0,15); scene.add(flagGroup);
{ const pole=new THREE.Mesh(CYL(.05,.07,6.4,8),M.lampPost); pole.position.y=3.2; pole.castShadow=true; flagGroup.add(pole); }
const flagGeo=new THREE.PlaneGeometry(1.9,1.15,22,10);
const flagMesh=new THREE.Mesh(flagGeo,new THREE.MeshStandardMaterial({map:flagTex,side:THREE.DoubleSide,roughness:.9}));
flagMesh.position.set(.98,5.6,0); flagMesh.castShadow=true; flagGroup.add(flagMesh);
const flagBase=flagGeo.attributes.position.array.slice();

const cloudMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.92});
const clouds=[];
for(let i=0;i<6;i++){ const g=new THREE.Group();
  for(let j=0;j<5;j++){ const s=new THREE.Mesh(new THREE.SphereGeometry(rand(4,8),8,6),cloudMat);
    s.position.set(rand(-9,9),rand(-1.5,1.5),rand(-4,4)); s.scale.y=.45; g.add(s); }
  g.position.set(rand(-240,240),rand(58,92),rand(-200,200)); scene.add(g); clouds.push(g); }

const birds=[];
{ const wingGeo=new THREE.PlaneGeometry(.7,.28);
  const birdMat=new THREE.MeshBasicMaterial({color:0x2a3038,side:THREE.DoubleSide});
  for(let i=0;i<6;i++){ const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.ConeGeometry(.08,.4,5),birdMat); body.rotation.x=Math.PI/2; g.add(body);
    const w1=new THREE.Mesh(wingGeo,birdMat), w2=new THREE.Mesh(wingGeo,birdMat);
    w1.position.x=.32; w2.position.x=-.32; g.add(w1,w2);
    g.userData={r:rand(38,80),h:rand(26,48),sp:rand(.12,.24),ph:rand(0,6),w1,w2};
    scene.add(g); birds.push(g); } }

function buildCar(color){
  const g=new THREE.Group();
  const body=new THREE.Mesh(B(1.85,.5,4.2),M.carBody(color)); body.position.y=.55; body.castShadow=true; g.add(body);
  const cab=new THREE.Mesh(B(1.6,.45,2.1),M.carGlass); cab.position.set(0,1.0,-.2); cab.castShadow=true; g.add(cab);
  const wheels=[];
  [[-.85,1.35],[.85,1.35],[-.85,-1.35],[.85,-1.35]].forEach(p=>{
    const w=new THREE.Mesh(CYL(.32,.32,.22,12),M.tire); w.rotation.z=Math.PI/2;
    w.position.set(p[0],.32,p[1]); w.castShadow=true; g.add(w); wheels.push(w); });
  [[-.55,2.12],[.55,2.12]].forEach(p=>{ const h=new THREE.Mesh(B(.3,.14,.06),M.headlight); h.position.set(p[0],.62,p[1]); g.add(h); });
  [[-.55,-2.12],[.55,-2.12]].forEach(p=>{ const h=new THREE.Mesh(B(.3,.14,.06),M.taillight); h.position.set(p[0],.62,p[1]); g.add(h); });
  g.userData={wheels}; scene.add(g); return g;
}
const mover=buildCar(0xc05a3a);
/* parked cars face the traffic flow of their side: left edge flows -Z, right edge flows +Z */
const cars = [];
[[-41.2,10,Math.PI,0x3e6fb0],[-41.2,-8,Math.PI,0x8a8f96],[41.2,4,0,0x4a6a52]].forEach(c=>{
  const p=buildCar(c[3]); p.position.set(c[0],0,c[1]); p.rotation.y=c[2]; cars.push(p); });

/* ============================== BUILDING ============================== */
const BW=26,BD=16,FH=3.6,FLOORS=[0,3.6,7.2],ROOF=10.8;
FLOORS.concat([ROOF]).forEach(y=>{
  const slab=new THREE.Mesh(B(BW+.5,.3,BD+.5),M.slab); slab.position.set(0,y-.15,0);
  slab.castShadow=true; slab.receiveShadow=true; scene.add(slab);
});
FLOORS.concat([ROOF]).forEach(y=>{
  put('fascia',0,y-.35,BD/2+.28,0,BW+.6,1,1); put('fascia',0,y-.35,-BD/2-.28,0,BW+.6,1,1);
  put('fascia',BW/2+.28,y-.35,0,Math.PI/2,BD+.6,1,1); put('fascia',-BW/2-.28,y-.35,0,Math.PI/2,BD+.6,1,1);
});
const colX=[-12.6,-8.4,-4.2,0,4.2,8.4,12.6];
FLOORS.forEach(fy=>{
  const cy=fy+1.65;
  colX.forEach(x=>{ put('col',x,cy,7.7); put('col',x,cy,-7.7); });
  [-7.7,7.7].forEach(z=>{ for(let x=-12.6;x<=12.61;x+=2.1) put('mullV',x,cy,z); });
  for(let z=-7.7;z<=7.71;z+=2.2){ put('mullV',12.95,cy,z,Math.PI/2); put('mullV',-12.95,cy,z,Math.PI/2); }
  [-7.7,7.7].forEach(z=>put('mullH',0,fy+2.2,z,0,BW,1,1));
  [-12.95,12.95].forEach(x=>put('mullH',x,fy+2.2,0,Math.PI/2,BD,1,1));
  for(let x=-11.55;x<=12;x+=2.1){ put('glassPane',x,cy,7.95,0,2.12,1,1); put('glassPane',x,cy,-7.95,0,2.12,1,1); }
  for(let z=-6.6;z<=7.7;z+=2.2){ put('glassPane',12.95,cy,z,Math.PI/2,2.22,1,1); put('glassPane',-12.95,cy,z,Math.PI/2,2.22,1,1); }
  for(let x=-10;x<=11;x+=4.2) for(let z=-5.5;z<=6;z+=3.8) put('ceilPanel',x,fy+3.28,z);
  put('vent',6,fy+3.29,0); put('vent',-2,fy+3.29,-5);
});
for(let x=-12.9;x<=12.91;x+=1.8){ put('parapet',x,ROOF+.5,8.1,0,1.8,1,1); put('parapet',x,ROOF+.5,-8.1,0,1.8,1,1); }
for(let z=-8.1;z<=8.11;z+=1.8){ put('parapet',12.9,ROOF+.5,z,Math.PI/2,1.8,1,1); put('parapet',-12.9,ROOF+.5,z,Math.PI/2,1.8,1,1); }

const coreMat=new THREE.MeshStandardMaterial({color:0xb8b4aa,roughness:.9});
const stairBlock=new THREE.Mesh(B(3,ROOF+.3,5),coreMat);
stairBlock.position.set(-10.9,(ROOF)/2+.15,-5); stairBlock.castShadow=true; stairBlock.receiveShadow=true; scene.add(stairBlock);
const shaftGlass=new THREE.Mesh(B(2.3,ROOF+.6,2.3),M.shaftGlass);
shaftGlass.position.set(-10.5,(ROOF+.3)/2,0); scene.add(shaftGlass);
const machRoom=new THREE.Mesh(B(2.7,1.1,2.7),M.fascia); machRoom.position.set(-10.5,ROOF+1.05,0); machRoom.castShadow=true; scene.add(machRoom);

const elevCar=new THREE.Group(); scene.add(elevCar);
elevCar.position.set(-10.5,0,0); /* shaft sits on the west core, NOT building centre */
{ const fl=new THREE.Mesh(B(2.15,.1,2.15),M.elevator); fl.position.y=.05; elevCar.add(fl);
  const ceil=new THREE.Mesh(B(2.15,.08,2.15),M.elevator); ceil.position.y=2.4; elevCar.add(ceil);
  const back=new THREE.Mesh(B(.06,2.3,2.15),M.elevator); back.position.set(-1.05,1.25,0); elevCar.add(back);
  [1.05,-1.05].forEach(z=>{ const s=new THREE.Mesh(B(2.1,2.3,.06),M.elevator); s.position.set(0,1.25,z); elevCar.add(s); });
  const cl=new THREE.Mesh(B(1.6,.04,1.2),M.ceilPanel); cl.position.y=2.34; elevCar.add(cl);
}
const carLight=new THREE.PointLight(0xffe2b8,6,7,2); carLight.position.set(0,2.1,0); elevCar.add(carLight);
const carDoorL=new THREE.Mesh(B(.06,2.2,.56),M.elevDoor); const carDoorR=carDoorL.clone(); elevCar.add(carDoorL,carDoorR);
const shaftDoors=[];
FLOORS.forEach(fy=>{
  const l=new THREE.Mesh(B(.06,2.2,.56),M.elevDoor); const r=new THREE.Mesh(B(.06,2.2,.56),M.elevDoor);
  l.position.y=r.position.y=fy+1.1; scene.add(l,r); shaftDoors.push({l,r,y:fy});
});
const callLeds=FLOORS.map((fy)=>{ const m=M.callLed(0xffa040);
  const led=new THREE.Mesh(B(.04,.12,.12),m); led.position.set(-9.36,fy+1.35,.9); scene.add(led); return m; });

{ const canopy=new THREE.Mesh(B(7,.18,3),M.fascia); canopy.position.set(0,3.3,9.4); canopy.castShadow=true; scene.add(canopy);
  [-3,3].forEach(x=>{ const c=new THREE.Mesh(CYL(.09,.09,3.3,10),M.steel); c.position.set(x,1.65,10.6); c.castShadow=true; scene.add(c); });
  const step1=new THREE.Mesh(B(7,.12,1.2),M.concrete); step1.position.set(0,.06,8.9); step1.receiveShadow=true; scene.add(step1);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(7.5,1.15),new THREE.MeshStandardMaterial({map:signTex,emissiveMap:signTex,emissive:0xffffff,emissiveIntensity:.25,roughness:.6}));
  sign.position.set(0,4.35,8.03); scene.add(sign);
  [[-1.15,8.02],[1.15,8.02]].forEach(p=>{ const d=new THREE.Mesh(B(1.05,2.6,.06),M.shaftGlass.clone()); d.position.set(p[0],1.3,p[1]); scene.add(d); });
  const frame=new THREE.Mesh(B(3.4,.16,.12),M.mullion); frame.position.set(0,2.68,8.02); scene.add(frame);
}

const roofDeck=new THREE.Mesh(new THREE.PlaneGeometry(BW-.4,BD-.4),new THREE.MeshStandardMaterial({map:gravelTex,roughness:1}));
roofDeck.rotation.x=-Math.PI/2; roofDeck.position.y=ROOF+.02; roofDeck.receiveShadow=true; scene.add(roofDeck);
const helipad=new THREE.Mesh(new THREE.CircleGeometry(3.4,32),new THREE.MeshStandardMaterial({map:heliTex,roughness:.9}));
helipad.rotation.x=-Math.PI/2; helipad.position.set(6.5,ROOF+.04,0); scene.add(helipad);
const fans=[];
[[-6,-4.5],[-2.5,-4.5]].forEach((p,i)=>{
  const u=new THREE.Mesh(B(2.2,1.1,1.6),M.steel); u.position.set(p[0],ROOF+.55,p[1]); u.castShadow=true; scene.add(u);
  const ring=new THREE.Mesh(CYL(.7,.7,.15,16),M.dark); ring.position.set(p[0],ROOF+1.15,p[1]); scene.add(ring);
  const fg=new THREE.Group(); fg.position.set(p[0],ROOF+1.2,p[1]);
  for(let b=0;b<3;b++){ const bl=new THREE.Mesh(B(.6,.03,.14),M.steel); bl.position.x=.32;
    const hold=new THREE.Group(); hold.add(bl); hold.rotation.y=b/3*Math.PI*2; fg.add(hold); }
  scene.add(fg); fans.push({g:fg,sp:(i?1:-1)*rand(3,5)});
});
const antenna=new THREE.Mesh(CYL(.04,.06,3.4,6),M.lampPost); antenna.position.set(-10.5,ROOF+2.7,4.5); scene.add(antenna);
const beacon=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),M.beacon); beacon.position.set(-10.5,ROOF+4.4,4.5); scene.add(beacon);

/* ============================== INTERIORS ============================== */
let FY=0;
const desks=[];
function addDesk(x,z,ry,fy){
  FY=fy;
  const c=Math.cos(ry),s=Math.sin(ry);
  const L=(lx,lz)=>[x+lx*c+lz*s, z-lx*s+lz*c];
  put('deskTop',x,FY+.74,z,ry);
  let p=L(-.7,0); put('deskPanel',p[0],FY+.37,p[1],ry); p=L(.7,0); put('deskPanel',p[0],FY+.37,p[1],ry);
  p=L(0,-.33); put('deskModesty',p[0],FY+.55,p[1],ry);
  p=L(0,-.2); put('monStand',p[0],FY+.84,p[1],ry); put('monFoot',p[0],FY+.775,p[1],ry);
  p=L(0,-.24); put('monBody',p[0],FY+1.06,p[1],ry);
  p=L(0,-.215); put('monScreen',p[0],FY+1.06,p[1],ry);
  p=L(-.05,.12); put('kbd',p[0],FY+.775,p[1],ry+rand(-.08,.08));
  p=L(.3,.14); put('mouse',p[0],FY+.775,p[1],ry+rand(-.3,.3));
  p=L(-.55,.05); put('paper',p[0],FY+.77,p[1],ry+rand(-.35,.35));
  p=L(-.5,.02); put('paper',p[0],FY+.776,p[1],ry+rand(-.35,.35));
  p=L(.55,-.05); put('pen',p[0],FY+.78,p[1],ry+rand(0,3),1,1,1,0,Math.PI/2);
  if(Math.random()<.5){ p=L(.5,.22); put('mug',p[0],FY+.81,p[1]); }
  if(Math.random()<.4){ p=L(-.45,-.25); put('tray',p[0],FY+.79,p[1],ry); }
  if(Math.random()<.4){ p=L(.35,.28); put('stapler',p[0],FY+.79,p[1],ry+rand(-.5,.5)); }
  const chY=rand(-.35,.35);
  const cp=L(0,.82);
  const seatYaw=ry+Math.PI+chY;
  const bx=cp[0]+s*0.23, bz=cp[1]+c*0.23;
  put('chSeat',cp[0],FY+.46,cp[1],seatYaw);
  put('chBack',bx,FY+.78,bz,seatYaw);
  put('chPole',cp[0],FY+.28,cp[1]);
  put('chBase',cp[0],FY+.05,cp[1],seatYaw);
  put('chBase',cp[0],FY+.05,cp[1],seatYaw+Math.PI/2);
  desks.push({x,z,ry,floor:fy,chairX:cp[0],chairZ:cp[1],seatYaw:ry+Math.PI,occupied:false});
}
function chairAt(x,z,ry){
  const bx=x-Math.sin(ry)*0.23, bz=z-Math.cos(ry)*0.23;
  put('chSeat',x,FY+.46,z,ry);
  put('chBack',bx,FY+.78,bz,ry);
  put('chPole',x,FY+.28,z);
  put('chBase',x,FY+.05,z,ry);
  put('chBase',x,FY+.05,z,ry+Math.PI/2);
}
function plant(x,z,s=1){ put('pot',x,FY+.15*s,z,0,s,s,s);
  put('leafA',x,FY+.62*s,z,rand(0,3),s,s*.9,s); put('leafB',x+.14*s,FY+.85*s,z+.08*s,0,s,s,s); put('leafB',x-.12*s,FY+.8*s,z-.1*s,0,s*.8,s*.8,s*.8); }
function cabinet(x,z,ry){
  const sr=Math.sin(ry), cr=Math.cos(ry);
  put('cabinet',x,FY+.66,z,ry);
  const fx=x+sr*0.29, fz=z+cr*0.29;
  for(let i=0;i<3;i++){ const off=[-.16,0,.16][i];
    put('cabFront',fx+cr*off,FY+.24+i*.42,fz-sr*off,ry);
    put('cabH',fx+cr*off,FY+.24+i*.42+.08,fz-sr*off,ry); } }
function cooler(x,z,ry){ put('coolBody',x,FY+.5,z,ry); put('coolBottle',x,FY+1.17,z); }

function officeFloor(fy,idx){
  FY=fy;
  const carpet=new THREE.Mesh(new THREE.PlaneGeometry(BW-.6,BD-.6),carpetMats[idx]);
  carpet.rotation.x=-Math.PI/2; carpet.position.y=fy+.02; carpet.receiveShadow=true; scene.add(carpet);
  [-3.6,3.6].forEach(cz=>{ [-5.6,-3.9,-2.2,-.5].forEach(dx=>{
      addDesk(dx, cz+(cz<0?-.37:.37), cz<0?0:Math.PI, fy);
      addDesk(dx, cz+(cz<0?.37:-.37), cz<0?Math.PI:0, fy);
    }); });
  [-4,-2.6,-1.2,.2].forEach(cx=>cabinet(cx,-7.35,0));
  put('shelfSide',12.55,fy+.75,-6.45,Math.PI/2); put('shelfSide',12.55,fy+.75,-4.75,Math.PI/2);
  [.25,.75,1.25].forEach(h=>put('shelfBoard',12.55,fy+h,-5.6,Math.PI/2));
  for(let i=0;i<14;i++){ const bi=Math.floor(Math.random()*binderMats.length);
    put('binder'+bi,12.55,fy+[.42,.92,1.42][Math.floor(rand(0,3))],-6.3+ (i%7)*.2 + (i>6?.9:0),Math.PI/2+rand(-.06,.06)); }
  cooler(-8.3,-5.9,0);
  plant(12.2,6.9,1.2); plant(-12.2,-6.9,1); plant(12.2,-6.9,1.1);
  const ck=new THREE.Mesh(new THREE.CircleGeometry(.28,24),new THREE.MeshStandardMaterial({map:clockTex,roughness:.5}));
  ck.position.set(12.9,fy+2.5,2); ck.rotation.y=-Math.PI/2; scene.add(ck);
  const wb=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.3),new THREE.MeshStandardMaterial({map:wbTex,roughness:.35}));
  wb.position.set(6.5,fy+1.7,-7.88); scene.add(wb);
  const wbt=new THREE.Mesh(B(2.3,.06,.08),M.mullion); wbt.position.set(6.5,fy+1.02,-7.86); scene.add(wbt);
  put('mug',6.1,fy+1.08,-7.82);
}
officeFloor(0,0); officeFloor(3.6,1); officeFloor(7.2,2);

FY=0;
{ const rug=new THREE.Mesh(new THREE.PlaneGeometry(5,3.6),new THREE.MeshStandardMaterial({map:rugTex,roughness:1}));
  rug.rotation.x=-Math.PI/2; rug.position.set(6.5,.03,4.5); scene.add(rug);
  const seat=new THREE.Mesh(B(2.1,.4,.85),M.sofa); seat.position.set(6.5,.35,5.6); seat.castShadow=true; scene.add(seat);
  const back=new THREE.Mesh(B(2.1,.55,.2),M.sofa); back.position.set(6.5,.75,6.0); scene.add(back);
  [-1.15,1.15].forEach(o=>{ const a=new THREE.Mesh(B(.22,.55,.85),M.sofa); a.position.set(6.5+o,.5,5.6); scene.add(a); });
  const ct=new THREE.Mesh(B(1.1,.32,.6),M.wood); ct.position.set(6.5,.16,4.3); ct.castShadow=true; scene.add(ct);
  put('paper',6.3,.35,4.3,0,1,1,1,0,.3); put('mug',6.8,.37,4.25);
  const r1=new THREE.Mesh(B(2.6,1.05,.7),M.wood); r1.position.set(-3,.53,3.2); r1.castShadow=true; scene.add(r1);
  const r2=new THREE.Mesh(B(.7,1.05,1.8),M.wood); r2.position.set(-4.0,.53,2.45); r2.castShadow=true; scene.add(r2);
  const rtop=new THREE.Mesh(B(2.8,.05,.8),M.white); rtop.position.set(-3,1.08,3.2); scene.add(rtop);
  put('monBody',-3.2,1.42,3.05,Math.PI); put('monScreen',-3.2,1.42,3.08,Math.PI); put('monStand',-3.2,1.2,3.05,Math.PI);
  chairAt(-3,2.3,0);
  desks.push({x:-3,z:3.05,ry:Math.PI,floor:0,chairX:-3,chairZ:2.3,seatYaw:0,occupied:false,reception:true});
  const dir=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.4),new THREE.MeshStandardMaterial({map:dirTex,emissiveMap:dirTex,emissive:0xffffff,emissiveIntensity:.3,roughness:.5}));
  dir.position.set(4.6,1.6,7.9); dir.rotation.y=Math.PI; scene.add(dir);
  [-1.6,1.6].forEach(x=>put('postBollard',x,.4,6.2));
  plant(-7.6,6.6,1.4); plant(11.8,6.8,1.2);
}
FY=3.6;
{ const fy=3.6;
  const top=new THREE.Mesh(B(2.6,.06,1.2),M.wood); top.position.set(7.5,fy+.74,-3.5); top.castShadow=true; scene.add(top);
  [[-1.1,-.45],[1.1,-.45],[-1.1,.45],[1.1,.45]].forEach(p=>{ const l=new THREE.Mesh(B(.08,.72,.08),M.dark);
    l.position.set(7.5+p[0],fy+.37,-3.5+p[1]); scene.add(l); });
  put('monBody',7.2,fy+.95,-3.6,.5); put('monScreen',7.2,fy+.95,-3.57,.5);
  [[7.5,-4.5,0],[6.6,-3.5,Math.PI/2],[8.4,-3.5,-Math.PI/2],[7.5,-2.5,Math.PI],[6.2,-4.5,.4],[8.8,-2.5,Math.PI+.4]]
    .forEach(c=>chairAt(c[0],c[1],c[2]));
  put('paper',7.9,fy+.78,-3.2,0,1,1,1,0,-.4); put('pen',7.7,fy+.79,-3.8);
}
FY=7.2;
{ const fy=7.2;
  const rug=new THREE.Mesh(new THREE.PlaneGeometry(4.4,3.4),new THREE.MeshStandardMaterial({map:rugTex,roughness:1}));
  rug.rotation.x=-Math.PI/2; rug.position.set(8,fy+.03,3.8); scene.add(rug);
  const s1=new THREE.Mesh(B(1.9,.4,.85),M.sofa2); s1.position.set(8,fy+.35,4.9); s1.castShadow=true; scene.add(s1);
  const b1=new THREE.Mesh(B(1.9,.55,.2),M.sofa2); b1.position.set(8,fy+.75,5.3); scene.add(b1);
  const s2=new THREE.Mesh(B(.85,.4,1.6),M.sofa2); s2.position.set(9.4,fy+.35,3.4); scene.add(s2);
  const tbl=new THREE.Mesh(CYL(.45,.45,.34,14),M.wood); tbl.position.set(8,fy+.17,3.6); tbl.castShadow=true; scene.add(tbl);
  put('mug',7.85,fy+.39,3.5); put('paper',8.2,fy+.37,3.75,0,1,1,1,0,.6);
  plant(11.6,6.6,1.5);
  const pr=new THREE.Mesh(B(.62,.55,.55),M.white); pr.position.set(11.9,fy+.95,0); pr.castShadow=true; scene.add(pr);
  const prb=new THREE.Mesh(B(.66,.6,.58),M.cabinet); prb.position.set(11.9,fy+.3,0); scene.add(prb);
  put('paper',11.9,fy+1.24,0,0,.8,1,.8);
}
bake();

const interiorLights=[];
FLOORS.forEach(fy=>{ [[-4,fy+2.9,0],[7,fy+2.9,0]].forEach(p=>{
  const L=new THREE.PointLight(0xffdcae,0,19,2); L.position.set(p[0],p[1],p[2]); scene.add(L); interiorLights.push(L); }); });

/* ============================== WORKERS ============================== */
const SHIRTS=['#3e6fb0','#c05a3a','#4a8f68','#b8a03c','#7a5aa0','#c4763a','#48606e','#a04a5a','#5a8a9a','#8a6a52'];
const PANTS=['#2e3440','#4a4238','#3a4a55','#52483e'];
const SKINS=['#e8b48c','#c98e63','#a06a42','#7a4e2e','#f0c8a0'];
const HAIRS=['#241a12','#3e2c1c','#5a4632','#8a8a8a','#1a1a22','#6e3b1e'];
const matCache={};
const smat=c=>{ if(!matCache[c])matCache[c]=new THREE.MeshStandardMaterial({color:c,roughness:.85}); return matCache[c]; };
const G={ thigh:B(.16,.46,.16), shin:B(.13,.46,.13), foot:B(.14,.08,.26), torso:B(.42,.56,.24),
  head:B(.24,.26,.24), hair:B(.26,.1,.26), arm:B(.11,.56,.11), badge:B(.08,.1,.02),
  handMug:CYL(.04,.035,.1,8) };

class Worker{
  constructor(o){
    this.g=new THREE.Group();
    const shirt=smat(pick(SHIRTS)), pants=smat(pick(PANTS)), skin=smat(pick(SKINS)), hair=smat(pick(HAIRS));
    const mk=(geo,mat,x,y,z,parent)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; (parent||this.g).add(m); return m; };
    this.thighL=new THREE.Group(); this.thighL.position.set(.1,.92,0); this.g.add(this.thighL);
    this.thighR=new THREE.Group(); this.thighR.position.set(-.1,.92,0); this.g.add(this.thighR);
    mk(G.thigh,pants,0,-.23,0,this.thighL); mk(G.thigh,pants,0,-.23,0,this.thighR);
    this.shinL=new THREE.Group(); this.shinL.position.y=-.46; this.thighL.add(this.shinL);
    this.shinR=new THREE.Group(); this.shinR.position.y=-.46; this.thighR.add(this.shinR);
    mk(G.shin,pants,0,-.23,0,this.shinL); mk(G.shin,pants,0,-.23,0,this.shinR);
    mk(G.foot,smat('#22262c'),0,-.42,.05,this.shinL); mk(G.foot,smat('#22262c'),0,-.42,.05,this.shinR);
    mk(G.torso,shirt,0,1.23,0);
    mk(G.badge,smat('#f0f0ea'),.12,1.34,.13);
    this.headG=new THREE.Group(); this.headG.position.y=1.64; this.g.add(this.headG);
    mk(G.head,skin,0,0,0,this.headG); mk(G.hair,hair,0,.14,-.02,this.headG);
    this.armL=new THREE.Group(); this.armL.position.set(.26,1.46,0); this.g.add(this.armL);
    this.armR=new THREE.Group(); this.armR.position.set(-.26,1.46,0); this.g.add(this.armR);
    mk(G.arm,shirt,0,-.26,0,this.armL); mk(G.arm,shirt,0,-.26,0,this.armR);
    this.mug=new THREE.Mesh(G.handMug,M.mugA); this.mug.position.set(0,-.55,.06); this.mug.visible=false; this.armR.add(this.mug);
    scene.add(this.g);
    this.floorY=o.floorY||0; this.state='IDLE'; this.timer=rand(1,4); this.queue=[];
    this.speed=o.speed||1.15; this.yaw=rand(0,6); this.tYaw=this.yaw; this.phase=rand(0,6);
    this.walkAmp=0; this.sit=0; this.coffee=0; this.typer=rand(0,9);
    this.desk=o.desk||null; this.outdoor=!!o.outdoor; this.courier=!!o.courier;
    this.riding=false; this.dest=0; this.homeFloor=o.floorY||0;
    this.waypoints=o.waypoints; this.offX=o.offX||0; this.boarding=false; this.nextAction=null; this.targetFloor=0;
    this.g.position.set(o.x||0,this.floorY,o.z||0);
    if(this.desk){ this.desk.occupied=true; this.sitAtDesk(true); }
    else this.decide();
  }
  baseY(){ return this.riding? elevCar.position.y : this.floorY; }
  sitAtDesk(init){ this.state='SIT'; this.timer=rand(14,34); this.queue=[];
    this.g.position.set(this.desk.chairX,this.baseY(),this.desk.chairZ);
    this.yaw=this.tYaw=this.desk.seatYaw; if(init)this.sit=1; }
  walkPts(tx,tz){ const p=this.g.position;
    this.queue=[]; if(Math.abs(p.x-tx)>.05)this.queue.push({x:tx,z:p.z}); if(Math.abs(p.z-tz)>.05)this.queue.push({x:tx,z:tz});
    if(!this.queue.length)this.queue.push({x:tx,z:tz}); this.state='WALK'; }
  decide(){
    const r=Math.random();
    if(this.courier){ this.courierPlan(); return; }
    if(this.desk && r<.55){ this.walkPts(this.desk.chairX,this.desk.chairZ); this.nextAction='sit'; }
    else{
      const wp=pick(this.waypoints); this.walkPts(wp[0],wp[1]);
      this.nextAction= r<.8? 'idle':'coffee';
    }
  }
  courierPlan(){
    if(Math.random()<.65){
      this.targetFloor = pick(FLOORS.filter(f=>f!==this.floorY));
      this.walkPts(-8.55,0); this.nextAction='call';
    } else { const wp=pick(this.waypoints); this.walkPts(wp[0],wp[1]); this.nextAction='idle'; }
  }
  arrive(){
    const a=this.nextAction||'idle'; this.nextAction=null;
    if(a==='sit'){ this.sitAtDesk(false); }
    else if(a==='call'){ this.state='CALL'; elev.requests.add(this.floorY); this.tYaw= -Math.PI/2; this.timer=12; }
    else if(a==='coffee'){ this.state='COFFEE'; this.timer=rand(4,8); this.mug.visible=true; this.tYaw=rand(0,6); }
    else { this.state='IDLE'; this.timer=rand(3,9); this.tYaw=rand(0,6); }
  }
  update(dt,t){
    if(this.state==='SIT'){ this.timer-=dt; if(this.timer<=0){ this.state='STAND'; this.timer=.55; this.desk.occupied=false; } }
    else if(this.state==='STAND'){ this.timer-=dt; if(this.timer<=0) this.decide(); }
    else if(this.state==='IDLE'){ this.timer-=dt; if(this.timer<=0){ this.mug.visible=false; this.coffee=0; this.decide(); } }
    else if(this.state==='COFFEE'){ this.timer-=dt; if(this.timer<=0){ this.mug.visible=false; this.decide(); } }
    else if(this.state==='CALL'){ this.timer-=dt;
      if(elev.carFloor===this.floorY && elev.openAmt>.85 && !this.boarding){ this.boarding=true;
        this.queue=[{x:-10.5+this.offX,z:.35*this.offX}]; this.state='BOARD'; }
      else if(this.timer<=0){ elev.requests.add(this.floorY); this.timer=8; } }
    else if(this.state==='BOARD'){ this.stepQueue(dt);
      const p=this.g.position;
      if(Math.abs(p.x-(-10.5+this.offX))<.18){ this.riding=true; this.boarding=false; this.state='RIDE';
        this.dest=this.targetFloor; elev.requests.add(this.dest); elev.riders.push(this); } }
    else if(this.state==='RIDE'){
      const p=this.g.position; p.x=-10.5+this.offX; p.z=.35*this.offX; p.y=elevCar.position.y;
      this.yaw=this.tYaw=-Math.PI/2;
      if(elev.carFloor===this.dest && elev.openAmt>.85){ this.riding=false;
        elev.riders=elev.riders.filter(w=>w!==this); this.state='EXIT';
        this.queue=[{x:-8.55,z:0}]; } }
    else if(this.state==='EXIT'){ this.stepQueue(dt);
      const p=this.g.position;
      if(p.x>-8.7){ this.floorY=elev.carFloor; this.state='IDLE'; this.timer=rand(5,12);
        this.waypoints=WP[Math.round(this.floorY/FH)]||this.waypoints; } }
    else if(this.state==='WALK'){ this.stepQueue(dt); }
    const walking=this.state==='WALK'||this.state==='BOARD'||this.state==='EXIT';
    this.walkAmp=damp(this.walkAmp,walking?1:0,8,dt);
    this.sit=damp(this.sit,(this.state==='SIT')?1:0,7,dt);
    this.coffee=damp(this.coffee,this.state==='COFFEE'?1:0,7,dt);
    this.yaw=angDamp(this.yaw,this.tYaw,10,dt);
    const p=this.g.position;
    if(!this.riding) p.y=this.baseY()-.38*this.sit;
    this.g.rotation.y=this.yaw;
    const ph=this.phase, w=this.walkAmp, s=this.sit;
    const swL=Math.sin(ph), swR=Math.sin(ph+Math.PI);
    this.thighL.rotation.x=-1.5*s+swL*.62*w;
    this.thighR.rotation.x=-1.5*s+swR*.62*w;
    this.shinL.rotation.x=1.48*s+Math.max(0,-Math.sin(ph-.55))*.85*w;
    this.shinR.rotation.x=1.48*s+Math.max(0,-Math.sin(ph+Math.PI-.55))*.85*w;
    const typ=Math.sin(t*11+this.typer)*.07*s;
    this.armL.rotation.x=-1.12*s+swR*.5*w+typ;
    this.armR.rotation.x=-1.12*s+swL*.5*w-typ;
    this.armL.rotation.z=.08-.06*s; this.armR.rotation.z=-.08+.06*s;
    this.armR.rotation.x+=-0.8*this.coffee; this.armR.rotation.z+=-0.5*this.coffee;
    this.headG.rotation.y=Math.sin(t*.4+this.typer)*.25*(1-w)+Math.sin(ph)*.12*w;
    this.headG.rotation.x=-.1*s+Math.sin(t*.9+this.typer)*.03;
    if(this.state==='IDLE'||this.state==='COFFEE'||this.state==='CALL') this.g.rotation.z=Math.sin(t*.8+this.typer)*.02;
    else this.g.rotation.z=0;
  }
  stepQueue(dt){
    if(!this.queue.length){ this.arrive(); return; }
    const p=this.g.position, tg=this.queue[0];
    const dx=tg.x-p.x, dz=tg.z-p.z, d=Math.hypot(dx,dz);
    if(d<.12){ this.queue.shift(); if(!this.queue.length){this.arrive();return;} }
    const sp=this.speed*(this.courier?1.35:1);
    const step=Math.min(d,sp*dt);
    p.x+=dx/d*step; p.z+=dz/d*step;
    /* worker model faces local +Z, so yaw = atan2(dx, dz) */
    this.tYaw=Math.atan2(dx,dz);
    this.phase+=dt*sp*5.2;
  }
}

const WP={
  0:[[-7.4,-6],[-7.4,0],[-7.4,6],[1.7,-6],[1.7,0],[1.7,6],[6,-6.2],[6,6],[10.5,-6],[10.5,0],[10.5,6],[0,6.4],[3,6.4],[-3,6.4]],
  1:[[-7.4,-6.1],[-7.4,0],[-7.4,6.1],[1.7,-6.1],[1.7,0],[1.7,6.1],[5,-6.1],[5,0],[5,6.1],[9,-6.1],[9,6.1],[11,0],[11,-5.5]],
  2:[[-7.4,-6.1],[-7.4,0],[-7.4,6.1],[1.7,-6.1],[1.7,0],[1.7,6.1],[5,-6.1],[5,0],[5,6.1],[9,-6.1],[9,6.1],[11,0],[11,5.5]],
};
const OUT_WP=[[-30,-18],[-14,-18],[14,-18],[30,-18],[30,0],[30,18],[14,18],[0,18],[-14,18],[-30,18],[-30,0],[0,10.5],[-8,14],[8,14]];

const workers=[];
function hireFor(floorIdx,n,courier=false){
  const fy=FLOORS[floorIdx];
  for(let i=0;i<n;i++){
    let desk=null;
    if(!courier){ const free=desks.filter(d=>!d.occupied && d.floor===fy && !d.reception);
      if(free.length && Math.random()<.85) desk=pick(free); }
    const wp=WP[floorIdx];
    workers.push(new Worker({floorY:fy,desk,waypoints:wp,
      x:desk?desk.chairX:pick(wp)[0], z:desk?desk.chairZ:pick(wp)[1],
      offX:(i%2? .42:-.42), courier}));
  }
}
hireFor(0,4); hireFor(1,7); hireFor(2,6);
hireFor(0,2,true);
{ const rec=desks.find(d=>d.reception && !d.occupied);
  if(rec) workers.push(new Worker({floorY:0,desk:rec,waypoints:WP[0],x:rec.chairX,z:rec.chairZ})); }
for(let i=0;i<5;i++) workers.push(new Worker({floorY:0,outdoor:true,waypoints:OUT_WP,
  x:pick(OUT_WP)[0],z:pick(OUT_WP)[1],speed:rand(.9,1.3)}));

/* ============================== ELEVATOR ============================== */
const elev={ y:0, carFloor:0, openAmt:0, phase:'idle', timer:0, requests:new Set(), riders:[], idleT:0 };
function elevUpdate(dt){
  const target=()=>{ let best=null,bd=1e9; elev.requests.forEach(f=>{const d=Math.abs(elev.y-f); if(d<bd){bd=d;best=f;}}); return best; };
  if(elev.phase==='idle'){
    elev.openAmt=damp(elev.openAmt,0,6,dt);
    const tg=target();
    if(tg!==null){ elev.phase='move'; }
    else{ elev.idleT+=dt; if(elev.idleT>26){ elev.idleT=0; elev.requests.add(Math.floor(rand(0,3))*FH); } }
  }
  else if(elev.phase==='move'){
    const tg=target(); if(tg===null){elev.phase='idle';return;}
    const d=tg-elev.y, sp=2.3*dt;
    if(Math.abs(d)<=sp){ elev.y=tg; elev.carFloor=tg; elev.phase='open'; elev.timer=0; }
    else elev.y+=Math.sign(d)*sp;
  }
  else if(elev.phase==='open'){
    elev.timer+=dt; elev.openAmt=Math.min(1,elev.timer/.7);
    if(elev.timer>.7){ elev.phase='dwell'; elev.timer=0; }
  }
  else if(elev.phase==='dwell'){
    elev.timer+=dt;
    if(elev.timer>2.0){ elev.phase='close'; elev.timer=0; }
  }
  else if(elev.phase==='close'){
    elev.timer+=dt; elev.openAmt=Math.max(0,1-elev.timer/.7);
    if(elev.timer>.7){ elev.requests.delete(elev.carFloor); elev.phase='idle'; }
  }
  elevCar.position.y=elev.y; /* x stays at the shaft (-10.5) */
  const o=elev.openAmt*.58;
  carDoorL.position.set(1.05,1.25,-.28-o); carDoorR.position.set(1.05,1.25,.28+o);
  shaftDoors.forEach(sd=>{ const act=Math.abs(sd.y-elev.y)<.05? elev.openAmt:0;
    sd.l.position.set(-9.36,sd.y+1.1,-.28-act*.58); sd.r.position.set(-9.36,sd.y+1.1,.28+act*.58); });
  FLOORS.forEach((f,i)=>{ callLeds[i].emissiveIntensity = elev.requests.has(f)? (Math.sin(performance.now()/180)>.0?1.6:.4):.12; });
}

/* ============================== DAY CYCLE ============================== */
const SKY_STOPS=[
 [0.0,'#0a1424','#182238','#a8b8d8',0.0],
 [4.5,'#0c1830','#23304a','#b8c4e0',0.0],
 [6.0,'#27436e','#e8996a','#ffc27a',.55],
 [7.5,'#4f83b8','#f5d0a0','#fff0d0',.9],
 [12.0,'#5f9fd4','#cfe6f0','#fff8ea',1.0],
 [16.5,'#5694c8','#e8d8b0','#fff0d0',.95],
 [18.3,'#3a5a8c','#f0a05e','#ffb060',.6],
 [19.6,'#1a2c4e','#5a4a6e','#d09070',.15],
 [21.0,'#0c1830','#202a44','#a8b8d8',0.0],
 [24.0,'#0a1424','#182238','#a8b8d8',0.0],
];
const cA=new THREE.Color(),cB=new THREE.Color();
let gameTime=9.0, timeSpeed=1;
const sunDirV=new THREE.Vector3(), moonDirV=new THREE.Vector3();
function applyTime(h){
  h=((h%24)+24)%24;
  let i=0; while(i<SKY_STOPS.length-2 && SKY_STOPS[i+1][0]<h) i++;
  const a=SKY_STOPS[i], b=SKY_STOPS[i+1], f=clamp((h-a[0])/(b[0]-a[0]||1),0,1);
  const top=cA.set(a[1]).lerp(cB.set(b[1]),f).clone();
  const hor=new THREE.Color(a[2]).lerp(new THREE.Color(b[2]),f);
  const sunC=new THREE.Color(a[3]).lerp(new THREE.Color(b[3]),f);
  const sunI=a[4]+(b[4]-a[4])*f;
  const e=Math.sin(Math.PI*(h-6)/12), elevRad=e*1.05, az=Math.PI*(h-6)/12;
  sunDirV.set(Math.cos(az)*Math.cos(elevRad),Math.sin(elevRad),Math.sin(az)*Math.cos(elevRad));
  const elevN=Math.sin(elevRad);
  const dayF=sstep(-.03,.22,elevN), sunVis=sstep(-.02,.15,elevN);
  const lightNeed=1-sstep(-.06,.28,elevN);
  skyUni.topColor.value.copy(top); skyUni.horColor.value.copy(hor);
  skyUni.sunDir.value.copy(sunDirV); skyUni.sunColor.value.copy(sunC); skyUni.sunI.value=Math.max(sunI,.02);
  scene.fog.color.copy(hor);
  sunLight.position.copy(sunDirV).multiplyScalar(160);
  sunLight.color.copy(sunC); sunLight.intensity=3.6*sunI*sunVis;
  sunLight.castShadow=sunVis>.05;
  const mAz=az+Math.PI, mE=Math.max(.3,-e)*.85;
  moonDirV.set(Math.cos(mAz)*Math.cos(mE),Math.sin(mE),Math.sin(mAz)*Math.cos(mE));
  moonLight.position.copy(moonDirV).multiplyScalar(160);
  moonLight.intensity=.5*(1-dayF);
  hemi.intensity=.14+dayF*.55;
  hemi.color.copy(top).lerp(new THREE.Color(0xbcd4e8),dayF);
  starMat.opacity=(1-dayF)*.9;
  moonMesh.position.copy(moonDirV).multiplyScalar(500); moonMesh.material.opacity=(1-dayF)*.95;
  moonMesh.lookAt(camera.position);
  interiorLights.forEach(L=>L.intensity=lightNeed*30);
  M.ceilPanel.emissiveIntensity=.15+lightNeed*1.6;
  M.screen.emissiveIntensity=.85+lightNeed*.6;
  M.glass.emissiveIntensity=lightNeed*.1;
  M.lampHead.emissiveIntensity=lightNeed*2.2;
  lampLights.forEach(L=>L.intensity=lightNeed*26);
  M.headlight.emissiveIntensity=lightNeed*3; M.taillight.emissiveIntensity=lightNeed*1.6;
  cityMats.forEach(m=>m.emissiveIntensity=lightNeed*1.15);
  cloudMat.color.set(0xffffff).lerp(new THREE.Color(0x2a3542),1-dayF);
  return {dayF,lightNeed};
}

/* ============================== PLAYER ============================== */
const player={ pos:new THREE.Vector3(30,16,34), yaw:0.72, pitch:-0.22, vy:0, walk:false, grounded:false };
const keys={};
let locked=false, dragLook=false, dragging=false, lastMX=0,lastMY=0, started=false;
const canvas=renderer.domElement;

/* ============================== COLLISION SYSTEM ============================== */
const PLAYER_RADIUS = 0.35;
const PLAYER_HEIGHT = 1.68;
const STEP_HEIGHT = 0.3;

// Building boundary walls (axis-aligned boxes: [xMin, xMax, zMin, zMax, yMin, yMax])
const wallColliders = [];
const deskColliders = [];
const workerColliders = [];
const carColliders = [];
const elevatorCollider = [];

// Building exterior walls
wallColliders.push({xMin:-13.4, xMax:13.4, zMin:-8.4, zMax:8.4, yMin:0, yMax:10.8, type:'wall'});
// Core structures
wallColliders.push({xMin:-12.4, xMax:-9.4, zMin:-7.5, zMax:-2.5, yMin:0, yMax:10.8, type:'wall'}); // stair core
wallColliders.push({xMin:-11.65, xMax:-9.35, zMin:-1.15, zMax:1.15, yMin:0, yMax:11.1, type:'wall'}); // elevator shaft glass

// Interior columns (cylinders approximated as boxes for simplicity)
const colPositions = [-12.6,-8.4,-4.2,0,4.2,8.4,12.6];
colPositions.forEach(x => {
  [[7.7], [-7.7]].forEach(z => {
    wallColliders.push({xMin:x-0.2, xMax:x+0.2, zMin:z-0.2, zMax:z+0.2, yMin:0, yMax:10.8, type:'column'});
  });
});

// Elevator car collider (updated dynamically)
elevatorCollider.push({xMin:-11.575, xMax:-9.425, zMin:-1.075, zMax:1.075, yMin:0, yMax:2.5, type:'elevator'});

function updateElevatorCollider() {
  if (elevatorCollider.length > 0) {
    elevatorCollider[0].yMin = elevCar.position.y;
    elevatorCollider[0].yMax = elevCar.position.y + 2.5;
  }
}

function addDeskCollider(desk) {
  const w = 1.5, d = 0.72, h = 0.75;
  const c = Math.cos(desk.ry), s = Math.sin(desk.ry);
  // Approximate desk as axis-aligned box (conservative collision)
  const halfDiag = Math.sqrt((w/2)**2 + (d/2)**2);
  deskColliders.push({
    x: desk.x, z: desk.z, radius: halfDiag, 
    yMin: desk.floor, yMax: desk.floor + h,
    width: w, depth: d, ry: desk.ry,
    type: 'desk'
  });
}

desks.forEach(addDeskCollider);

function checkBoxCollision(x, z, y, collider) {
  return x + PLAYER_RADIUS > collider.xMin && 
         x - PLAYER_RADIUS < collider.xMax &&
         z + PLAYER_RADIUS > collider.zMin && 
         z - PLAYER_RADIUS < collider.zMax &&
         y < collider.yMax && y + PLAYER_HEIGHT > collider.yMin;
}

function checkCylinderCollision(x, z, y, collider) {
  const dx = x - collider.x;
  const dz = z - collider.z;
  const dist = Math.sqrt(dx*dx + dz*dz);
  return dist < collider.radius + PLAYER_RADIUS &&
         y < collider.yMax && y + PLAYER_HEIGHT > collider.yMin;
}

function checkWorkerCollision(x, z, y, worker) {
  const wx = worker.g.position.x;
  const wz = worker.g.position.z;
  const wy = worker.baseY();
  const dx = x - wx;
  const dz = z - wz;
  const dist = Math.sqrt(dx*dx + dz*dz);
  // Workers are about 0.4 radius, standing on their floor
  return dist < 0.4 + PLAYER_RADIUS &&
         y < wy + 1.8 && y + PLAYER_HEIGHT > wy;
}

function checkCarCollision(x, z, y, car) {
  const cx = car.g.position.x;
  const cz = car.g.position.z;
  const carW = 1.8, carD = 4.2, carH = 1.4;
  return x + PLAYER_RADIUS > cx - carW/2 && 
         x - PLAYER_RADIUS < cx + carW/2 &&
         z + PLAYER_RADIUS > cz - carD/2 && 
         z - PLAYER_RADIUS < cz + carD/2 &&
         y < carH && y + PLAYER_HEIGHT > 0;
}

function resolveHorizontalCollision(newX, newZ, y) {
  let x = newX, z = newZ;
  
  // Check building exterior walls
  for (const w of wallColliders) {
    if (checkBoxCollision(x, z, y, w)) {
      // Find closest edge and push out in that direction
      const distLeft = x - w.xMin;
      const distRight = w.xMax - x;
      const distFront = z - w.zMin;
      const distBack = w.zMax - z;
      
      const minDist = Math.min(distLeft, distRight, distFront, distBack);
      
      if (minDist === distLeft) {
        x = w.xMin - PLAYER_RADIUS - 0.001;
      } else if (minDist === distRight) {
        x = w.xMax + PLAYER_RADIUS + 0.001;
      } else if (minDist === distFront) {
        z = w.zMin - PLAYER_RADIUS - 0.001;
      } else {
        z = w.zMax + PLAYER_RADIUS + 0.001;
      }
    }
  }
  
  // Check desk collisions
  for (const d of deskColliders) {
    if (checkCylinderCollision(x, z, y, d)) {
      const dx = x - d.x;
      const dz = z - d.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist > 0.001) {
        const pushOut = d.radius + PLAYER_RADIUS - dist;
        x += (dx / dist) * pushOut;
        z += (dz / dist) * pushOut;
      }
    }
  }
  
  // Check elevator
  updateElevatorCollider();
  for (const e of elevatorCollider) {
    if (checkBoxCollision(x, z, y, e)) {
      const distLeft = x - e.xMin;
      const distRight = e.xMax - x;
      const distFront = z - e.zMin;
      const distBack = e.zMax - z;
      
      const minDist = Math.min(distLeft, distRight, distFront, distBack);
      
      if (minDist === distLeft) {
        x = e.xMin - PLAYER_RADIUS - 0.001;
      } else if (minDist === distRight) {
        x = e.xMax + PLAYER_RADIUS + 0.001;
      } else if (minDist === distFront) {
        z = e.zMin - PLAYER_RADIUS - 0.001;
      } else {
        z = e.zMax + PLAYER_RADIUS + 0.001;
      }
    }
  }
  
  // Check workers
  for (const w of workers) {
    if (checkWorkerCollision(x, z, y, w)) {
      const wx = w.g.position.x;
      const wz = w.g.position.z;
      const dx = x - wx;
      const dz = z - wz;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist > 0.001) {
        const pushOut = 0.4 + PLAYER_RADIUS - dist;
        x += (dx / dist) * pushOut;
        z += (dz / dist) * pushOut;
      }
    }
  }
  
  // Check parked cars
  for (const c of cars) {
    if (checkCarCollision(x, z, y, c)) {
      const cx = c.g.position.x;
      const cz = c.g.position.z;
      const carW = 1.8, carD = 4.2;
      const carLeft = cx - carW/2;
      const carRight = cx + carW/2;
      const carFront = cz - carD/2;
      const carBack = cz + carD/2;
      
      const distLeft = x - carLeft;
      const distRight = carRight - x;
      const distFront = z - carFront;
      const distBack = carBack - z;
      
      const minDist = Math.min(distLeft, distRight, distFront, distBack);
      
      if (minDist === distLeft) {
        x = carLeft - PLAYER_RADIUS - 0.001;
      } else if (minDist === distRight) {
        x = carRight + PLAYER_RADIUS + 0.001;
      } else if (minDist === distFront) {
        z = carFront - PLAYER_RADIUS - 0.001;
      } else {
        z = carBack + PLAYER_RADIUS + 0.001;
      }
    }
  }
  
  return { x, z };
}

function supportHeight(x,y,z){
  let cands=[0];
  if(Math.abs(x)<13.4 && Math.abs(z)<8.4) cands=[0,3.6,7.2,10.8];
  let s=0; for(const c of cands) if(c<=y-.15 && c>s) s=c;
  return s;
}
function enterLock(){
  try{ const p=canvas.requestPointerLock(); if(p&&p.catch)p.catch(()=>{dragLook=true;}); }
  catch(e){ dragLook=true; }
}
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===canvas;
  document.getElementById('pauseOverlay').classList.toggle('hidden', locked||!started);
});
document.addEventListener('pointerlockerror',()=>{dragLook=true;});
addEventListener('mousemove',e=>{
  if(locked){ player.yaw-=e.movementX*.0023; player.pitch=clamp(player.pitch-e.movementY*.0023,-1.45,1.45); }
  else if(dragLook&&dragging){ player.yaw-=(e.clientX-lastMX)*.004; player.pitch=clamp(player.pitch-(e.clientY-lastMY)*.004,-1.45,1.45); }
  lastMX=e.clientX; lastMY=e.clientY;
});
canvas.addEventListener('mousedown',e=>{ if(dragLook&&started&&!locked){dragging=true;lastMX=e.clientX;lastMY=e.clientY;} });
addEventListener('mouseup',()=>dragging=false);
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT')return;
  keys[e.code]=true;
  if(!started)return;
  if(e.code==='KeyF')toggleMode();
  if(e.code==='KeyR')resetView();
  if(e.code==='Digit1')jumpTo(0); if(e.code==='Digit2')jumpTo(3.6);
  if(e.code==='Digit3')jumpTo(7.2); if(e.code==='Digit4')jumpTo(10.8);
  if(e.code==='Space')e.preventDefault();
});
addEventListener('keyup',e=>keys[e.code]=false);
function jumpTo(fy){ player.pos.set(2,fy+1.7,4); player.vy=0; toast(fy===0?'GROUND FLOOR':fy===10.8?'ROOF':'LEVEL '+Math.round(fy/3.6+1)); }
function toggleMode(){ player.walk=!player.walk; player.vy=0;
  document.getElementById('modeLbl').textContent=player.walk?'WALK':'FLY';
  document.getElementById('modeBtn').textContent=player.walk?'WALK MODE':'FLY MODE';
  toast(player.walk?'WALK MODE — GRAVITY ON':'FLY MODE — NOCLIP'); }
function resetView(){ player.pos.set(30,16,34); player.yaw=0.72; player.pitch=-0.22; player.vy=0; toast('VIEW RESET'); }
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),1800); }

let stickId=null,stickDX=0,stickDY=0,lookId=null,lookLX=0,lookLY=0;
canvas.addEventListener('touchstart',e=>{ for(const t of e.changedTouches){
  if(t.clientX<innerWidth/2 && stickId===null){stickId=t.identifier;stickDX=0;stickDY=0;}
  else if(lookId===null){lookId=t.identifier;lookLX=t.clientX;lookLY=t.clientY;} } e.preventDefault();},{passive:false});
canvas.addEventListener('touchmove',e=>{ for(const t of e.changedTouches){
  if(t.identifier===stickId){stickDX=clamp((t.clientX-80)/50,-1,1);stickDY=clamp((t.clientY-(innerHeight-90))/50,-1,1);}
  else if(t.identifier===lookId){player.yaw-=(t.clientX-lookLX)*.005;player.pitch=clamp(player.pitch-(t.clientY-lookLY)*.005,-1.45,1.45);lookLX=t.clientX;lookLY=t.clientY;} } e.preventDefault();},{passive:false});
canvas.addEventListener('touchend',e=>{ for(const t of e.changedTouches){
  if(t.identifier===stickId)stickId=null; if(t.identifier===lookId)lookId=null; } });

function playerUpdate(dt){
  const sp=(keys.ShiftLeft||keys.ShiftRight? (player.walk?7:18):(player.walk?3.6:8));
  let fx=0,fz=0;
  if(keys.KeyW||keys.ArrowUp)fz+=1; if(keys.KeyS||keys.ArrowDown)fz-=1;
  if(keys.KeyA||keys.ArrowLeft)fx-=1; if(keys.KeyD||keys.ArrowRight)fx+=1;
  fx+=stickDX; fz+=-stickDY;
  const len=Math.hypot(fx,fz); if(len>1){fx/=len;fz/=len;}
  const cy=Math.cos(player.yaw), sy=Math.sin(player.yaw);
  /* camera looks down local -Z => world forward = (-sin yaw, -cos yaw); right = (cos yaw, -sin yaw) */
  const fwdX=-sy, fwdZ=-cy, rightX=cy, rightZ=-sy;
  const vx=(fwdX*fz+rightX*fx)*sp, vz=(fwdZ*fz+rightZ*fx)*sp;
  
  // Calculate tentative new position
  let newX = player.pos.x + vx*dt;
  let newZ = player.pos.z + vz*dt;
  
  // Always calculate collision resolution but only apply in WALK mode
  const resolved = resolveHorizontalCollision(newX, newZ, player.pos.y);
  if (player.walk) {
    newX = resolved.x;
    newZ = resolved.z;
  }
  
  player.pos.x = clamp(newX, -280, 280);
  player.pos.z = clamp(newZ, -280, 280);
  
  if(player.walk){
    player.vy-=22*dt; player.pos.y+=player.vy*dt;
    const sup=supportHeight(player.pos.x,player.pos.y,player.pos.z)+1.68;
    if(player.pos.y<=sup){player.pos.y=sup;player.vy=0;player.grounded=true;}else player.grounded=false;
  }else{
    let up=0; if(keys.Space)up+=1; if(keys.KeyC||keys.ControlLeft)up-=1;
    player.pos.y+=up*sp*dt;
    player.pos.y=Math.max(player.pos.y, supportHeight(player.pos.x,player.pos.y,player.pos.z)+1.2);
    player.pos.y=Math.min(player.pos.y,220);
  }
  camera.position.copy(player.pos);
  camera.rotation.order='YXZ'; camera.rotation.y=player.yaw; camera.rotation.x=player.pitch;
}

/* ============================== HUD ============================== */
const $=id=>document.getElementById(id);
$('timeSlider').addEventListener('input',e=>{ gameTime=parseFloat(e.target.value); });
$('timeSlider').addEventListener('change',e=>e.target.blur());
$('speedBtn').addEventListener('click',e=>{ timeSpeed= timeSpeed===1?4: timeSpeed===4?0:1;
  e.target.textContent= timeSpeed===0?'HELD':'×'+timeSpeed; e.target.blur();
  toast(timeSpeed===0?'TIME HELD':'TIME ×'+timeSpeed); });
$('modeBtn').addEventListener('click',e=>{toggleMode();e.target.blur();});
$('resetBtn').addEventListener('click',e=>{resetView();e.target.blur();});

const mm=$('minimap'), mg=mm.getContext('2d');
function drawMap(){
  const W=mm.width,H=mm.height,s=1.95,cx=W/2,cz=H/2;
  const X=x=>cx+x*s, Z=z=>cz+z*s;
  mg.fillStyle='#0c141c'; mg.fillRect(0,0,W,H);
  mg.fillStyle='#141d27'; mg.fillRect(X(-34),Z(-24),68*s,48*s);
  mg.strokeStyle='#22303c'; mg.strokeRect(X(-44),Z(-32),88*s,64*s);
  mg.fillStyle='#1d2b38'; mg.fillRect(X(-13),Z(-8),26*s,16*s);
  mg.strokeStyle='rgba(255,122,26,.8)'; mg.lineWidth=1; mg.strokeRect(X(-13),Z(-8),26*s,16*s);
  mg.fillStyle='#31404e'; mg.fillRect(X(-12.4),Z(-7.4),3*s,5*s);
  mg.fillStyle='#39d0b8'; mg.fillRect(X(-11.6),Z(-1.1),2.2*s,2.2*s);
  workers.forEach(w=>{
    if(w.outdoor)mg.fillStyle='#7fae8f';
    else if(w.courier)mg.fillStyle='#ff7a1a';
    else if(w.state==='SIT')mg.fillStyle='#58b6ff';
    else mg.fillStyle='#ffd166';
    mg.beginPath(); mg.arc(X(w.g.position.x),Z(w.g.position.z),2.1,0,7); mg.fill();
  });
  mg.save(); mg.translate(X(player.pos.x),Z(player.pos.z)); mg.rotate(-player.yaw);
  mg.fillStyle='#fff'; mg.strokeStyle='#ff7a1a';
  mg.beginPath(); mg.moveTo(0,-5); mg.lineTo(3.6,4); mg.lineTo(-3.6,4); mg.closePath(); mg.fill(); mg.stroke();
  mg.restore();
  mg.fillStyle='#8fa3ad'; mg.font='7px monospace'; mg.fillText('N',W-9,9);
  mg.strokeStyle='#8fa3ad'; mg.beginPath(); mg.moveTo(W-6,12); mg.lineTo(W-6,18); mg.stroke();
}

$('enterBtn').addEventListener('click',()=>{
  started=true;
  $('startOverlay').classList.add('hidden');
  $('hud').classList.add('on');
  enterLock();
});
$('pauseOverlay').addEventListener('click',()=>{ if(started)enterLock(); });

/* ============================== MAIN LOOP ============================== */
const clock=new THREE.Clock();
let fpsFrames=0,fpsT=0,hudT=0;
const fmt=h=>{const H=Math.floor(h)%24,Mn=Math.floor((h%1)*60);return String(H).padStart(2,'0')+':'+String(Mn).padStart(2,'0');};

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05), t=clock.elapsedTime;

  gameTime+=dt*timeSpeed/60; if(gameTime>=24)gameTime-=24;
  applyTime(gameTime);

  if(started)playerUpdate(dt);

  elevUpdate(dt);
  workers.forEach(w=>w.update(dt,t));
  fans.forEach(f=>f.g.rotation.y+=f.sp*dt);
  clouds.forEach(c=>{c.position.x+=dt*1.6; if(c.position.x>260)c.position.x=-260;});
  birds.forEach(b=>{ const u=b.userData,a=t*u.sp+u.ph;
    b.position.set(Math.cos(a)*u.r,u.h+Math.sin(t*.7+u.ph)*2,Math.sin(a)*u.r);
    b.rotation.y=-a; const fl=Math.sin(t*9+u.ph)*.7; u.w1.rotation.z=fl; u.w2.rotation.z=-fl; });
  { const pos=flagGeo.attributes.position;
    for(let i=0;i<pos.count;i++){ const x=flagBase[i*3], y=flagBase[i*3+1];
      pos.setZ(i, Math.sin(x*3.2-t*5+y*2)*.13*((x+.95)/1.9)); }
    pos.needsUpdate=true; flagGeo.computeVertexNormals(); }
  { const P=[[38,27],[-38,27],[-38,-27],[38,-27]], per=[0,76,130,206,260];
    let d=(t*8)%260, seg=0; while(d>per[seg+1])seg++;
    const a=P[seg], b=P[(seg+1)%4], f=(d-per[seg])/(per[seg+1]-per[seg]);
    const dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz), ux=dx/L, uz=dz/L;
    const rx=-uz, rz=ux;
    mover.position.set(a[0]+dx*f+rx*1.3,0,a[1]+dz*f+rz*1.3);
    /* car model faces local +Z => yaw = atan2(ux, uz) */
    mover.rotation.y=Math.atan2(ux,uz);
    mover.userData.wheels.forEach(w=>w.rotation.x+=dt*8/.32); }
  M.beacon.emissiveIntensity=Math.sin(t*2.6)>.55?3:.25;
  M.screen.emissiveIntensity+=Math.sin(t*7.3)*.05;

  renderer.render(scene,camera);

  fpsFrames++; fpsT+=dt; hudT+=dt;
  if(fpsT>=.5){ $('fps').textContent=Math.round(fpsFrames/fpsT)+' FPS'; fpsFrames=0; fpsT=0; }
  if(hudT>=.15){ hudT=0;
    $('clock').textContent=fmt(gameTime); $('timeVal').textContent=fmt(gameTime);
    if(!$('timeSlider').matches(':active'))$('timeSlider').value=gameTime;
    const inB=Math.abs(player.pos.x)<13.4&&Math.abs(player.pos.z)<8.4;
    const sup=supportHeight(player.pos.x,player.pos.y,player.pos.z);
    $('floorLbl').textContent= player.pos.y>60?'AIR': !inB?'PLAZA': sup===0?'GROUND': sup===10.8?'ROOF':'LEVEL '+(Math.round(sup/3.6)+1);
    const seated=workers.filter(w=>w.state==='SIT').length;
    $('occ').textContent=workers.length+' IN · '+seated+' SEATED';
    drawMap();
  }
}
applyTime(gameTime);
animate();

addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

