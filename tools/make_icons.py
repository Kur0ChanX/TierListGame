#!/usr/bin/env python3
"""Genera le icone dell'app in stile Apple: squircle (superellipse n=5, curvatura continua), vetro satinato,
riflesso morbido in alto, bordo luminoso sottile, ombra ampia. Uso: python3 tools/make_icons.py"""
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np, os

ROOT = os.path.join(os.path.dirname(__file__), '..', 'icons')
N = 5.0          # esponente della superellipse: 4 = quasi cerchio squadrato, 5 = squircle iOS
SS = 3           # supersampling

def squircle_mask(size, inset=0.0):
    s = size * SS
    y, x = np.mgrid[0:s, 0:s].astype(np.float32)
    c = (s - 1) / 2
    r = c * (1 - inset)
    v = (np.abs(x - c) / r) ** N + (np.abs(y - c) / r) ** N
    edge = 1.0 / r * 1.2                       # bordo antialias
    a = np.clip((1 - v) / (N * edge * 0.8) + 0.5, 0, 1)
    m = Image.fromarray((a * 255).astype(np.uint8), 'L')
    return m.resize((size, size), Image.LANCZOS)

def gradient(size, stops, angle_deg=160):
    s = size
    y, x = np.mgrid[0:s, 0:s].astype(np.float32) / (s - 1)
    th = np.deg2rad(angle_deg)
    t = (x * np.sin(th) - y * np.cos(th)); t = (t - t.min()) / (t.max() - t.min())
    out = np.zeros((s, s, 3), np.float32)
    pos = [p for p, _ in stops]
    for ch in range(3):
        out[..., ch] = np.interp(t, pos, [c[ch] for _, c in stops])
    return Image.fromarray(out.astype(np.uint8), 'RGB').convert('RGBA')

def radial(size, cx, cy, rad, color, alpha):
    s = size
    y, x = np.mgrid[0:s, 0:s].astype(np.float32)
    d = np.sqrt((x - cx * s) ** 2 + (y - cy * s) ** 2) / (rad * s)
    a = np.clip(1 - d, 0, 1) ** 2.2 * alpha             # caduta morbida (niente bande)
    img = np.zeros((s, s, 4), np.uint8); img[..., 0], img[..., 1], img[..., 2] = color; img[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(img, 'RGBA')

def build(size, bleed=False):
    """bleed=True: quadrato pieno senza angoli trasparenti (apple-touch-icon / maskable)."""
    S = size
    base = gradient(S, [(0, (126, 108, 255)), (0.5, (74, 52, 200)), (1, (26, 16, 92))], 158)
    base = Image.alpha_composite(base, radial(S, .22, .10, .95, (170, 150, 255), .55))
    base = Image.alpha_composite(base, radial(S, .95, 1.0, .75, (255, 110, 190), .32))
    logo = Image.open(os.path.join(ROOT, 'logo.png')).convert('RGBA')
    k = (0.70 if not bleed else 0.58) * S / max(logo.size)
    logo = logo.resize((int(logo.width * k), int(logo.height * k)), Image.LANCZOS)
    lx, ly = (S - logo.width) // 2, int((S - logo.height) / 2 + S * 0.005)
    sh = Image.new('RGBA', (S, S), (0, 0, 0, 0)); sh.paste(Image.new('RGBA', logo.size, (10, 6, 40, 255)), (lx, ly + int(S * .018)), logo)
    sh = sh.filter(ImageFilter.GaussianBlur(S * 0.022)); sh.putalpha(sh.getchannel('A').point(lambda v: int(v * .55)))
    base = Image.alpha_composite(base, sh)
    base.alpha_composite(logo, (lx, ly))
    # vetro: riflesso morbido nel terzo alto (ellisse molto larga, sfuma verso il basso)
    y, x = np.mgrid[0:S, 0:S].astype(np.float32) / (S - 1)
    sheen = np.clip(1 - ((y - 0.0) / 0.55), 0, 1) ** 1.6 * 0.20
    sheen *= np.clip(1 - np.abs(x - 0.5) * 0.9, 0.55, 1)
    sh_img = np.zeros((S, S, 4), np.uint8); sh_img[..., :3] = 255; sh_img[..., 3] = (sheen * 255).astype(np.uint8)
    base = Image.alpha_composite(base, Image.fromarray(sh_img, 'RGBA'))
    if bleed:
        return base.convert('RGB')
    m = squircle_mask(S)
    # bordo luminoso: anello tra squircle e squircle rimpicciolito, chiaro in alto e quasi assente in basso
    ring = ImageChops.subtract(m, squircle_mask(S, inset=0.014))
    grad_a = np.clip(1 - np.mgrid[0:S, 0:S][0].astype(np.float32) / (S * 0.85), 0.10, 1) ** 1.2
    ring_rgba = np.zeros((S, S, 4), np.uint8); ring_rgba[..., :3] = 255
    ring_rgba[..., 3] = (np.asarray(ring, np.float32) * grad_a * 0.75).astype(np.uint8)
    base = Image.alpha_composite(base, Image.fromarray(ring_rgba, 'RGBA'))
    base.putalpha(m)
    # ombra ampia e morbida (solo per le icone con angoli trasparenti)
    pad = int(S * 0.09); W = S + pad * 2
    out = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    shadow = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    sm = Image.new('L', (W, W), 0); sm.paste(m, (pad, pad + int(S * 0.025)))
    sm = sm.filter(ImageFilter.GaussianBlur(S * 0.04)).point(lambda v: int(v * 0.38))
    shadow.putalpha(sm); shadow.paste((20, 10, 60, 0), (0, 0, W, W), None)
    shadow = Image.merge('RGBA', (Image.new('L', (W, W), 20), Image.new('L', (W, W), 10), Image.new('L', (W, W), 60), sm))
    out = Image.alpha_composite(out, shadow); out.alpha_composite(base, (pad, pad))
    return out.resize((S, S), Image.LANCZOS)

def save(img, name):
    img.save(os.path.join(ROOT, name), optimize=True); print('ok', name, img.size, img.mode)

if __name__ == '__main__':
    save(build(1024).resize((512, 512), Image.LANCZOS), 'icon-512.png')
    save(build(768).resize((192, 192), Image.LANCZOS), 'icon-192.png')
    save(build(1024, bleed=True).resize((512, 512), Image.LANCZOS), 'icon-maskable-512.png')
    save(build(1024, bleed=True).resize((180, 180), Image.LANCZOS), 'apple-touch-icon.png')
    save(build(512).resize((64, 64), Image.LANCZOS), 'favicon-64.png')
