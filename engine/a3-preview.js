/* Preview UI only. The captured canvas#out is never drawing on top of controls. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).has('render')) return;   // headless stills/render: no preview loop

  const Z = window.Z;
  const $ = s => document.querySelector(s);
  const play = $('#play'), seek = $('#seek'), clock = $('#clock'), lineSel = $('#line');
  const status = $('#status'), notes = $('#notes'), audio = $('#audio');
  const FPS = 30, STEP = 1 / FPS;

  const fmt = t => {
    t = Math.max(0, t);
    const m = Math.floor(t / 60), s = Math.floor(t % 60), ms = Math.round((t - Math.floor(t)) * 1000);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
  };

  let film = null, playing = false, busy = false, lastFrame = -1, raf = 0, wanted = 0;
  const frameOf = t => Math.round(t * FPS);

  async function draw(t) {
    if (busy) { wanted = t; return; }
    busy = true;
    try {
      await Z.renderFrame(t);
      lastFrame = frameOf(t);
      clock.textContent = `${fmt(t)} / ${fmt(film.duration)}`;
    } catch (e) {
      status.textContent = '渲染出错：' + e.message;
      pause();
    } finally {
      busy = false;
      if (wanted !== t && playing) { const w = wanted; wanted = t; draw(w); }
    }
  }

  function pause() {
    playing = false; play.textContent = '▶ 播放';
    audio.pause();
  }
  function start() {
    if (!film) return;
    playing = true; play.textContent = '❚❚ 暂停';
    audio.play().catch(e => { playing = false; play.textContent = '▶ 播放'; status.textContent = '浏览器拦住了自动播放：' + e.message; });
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    if (!playing || !film) return;
    const t = audio.currentTime;
    if (frameOf(t) !== lastFrame) draw(t);
    if (t >= film.duration - 0.001) { pause(); }
  }

  function seekTo(t, { snap = true } = {}) {
    if (!film) return;
    t = Z.clamp(t, 0, film.duration);
    if (snap) t = frameOf(t) / FPS;
    try { audio.currentTime = t; } catch (e) { /* metadata not loaded yet */ }
    seek.value = t;
    draw(t);
  }

  function buildLineMenu() {
    const opt = (t, label) => {
      const o = document.createElement('option');
      o.value = String(t); o.textContent = `${fmt(t)}  ${label}`;
      lineSel.appendChild(o);
    };
    opt(0, '片头 · 恋爱如酒');
    film.lines.forEach(l => opt(l.start, l.text));
    opt(100.25, '（100.25–112.10 无字幕 · 34 图）');
    film.cues.forEach(c => opt(c.start, `卡点 · ${c.text}`));
    lineSel.addEventListener('change', () => seekTo(parseFloat(lineSel.value)));
  }

  window.ready.then(meta => {
    film = Z.A3;
    seek.max = String(film.duration);
    seek.value = '0';
    audio.src = Z.ROOT + film.master.path;
    audio.addEventListener('loadedmetadata', () => {
      if (Math.abs(audio.duration - film.duration) > 0.05) {
        status.textContent = `注意：音频时长 ${audio.duration.toFixed(3)} 秒，时间线按 ${film.duration} 秒排版。`;
      }
    });
    audio.addEventListener('ended', () => { pause(); });
    buildLineMenu();
    play.disabled = false; play.textContent = '▶ 播放';
    play.addEventListener('click', () => playing ? pause() : (audio.currentTime >= film.duration - .05 && seekTo(0), start()));
    seek.addEventListener('input', () => { const t = parseFloat(seek.value); pause(); seekTo(t); });
    document.getElementById('back').addEventListener('click', () => { pause(); seekTo((frameOf(seek.value) - 1) / FPS); });
    document.getElementById('forward').addEventListener('click', () => { pause(); seekTo((frameOf(seek.value) + 1) / FPS); });
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); playing ? pause() : start(); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); pause(); seekTo((frameOf(seek.value) - (e.shiftKey ? FPS : 1)) / FPS); }
      if (e.code === 'ArrowRight') { e.preventDefault(); pause(); seekTo((frameOf(seek.value) + (e.shiftKey ? FPS : 1)) / FPS); }
    });

    const c = film.timingConflicts.length;
    status.textContent = `${meta.shots} 个镜头 · ${film.lines.length} 句歌词 · ${film.cues.length} 个关键词卡点 · ${c} 处来源冲突`
      + ` · 音频 ${film.master.path}`;
    notes.textContent = [
      '操作：空格播放/暂停，← → 逐帧（按住 Shift 是一秒），下拉框逐句跳转。',
      '',
      ...(Z.A3.editorialNotes || []),
      '',
      `音频：${film.master.provenance}；${film.master.alignmentStatus}。`,
      '',
      '卡点冲突（原表未改）：',
      ...film.timingConflicts.map(x => `  ${x.cue.start.toFixed(2)}–${x.cue.end.toFixed(2)} ${x.cue.text}`
        + `（所在整句 ${x.activeSentence ? `${x.activeSentence.start.toFixed(2)}–${x.activeSentence.end.toFixed(2)} 「${x.activeSentence.text}」` : '无'}）`)
    ].join('\n');

    tick();
    draw(0);
  }).catch(e => {
    status.textContent = '加载失败：' + e.message;
  });
})();
