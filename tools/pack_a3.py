"""Build the handoff zip for 本体: engine + assets + audio + analysis json + tooling.
Only the two fonts actually used are bundled; heavy regenerable folders are skipped.
Run: python -I tools/pack_a3.py
"""
from pathlib import Path
import zipfile, os

ROOT = Path(__file__).resolve().parents[1]
OUT = Path('I:/mv-20261117/render/A3_MV_环境包_v2.zip')
SKILL = Path('I:/vocaloid-style-mv-pipeline/skills/vocaloid-style-mv')

SKIP_DIRS = {'render', '.git', 'stems', 'asr', '__pycache__', '.pnpm'}
SKIP_FILES = {'audio/song.wav', 'audio/A3_master.wav'}
SKILL_FILES = ['SKILL.md']          # + references/** + scripts/**

def wanted(rel: Path) -> bool:
    parts = rel.parts
    if any(p in SKIP_DIRS for p in parts[:-1]):
        return False
    if str(rel).replace('\\', '/') in SKIP_FILES:
        return False
    if rel.suffix == '.part':
        return False
    return True

count = total = 0
OUT.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            f = Path(dirpath) / name
            rel = f.relative_to(ROOT)
            if not wanted(rel):
                continue
            z.write(f, Path('恋爱如酒_MV环境') / rel)
            count += 1; total += f.stat().st_size
    for f in SKILL.rglob('*'):
        if not f.is_file():
            continue
        rel = f.relative_to(SKILL)
        if rel.parts[0] == 'template' or (rel.parts[0] == 'scripts' and f.suffix not in {'.py', '.md'}):
            continue
        if rel.parts[0] not in {'references', 'scripts'} and f.name != 'SKILL.md':
            continue
        z.write(f, Path('恋爱如酒_MV环境') / 'docs' / '上游技能' / rel)
        count += 1; total += f.stat().st_size

print(f'{OUT}  {OUT.stat().st_size/1e6:.1f} MB  ({count} files, {total/1e6:.1f} MB raw)')
