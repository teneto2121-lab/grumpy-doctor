#!/usr/bin/env python3
"""Convert the vector drawings on a PowerPoint slide to an SVG (for Servier Medical Art packs, CC BY 4.0).

Usage:  python3 tools/pptx2svg.py <unzipped_pptx_dir> <slide_number> <out.svg> [--no-text]
Handles groups, custom geometry (moveTo/lnTo/cubicBezTo/quadBezTo/close), basic preset shapes,
solid + linear/radial gradient fills, outlines, alpha, rotation and flips. Each shape keeps its
PowerPoint name as the SVG id so single organs can be found and animated.
"""
import math, re, sys, xml.etree.ElementTree as ET

NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
      'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
A = '{%s}' % NS['a']; Pn = '{%s}' % NS['p']
root_dir, slide_no, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
NO_TEXT = '--no-text' in sys.argv

# theme colours for schemeClr
theme = {}
try:
    th = ET.parse(f'{root_dir}/ppt/theme/theme1.xml').getroot()
    cs = th.find('.//a:clrScheme', NS)
    for el in cs:
        tag = el.tag.split('}')[1]; c = el[0]
        theme[tag] = c.get('val') if c.tag.endswith('srgbClr') else c.get('lastClr', '000000')
    theme.update({'tx1': theme.get('dk1', '000000'), 'bg1': theme.get('lt1', 'FFFFFF'), 'tx2': theme.get('dk2', '000000'), 'bg2': theme.get('lt2', 'FFFFFF')})
except Exception:
    pass

def clamp(v): return max(0, min(255, int(round(v))))
def color(el):
    """el = a:srgbClr / a:schemeClr / a:prstClr ... returns (hex, alpha)"""
    if el is None: return None, 1
    tag = el.tag.split('}')[1]; val = el.get('val', '000000')
    if tag == 'schemeClr': val = theme.get(val, '000000')
    elif tag == 'prstClr': val = {'black': '000000', 'white': 'FFFFFF', 'red': 'FF0000'}.get(val, '000000')
    elif tag == 'sysClr': val = el.get('lastClr', '000000')
    r, g, b = int(val[0:2], 16), int(val[2:4], 16), int(val[4:6], 16); alpha = 1
    for m in el:
        mt = m.tag.split('}')[1]; v = int(m.get('val', '100000')) / 100000
        if mt == 'alpha': alpha = v
        elif mt == 'lumMod': r, g, b = r * v, g * v, b * v
        elif mt == 'lumOff': r, g, b = r + 255 * v, g + 255 * v, b + 255 * v
        elif mt == 'shade': r, g, b = r * v, g * v, b * v
        elif mt == 'tint': r, g, b = r + (255 - r) * (1 - v), g + (255 - g) * (1 - v), b + (255 - b) * (1 - v)
    return '#%02x%02x%02x' % (clamp(r), clamp(g), clamp(b)), alpha

defs = []; gid = [0]
def fill_of(sppr, style):
    """returns svg fill attribute string"""
    for el in sppr:
        t = el.tag.split('}')[1]
        if t == 'noFill': return 'fill="none"'
        if t == 'solidFill':
            c, a = color(el[0]); return f'fill="{c}"' + (f' fill-opacity="{a:.3f}"' if a < 1 else '')
        if t == 'gradFill':
            gid[0] += 1; i = f'g{gid[0]}'; stops = ''
            for gs in el.findall('a:gsLst/a:gs', NS):
                c, a = color(gs[0]); stops += f'<stop offset="{int(gs.get("pos"))/1000:.1f}%" stop-color="{c}" stop-opacity="{a:.3f}"/>'
            lin = el.find('a:lin', NS); path = el.find('a:path', NS)
            if path is not None:
                defs.append(f'<radialGradient id="{i}" cx="50%" cy="50%" r="70%">{stops}</radialGradient>')
            else:
                ang = math.radians(int(lin.get('ang', '0')) / 60000) if lin is not None else 0
                x1, y1 = 50 - 50 * math.cos(ang), 50 - 50 * math.sin(ang); x2, y2 = 100 - x1, 100 - y1
                defs.append(f'<linearGradient id="{i}" x1="{x1:.1f}%" y1="{y1:.1f}%" x2="{x2:.1f}%" y2="{y2:.1f}%">{stops}</linearGradient>')
            return f'fill="url(#{i})"'
    if style is not None:
        fr = style.find('a:fillRef', NS)
        if fr is not None and len(fr) and fr.get('idx') != '0':
            c, a = color(fr[0]); return f'fill="{c}"'
    return 'fill="none"'

def stroke_of(sppr, style, k=1.0):
    ln = sppr.find('a:ln', NS)
    if ln is not None:
        if ln.find('a:noFill', NS) is not None: return 'stroke="none"'
        sf = ln.find('a:solidFill', NS)
        w = int(ln.get('w', '12700'))
        if sf is not None:
            c, a = color(sf[0]); return f'stroke="{c}" stroke-width="{w/k:.2f}"' + (f' stroke-opacity="{a:.3f}"' if a < 1 else '') + ' stroke-linejoin="round" stroke-linecap="round"'
    if style is not None:
        lr = style.find('a:lnRef', NS)
        if lr is not None and len(lr) and lr.get('idx') != '0':
            c, a = color(lr[0]); w = int(ln.get('w', '9525')) if ln is not None else 9525
            return f'stroke="{c}" stroke-width="{w/k:.2f}" stroke-linejoin="round"'
    return 'stroke="none"'

