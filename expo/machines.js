/* Three small kinetic machines, modelled in local coordinates with the front at +Z. */
(() => {
  const T = window.THREE;
  if (!T) return;
  const tau = Math.PI * 2;
  const paint = (color, metalness, roughness) => new T.MeshStandardMaterial({color,metalness,roughness});
  const red = paint(0xfa3415,.35,.22), chrome = paint(0xd7d8d4,.97,.17);
  const aluminium = paint(0xa6a9ad,.83,.32), dark = paint(0x212126,.56,.29);
  const rubber = paint(0x141317,.04,.65), lilac = paint(0xa294ec,.44,.24);
  const ivory = paint(0xf8e9ca,.26,.33), yellow = paint(0xebf36f,.22,.31);
  const paper = paint(0xfff8e3,.01,.84);
  function mesh(parent, geometry, material, x=0,y=0,z=0) {
    const o = new T.Mesh(geometry,material);
    o.position.set(x,y,z); parent.add(o); return o;
  }
  function group(parent,x=0,y=0,z=0) {
    const g = new T.Group(); g.position.set(x,y,z); parent.add(g); return g;
  }
  function rounded(parent,x,y,z,w,h,d,material,r=.08) {
    r = Math.min(r,w/2.1,h/2.1);
    const a=-w/2,b=-h/2,c=w/2,e=h/2,s=new T.Shape();
    s.moveTo(a+r,b);s.lineTo(c-r,b);s.quadraticCurveTo(c,b,c,b+r);
    s.lineTo(c,e-r);s.quadraticCurveTo(c,e,c-r,e);s.lineTo(a+r,e);
    s.quadraticCurveTo(a,e,a,e-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);
    const bevel=Math.min(.045,d*.24,r*.48);
    const geo=new T.ExtrudeGeometry(s,{depth:d-2*bevel,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,curveSegments:7});
    geo.translate(0,0,-d/2+bevel);
    return mesh(parent,geo,material,x,y,z);
  }
  function disc(parent,x,y,z,r,d,mat,segments=48) {
    const geometry=new T.CylinderGeometry(r,r,d,segments);geometry.rotateX(Math.PI/2);
    return mesh(parent,geometry,mat,x,y,z);
  }
  function ring(parent,x,y,z,r,t,mat) {
    return mesh(parent,new T.TorusGeometry(r,t,12,92),mat,x,y,z);
  }
  function shell(parent,profile,material) {
    const geo=new T.LatheGeometry(profile.map(([radius,z])=>new T.Vector2(radius,z)),112);
    geo.rotateX(Math.PI/2); return mesh(parent,geo,material);
  }
  function cable(parent,points,radius,material) {
    const path=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));
    return mesh(parent,new T.TubeGeometry(path,52,radius,10,false),material);
  }
  function screw(parent,x,y,z) {
    disc(parent,x,y,z,.052,.024,chrome,16);
    const slot=mesh(parent,new T.BoxGeometry(.06,.012,.005),dark,x,y,z+.014);
    slot.rotation.z=.67;
  }
  function printed(parent,x,y,z,w,h,draw) {
    const c=document.createElement('canvas');c.width=768;c.height=Math.max(64,Math.round(768*h/w));
    draw(c.getContext('2d'),c.width,c.height);
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    const mat=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false});
    return mesh(parent,new T.PlaneGeometry(w,h),mat,x,y,z);
  }
  function inscription(parent,x,y,z,w,h,words,ink) {
    return printed(parent,x,y,z,w,h,(ctx,W,H)=>{
      ctx.fillStyle=ink;ctx.font='bold '+Math.round(H*.77)+'px Arial';
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(words,W/2,H/2,W*.98);
    });
  }

  function makeWord(parent, color) {
    const letters = [
      [[0,0],[.19,0],[.19,.65],[.37,.40],[.50,.40],[.68,.65],[.68,0],[.87,0],[.87,1],[.68,1],[.435,.68],[.19,1],[0,1]],
      [[0,0],[.21,0],[.28,.21],[.61,.21],[.69,0],[.9,0],[.55,1],[.35,1]],
      [[0,0],[.24,0],[.45,.34],[.67,0],[.91,0],[.58,.51],[.90,1],[.67,1],[.45,.67],[.24,1],[.01,1],[.32,.51]]
    ];
    const word = group(parent);
    const face = new T.MeshBasicMaterial({color});
    const edge = paint(color === 0xffeea1 ? 0xbf6818 : 0x762042,.45,.25);
    letters.forEach((points, index) => {
      const shape = new T.Shape(points.map(([x,y]) => new T.Vector2(x,y)));
      if (index === 1) {
        shape.holes.push(new T.Path([new T.Vector2(.34,.40),new T.Vector2(.45,.72),new T.Vector2(.55,.40)]));
      }
      const geometry = new T.ExtrudeGeometry(shape, {depth:.24,bevelSize:.023,bevelThickness:.023,bevelSegments:2});
      mesh(word,geometry,[face,edge],index*1.01-1.46,-.50,-.12);
    });
    word.visible = false;
    return word;
  }

  function horn(parent) {
    const core=group(parent);
    const outer=[[.006,-1.94],[.34,-1.94],[.43,-1.9],[.45,-1.76],[.45,-1.03],[.48,-.95]];
    const flare=[];
    for(let i=0;i<=40;i++){const t=i/40;flare.push([.46+.27*t+1.02*t*t,-1.02+2.22*t]);}
    const inside=flare.slice().reverse().map(([r,z])=>[r-.075,z-.022]);
    shell(core,[...outer,...flare,[1.77,1.23],[1.75,1.27],...inside,[.02,-1.08]],red);
    for(let i=0;i<16;i++){
      const theta=i*tau/16;
      const seam=flare.slice(5,39).filter((_,n)=>n%4===0).map(([r,z])=>[(r+.008)*Math.cos(theta),(r+.008)*Math.sin(theta),z]);
      cable(core,seam,.011,red);
    }
    for(let i=0;i<3;i++){
      const z=-.98+i*.15,r=.47+i*.029;
      ring(core,0,0,z,r,.023,i===0?chrome:red);
    }
    ring(core,0,0,1.235,1.744,.06,chrome);
    ring(core,0,0,1.14,1.693,.025,dark);
    const motor=group(core);disc(motor,0,0,-1.79,.47,.27,dark);
    for(let i=0;i<7;i++)ring(motor,0,0,-1.95+i*.075,.45,.032,i%3===0?chrome:rubber);
    disc(core,0,0,-1.02,.41,.12,rubber);
    shell(core,[[.34,-1.04],[.34,-.85],[.27,-.55],[.18,-.16],[.09,.06],[.008,.14]],chrome);
    for(let i=0;i<4;i++)ring(core,0,0,-.88+i*.038,.345,.014,dark);
    const grip=rounded(core,0,-1.04,-1.02,.42,1.3,.47,dark,.15);grip.rotation.x=-.21;
    for(let i=0;i<5;i++)rounded(grip,0,-.43+i*.16,.23,.32,.045,.035,rubber,.018);
    cable(core,[[0,-.5,-1.17],[0,-.82,-1.92],[0,-1.7,-2.15],[0,-1.87,-1.59],[0,-1.56,-1.13]],.052,rubber);
    const waves=Array.from({length:3},(_,i)=>{
      const mat=new T.MeshBasicMaterial({color:0x675042,transparent:true,opacity:.45,depthWrite:false});
      return ring(core,0,0,1.3+i*.18,1.79+i*.09,.009,mat);
    });
    const words = [0xffeea1,0xff91aa,0xffeea1].map(color => makeWord(core,color));
    const faceCamera = new T.Quaternion();
    const tilt = new T.Quaternion();
    const angles = new T.Euler();
    return {base:[-.15,-.92,-.29],size:5.75,update(t,s) {
      waves.forEach((wave,i)=>{
        const phase=(t*.28+i/3+s.pulse*.55)%1;
        wave.position.z=1.31+phase*(.88+s.pulse*.38);
        wave.scale.setScalar(1+phase*.25);wave.material.opacity=(1-phase)*(.51+s.pulse*.27);
      });
      motor.position.z=-s.pulse*.55;core.position.z=-s.pulse*.13;core.rotation.z=s.pulse*.08;
      core.getWorldQuaternion(faceCamera).invert();
      words.forEach((word,i) => {
        const elapsed = s.still ? .32 + i*.09 : t - s.firedAt - i*.16;
        word.visible = t - s.firedAt < 1.46 && elapsed >= 0 && elapsed < 1.14;
        if (!word.visible) return;
        const travel = elapsed / 1.14;
        const spread = i - 1;
        word.position.set(spread*.85*travel, spread*1.35*travel + Math.sin(travel*Math.PI)*.16, 1.30+travel*3.7);
        const size = Math.min(.23+travel*1.55, .62) * (1-T.MathUtils.smoothstep(travel,.74,1)*.97);
        word.scale.setScalar(size);
        tilt.setFromEuler(angles.set(-.16, .36-travel*.65, spread*.28 + travel*.22));
        word.quaternion.copy(faceCamera).multiply(tilt);
      });
    }};
  }

  function mixingDesk(parent) {
    rounded(parent,0,0,0,3.4,2.64,.46,dark,.14);
    rounded(parent,0,0,.25,3.30,2.52,.06,lilac,.10);
    for(const side of [-1,1]) {
      rounded(parent,side*1.70,0,.02,.12,2.50,.41,aluminium,.045);
      for(const y of [-1.12,1.12])screw(parent,side*1.51,y,.295);
    }
    inscription(parent,-.69,.96,.289,1.35,.21,'AiR   /   MIX–04','#201e23');
    const knobs=[];
    for(let i=0;i<4;i++){
      const x=(i-1.5)*.72;
      disc(parent,x,.49,.34,.19,.09,dark);
      const knob=group(parent,x,.49,.43);
      disc(knob,0,0,0,.16,.16,i===0?yellow:aluminium);
      ring(knob,0,0,.075,.135,.012,chrome);
      rounded(knob,0,.082,.087,.014,.09,.012,dark,.005);
      knobs.push(knob);
      rounded(parent,x,-.39,.30,.075,1,.03,rubber,.03);
      for(let j=0;j<9;j++)mesh(parent,new T.BoxGeometry(j%2?.057:.09,.013,.006),dark,x+.15,-.82+j*.108,.292);
      inscription(parent,x,-1.03,.292,.36,.13,'0'+(i+1),'#17161c');
    }
    const faders=Array.from({length:4},(_,i)=>{
      const f=group(parent,(i-1.5)*.72,0,.385);
      rounded(f,0,0,0,.47,.24,.17,i===0?yellow:ivory,.055);
      rounded(f,0,0,.089,.32,.023,.008,dark,.008); return f;
    });
    const lights=Array.from({length:8},(_,i)=> {
      const m=new T.MeshBasicMaterial({color:0xe8ef84});
      return rounded(parent,.43+i*.115,.97,.29,.065,.12,.015,m,.013);
    });
    for(let i=0;i<3;i++){
      const x=-.92+i*.48;
      cable(parent,[[x,1.29,.02],[x,1.61,-.05],[x+.23,1.74,-.5],[x+.64,1.45,-.73],[x+.6,1.31,-.65]],.05,i===0?yellow:rubber);
    }
    return {base:[-.46,-.27,-.14],size:4.5,update(t,s) {
      faders.forEach((f,i)=>{
        const dest=i===s.track?.035:-.68+Math.sin(i*1.8)*.12;
        f.position.z=.385+Math.max(0,s.travel-.04)*(.52+.17*i);f.position.y=s.still?dest:T.MathUtils.lerp(f.position.y,dest,.16);
        knobs[i].rotation.z=f.position.y*3.5;
      });
      lights.forEach((l,i)=>l.material.color.setHex(i < 4+Math.sin(t*3+s.track)*3 ? 0xe8ef84 : 0x524761));
    }};
  }

  function printer(parent) {
    rounded(parent,0,-.42,0,2.85,1.81,1.0,rubber,.18);
    rounded(parent,0,-.35,.26,2.82,1.82,.62,ivory,.18);
    rounded(parent,0,-.4,.59,2.53,1.46,.11,ivory,.12);
    rounded(parent,0,.16,.66,2.34,.16,.13,dark,.06);
    for(let i=0;i<13;i++)rounded(parent,-.95+i*.088,-.87,.67,.033,.18,.015,dark,.012);
    inscription(parent,-.43,-.33,.664,1.27,.24,'AiR  /  OUT','#22201d');
    const lamp=disc(parent,1,-.81,.68,.051,.04,new T.MeshBasicMaterial({color:0xf64925}));
    disc(parent,.86,-.4,.69,.19,.07,chrome);disc(parent,.86,-.4,.75,.15,.07,red);
    for(const x of [-1.15,1.15])screw(parent,x,-.95,.68);
    const geo=new T.PlaneGeometry(2.09,2.30,24,60);
    const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),f=(pos.getY(i)+1.15)/2.3;
      pos.setXYZ(i,x,.155+f*2.0+Math.max(0,(f-.98)/.02)*.035*Math.cos(x*46),.69+.45*Math.sin(f*2.8)-.12*f*f);
    }
    geo.computeVertexNormals();
    const sheet=group(parent);
    const slip=mesh(sheet,geo,paper.clone());slip.material.side=T.DoubleSide;
    const c=document.createElement('canvas');c.width=512;c.height=590;
    const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
    slip.material.map=map;
    let last=-1,feedStart=-10;
    const rows=[['КУХНИ НА ЗАКАЗ','15','заявок','30 000','2 000'],['ОНЛАЙН-ОБРАЗОВАНИЕ','120','вступлений','36 000','300'],['АВТОСЕРВИС','18','обращений','36 000','2 000']];
    function print(index){
      const [label,amount,unit,budget,price]=rows[index],ctx=c.getContext('2d');
      ctx.fillStyle='#fff8e7';ctx.fillRect(0,0,512,590);ctx.fillStyle='#211e19';ctx.textAlign='center';
      ctx.font='bold 30px monospace';ctx.fillText('AiR × MAX',256,67);
      ctx.font='18px monospace';ctx.fillText(label,256,109);
      ctx.fillRect(37,133,438,3);ctx.font='bold 147px Arial';ctx.fillText(amount,256,283);
      ctx.font='bold 31px monospace';ctx.fillText(unit,256,326);ctx.fillRect(37,349,438,3);
      ctx.font='20px monospace';ctx.fillText('Размещение   '+budget+' ₽',256,396);
      ctx.fillText('Результат    '+price+' ₽',256,434);
      for(let i=0;i<86;i++){const w=(i*13%7)+1;ctx.fillRect(40+i*5,476,w,40);}
      ctx.font='16px monospace';ctx.fillText('ИЛЛЮСТРАТИВНЫЙ РАСЧЁТ',256,546);
      map.needsUpdate=true;
    }
    return {base:[-.19,-.39,-.11],size:4.25,update(t,s){
      if(last!==s.sample){feedStart=last<0?-10:t;print(s.sample);last=s.sample;}
      const progress=s.still?1:Math.min(1,(t-feedStart)/.82);
      sheet.scale.y=.12+.88*(1-Math.pow(1-progress,3));
      lamp.material.color.setHex(progress<1?0x91dc42:0xf64925);
      parent.position.y-=.23;
    }};
  }

  function studioEnvironment(renderer) {
    const studio=new T.Scene();
    studio.background=new T.Color(0x55565d);
    const V=T.Vector3;
    function softbox(x,y,z,w,h,power,tone) {
      const material=new T.MeshBasicMaterial({color:new T.Color(tone).multiplyScalar(power),side:T.DoubleSide});
      const panel=mesh(studio,new T.PlaneGeometry(w,h),material,x,y,z);
      panel.lookAt(new V());
    }
    softbox(-4,4,2,3,8,5,0xffffff);softbox(5,2,1,1.7,6,4,0xf0f5ff);
    softbox(1,-4,2,5,4,.8,0xffdfbc);softbox(0,4,-5,8,3,3,0xe6eaff);
    softbox(1,0,5,2,7,.008,0xffffff);
    const generator=new T.PMREMGenerator(renderer);
    const target=generator.fromScene(studio,.025);
    generator.dispose();
    studio.children.forEach(child=>{child.geometry.dispose();child.material.dispose();});
    return target;
  }
  const factories={horn,desk:mixingDesk,printer};
  const hosts=[...document.querySelectorAll('[data-machine]')];
  const scenes=[];
  let frame=0,previous=0;
  const still=()=>document.documentElement.dataset.paused==='true';
  function makeScene(host) {
    const id=host.dataset.machine,scene=new T.Scene();
    const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
    renderer.setClearColor(0,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
    const env=studioEnvironment(renderer);scene.environment=env.texture;
    const camera=new T.PerspectiveCamera(30,1,.1,40);
    const rig=group(scene),model=factories[id](rig);
    const key=new T.DirectionalLight(0xfff8e8,2.25);key.position.set(-4,6,5);scene.add(key);
    const rim=new T.DirectionalLight(0xf4f7ff,1.3);rim.position.set(4,2,-2);scene.add(rim);
    scene.add(new T.HemisphereLight(0xffffff,0xb29283,1.05));
    const canvas=renderer.domElement; canvas.setAttribute('aria-hidden','true');host.append(canvas);
    const s={host,renderer,scene,rig,model,camera,t:0,pulse:0,firedAt:-Infinity,yaw:0,pitch:0,drag:null,pointerX:0,pointerY:0,prevWidth:0,prevHeight:0,visible:true,still:false,dirty:true};
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();host.classList.remove('live');});
    canvas.addEventListener('webglcontextrestored',()=>{s.dirty=true;wake();});
    host.addEventListener('pointerdown',e=>{
      if(!e.isPrimary || e.button!==0)return;
      s.press=[e.clientX,e.clientY];
      s.drag=[e.clientX,e.clientY];host.setPointerCapture(e.pointerId);
    });
    host.addEventListener('pointermove',e=>{
      if(!e.isPrimary)return;
      if(s.drag){
        s.yaw+=(e.clientX-s.drag[0])*.011;
        s.pitch=T.MathUtils.clamp(s.pitch+(e.clientY-s.drag[1])*.005,-1,1);
        s.drag=[e.clientX,e.clientY];
      }else if(!still() && e.pointerType==='mouse'){
        const rect=host.getBoundingClientRect();
        s.pointerX=((e.clientX-rect.left)/rect.width-.5)*.28;
        s.pointerY=((e.clientY-rect.top)/rect.height-.5)*.13;
      }
      s.dirty=true;wake();
    });
    host.addEventListener('pointerup',e=>{
      if(id==='horn' && s.press && Math.hypot(e.clientX-s.press[0],e.clientY-s.press[1])<8) fire(s);
      s.press=null;
    });
    host.addEventListener('lostpointercapture',()=>{s.drag=null;s.press=null;});
    host.addEventListener('pointerleave',()=>{s.pointerX=0;s.pointerY=0;});
    host.tabIndex=0;
    host.setAttribute('aria-keyshortcuts',id==='horn'?'Enter Space ArrowLeft ArrowRight':'ArrowLeft ArrowRight');
    host.addEventListener('keydown',e=>{
      if(id==='horn' && (e.key==='Enter' || e.key===' ')){
        e.preventDefault();
        if(!e.repeat)fire(s);
        return;
      }
      if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
      e.preventDefault();s.yaw+=e.key==='ArrowLeft'?-.2:.2;s.dirty=true;wake();
    });
    return s;
  }
  function paintScene(s,dt) {
    const {host,renderer,rig,model,camera}=s;
    const width=host.clientWidth,height=host.clientHeight;
    if(!width || !height || renderer.getContext().isContextLost())return;
    s.still=still();
    if(!s.still){s.t+=dt;s.pulse=Math.max(0,s.pulse-dt*1.25);}
    s.track=Number(document.documentElement.dataset.track||0);s.sample=Number(document.documentElement.dataset.sample||0);
    if(width!==s.prevWidth || height!==s.prevHeight){
      renderer.setSize(width,height,false);camera.aspect=width/height;
      camera.position.z=(model.size/2)/Math.tan(Math.PI/12)/Math.min(1,camera.aspect);
      camera.updateProjectionMatrix();s.prevWidth=width;s.prevHeight=height;
    }
    const rect=host.getBoundingClientRect();
    const progress=s.still?0:T.MathUtils.clamp((rect.top+height*.5-innerHeight*.5)/innerHeight,-1,1);
    s.travel=progress;const [x,y,z]=model.base, time=s.t;
    rig.rotation.set(x+s.pitch+s.pointerY+Math.sin(time*.55)*.065,
      y+s.yaw+s.pointerX+progress*.56+Math.sin(time*.42)*.16,z+progress*.13+Math.cos(time*.48)*.035);
    rig.position.set(0,Math.sin(time*.84)*.065,0);
    model.update(time,s);
    renderer.render(s.scene,camera);
    host.classList.add('live');s.dirty=false;
  }
  function tick(now) {
    frame=0;const dt=previous?Math.min(.055,(now-previous)/1000):0;previous=now;
    if(document.hidden)return;
    for(const s of scenes)if(s.visible && (s.dirty || !still()))paintScene(s,dt);
    if(!still() && scenes.some(s=>s.visible))wake();
  }
  function wake(){if(!frame && !document.hidden)frame=requestAnimationFrame(tick);}
  function fire(s){
    s.firedAt=s.t;
    s.pulse=1;
    s.dirty=true;
    wake();
  }
  function refresh(){scenes.forEach(s=>s.dirty=true);wake();}
  const observer=new IntersectionObserver(entries=>{
    for(const e of entries){
      let s=scenes.find(item=>item.host===e.target);
      if(!s && e.isIntersecting && !e.target.dataset.fallback){
        try{s=makeScene(e.target);scenes.push(s);}
        catch(error){e.target.dataset.fallback='true';console.warn('3D exhibit:',error.message);}
      }
      if(s){s.visible=e.isIntersecting;s.dirty=true;}
    }
    wake();
  },{rootMargin:'70px'});
  hosts.forEach(host=>observer.observe(host));
  addEventListener('resize',refresh);addEventListener('exhibitionchange',refresh);
  document.addEventListener('visibilitychange',refresh);
})();
