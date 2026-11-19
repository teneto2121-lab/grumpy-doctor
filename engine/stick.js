// stick.js: flat-vector "stick people in clothes" kit for story episodes (load after core.js).
// Layout: dark backdrop, a fixed title on top, a 16:9 story panel in the middle, captions under it.
// All panel drawing uses panel coordinates: 0..PW x 0..PH (1080 x 608), floor line near PH-70.
const PW=1080,PH=608,PY=650;               // panel size and top edge on the 1080x1920 canvas
const SOL='#1d1a17',SLW=5;                 // outline colour + width
const C={skin:'#ffffff',wood:'#a8743f',woodD:'#7a5230',stone:'#b9ad98',plaster:'#e9dcc2',sand:'#e3c48f',red:'#d64535',blue:'#3d6fb6',green:'#4f8a4b',
  yellow:'#ffd23f',navy:'#1b2440',night:'#26304f',cream:'#f4ead6',blood:'#9e1b1b',grey:'#8b8f96'};
let ST=0;   // current time (for idle motion)
// ---------- basic shapes (outlined) ----------
function sfill(fill,lw=SLW){if(fill){ctx.fillStyle=fill;ctx.fill()}if(lw){ctx.strokeStyle=SOL;ctx.lineWidth=lw;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke()}}
function srect(x,y,w,h,fill,r=8,lw=SLW){ctx.beginPath();ctx.roundRect(x,y,w,h,r);sfill(fill,lw)}
function scirc(x,y,r,fill,lw=SLW){ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,Math.PI*2);sfill(fill,lw)}
function sell(x,y,rx,ry,fill,lw=SLW,rot=0){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot,0,Math.PI*2);sfill(fill,lw)}
function spoly(pts,fill,lw=SLW){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();sfill(fill,lw)}
function sline(pts,lw=SLW,col=SOL){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke()}
function shade(x,y,w){ctx.save();ctx.globalAlpha=.18;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y,w,w*.16,0,0,7);ctx.fill();ctx.restore()}
// ---------- the person ----------
// o: x,y = point between the feet on the floor; s scale; f facing 1/-1 (0 = front); rot (radians, around hips) for lying;
// lean, hd; aL/aR [shoulder angle from straight down (+ forward), elbow bend]; lL/lR [thigh angle (+ forward), knee bend];
// top/bottom clothes colours; coat (long coat), robe (to the ankles); hat; eyes open|wide|half|closed|x; brow -1 angry..1 worried;
// mouth smile|grin|flat|frown|o|scream|wavy; beard, hair colour; sweat; blood (stains on clothes); hold: 'R'/'L' -> returns hand positions.
function person(o){
  const s=o.s||1,f=o.f??1,F=f||1,R=34,TL=82,U=42,LA=40,TH=48,SH=46;
  const M0=ctx.getTransform().inverse();
  ctx.save();ctx.translate(o.x,o.y);ctx.scale(s,s);
  ctx.translate(0,-(o.sit?0:TH+SH));   // sit: o.y is the hip/seat point
  if(o.rot)ctx.rotate(o.rot);
  if(o.bob)ctx.translate(0,o.bob);
  const lean=o.lean||0,neck=[Math.sin(lean)*F*TL,-Math.cos(lean)*TL],sh=[neck[0]*.92,neck[1]*.92];
  const dv=(a,d)=>[Math.sin(a)*d,Math.cos(a)];
  const limb=(b,a1,a2,l1,l2,d)=>{const v1=dv(a1,d),e=[b[0]+v1[0]*l1,b[1]+v1[1]*l1],v2=dv(a1+a2,d);return[b,e,[e[0]+v2[0]*l2,e[1]+v2[1]*l2]]};
  const side=k=>f!==0?f:(k==='L'?-1:1);
  const aL=o.aL||[.12,.15],aR=o.aR||[.12,.15],lL=o.lL||[.06,0],lR=o.lR||[-.06,0];
  const AL=limb(sh,aL[0],aL[1],U,LA,side('L')),AR=limb(sh,aR[0],aR[1],U,LA,side('R'));
  const LL=limb([0,0],lL[0],-lL[1],TH,SH,side('L')),LR=limb([0,0],lR[0],-lR[1],TH,SH,side('R'));
  const top=o.top||'#5b8fd1',bot=o.bottom||'#4a4038';
  const leg=(P,back)=>{if(o.robe)return;sline(P,o.bottom?17:6,SOL);if(o.bottom)sline(P,10,back?shadeCol(bot):bot);
    const ft=P[2];sell(ft[0]+side(back?'L':'R')*7,ft[1]+3,13,7,o.shoes||SOL,0)};
  const arm=(P,back)=>{sline(P,6,SOL);sline([P[0],P[1]],16,SOL);sline([P[0],P[1]],9,back?shadeCol(top):top);if(o.sleeves==='long'){sline([P[1],P[2]],16,SOL);sline([P[1],P[2]],9,back?shadeCol(top):top)}
    scirc(P[2][0],P[2][1],8,o.gloves||C.skin,3)};
  // back limbs
  if(f!==0){arm(AL,1);leg(LL,1)}else{leg(LL,0);leg(LR,0)}
  // body (clothes)
  const w0=27,w1=o.robe?36:25,yb=o.robe?TH+SH-6:(o.coat?TH*.85:6);
  ctx.save();ctx.rotate(lean*F);
  spoly([[-w0,-TL*.92],[w0,-TL*.92],[w1,yb],[-w1,yb]],top);
  if(o.coat){sline([[0,-TL*.9],[0,yb]],3)}
  if(o.apron)spoly([[-18,-TL*.55],[18,-TL*.55],[22,yb+4],[-22,yb+4]],o.apron,3);
  if(o.blood){ctx.fillStyle=C.blood;[[-8,-30,9],[10,-12,7],[-4,8,11],[14,20,6]].slice(0,Math.ceil(o.blood*4)).forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()})}
  if(!o.robe&&!o.coat){srect(-w1,-2,w1*2,10,bot,3,3)}
  ctx.restore();
  if(f!==0){leg(LR,0);arm(AR,0)}else{arm(AL,0);arm(AR,0)}
  // head
  const hc=[neck[0]+Math.sin(lean+(o.hd||0))*F*(R+2),neck[1]-Math.cos(lean+(o.hd||0))*(R+2)];
  ctx.save();ctx.translate(hc[0],hc[1]);ctx.rotate((lean+(o.hd||0))*F);
  if(o.hair)ctx.save(),ctx.beginPath(),ctx.arc(0,0,R+3,Math.PI*1.05,Math.PI*1.95),ctx.fillStyle=o.hair,ctx.fill(),ctx.restore();
  scirc(0,0,R,o.skin||C.skin);
  if(o.hair){ctx.beginPath();ctx.arc(0,0,R,Math.PI*1.1,Math.PI*1.9);ctx.lineTo(R*.6,-R*.55);ctx.quadraticCurveTo(0,-R*.5,-R*.6,-R*.55);ctx.closePath();sfill(o.hair,3)}
  const fx=f===0?0:F*R*.28,ey=-5,ex=[fx-12,fx+12],lk=o.look||[0,0],eyes=o.eyes||'open';
  ex.forEach((x,i)=>{
    if(eyes==='open'){ctx.fillStyle=SOL;ctx.beginPath();ctx.arc(x+lk[0]*3,ey+lk[1]*3,4.5,0,7);ctx.fill()}
    else if(eyes==='wide'){scirc(x,ey,9,'#fff',3);ctx.fillStyle=SOL;ctx.beginPath();ctx.arc(x+lk[0]*4,ey+lk[1]*4,3.5,0,7);ctx.fill()}
    else if(eyes==='half'){ctx.fillStyle=SOL;ctx.beginPath();ctx.arc(x,ey+1,4.5,0,Math.PI);ctx.fill();sline([[x-7,ey],[x+7,ey]],3)}
    else if(eyes==='closed'){ctx.beginPath();ctx.arc(x,ey-3,6,.3,Math.PI-.3);ctx.strokeStyle=SOL;ctx.lineWidth=3;ctx.stroke()}
    else if(eyes==='x'){sline([[x-5,ey-5],[x+5,ey+5]],3);sline([[x+5,ey-5],[x-5,ey+5]],3)}
    if(o.bags){ctx.save();ctx.globalAlpha=o.bags;ctx.beginPath();ctx.arc(x,ey+8,6,.3,Math.PI-.3);ctx.strokeStyle='#8a6bd1';ctx.lineWidth=2.5;ctx.stroke();ctx.restore()}
    if(o.brow!==undefined){const b=o.brow,sg=i?1:-1;sline([[x-8,ey-14-b*sg*5],[x+8,ey-14+b*sg*5]],3.5)}});
  const m=o.mouth||'flat',mx=fx,my=15;
  if(m==='smile'){ctx.beginPath();ctx.arc(mx,my-7,9,.3,Math.PI-.3);ctx.strokeStyle=SOL;ctx.lineWidth=3.5;ctx.stroke()}
  else if(m==='grin'){ctx.beginPath();ctx.moveTo(mx-12,my-3);ctx.quadraticCurveTo(mx,my+16,mx+12,my-3);ctx.closePath();sfill('#7a2a2a',3)}
  else if(m==='frown'){ctx.beginPath();ctx.arc(mx,my+8,8,Math.PI+.4,-.4);ctx.strokeStyle=SOL;ctx.lineWidth=3.5;ctx.stroke()}
  else if(m==='o')sell(mx,my,5,7,'#7a2a2a',3);
  else if(m==='scream')sell(mx,my+2,9,12,'#7a2a2a',3);
  else if(m==='wavy')sline([[mx-9,my],[mx-4,my-3],[mx,my],[mx+4,my-3],[mx+9,my]],3);
  else sline([[mx-7,my],[mx+7,my]],3.5);
  if(o.beard){ctx.beginPath();ctx.arc(fx*.6,R*.35,R*.55,0,Math.PI);ctx.closePath();sfill(o.beard,3)}
  if(o.mask)srect(fx-20,4,40,24,o.mask,8,3);
  hat(o.hat,R,F);
  if(o.sweat){ctx.fillStyle='#8fd3ff';ctx.beginPath();ctx.moveTo(-F*R*.9,-R*.4);ctx.quadraticCurveTo(-F*R*1.05,-R*.05,-F*R*.88,0);ctx.quadraticCurveTo(-F*R*.72,-R*.05,-F*R*.9,-R*.4);ctx.fill()}
  ctx.restore();
  const M=ctx.getTransform(),wp=p=>{const q=M0.transformPoint(M.transformPoint(new DOMPoint(p[0],p[1])));return[q.x,q.y]};
  const out={hR:wp(AR[2]),hL:wp(AL[2]),head:wp(hc),hip:wp([0,0])};ctx.restore();return out}
