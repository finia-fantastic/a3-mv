/* Transparent Canvas2D ornaments. Time is in seconds. */
const C=value=>Math.max(0,Math.min(1,value));
const L=(a,b,t)=>a+(b-a)*t;
const E={
  inOutSine:t=>(1-Math.cos(Math.PI*t))/2,
  outCubic:t=>1-(1-t)**3
};
  const ornamentPaths={
    rose:[[[-1,1],[-9,-2],[-13,-9],[-7,-15],[3,-16],[12,-12],[14,-6],[7,1],[-1,1]],
      [[-8,-10],[-3,-6],[5,-7],[8,-11],[1,-13],[-3,-10],[2,-9]],
      [[3,1],[1,9],[-4,17]],[[0,11],[-8,6],[-14,7],[-8,12],[0,11],[9,7],[13,8],[7,12],[0,11]]],
    glass:[[[-12,-14],[12,-14],[11,-3],[7,3],[0,5],[-7,3],[-11,-3],[-12,-14]],
      [[-10,-6],[-4,-4],[3,-6],[10,-5]],[[0,5],[0,16],[-8,16],[8,16]]],
    lantern:[[[-10,-10],[10,-10],[14,-5],[14,9],[9,14],[-9,14],[-14,9],[-14,-5],[-10,-10]],
      [[-5,-10],[-5,-16],[5,-16],[5,-10]],[[0,-5],[-4,5],[0,10],[4,5],[0,-5]]],
    key:[[[-15,-4],[-10,-9],[-4,-9],[1,-4],[-4,1],[-10,1],[-15,-4]],
      [[0,-3],[17,11],[14,14],[10,10],[7,12],[4,9]]],
    crescent:[[[8,-16],[-3,-14],[-12,-7],[-14,2],[-9,11],[0,15],[9,13],[15,7],
      [5,8],[-2,3],[-4,-5],[0,-12],[8,-16]]],
    window:[[[-13,14],[-13,-6],[-7,-13],[0,-16],[7,-13],[13,-6],[13,14],[-13,14]],
      [[0,-15],[0,14]],[[-13,0],[13,0]]],
    candle:[[[-6,14],[-6,-3],[6,-3],[6,14],[-6,14]],[[0,-3],[0,-8]],
      [[0,-8],[-4,-12],[0,-19],[4,-12],[0,-8]],[[-12,14],[12,14]]],
    goblet:[[[-13,-12],[13,-12],[8,-1],[0,5],[-8,-1],[-13,-12]],[[0,5],[0,15],[-9,15],[9,15]]],
    meeting:[[[0,-10],[10,0],[0,10],[-10,0],[0,-10]]],
    thread:[[[-22,10],[-13,3],[-5,5],[3,-5],[12,-3],[22,-12]]],
    orbit:[[[-18,3],[-14,-7],[-5,-13],[7,-12],[16,-6],[19,2],[14,10],[4,14],[-8,12],[-18,3]],
      [[-23,9],[-12,9],[1,4],[13,-3],[24,-11]]],
    heart:[[[0,13],[-15,0],[-16,-7],[-11,-13],[-5,-13],[0,-7],[5,-13],[11,-13],[16,-7],[15,0],[0,13]]],
    spark:[[[0,-15],[0,15]],[[-15,0],[15,0]],[[-8,-8],[8,8]],[[-8,8],[8,-8]]],
    path:[[[-20,14],[-10,14],[-10,3],[2,3],[2,-8],[17,-8]],[[11,-14],[17,-8],[11,-2]]],
    steam:[[[-10,15],[-14,8],[-7,0],[-7,-6],[-11,-13]],[[5,15],[1,8],[8,0],[8,-6],[4,-13]]],
    ripple:[[[-16,0],[-8,-5],[0,-5],[8,0],[16,0]],[[-16,8],[-8,3],[0,3],[8,8],[16,8]]],
    eye:[[[-20,0],[-11,-8],[0,-11],[11,-8],[20,0],[11,8],[0,11],[-11,8],[-20,0]],
      [[0,-6],[5,0],[0,6],[-5,0],[0,-6]]],
    drop:[[[0,-15],[8,-4],[11,3],[9,10],[4,14],[-4,14],[-9,10],[-11,3],[-8,-4],[0,-15]]]
  };
  function drawOrnament(ctx,x,y,age,left,kind,scale=1){
    const p=C(age/.45);
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(scale,scale);
    ctx.globalAlpha=C(age/.14)*C(left/.25)*.9;
    ctx.strokeStyle='#fff';
    ctx.lineWidth=1.8;
    ctx.lineCap='round';
    ctx.lineJoin='round';
    ctx.shadowColor='#17101c';
    ctx.shadowBlur=4;
    const draw=(points,progress=1)=>{
      if(progress<=0)return;
      ctx.beginPath();
      ctx.moveTo(...points[0]);
      const segments=(points.length-1)*C(progress);
      for(let i=1;i<=Math.ceil(segments);i++){
        const a=C(segments-i+1);
        ctx.lineTo(L(points[i-1][0],points[i][0],a),L(points[i-1][1],points[i][1],a));
      }
      ctx.stroke();
    };
    if(kind==='toast'){
      const tap=Math.sin(Math.PI*C(age/.55));
      for(const side of [-1,1]){
        ctx.save();
        ctx.translate(side*(22-6*tap),0);
        ctx.rotate(-side*.3*tap);
        draw([[-9,-15],[9,-15],[11,-5],[7,2],[0,5],[-7,2],[-11,-5],[-9,-15]],p);
        draw([[0,5],[0,18]],C((age-.07)/.26));
        draw([[-7,18],[7,18]],C((age-.12)/.22));
        ctx.restore();
      }
      const spark=C((age-.22)/.16);
      ctx.globalAlpha*=spark*(1-C((age-.4)/.35));
      for(let i=-1;i<=1;i++)draw([[i*3,-20],[i*9,-23-8*spark]]);
    }else if(kind==='sky'){
      ctx.setLineDash([2,5]);
      draw([[-21,9],[0,-9],[22,2]],p);
      ctx.setLineDash([]);
      for(const [dx,dy,r,delay] of [[-21,9,5,0],[0,-9,10,.12],[22,2,6,.24]]){
        const q=C((age-delay)/.28);
        draw([[dx,dy-r],[dx+2,dy-2],[dx+r,dy],[dx+2,dy+2],[dx,dy+r],
          [dx-2,dy+2],[dx-r,dy],[dx-2,dy-2],[dx,dy-r]],q);
      }
    }else if(ornamentPaths[kind]){
      const float=E.inOutSine(C(age/.75));
      ctx.translate(kind==='path'?8*float:0,kind==='drop'?9*float:-3*float);
      ornamentPaths[kind].forEach((points,i)=>draw(points,C((age-.1*i)/.45)));
    }else if(kind==='ruleSweep'){
      draw([[-80,0],[62,0],[76,-8]],p);
      draw([[14,5],[56,5]],C((age-.18)/.3));
      const x=L(-80,62,p);
      draw([[x-4,0],[x,-3],[x+4,0],[x,3],[x-4,0]]);
    }else if(kind==='ruleTicks'){
      draw([[-72,0],[72,0]],p);
      for(let i=0;i<=12;i++){
        const x=-72+12*i;
        draw([[x,0],[x,i%3===0?-9:-4]],C((age-.032*i)/.16));
      }
    }else if(kind==='ruleSplit'){
      draw([[0,0],[-62,0],[-75,7]],p);
      draw([[0,0],[62,0],[75,-7]],p);
      ctx.setLineDash([3,5]);
      draw([[-48,6],[48,6]],C((age-.2)/.45));
    }else if(kind==='ruleScan'){
      draw([[-75,-4],[75,-4]],p);
      draw([[75,4],[-75,4]],C((age-.14)/.45));
      const x=L(-75,75,E.inOutSine(C(age/.8)));
      draw([[x,-10],[x,10]]);
    }else if(kind==='bottle'){
      ctx.rotate(-.24*E.inOutSine(C(age/.6)));
      draw([[-5,-22],[5,-22],[5,-10],[12,-3],[12,20],[-12,20],[-12,-3],[-5,-10],[-5,-22]],p);
      draw([[-12,6],[12,6]],C((age-.2)/.25));
      draw([[-12,13],[12,13]],C((age-.26)/.25));
    }else if(kind==='door'){
      draw([[-15,21],[-15,-21],[15,-21],[15,21]],p);
      const edge=L(15,1,E.inOutSine(C((age-.18)/.7)));
      draw([[-15,-21],[edge,-15],[edge,16],[-15,21]],C((age-.12)/.4));
      draw([[edge-4,2],[edge-2,2]],C((age-.45)/.2));
    }else if(kind==='clock'){
      ctx.beginPath();
      ctx.arc(0,0,17,-Math.PI/2,-Math.PI/2+Math.PI*2*p);
      ctx.stroke();
      const angle=-Math.PI/2+Math.PI/2*E.outCubic(C((age-.35)/.55));
      draw([[0,-8],[0,0],[Math.cos(angle)*12,Math.sin(angle)*12]],C((age-.24)/.24));
    }else if(kind==='lamp'){
      ctx.translate(0,-20);
      ctx.rotate(.13*Math.sin(age*5)*Math.exp(-age*1.4));
      draw([[0,0],[0,9],[-6,11],[-13,23],[13,23],[6,11],[0,9]],p);
      draw([[-4,27],[0,30],[4,27]],C((age-.22)/.24));
      draw([[-12,28],[-16,33]],C((age-.3)/.25));
      draw([[12,28],[16,33]],C((age-.3)/.25));
    }
    ctx.restore();
  }