def geom_path(sppr, cx, cy):
    cg = sppr.find('a:custGeom', NS)
    if cg is not None:
        d = ''
        for p in cg.findall('a:pathLst/a:path', NS):
            pw, ph = int(p.get('w', cx) or cx or 1), int(p.get('h', cy) or cy or 1)
            sx, sy = (cx / pw if pw else 1), (cy / ph if ph else 1)
            P = lambda pt: f'{int(pt.get("x"))*sx:.0f},{int(pt.get("y"))*sy:.0f}'
            for c in p:
                t = c.tag.split('}')[1]; pts = c.findall('a:pt', NS)
                if t == 'moveTo': d += 'M' + P(pts[0])
                elif t == 'lnTo': d += 'L' + P(pts[0])
                elif t == 'cubicBezTo': d += 'C' + ' '.join(P(q) for q in pts)
                elif t == 'quadBezTo': d += 'Q' + ' '.join(P(q) for q in pts)
                elif t == 'close': d += 'Z'
        return f'<path d="{d}"'
    pg = sppr.find('a:prstGeom', NS)
    prst = pg.get('prst') if pg is not None else 'rect'
    if prst == 'ellipse': return f'<ellipse cx="{cx/2:.0f}" cy="{cy/2:.0f}" rx="{cx/2:.0f}" ry="{cy/2:.0f}"'
    if prst in ('line', 'straightConnector1'): return f'<path d="M0,0L{cx},{cy}"'
    return f'<rect width="{cx}" height="{cy}"'

def xfrm_attr(x):
    off, ext = x.find('a:off', NS), x.find('a:ext', NS)
    ox, oy, cx, cy = int(off.get('x')), int(off.get('y')), int(ext.get('cx')), int(ext.get('cy'))
    rot = int(x.get('rot', '0')) / 60000; fh = x.get('flipH') == '1'; fv = x.get('flipV') == '1'
    tf = f'translate({ox},{oy})'
    if rot: tf += f' rotate({rot:.3f},{cx/2:.0f},{cy/2:.0f})'
    if fh or fv: tf += f' translate({cx if fh else 0},{cy if fv else 0}) scale({-1 if fh else 1},{-1 if fv else 1})'
    return tf, cx, cy

def safe_id(s): return re.sub(r'[^A-Za-z0-9_-]', '_', s or '')

def walk(node, k=1.0):  # k = accumulated group scale (line widths are absolute EMU)
    o = ''
    for ch in node:
        t = ch.tag.split('}')[1]
        if t == 'sp':
            sppr = ch.find('p:spPr', NS); x = sppr.find('a:xfrm', NS) if sppr is not None else None
            if x is None: continue
            if NO_TEXT and ch.find('p:txBody', NS) is not None and sppr.find('a:custGeom', NS) is None: continue
            name = ch.find('p:nvSpPr/p:cNvPr', NS).get('name', '')
            tf, cx, cy = xfrm_attr(x); style = ch.find('p:style', NS)
            o += f'<g transform="{tf}" id="{safe_id(name)}">{geom_path(sppr, cx, cy)} {fill_of(sppr, style)} {stroke_of(sppr, style, k)}/></g>'
        elif t == 'grpSp':
            gp = ch.find('p:grpSpPr/a:xfrm', NS)
            if gp is None: o += walk(ch, k); continue
            off, ext, cho, che = gp.find('a:off', NS), gp.find('a:ext', NS), gp.find('a:chOff', NS), gp.find('a:chExt', NS)
            ox, oy, cx, cy = int(off.get('x')), int(off.get('y')), int(ext.get('cx')), int(ext.get('cy'))
            chx, chy, ccx, ccy = int(cho.get('x')), int(cho.get('y')), int(che.get('cx')) or 1, int(che.get('cy')) or 1
            rot = int(gp.get('rot', '0')) / 60000; fh = gp.get('flipH') == '1'; fv = gp.get('flipV') == '1'
            tf = f'translate({ox},{oy})'
            if rot: tf += f' rotate({rot:.3f},{cx/2:.0f},{cy/2:.0f})'
            if fh or fv: tf += f' translate({cx if fh else 0},{cy if fv else 0}) scale({-1 if fh else 1},{-1 if fv else 1})'
            tf += f' scale({cx/ccx:.6f},{cy/ccy:.6f}) translate({-chx},{-chy})'
            name = ch.find('p:nvGrpSpPr/p:cNvPr', NS).get('name', '')
            o += f'<g transform="{tf}" id="{safe_id(name)}">{walk(ch, k*math.sqrt(abs(cx/ccx*cy/ccy)))}</g>'
    return o

sl = ET.parse(f'{root_dir}/ppt/slides/slide{slide_no}.xml').getroot()
pres = ET.parse(f'{root_dir}/ppt/presentation.xml').getroot()
sz = pres.find('p:sldSz', NS); W, H = int(sz.get('cx')), int(sz.get('cy'))
body = walk(sl.find('p:cSld/p:spTree', NS))
open(out, 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W//4000}" height="{H//4000}"><defs>{"".join(defs)}</defs>{body}</svg>')
print('wrote', out, f'{len(body)//1000} kB')
