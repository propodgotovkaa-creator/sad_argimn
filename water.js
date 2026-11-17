// Geometry is relative to the square in the sprite sheet, including its padding.
const fountainShapes = [
  { source: [.51,.445], basin: [.50,.558], jets: [-.071,-.03,.022,.059], lift: .01, spread: .25, pool: .30 },
  { source: [.51,.28], basin: [.50,.575], jets: [-.081,-.033,.028,.076], lift: .025, spread: .23, pool: .30 },
  { source: [.50,.085], basin: [.50,.237], jets: [-.108,-.055,0,.055,.108], lift: .046, spread: .14, pool: .18,
    tiers: [{source:[.30,.255],end:[.26,.542]},{source:[.70,.255],end:[.74,.542]}] },
];

const mix = (a,b,t) => a+(b-a)*t;
const seed = i => {
  const n = Math.sin(i*73.317+37.7)*13281.312;
  return n-Math.floor(n);
};

function trace(ctx,start,end,lift,phase,strength,width,{horizontal=false}={}) {
  const [x0,y0] = start;
  const [x1,y1] = end;
  const scale = Math.hypot(x1-x0,y1-y0);
  const point = t => [
    mix(x0,x1,t)+Math.sin(t*38-phase*15)*.35*t,
    horizontal ? y0+(y1-y0)*t*t-lift*4*t*(1-t) : mix(y0,y1,t)-lift*4*t*(1-t),
  ];
  const line = (a,b) => {
    ctx.beginPath();
    for(let i=0;i<=10;i++) {
      const [x,y]=point(mix(a,b,i/10));
      if(i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    ctx.stroke();
  };

  ctx.lineCap='round';
  ctx.strokeStyle='rgba(47,100,100,.22)';
  ctx.lineWidth=Math.max(1,width+1.1);
  ctx.globalAlpha=strength;
  line(0,1);
  const tint=ctx.createLinearGradient(x0,y0,x1,y1);
  tint.addColorStop(0,'rgba(226,242,229,.48)');
  tint.addColorStop(.42,'rgba(168,209,203,.42)');
  tint.addColorStop(.85,'rgba(192,225,217,.59)');
  tint.addColorStop(1,'rgba(207,238,222,.27)');
  ctx.strokeStyle=tint;
  ctx.lineWidth=width;
  line(0,1);

  for(let i=0;i<10;i++) {
    const offset = seed(i+Math.floor(x1)*13);
    const t = (phase*(.9+offset*.38)+i*.102+offset*.08)%1;
    ctx.strokeStyle=i%3?'rgba(220,245,229,.56)':'rgba(255,255,240,.86)';
    ctx.lineWidth=Math.max(.45,width*(.33+offset*.35));
    line(t,Math.min(1,t+.016+offset*.06));
  }

  for(let i=0;i<7;i++) {
    const age = (phase*.94+i*.141)%1;
    const vx = (seed(i+65)-.5)*scale*.56;
    const vy = (.1+seed(i+49)*.22)*scale;
    const x=x1+vx*age;
    const y=y1-4*vy*age*(1-age);
    ctx.fillStyle='rgba(229,247,226,'+(.72*(1-age))+')';
    ctx.beginPath();
    ctx.ellipse(x,y,Math.max(.42,width*.36)*(1-age*.35),Math.max(.5,width*.48),vx*.04,0,Math.PI*2);
    ctx.fill();
  }
}

function ripples(ctx,x,y,radius,phase,strength) {
  ctx.lineWidth = .9;
  for(let i=0;i<3;i++) {
    const t=(phase*.53+i/3)%1;
    ctx.strokeStyle='rgba(226,246,225,'+(.54*(1-t)*strength)+')';
    ctx.beginPath();
    ctx.ellipse(x,y,.5+radius*t,.3+radius*t*.24,0,0,Math.PI*2);
    ctx.stroke();
  }
}

function drawPool(ctx,x,y,radius,time) {
  const water=ctx.createRadialGradient(x,y,.5,x,y,radius);
  water.addColorStop(0,'rgba(93,140,132,.56)');
  water.addColorStop(.67,'rgba(120,159,139,.33)');
  water.addColorStop(1,'rgba(149,187,169,.05)');
  ctx.fillStyle=water;
  ctx.beginPath();
  ctx.ellipse(x,y,radius,radius*.15,0,0,Math.PI*2);
  ctx.fill();
  ripples(ctx,x,y,radius*.70,time,.85);
}

function drawFountain(ctx,{x,y,size,variant},time) {
  const shape=fountainShapes[variant] ?? fountainShapes[0];
  const map=([u,v])=>[x+size*u,y+size*v];
  const source=map(shape.source);
  const width=Math.max(.7,size*.0098);
  const t=time*1.4;
  ctx.globalAlpha=1;
  const [basinX,basinY]=map(shape.basin);
  drawPool(ctx,basinX,basinY,size*shape.pool,t);
  if(shape.tiers) drawPool(ctx,x+size*.51,y+size*.545,size*.35,t+.3);
  for(const jet of shape.jets) {
    const end=map([shape.basin[0]+jet,shape.basin[1]+Math.abs(jet)*.23]);
    trace(ctx,source,end,size*(shape.lift+Math.abs(jet)*shape.spread),t+Math.abs(jet),.84,width);
  }
  for(const tier of shape.tiers ?? []) {
    trace(ctx,map(tier.source),map(tier.end),0,t+.4,.83,width*.85,{horizontal:true});
  }
  ctx.globalAlpha=1;
}

function drawPour(ctx,{target,can},elapsed) {
  if(elapsed < .31 || elapsed > 1.45) return;
  const strength=Math.min(1,(elapsed-.31)*8,(1.45-elapsed)*5);
  const [x,y,scale]=target;
  const [cx,cy]=can;
  const source=[cx+scale*.44,cy+scale*.055];
  for(let i=0;i<6;i++) {
    const spread=i-2.5;
    trace(ctx,[source[0]+spread*scale*.012,source[1]+spread*scale*.006],
      [x+spread*scale*.064,y+spread*scale*.018],scale*.011,elapsed*2+i*.1,
      strength,Math.max(.62,scale*.013),{horizontal:true});
  }
  ctx.globalAlpha=1;
  ripples(ctx,x,y,scale*.16,elapsed*2,strength*.8);
}

export function addWater(scene,{fountains,pour}) {
  if(!fountains.length&&!pour) return;
  const canvas=document.createElement('canvas');
  canvas.className='water-canvas';
  canvas.setAttribute('aria-hidden','true');
  scene.append(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr=Math.min(2,window.devicePixelRatio || 1);
  let start;
  function frame(now) {
    if(!scene.isConnected) return;
    start??=now;
    const width=scene.clientWidth;
    const height=scene.clientHeight;
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)) {
      canvas.width=Math.round(width*dpr);
      canvas.height=Math.round(height*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    const elapsed=(now-start)/1000;
    for(const {point,size,variant} of fountains) {
      const scale=width*size/100;
      drawFountain(ctx,{x:width*point[0]/100-scale*.5,y:height*point[1]/100-scale*.77,
        size:scale,variant},reduced?.25:now/1000);
    }
    if(pour) {
      const scale=width*.125;
      const [x,y]=[pour[0]*width/100,pour[1]*height/100];
      drawPour(ctx,{target:[x,y,scale],can:[x-scale*.56,y-scale*.63]},reduced?.7:elapsed);
    }
    if(!reduced) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
