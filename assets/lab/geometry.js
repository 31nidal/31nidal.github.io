export function mechanicalTriangles(){
const mesh=[];
let part=5;
const silver='#b4bfce',alloy='#8294ac',dark='#262832',black='#171820',rim='#485466',board='#456270',ceramic='#bec6d2';
const add=(a,b,c,color)=>mesh.push({a,b,c,color,part});
const quad=(a,b,c,d,color)=>{add(a,b,c,color);add(a,c,d,color)};
function extrude(loop,height,transform,color){
 const rings=[-height/2,height/2].map(t=>loop.map(([a,b])=>transform(a,b,t)));
 for(const ring of rings)for(let i=1;i<ring.length-1;i++)add(ring[0],ring[i],ring[i+1],color);
 rings[0].forEach((p,i)=>{let j=(i+1)%loop.length;quad(p,rings[0][j],rings[1][j],rings[1][i],color)});
}
function slab(x,y,z,w,h,d,cut,color){
 const a=w/2,b=d/2,c=Math.min(cut,a,b);
 extrude([[a-c,b],[-a+c,b],[-a,b-c],[-a,-b+c],[-a+c,-b],[a-c,-b],[a,-b+c],[a,b-c]],h,(u,v,t)=>[x+u,y+t,z+v],color);
}
function tube(a,b,r,color,n=20,r2=r){
 let axis=b.map((v,i)=>v-a[i]);const l=Math.hypot(...axis);axis=axis.map(v=>v/l);
 const cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 let u=cross(axis,Math.abs(axis[1])<.8?[0,1,0]:[1,0,0]);const m=Math.hypot(...u);u=u.map(v=>v/m);let v=cross(axis,u);
 const ring=(p,r)=>Array.from({length:n},(_,i)=>p.map((k,j)=>k+r*(u[j]*Math.cos(2*Math.PI*i/n)+v[j]*Math.sin(2*Math.PI*i/n))));
 const low=ring(a,r),high=ring(b,r2);for(let i=0;i<n;i++){let j=(i+1)%n;quad(low[i],low[j],high[j],high[i],color);add(a,low[i],low[j],color);add(b,high[j],high[i],color)}
}
const stack=(x,y,z,r,h,c,n=32,r2=r)=>tube([x,y,z],[x,y+h,z],r,c,n,r2);
function cable(points,r,c){points.slice(1).forEach((p,i)=>tube(points[i],p,r,c,8))}
slab(0,-20,0,103,7,141,13,alloy);slab(0,-24,0,97,3,134,10,dark);
for(const x of [-42,42])for(const z of [-56,56]){
 stack(x,-17,z,3,29,silver,8);stack(x,12,z,4,2,dark,6);
}
slab(0,10,0,104,4,144,14,silver);slab(0,13,0,100,2,140,13,alloy);
for(const side of [-1,1]){
 for(let i=0;i<8;i++)slab(side*33,14.15,-42+i*8,16,1,3,1,dark);
 for(const z of [-54,55]) stack(side*40,14,z,2.6,1.4,silver,6);
}
slab(0,15,53,59,2,12,3,dark);for(let i=-3;i<=3;i++)slab(i*7,16.2,53,3,.7,7,1,alloy);
// Four axle carriers with geared motor housings and electrical leads.
for (const side of [-1,1]) for (const z of [-44,44]) {
  const x=side*43;
  slab(x,-18,z,15,18,24,2,alloy);
  tube([side*28,-22,z],[side*44,-22,z],7,dark,24);
  tube([side*44,-24,z],[side*62,-24,z],3.8,silver,20);
  for(const dz of [-8,8]) stack(x,-8,z+dz,2.1,2,silver,6);
  cable([[side*32,-17,z],[side*25,-12,z],[side*18,-12,z*.5],[19,-7,9]],.9,rim);
}
// Fastener slots distinguish the socket heads from the spacers underneath.
for(const x of [-40,40]) for(const z of [-54,55]) stack(x,15.4,z,1.1,.2,black,6);
part=0;
slab(0,17,-24,59,4,57,8,dark);for(const x of [-23,23])for(const z of [-45,-3])stack(x,19,z,2,2,silver,6);
stack(0,19,-24,24,5,alloy,48,26);stack(0,24,-24,26,4,dark,48);
stack(0,28,-24,21,11,'#252936',48);stack(0,39,-24,26,5,silver,48,24);
stack(0,44,-24,23,2,alloy,48,21);stack(0,46,-24,9,.8,dark,36);
for(let i=0;i<12;i++){const a=i*Math.PI/6;stack(18*Math.cos(a),46,-24+18*Math.sin(a),.8,.6,silver,8)}
// Dark optical windows around the rotating scan head.
for(let i=0;i<8;i++){
  const a=i*Math.PI/4, b=a+.43;
  const rimPoint=(angle,y)=>[21.2*Math.cos(angle),y,-24+21.2*Math.sin(angle)];
  quad(rimPoint(a,30),rimPoint(b,30),rimPoint(b,36),rimPoint(a,36),black);
}
part=1;
slab(0,21,64,39,24,9,3,dark);slab(0,21,69,34,20,2,2,board);
for(const x of [-14,14])for(const y of [14,28])tube([x,y,70],[x,y,72],1.5,silver,8);
for(const [z,r,h,c] of [[70,9,3,black],[73,8,3,rim],[76,6,2,black],[78,4.8,1,'#657e9a']])tube([0,21,z],[0,21,z+h],r,c,28);
tube([-1,22,79],[ -1,22,79.5],1.3,'#d3e0e9',12);
cable([[12,15,61],[16,4,51],[0,-5,45],[-24,-6,21]],1.8,alloy);
for(const [id,x,z,w,d] of [[2,-25,2,36,58],[3,25,-1,34,78]]){
 part=id;slab(x,-8,z,w,2.7,d,2,id===2?board:'#57697e');
 for(const dx of [-1,1])for(const dz of [-1,1])stack(x+dx*(w/2-3),-6.5,z+dz*(d/2-4),1.6,1,silver,8);
 slab(x,-5,z,13,4,14,1,black);slab(x,-2.6,z,9,1,10,1,alloy);
 for(let i=0;i<10;i++)for(const s of [-1,1])slab(x+s*(w/2-3),-5,z-19+i*3,2,3,1.5,0,silver);
 for(let i=0;i<3;i++)slab(x-8+i*8,-3,z+d/2-4,6,7,10,1,silver);
 for(let i=0;i<6;i++)slab(x-8+(i%3)*7,-5.5,z-16+Math.floor(i/3)*5,4,2,2,0,ceramic);
 cable([[x,-5,z-20],[x+3,-1,-35],[x*.45,-2,-46],[0,-10,-50]],1.2,alloy);
}
part=4;
for(const s of [-1,1])for(const z of [-44,44]){
 const y=-24,x=s*61;
 const wheel=(start,end,r,c,r2=r)=>tube([x+s*start,y,z],[x+s*end,y,z],r,c,36,r2);
 wheel(-12,10,23,black);wheel(10,13,23,dark,20);wheel(13,14,15,alloy);wheel(14,15,11,dark);wheel(15,17,6,silver);
 for(let i=0;i<32;i++){
   const a=i*Math.PI/16,b=a+.105;
   const edge=(dx,t,r)=>[x+s*dx,y+Math.cos(t)*r,z+Math.sin(t)*r];
   quad(edge(-11,a,24),edge(10,a+.07,24),edge(10,b+.07,24),edge(-11,b,24),'#3c404c');
 }
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3;const yy=y+9*Math.cos(a),zz=z+9*Math.sin(a);tube([x+s*15,yy,zz],[x+s*16,yy,zz],1.6,silver,6);
 }
}


return mesh;
}