function shadeCol(hex){const n=parseInt(hex.slice(1),16),r=(n>>16)*.8|0,g=((n>>8)&255)*.8|0,b=(n&255)*.8|0;return`rgb(${r},${g},${b})`}
function hat(h,R,F){if(!h)return;
  if(h==='cap'){ctx.beginPath();ctx.arc(0,-R*.25,R*1.02,Math.PI,0);ctx.closePath();sfill('#d8e8e0',3)}                      // surgical cap
  else if(h==='top'){srect(-R*.7,-R*2.1,R*1.4,R*1.25,'#222',4,3);srect(-R*1.05,-R*.9,R*2.1,R*.22,'#222',4,3)}
  else if(h==='laurel'){for(let i=0;i<6;i++){const a=Math.PI*(1.1+i*.16);sell(Math.cos(a)*R*.95,Math.sin(a)*R*.95,7,4,'#6a9a3a',2,a+1.5)}}
  else if(h==='hood'){ctx.beginPath();ctx.arc(0,0,R*1.18,Math.PI*.75,Math.PI*2.25);ctx.closePath();sfill('#7b5a3c',3);scirc(0,2,R*.86,C.skin,3)}
  else if(h==='nurse'){spoly([[-R*.8,-R*.75],[R*.8,-R*.75],[R*.55,-R*1.35],[-R*.55,-R*1.35]],'#fff',3);ctx.fillStyle=C.red;ctx.fillRect(-5,-R*1.25,10,R*.35);ctx.fillRect(-R*.17,-R*1.12,R*.34,10)}
  else if(h==='bandana'){ctx.beginPath();ctx.arc(0,-R*.15,R*1.02,Math.PI,0);ctx.closePath();sfill(C.red,3)}
  else if(h==='wig'){[[-R*.9,-R*.3],[R*.9,-R*.3],[-R*.85,R*.2],[R*.85,R*.2]].forEach(([x,y])=>scirc(x,y,R*.32,'#eee',3));ctx.beginPath();ctx.arc(0,-R*.2,R*1.05,Math.PI,0);sfill('#eee',3)}
  else if(h==='fur'){ctx.beginPath();ctx.arc(0,-R*.2,R*1.05,Math.PI*1.02,-.02);ctx.closePath();sfill('#8a6a46',3)}}