export {drawOrnament};
export const ornaments=Object.freeze([...Object.keys(ornamentPaths),'toast','sky','bottle','door','clock','lamp','ruleSweep','ruleTicks','ruleSplit','ruleScan']);

export const screenRules=Object.freeze(['sweep','bands','scan']);

// Draw in the same coordinate space as the picture. Time is in seconds.
export function drawScreenRules(ctx,width,height,age,left,style='sweep'){
  const fade=C(age/.12)*C(left/.3);
  if(!fade||!screenRules.includes(style))return;
  ctx.save();
  ctx.strokeStyle='#fff';
  ctx.lineWidth=height/1080;
  const rows=style==='scan'?30:17;
  for(let row=0;row<rows;row++){
    const y=height*(row+.5)/rows;
    const progress=E.outCubic(C((age-.024*row)/.52));
    if(progress===0)continue;
    const reverse=row%2===1;
    const strong=row%4===0;
    ctx.globalAlpha=fade*(strong ? .42 : .19);
    ctx.beginPath();
    if(style==='bands'){
      const start=width*(.08+.055*(row%5));
      const end=width*(.64+.075*(row%4));
      ctx.moveTo(start,y);
      ctx.lineTo(L(start,end,progress),y);
      if(strong){
        ctx.moveTo(width*.94,y+6);
        ctx.lineTo(L(width*.94,width*.59,progress),y+6);
      }
    }else{
      const start=reverse?width:0;
      ctx.moveTo(start,y);
      ctx.lineTo(L(start,width-start,progress),y);
    }
    ctx.stroke();
  }
  if(style==='scan'){
    const y=height*C(age/1.2);
    ctx.globalAlpha=.55*fade*(1-C((age-1.05)/.15));
    ctx.lineWidth=2*height/1080;
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(width,y);
    ctx.stroke();
  }
  ctx.restore();
}