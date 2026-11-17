// Shared engine: helpers, the doctor character, props, captions, frame renderer.

const W=1080,H=1920,FPS=30;
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
const FONT='"Inter Display", Inter, sans-serif';
const OL='#2b2118';
let WORDS=[],ENV=[],DUR=46.6;

// ---------- helpers ----------
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const prog=(t,s,d)=>clamp((t-s)/d);
const easeOut=x=>1-Math.pow(1-x,3);
const easeInOut=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const easeBack=x=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2)};
const pop=(t,s,d=.4)=>easeBack(prog(t,s,d));
function rng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
// keyframe track: [[t,v],...] with easing
function track(kf,t){if(t<=kf[0][0])return kf[0][1];for(let i=0;i<kf.length-1;i++){const[a,va]=kf[i],[b,vb]=kf[i+1];if(t<b){const u=easeInOut((t-a)/(b-a));return Array.isArray(va)?va.map((x,j)=>lerp(x,vb[j],u)):lerp(va,vb,u)}}return kf[kf.length-1][1]}
function P(fill,lw=7){ctx.fillStyle=fill;ctx.fill();if(lw){ctx.strokeStyle=OL;ctx.lineWidth=lw;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke()}}
function E(x,y,rx,ry,r=0){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),r,0,Math.PI*2)}
function poly(pts){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath()}
function curve(pts){ctx.beginPath();const n=pts.length;for(let i=0;i<n;i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];if(i===0)ctx.moveTo(p1[0],p1[1]);ctx.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,p2[0],p2[1])}ctx.closePath()}
function mixHex(a,b,u){const pa=a.match(/\w\w/g).map(h=>parseInt(h,16)),pb=b.match(/\w\w/g).map(h=>parseInt(h,16));return'rgb('+pa.map((x,i)=>Math.round(lerp(x,pb[i],u))).join(',')+')'}
function text(str,x,y,size,{fill='#fff',stroke=OL,sw=0,align='center',scale=1,rot=0,alpha=1,shadow=true}={}){
  if(alpha<=0||scale<=0.001)return;ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(rot);ctx.scale(scale,scale);
  ctx.font=`900 ${size}px ${FONT}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.lineJoin='round';
  if(shadow){ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillText(str,0,size*.07)}
  if(sw){ctx.strokeStyle=stroke;ctx.lineWidth=sw;ctx.strokeText(str,0,0)}
  ctx.fillStyle=fill;ctx.fillText(str,0,0);ctx.restore()}
function label(str,x,y,t,s,{bg='#ffd60a',fg='#111',size=60,rot=-.03,alpha=1}={}){
  const k=pop(t,s);if(k<=0.001||alpha<=0)return;ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(rot);ctx.scale(k,k);
  ctx.font=`900 ${size}px ${FONT}`;const w=ctx.measureText(str).width+size*.9;
  ctx.beginPath();ctx.roundRect(-w/2,-size*.75,w,size*1.5,size*.35);P(bg,6);
  text(str,0,size*.04,size,{fill:fg,shadow:false});ctx.restore()}

// ---------- DOCTOR (design A, parametric) ----------
const SKIN='#f2c9a5',HAIR='#f4f4f4',COAT='#f7f9fb';
function dEye(x,y,r,mood,side,blink,look=[0,0]){
  const wide=clamp((mood-.45)/.35);const ry=r*(.95+.25*wide);
  E(x,y,r,ry);P('#fff',5);
  const pr=r*lerp(.42,.3,wide),px=x+side*-r*.12*(1-wide)*(1-Math.abs(look[0]))+look[0]*r*.38,py=y+r*.1*(1-wide)+look[1]*r*.32;
  E(px,py,pr,pr);P(OL,0);E(px-pr*.35,py-pr*.35,pr*.3,pr*.3);P('#fff',0);
  const lid=Math.max(blink,lerp(.47,0,wide));
  if(lid>0.01){ctx.save();E(x,y,r,ry);ctx.clip();ctx.fillStyle=SKIN;ctx.fillRect(x-r-5,y-ry-5,2*r+10,2*ry*lid+5);ctx.restore();
    ctx.strokeStyle=OL;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(x-r,y-ry+2*ry*lid);ctx.lineTo(x+r,y-ry+2*ry*lid);ctx.stroke();E(x,y,r,ry);ctx.lineWidth=5;ctx.stroke()}
}
function dBrow(x,y,w,h,mood,side,lift){
  ctx.save();ctx.translate(x,y-mood*28-lift);ctx.rotate(side*(.24+.2*mood));
  ctx.beginPath();const n=7;ctx.moveTo(-w/2,h*.3);
  for(let i=0;i<=n;i++){const tx=-w/2+w*i/n;ctx.quadraticCurveTo(tx-w/n*.5,-h*(.9+((i*37)%5)/10),tx,-h*.2)}
  ctx.lineTo(w/2,h*.4);ctx.quadraticCurveTo(0,h*.8,-w/2,h*.3);P(HAIR,5);ctx.restore()}
function dMouth(x,y,w,open,mood,shape=null){
  if(shape==='M')open=0;
  if(open<.06){ctx.strokeStyle=OL;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();const f=lerp(.16,.24,mood)*(shape==='M'?.4:1);ctx.moveTo(x-w*.38,y+w*.12);ctx.quadraticCurveTo(x,y-w*f,x+w*.38,y+w*.14);ctx.stroke();return}
  let rx=w*lerp(.3,.5,clamp(mood*.6+open*.5)),ry=w*.45*open+4;
  if(shape==='O'){rx=w*.24+w*.06*open;ry=Math.max(ry,w*.28)}
  else if(shape==='E'){rx=w*.5;ry=w*.2*open+5}
  else if(shape==='F'){rx=w*.38;ry=w*.13+3}
  else if(shape==='A'){rx=w*.42+w*.08*mood;ry=Math.max(ry,w*.3)}
  else if(shape==='C'){rx=w*.36;ry=w*.32*open+4}
  const cy=y+ry*.4;
  E(x,cy,rx,ry);P('#5a1e1e',6);
  ctx.save();E(x,cy,rx,ry);ctx.clip();ctx.fillStyle='#fff';ctx.fillRect(x-rx,cy-ry,2*rx,Math.min(ry*.45,w*.13));
  if(shape==='F'||shape==='E'){ctx.fillRect(x-rx,cy+ry*.55,2*rx,ry)}
  else{E(x,cy+ry*.75,rx*.6,ry*.45);ctx.fillStyle='#e05a5a';ctx.fill()}
  ctx.restore();
  E(x,cy,rx,ry);ctx.strokeStyle=OL;ctx.lineWidth=6;ctx.stroke();
}
// ---- hands: kinds 'open' | 'spread' | 'point' | 'fist'. Local frame: +x runs from wrist to fingertips.
function capsule(x1,y1,x2,y2,w){ctx.lineCap='round';ctx.strokeStyle=OL;ctx.lineWidth=w+12;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.strokeStyle=SKIN;ctx.lineWidth=w;ctx.stroke()}
function hand(x,y,ang,kind,side){
  ctx.save();ctx.translate(x,y);ctx.rotate(ang);ctx.scale(1,side);
  if(kind==='open'||kind==='spread'){
    const fan=kind==='spread'?.16:.05,len=kind==='spread'?34:28;
    [-19,-6,7,19].forEach((fy,i)=>{const a=(i-1.5)*fan;capsule(34,fy,34+Math.cos(a)*len,fy+Math.sin(a)*len*(kind==='spread'?2.2:1),14)});
    capsule(14,-20,14+Math.cos(-1.1)*30,-20+Math.sin(-1.1)*30,15);
    ctx.beginPath();ctx.roundRect(-6,-27,48,54,20);P(SKIN,6);
    ctx.fillStyle=SKIN;ctx.fillRect(28,-22,12,44);
  } else {
    if(kind==='point')capsule(34,-15,82,-15,15);
    ctx.beginPath();ctx.roundRect(-6,-26,46,52,20);P(SKIN,6);
    (kind==='point'?[-1,10,21]:[-15,-3,9,20]).forEach(fy=>{E(42,fy,9,7);P(SKIN,5)});
    capsule(10,-18,30,-6,13);
  }
  ctx.restore()}
// two-bone arm: shoulder (sx,sy) -> hand (ex,ey); elbow bends outward. side: -1 left, 1 right
function arm(sx,sy,ex,ey,kind,side){
  const a=150,b=150,dx=ex-sx,dy=ey-sy,d=Math.hypot(dx,dy),dd=Math.min(d,a+b-2);
  const th=Math.atan2(dy,dx),al=Math.acos(clamp((a*a+dd*dd-b*b)/(2*a*dd),-1,1));
  const el=[th+al,th-al].map(g=>[sx+a*Math.cos(g),sy+a*Math.sin(g)]).sort((p,q)=>(side*q[0]+.5*q[1])-(side*p[0]+.5*p[1]))[0];
  const fa=Math.atan2(ey-el[1],ex-el[0]),ux=Math.cos(fa),uy=Math.sin(fa);
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.strokeStyle=OL;ctx.lineWidth=72;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(el[0],el[1]);ctx.lineTo(ex,ey);ctx.stroke();
  ctx.strokeStyle=COAT;ctx.lineWidth=58;ctx.stroke();
  // sleeve fold at the elbow
  ctx.strokeStyle='rgba(43,33,24,.35)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(el[0],el[1],16,fa+1.2,fa+2.4);ctx.stroke();
  // cuff
  ctx.lineCap='butt';ctx.strokeStyle=OL;ctx.lineWidth=70;ctx.beginPath();ctx.moveTo(ex-ux*20,ey-uy*20);ctx.lineTo(ex+ux*2,ey+uy*2);ctx.stroke();
  ctx.strokeStyle='#dfe7f0';ctx.lineWidth=58;ctx.stroke();ctx.lineCap='round';
  hand(ex+ux*6,ey+uy*6,fa,kind,side);
}
function steam(x,y,s,t){ctx.strokeStyle='#ffffff';ctx.lineWidth=10;ctx.lineCap='round';[[-1,0],[1,.5]].forEach(([d,o])=>{ctx.beginPath();for(let i=0;i<=20;i++){const u=i/20;const xx=x+d*s*(.6+u*.5)+Math.sin(u*9+o*5+t*12)*s*.12,yy=y-u*s*1.1;i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.stroke()})}
function vein(x,y,s,k){ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.strokeStyle='#c0392b';ctx.lineWidth=7;ctx.lineCap='round';[0,1.6].forEach(r=>{ctx.save();ctx.rotate(r);ctx.beginPath();ctx.moveTo(-s,0);ctx.quadraticCurveTo(-s*.3,-s*.5,0,0);ctx.quadraticCurveTo(s*.3,-s*.5,s,0);ctx.stroke();ctx.restore()});ctx.restore()}

// pose: {mood,open,blink,lift,L:[x,y],R:[x,y],kL,kR (hand kinds),tilt,bob}
function doctor(p,t){
  const {mood,open,blink,lift,L,R,tilt,bob}=p;
  ctx.save();ctx.translate(0,bob);
  // body
  const w=420,h=330;
  curve([[-w*.5,h*1.4],[-w*.52,h*.3],[-w*.38,0],[0,-h*.05],[w*.38,0],[w*.52,h*.3],[w*.5,h*1.4]]);P(COAT);
  poly([[-w*.18,-h*.02],[0,h*.55],[w*.18,-h*.02]]);P('#dfe7f0',6);
  poly([[0,h*.07],[-w*.12,0],[-w*.12,h*.14]]);P('#c0392b',5);poly([[0,h*.07],[w*.12,0],[w*.12,h*.14]]);P('#c0392b',5);E(0,h*.07,w*.03,w*.03);P('#a12b20',4);
  poly([[-w*.18,-h*.02],[-w*.3,h*.2],[-w*.17,h*.25],[-w*.06,h*.6]]);P(COAT,6);poly([[w*.18,-h*.02],[w*.3,h*.2],[w*.17,h*.25],[w*.06,h*.6]]);P(COAT,6);
  ctx.fillStyle='#1d4e89';ctx.fillRect(w*.22,h*.42,8,40);ctx.fillStyle='#c0392b';ctx.fillRect(w*.27,h*.4,8,42);
  poly([[w*.18,h*.48],[w*.38,h*.48],[w*.38,h*.66],[w*.18,h*.66]]);P(COAT,5);
  ctx.strokeStyle='#3a3f47';ctx.lineWidth=11;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-w*.17,0);ctx.bezierCurveTo(-w*.3,h*.4,-w*.05,h*.75,w*.02,h*.7);ctx.stroke();ctx.beginPath();ctx.moveTo(w*.17,0);ctx.bezierCurveTo(w*.12,h*.2,w*.06,h*.5,w*.02,h*.7);ctx.stroke();
  E(w*.02,h*.76,24,24);P('#b8c0cc',6);E(w*.02,h*.76,12,12);P('#8a94a3',0);
  arm(-200,60,L[0],L[1],p.kL||'open',-1);if(!p.rFront)arm(200,60,R[0],R[1],p.kR||'open',1);
  // head
  ctx.save();ctx.translate(0,-210);ctx.rotate(tilt);
  const face=mixHex('f2c9a5','f0907a',clamp((mood-.55)/.4));
  E(-150,10,34,46);P(SKIN);E(150,10,34,46);P(SKIN);
  curve([[0,-170],[110,-140],[150,-40],[140,60],[80,130],[0,150],[-80,130],[-140,60],[-150,-40],[-110,-140]]);P(face);
  [-1,1].forEach(d=>{ctx.save();ctx.scale(d,1);ctx.rotate(Math.sin(t*3+d)*.02*(1+mood*3));curve([[130,-90],[200,-110],[190,-60],[230,-40],[185,0],[215,40],[160,40],[140,-20]]);P(HAIR,6);ctx.restore()});
  E(-50,-120,40,18,-.3);ctx.fillStyle='rgba(255,255,255,.45)';ctx.fill();
  if(mood>.75){const k=clamp((mood-.75)/.15);vein(70,-110,24,k);ctx.globalAlpha=k;steam(0,-190,70,t);ctx.globalAlpha=1}
  dEye(-52,-10,30,mood,-1,blink,p.look);dEye(52,-10,30,mood,1,blink,p.look);
  dBrow(-58,-62,105,34,mood,1,lift);dBrow(58,-62,105,34,mood,-1,lift);
  ctx.strokeStyle=OL;ctx.lineWidth=5;E(-34,44,24,18);ctx.stroke();E(34,44,24,18);ctx.stroke();ctx.beginPath();ctx.moveTo(-10,42);ctx.lineTo(10,42);ctx.stroke();
  curve([[0,0],[28,30],[34,60],[0,74],[-34,60],[-28,30]]);P('#e8a98a',6);
  dMouth(0,112+open*6,70,open,mood,p.shape);
  ctx.save();ctx.translate(0,-open*6);curve([[0,78],[50,72],[90,96],[60,108],[0,96],[-60,108],[-90,96],[-50,72]]);P(HAIR,6);ctx.restore();
  ctx.restore();
  if(p.rFront)arm(200,60,R[0],R[1],p.kR||'open',1);
  ctx.restore();
}

const HANDS={rest:['open','open'],point:['open','point'],up:['spread','point'],shrug:['spread','spread'],chin:['open','fist'],facepalm:['open','open'],pinch:['open','fist'],cross:['fist','fist'],hips:['fist','fist'],lean:['fist','fist']};
const FRONT={facepalm:1,pinch:1};
const LOOK={point:[.35,-.85],up:[.2,-.7],lean:[0,0],facepalm:[0,0]};
const POSE={rest:[[-235,300],[235,300]],point:[[-235,300],[300,-150]],up:[[-330,-150],[300,-110]],shrug:[[-290,40],[290,40]],chin:[[-235,300],[40,150]],facepalm:[[-235,300],[30,-235]],pinch:[[-235,300],[10,-205]],cross:[[95,165],[-95,140]],hips:[[-170,215],[170,215]],lean:[[-170,215],[170,215]]};
function poseAt(t){let i=0;for(let k=0;k<POSES.length;k++)if(t>=POSES[k][0])i=k;const cur=POSE[POSES[i][1]];const prev=i>0?POSE[POSES[i-1][1]]:cur;const u=easeOut(prog(t,POSES[i][0],.28));
  return {L:[lerp(prev[0][0],cur[0][0],u),lerp(prev[0][1],cur[0][1],u)],R:[lerp(prev[1][0],cur[1][0],u),lerp(prev[1][1],cur[1][1],u)],kL:HANDS[POSES[i][1]][0],kR:HANDS[POSES[i][1]][1],name:POSES[i][1],rFront:!!FRONT[POSES[i][1]]&&u>.5,lean:(POSES[i][1]==='lean'?u:0)+(i>0&&POSES[i-1][1]==='lean'?1-u:0)}}
// visemes: window VIS = [[start,end,shape],...]
let VIS=[];
function visAt(t){let lo=0,hi=VIS.length-1;while(lo<=hi){const m=(lo+hi)>>1;if(VIS[m][1]<t)lo=m+1;else if(VIS[m][0]>t)hi=m-1;else return VIS[m][2]}return null}
// punch-in close-ups: window.PUNCH=[[start,end],...]  (fast cut in, quick cut out)
function punchAt(t){let v=0;(window.PUNCH||[]).forEach(([a,b])=>{v=Math.max(v,Math.min(clamp((t-a)/.08),clamp((b-t)/.12)))});return v}
// impact shakes: window.SHAKES=[seconds,...] -> the card content shakes briefly
function shakeAt(t){let a=0;(window.SHAKES||[]).forEach(s0=>{const d=t-s0;if(d>=0&&d<.4)a=Math.max(a,Math.exp(-d*9))});return a?[Math.sin(t*95)*16*a,Math.cos(t*80)*12*a]:null}
// squash & stretch entrance: returns [sx,sy] for an object that drops in at time s
function squash(t,s){const d=t-s;if(d<0)return[0,0];if(d<.12)return[.85,1.2];const u=d-.12;const w=Math.exp(-u*6)*Math.cos(u*22);return[1+.22*w,1-.22*w]}
// dust puff at an impact point
function dust(x,y,t,s,k=1){const d=t-s;if(d<0||d>.7)return;const r=rng(Math.floor(s*100));ctx.save();ctx.globalAlpha=(1-d/.7)*k;for(let i=0;i<9;i++){const a=Math.PI+r()*Math.PI,v=80+r()*160;E(x+Math.cos(a)*v*d*1.6,y+Math.sin(a)*v*d*.4-d*40,18+r()*16+d*30,14+r()*10+d*20);ctx.fillStyle='#e9e4d6';ctx.fill()}ctx.restore()}
// draw a polyline progressively: pts, fraction 0..1
function drawOn(pts,f){const L=pts.length-1,upto=f*L;ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<=Math.ceil(upto);i++){const k=Math.min(1,upto-(i-1));ctx.lineTo(lerp(pts[i-1][0],pts[i][0],k),lerp(pts[i-1][1],pts[i][1],k))}ctx.stroke()}
// jolts: window.JOLTS=[seconds,...] -> the doctor jumps and his eyes go wide
function joltAt(t){let v=0;(window.JOLTS||[]).forEach(a=>{const d=t-a;if(d>=0&&d<.6)v=Math.max(v,Math.exp(-d*7)*(d<.05?d/.05:1))});return v}
function envAt(t){const i=t*FPS;const a=ENV[Math.floor(i)]||0,b=ENV[Math.floor(i)+1]||0;return lerp(a,b,i%1)}
function blinkAt(t){const per=[];for(let b=2.1;b<600;b+=2.6+((b*7.3)%2.2))per.push(b);for(const b of per){const d=t-b;if(d>0&&d<.16)return Math.sin(d/.16*Math.PI)}return 0}

// ---------- SCENE / BACKGROUND ----------
function wall(t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#bfe3e8');g.addColorStop(1,'#6fb3c0');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.18)';for(let y=60;y<H;y+=160)for(let x=(y/160%2)*80+40;x<W;x+=160){ctx.fillRect(x-14,y-4,28,8);ctx.fillRect(x-4,y-14,8,28)}
}
function card(alpha,{dark=false,tint=null}={}){
  if(alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.roundRect(52,132,W-104,860,46);ctx.fill();
  ctx.beginPath();ctx.roundRect(44,118,W-88,860,46);
  let fill=dark?'#14161a':'#fffdf7';
  if(tint&&!dark){const g=ctx.createLinearGradient(0,118,0,978);g.addColorStop(0,'#fffdf7');g.addColorStop(1,tint);fill=g}
  P(fill,8);
  if(!dark){ctx.save();ctx.beginPath();ctx.roundRect(44,118,W-88,860,46);ctx.clip();ctx.fillStyle='rgba(43,33,24,.045)';for(let y=150;y<978;y+=44)for(let x=70+((y/44)%2)*22;x<W-44;x+=44){ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill()}ctx.restore()}
  ctx.restore();
}
// joint diagram centered at (cx,cy). gap = bones separation, bub = bubble radius
function bone(x,y,len,dir,col='#f3ead7'){ // dir=-1 left bone (knob at right end)
  ctx.save();ctx.translate(x,y);ctx.scale(dir,1);
  ctx.beginPath();ctx.moveTo(0,-62);ctx.bezierCurveTo(-30,-75,-40,-52,-60,-48);ctx.lineTo(-len,-44);ctx.bezierCurveTo(-len-30,-48,-len-30,48,-len,44);ctx.lineTo(-60,48);ctx.bezierCurveTo(-40,52,-30,75,0,62);ctx.bezierCurveTo(26,50,26,-50,0,-62);P(col,7);
  ctx.restore()}
function joint(cx,cy,gap,bub,t,{gray=false,sparkle=0,fluidA=1}={}){
  const cw=150+gap*.9,ch=120-gap*.15;
  E(cx,cy,cw,ch);ctx.fillStyle=`rgba(120,190,255,${.55*fluidA})`;ctx.fill();ctx.strokeStyle=gray?'#ccc':'#7b5ea7';ctx.lineWidth=9;ctx.setLineDash([22,12]);ctx.stroke();ctx.setLineDash([]);
  bone(cx-22-gap/2,cy,330,1,gray?'#ddd':'#f3ead7');bone(cx+22+gap/2,cy,330,-1,gray?'#ddd':'#f3ead7');
  if(sparkle>0){const r=rng(5);for(let i=0;i<7;i++){const a=r()*6.28,d=60+r()*70,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d*.7,s=(10+r()*14)*sparkle*(.6+.4*Math.sin(t*8+i));ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*.3,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*.3,y);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(x-s,y);ctx.lineTo(x,y+s*.3);ctx.lineTo(x+s,y);ctx.lineTo(x,y-s*.3);ctx.fill()}}
  if(bub>0){E(cx,cy,bub,bub);P(gray?'rgba(255,255,255,.95)':'rgba(255,255,255,.9)',6);E(cx-bub*.35,cy-bub*.35,bub*.25,bub*.18,-.6);ctx.fillStyle='#fff';ctx.fill()}
}
function gauge(x,y,val,t,s){ // val 1=high pressure, 0=low
  const k=pop(t,s);if(k<=0.001)return;ctx.save();ctx.translate(x,y);ctx.scale(k,k);
  E(0,0,95,95);P('#fff',7);
  ctx.lineWidth=16;[['#7ae582',Math.PI*.75,Math.PI*1.25],['#ffd60a',Math.PI*1.25,Math.PI*1.75],['#ff595e',Math.PI*1.75,Math.PI*2.25]].forEach(([c,a,b])=>{ctx.strokeStyle=c;ctx.beginPath();ctx.arc(0,0,72,a,b);ctx.stroke()});
  const ang=Math.PI*.75+val*Math.PI*1.5;ctx.strokeStyle=OL;ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(ang)*60,Math.sin(ang)*60);ctx.stroke();
  E(0,0,12,12);P(OL,0);text('PRESSURE',0,128,34,{fill:OL,shadow:false});ctx.restore()}
function cartoonHand(x,y,s,flip,col='#f2c9a5'){
  ctx.save();ctx.translate(x,y);ctx.scale(flip*s,s);
  [[-60,-150,-.12],[-20,-175,-.03],[20,-170,.04],[58,-145,.12]].forEach(([fx,fy,r])=>{ctx.save();ctx.translate(fx,0);ctx.rotate(r);ctx.beginPath();ctx.roundRect(-19,fy+10,38,-fy,19);P(col,6);ctx.restore()});
  ctx.save();ctx.translate(-80,-10);ctx.rotate(-.9);ctx.beginPath();ctx.roundRect(-20,-95,40,100,20);P(col,6);ctx.restore();
  ctx.beginPath();ctx.roundRect(-85,-50,165,150,50);P(col,6);
  ctx.fillStyle=col;ctx.fillRect(-79,-52,153,20);
  ctx.restore()}
function trophy(x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.beginPath();ctx.arc(-80,-60,40,Math.PI*.5,Math.PI*1.5);ctx.strokeStyle=OL;ctx.lineWidth=22;ctx.stroke();ctx.strokeStyle='#ffc300';ctx.lineWidth=12;ctx.stroke();
  ctx.beginPath();ctx.arc(80,-60,40,-Math.PI*.5,Math.PI*.5);ctx.strokeStyle=OL;ctx.lineWidth=22;ctx.stroke();ctx.strokeStyle='#ffc300';ctx.lineWidth=12;ctx.stroke();
  ctx.beginPath();ctx.moveTo(-85,-120);ctx.lineTo(85,-120);ctx.bezierCurveTo(85,0,40,20,15,30);ctx.lineTo(15,70);ctx.lineTo(-15,70);ctx.lineTo(-15,30);ctx.bezierCurveTo(-40,20,-85,0,-85,-120);P('#ffc300',7);
  ctx.beginPath();ctx.roundRect(-60,70,120,40,8);P('#8d5524',6);
  E(-35,-80,14,30,-.2);ctx.fillStyle='rgba(255,255,255,.5)';ctx.fill();ctx.restore()}
function burst(x,y,r,col){ctx.beginPath();for(let i=0;i<24;i++){const a=i/24*Math.PI*2,rr=i%2?r*.62:r;i?ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):ctx.moveTo(x+rr,y)}ctx.closePath();P(col,8)}
function check(x,y,s,k){if(k<=0)return;ctx.save();ctx.translate(x,y);ctx.scale(k*s,k*s);E(0,0,50,50);P('#2a9d8f',7);ctx.strokeStyle='#fff';ctx.lineWidth=14;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(-22,2);ctx.lineTo(-6,18);ctx.lineTo(24,-16);ctx.stroke();ctx.restore()}

// ---------- CAPTIONS ----------
let CHUNKS=[];
function buildChunks(){CHUNKS=[];let cur=[];WORDS.forEach(w=>{cur.push(w);if(/[.,?!]$/.test(w.w)||cur.length>=3){CHUNKS.push(cur);cur=[]}});if(cur.length)CHUNKS.push(cur);
  CHUNKS.forEach((c,i)=>{c.s=c[0].s;c.e=i<CHUNKS.length-1?Math.min(CHUNKS[i+1][0].s,c[c.length-1].e+.6):c[c.length-1].e+.9})}
function captions(t,y){
  const c=CHUNKS.find(c=>t>=c.s&&t<c.e);if(!c)return;const size=80;ctx.font=`900 ${size}px ${FONT}`;
  const parts=c.map(w=>w.w.replace(/[.,?!]/g,'').toUpperCase());const sp=36,ws=parts.map(p=>ctx.measureText(p).width),tot=ws.reduce((a,b)=>a+b,0)+sp*(parts.length-1);
  const k=pop(t,c.s,.2)*Math.min(1,900/tot);let x=W/2-tot/2;ctx.save();ctx.translate(W/2,y);ctx.scale(k,k);ctx.translate(-W/2,-y);
  parts.forEach((p,i)=>{const w=c[i];const on=t>=w.s&&t<(c[i+1]?c[i+1].s:c.e);const kw=(window.KEYWORDS||[]).includes(p.toLowerCase().replace(/[^a-z0-9%]/g,''));
    if(kw){ctx.save();ctx.translate(x+ws[i]/2,y);ctx.scale(on?1.1:1,on?1.1:1);ctx.rotate(-.03);ctx.beginPath();ctx.roundRect(-ws[i]/2-16,-size*.62,ws[i]+32,size*1.24,16);P('#ffd60a',7);ctx.restore();text(p,x+ws[i]/2,y,size,{fill:OL,sw:0,scale:on?1.1:1,rot:-.03,shadow:false})}
    else text(p,x+ws[i]/2,y,size,{fill:on?'#ffd60a':'#fff',sw:20,scale:on?1.1:1});x+=ws[i]+sp});ctx.restore()}

// ---------- FRAME ----------
// ---------- card with scenes ----------
// window.SCENES: start times of each card scene (after the intro); window.TINTS: card tint per scene.
// Between scenes the old one (frozen at its last moment) slides out left as the new one slides in.
function sceneIndex(t){const S=window.SCENES||[];let i=-1;for(let k=0;k<S.length;k++)if(t>=S[k])i=k;return i}
function drawScene(t,start){
  const S=window.SCENES;if(!S){content(t);return}
  const z=1+.07*clamp((t-start)/6);            // push-in
  const dir=(Math.round(start*7)%2)?1:-1,pan=dir*Math.min(30,(t-start)*7); // slow sideways drift, alternating per scene
  ctx.save();ctx.translate(W/2+pan,548);ctx.scale(z,z);ctx.translate(-W/2,-548);
  // window.CAM=[[t,x,y,zoom],...]: camera inside the card (looks at x,y with zoom), eased between keys
  if(window.CAM){const c=track(window.CAM.map(k=>[k[0],[k[1],k[2],k[3]]]),t);ctx.translate(W/2,548);ctx.scale(c[2],c[2]);ctx.translate(-c[0],-c[1])}
  ctx.shadowColor='rgba(43,33,24,.16)';ctx.shadowOffsetY=12;ctx.shadowBlur=0;  // flat drop shadow under props
  content(t);ctx.restore();
  // window.overlay(t): labels drawn on top of the card, unaffected by the camera
  if(window.overlay){ctx.save();ctx.shadowColor='rgba(43,33,24,.16)';ctx.shadowOffsetY=12;overlay(t);ctx.restore()}
}
// window.FOLLOW_AT (default: halfway): "FOLLOW FOR MORE ANGRY MEDICINE" slides in for 3.5s. window.FOLLOW=false disables.
function followBanner(t){if(window.FOLLOW===false)return;const a=window.FOLLOW_AT||DUR*.5,d=t-a;if(d<0||d>3.5)return;
  const x=lerp(-500,W/2,easeOut(clamp(d/.4)))+lerp(0,W,easeIn3(clamp((d-3.1)/.4)));ctx.save();ctx.shadowColor='rgba(0,0,0,0)';
  ctx.font=`900 34px ${FONT}`;const w=ctx.measureText('FOLLOW FOR MORE ANGRY MEDICINE').width+70;ctx.beginPath();ctx.roundRect(x-w/2,138,w,58,29);P('#e63946',6);
  text('FOLLOW FOR MORE ANGRY MEDICINE',x,169,34,{fill:'#fff',shadow:false});ctx.restore()}
function easeIn3(x){return x*x*x}
function drawCard(t,INTRO,alpha){
  const S=window.SCENES,T=window.TINTS||[];
  if(!S){card(alpha);ctx.save();content(t);ctx.restore();return}
  const i=sceneIndex(t),start=i>=0?S[i]:INTRO,lt=t-start,TR=.38;
  const tint=T[Math.max(0,i)]||null;
  card(alpha,{tint});
  ctx.save();ctx.beginPath();ctx.roundRect(48,122,W-96,852,42);ctx.clip();
  const sh=shakeAt(t);if(sh)ctx.translate(sh[0],sh[1]);
  if(i>0&&lt<TR){const u=easeInOut(lt/TR),prevStart=S[i-1];
    ctx.save();ctx.translate(-u*W,0);ctx.globalAlpha=1-u*.5;drawScene(S[i]-1e-3,prevStart);ctx.restore();
    ctx.save();ctx.translate((1-u)*W*.9,0);drawScene(t,start);ctx.restore();}
  else drawScene(t,start);
  // window.board(t): a fixed panel inside the card (e.g. a scoreboard) that doesn't slide or drift
  if(window.board){ctx.save();ctx.shadowColor='rgba(43,33,24,.16)';ctx.shadowOffsetY=10;window.board(t);ctx.restore()}
  followBanner(t);
  ctx.restore();
}
// ---------- pauses: window.PAUSES=[[storyTime,seconds],...] (set by render.js from <episode>/pauses.json) ----------
// The audio has silence inserted at those points; the story (scene) clock holds still while video time runs on.
function toScript(t){let off=0;for(const [p,d] of (window.PAUSES||[])){if(t<p+off)return t-off;if(t<p+off+d)return p;off+=d}return t-off}
function toVideo(s){let off=0;for(const [p,d] of (window.PAUSES||[])){if(s<p)break;off+=d}return s+off}
const TSTEP=.28;
function render(t){
  if(window.TEASER&&!window.__tz&&t<window.TEASER.length*TSTEP){const k=Math.floor(t/TSTEP);
    // the flashed moment is shown smaller and lower, so the hook text above stays clean
    window.__tz=1;ctx.save();wall(t);const hl=(window.HOOK||[]).length;ctx.translate(W/2,H/2+(hl>2?290:190));ctx.scale(hl>2?.72:.8,hl>2?.72:.8);ctx.rotate((k%2?.02:-.02));ctx.translate(-W/2,-H/2);render(toVideo(window.TEASER[k]));ctx.restore();window.__tz=0;
    ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(0,0,W,H);
    const f=(t%TSTEP)/TSTEP;if(f<.18){ctx.fillStyle=`rgba(255,255,255,${.5*(1-f/.18)})`;ctx.fillRect(0,0,W,H)}
    hookText(t,99);captions(t,1560);
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,0,W,10);ctx.fillStyle='#ffd60a';ctx.fillRect(0,0,W*clamp(t/DUR),10);return}
  return renderMain(t)}
// ---------- cold open: window.COLD_OPEN={end:seconds, draw(t), text:[['LINE',color,size],...], bg:'#color'} ----------
// The first seconds are a full-screen dramatic shot with the bold claim (no doctor), then a flash cut into the episode.
function coldOpenFrame(s,t){const C=window.COLD_OPEN;ctx.clearRect(0,0,W,H);ctx.fillStyle=C.bg||'#14161a';ctx.fillRect(0,0,W,H);
  const z=1+.12*easeOut(clamp(s/C.end))+.015*Math.sin(s*23)*Math.max(0,1-s*2);
  ctx.save();ctx.translate(W/2,H*.56);ctx.scale(z,z);ctx.translate(-W/2,-H*.56);C.draw(s);ctx.restore();
  // vignette for contrast behind the claim
  const g=ctx.createLinearGradient(0,0,0,H*.5);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H*.5);
  let y=230;(C.text||[]).forEach(([str,col,size0,at],i)=>{ctx.font=`900 ${size0}px ${FONT}`;const size=size0*Math.min(1,980/ctx.measureText(str).width);y+=size*.6;
    if(at!==undefined&&s<at){y+=size*.55;return}const k=at!==undefined?pop(s,at,.3):1;text(str,W/2,y,size,{fill:col,sw:size*.2,scale:k*(1+.03*Math.sin(s*9+i)),rot:i%2?.03:-.03});y+=size*.55});
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,0,W,10);ctx.fillStyle='#ffd60a';ctx.fillRect(0,0,W*clamp(t/DUR),10)}
function renderMain(t){
  const s=toScript(t);window.__rt=t;
  if(window.COLD_OPEN&&s<window.COLD_OPEN.end&&!window.__tz){coldOpenFrame(s,t);return}
  const INTRO=window.INTRO_END||4.9;ctx.clearRect(0,0,W,H);wall(t);
  // camera: intro close-up on doctor, then doctor moves to bottom with card above
  const intro=easeInOut(prog(s,INTRO-.5,.8));
  const cardA=intro;
  const out=window.OUTRO&&window.OUTRO_AT&&t>=window.OUTRO_AT,pf=Math.max(punchAt(s),out?clamp((t-window.OUTRO_AT)/.08):0),jo=joltAt(s);
  const mood=clamp(track(MOOD,s)+.35*jo+(out?.3:0)),env=out?outroEnvAt(t):envAt(t);
  const pose=out?{...poseAtName('point'),name:'point'}:poseAt(s);
  const sh=out?outroVisAt(t):visAt(t);
  const intoCard=s>=INTRO;
  const look=pf>.5?[0,0]:(intoCard&&LOOK[pose.name])||[0,0];
  const p={mood,open:clamp(env*1.15),shape:env>.08?sh:'M',blink:jo>.3?0:blinkAt(t),lift:env*10+jo*25,L:pose.L,R:pose.R,kL:pose.kL,kR:pose.kR,rFront:pose.rFront,look,
    tilt:Math.sin(t*2.3)*.025+env*.03*Math.sin(t*9)+(pose.name==='facepalm'?.08:0),bob:-env*10+Math.sin(t*2)*4-jo*40};
  // doctor placement: intro close-up -> bottom; punch-ins jump to a big close-up
  let dx=540,dy=lerp(1380,1660,intro),ds=lerp(1.45,1.12,intro)*(1+.08*(pose.lean||0))*(1+.05*jo);
  dy-=40*(pose.lean||0);
  const PX=540,PY=1560,PS=2.05;
  // FULLSCREEN mode (window.FULLSCREEN + window.stage(s,t)): the story fills the screen, the doctor sits small in a corner
  const FS=window.FULLSCREEN&&intoCard;if(FS){const c=window.DOC_CORNER||[200,1600,.55];dx=c[0];dy=c[1];ds=c[2]*(1+.05*jo)}
  dx=lerp(dx,PX,pf);dy=lerp(dy,PY,pf);ds=lerp(ds,PS,pf);
  // card + content (content draws in intro too, over the doctor's head area)
  if(s<INTRO){if(pf>0)punchFX(t,pf,false);ctx.save();ctx.translate(dx,dy);ctx.scale(ds,ds);doctor(p,t);ctx.restore();ctx.save();ctx.globalAlpha=1;content(s);ctx.restore();hookText(s,INTRO)}
  else{
    if(pf<1){ctx.save();ctx.globalAlpha=1-pf;if(FS){const sh=shakeAt(s);if(sh)ctx.translate(sh[0],sh[1]);window.stage(s,t)}else drawCard(s,INTRO,cardA);ctx.restore()}
    if(pf>0)punchFX(t,pf,out);
    ctx.save();ctx.translate(dx,dy);ctx.scale(ds,ds);doctor(p,t);ctx.restore();
    if(out)outroFX(t);
    const pw=punchWord(s);if(pw&&pf>.5){ctx.save();ctx.translate(W/2,400);ctx.rotate(-.05);ctx.scale(1+.04*Math.sin(t*18),1);text(pw[0],0,0,Math.min(190,1500/pw[0].length),{fill:'#ffd60a',sw:28,scale:pop(pw[1],0,.25)});ctx.restore()}
  }
  // name tag: window.NAMETAG=[start,end]
  if(window.NAMETAG){const[a,b]=window.NAMETAG;if(t>=a&&t<b){const al=1-prog(t,b-.25,.25);
    label('DR. GRUMBLES',300,720,t,a,{bg:'#fff',size:54,rot:-.05,alpha:al});
    text('50 years a doctor',300,805,36,{fill:'#fff',sw:10,alpha:al*prog(t,a+.25,.3),shadow:false});}}
  if(!out&&!window.__tz)captions(t,s<INTRO||pf>.5?1560:(window.FULLSCREEN?(window.CAP_Y||1330):1060));
  if(window.COLD_OPEN){const d=s-window.COLD_OPEN.end;if(d>=0&&d<.15){ctx.fillStyle=`rgba(255,255,255,${.9*(1-d/.15)})`;ctx.fillRect(0,0,W,H)}}
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,0,W,10);ctx.fillStyle='#ffd60a';ctx.fillRect(0,0,W*clamp(t/DUR),10);
}
// ---------- hook text (#4): on screen from the very first frame ----------
// window.HOOK=[['LINE',color,size],...]
function hookText(t,INTRO){const H_=window.HOOK;if(!H_)return;const a=1-prog(t,INTRO-.6,.35);if(a<=0)return;
  let y=170;H_.forEach(([str,col,size0=110],i)=>{ctx.font=`900 ${size0}px ${FONT}`;const size=size0*Math.min(1,960/ctx.measureText(str).width);y+=size*.6;const b=1+.04*Math.sin(t*5+i);text(str,W/2,y,size,{fill:col||'#fff',sw:size*.17,scale:b,rot:(i%2?.025:-.03),alpha:a});y+=size*.55})}
// ---------- punch-in look ----------
function punchWord(t){for(const q of (window.PUNCH||[]))if(q[2]&&t>=q[0]&&t<q[1])return [q[2],t-q[0]];return null}
function punchFX(t,pf,out){ctx.save();ctx.globalAlpha=pf;
  const g=ctx.createRadialGradient(W/2,H*.55,200,W/2,H*.55,1200);g.addColorStop(0,out?'#ffe08a':'#ffb4a2');g.addColorStop(1,out?'#f4a261':'#e63946');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.translate(W/2,H*.5);ctx.rotate(t*.15);ctx.fillStyle='rgba(255,255,255,.18)';for(let i=0;i<24;i++){ctx.rotate(Math.PI/12);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1500,-60);ctx.lineTo(1500,60);ctx.closePath();ctx.fill()}
  ctx.restore()}
// ---------- signature outro (#6): "Next patient!" + loop back to the first frame (#5) ----------
// window.OUTRO=true. Audio + mouth data for the line come from engine/voice (passed in by render.js).
let OUT_ENV=[],OUT_VIS=[],OUT_LEN=1.9;
function outroEnvAt(t){const i=(t-window.OUTRO_AT-.35)*FPS;if(i<0)return 0;const a=OUT_ENV[Math.floor(i)]||0,b=OUT_ENV[Math.floor(i)+1]||0;return lerp(a,b,i%1)}
function outroVisAt(t){const tt=t-window.OUTRO_AT-.35;for(const v of OUT_VIS)if(tt>=v[0]&&tt<=v[1])return v[2];return null}
function poseAtName(n){return {L:POSE[n][0],R:POSE[n][1],kL:HANDS[n][0],kR:HANDS[n][1],rFront:false}}
function clipboard(x,y,s,rot){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);ctx.beginPath();ctx.roundRect(-150,-200,300,400,24);P('#b5835a',8);ctx.beginPath();ctx.roundRect(-125,-160,250,340,10);P('#fffdf7',6);
  ctx.beginPath();ctx.roundRect(-60,-225,120,60,14);P('#adb5bd',7);ctx.strokeStyle='rgba(43,33,24,.35)';ctx.lineWidth=8;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(-95,-110+i*48);ctx.lineTo(95-(i%3)*30,-110+i*48);ctx.stroke()}ctx.restore()}
function outroFX(t){const u=t-window.OUTRO_AT;
  // clipboard slams down at ~0.25s
  const k=easeOut(clamp((u-.05)/.2));if(k>0)clipboard(860,lerp(2400,1560,k),1.05,.2-.1*k);
  if(u>.25&&u<.6){burst(860,1440,lerp(80,220,easeOut((u-.25)/.35)),'#ffd60a')}
  if(u>.3){const a=1-prog(u,OUT_LEN-.45,.3);text('NEXT',W/2,330,170,{fill:'#fff',sw:26,scale:pop(u,.3),rot:-.05,alpha:a});text('PATIENT!',W/2,520,170,{fill:'#ffd60a',sw:26,scale:pop(u,.45),rot:.04,alpha:a})}
  // final beat: fade toward the episode's first frame so the loop feels seamless
  const f=prog(u,OUT_LEN-.35,.3);if(f>0&&window.__firstFrame){ctx.save();ctx.globalAlpha=f;ctx.drawImage(window.__firstFrame,0,0);ctx.restore()}
}
window.setup=(w,e,d,vis,oenv,ovis,olen)=>{WORDS=w;ENV=e;DUR=d;VIS=vis||[];OUT_ENV=oenv||[];OUT_VIS=ovis||[];if(olen)OUT_LEN=olen;buildChunks();
  if(!window.__SFX0)window.__SFX0=window.SFX||[];window.SFX=window.__SFX0.map(c=>[toVideo(c[0]),...c.slice(1)]);
  // soft clock ticks during longer pauses (the viewer's "guess" beat). window.PAUSE_TICKS=false disables.
  if(window.PAUSE_TICKS!==false){let off=0;(window.PAUSES||[]).forEach(([p,d])=>{const v0=p+off;if(d>=.7)for(let k=.1;k<d-.1;k+=.25)window.SFX.push([v0+k,'tick',.6]);off+=d})}
  if(window.OUTRO){window.OUTRO_AT=w[w.length-1].e+.25;window.SFX=window.SFX.concat([[window.OUTRO_AT+.25,'stamp'],[window.OUTRO_AT+.35,'next_patient',2.0]])}};
window.outroLen=()=>window.ENDING==='cut'?-.12:(window.OUTRO?OUT_LEN+.25:0);window.render=render;
