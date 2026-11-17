#!/usr/bin/env node
/* Dump the live timeline (engine/a3-timeline.js) to docs/A3_SHOTS.md + analysis/a3-shots.json.
 * The document is generated from the same objects the renderer uses, so it cannot drift.
 *   node tools/export_shots.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { ROOT, handleHelp, launchBrowser, gpuArgs } from './kit_env.mjs';

handleHelp('export_shots.mjs -- write docs/A3_SHOTS.md + analysis/a3-shots.json from the running timeline');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await launchBrowser({ headless: true, args: [...gpuArgs()] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`http://127.0.0.1:${server.address().port}/engine/a3.html?render`);
await page.evaluate(() => window.ready);
const data = await page.evaluate(() => ({
  film: { title: window.Z.A3.title, singer: window.Z.A3.singer, duration: window.Z.A3.duration, fps: window.Z.A3.fps },
  shots: window.Z.SHOTS.map(s => ({ id: s.id, t0: s.t0, t1: s.t1, image: s.args.image, kind: s.args.kind, from: s.args.from, to: s.args.to, trans: s.trans || null })),
  lines: window.Z.A3.lines, cues: window.Z.A3.cues, conflicts: window.Z.A3.timingConflicts, notes: window.Z.A3.editorialNotes
}));
await browser.close(); server.close();

const f = n => n.toFixed(2);
const lineAt = t => data.lines.find(l => t >= l.start && t < l.end);
const pct = v => `${Math.round(v * 100)}%`;
const cam = s => `${pct(s.from[0])}→${pct(s.to[0])}  x${s.from[1].toFixed(2)}→${s.to[1].toFixed(2)}  y${s.from[2].toFixed(2)}→${s.to[2].toFixed(2)}`;

const md = [];
md.push(`# 镜头表 / 时间轴`, '',
  `由 \`tools/export_shots.mjs\` 从运行时时间线生成，改 \`engine/a3-timeline.js\` 后重跑即可。`, '',
  `${data.film.title} · 演唱 ${data.film.singer} · ${data.film.duration} 秒 · ${data.film.fps} fps · ${data.shots.length} 个镜头`, '',
  '## 镜头', '',
  '| # | 起 | 止 | 秒 | 图 | 段 | 运镜（缩放 / x / y） | 入点歌词 |',
  '|---|---|---|---|---|---|---|---|');
data.shots.forEach((s, i) => {
  const l = lineAt(s.t0);
  md.push(`| ${String(i + 1).padStart(2, '0')} | ${f(s.t0)} | ${f(s.t1)} | ${f(s.t1 - s.t0)} | ${s.image}.png | ${s.kind} | \`${cam(s)}\` | ${l ? l.text : '—'} |`);
});

md.push('', '## 逐句字幕（权威表，未改动）', '', '| # | 起 | 止 | 日文 |', '|---|---|---|---|');
data.lines.forEach((l, i) => md.push(`| ${i + 1} | ${f(l.start)} | ${f(l.end)} | ${l.text} |`));

md.push('', '## 关键词卡点（权威表，未改动）', '', '| 起 | 止 | 词 | 所在整句 | 状态 |', '|---|---|---|---|---|');
data.cues.forEach(c => {
  const l = lineAt(c.start);
  const ok = l && l.text.includes(c.text);
  md.push(`| ${f(c.start)} | ${f(c.end)} | ${c.text} | ${l ? l.text : '—'} | ${ok ? '生效' : '**冲突，已在画面中停用**'} |`);
});

md.push('', '## 已知冲突与处理', '');
data.conflicts.forEach(c => md.push(
  `- \`${f(c.cue.start)}–${f(c.cue.end)} ${c.cue.text}\` 落在所在句（${c.activeSentence ? `${f(c.activeSentence.start)}–${f(c.activeSentence.end)}「${c.activeSentence.text}」` : '无'}）之外。`,
  `  原表未改；画面只在"整句里确实有这个字"时才播关键词，所以这三个不出现，避免把「苦い」打在「乾杯」那句上。`));
md.push('', '其它剪辑决定：', '', ...data.notes.map(n => `- ${n}`));

fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs/A3_SHOTS.md'), md.join('\n') + '\n');
fs.writeFileSync(path.join(ROOT, 'analysis/a3-shots.json'), JSON.stringify(data, null, 2) + '\n');
console.log(`docs/A3_SHOTS.md  (${data.shots.length} shots, ${data.lines.length} lines, ${data.cues.length} cues)`);
