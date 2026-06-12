# -*- coding: utf-8 -*-
"""OGP画像(1200x630)を生成する。初回セットアップ時に一度だけ実行。要Pillow。"""
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "img", "ogp.png")

W, H = 1200, 630
TEAL = (15, 118, 110)
TEAL_DARK = (17, 94, 89)
CREAM = (240, 253, 250)
AMBER = (251, 191, 36)

img = Image.new("RGB", (W, H), TEAL)
d = ImageDraw.Draw(img)

# 背景の斜めストライプ(さりげなく)
for x in range(-H, W + H, 120):
    d.line([(x, H), (x + H, 0)], fill=TEAL_DARK, width=34)

# 中央カード
d.rounded_rectangle([70, 110, W - 70, H - 110], radius=36, fill=CREAM)

# 電卓アイコン
cx, cy = 220, H // 2
d.rounded_rectangle([cx - 70, cy - 95, cx + 70, cy + 95], radius=18, fill=TEAL)
d.rounded_rectangle([cx - 50, cy - 75, cx + 50, cy - 35], radius=8, fill=CREAM)
for ix in range(3):
    for iy in range(2):
        bx = cx - 44 + ix * 44
        by = cy - 6 + iy * 48
        color = AMBER if (ix == 2 and iy == 1) else (255, 255, 255)
        d.ellipse([bx - 14, by - 14, bx + 14, by + 14], fill=color)

def font(size, bold=True):
    name = "meiryob.ttc" if bold else "meiryo.ttc"
    try:
        return ImageFont.truetype(os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", name), size)
    except OSError:
        return ImageFont.truetype(os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts", "msgothic.ttc"), size)

title_f = font(86)
sub_f = font(34, bold=False)

d.text((360, 235), "くらしの計算室", font=title_f, fill=(31, 41, 55))
d.text((364, 360), "毎日の「ちょっと計算したい」を3秒で", font=sub_f, fill=(107, 114, 128))

img.save(OUT, "PNG", optimize=True)
print(f"OGP画像を生成しました: {OUT} ({os.path.getsize(OUT) // 1024}KB)")
