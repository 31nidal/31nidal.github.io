import * as T from 'three';
import { mechanicalTriangles } from './geometry.js';

function marking(text, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c2cad6';
  ctx.font = 'bold 65px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, 256, 72);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  const label = new T.Mesh(new T.PlaneGeometry(width, height),
    new T.MeshBasicMaterial({map:texture, transparent:true, depthWrite:false}));
  label.rotation.x = -Math.PI / 2;
  return label;
}

export function buildRobot() {
  const robot = new T.Group();
  const assemblies = Array.from({length:6}, (_,index) => {
    const group = new T.Group();
    group.userData.index = index;
    robot.add(group);
    return group;
  });
  const roof = new T.Group();
  assemblies[5].add(roof);
  const wheels = [];
  for (const x of [-61,61]) for (const z of [-44,44]) {
    const wheel = new T.Group();
    wheel.position.set(x,-24,z);
    assemblies[4].add(wheel);
    wheels.push(wheel);
  }
  // Batch surfaces by physical material and moving assembly.
  const batches = new Map();
  for (const face of mechanicalTriangles()) {
    let parent = assemblies[face.part];
    if (face.part === 4) parent = wheels[(face.a[0]>0?2:0)+(face.a[2]>0?1:0)];
    if (face.part === 5 && Math.min(face.a[1],face.b[1],face.c[1])>=7) parent = roof;
    const key = parent.id + face.color;
    if (!batches.has(key)) batches.set(key,{parent,color:face.color,vertices:[]});
    const vertices = batches.get(key).vertices;
    for (const p of [face.a,face.b,face.c]) vertices.push(
      p[0]-parent.position.x,p[1]-parent.position.y,p[2]-parent.position.z);
  }
  for (const {parent,color,vertices} of batches.values()) {
    const dark = ['#171820','#262832','#3c404c','#252936'].includes(color);
    const pcb = ['#456270','#57697e'].includes(color);
    const material = new T.MeshStandardMaterial({color,metalness:dark?.12:pcb?.3:.82,
      roughness:dark?.78:pcb?.55:.33,side:T.DoubleSide});
    const geometry = new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    geometry.computeVertexNormals();
    const mesh = new T.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
  }
  for (const [parent,text,x,y,z,w,h] of [
    [roof,'SRI / MOBILE',0,14.1,31,36,7],
    [assemblies[0],'RPLIDAR A2',0,46.2,-12,26,4.5],
    [assemblies[2],'Raspberry Pi',-25,-6.55,-16,20,4],
    [assemblies[3],'MEGA 2560',25,-6.55,-25,23,4]
  ]) {
    const label = marking(text,w,h);
    label.position.set(x,y,z);
    parent.add(label);
  }
  // Etched traces, exposed GPIO contacts and connector openings.
  for (const [index,x,length] of [[2,-25,58],[3,25,78]]) {
    const traces = [];
    for(let i=0;i<8;i++) {
      const z=-length/2+6+i*2;
      traces.push(x-13,-6.56,z,x-6,-6.56,z,x-6,-6.56,z,x-2,-6.56,z+4);
    }
    const geometry = new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(traces,3));
    assemblies[index].add(new T.LineSegments(geometry,new T.LineBasicMaterial({color:'#8294ac'})));
    const ports=new T.InstancedMesh(new T.BoxGeometry(4.6,4.1,.8),new T.MeshStandardMaterial({color:'#171820'}),3);
    for(let i=0;i<3;i++) ports.setMatrixAt(i,new T.Matrix4().makeTranslation(x-8+i*8,-3,2-(index===3?3:0)+length/2+1));
    assemblies[index].add(ports);
  }
  return {robot,assemblies,roof,wheels};
}
