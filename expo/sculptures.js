'use strict';

// Each sculpture uses the same studio lights and its own parametric surface.
const TAU = Math.PI * 2;
const vertexSource = `
attribute vec3 position, normal;
uniform vec3 spin, size, offset, camera;
uniform vec2 frame;
varying vec3 worldNormal, worldPosition;
mat3 rotate(vec3 a) {
  vec3 c=cos(a), s=sin(a);
  return mat3(c.z,s.z,0., -s.z,c.z,0., 0.,0.,1.)
       * mat3(c.y,0.,-s.y, 0.,1.,0., s.y,0.,c.y)
       * mat3(1.,0.,0., 0.,c.x,s.x, 0.,-s.x,c.x);
}
void main() {
  mat3 model=rotate(spin), view=rotate(camera);
  worldPosition=view*(model*(position*size)+offset);
  worldNormal=normalize(view*model*(normal/size));
  float w=5.7-worldPosition.z;
  gl_Position=vec4(worldPosition.xy*frame, .5*w-1., w);
}`;

const fragmentSource = `
precision mediump float;
varying vec3 worldNormal, worldPosition;
uniform vec3 tint;
uniform float iridescence;
void main(){
  vec3 n=normalize(worldNormal), v=normalize(vec3(0.,0.,5.7)-worldPosition);
  if(dot(n,v)<0.) n=-n;
  vec3 r=reflect(-v,n);
  float edge=pow(1.-max(0.,dot(n,v)),2.);
  float band=smoothstep(-.20,-.08,r.y)-smoothstep(.12,.28,r.y);
  float ceiling=smoothstep(.40,.86,r.y);
  float strip=pow(max(dot(r,normalize(vec3(-.78,.24,.57))),0.),20.);
  float softbox=pow(max(dot(r,normalize(vec3(.54,.73,.42))),0.),8.);
  vec3 film=.52+.48*cos(3.1*r.x+2.8*r.y+3.*edge+vec3(.3,2.35,4.45));
  vec3 metal=mix(tint,film,iridescence);
  vec3 color=metal*(.22+.68*ceiling+.92*band)+vec3(.10,.15,.22)*edge;
  color+=vec3(.84,.93,1.)*(strip*1.45+softbox*.94+ceiling*.32);
  color+=vec3(.28,.48,1.)*pow(max(dot(r,normalize(vec3(.85,-.38,.2))),0.),6.)*.9;
  gl_FragColor=vec4(pow(clamp(color,0.,1.),vec3(.78)),1.);
}`;

function subtract(a,b) { return a.map((v,i)=>v-b[i]); }
function unit(a) { const length=Math.hypot(...a)||1; return a.map(v=>v/length); }
function cross(a,b) { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
function knotPath(u) {
  const radius=.9+.34*Math.cos(3*u);
  return [radius*Math.cos(2*u),radius*Math.sin(2*u),.52*Math.sin(3*u)];
}
function knot(u,v) {
  const p=knotPath(u), tangent=unit(subtract(knotPath(u+.001),knotPath(u-.001)));
  const side=unit(cross(tangent,[0,0,1])), up=cross(tangent,side);
  const radius=.235+.012*Math.cos(72*u);
  return p.map((value,i)=>value+radius*(side[i]*Math.cos(v)+up[i]*Math.sin(v)));
}
function ring(u,v) {
  const radius=1+.10*Math.cos(v), z=.13*Math.sin(v);
  return [radius*Math.cos(u),radius*Math.sin(u),z];
}
function sphere(u,v) {
  const latitude=(v/TAU-.5)*Math.PI;
  return [Math.cos(latitude)*Math.cos(u),Math.cos(latitude)*Math.sin(u),Math.sin(latitude)];
}
function mesh(surface,columns,rows) {
  const vertices=[],indices=[],d=.0005;
  for(let i=0;i<=columns;i++) for(let j=0;j<=rows;j++){
    const u=i*TAU/columns,v=j*TAU/rows;
    const du=subtract(surface(u+d,v),surface(u-d,v)),dv=subtract(surface(u,v+d),surface(u,v-d));
    vertices.push(...surface(u,v),...unit(cross(du,dv)));
    if(i<columns && j<rows){
      const a=i*(rows+1)+j,b=a+rows+1;
      indices.push(a,b,a+1,a+1,b,b+1);
    }
  }
  return [new Float32Array(vertices),new Uint16Array(indices)];
}
const meshes=[()=>mesh(knot,432,32),()=>mesh(ring,144,32),()=>mesh(sphere,64,32)];

function createRenderer(canvas,index) {
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});
  if(!gl) return null;
  const program=gl.createProgram();
  for(const [type,source] of [[gl.VERTEX_SHADER,vertexSource],[gl.FRAGMENT_SHADER,fragmentSource]]){
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source); gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program,shader); gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const [vertices,indices]=meshes[index]();
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  for(const [name,offset] of [['position',0],['normal',12]]){
    const loc=gl.getAttribLocation(program,name);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,3,gl.FLOAT,false,24,offset);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  gl.enable(gl.DEPTH_TEST);
  const loc=Object.fromEntries(['camera','spin','offset','size','frame','tint','iridescence'].map(n=>[n,gl.getUniformLocation(program,n)]));
  function draw(spin,size,offset,tint,film){
    gl.uniform3fv(loc.spin,spin); gl.uniform3fv(loc.size,size); gl.uniform3fv(loc.offset,offset);
    gl.uniform3fv(loc.tint,tint); gl.uniform1f(loc.iridescence,film);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
  }
  return function render(time,yaw,pitch,scroll){
    const dpr=Math.min(window.devicePixelRatio||1,1.65);
    const w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const zoom=2.98*Math.min(1,w/h);
    gl.uniform2f(loc.frame,zoom*h/w,zoom);
    gl.uniform3f(loc.camera,-.26+pitch+scroll*.22,.18+yaw+time*.14+scroll*.48,-.27);
    if(index===0){
      draw([.23,.2,.15],[1.10,1.10,1.10],[0,0,0],[.78,.83,1],.70);
    }else if(index===1){
      for(let i=0;i<5;i++){
        const radius=1.51-i*.21;
        draw([i*.56+time*(i%2?.16:-.12),i*.64,i*.22],[radius,radius,.82],[0,0,0],i%2?[.81,.94,.18]:[.46,.37,.98],.19);
      }
    }else{
      for(let i=0;i<14;i++){
        const a=i*TAU/14,beat=.5+.5*Math.sin(time*1.25+i*.48);
        const radius=.88+beat*.09;
        draw([.10+beat*.53,.34,a],[.65,.245,.31],[radius*Math.cos(a),radius*Math.sin(a),.19*Math.sin(2*a+time*.6)],[.19,.24,.51],.44);
      }
      draw([0,0,0],[.44,.44,.44],[0,0,.11],[.63,.72,.83],.3);
    }
  };
}

