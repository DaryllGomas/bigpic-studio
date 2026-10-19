"""Encode selected Atlas PNGs in place; requires ImageMagick. Run from this worktree."""
import subprocess
import sys
from pathlib import Path
src=Path(sys.argv[1])
media=Path('the-first-world/media')
chosen={
 'temple-hand':'01b-cottages',
 'temple-gold-low':'02b-temple',
 'vexahl':'04-citadel',
 'village':'05-nexus',
 'ascension':'06b-telor',
 'lantern-night':'07-lanterns',
 'midwinter':'08-midwinter',
 'lumi':'03-lumi',
}
def encode(name,out,size):
 subprocess.run(['magick',str(src/(name+'.png')),'-resize',size+'^','-gravity','center','-extent',size,'-quality','82',str(out)],check=True)
for dest,shot in chosen.items():
 encode(shot,media/f'shot-{dest}.webp','1600x900')
 encode(shot,media/f'shot-{dest}-800.webp','800x450')
for out,size in [('hero.webp','1672x941'),('hero-900.webp','900x507')]:
 encode('06b-telor',media/out,size)
encode('07-lanterns',media/'poster.webp','1280x720')
encode('06b-telor',Path('assets/card-god-game.webp'),'1800x675')
