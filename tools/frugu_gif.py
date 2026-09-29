#!/usr/bin/env python3
"""
Anima il bidone "Frugu Frugu": le zampe frugano (oscillano a destra e a sinistra) e i rifiuti si muovono un po'.
Uso:   python3 frugu_gif.py immagine.jpg uscita.gif [--debug] [--transparent] [--width 90]
       --transparent  sfondo nero trasparente (per metterla sopra a una pagina)
       --width N      larghezza finale in pixel (la GIF viene rimpicciolita)
Serve: pip install pillow numpy

Come funziona (per capire e ritoccare):
  1. Ogni oggetto che si muove (zampa sx, zampa dx, lisca, lisca di pesce... ) è descritto da un poligono
     in coordinate dell'immagine ORIGINALE. Con --debug il programma salva 'debug_maschere.png' con i poligoni disegnati:
     se una zampa "taglia" male, ritocca i punti in OBJECTS.
  2. Si ricostruisce lo sfondo "pulito": le zone degli oggetti vengono riempite copiando i colori dei pixel vicini.
  3. Per ogni fotogramma ogni oggetto viene ruotato attorno a un perno (il punto dove resta attaccato al bidone)
     e spostato di poco, poi incollato sullo sfondo pulito.
  4. Il bordo anteriore del bidone viene incollato per ultimo, così le zampe sembrano uscire da dentro.
"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw

# ---------------- impostazioni ----------------
FRAMES = 24          # fotogrammi del ciclo (più alto = più fluido)
FRAME_MS = 60        # durata di un fotogramma in millisecondi
CROP = (150, 400, 560, 720)   # zona del bidone da animare (x0, y0, x1, y1): l'immagine viene tagliata qui
RIM_Y = 668          # da questa riga in giù c'è il bordo anteriore del bidone (resta sempre sopra alle zampe)

# Conversione dalle coordinate della lente d'ingrandimento (zoom x3 con origine 170,410) a quelle originali
def Z(points):
    return [(170 + x / 3.0, 410 + y / 3.0) for x, y in points]

# nome: (poligono, perno (x,y) originale, ampiezza rotazione in gradi, fase, ampiezza spostamento x, ampiezza spostamento y)
OBJECTS = {
    "zampa_sx": (Z([(290, 470), (335, 400), (395, 388), (440, 405), (462, 440), (505, 428), (525, 470), (528, 520),
                    (535, 560), (560, 640), (580, 700), (585, 790), (470, 795), (445, 760), (415, 700), (405, 620),
                    (385, 565), (330, 520), (300, 505)]),
                 (170 + 500 / 3.0, 668), 7.0, 0.0, 2.0, 1.5),
    "zampa_dx": (Z([(555, 500), (575, 470), (636, 448), (690, 462), (745, 505), (760, 545), (740, 600), (712, 650),
                    (700, 700), (695, 795), (585, 795), (590, 700), (600, 640), (575, 610), (560, 560)]),
                 (170 + 640 / 3.0, 668), 7.0, math.pi, 2.0, 1.5),
    "pesce": (Z([(145, 560), (185, 515), (240, 515), (290, 565), (300, 595), (270, 610), (215, 640), (170, 665),
                 (150, 620)]),
              (170 + 200 / 3.0, 410 + 660 / 3.0), 3.0, 1.0, 1.0, 1.5),
    "lisca": (Z([(225, 690), (230, 655), (300, 640), (345, 670), (350, 730), (300, 760), (240, 740)]),
              (170 + 290 / 3.0, 410 + 730 / 3.0), 4.0, 2.2, 1.5, 1.5),
    "buccia": (Z([(355, 740), (375, 690), (410, 682), (445, 740), (430, 775), (380, 770)]),
               (170 + 400 / 3.0, 410 + 770 / 3.0), 5.0, 3.3, 1.0, 2.0),
    "lattina": (Z([(790, 600), (880, 610), (930, 650), (930, 700), (890, 750), (800, 760), (735, 730), (730, 670)]),
                (170 + 830 / 3.0, 410 + 750 / 3.0), 4.0, 4.4, 1.5, 1.5),
}


# Linea (in coordinate del ritaglio) che separa la zampa sinistra da quella destra dove si toccano
SPLIT = [(200, 100), (200, 150), (202, 180), (213, 233), (213, 320)]


def side_mask(size, left=True):
    """Metà sinistra (o destra) del ritaglio rispetto alla linea SPLIT."""
    edge = 0 if left else size[0]
    poly = [(edge, SPLIT[0][1])] + SPLIT + [(edge, SPLIT[-1][1])]
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return m


def background_alpha(img):
    """Alpha 0 per il nero collegato ai bordi (lo sfondo), 255 altrove: i neri interni al disegno restano."""
    a = np.array(img.convert("RGB")).astype(np.int32).sum(axis=2)
    dark = a < 60
    h, w = dark.shape
    seen = np.zeros((h, w), bool)
    stack = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or seen[y, x] or not dark[y, x]:
            continue
        seen[y, x] = True
        stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    return Image.fromarray(np.where(seen, 0, 255).astype(np.uint8))


def polygon_mask(size, poly, grow=2):
    """Maschera 0/255 del poligono, leggermente allargata per includere il bordo scuro."""
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    if grow:
        from PIL import ImageFilter
        m = m.filter(ImageFilter.MaxFilter(2 * grow + 1))
    return m


def inpaint(img, mask):
    """Riempie i pixel della maschera copiando i colori vicini (a strati, dai bordi verso il centro)."""
    a = np.array(img.convert("RGB")).astype(np.float32)
    known = ~(np.array(mask) > 0)
    h, w = known.shape
    for _ in range(200):
        if known.all():
            break
        shifts = [(0, 1), (0, -1), (1, 0), (-1, 0)]
        acc = np.zeros_like(a)
        cnt = np.zeros((h, w), np.float32)
        for dy, dx in shifts:
            k = np.roll(np.roll(known, dy, 0), dx, 1)
            v = np.roll(np.roll(a, dy, 0), dx, 1)
            acc += v * k[..., None]
            cnt += k
        fill = (~known) & (cnt > 0)
        a[fill] = acc[fill] / cnt[fill][..., None]
        known = known | fill
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, dst = sys.argv[1], sys.argv[2]
    debug = "--debug" in sys.argv
    full = Image.open(src).convert("RGB")
    x0, y0, x1, y1 = CROP
    base = full.crop(CROP)
    size = base.size
    off = lambda p: (p[0] - x0, p[1] - y0)          # da coordinate originali a coordinate del ritaglio

    parts = {}
    union = Image.new("L", size, 0)
    for name, (poly, pivot, rot, phase, dx, dy) in OBJECTS.items():
        m = polygon_mask(size, [off(p) for p in poly])
        if name in ("zampa_sx", "zampa_dx"):            # le due zampe non devono rubarsi i pixel a vicenda
            m = Image.fromarray(np.minimum(np.array(m), np.array(side_mask(size, name == "zampa_sx"))))
        parts[name] = m
        union = Image.fromarray(np.maximum(np.array(union), np.array(m)))

    if debug:
        d = base.copy()
        dr = ImageDraw.Draw(d)
        for name, (poly, pivot, *_r) in OBJECTS.items():
            dr.polygon([off(p) for p in poly], outline=(255, 0, 0))
            px, py = off(pivot)
            dr.ellipse((px - 3, py - 3, px + 3, py + 3), outline=(0, 255, 0))
            dr.text((off(poly[0])[0], off(poly[0])[1] - 10), name, fill=(255, 255, 0))
        d.resize((size[0] * 3, size[1] * 3), Image.NEAREST).save("debug_maschere.png")
        print("Salvato debug_maschere.png")

    clean = inpaint(base, union)                      # sfondo senza gli oggetti mobili

    # bordo anteriore: resta sopra a tutto
    rim_top = RIM_Y - y0
    rim_mask = Image.new("L", size, 0)
    ImageDraw.Draw(rim_mask).rectangle((0, rim_top, size[0], size[1]), fill=255)

    frames = []
    for i in range(FRAMES):
        t = 2 * math.pi * i / FRAMES
        frame = clean.copy()
        for name, (poly, pivot, rot, phase, dx, dy) in OBJECTS.items():
            angle = rot * math.sin(t + phase)
            shift_x = dx * math.sin(t + phase + 1.3)
            shift_y = dy * math.sin(2 * t + phase)            # su e giù, più veloce: il "frugare"
            layer = Image.new("RGBA", size, (0, 0, 0, 0))
            layer.paste(base, (0, 0), parts[name])
            px, py = off(pivot)
            layer = layer.rotate(angle, resample=Image.BICUBIC, center=(px, py), translate=(shift_x, shift_y))
            frame.paste(layer, (0, 0), layer)
        frame.paste(base, (0, 0), rim_mask)                   # bordo anteriore sopra alle zampe
        if "--width" in sys.argv:
            width = int(sys.argv[sys.argv.index("--width") + 1])
            frame = frame.resize((width, round(size[1] * width / size[0])), Image.LANCZOS)
        if "--transparent" in sys.argv:
            alpha = background_alpha(frame)
            p = frame.convert("RGB").quantize(colors=255, method=Image.MEDIANCUT)
            arr = np.array(p)
            arr[np.array(alpha) == 0] = 255                       # indice 255 = trasparente
            p = Image.fromarray(arr, "P")
            p.putpalette(frame.convert("RGB").quantize(colors=255, method=Image.MEDIANCUT).getpalette()[:765] + [0, 0, 0])
            frames.append(p)
        else:
            frames.append(frame.convert("P", palette=Image.ADAPTIVE, colors=128))

    opts = {"transparency": 255} if "--transparent" in sys.argv else {}
    frames[0].save(dst, save_all=True, append_images=frames[1:], duration=FRAME_MS, loop=0, optimize=False, disposal=2, **opts)
    print(f"Creata {dst}: {FRAMES} fotogrammi, {size[0]}x{size[1]} px")


if __name__ == "__main__":
    main()
