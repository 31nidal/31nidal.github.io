import * as T from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {RoomEnvironment} from '../vendor/RoomEnvironment.js';
import {buildRobot} from './model.js';
import {parts} from './parts.js';
import {walls,stations,ray} from './world.js';

export function createScene(canvas,onPick) {
  const low = matchMedia('(max-width:700px)').matches || navigator.hardwareConcurrency<=4;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const renderer = new T.WebGLRenderer({canvas,alpha:true,antialias:!low,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,low?1.25:1.75));
  renderer.shadowMap.enabled=!low;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(34,1,.5,2500);
  scene.fog=new T.FogExp2(0x14121a,.0029);
  const studio=new RoomEnvironment(), pmrem=new T.PMREMGenerator(renderer);
  scene.environment=pmrem.fromScene(studio,.04).texture;
  studio.dispose();pmrem.dispose();
  const controls=new OrbitControls(camera,canvas);
  controls.enablePan=false;controls.minDistance=65;controls.maxDistance=850;
  controls.enableZoom=true;
  const home=new T.Vector3(-194,142,235);
  camera.position.copy(home);controls.update();
  scene.add(new T.HemisphereLight(0xc2cad6,0x221e2b,1.5));
  const key=new T.DirectionalLight(0xf4f0ea,3);
  key.position.set(-140,240,160);key.castShadow=true;
  Object.assign(key.shadow.camera,{left:-230,right:230,top:230,bottom:-230,far:750});
  key.shadow.mapSize.set(1024,1024);key.shadow.normalBias=.35;
  scene.add(key);
  const {robot,assemblies,roof,wheels}=buildRobot();
  scene.add(robot);
  const ground=new T.Mesh(new T.CircleGeometry(1100,80),new T.MeshStandardMaterial({color:0x14121a,roughness:.92,envMapIntensity:.16}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-49;ground.receiveShadow=true;scene.add(ground);
  const grid=new T.GridHelper(660,33,0x484451,0x35313f);
  grid.position.y=-48.9;grid.material.transparent=true;grid.material.opacity=.32;scene.add(grid);
  const arena=new T.Group();arena.position.y=-48;scene.add(arena);
  const mapping=(x,y)=>new T.Vector3(x-220,0,y-89);
  const edges=[];
  for(const [x,y,a,b] of walls) {
    const p=mapping(x,y),q=mapping(a,b);
    const barrier=new T.Mesh(new T.BoxGeometry(Math.max(1,Math.abs(a-x)),9,Math.max(1,Math.abs(b-y))),
      new T.MeshStandardMaterial({color:0x485466,roughness:.7}));
    barrier.position.copy(p).lerp(q,.5);barrier.position.y=4.5;arena.add(barrier);
    edges.push(p.x,9,p.z,q.x,9,q.z);
  }
  function lines(coords,color) {
    return new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(coords,3)),new T.LineBasicMaterial({color}));
  }
  arena.add(lines(edges,0x8294ac));arena.visible=false;
  const pointCoords=new Float32Array(180*3);
  const cloud=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(pointCoords,3)),new T.PointsMaterial({color:0xc2cad6,size:2}));
  cloud.frustumCulled=false;
  const beam=lines(new Float32Array(12*6),0x7e94b2);beam.frustumCulled=false;
  arena.add(cloud,beam);
  let visible=true,frame=0,expanded=false,amount=0,selected=-1,flight=null,lastTime=0;
  let driveTarget=null,driveAngle=0,rollLeft=0,rollRight=0;
  const aim=new T.Vector3(),eye=new T.Vector3();
  function draw(time) {
    frame=0;
    const dt=Math.min(.05,(time-lastTime)/1000);lastTime=time;
    const ease=reduced.matches?1:1-Math.exp(-10*dt);
    amount=T.MathUtils.lerp(amount,Number(expanded),ease);
    if(Math.abs(amount-Number(expanded))<.001) amount=Number(expanded);
    assemblies.forEach((g,i)=>g.position.fromArray(parts[i].offset).multiplyScalar(amount));
    roof.position.y=amount*27;
    let moving=false;
    if(driveTarget){
      robot.position.lerp(driveTarget,ease);
      robot.rotation.y+=(driveAngle-robot.rotation.y)*ease;
      wheels.forEach((w,i)=>{const spin=i<2?rollLeft:rollRight;w.rotation.x+=spin*ease});
      rollLeft*=1-ease;rollRight*=1-ease;
      moving=robot.position.distanceToSquared(driveTarget)>.001 || Math.abs(robot.rotation.y-driveAngle)>.001 || Math.max(Math.abs(rollLeft),Math.abs(rollRight))>.001;
    }
    if(flight) {
      controls.target.lerp(aim,ease);camera.position.lerp(eye,ease);controls.update();
      if(camera.position.distanceToSquared(eye)+controls.target.distanceToSquared(aim)<.01) flight=null;
    }
    renderer.render(scene,camera);
    if(flight||moving||amount!==Number(expanded)) invalidate();
  }
  function invalidate(){if(visible&&!frame)frame=requestAnimationFrame(draw)}
  function travel(target,offset){aim.copy(target);eye.copy(target).add(offset);flight=true;invalidate()}
  controls.addEventListener('change',invalidate);
  controls.addEventListener('start',()=>{flight=null});
  function bench(){
    arena.visible=false;robot.scale.setScalar(1);robot.position.set(0,0,0);robot.rotation.y=0;
    driveTarget=null;rollLeft=rollRight=0;
  }
  function focus(){
    const p=parts[selected], target=new T.Vector3().fromArray(p.anchor);
    if(expanded) target.add(new T.Vector3().fromArray(p.offset));
    const offsets=[[-115,100,120],[80,44,154],[-104,85,105],[106,90,110],[-115,50,104],[-168,127,190]];
    travel(target,new T.Vector3().fromArray(offsets[selected]));
  }
  function select(i,animate=true){
    bench();selected=i;
    assemblies.forEach((group,j)=>group.traverse(obj=>{
      if(obj.material?.emissive) obj.material.emissive.setHex(j===i?0x172234:0);
    }));
    if(animate)focus();invalidate();
  }
  function explode(value){bench();expanded=value;if(selected>=0)focus();invalidate()}
  function homeView(){bench();expanded=false;travel(new T.Vector3(),home)}
  function zoom(factor){
    const offset=camera.position.clone().sub(controls.target);
    travel(controls.target,offset.setLength(T.MathUtils.clamp(offset.length()*factor,65,850)));
  }
  function simulation(x,y,heading){
    const first=!arena.visible;
    if(first){arena.visible=true;expanded=false;robot.scale.setScalar(.115);travel(new T.Vector3(0,-45,0),new T.Vector3(-12,375,235))}
    const target=mapping(x,y);target.y=-48+48*.115;
    driveTarget=target;
    const next=Math.PI/2-heading;
    driveAngle=robot.rotation.y+Math.atan2(Math.sin(next-robot.rotation.y),Math.cos(next-robot.rotation.y));
    if(first){robot.position.copy(target);robot.rotation.y=driveAngle}invalidate();
  }
  function scan(station,angle){
    const [x,y]=stations[station];simulation(x,y,0);
    const count=Math.min(180,Math.ceil(angle/2));
    const origin=mapping(x,y);origin.y=10;
    for(let i=0;i<count;i++){
      const a=i*Math.PI/90,d=ray(x,y,a);
      pointCoords.set([origin.x+d*Math.cos(a),10,origin.z+d*Math.sin(a)],3*i);
    }
    cloud.geometry.attributes.position.needsUpdate=true;cloud.geometry.setDrawRange(0,count);
    const rays=Math.min(12,count),attr=beam.geometry.attributes.position;
    for(let i=0;i<rays;i++){attr.setXYZ(i*2,origin.x,10,origin.z);const k=(count-1-i)*3;attr.setXYZ(i*2+1,pointCoords[k],10,pointCoords[k+2])}
    attr.needsUpdate=true;beam.geometry.setDrawRange(0,rays*2);invalidate();
  }
  function move(x,y,h,left,right,previous){
    if(!arena.visible)simulation(...previous);
    simulation(x,y,h);rollLeft+=left;rollRight+=right;
    cloud.geometry.setDrawRange(0,0);beam.geometry.setDrawRange(0,0);invalidate();
  }
  const caster=new T.Raycaster();let down=null;
  canvas.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});
  canvas.addEventListener('pointerup',e=>{
    if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;
    const r=canvas.getBoundingClientRect();
    caster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);
    let obj=caster.intersectObjects(assemblies,true)[0]?.object;
    while(obj&&obj.userData.index===undefined)obj=obj.parent;
    if(obj)onPick(obj.userData.index);
  });
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;
    e.preventDefault();if(e.key==='+'||e.key==='-'){zoom(e.key==='+'?.83:1.2);return}
    const spherical=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    if(e.key==='ArrowLeft')spherical.theta-=.18;if(e.key==='ArrowRight')spherical.theta+=.18;
    if(e.key==='ArrowUp')spherical.phi-=.15;if(e.key==='ArrowDown')spherical.phi+=.15;
    spherical.makeSafe();travel(controls.target,new T.Vector3().setFromSpherical(spherical));
  });
  new ResizeObserver(()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();invalidate()}).observe(canvas);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)invalidate()}).observe(canvas);
  return {select,explode,homeView,zoom,scan,move};
}