// ---------- poses: interpolate between keyed pose objects ----------
// P(s,[[t,{aR:[..],lean:..,eyes:'..'}],...]) -> merged pose (numbers/arrays eased, strings switch at the key)
function pose(s,keys){let a=keys[0],b=keys[0];for(let i=0;i<keys.length;i++){if(s>=keys[i][0]){a=keys[i];b=keys[i+1]||keys[i]}}
  const u=b===a?0:easeInOut(clamp((s-a[0])/Math.min(.45,b[0]-a[0])));const out={};
  for(const k of new Set([...Object.keys(a[1]),...Object.keys(b[1])])){const va=a[1][k],vb=b[1][k]!==undefined?b[1][k]:va,v0=va!==undefined?va:vb;
    if(typeof v0==='number')out[k]=lerp(v0,vb,u);else if(Array.isArray(v0))out[k]=v0.map((x,j)=>lerp(x,vb[j],u));else out[k]=u>.5?vb:v0}return out}
// ---------- props ----------
function phoneP(x,y,a=0,on=1){ctx.save();ctx.translate(x,y);ctx.rotate(a);srect(-11,-20,22,40,'#222',5,3);ctx.fillStyle=on?'#8fd3ff':'#333';ctx.fillRect(-7,-15,14,28);ctx.restore()}
function glow(x,y,r,col='143,211,255',a=.45){const g=ctx.createRadialGradient(x,y,4,x,y,r);g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}
function clockP(x,y,r,tt){scirc(x,y,r,'#fff',4);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;sline([[x+Math.cos(a)*r*.75,y+Math.sin(a)*r*.75],[x+Math.cos(a)*r*.88,y+Math.sin(a)*r*.88]],2.5)}
  sline([[x,y],[x+Math.sin(tt/12)*r*.45,y-Math.cos(tt/12)*r*.45]],4.5);sline([[x,y],[x+Math.sin(tt)*r*.7,y-Math.cos(tt)*r*.7]],3,C.red)}
