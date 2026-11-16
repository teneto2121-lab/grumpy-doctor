// Reusable, shaded anatomy props + cartoon faces. Load after core.js.
// All props draw centred on (x,y) with scale s.

// ---------- shading helpers ----------
function shadeFill(x0,y0,x1,y1,light,dark){const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,light);g.addColorStop(1,dark);return g}
function radial(x,y,r,inner,outer){const g=ctx.createRadialGradient(x-r*.35,y-r*.4,r*.05,x,y,r);g.addColorStop(0,inner);g.addColorStop(1,outer);return g}
function gloss(x,y,rx,ry,rot=-.5,a=.55){E(x,y,rx,ry,rot);ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.fill()}
function noShadow(){ctx.shadowColor='rgba(0,0,0,0)'}
function groundShadow(x,y,rx,ry=rx*.18,a=.16){E(x,y,rx,ry);ctx.fillStyle=`rgba(43,33,24,${a})`;ctx.fill()}

// ---------- cartoon face ----------
// expr: 'calm' | 'happy' | 'worried' | 'scared' | 'confused' | 'smug' | 'annoyed'
function face(x,y,s,expr,t,{look=[0,0],blink=true}={}){
  ctx.save();noShadow();ctx.translate(x,y);ctx.scale(s,s);
  const b=blink&&((t*0.9+x*.001)%3.1)<.12?.1:1;
  const wide=expr==='scared'||expr==='worried'?1.15:1;
  [-1,1].forEach(d=>{
    E(d*26,0,16*wide,19*wide*b);P('#fff',4);
    if(b>.5){E(d*26+look[0]*6,3+look[1]*6,8,9);P(OL,0);E(d*26+look[0]*6-3,0+look[1]*6,3,3);P('#fff',0)}
    // brows
    ctx.strokeStyle=OL;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();
    const by=-28*wide;
    if(expr==='annoyed'){ctx.moveTo(d*40,by-4);ctx.lineTo(d*12,by+6)}
    else if(expr==='worried'||expr==='scared'){ctx.moveTo(d*40,by+4);ctx.lineTo(d*12,by-6)}
    else if(expr==='confused'){d<0?(ctx.moveTo(-40,by),ctx.lineTo(-12,by)):(ctx.moveTo(12,by-10),ctx.lineTo(40,by-2))}
    else if(expr==='smug'){ctx.moveTo(d*40,by);ctx.lineTo(d*12,by+2)}
    ctx.stroke();
  });
  ctx.strokeStyle=OL;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();
  if(expr==='happy'){ctx.arc(0,26,16,.2,Math.PI-.2)}
  else if(expr==='smug'){ctx.moveTo(-14,32);ctx.quadraticCurveTo(4,40,18,26)}
  else if(expr==='worried'||expr==='annoyed'){ctx.moveTo(-16,38);ctx.quadraticCurveTo(0,28,16,38)}
  else if(expr==='confused'){ctx.moveTo(-16,34);ctx.lineTo(-4,30);ctx.lineTo(8,35);ctx.lineTo(18,31)}
  else if(expr==='scared'){ctx.stroke();E(0,36,10,13);P('#5a1e1e',4);ctx.restore();return}
  else if(expr==='sleep'){ctx.stroke();[-1,1].forEach(d=>{ctx.fillStyle=SKIN;E(d*26,0,18,21);ctx.fill();ctx.beginPath();ctx.arc(d*26,-2,13,.2,Math.PI-.2);ctx.stroke()});E(0,32,7,8);P('#5a1e1e',3);ctx.restore();return}
  else {ctx.moveTo(-12,32);ctx.lineTo(12,32)}
  ctx.stroke();ctx.restore();
}

