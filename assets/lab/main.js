import {parts} from './parts.js';
import {demos} from './demos.js';
import {mountMedia} from './media.js';

const $=id=>document.getElementById(id);
const atlas=document.querySelector('.atlas');
const list=atlas.querySelector('.component-list');
const status=atlas.querySelector('.scene-status');
const technologies=['RPLidar A2 · Mesures polaires','IMX219 · OpenCV · HSV','Raspberry Pi · Python','Arduino Mega 2560 · Liaison série','Commande différentielle · Calibration','Plateaux · Entretoises · Fixations'];
let scene,selected=0,expanded=false;

function assemblyState(value){
  expanded=value;
  $('assembled').setAttribute('aria-pressed',String(!value));
  $('exploded').setAttribute('aria-pressed',String(value));
}
function mode(value){
  assemblyState(value);
  scene?.explode(value);
  if(selected===5||selected===0)showDemo(selected,expanded);
}
const showDemo=demos({mode,
  scan3D:(...args)=>{assemblyState(false);scene?.scan(...args)},
  move3D:(...args)=>{assemblyState(false);scene?.move(...args)}
});
function select(i,focus=true){
  selected=i;
  const p=parts[i];
  $('role').textContent=p.role;
  $('part-title').textContent=p.title;
  $('part-copy').textContent=p.text;
  $('signal').textContent=p.signal;
  $('technology').textContent=technologies[i];
  Array.from(list.children).forEach((button,j)=>button.setAttribute('aria-pressed',String(i===j)));
  if(i===2||i===3)mode(true);
  scene?.select(i,focus);
  showDemo(i,expanded);
}
for(const [i,p] of parts.entries()){
  const button=document.createElement('button');
  button.type='button';button.textContent=p.name;
  button.onclick=()=>select(i);
  list.append(button);
}
select(0,false);
$('assembled').onclick=()=>mode(false);
$('exploded').onclick=()=>mode(true);
$('closer').onclick=()=>scene?.zoom(.82);
$('farther').onclick=()=>scene?.zoom(1.22);
$('homeview').onclick=()=>{assemblyState(false);select(0,false);scene?.homeView()};
const loader=new IntersectionObserver(async entries=>{
  if(!entries.some(entry=>entry.isIntersecting))return;
  loader.disconnect();
  try{
    const {createScene}=await import('./scene.js');
    scene=createScene($('machine'),select);
    scene.explode(expanded);scene.select(selected,false);
    status.hidden=true;
  }catch(error){
    console.warn('Scène WebGL indisponible',error);
    status.textContent='Vue 3D indisponible. Explorez les six composants et leurs simulations ci-dessous.';
    atlas.querySelector('.viewtools').hidden=true;
    atlas.querySelector('.stage-help').hidden=true;
    $('machine').tabIndex=-1;
  }
},{rootMargin:'350px'});
loader.observe(atlas);
mountMedia();
const toggle=document.querySelector('.nav-toggle');
const navigation=$('navigation');
function menu(open){toggle.setAttribute('aria-expanded',String(open));navigation.classList.toggle('open',open)}
toggle.onclick=()=>menu(toggle.getAttribute('aria-expanded')==='false');
navigation.onclick=()=>menu(false);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&navigation.classList.contains('open')){menu(false);toggle.focus()}});
const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){entry.target.classList.remove('pending');entry.target.classList.add('in');reveal.unobserve(entry.target)}
}),{threshold:.04});
for(const el of document.querySelectorAll('.reveal')){el.classList.add('pending');reveal.observe(el)}