function windowP(x,y,w,h,night){srect(x-8,y-8,w+16,h+16,'#f1e6cf',4);srect(x,y,w,h,night?'#1a2547':'#a9d8f5',2);if(night){ctx.fillStyle='#f6efc4';ctx.beginPath();ctx.arc(x+w*.7,y+h*.3,16,0,7);ctx.fill();ctx.fillStyle='#1a2547';ctx.beginPath();ctx.arc(x+w*.75,y+h*.26,15,0,7);ctx.fill()}
  else{ctx.fillStyle='#fff';sell(x+w*.3,y+h*.35,26,10,'#fff',0)}sline([[x+w/2,y],[x+w/2,y+h]],4);sline([[x,y+h/2],[x+w,y+h/2]],4)}
function floorP(y,col,line){ctx.fillStyle=col;ctx.fillRect(0,y,PW,PH-y);ctx.strokeStyle=line;ctx.lineWidth=2;for(let i=-8;i<=8;i++){ctx.beginPath();ctx.moveTo(PW/2+i*60,y);ctx.lineTo(PW/2+i*170,PH);ctx.stroke()}
  for(let k=1;k<5;k++){const yy=y+(PH-y)*(k*k)/25;ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(PW,yy);ctx.stroke()}sline([[0,y],[PW,y]],4)}
function wallP(col,stripe){ctx.fillStyle=col;ctx.fillRect(0,0,PW,PH);if(stripe){ctx.fillStyle=stripe;for(let x=0;x<PW;x+=60)ctx.fillRect(x,0,24,PH)}}
function bricks(col,line,y1){ctx.fillStyle=col;ctx.fillRect(0,0,PW,y1);ctx.strokeStyle=line;ctx.lineWidth=2;for(let r=0;r*34<y1;r++){const y=r*34;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(PW,y);ctx.stroke();for(let x=(r%2)*45;x<PW;x+=90){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+34);ctx.stroke()}}}
function bedP(x,y,w,duvet='#5b6fd6',night){srect(x-14,y-150,22,170,C.woodD,6);srect(x+w-8,y-80,20,100,C.woodD,6);srect(x,y-36,w,40,'#f5f1ea',8);srect(x+10,y-62,110,32,'#fff',14,4)
  srect(x,y+4,w,18,C.wood,4);srect(x+6,y+20,14,40,C.woodD,3);srect(x+w-20,y+20,14,40,C.woodD,3)}
