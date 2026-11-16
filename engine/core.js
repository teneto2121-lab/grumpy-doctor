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
function dEye(x,y,r,mood,side,blink){
  const wide=clamp((mood-.45)/.35);const ry=r*(.95+.25*wide);
  E(x,y,r,ry);P('#fff',5);
  const pr=r*lerp(.42,.3,wide),px=x+side*-r*.12*(1-wide),py=y+r*.1*(1-wide);
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
function dMouth(x,y,w,open,mood){
  if(open<.06){ctx.strokeStyle=OL;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();const f=lerp(.16,.24,mood);ctx.moveTo(x-w*.38,y+w*.12);ctx.quadraticCurveTo(x,y-w*f,x+w*.38,y+w*.14);ctx.stroke();return}
  const rx=w*lerp(.3,.5,clamp(mood*.6+open*.5)),ry=w*.45*open+4,cy=y+ry*.4;
  E(x,cy,rx,ry);P('#5a1e1e',6);
  ctx.save();E(x,cy,rx,ry);ctx.clip();ctx.fillStyle='#fff';ctx.fillRect(x-rx,cy-ry,2*rx,Math.min(ry*.45,w*.13));
  E(x,cy+ry*.75,rx*.6,ry*.45);ctx.fillStyle='#e05a5a';ctx.fill();ctx.restore();
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
  arm(-200,60,L[0],L[1],p.kL||'open',-1);arm(200,60,R[0],R[1],p.kR||'open',1);
  // head
  ctx.save();ctx.translate(0,-210);ctx.rotate(tilt);
  const face=mixHex('f2c9a5','f0907a',clamp((mood-.55)/.4));
  E(-150,10,34,46);P(SKIN);E(150,10,34,46);P(SKIN);
  curve([[0,-170],[110,-140],[150,-40],[140,60],[80,130],[0,150],[-80,130],[-140,60],[-150,-40],[-110,-140]]);P(face);
  [-1,1].forEach(d=>{ctx.save();ctx.scale(d,1);ctx.rotate(Math.sin(t*3+d)*.02*(1+mood*3));curve([[130,-90],[200,-110],[190,-60],[230,-40],[185,0],[215,40],[160,40],[140,-20]]);P(HAIR,6);ctx.restore()});
  E(-50,-120,40,18,-.3);ctx.fillStyle='rgba(255,255,255,.45)';ctx.fill();
  if(mood>.75){const k=clamp((mood-.75)/.15);vein(70,-110,24,k);ctx.globalAlpha=k;steam(0,-190,70,t);ctx.globalAlpha=1}
  dEye(-52,-10,30,mood,-1,blink);dEye(52,-10,30,mood,1,blink);
  dBrow(-58,-62,105,34,mood,1,lift);dBrow(58,-62,105,34,mood,-1,lift);
  ctx.strokeStyle=OL;ctx.lineWidth=5;E(-34,44,24,18);ctx.stroke();E(34,44,24,18);ctx.stroke();ctx.beginPath();ctx.moveTo(-10,42);ctx.lineTo(10,42);ctx.stroke();
  curve([[0,0],[28,30],[34,60],[0,74],[-34,60],[-28,30]]);P('#e8a98a',6);
  dMouth(0,112+open*6,70,open,mood);
  ctx.save();ctx.translate(0,-open*6);curve([[0,78],[50,72],[90,96],[60,108],[0,96],[-60,108],[-90,96],[-50,72]]);P(HAIR,6);ctx.restore();
  ctx.restore();ctx.restore();
}

const HANDS={rest:['open','open'],point:['open','point'],up:['spread','point'],shrug:['spread','spread'],chin:['open','fist']};
const POSE={rest:[[-235,300],[235,300]],point:[[-235,300],[300,-150]],up:[[-330,-150],[300,-110]],shrug:[[-290,40],[290,40]],chin:[[-235,300],[40,150]]};
function poseAt(t){let i=0;for(let k=0;k<POSES.length;k++)if(t>=POSES[k][0])i=k;const cur=POSE[POSES[i][1]];const prev=i>0?POSE[POSES[i-1][1]]:cur;const u=easeOut(prog(t,POSES[i][0],.28));
  return {L:[lerp(prev[0][0],cur[0][0],u),lerp(prev[0][1],cur[0][1],u)],R:[lerp(prev[1][0],cur[1][0],u),lerp(prev[1][1],cur[1][1],u)],kL:HANDS[POSES[i][1]][0],kR:HANDS[POSES[i][1]][1]}}
function envAt(t){const i=t*FPS;const a=ENV[Math.floor(i)]||0,b=ENV[Math.floor(i)+1]||0;return lerp(a,b,i%1)}
function blinkAt(t){const per=[];for(let b=2.1;b<600;b+=2.6+((b*7.3)%2.2))per.push(b);for(const b of per){const d=t-b;if(d>0&&d<.16)return Math.sin(d/.16*Math.PI)}return 0}

// ---------- SCENE / BACKGROUND ----------
function wall(t){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#bfe3e8');g.addColorStop(1,'#6fb3c0');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.18)';for(let y=60;y<H;y+=160)for(let x=(y/160%2)*80+40;x<W;x+=160){ctx.fillRect(x-14,y-4,28,8);ctx.fillRect(x-4,y-14,8,28)}
}
function card(alpha,{dark=false}={}){
  if(alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.roundRect(52,132,W-104,860,46);ctx.fill();
  ctx.beginPath();ctx.roundRect(44,118,W-88,860,46);P(dark?'#14161a':'#fffdf7',8);ctx.restore();
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
  const k=pop(t,c.s,.2);let x=W/2-tot/2;ctx.save();ctx.translate(W/2,y);ctx.scale(k,k);ctx.translate(-W/2,-y);
  parts.forEach((p,i)=>{const w=c[i];const on=t>=w.s&&t<(c[i+1]?c[i+1].s:c.e);text(p,x+ws[i]/2,y,size,{fill:on?'#ffd60a':'#fff',sw:20,scale:on?1.1:1});x+=ws[i]+sp});ctx.restore()}

// ---------- FRAME ----------
function render(t){
  const INTRO=window.INTRO_END||4.9;ctx.clearRect(0,0,W,H);wall(t);
  // camera: intro close-up on doctor, then doctor moves to bottom with card above
  const intro=easeInOut(prog(t,INTRO-.5,.8));
  const cardA=intro;
  const mood=track(MOOD,t),env=envAt(t);
  const pose=poseAt(t);
  const p={mood,open:clamp(env*1.15),blink:blinkAt(t),lift:env*10,L:pose.L,R:pose.R,kL:pose.kL,kR:pose.kR,tilt:Math.sin(t*2.3)*.025+env*.03*Math.sin(t*9),bob:-env*10+Math.sin(t*2)*4};
  // doctor placement
  const dx=lerp(540,540,intro),dy=lerp(1380,1660,intro),ds=lerp(1.45,1.12,intro);
  // card + content (content draws in intro too, over the doctor's head area)
  if(t<INTRO){ctx.save();ctx.translate(dx,dy);ctx.scale(ds,ds);doctor(p,t);ctx.restore();ctx.save();ctx.globalAlpha=1;content(t);ctx.restore()}
  else{card(cardA);ctx.save();content(t);ctx.restore();ctx.save();ctx.translate(dx,dy);ctx.scale(ds,ds);doctor(p,t);ctx.restore()}
  captions(t,t<INTRO?1840:1060);
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(0,0,W,10);ctx.fillStyle='#ffd60a';ctx.fillRect(0,0,W*clamp(t/DUR),10);
}
window.setup=(w,e,d)=>{WORDS=w;ENV=e;DUR=d;buildChunks()};window.render=render;