// ---------- brain (side view, facing right) ----------
function brain(x,y,s,{t=0,expr=null,look=[0,0],tint='#ffafcc'}={}){
  ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  // brain stem + cerebellum
  ctx.beginPath();ctx.moveTo(-30,70);ctx.bezierCurveTo(-20,150,-50,200,-70,240);ctx.lineTo(-20,240);ctx.bezierCurveTo(10,190,30,140,40,80);ctx.closePath();P(shadeFill(-60,80,40,240,'#f4a3bf','#d97a9c'),7);
  E(-140,105,95,58,-.1);P(radial(-140,105,100,'#ffc2d6','#e78aac'),7);
  ctx.save();E(-140,105,95,58,-.1);ctx.clip();ctx.strokeStyle='rgba(140,40,80,.4)';ctx.lineWidth=5;for(let i=-3;i<=3;i++){ctx.beginPath();ctx.ellipse(-140,105+i*16,100,30,-.1,.1,Math.PI-.1);ctx.stroke()}ctx.restore();
  // cerebrum
  const shape=()=>curve([[-235,30],[-245,-60],[-185,-150],[-65,-198],[70,-192],[180,-140],[242,-50],[238,40],[175,92],[60,100],[-60,96],[-175,92]]);
  shape();P(radial(0,-60,300,'#ffd1e1',tint),8);noShadow();
  ctx.save();shape();ctx.clip();
  ctx.strokeStyle='rgba(150,45,90,.42)';ctx.lineWidth=7;ctx.lineCap='round';
  for(let r=0;r<7;r++){const yy=-170+r*42;ctx.beginPath();for(let xx=-260;xx<=260;xx+=8){const w=Math.sin(xx/22+r*1.7)*13+Math.sin(xx/9+r)*4;xx===-260?ctx.moveTo(xx,yy+w):ctx.lineTo(xx,yy+w)}ctx.stroke()}
  ctx.lineWidth=9;ctx.strokeStyle='rgba(130,35,80,.55)';ctx.beginPath();ctx.moveTo(-120,40);ctx.bezierCurveTo(-40,-10,60,10,170,-20);ctx.stroke(); // lateral sulcus
  ctx.beginPath();ctx.moveTo(20,-195);ctx.bezierCurveTo(0,-120,40,-70,10,-10);ctx.stroke(); // central sulcus
  ctx.restore();
  shape();ctx.strokeStyle=OL;ctx.lineWidth=8;ctx.stroke();
  gloss(-90,-140,60,22,-.35,.45);
  if(expr)face(90,-40,1.05,expr,t,{look});
  ctx.restore();
}

// ---------- red blood cell (biconcave disc) ----------
function rbc(x,y,r,tilt=0){ctx.save();ctx.translate(x,y);ctx.scale(1,lerp(1,.35,Math.abs(Math.sin(tilt))));
  E(0,0,r,r);P(radial(0,0,r,'#ff5d73','#b5172f'),4);E(0,0,r*.5,r*.5);ctx.fillStyle='rgba(120,10,30,.35)';ctx.fill();gloss(-r*.35,-r*.4,r*.3,r*.15,-.5,.45);ctx.restore()}

// ---------- blood vessel cutaway ----------
// squeeze 0..1 narrows it (cold), flood 0..1 widens it with warm blood
function bloodVessel(cx,cy,t,{len=860,R0=105,squeeze=0,flood=0,cold=0}={}){
  const R=R0*(1-.6*squeeze)*(1+.32*flood),wall=30,x0=cx-len/2,x1=cx+len/2;
  // outer wall (cylinder shading)
  ctx.beginPath();ctx.roundRect(x0,cy-R-wall,len,2*(R+wall),R+wall);
  ctx.fillStyle=shadeFill(0,cy-R-wall,0,cy+R+wall,'#ffd0c8','#e8907f');ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=8;ctx.stroke();
  ctx.save();noShadow();
  // lumen
  ctx.save();ctx.beginPath();ctx.roundRect(x0+16,cy-R,len-32,2*R,R);ctx.clip();
  ctx.fillStyle=shadeFill(0,cy-R,0,cy+R,flood>0?mixHex('7a1020','c8381e',flood):'#7a1020','#4a0712');ctx.fillRect(x0,cy-R,len,2*R);
  const r=rng(12),sp=lerp(130,560,flood)*(1-.75*squeeze);
  for(let i=0;i<26;i++){const x=x0+((t*sp*(.8+r()*.4)+r()*len)%len),y=cy+(r()-.5)*R*1.5,rr=lerp(26,30,flood)*(1-.25*squeeze);rbc(x,y,rr,t*2+i)}
  ctx.restore();
  ctx.beginPath();ctx.roundRect(x0+16,cy-R,len-32,2*R,R);ctx.strokeStyle='rgba(43,33,24,.5)';ctx.lineWidth=5;ctx.stroke();
  // highlight streak along the top
  ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x0+60,cy-R-wall*.55);ctx.lineTo(x1-60,cy-R-wall*.55);ctx.stroke();
  // muscle rings squeezing
  if(squeeze>.05){ctx.strokeStyle=`rgba(76,201,240,${clamp(squeeze*1.4)})`;ctx.lineWidth=16;for(let i=1;i<6;i++){const xx=x0+i*len/6;ctx.beginPath();ctx.ellipse(xx,cy,18,R+wall+6,0,0,Math.PI*2);ctx.stroke()}}
  if(cold>0){const g=ctx.createRadialGradient(cx,cy,10,cx,cy,len*.6);g.addColorStop(0,`rgba(160,230,255,${.35*cold})`);g.addColorStop(1,'rgba(160,230,255,0)');ctx.fillStyle=g;ctx.fillRect(x0-40,cy-R-120,len+80,2*R+240)}
  if(flood>0){const g=ctx.createRadialGradient(cx,cy,10,cx,cy,len*.6);g.addColorStop(0,`rgba(255,120,60,${.25*flood})`);g.addColorStop(1,'rgba(255,120,60,0)');ctx.fillStyle=g;ctx.fillRect(x0-40,cy-R-120,len+80,2*R+240)}
  ctx.restore();
}

