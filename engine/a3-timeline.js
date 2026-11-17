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
  // Song-time cues follow the approved lyric starts. Values are peak zoom,
  // horizontal crop shift, vertical crop shift, and movement timing.
  const lyricCamera = [
    [7,.08,.08,0,'slow'],[9.63,.14,.02,-.05,'slow'],[12.87,.02,0,0,'hold'],
    [16.05,.07,-.05,0,'slow'],[19.37,.16,0,-.07,'slow'],[22.45,.08,0,-.03,'hold'],
    [25.17,.15,.02,.10,'late'],[27.89,.13,0,.09,'quick'],[31.17,-.16,0,0,'slow'],
    [35.33,.03,.19,0,'slow'],[38.51,.17,-.04,.11,'late'],[40.67,.15,0,.08,'quick'],
    [43.99,-.10,.05,0,'slow'],[48.17,.19,0,-.08,'slow'],[52.09,.10,.11,.04,'sway'],
    [57.63,.04,0,0,'hold'],[61.47,-.08,-.18,.04,'slow'],[64.81,.05,-.09,0,'slow'],
    [68.15,.09,.03,-.03,'hold'],[71.27,.14,0,.12,'slow'],[73.89,.13,0,-.08,'late'],
    [77.29,-.07,.07,0,'quick'],[80.65,.02,0,0,'hold'],[83.45,.20,.04,.13,'late'],
    [85.45,.15,0,.09,'quick'],[91.27,.18,0,.15,'late'],[93.29,.08,.13,0,'quick'],
    [96.89,.08,-.12,.04,'sway'],[112.1,.11,0,.08,'slow'],[115.49,.11,0,.10,'quick'],
    [118.67,.18,.01,-.07,'slow'],[121.87,.08,0,-.07,'hold'],[124.57,-.15,-.07,0,'slow'],
    [128.81,.20,0,-.12,'quick'],[131.81,.22,0,-.12,'slow'],[135.01,.36,0,-.21,'slow'],
    [138.05,.25,.12,.14,'quick'],[141.45,-.20,.14,0,'quick'],[144.45,.20,0,-.11,'slow'],
    [148.97,.13,0,.09,'slow'],[152.99,.23,0,.13,'hold'],[155.55,-.09,-.07,0,'slow'],
    [158.67,.18,0,-.09,'slow'],[162.67,-.06,.08,0,'hold'],[168.11,.32,0,-.16,'quick']
  ];
  const cameraByLine = new Map(lyricCamera.map(cue=>[cue[0],cue.slice(1)]));

  function view(a,p,lt,t){
    const line=Number.isFinite(t)?activeLine(t):undefined;
    const cue=line&&cameraByLine.get(line.start);
    const hold=cue?.[3]==='hold';
    const k=hold ? .5 : E.inOutSine(C(p));
    const v=a.from.map((n,i)=>L(n,a.to[i],k));
    if(a.kind==='toast')v[0]+=.032*E.outCubic(C(lt/.2));
    if(!cue)return v;
    const [zoom,dx,dy,motion]=cue;
    const age=t-line.start;
    const progress=C(age/Math.max(.1,line.end-line.start));
    const enter={
      slow:E.inOutSine(progress),
      late:E.outCubic(C((progress-.40)/.60)),
      quick:E.outCubic(C(age/.38)),
      hold:E.outCubic(C(age/.24)),
      sway:Math.sin(progress*Math.PI)
    }[motion];
    const release=E.inOutSine(C((line.end-t)/.24));
    const weight=enter*release;
    return [Math.max(1,v[0]+zoom*weight),C(v[1]+dx*weight),C(v[2]+dy*weight)];
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
  // A cue may only fire while a line that actually contains the word is on screen.
  // 28.52 / 41.16 / 86.00 (苦い) arrive after their sentence has ended; showing them over the
  // next line would caption the wrong word, so they are dropped rather than re-timed.
  function activeCue(t){
    const line=activeLine(t);
    if(!line)return null;
    return film.cues.find(c=>t>=c.start&&t<c.end&&line.text.includes(c.text))||null;
  }
  Z.scene('a3-plate',{
    preload:a=>[path(a.image)],
    async init(){
      await Promise.all([
        document.fonts.load('500 58px "Noto Serif JP"','恋ってお酒みたいでちょっと苦い'),
        document.fonts.load('400 150px "Dela Gothic One"','乾杯苦いお酒'),
        document.fonts.load('500 46px "A3 Chinese"','恋爱如酒演唱肥鱼爱吃大白饭我们的相遇会是意外吗'),
        document.fonts.load('700 100px "A3 Chinese"','恋爱如酒演唱肥鱼爱吃大白饭')
      ]);
      const warm=Z.canvas(1920,1080),cx=warm.getContext('2d');
      for(const id of [1,2,6,7,29,32,34,45,59]) cx.drawImage(Z.imgSync(path(id)),0,0,1920,1080);
    },
    draw(ctx,S){
      const img=Z.imgSync(path(S.args.image));
      if(!img) throw new Error('Missing approved plate '+S.args.image);
      const [z,px,py]=view(S.args,S.p,S.lt,S.t);
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
      if((activeLine(S.t)||(S.t>100.25&&S.t<112.10))&&!Z.A3.jizura){
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
  const lyricObjects=new Map([
    [7,'meeting'],[9.63,'thread'],[12.87,'orbit'],[16.05,'clock'],
    [19.37,'rose'],[22.45,'spark'],[25.17,'bottle'],[27.89,'toast'],
    [31.17,'orbit'],[35.33,'path'],[38.51,'bottle'],[40.67,'toast'],
    [43.99,'spark'],[48.17,'orbit'],[52.09,'steam'],[57.63,'lantern'],
    [61.47,'key'],[64.81,'clock'],[68.15,'sky'],[71.27,'glass'],
    [73.89,'goblet'],[77.29,'door'],[80.65,'window'],[83.45,'bottle'],
    [85.45,'toast'],[91.27,'candle'],[93.29,'ripple'],[96.89,'orbit'],
    [112.1,'sky'],[115.49,'toast'],[118.67,'ripple'],[121.87,'rose'],
    [124.57,'orbit'],[128.81,'eye'],[131.81,'crescent'],[135.01,'eye'],
    [138.05,'thread'],[141.45,'path'],[144.45,'drop'],[148.97,'glass'],
    [152.99,'toast'],[155.55,'clock'],[158.67,'sky'],[162.67,'thread'],
    [168.11,'drop']
  ]);
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
  function lyricOrnament(ctx,x,y,age,left,kind){
    const p=C(age/.45);
    ctx.save();
    ctx.translate(x,y);
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
    }else{
      ctx.translate(0,-20);
      ctx.rotate(.13*Math.sin(age*5)*Math.exp(-age*1.4));
      draw([[0,0],[0,9],[-6,11],[-13,23],[13,23],[6,11],[0,9]],p);
      draw([[-4,27],[0,30],[4,27]],C((age-.22)/.24));
      draw([[-12,28],[-16,33]],C((age-.3)/.25));
      draw([[12,28],[16,33]],C((age-.3)/.25));
    }
    ctx.restore();
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
    if(Z.A3.jizura) return;                       // JIZURA owns the body text; only the title card is drawn here
    const line=activeLine(t);
    // Instrumental passage (100.25–112.10): vocals genuinely stop here, so the sheet says nothing.
    // JIZURA's own convention for long interludes is to show the song title; do the same, quietly.
    if(!line && t>100.25 && t<112.10){
      const i=t-100.25, o=112.10-t;
      const a=Math.min(1,C(i/.8),C(o/.8))*.8;
      if(a>0){
        ctx.save();ctx.globalAlpha=a;
        ctx.font='700 86px "A3 Chinese","Microsoft YaHei",sans-serif';
        ctx.letterSpacing='12px';
        const w=ctx.measureText(film.title).width;
        ctx.shadowColor='rgba(4,2,8,.8)';ctx.shadowBlur=12;ctx.shadowOffsetY=3;
        ctx.fillStyle='#f4e8d6';ctx.fillText(film.title,(1920-w)/2,884);
        ctx.shadowBlur=0;ctx.shadowOffsetY=0;
        ctx.letterSpacing='0px';
        ctx.strokeStyle=GOLD;ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(130,918);ctx.lineTo(130+240*E.outCubic(C((i-.2)/.8)),918);ctx.stroke();
        star(ctx,104,862,6,0,.9);
        ctx.restore();
      }
    }
    if(line){
      const age=t-line.start,left=line.end-t;
      const chorus=line.text.startsWith('恋って')||line.text.startsWith('今夜は君と乾杯');
      // Whole sentence never changes position with camera or keyword accents.
      // Per-character mask reveal: the line types itself in one glyph at a time, then holds dead still.
      let size=chorus?68:62;
      ctx.font=`600 ${size}px "Noto Serif JP"`;
      const chars=[...line.text];
      let widths=chars.map(c=>ctx.measureText(c).width);
      let width=widths.reduce((a,b)=>a+b,0);
      if(width>1660){const k=1660/width;size=Math.max(44,Math.floor(size*k));
        ctx.font=`600 ${size}px "Noto Serif JP"`;
        widths=chars.map(c=>ctx.measureText(c).width);width=widths.reduce((a,b)=>a+b,0);}
      const y=884,stagger=Math.min(.02,.42/chars.length),HOT='苦い乾杯お酒';
      let x=(1920-width)/2;const x0=x;
      ctx.save();ctx.shadowColor='rgba(4,2,8,.85)';ctx.shadowBlur=10;ctx.shadowOffsetY=3;
      for(let i=0;i<chars.length;i++){
        const a=C((age-i*stagger)/.16)*C(left/.08);
        if(a>0){
          ctx.save();ctx.beginPath();
          ctx.rect(x-4,y-size*1.08,widths[i]+8,size*1.42);ctx.clip();
          ctx.globalAlpha=a;
          ctx.fillStyle=HOT.includes(chars[i])?GOLD:WHITE;
          ctx.fillText(chars[i],x,y+(1-a)*size*.52);
          ctx.restore();
        }
        x+=widths[i];
      }
      ctx.restore();
      const sweep=C((age-.16)/.3);
      if(sweep>0){
        ctx.globalAlpha=Math.min(1,C(left/.1));
        ctx.strokeStyle=GOLD;ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(x0,y+34);ctx.lineTo(x0+Math.min(240,width*.2)*E.outCubic(sweep),y+34);ctx.stroke();
        star(ctx,x0-26,y-22,chorus?8:5,0,.8);
      }
      // Per-line line-art motif (lyricObjects / lyricOrnament) is parked: under a two-line
      // subtitle it read as a stray glyph. Re-enable by calling lyricOrnament again.
      // Chinese reference line, one notch smaller, after the Japanese has landed.
      if(line.zh){
        const ca=C((age-.24)/.26)*C(left/.08);
        if(ca>0){
          let cz=46;
          ctx.font=`500 ${cz}px "A3 Chinese", "Source Han Serif SC", "Microsoft YaHei", sans-serif`;
          let cw=ctx.measureText(line.zh).width;
          if(cw>1480){cz=Math.max(30,Math.floor(cz*1480/cw));
            ctx.font=`500 ${cz}px "A3 Chinese", "Source Han Serif SC", "Microsoft YaHei", sans-serif`;
            cw=ctx.measureText(line.zh).width;}
          ctx.save();ctx.globalAlpha=ca*.95;
          ctx.shadowColor='rgba(4,2,8,.85)';ctx.shadowBlur=8;ctx.shadowOffsetY=2;
          ctx.fillStyle='#f1e5d3';
          ctx.fillText(line.zh,(1920-cw)/2,y+80+(1-ca)*10);
          ctx.restore();
        }
      }
    }
    const cue=activeCue(t);
    if(cue){
      const age=t-cue.start,len=cue.end-cue.start;
      const enter=C(age/.16),exit=C((len-age)/.14);
      // Exact supplied cues only: no inferred vocal/word timing.
      const zoom=age<.14?L(.92,1.05,E.outCubic(age/.14)):L(1.05,1,E.outCubic(C((age-.14)/.18)));
      ctx.save();ctx.globalAlpha=Math.min(enter,exit);ctx.translate(1585,812);ctx.scale(zoom,zoom);
      ctx.font='400 132px "Dela Gothic One"';ctx.textAlign='center';
      // Bright plates and white sleeves need a real scrim, not a 12px shadow.
      ctx.lineJoin='round';ctx.lineWidth=10;ctx.strokeStyle='rgba(14,8,18,.42)';ctx.strokeText(cue.text,0,0);
      ctx.lineWidth=3;ctx.strokeStyle='rgba(20,11,24,.95)';ctx.strokeText(cue.text,0,0);
      ctx.fillStyle=WHITE;ctx.fillText(cue.text,0,0);
      // Gold echo sliding out of the main word, then a rule that sweeps under it.
      ctx.globalAlpha*=.45*(1-C(age/.3));ctx.lineWidth=1.3;ctx.strokeStyle=GOLD;
      ctx.strokeText(cue.text,14*(1-enter),-11*(1-enter));
      if(cue.text==='お酒'){
        ctx.globalAlpha=Math.min(enter,exit);ctx.lineWidth=2.4;ctx.strokeStyle=GOLD;
        const w=ctx.measureText(cue.text).width;
        ctx.beginPath();ctx.moveTo(-w/2,18);ctx.lineTo(-w/2+w*E.outCubic(C(age/.3)),18);ctx.stroke();
      }
      ctx.restore();
    }
  }
  Z.setup=async()=>{
    const r=await fetch(Z.ROOT+'analysis/a3-film.json');
    if(!r.ok)throw new Error('Run tools/a3_prepare.py first: '+r.status);
    film=await r.json();Z.A3=film;
    window.__zankoMeta.duration=film.duration;window.__zankoMeta.fps=film.fps;

    // ---- JIZURA 字面 lyric layer (the pipeline's own text engine, upstream v0.10.1 bundle)
    let jzOn=false;
    try{
      const lr=await fetch(Z.ROOT+'analysis/lyrics_mv.lrc');
      const lrc=(lr.ok?await lr.text():'').replace(/^﻿/,'').replace(/^\[ti:.*\]\s*$/m,'');
      const _q=new URLSearchParams(location.search);
      const jzOptIn=_q.get('jz')==='1';
      const _style=_q.get('style'), _scheme=_q.get('scheme');
      if(lrc.trim()&&window.J&&window.JZ&&jzOptIn){
        JZ.setAudio({duration:film.duration,beats:Z.audio.beats,energy:null,energyRate:0});
        // Whitelist, not deny-list: the plates are pale portraits, so only layouts that keep type in a
        // readable band (or a vertical column) may be used. Anything not listed is off except 'none'.
        const KEEP = {
          layout: 'center vcols condensed tyLineFocus',
          enter: 'type wipe slice riseMask dropMask slideL slideR strokeDraw outlineFill blurStagger fadeStagger trackIn inkBleed',
          hold: 'still drift breathe sway float zoomSlow trackBreathe shimmer',
          exit: 'wipe drift sinkMask blurOut shrink foldOut',
          decor: 'brackets lines indexNum',
          treat: 'outline softShadow underline sizeWave kerningWide emphasisDots',
          fx: 'chroma rgbSplit whipBlur bloom',
          bg: '', cam: '', trans: ''
        };
        const enabled = {};
        for (const g of J.GROUP_KEYS) {
          const keep = new Set((KEEP[g] || '').split(/\s+/).filter(Boolean));
          enabled[g] = {};
          for (const k of J.order(g)) enabled[g][k] = k === 'none' || keep.has(k);
        }
        const common={enabled,lyrics:lrc,fps:30,res:1080,aspect:'16:9',seed:2611,unify:true,typeset:true,
          extra:true,wa:false,horror:false,
          colors:{accentOn:true,accent:GOLD,ghostA:'#39C6E0',ghostB:'#C8373A'},
          schemes:[0],                                      // sumi scheme 0: ink text on the pale plates
          fx:{motion:.55,glitch:.25,chroma:.5,decor:0,density:.12,texture:.45,flash:false,koma:12,hud:'off',bgSwitch:0}};
        await JZ.addPlan('main',Object.assign({},common,{style:_style||'sumi',mood:'editorial',centerFree:true,schemes:_scheme!=null?[_scheme]:common.schemes}));
        await JZ.addPlan('cf',Object.assign({},common,{style:'sumi',mood:'editorial',centerFree:true}));
        await JZ.addPlan('noir',Object.assign({},common,{style:'noir',mood:'glitch',
          fx:Object.assign({},common.fx,{glitch:.6,chroma:.75})}));
        jzOn=true;
      }
    }catch(e){console.warn('JIZURA lyric layer unavailable; falling back to the native text layer',e);}
    Z.A3.jizura=jzOn;
    Z.A3.plans=jzOn?{closeups:['32','29','34','45'],climax:['noir']}:null;
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
      const closeup=['32','29','34','45'].includes(String(image));
      const shot={id:`a3_${String(i+1).padStart(2,'0')}`,t0,t1:rows[i+1]?.[0]??film.duration,
        scene:'a3-plate',args:{image,kind,from,to,cupAnchor:[1080,610,160,36]},
        lyric:jzOn?'front':'none',plan:closeup?'cf':'main',hud:false,text,
        post:S=>({fade:S.t<.45?1-C(S.t/.45):C((S.t-(film.duration-2.4))/2.4)})};
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
