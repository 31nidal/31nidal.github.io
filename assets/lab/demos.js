import { stations, walls, ray } from './world.js';
export function demos({mode,scan3D,move3D}){
const $=id=>document.getElementById(id);
let current=0,open=false;
const mini=$('demo-view'),g=mini.getContext('2d'),actions=$('actions'),reading=$('reading');
const ink='#c2cad6',muted='#7e94b2',line='#454456';
let demoFrame=0,station=0,angle=0,heading=-Math.PI/2,pose=[175,110],trail=[],hue=220,command='';
function stroke(x,y,a,b,c=line,width=1){g.beginPath();g.strokeStyle=c;g.lineWidth=width;g.moveTo(x,y);g.lineTo(a,b);g.stroke()}
function dot(x,y,r,c){g.beginPath();g.fillStyle=c;g.arc(x,y,r,0,Math.PI*2);g.fill()}
function label(t,x,y,c=ink){g.fillStyle=c;g.font='13px monospace';g.fillText(t,x,y)}
function clear(){g.clearRect(0,0,440,178);for(let x=10;x<440;x+=15)for(let y=8;y<178;y+=15){g.fillStyle='#292833';g.fillRect(x,y,1,1)}}
function map(){clear();walls.forEach(w=>stroke(...w,line,2))}
function scan(){map();const [x,y]=stations[station];for(let i=0;i<Math.ceil(angle);i+=2){let a=i*Math.PI/180,d=ray(x,y,a);dot(x+d*Math.cos(a),y+d*Math.sin(a),1.8,ink)}
 const a=angle*Math.PI/180,d=ray(x,y,a);stroke(x,y,x+d*Math.cos(a),y+d*Math.sin(a),muted,1.5);dot(x,y,5,ink)}
function addButton(name,fn){let b=document.createElement('button');b.type='button';b.textContent=name;b.onclick=fn;actions.append(b);return b}
function drive(){map();trail.forEach(([x,y])=>dot(x,y,2,muted));g.save();g.translate(...pose);g.rotate(heading);g.fillStyle=ink;g.fillRect(-8,-6,16,12);stroke(0,0,16,0,muted,3);g.restore()}
function showDemo(){
 cancelAnimationFrame(demoFrame);actions.replaceChildren();reading.textContent='';clear();
 $('demo-label').textContent=['Simulation · scan polaire','Simulation · segmentation HSV','Simulation · chaîne de traitement','Simulation · liaison série','Simulation · déplacement','Inspection · assemblage'][current];
 if(current===0){
   angle=360;scan();
   const sweep=addButton('Balayer à 360°',()=>{cancelAnimationFrame(demoFrame);const start=performance.now();sweep.disabled=true;
    function tick(t){angle=matchMedia("(prefers-reduced-motion:reduce)").matches?360:Math.min(360,(t-start)*.12);scan();scan3D(station,angle);if(angle<360){demoFrame=requestAnimationFrame(tick)}else{sweep.disabled=false;reading.textContent='180 directions échantillonnées · pas de 2°'}}demoFrame=requestAnimationFrame(tick)});
   addButton('Déplacer le capteur',()=>{station=(station+1)%3;angle=360;scan();scan3D(station,angle);reading.textContent='Position du capteur '+(station+1)+' / 3'});reading.textContent='Les points clairs sont les impacts des rayons.';
 }else if(current===1){
   const slider=document.createElement('input');slider.type='range';slider.min=0;slider.max=359;slider.value=hue;slider.setAttribute('aria-label','Teinte HSV cible');actions.append(slider);
   function vision(){clear();label('IMAGE',18,25);label('MASQUE HSV',234,25);stroke(212,10,212,165);let count=0;
    [12,90,220,286].forEach((color,i)=>{const x=53+i%2*91,y=66+Math.floor(i/2)*65;dot(x,y,21,'hsl('+color+' 54% 59%)');const yes=Math.min(Math.abs(hue-color),360-Math.abs(hue-color))<=18;if(yes){g.strokeStyle=ink;g.lineWidth=1.5;g.strokeRect(x-25,y-25,50,50)}dot(x+212,y,21,yes?ink:'#20202b');if(yes)count++});
    reading.textContent='Teinte '+hue+'° · tolérance ±18° · '+count+' objet détecté';}
   slider.oninput=()=>{hue=Number(slider.value);vision()};vision();
 }else if(current===2){
   let step=0;const stages=['Acquisition','Python','Décision','Commande'];function pipeline(){clear();stages.forEach((s,i)=>{const x=49+i*112;if(i<3)stroke(x,79,x+112,79);dot(x,79,14,i<=step?ink:line);label(s,x-34,121)});reading.textContent=['Image reçue depuis la caméra. Distances reçues du LiDAR.','Segmentation des pixels dans l’espace HSV.','Centre de la cible transmis au pilotage. Les distances limitent les mouvements possibles.','Consigne de vitesse transmise à la carte de commande.'][step]}
   addButton('Étape suivante',()=>{step=(step+1)%4;pipeline()});pipeline();
 }else if(current===3||current===4){
   const serial=current===3, log=[];
   function issue(name, distance=0, turn=0){
     const previous=[...pose,heading];
     const blocked=distance!==0 && ray(...pose,heading+(distance<0?Math.PI:0))<=Math.abs(distance)+9;
     if(!blocked){
       if(distance){trail.push([...pose]);if(trail.length>300)trail.shift();pose=[pose[0]+distance*Math.cos(heading),pose[1]+distance*Math.sin(heading)]}
       heading+=turn;
     }
     const spin=blocked?0:distance/2.65;
     move3D(...pose,heading,spin+turn*2.7,spin-turn*2.7,previous);
     drive();
     command=blocked?'Obstacle devant le robot':name;
     log.push('TX  '+name+'   ·   RX  '+(blocked?'BLOQUÉ':'ACK'));
     reading.textContent=serial?log.slice(-3).join('\n'):'Mouvement simulé · '+command;
   }
   addButton('↶ Gauche',()=>issue('Gauche',0,-Math.PI/6));
   addButton('Avancer',()=>issue('Avancer',11));
   addButton('Reculer',()=>issue('Reculer',-11));
   addButton('Droite ↷',()=>issue('Droite',0,Math.PI/6));
   addButton('Arrêter',()=>issue('Arrêt'));
   addButton('Replacer',()=>{pose=[175,110];heading=-Math.PI/2;trail=[];issue('Position initiale rétablie.')});
   drive();reading.textContent=serial?'Envoyer une consigne à la carte simulée.':'Piloter le robot entre les obstacles.';
 }else{
   function section(){clear();for(const [i,t] of ['Capteurs','Cartes','Base'].entries()){const y=42+i*(open?46:28);g.fillStyle=[ink,muted,line][i];g.fillRect(58,y,120,8);label(t,210,y+9)}reading.textContent=open?'Plateaux séparés · cartes accessibles.':'Les cartes se trouvent entre les plateaux.'}
   addButton('Séparer les modules',()=>mode(true));addButton('Rassembler',()=>mode(false));section();
 }
}

return (index,expanded)=>{current=index;open=expanded;showDemo()};
}