// ---------- head profile (facing right) with brain, palate and nerve ----------
function headProfile(cx,cy,s,t,{pulse=0,fore=0,brainExpr='calm',look=[0,0],cold=0}={}){
  ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
  const sil=()=>curve([[-205,-110],[-185,-235],[-85,-305],[55,-305],[170,-245],[215,-145],[222,-70],[272,-5],[232,22],[238,52],[252,72],[236,92],[248,112],[226,145],[214,190],[150,218],[92,222],[66,330],[-125,330],[-150,205],[-212,60]]);
  sil();P(shadeFill(-200,-300,250,300,'#f6d2b3','#e4ad86'),8);noShadow();
  // ear
  E(-45,15,38,58,.1);P('#eab48f',7);ctx.strokeStyle='rgba(43,33,24,.4)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(-40,15,24,-1.2,1.6);ctx.stroke();
  // skull window for the brain
  ctx.save();sil();ctx.clip();
  E(-5,-165,215,135);ctx.fillStyle='rgba(255,240,245,.85)';ctx.fill();ctx.strokeStyle='rgba(43,33,24,.25)';ctx.lineWidth=6;ctx.setLineDash([16,12]);ctx.stroke();ctx.setLineDash([]);
  if(fore>0){const g=ctx.createRadialGradient(185,-185,10,185,-185,170);g.addColorStop(0,`rgba(255,40,40,${.8*fore})`);g.addColorStop(1,'rgba(255,40,40,0)');ctx.fillStyle=g;ctx.fillRect(0,-360,320,360)}
  // mouth cavity + palate + tongue
  E(150,72,95,40);ctx.fillStyle='#8a1c2b';ctx.fill();
  ctx.beginPath();ctx.moveTo(55,62);ctx.quadraticCurveTo(150,25,240,58);ctx.lineWidth=16;ctx.strokeStyle=cold>0?mixHex('ff7f93','9be7ff',cold):'#ff7f93';ctx.stroke();
  E(150,98,85,22);ctx.fillStyle='#ef6f86';ctx.fill();
  ctx.restore();
  sil();ctx.strokeStyle=OL;ctx.lineWidth=8;ctx.stroke();
  // eye + brow
  ctx.save();ctx.translate(150,-82);E(0,0,22,15);P('#fff',5);E(8,2,9,9);P(OL,0);ctx.restore();
  ctx.strokeStyle=OL;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(125,-115);ctx.lineTo(178,-110);ctx.stroke();
  brain(-10,-150,.5,{t,expr:brainExpr,look});
  // nerve with branch to forehead
  const nerve=[[150,40],[95,-10],[50,-60],[15,-110]],branch=[[95,-10],[150,-90],[190,-185]];
  [nerve,branch].forEach(pts=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=OL;ctx.lineWidth=16;ctx.stroke();ctx.strokeStyle='#ffd60a';ctx.lineWidth=9;ctx.stroke()});
  if(pulse>0){for(let k=0;k<3;k++){const u=((t*1.3+k/3)%1),seg=u*3,i=Math.min(2,Math.floor(seg)),f=seg-i;const x=lerp(nerve[i][0],nerve[i+1][0],f),y=lerp(nerve[i][1],nerve[i+1][1],f);ctx.globalAlpha=pulse;E(x,y,18,18);P('#ff595e',5);ctx.globalAlpha=1}}
  ctx.restore();
}

