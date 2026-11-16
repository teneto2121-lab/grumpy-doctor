#!/usr/bin/env python3
"""Make a contact sheet of preview stills.  Usage: python3 tools/sheet.py episodes/<folder> out.jpg"""
import sys, glob, os, re
from PIL import Image
e, out = sys.argv[1], sys.argv[2]
fs = sorted(glob.glob(f'{e}/still_*.jpg'), key=lambda f: float(re.findall(r'still_([\d.]+)\.jpg', f)[0]))
ims = [Image.open(f).resize((270, 480)) for f in fs]
cols = 5; rows = (len(ims) + cols - 1) // cols
s = Image.new('RGB', (270 * cols, 480 * rows))
for i, im in enumerate(ims): s.paste(im, ((i % cols) * 270, (i // cols) * 480))
s.save(out)
for f in fs: os.remove(f)
