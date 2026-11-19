export const stations=[[170,84],[335,125],[150,45]];
export const walls=[[25,16,414,16],[414,16,414,160],[414,160,25,160],[25,160,25,16],[260,55,298,55],[298,55,298,105],[298,105,260,105],[260,105,260,55],[75,93,122,93],[122,93,122,126],[122,126,75,126],[75,126,75,93]];
export function ray(x,y,a){
 const dx=Math.cos(a),dy=Math.sin(a);let nearest=1000;
 for(const [u,v,s,t] of walls){const ex=s-u,ey=t-v,det=dx*ey-dy*ex;if(Math.abs(det)<1e-8)continue;
 const distance=((u-x)*ey-(v-y)*ex)/det,along=((u-x)*dy-(v-y)*dx)/det;if(distance>=0&&along>=0&&along<=1)nearest=Math.min(nearest,distance)}
 return nearest;
}
