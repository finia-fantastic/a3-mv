# 《恋爱如酒》歌词 MV —— 环境包说明

这是一套可以直接跑的「静帧 + 歌词 + 运镜」MV 工程。没有 3D，画面只用九张原图，
靠镜头推拉、横移、切点和字幕排版出效果。原始管线是 EGSECDA/vocaloid-style-mv-pipeline（MIT，NikusonP），
这套是在它上面加的一层专用时间线。

## 一、先看

```bash
node tools/serve.mjs            # 起本地服务（带 Range，音频能拖动）
# 打开 http://127.0.0.1:8899/engine/a3.html
```

预览页：空格播放/暂停，← → 逐帧，按住 Shift 是一秒，右上角下拉框按句跳。
页面上是原曲播放 + 实时渲染，改完代码刷新即可。

## 二、出片

```bash
# 抽几张静帧（带联系表）
node tools/stills.mjs --url 'engine/a3.html?render' --times 0.6,8,15,26,28.9,62,101,174 \
  --out render/check --sheet check

# 整片（务必 --workers 1，串行；先问机器有没有人在用）
node tools/render_final.mjs --url 'engine/a3.html?render' --name A3_mv_v1 \
  --audio audio/A3_no_harmony.wav --workers 1
```

渲染是确定性的：每一帧只由歌曲时间 `t` 决定，可以任意跳帧、断点续渲。
显卡走 NVENC，没有 NVIDIA 就把 `--codec` 换成 x264。

## 三、这套做法（核心就四条）

1. **镜头全参数化。** 每个镜头只给 `[缩放, 平移x, 平移y]` 的起止值，`view()` 负责插值。
   缩放是相对「铺满画框」的倍数，平移是剩余裁切余量的百分比（0=最左/最上）。
   幅度必须 ≥12%，6% 那种在静图上肉眼看不出动。（这是第一版踩的坑。）
2. **字幕分两层时间。** 整句时间来自 `A3_aligned.tsv`（45 句），关键词卡点来自
   `A3_keyword_cues.tsv`（9 个），两者各自独立驱动，不互相推导，也绝不自己猜词内时间。
3. **字幕分层排版。** 完整歌词固定画面坐标（不跟镜头动，保证可读）；关键词做成大字，
   带错位残影和短促缩放；杯沿弧线、星芒画在图片坐标系里，跟着画面一起动。
4. **切点落在音乐上。** 段落切点用原方案表，副歌一律从 `34.png` 起镜。

改运镜就改 `engine/a3-timeline.js` 里的 `presets`（按图片）和 `Z.setup` 里的按类型覆盖
（`opening / street / return / chorusN / instrumental`）。

## 四、工程结构

| 路径 | 作用 |
|---|---|
| `engine/a3.html` | 预览 / 渲染入口（`?render` 只出画布，不显示控件） |
| `engine/a3-timeline.js` | 场景、镜头表、运镜、字幕排版、关键词特效 |
| `engine/a3-preview.js` | 预览页的播放/拖动/逐句跳转，不参与出片 |
| `engine/core/*` | 原管线引擎：Canvas2D 分层 + WebGL2 后处理 |
| `tools/serve.mjs` | 本地静态服务（支持 Range） |
| `tools/stills.mjs` | 抽静帧 + 联系表 |
| `tools/render_final.mjs` | 整片渲染 + 混音 |
| `tools/a3_prepare.py` | 从原始素材/歌词表生成 `analysis/a3-film.json`（已生成，不必重跑） |
| `assets/a3/*.png` | 九张原图（1/2/6/7/29/32/34/45/59） |
| `audio/A3_no_harmony.wav` | 本版音频（无和声） |
| `analysis/a3-film.json` | 45 句 + 9 个卡点 + 音频信息 |
| `docs/A3_SHOTS.md` | 47 个镜头的起止/用图/运镜参数/入点歌词（`tools/export_shots.mjs` 生成） |
| `lyrics/` | 三份权威时间轴原样存档 |

## 五、已知问题（别当成 bug 又查一遍）

1. **音频是「夜酒_无和声」版**，不是交接文档里的 `A3_mix.wav`（那份文件现在不在）。
   歌词时间沿用原表，**没有对这份录音做过回听校对**。
2. **三个「苦い」卡点与整句时间冲突**：28.52 / 41.16 / 86.00 都落在所在句结束之后。
   原表是权威输入，我一处没改，冲突记在 `analysis/a3-film.json` 的 `timingConflicts` 里。
3. **100.25–112.10 没有字幕**（原表本来就没有），这一段按间奏处理，画面停在 34 图。
4. **字体只带了两套**（Noto Serif JP、Dela Gothic One）。模板页面 `engine/index.html`
   会用到的其它字体没打进包，只有那页会 404，不影响 `a3.html`。
5. **JIZURA 没装**（上游要单独构建），所以字幕是原生 Canvas 排版，不是 JIZURA 字面。
6. 原图是 1536×864，出 1920×1080 要放大 1.25 倍，29/32 这种近景放大后会偏软。

## 六、别动

- `analysis/stems`、`analysis/asr` 没打进包（体积大，需要时用 UVR / whisper 重新生成）。
- 上游素材与歌词表是权威输入，改时间轴请改自己的副本，不要回写原表。
