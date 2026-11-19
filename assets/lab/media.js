// Supply a local screenshot (image + alt) or recording (video + optional poster)
// for each project when its original media is available.
const projectMedia = {
  'arc-agi': {},
  'robot-mobile': {},
  mycorpus: {}
};
export function mountMedia(){
  document.querySelectorAll('[data-project-media]').forEach(slot=>{
    const media=projectMedia[slot.dataset.projectMedia];
    if(!media.image&&!media.video)return;
    const el=document.createElement(media.video?'video':'img');
    if(media.video){el.controls=true;el.playsInline=true;el.preload='none';if(media.poster)el.poster=media.poster;}
    else {el.loading='lazy';el.alt=media.alt;}
    el.src=media.video||media.image;
    slot.replaceChildren(el);
  });
}
