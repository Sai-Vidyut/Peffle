#!/usr/bin/env python3
"""Crop Peffle mascot PNG to penguin bounds; black → transparent."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "assets" / "peffle-mascot.png"
BLACK_MAX = 25
PAD = 4


def crop_penguin(src: Path | None = None) -> Path:
    path = src or DEST
    im = Image.open(path).convert("RGBA")
    a = np.array(im)
    rgb = a[:, :, :3].astype(int)
    fg = rgb.max(axis=2) > BLACK_MAX
    ys, xs = np.where(fg)
    if ys.size == 0:
        raise ValueError("no foreground pixels found")
    x0 = max(0, int(xs.min()) - PAD)
    y0 = max(0, int(ys.min()) - PAD)
    x1 = min(im.width, int(xs.max()) + 1 + PAD)
    y1 = min(im.height, int(ys.max()) + 1 + PAD)
    cropped = im.crop((x0, y0, x1, y1))
    ca = np.array(cropped)
    crgb = ca[:, :, :3].astype(int)
    dark = crgb.max(axis=2) <= BLACK_MAX
    ca[dark, 3] = 0
    out = Image.fromarray(ca, "RGBA")
    out.save(DEST, optimize=True)
    print(DEST, out.size)
    return DEST


if __name__ == "__main__":
    crop_penguin()
