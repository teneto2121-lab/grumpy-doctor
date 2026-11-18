#!/usr/bin/env python3
"""Crop a converted Servier slide SVG to a region (fractions of the slide) and strip label lines.
Usage: python3 tools/servier_crop.py in.svg out.svg x0 x1 y0 y1"""
import re, sys
s = open(sys.argv[1]).read(); x0, x1, y0, y1 = map(float, sys.argv[3:7])
W, H = map(float, re.search(r'viewBox="0 0 (\d+) (\d+)"', s).groups())
X0, Y0, w, h = x0 * W, y0 * H, (x1 - x0) * W, (y1 - y0) * H
s = re.sub(r'viewBox="[^"]+" width="\d+" height="\d+"', f'viewBox="{X0:.0f} {Y0:.0f} {w:.0f} {h:.0f}" width="1400" height="{1400*h/w:.0f}"', s, count=1)
s = re.sub(r'<g transform="[^"]*" id="[^"]*"><path d="M0,0L-?\d+,-?\d+"[^>]*/></g>', '', s)           # straight label lines
s = re.sub(r'<g transform="[^"]*" id="[^"]*"><path d="[^"]*" fill="none" stroke="#(bababa|949494|b2b2b2|0070c0)"[^>]*/></g>', '', s)  # grey/blue leader lines
open(sys.argv[2], 'w').write(s)
