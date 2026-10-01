"""Generates placeholder transparent frame PNGs into public/frames. Replace them with your AI-made frames anytime."""
from PIL import Image, ImageDraw
import math, os
W, H = 1080, 1350
out = os.path.join(os.path.dirname(__file__), '..', 'public', 'frames')

def base(color, hole):
    im = Image.new('RGBA', (W, H), color)
    d = ImageDraw.Draw(im)
    x, y, w, h = hole
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=(0, 0, 0, 0))
    return im, d

def heart(d, cx, cy, s, fill):
    d.ellipse([cx - s, cy - s, cx, cy], fill=fill); d.ellipse([cx, cy - s, cx + s, cy], fill=fill)
    d.polygon([(cx - s, cy - s * .3), (cx + s, cy - s * .3), (cx, cy + s * 1.1)], fill=fill)

def star(d, cx, cy, r, fill):
    pts = []
    for i in range(8):
        a = math.pi / 4 * i - math.pi / 2; rr = r if i % 2 == 0 else r * .25
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=fill)

# Vintage Film
im, d = base((43, 33, 27, 255), (130, 140, 820, 1070))
for yy in range(150, 1250, 70):
    for xx in (45, 975):
        d.rounded_rectangle([xx, yy, xx + 60, yy + 40], 10, fill=(247, 243, 236, 255))
d.rectangle([130, 1215, 950, 1235], fill=(184, 92, 74, 255))
im.save(f'{out}/vintage-film.png')

# Scrapbook
im, d = base((239, 228, 208, 255), (90, 110, 900, 1000))
d.rectangle([90, 110, 989, 1109], outline=(36, 35, 33, 255), width=0)
for (x, y, pts) in [(60, 80, [(0, 30), (170, 0), (180, 50), (10, 80)]), (840, 70, [(0, 10), (170, 35), (160, 85), (-10, 60)])]:
    d.polygon([(x + a, y + b) for a, b in pts], fill=(217, 163, 154, 230))
d.rounded_rectangle([90, 1190, 560, 1215], 12, fill=(184, 92, 74, 255))
d.rounded_rectangle([90, 1235, 400, 1255], 10, fill=(221, 213, 200, 255))
im.save(f'{out}/scrapbook.png')

# Love Letter
im, d = base((243, 201, 207, 255), (100, 100, 880, 1040))
for cx, cy, s in [(150, 1240, 60), (260, 1270, 34), (930, 1230, 70), (830, 1275, 30), (540, 1230, 40)]:
    heart(d, cx, cy, s, (184, 92, 74, 255))
heart(d, 540, 60, 34, (255, 253, 248, 255))
im.save(f'{out}/love-letter.png')

# Cinema
im, d = base((17, 17, 17, 255), (60, 230, 960, 900))
d.rectangle([40, 210, 1039, 1149], outline=(201, 162, 85, 255), width=6)
d.rectangle([60, 230, 1019, 1129], fill=(0, 0, 0, 0))
d.rectangle([420, 1190, 660, 1200], fill=(201, 162, 85, 255))
im.save(f'{out}/cinema.png')

# Y2K
im, d = base((201, 184, 255, 255), (90, 120, 900, 1000))
d.rectangle([80, 110, 999, 1129], outline=(120, 240, 255, 255), width=10)
d.rectangle([90, 120, 989, 1119], fill=(0, 0, 0, 0))
for cx, cy, r in [(80, 90, 60), (1000, 130, 45), (140, 1240, 50), (940, 1250, 65), (540, 1215, 35)]:
    star(d, cx, cy, r, (255, 255, 255, 255))
im.save(f'{out}/y2k.png')
print('frames written')