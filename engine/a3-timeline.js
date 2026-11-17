/* A3 / 恋爱如酒. Nine approved stills only; deterministic song-time rendering.
   Original timing files remain untouched. See docs/A3_NOTES.md. */
(() => {
  'use strict';
  const Z=window.Z, C=Z.clamp, L=Z.lerp, E=Z.ease;
  const GOLD='#edc881', WHITE='#fff4dc';
  let film;
  const path=id=>`assets/a3/${id}.png`;
  // Coordinates are fractions of available crop overflow, 0 = left/top.
  // These initial crops and cup anchors require visual review.
  // [zoom, panX, panY]: panX/panY are fractions of the crop overflow, 0 = left/top edge visible.
  // Amplitudes are deliberately readable (12–30%), otherwise a still looks locked off.
  const presets={
    1:[[1.30,.94,.46],[1.05,.10,.44]],
    2:[[1.16,.36,.54],[1.02,.60,.48]],
    6:[[1.20,.40,.32],[1.06,.58,.54]],
    7:[[1.34,.96,.50],[1.05,.02,.50]],
    29:[[1.12,.50,.42],[1.24,.50,.58]],
    32:[[1.24,.32,.26],[1.10,.74,.54]],
    34:[[1.28,.64,.30],[1.02,.42,.52]],
    45:[[1.18,.46,.36],[1.03,.52,.52]],
    59:[[1.16,.58,.56],[1.00,.50,.50]]
  };
  const rows=[
    [0,1,'opening'],[7,1],[16.05,6],[22.45,32],
    [25.17,34,'chorus1'],[28.52,32,'bitter'],[30.62,29,'toast'],
    [31.17,1],[35.33,7,'street'],
    [38.51,34,'chorus2'],[41.16,32,'bitter'],[43.44,29,'toast'],
    [43.99,6],[48.17,1],[52.09,32],
    [57.63,2],[61.47,7,'return'],[68.15,59],
    [71.27,6],[73.89,32],[77.29,45],[80.65,59],
    [83.45,34,'chorus3'],[86,32,'bitter'],[88.2,29,'toast'],
    [91.27,6],[93.29,1],[96.89,32],
    [100.25,34,'instrumental'],[112.1,34,'chorus4'],
    [115.49,32,'editorial'],[116.98,29,'toast'],
    [118.67,6],[124.57,1],[128.81,32],
    [131.81,32],[138.05,29,'reach'],[141.45,7],[144.45,1],
    [148.97,34,'chorus5'],[152.99,32,'editorial'],[154.05,29,'editorial'],
    [155.55,1],[162.67,7],[168.11,45],
    [173.82,59,'outro'],[182,2,'outro']
  ];
  function view(a,p,lt){
    const k=E.inOutSine(C(p));
    const v=a.from.map((n,i)=>L(n,a.to[i],k));
    // Six-frame acceleration on a known toast cut; small and monotonic.
    if(a.kind==='toast') v[0]+=.032*E.outCubic(C(lt/.2));
    return v;
  }
  function star(ctx,x,y,r,angle=0,alpha=1){
    ctx.save();ctx.globalAlpha*=C(alpha);ctx.translate(x,y);ctx.rotate(angle);
    ctx.fillStyle=GOLD;ctx.beginPath();
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,rr=i%2?r*.2:r;
      const px=Math.cos(a)*rr,py=Math.sin(a)*rr;
      i?ctx.lineTo(px,py):ctx.moveTo(px,py);
    }ctx.closePath();ctx.fill();ctx.restore();
  }
  function activeLine(t){return film.lines.find(l=>t>=l.start&&t<l.end);}
  function activeCue(t){return film.cues.find(c=>t>=c.start&&t<c.end);}
  Z.scene('a3-plate',{
    preload:a=>[path(a.image)],
    async init(){
      await Promise.all([
        document.fonts.load('500 58px "Noto Serif JP"','恋ってお酒みたいでちょっと苦い'),
        document.fonts.load('400 150px "Dela Gothic One"','乾杯苦いお酒'),
        document.fonts.load('700 100px "A3 Chinese"','恋爱如酒演唱肥鱼爱吃大白饭')
      ]);
      const warm=Z.canvas(1920,1080),cx=warm.getContext('2d');
      for(const id of [1,2,6,7,29,32,34,45,59]) cx.drawImage(Z.imgSync(path(id)),0,0,1920,1080);
    },
    draw(ctx,S){
      const img=Z.imgSync(path(S.args.image));
      if(!img) throw new Error('Missing approved plate '+S.args.image);
      const [z,px,py]=view(S.args,S.p,S.lt);
      const scale=Math.max(S.W/img.width,S.H/img.height)*z;
      const w=img.width*scale,h=img.height*scale;
      const x=-(w-S.W)*C(px),y=-(h-S.H)*C(py);
      ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
      ctx.drawImage(img,0,0);
      // Motifs share the exact image transform. Anchor guesses are exposed for review.
      const cue=activeCue(S.t);
      if(S.args.image===32&&cue?.text==='苦い'){
        const a=S.args.cupAnchor,k=E.outCubic(C((S.t-cue.start)/.25));
        ctx.strokeStyle=GOLD;ctx.lineWidth=1.7;ctx.globalAlpha=.65;
        ctx.beginPath();ctx.ellipse(a[0],a[1],a[2],a[3],-.12,Math.PI,Math.PI+Math.PI*k);ctx.stroke();
        star(ctx,a[0]+a[2]*Math.cos(Math.PI+Math.PI*k),a[1]+a[3]*Math.sin(Math.PI+Math.PI*k),7,0,k);
      }
      if(S.args.image===29&&S.args.kind==='toast'){
        const k=C(S.lt/.65),a=1-k;
        [[820,390,0],[970,320,1],[1080,480,2]].forEach(([sx,sy,i])=>star(ctx,sx+40*k,sy-55*k,8+i*2,k*.7,a));
      }
      ctx.restore();
      // Readability gradient, never a separate text card.
      if(activeLine(S.t)){
        const g=ctx.createLinearGradient(0,660,0,1080);
        g.addColorStop(0,'rgba(12,8,17,0)');g.addColorStop(.55,'rgba(12,8,17,.52)');g.addColorStop(1,'rgba(12,8,17,.8)');
        ctx.fillStyle=g;ctx.fillRect(0,660,1920,420);
      }
      if(S.args.kind==='opening'){
        const g=ctx.createLinearGradient(880,0,1920,0);
        g.addColorStop(0,'rgba(11,7,15,0)');g.addColorStop(.32,'rgba(11,7,15,.5)');g.addColorStop(1,'rgba(11,7,15,.72)');
        ctx.fillStyle=g;ctx.fillRect(880,0,1040,1080);
      }
    }
  });
  function reveal(ctx,text,x,y,font,progress,color=WHITE){
    ctx.save();ctx.font=font;ctx.fillStyle=color;
    const width=ctx.measureText(text).width;
    ctx.beginPath();ctx.rect(x-8,y-200,(width+16)*C(progress),260);ctx.clip();
    ctx.fillText(text,x,y);ctx.restore();return width;
  }
  function text(ctx,S){
    const t=S.t;
    ctx.textBaseline='alphabetic';ctx.textAlign='left';
    if(t<7){
      const onset=Z.audio.beats[0],next=Z.audio.beats[1];
      const k=E.outCubic(C((t-onset)/(10/30))),out=C((7-t)/.35);
      ctx.globalAlpha=out;
      const x=1090,y=400;
      const width=reveal(ctx,film.title,x,y,'700 122px "A3 Chinese", "Microsoft YaHei", sans-serif',k);
      const line=E.outCubic(C((t-onset-2/30)/.4))*C((7-t)/.4);
      ctx.strokeStyle=GOLD;ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(x,y+44);ctx.lineTo(x+width*line,y+44);ctx.stroke();
      star(ctx,x+width*line,y+44,10,t*.35,k);
      const credit=E.outCubic(C((t-next)/(8/30)));
      ctx.globalAlpha=credit*out;
      ctx.font='400 36px "A3 Chinese", "Microsoft YaHei", sans-serif';ctx.fillStyle=GOLD;ctx.fillText('演唱',x,y+128);
      ctx.font='800 54px "A3 Chinese", "Microsoft YaHei", sans-serif';ctx.fillStyle=WHITE;
      ctx.fillText(film.singer,x,y+214+12*(1-credit));
      star(ctx,x+392,y+196,8,t,.5*(1-C((t-next-.3)/1)));
      return;
    }
    const line=activeLine(t);
    if(line){
      const age=t-line.start,left=line.end-t;
      const chorus=line.text.startsWith('恋って')||line.text.startsWith('今夜は君と乾杯');
      // Whole sentence never changes position with camera or keyword accents.
      const y=950,maxW=1660;let size=chorus?62:57;
      ctx.font=`500 ${size}px "Noto Serif JP"`;
      let width=ctx.measureText(line.text).width;
      if(width>maxW){size*=maxW/width;ctx.font=`500 ${size}px "Noto Serif JP"`;width=ctx.measureText(line.text).width;}
      const x=(1920-width)/2;
      ctx.globalAlpha=Math.min(1,C(age/.07),C(left/.07));
      ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=8;ctx.shadowOffsetY=2;
      ctx.fillStyle=WHITE;ctx.fillText(line.text,x,y);
      ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      const travel=C(age/.32);ctx.strokeStyle=GOLD;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x,y+28);ctx.lineTo(x+Math.min(118,width)*E.outCubic(travel),y+28);ctx.stroke();
      star(ctx,x-26,y-19,chorus?7:4,0,.75);
      // Quiet outline echo only at chorus line entry; readable main line is persistent.
      if(chorus&&age<.22){
        ctx.globalAlpha=.2*(1-age/.22);ctx.strokeStyle=GOLD;ctx.lineWidth=1;
        ctx.strokeText(line.text,x+10*(1-age/.22),y-9*(1-age/.22));
      }
    }
    const cue=activeCue(t);
    if(cue){
      const age=t-cue.start,len=cue.end-cue.start;
      const enter=C(age/.16),exit=C((len-age)/.14);
      // Exact supplied cues only: no inferred vocal/word timing.
      const zoom=age<.14?L(.92,1.05,E.outCubic(age/.14)):L(1.05,1,E.outCubic(C((age-.14)/.18)));
      ctx.save();ctx.globalAlpha=Math.min(enter,exit);ctx.translate(1510,765);ctx.scale(zoom,zoom);
      ctx.font='400 146px "Dela Gothic One"';ctx.textAlign='center';
      ctx.lineWidth=4;ctx.strokeStyle='rgba(25,13,27,.9)';
      ctx.shadowColor='rgba(10,7,14,.7)';ctx.shadowBlur=12;
      ctx.strokeText(cue.text,0,0);
      ctx.fillStyle=WHITE;ctx.fillText(cue.text,0,0);
      ctx.shadowBlur=0;ctx.lineWidth=1.5;ctx.strokeStyle=GOLD;
      ctx.globalAlpha*=.4*(1-C(age/.25));ctx.strokeText(cue.text,12*(1-enter),-9);
      ctx.restore();
    }
  }
  Z.setup=async()=>{
    const r=await fetch(Z.ROOT+'analysis/a3-film.json');
    if(!r.ok)throw new Error('Run tools/a3_prepare.py first: '+r.status);
    film=await r.json();Z.A3=film;
    window.__zankoMeta.duration=film.duration;window.__zankoMeta.fps=film.fps;
    Z.LOOK_DEFAULT={boil:0,lutMix:0,exposure:0,contrast:1,saturation:1,bloom:.08,bloomThreshold:.86,vignette:.12,grain:.012,ca:0,textCa:0};
    Z.SHOTS=rows.map(([t0,image,kind='verse'],i)=>{
      let [from,to]=presets[image].map(v=>v.slice());
      if(kind==='opening'){from=[1.50,.96,.46];to=[1.04,.08,.44];}
      if(kind==='return'){from=[1.42,.02,.50];to=[1.06,.94,.46];}
      if(kind==='street'){from=[1.42,.98,.50];to=[1.06,.00,.50];}
      if(kind.startsWith('chorus')){const n=Number(kind.slice(-1));from=[1.30-(n-1)*.025,.66,.30];to=[1.02,.42,.52];}
      if(kind==='instrumental'){from=[1.05,.50,.50];to=[1.22,.42,.40];}
      // Alternate push / pull between verses so the film never sits on one motion for long.
      if(kind==='verse'&&i%2){const t=from;from=to;to=t;}
      const shot={id:`a3_${String(i+1).padStart(2,'0')}`,t0,t1:rows[i+1]?.[0]??film.duration,
        scene:'a3-plate',args:{image,kind,from,to,cupAnchor:[1080,610,160,36]},
        lyric:'none',hud:false,text,
        post:S=>({fade:S.t<.45?1-C(S.t/.45):C((S.t-189.5)/(film.duration-189.5))})};
      if(i&&['outro','instrumental'].includes(kind)) shot.trans={type:'xfade',dur:.6};
      return shot;
    });
    Z.A3.activeLine=activeLine;Z.A3.activeCue=activeCue;Z.A3.view=view;
    Z.A3.editorialNotes=[
      '100.25–112.10: no supplied subtitle; image 34 held as instrumental passage.',
      '115.49, 138.05, 141.45, 144.45, 152.99, 154.05 and 182.00: editorial cut choices where exact cuts are unspecified.',
      '154.05 is an editorial image cut, not a claimed 乾杯 word onset.',
      'Cup anchor and crop focus need visual validation; master source identity unverified.'
    ];
    for(let i=0;i<Z.SHOTS.length;i++){
      const s=Z.SHOTS[i];if(!(s.t1>s.t0))throw new Error('Invalid shot '+s.id);
      if(i&&Math.abs(s.t0-Z.SHOTS[i-1].t1)>1e-6)throw new Error('Timeline gap');
    }
    for(const l of film.lines.filter(l=>l.text.startsWith('恋って'))){
      if(!Z.SHOTS.some(s=>s.t0===l.start&&s.args.image===34))throw new Error('Missing mandatory image34 at '+l.start);
    }
  };
})();