// ---------- open mouth (front view) ----------
function mouthOpen(cx,cy,s,t,{frost=0}={}){
  ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
  // lips
  E(0,0,350,265);P(shadeFill(0,-265,0,265,'#f28b9b','#d45a6f'),9);noShadow();
  E(0,0,305,222);P(radial(0,40,320,'#6e1022','#3d0611'),7);
  ctx.save();E(0,0,305,222);ctx.clip();
  // palate
  ctx.beginPath();ctx.ellipse(0,-200,285,150,0,0,Math.PI);
  const pal=frost>0?mixHex('ff8c9a','b8ecff',frost):'#ff8c9a';ctx.fillStyle=shadeFill(0,-200,0,-50,pal,frost>0?mixHex('e8667a','7fcff0',frost):'#e8667a');ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=6;ctx.stroke();
  ctx.strokeStyle='rgba(120,30,50,.3)';ctx.lineWidth=5;for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(0,-205,80+i*45,.35,Math.PI-.35);ctx.stroke()}
  // uvula + throat
  E(0,10,70,55);ctx.fillStyle='#1f0208';ctx.fill();
  ctx.beginPath();ctx.moveTo(-18,-55);ctx.quadraticCurveTo(-22,10,0,18);ctx.quadraticCurveTo(22,10,18,-55);ctx.closePath();P('#ff8c9a',5);
  // tongue
  E(0,175,215,125);P(shadeFill(0,60,0,260,'#ff8fa3','#e05b74'),7);ctx.strokeStyle='rgba(120,30,50,.35)';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(0,80);ctx.lineTo(0,170);ctx.stroke();gloss(-70,110,50,16,-.2,.35);
  // gums + teeth
  ctx.beginPath();ctx.ellipse(0,-205,300,38,0,0,Math.PI);ctx.fillStyle='#ff9fb0';ctx.fill();
  for(let i=-4;i<=4;i++){ctx.beginPath();ctx.roundRect(i*60-26,-232,52,64,14);P(shadeFill(0,-232,0,-168,'#ffffff','#e9e4d6'),5)}
  for(let i=-3;i<=3;i++){ctx.beginPath();ctx.roundRect(i*60-26,172,52,60,14);P(shadeFill(0,172,0,232,'#ffffff','#e9e4d6'),5)}
  ctx.restore();
  E(0,0,305,222);ctx.strokeStyle=OL;ctx.lineWidth=8;ctx.stroke();
  ctx.restore();
}

// ---------- intestine tube along a path, with a travelling squeeze wave ----------
// path(u) -> [x,y]; wave: position 0..1 of the squeeze; returns nothing, draws tube
function intestine(path,t,{R=70,waves=[],N=180}={}){
  const pts=[];for(let i=0;i<=N;i++){const u=i/N;let r=R;waves.forEach(w=>{const d=(u-w)/0.045;r*=1-.38*Math.exp(-d*d)});pts.push([...path(u),r])}
  const pass=(extra,fill)=>{ctx.fillStyle=fill;pts.forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x,y,Math.max(4,r+extra),0,Math.PI*2);ctx.fill()})};
  ctx.save();pass(8,OL);noShadow();pass(0,'#f7a8b8');
  // shading: lighter top band
  ctx.fillStyle='rgba(255,255,255,.28)';pts.forEach(([x,y,r])=>{ctx.beginPath();ctx.arc(x-r*.15,y-r*.3,r*.45,0,Math.PI*2);ctx.fill()});
  // muscle ring marks at the squeeze points
  waves.forEach(w=>{const u=clamp(w,0,1),[x,y]=path(u),[x2,y2]=path(clamp(u+.01,0,1)),a=Math.atan2(y2-y,x2-x);ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.strokeStyle='#c9184a';ctx.lineWidth=12;ctx.beginPath();ctx.ellipse(0,0,10,R*.75,0,0,Math.PI*2);ctx.stroke();ctx.restore()});
  ctx.restore();
}

// ---------- generic props ----------
// rubber stamp that slams in at time s
function stamp(str,x,y,t,s,size=150,rot=-.12,col='#e63946'){if(t<s)return;const k=pop(t,s,.3);ctx.save();noShadow();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(k,k);ctx.font=`900 ${size}px ${FONT}`;const w=ctx.measureText(str).width+size*.6;ctx.beginPath();ctx.roundRect(-w/2,-size*.68,w,size*1.36,30);ctx.fillStyle='rgba(255,255,255,.88)';ctx.fill();ctx.lineWidth=20;ctx.strokeStyle=col;ctx.stroke();text(str,0,size*.05,size,{fill:col,shadow:false});ctx.restore()}
// cartoon bone (dumbbell) along x, length len, optional face
function boneProp(x,y,len,s,t,{rot=0,expr=null,look=[0,0]}={}){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);
  const h=len/2-46,shape=(e)=>{ctx.beginPath();ctx.roundRect(-h,-30-e,2*h,60+2*e,10);[[-h,-34],[-h,34],[h,-34],[h,34]].forEach(([bx,by])=>{ctx.moveTo(bx+46+e,by);ctx.arc(bx,by,46+e,0,Math.PI*2)})};
  shape(8);ctx.fillStyle=OL;ctx.fill();ctx.save();noShadow();
  shape(0);ctx.fillStyle=shadeFill(0,-80,0,80,'#ffffff','#e6d9bf');ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-h+20,-14);ctx.lineTo(h-20,-14);ctx.stroke();
  [[-h,-34],[h,-34]].forEach(([bx,by])=>gloss(bx-12,by-14,14,8,-.5,.6));
  if(expr)face(0,6,.85,expr,t,{look});ctx.restore();ctx.restore()}