const halls=[...document.querySelectorAll('.hall')];
const links=[...document.querySelectorAll('nav a')];
const motion=document.querySelector('.motion');
const preference=matchMedia('(prefers-reduced-motion: reduce)');
const scenes=halls.map((hall,index)=>{
  const canvas=hall.querySelector('canvas');
  canvas.style.backgroundImage=`url("poster-${index+1}.jpg")`;
  const scene={hall,canvas,index,render:null,visible:false,dirty:true,time:0,yaw:0,pitch:0,drag:null};
  function init(){
    try{scene.render=createRenderer(canvas,index);}catch(error){console.warn('3D:',error.message);}
    canvas.classList.toggle('live',Boolean(scene.render));
    canvas.tabIndex=scene.render?0:-1;
    canvas.setAttribute('aria-describedby','rotate-'+index);
    canvas.style.backgroundImage=scene.render?'none':`url("poster-${index+1}.jpg")`;
    scene.dirty=true;
  }
  const hint=document.createElement('span');
  hint.id='rotate-'+index;hint.className='rotate-hint';
  hint.textContent='Вращайте жестом или клавишами ← →';
  canvas.after(hint);
  canvas.addEventListener('keydown',e=>{
    if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
    e.preventDefault();scene.yaw+=e.key==='ArrowLeft'?-.22:.22;scene.dirty=true;wake();
  });
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();scene.render=null;canvas.classList.remove('live');canvas.style.backgroundImage=`url("poster-${index+1}.jpg")`;});
  canvas.addEventListener('webglcontextrestored',()=>{init();wake();});
  canvas.addEventListener('pointerdown',e=>{
    scene.drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!scene.drag)return;
    scene.yaw+=(e.clientX-scene.drag[0])*.009;
    scene.pitch=Math.max(-1.3,Math.min(1.3,scene.pitch+(e.clientY-scene.drag[1])*.006));
    scene.drag=[e.clientX,e.clientY];scene.dirty=true;wake();
  });
  canvas.addEventListener('lostpointercapture',()=>{scene.drag=null;});
  init();return scene;
});

let paused=preference.matches, frame=0,last=0;
function updateControl(){
  motion.hidden=!scenes.some(s=>s.render);
  motion.querySelector('b').textContent=paused?'▶':'Ⅱ';
  motion.querySelector('span').textContent=paused?'Движение':'Пауза';
  motion.setAttribute('aria-label',paused?'Включить движение':'Поставить анимацию на паузу');
  document.body.classList.toggle('playing',!paused);
}
function wake(){
  if(!frame&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}
}
function tick(now){
  frame=0;
  if(document.hidden)return;
  const dt=Math.min((now-last)/1000,.05);
  let active=false;
  if(dt>=.030||paused){
    last=now;
    for(const s of scenes){
      if(!s.visible||!s.render)continue;
      active=true;
      if(paused&&!s.dirty)continue;
      const rect=s.canvas.getBoundingClientRect();
      const scroll=paused?0:Math.max(-1,Math.min(1,(innerHeight/2-rect.top-rect.height/2)/innerHeight));
      if(!paused)s.time+=dt;
      s.render(s.time,s.yaw,s.pitch,scroll);s.dirty=false;
    }
  }else active=scenes.some(s=>s.visible&&s.render);
  if(active&&!paused)frame=requestAnimationFrame(tick);
}
function setPaused(value){
  paused=value;updateControl();scenes.forEach(s=>s.dirty=true);wake();
}
motion.addEventListener('click',()=>setPaused(!paused));
preference.addEventListener('change',e=>setPaused(e.matches));
const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
    const scene=scenes[halls.indexOf(entry.target)];scene.visible=entry.isIntersecting;scene.dirty=true;
    scene.hall.classList.toggle('on-stage',entry.isIntersecting);
  }
  const middle=innerHeight*.5;
  const current=scenes.find(s=>{const r=s.hall.getBoundingClientRect();return r.top<=middle&&r.bottom>middle;});
  if(current)links.forEach((a,i)=>{if(i===current.index)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  wake();
},{threshold:[0,.25,.5,.75,1]});
halls.forEach(h=>observer.observe(h));
window.addEventListener('resize',()=>{scenes.forEach(s=>s.dirty=true);wake();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});
updateControl();