function duvetP(x,y,w,col='#5b6fd6'){ctx.beginPath();ctx.moveTo(x,y-40);ctx.quadraticCurveTo(x+w*.5,y-70,x+w,y-40);ctx.lineTo(x+w+6,y+6);ctx.lineTo(x-4,y+6);ctx.closePath();sfill(col,4)}
function lampP(x,y,on){srect(x-40,y-70,80,70,C.woodD,6,4);srect(x-6,y-120,12,50,'#555',3,3);spoly([[x-28,y-120],[x+28,y-120],[x+18,y-155],[x-18,y-155]],'#f2d38a',4);if(on)glow(x,y-130,160,'255,214,140',.5)}
function deskP(x,y,w){srect(x,y,w,16,C.wood,4);srect(x+14,y+14,14,PH-y-80,C.woodD,3);srect(x+w-28,y+14,14,PH-y-80,C.woodD,3)}
function laptopP(x,y,dir=1,on=1){spoly([[x-60*dir,y],[x+40*dir,y],[x+46*dir,y-8],[x-54*dir,y-8]],'#cfd3da',3);spoly([[x-54*dir,y-8],[x-80*dir,y-90],[x-72*dir,y-92],[x-46*dir,y-10]],'#9aa0a8',3);if(on)glow(x-70*dir,y-60,220,'143,211,255',.35*on)}
function chairP(x,y,dir=1){srect(x-40,y-6,80,12,C.wood,4,3);srect(x-dir*40-6,y-110,12,110,C.woodD,4,3);srect(x-34,y+4,10,PH-y-74,C.woodD,3,3);srect(x+24,y+4,10,PH-y-74,C.woodD,3,3)}
function mugP(x,y,col='#e05a3a'){srect(x-14,y-30,28,30,col,5,3);ctx.beginPath();ctx.arc(x+16,y-16,8,-Math.PI/2,Math.PI/2);ctx.strokeStyle=SOL;ctx.lineWidth=3;ctx.stroke()}
function beerP(x,y,k=1){ctx.save();ctx.translate(x,y);ctx.scale(k,k);srect(-26,-70,52,70,'#f2b13a',8,4);[[-14,-72],[4,-76],[18,-70]].forEach(([a,b])=>scirc(a,b,13,'#fff',0));ctx.beginPath();ctx.arc(28,-36,16,-Math.PI/2,Math.PI/2);ctx.strokeStyle=SOL;ctx.lineWidth=5;ctx.stroke();ctx.restore()}
function cloudP(x,y,k=1,t=0){ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.beginPath();[[-40,0,30],[0,-16,36],[36,-2,30],[-14,10,26],[18,12,24]].forEach(([a,b,r])=>{ctx.moveTo(a+r,b);ctx.arc(a,b,r,0,7)});sfill('#4a4f5c',0);
  if(Math.sin(t*13)>.2)sline([[0,24],[-12,52],[6,52],[-8,84]],6,C.yellow);ctx.restore()}
function burstP(x,y,r,n=10,col=C.yellow){for(let i=0;i<n;i++){const a=i/n*Math.PI*2;sline([[x+Math.cos(a)*r,y+Math.sin(a)*r],[x+Math.cos(a)*(r+24),y+Math.sin(a)*(r+24)]],5,col)}}
function zzz(x,y,t){for(let i=0;i<3;i++){const u=((t*.6+i/3)%1);ctx.save();ctx.globalAlpha=1-u;text('Z',x+u*40+i*6,y-u*90,30+i*8,{fill:'#fff',sw:6,shadow:false});ctx.restore()}}
function bubbleP(x,y,w,h,str,k=1,size=30){if(k<=0)return;ctx.save();ctx.translate(x,y);ctx.scale(k,k);srect(-w/2,-h/2,w,h,'#fff',22,4);spoly([[-20,h/2-3],[-44,h/2+30],[4,h/2-3]],'#fff',0);sline([[-20,h/2],[-44,h/2+30],[4,h/2]],4);if(str)text(str,0,4,size,{fill:SOL,sw:0,shadow:false});ctx.restore()}
// ---------- layout ----------
function backdrop(){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1c1b19');g.addColorStop(.5,'#3a372f');g.addColorStop(1,'#1c1b19');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function titleTop(str,sub){text(str,W/2,PY-150,62,{fill:'#fff',sw:0,shadow:true});if(sub)text(sub,W/2,PY-78,62,{fill:'#fff',sw:0,shadow:true})}
// panel(draw, cam) : draw(…) runs in panel coords, clipped; cam = [cx, cy, zoom]
function panel(draw,cam=[PW/2,PH/2,1],shake=0){ctx.save();ctx.translate(0,PY);ctx.beginPath();ctx.rect(0,0,PW,PH);ctx.clip();
  if(shake)ctx.translate(Math.sin(ST*70)*shake,Math.cos(ST*53)*shake);
  ctx.translate(PW/2,PH/2);ctx.scale(cam[2],cam[2]);ctx.translate(-cam[0],-cam[1]);draw();ctx.restore()}
function numCard(str,y,s,s0,col=C.yellow,size=110){if(s<s0)return;const k=pop(s,s0,.25);text(str,W/2,y,size,{fill:col,sw:size*.16,scale:k,rot:-.03})}
function wipe(s,cuts){for(const c of cuts){const d=s-c;if(d>=0&&d<.12){ctx.fillStyle=`rgba(255,255,255,${.35*(1-d/.12)})`;ctx.fillRect(0,PY,PW,PH)}}}
