// Shared pieces of the MYTH OR FACT format. Load after core.js + anatomy.js; the episode defines CASES.
// ---------- MYTH OR FACT format: scoreboard + case cards (needs a global CASES array) ----------
const COLS={FACT:{x:230,c:'#2a9d8f'},MYTH:{x:540,c:'#e63946'},KINDA:{x:850,c:'#f4a261'}};
function pill(x,y,str,col,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.font=`900 26px ${FONT}`;const w=Math.max(200,ctx.measureText(str).width+36);ctx.beginPath();ctx.roundRect(-w/2,-20,w,40,12);P('#fffdf7',4);text(str,0,2,26,{fill:OL,shadow:false});ctx.restore()}
window.board=function(t){
  if(t<3.15)return;
  ctx.save();ctx.beginPath();ctx.roundRect(60,790,W-120,176,22);ctx.fillStyle='rgba(255,253,247,.94)';ctx.fill();ctx.lineWidth=5;ctx.strokeStyle=OL;ctx.stroke();ctx.restore();
  // which case are we in, and is it in the "guess" window?
  let cur=-1;CASES.forEach((c,i)=>{if(t>=c.s)cur=i});const C=CASES[cur],guess=C&&t>C.s+.8&&t<C.v;
  Object.entries(COLS).forEach(([k,{x,c}])=>{
    const rt=window.__rt||t,lit=C&&t>=C.v&&t<C.v+1.2&&C.verdict===k;const pulse=guess?1+.06*Math.sin(rt*10+x):1;
    ctx.save();ctx.translate(x,828);ctx.scale(pulse*(lit?1.12:1),pulse*(lit?1.12:1));ctx.beginPath();ctx.roundRect(-115,-26,230,52,16);P(lit?c:mixHex(c.slice(1),'ffffff',.15),6);ctx.shadowColor='rgba(0,0,0,0)';text(k,0,2,34,{fill:'#fff',shadow:false});ctx.restore();
    if(guess)text('?',x+100,800,34,{fill:c,shadow:false,alpha:.5+.5*Math.sin(rt*8)});
  });
  // decided cases drop into their column
  const slots={FACT:0,MYTH:0,KINDA:0};
  CASES.forEach(c=>{if(t<c.v)return;const col=COLS[c.verdict],n=slots[c.verdict]++;const tx=col.x,ty=885+n*44,u=easeInOut(clamp(((window.__rt||t)-toVideo(c.v)-.15)/.5));
    if(u<=0)return;pill(lerp(540,tx,u),lerp(460,ty,u),c.tag,col.c,lerp(1.6,1,u))});
};

// ---------- props ----------
function claimBox(str,t,s){const k=pop(t,s,.3);if(k<=0)return;ctx.save();ctx.translate(W/2,245);ctx.scale(k,k);ctx.font=`900 46px ${FONT}`;const w=ctx.measureText(str).width+60;ctx.beginPath();ctx.roundRect(-w/2,-42,w,84,20);P('#fff',6);text(str,0,3,46,{fill:OL,shadow:false});ctx.restore()}
function caseCard(n,t,s){const d=t-s;if(d<0||d>.85)return;const k=easeBack(clamp(d/.25))*(1-easeIn3(clamp((d-.65)/.2)));ctx.save();ctx.translate(W/2,480);ctx.rotate(-.06);ctx.scale(k,k);
  ctx.beginPath();ctx.roundRect(-190,-200,380,400,30);P(shadeFill(0,-200,0,200,'#ffffff','#e9ecef'),9);ctx.beginPath();ctx.roundRect(-190,-200,380,100,{upperLeft:30,upperRight:30,lowerLeft:0,lowerRight:0});P(shadeFill(0,-200,0,-100,'#ff5a65','#d62839'),9);
  ctx.shadowColor='rgba(0,0,0,0)';text('CASE',0,-148,64,{fill:'#fff',shadow:false});text(String(n),0,50,230,{fill:OL,shadow:false});ctx.restore()}
function verdictStamp(c,t){if(t<c.v||t>c.v+1.4)return;const col=COLS[c.verdict].c;stamp(c.verdict==='KINDA'?'KINDA.':c.verdict+'!',W/2,470,t,c.v,140,-.1,col)}