function feather(x,y,s,rot,col='#ff8fab'){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(s,s);
  ctx.beginPath();ctx.moveTo(0,-150);ctx.bezierCurveTo(70,-110,60,40,0,120);ctx.bezierCurveTo(-60,40,-70,-110,0,-150);P(shadeFill(-60,0,60,0,'#ffd1dc',col),6);ctx.save();noShadow();
  ctx.strokeStyle='rgba(43,33,24,.35)';ctx.lineWidth=4;for(let i=-5;i<=4;i++){ctx.beginPath();ctx.moveTo(0,i*22);ctx.lineTo(-38,i*22-26);ctx.moveTo(0,i*22);ctx.lineTo(38,i*22-26);ctx.stroke()}
  ctx.strokeStyle=OL;ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,-140);ctx.lineTo(0,175);ctx.stroke();ctx.restore();ctx.restore()}
// horizontal meter 0..1 with a label
function meter(x,y,w,val,t,lab='TICKLE-O-METER'){ctx.save();const h=56;
  ctx.beginPath();ctx.roundRect(x-w/2,y-h/2,w,h,h/2);P('#fff',7);noShadow();
  const v=clamp(val);if(v>.01){ctx.save();ctx.beginPath();ctx.roundRect(x-w/2+8,y-h/2+8,(w-16)*v,h-16,(h-16)/2);ctx.fillStyle=shadeFill(x-w/2,0,x+w/2,0,'#7ae582','#e63946');ctx.fill();ctx.restore()}
  text(lab,x,y-h/2-30,34,{fill:OL,shadow:false});ctx.restore()}
// cartoon robot arm holding a feather; base at (x,y)
function robotArm(x,y,s,t,{wiggle=0,expr='happy'}={}){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.beginPath();ctx.roundRect(-110,-20,220,90,20);P(shadeFill(0,-20,0,70,'#adb5bd','#6c757d'),7);
  ctx.save();noShadow();ctx.fillStyle='#ffd60a';[-60,0,60].forEach(dx=>{ctx.beginPath();ctx.arc(dx,25,10,0,7);ctx.fill()});ctx.restore();
  const a1=-1.2+Math.sin(t*2)*.08,a2=.9+Math.sin(t*9)*.25*wiggle;
  const j1=[Math.cos(a1)*220,-20+Math.sin(a1)*220],j2=[j1[0]+Math.cos(a1+a2)*190,j1[1]+Math.sin(a1+a2)*190];
  ctx.lineCap='round';[[[0,-20],j1],[j1,j2]].forEach(([p,q])=>{ctx.strokeStyle=OL;ctx.lineWidth=58;ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.stroke();ctx.strokeStyle='#ced4da';ctx.lineWidth=44;ctx.stroke()});
  [[0,-20],j1].forEach(([px,py])=>{E(px,py,34,34);P(radial(px,py,34,'#f8f9fa','#868e96'),6)});
  // head on the base
  ctx.beginPath();ctx.roundRect(-80,-150,120,100,22);P(shadeFill(0,-150,0,-50,'#e9ecef','#adb5bd'),7);ctx.save();noShadow();face(-20,-102,.55,expr,t);ctx.strokeStyle=OL;ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-20,-150);ctx.lineTo(-20,-185);ctx.stroke();E(-20,-192,12,12);P('#e63946',5);ctx.restore();
  feather(j2[0]+10,j2[1]-40,.45,a1+a2+Math.PI/2+Math.sin(t*12)*.2*wiggle);
  ctx.restore();return [x+(j2[0]+10)*s,y+(j2[1]-40)*s]}

