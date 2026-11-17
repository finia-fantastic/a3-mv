"""Stage only the nine approved plates, authoritative timing, and exact master.
Run: python -I tools/a3_prepare.py
Existing files are never replaced unless byte-identical. No analysis/re-timing.
"""
from pathlib import Path
import csv, json, hashlib, shutil
ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('I:/mv-20261117')

def stage(src, dst):
    dst.parent.mkdir(parents=True, exist_ok=True)
    digest = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
    if dst.exists():
        if digest(src) != digest(dst):
            raise RuntimeError(f'Refusing to overwrite differing file: {dst}')
    else:
        shutil.copy2(src, dst)
    return {'path': str(dst.relative_to(ROOT)).replace('\\', '/'), 'sha256': digest(dst)}

def tsv(name):
    with (SOURCE / '歌词' / name).open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f, delimiter='\t'))

plates = [1,2,6,7,29,32,34,45,59]
manifest = [stage(SOURCE/'素材'/f'{i}.png', ROOT/'assets/a3'/f'{i}.png') for i in plates]
source_master = SOURCE/'音频/夜酒_无和声.wav'
master = stage(source_master, ROOT/'audio/A3_no_harmony.wav')
master['provenance'] = '夜酒_无和声.wav; explicitly selected by user'
master['sampleRate'] = 44100
master['sourceDuration'] = 191.541406
master['alignmentStatus'] = 'Existing lyric times retained; alignment against this recording not yet checked'
lines = [{'start': float(r['start_s']), 'end': float(r['end_s']), 'text':r['ja']} for r in tsv('A3_aligned.tsv')]
cues = [{'start':float(r['start_s']), 'end':float(r['end_s']), 'text':r['keyword']} for r in tsv('A3_keyword_cues.tsv')]
assert len(lines) == 45 and len(cues) == 9
assert all(l['end'] > l['start'] for l in lines)
assert all(a['end'] <= b['start'] for a,b in zip(lines,lines[1:]))
conflicts = []
for cue in cues:
    active = next((l for l in lines if l['start'] <= cue['start'] < l['end']), None)
    if active is None or cue['text'] not in active['text']:
        conflicts.append({'cue':cue, 'activeSentence':active, 'status':'source disagreement; unchanged'})
def lrc_stamp(t):
    m = int(t // 60)
    return f'[{m:02d}:{t - m * 60:05.2f}]'

def jizura_markup(text):
    """JIZURA markup only: *word* = emphasis cut, / = forced cut break, trailing ! = KIME line.
    The words and their times are untouched; this is typography, not re-timing."""
    t = text.replace('苦い', '*苦い*').replace('乾杯', '*乾杯*')
    t = t.replace('、もう一杯', '、/もう一杯', 1)
    return t

KIME = 148.97                      # last chorus: one KIME line only

lrc_lines = []
for l in lines:
    body = jizura_markup(l['text'])
    if abs(l['start'] - KIME) < 1e-6:
        body += '!'
    lrc_lines.append((l['start'], lrc_stamp(l['start']) + body))
lrc_lines.append((100.25, lrc_stamp(100.25) + '[間奏 11.85]'))
lrc_lines.sort(key=lambda x: x[0])
LRC = '\n'.join(x[1] for x in lrc_lines) + '\n'

DATA = {'title':'恋爱如酒','singer':'肥鱼爱吃大白饭','duration':191.541,'fps':30,
        'lines':lines, 'cues':cues, 'plates':manifest,'master':master,'timingConflicts':conflicts,
        'timingPolicy':'Sentence and keyword timestamps are separate authoritative inputs; no inferred word timing.'}
dst=ROOT/'analysis/a3-film.json'
text=json.dumps(DATA,ensure_ascii=False,indent=2)+'\n'
if dst.exists() and dst.read_text(encoding='utf-8') != text:
    previous = json.loads(dst.read_text(encoding='utf-8'))
    # Authorized audio change only; fail if other generated inputs drifted.
    for key in set(previous) | set(DATA):
        if key != 'master' and previous.get(key) != DATA.get(key):
            raise RuntimeError(f'Refusing unrelated generated-data change: {key}')
dst.write_text(text,encoding='utf-8')
lrc_dst = ROOT/'analysis/lyrics_mv.lrc'
if lrc_dst.exists() and lrc_dst.read_text(encoding='utf-8') != LRC:
    raise RuntimeError(f'Refusing to overwrite differing lyric file: {lrc_dst}')
lrc_dst.write_text(LRC, encoding='utf-8')
print(json.dumps({'plates':len(manifest),'lines':len(lines),'cues':len(cues),'conflicts':len(conflicts),'master':master,'data':str(dst),'lrc':str(lrc_dst)},ensure_ascii=False))