// ---------- lungs + diaphragm (front view). twitch 0..1 pulls the diaphragm down; air 0..1 shows inflow ----------
function lungsDiaphragm(cx,cy,s,t,{twitch=0,air=0,expr=null}={}){ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
  const ex=1+.07*twitch;
  // trachea + bronchi
  ctx.lineCap='round';ctx.lineJoin='round';
  [[OL,58],['#f4c2c2',42]].forEach(([c,w])=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(0,-360);ctx.lineTo(0,-150);ctx.moveTo(0,-150);ctx.lineTo(-90,-80);ctx.moveTo(0,-150);ctx.lineTo(90,-80);ctx.stroke()});
  ctx.save();noShadow();ctx.strokeStyle='rgba(43,33,24,.3)';ctx.lineWidth=5;for(let y=-340;y<-160;y+=26){ctx.beginPath();ctx.moveTo(-16,y);ctx.lineTo(16,y);ctx.stroke()}ctx.restore();
  // lungs
  [-1,1].forEach(d=>{ctx.save();ctx.translate(d*150,0);ctx.scale(d*ex,ex);
    curve([[-40,-230],[40,-200],[95,-90],[105,40],[80,150],[0,175],[-70,160],[-80,40],[-75,-120]]);P(radial(20,-40,220,'#ffc2d1','#e9799a'),8);
    ctx.save();noShadow();gloss(30,-120,26,48,.2,.35);ctx.strokeStyle='rgba(150,45,90,.3)';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-60,0);ctx.quadraticCurveTo(20,-20,90,30);ctx.stroke();ctx.restore();ctx.restore()});
  // air arrows
  if(air>0){ctx.save();noShadow();ctx.globalAlpha=air;for(let k=0;k<3;k++){const y=-380+((t*420+k*90)%240);poly([[-18,y],[18,y],[18,y+24],[32,y+24],[0,y+56],[-32,y+24],[-18,y+24]]);P('#4cc9f0',5)}ctx.restore()}
  // diaphragm dome (flattens and drops when it twitches)
  const dy=190+55*twitch,arc=lerp(110,35,twitch);
  ctx.beginPath();ctx.moveTo(-300,dy+60);ctx.quadraticCurveTo(0,dy-arc*2+60,300,dy+60);ctx.lineTo(300,dy+110);ctx.quadraticCurveTo(0,dy-arc*2+110,-300,dy+110);ctx.closePath();P(shadeFill(0,dy-arc,0,dy+110,'#e76f51','#b23a2b'),8);
  ctx.save();noShadow();ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=5;for(let i=-4;i<=4;i++){ctx.beginPath();ctx.moveTo(i*60,dy+70-arc*(1-(i*i)/25)*.95);ctx.lineTo(i*60,dy+100-arc*(1-(i*i)/25)*.95);ctx.stroke()}
  if(expr)face(0,dy+20-arc+ (twitch*20),.8,expr,t);ctx.restore();
  ctx.restore()}
// ---------- vocal cords, top view. closed 0..1 ----------
function vocalCords(cx,cy,s,t,closed){ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
  E(0,0,230,270);P(radial(0,0,270,'#f7a8b8','#d45d79'),8);ctx.save();noShadow();
  const gap=lerp(70,0,closed);
  // airway (dark triangle between the folds)
  poly([[0,-200],[gap,190],[-gap,190]]);ctx.fillStyle='#2b0510';ctx.fill();
  [-1,1].forEach(d=>{poly([[0,-210],[d*(gap+4),190],[d*(gap+70),200],[d*80,-170]]);P(shadeFill(d*80,0,0,0,'#fff3f5','#f1c0cb'),6)});
  ctx.restore();ctx.restore()}
// ---------- skin cross-section with hairs + arrector pili muscles. pull 0..1 stands hairs up ----------
function skinHair(cx,cy,s,t,{pull=0,n=3,cold=0}={}){ctx.save();ctx.translate(cx,cy);ctx.scale(s,s);
  const Wd=820,top=-120,bot=260,xs=Array.from({length:n},(_,i)=>-Wd/2+Wd*(i+.5)/n);
  const bump=x=>xs.reduce((a,hx)=>a+pull*42*Math.exp(-(((x-hx-30)/55)**2)),0);
  // dermis block
  ctx.beginPath();ctx.moveTo(-Wd/2,top-bump(-Wd/2));for(let x=-Wd/2;x<=Wd/2;x+=10)ctx.lineTo(x,top-bump(x));ctx.lineTo(Wd/2,bot);ctx.lineTo(-Wd/2,bot);ctx.closePath();P(shadeFill(0,top,0,bot,'#fbd0c0','#f2a48f'),8);
  ctx.save();noShadow();
  // epidermis band
  ctx.beginPath();ctx.moveTo(-Wd/2,top-bump(-Wd/2));for(let x=-Wd/2;x<=Wd/2;x+=10)ctx.lineTo(x,top-bump(x));for(let x=Wd/2;x>=-Wd/2;x-=10)ctx.lineTo(x,top+34-bump(x)*.8);ctx.closePath();ctx.fillStyle=cold>0?mixHex('f6d2b3','d8ecff',cold*.6):'#f6d2b3';ctx.fill();ctx.strokeStyle=OL;ctx.lineWidth=6;ctx.stroke();
  xs.forEach(hx=>{
    const ang=lerp(-.95,-.08,easeInOut(pull)); // hair angle from vertical
    const bx=hx-70,by=top+250; // follicle bulb, deep in the dermis
    // follicle
    ctx.save();ctx.translate(bx,by);ctx.rotate(ang);ctx.beginPath();ctx.roundRect(-20,-250,40,260,20);P('#fff0e6',5);E(0,8,28,24);P('#e9a17c',5);
    // hair shaft
    ctx.strokeStyle=OL;ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-460);ctx.stroke();ctx.strokeStyle='#5a3d2b';ctx.lineWidth=7;ctx.stroke();ctx.restore();
    // arrector pili muscle: from mid-follicle to under the epidermis
    const fx=bx+Math.sin(ang)*120,fy=by-Math.cos(ang)*120,mx=hx+60,my=top+44;
    const thick=lerp(16,26,pull);ctx.lineCap='round';ctx.strokeStyle=OL;ctx.lineWidth=thick+10;ctx.beginPath();ctx.moveTo(fx+10,fy);ctx.quadraticCurveTo((fx+mx)/2+20,(fy+my)/2+30*(1-pull),mx,my);ctx.stroke();ctx.strokeStyle=pull>0?mixHex('e76f51','c1121f',pull):'#e76f51';ctx.lineWidth=thick;ctx.stroke();
  });
  ctx.restore();ctx.restore()}

// ---------- stomach (front view) with optional face ----------
function stomachOrgan(x,y,s,t,{expr=null,fill=0,shake=0}={}){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*5)*.04*shake);ctx.scale(s,s);
  ctx.lineCap='round';ctx.strokeStyle=OL;ctx.lineWidth=74;ctx.beginPath();ctx.moveTo(70,-330);ctx.lineTo(40,-150);ctx.stroke();ctx.strokeStyle='#f7a8b8';ctx.lineWidth=58;ctx.stroke();
  ctx.strokeStyle=OL;ctx.lineWidth=64;ctx.beginPath();ctx.moveTo(-170,130);ctx.quadraticCurveTo(-260,200,-300,120);ctx.stroke();ctx.strokeStyle='#f7a8b8';ctx.lineWidth=48;ctx.stroke();
  const shape=()=>curve([[-40,-170],[60,-160],[150,-80],[250,30],[220,160],[80,220],[-90,200],[-200,120],[-160,40],[-80,-40]]);
  shape();P(radial(40,20,260,'#ffc8d6','#f07896'),8);ctx.save();noShadow();
  if(fill>0){ctx.save();shape();ctx.clip();const r=rng(21);for(let i=0;i<26*fill;i++){const fx=-180+r()*400,fy=200-r()*260*fill;E(fx,fy,26+r()*14,20+r()*10,r()*3);ctx.fillStyle=['#f4a261','#90be6d','#e9c46a','#e76f51'][i%4];ctx.fill();ctx.strokeStyle='rgba(43,33,24,.5)';ctx.lineWidth=4;ctx.stroke()}ctx.restore();shape();ctx.strokeStyle=OL;ctx.lineWidth=8;ctx.stroke()}
  ctx.strokeStyle='rgba(180,60,100,.35)';ctx.lineWidth=6;[[-20,-60,140],[0,20,170],[20,100,150]].forEach(([dx,dy,w])=>{ctx.beginPath();ctx.moveTo(dx-w/2,dy);ctx.quadraticCurveTo(dx,dy+30,dx+w/2,dy);ctx.stroke()});
  gloss(80,-60,50,20,.5,.4);if(expr)face(60,40,1.1,expr,t);ctx.restore();ctx.restore()}
// sound waves radiating from a point; k = loudness 0..1
function soundWaves(x,y,t,k,col='#7b5ea7'){if(k<=0)return;ctx.save();noShadow();for(let i=0;i<4;i++){const u=((t*1.6+i/4)%1);ctx.globalAlpha=(1-u)*k;ctx.strokeStyle=col;ctx.lineWidth=10;ctx.lineCap='round';[-1,1].forEach(d=>{ctx.beginPath();ctx.arc(x,y,40+u*170*k,d>0?-.6:Math.PI-.6,d>0?.6:Math.PI+.6);ctx.stroke()})}ctx.restore()}


// ---------- highlight + data props ----------
// pulsing target ring on a body part, with an optional pill label
function ping(x,y,r,t,{col='#e63946',lab=null,ly=-1}={}){ctx.save();noShadow();
  const ph=(t*1.4)%1;ctx.globalAlpha=.5*(1-ph);ctx.strokeStyle=col;ctx.lineWidth=10;E(x,y,r*(1+ph*.6),r*(1+ph*.6));ctx.stroke();
  ctx.globalAlpha=1;const g=ctx.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,col+'88');g.addColorStop(1,col+'00');ctx.fillStyle=g;E(x,y,r,r);ctx.fill();
  ctx.strokeStyle=col;ctx.lineWidth=7;E(x,y,r*.82,r*.82);ctx.stroke();
  if(lab){ctx.font=`900 34px ${FONT}`;const w=ctx.measureText(lab).width+34,yy=y+ly*(r+40);ctx.beginPath();ctx.roundRect(x-w/2,yy-24,w,48,12);ctx.fillStyle=col;ctx.fill();text(lab,x,yy+2,34,{fill:'#fff',shadow:false})}
  ctx.restore()}
// a number that counts from a to b between s and s+dur; fmt(v) -> string
function counter(x,y,t,s,dur,a,b,{size=90,fmt=v=>Math.round(v)+'',col='#ffd60a',ease=easeOut}={}){if(t<s)return;const v=lerp(a,b,ease(clamp((t-s)/dur)));text(fmt(v),x,y,size,{fill:col,sw:size*.18})}
// phone with a "send to" share sheet (share prompt)
function sharePhone(x,y,s,t,who,st){ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.beginPath();ctx.roundRect(-150,-280,300,560,40);P(shadeFill(0,-280,0,280,'#343a40','#121416'),8);noShadow();
  ctx.beginPath();ctx.roundRect(-130,-250,260,500,26);ctx.fillStyle='#f8f9fa';ctx.fill();
  text('SEND TO',0,-200,32,{fill:'#5c677d',shadow:false});
  const k=pop(t,st+.2,.35);ctx.save();ctx.translate(0,-110);ctx.scale(k,k);ctx.beginPath();ctx.roundRect(-122,-48,244,96,20);ctx.fillStyle='#e9ecef';ctx.fill();E(-82,0,28,28);ctx.fillStyle='#ffb703';ctx.fill();face(-82,2,.3,'smug',t);
  ctx.font=`900 22px ${FONT}`;ctx.fillStyle=OL;ctx.textAlign='left';ctx.textBaseline='middle';who.split('\n').forEach((l,i)=>ctx.fillText(l,-46,-13+i*28));ctx.restore();
  const b=pop(t,st+.7,.3),press=t>st+1.4&&t<st+1.6?.92:1;ctx.save();ctx.translate(0,150);ctx.scale(b*press,b*press);ctx.beginPath();ctx.roundRect(-100,-36,200,72,36);ctx.fillStyle='#e63946';ctx.fill();text('SEND',0,2,36,{fill:'#fff',shadow:false});ctx.restore();
  ctx.restore()}

// ---------- generic cartoon person (front view) ----------
function person(x,y,s,t,{expr='calm',shirt='#4cc9f0',glow=0,germs=0,squish=0}={}){ctx.save();ctx.translate(x,y);ctx.scale(s,s*(1-squish));
  if(glow>0){const g=ctx.createRadialGradient(0,-120,20,0,-120,320);g.addColorStop(0,`rgba(180,255,220,${.55*glow})`);g.addColorStop(1,'rgba(180,255,220,0)');ctx.fillStyle=g;ctx.fillRect(-340,-460,680,680)}
  [[-38,1],[38,-1]].forEach(([lx])=>{ctx.beginPath();ctx.roundRect(lx-22,40,44,150,22);P('#3a3f47',6)});
  ctx.beginPath();ctx.roundRect(-85,-130,170,190,50);P(shadeFill(0,-130,0,60,shirt,mixHex(shirt.slice(1),'1d3557',.35)),7);
  [[-1],[1]].forEach(([d])=>{ctx.save();ctx.strokeStyle=OL;ctx.lineWidth=40;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(d*80,-100);ctx.lineTo(d*115,20);ctx.stroke();ctx.strokeStyle='#f6d2b3';ctx.lineWidth=28;ctx.stroke();ctx.restore()});
  E(0,-215,82,86);P(radial(0,-215,86,'#f8dcc3','#e4ad86'),7);ctx.save();ctx.shadowColor='rgba(0,0,0,0)';face(0,-208,.95,expr,t);ctx.restore();
  if(germs>0){const r=rng(5);for(let i=0;i<Math.floor(40*germs);i++){const gx=(r()-.5)*190,gy=-300+r()*480;if(gx<0)continue;ctx.save();ctx.shadowColor='rgba(0,0,0,0)';E(gx,gy,15,11,r()*3);P(['#7ae582','#9bf6ff','#cdb4db'][i%3],3);ctx.restore()}}
  ctx.restore()}
