"""Export crisp Peffle mascot assets from the attached pixel logo."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

# Prefer the copy already in public/; fall back to Cursor assets attachment.
CANDIDATES = [
    Path(__file__).resolve().parents[1] / "public" / "pixil-frame-0.png",
    Path(
        r"C:\Users\Josh\.cursor\projects\e-Projects-peffle-Peffle\assets"
        r"\c__Users_Josh_AppData_Roaming_Cursor_User_workspaceStorage_"
        r"29764ca61de889d12712a61bad8ca32b_images_pixil-frame-0-bdfe5f06-47cc-4e69-b11d-981656342258.png"
    ),
]
PUBLIC = Path(__file__).resolve().parents[1] / "public"
APP = Path(__file__).resolve().parents[1] / "app"


def make_transparent(im: Image.Image) -> Image.Image:
    """Keep original colors; only punch out the solid black canvas."""
    im = im.convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0 or r + g + b < 18:
                px[x, y] = (0, 0, 0, 0)
    return im


def main() -> None:
    src = next((p for p in CANDIDATES if p.is_file()), None)
    if src is None:
        raise SystemExit("logo source not found")

    PUBLIC.mkdir(parents=True, exist_ok=True)
    APP.mkdir(parents=True, exist_ok=True)

    cleaned = make_transparent(Image.open(src))
    bbox = cleaned.getbbox()
    if bbox is None:
        raise SystemExit("empty image after cleanup")
    cropped = cleaned.crop(bbox)

    native = PUBLIC / "peffle-mascot.png"
    cropped.save(native, optimize=True)

    lg = cropped.resize(
        (cropped.width * 16, cropped.height * 16),
        resample=Image.Resampling.NEAREST,
    )
    lg.save(PUBLIC / "peffle-mascot-lg.png", optimize=True)

    side = max(cropped.width, cropped.height)
    icon = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    icon.paste(cropped, ((side - cropped.width) // 2, (side - cropped.height) // 2))
    icon.resize((side * 16, side * 16), resample=Image.Resampling.NEAREST).save(
        APP / "icon.png", optimize=True
    )

    print(f"source {src}")
    print(f"native {cropped.size} -> {native} ({native.stat().st_size} bytes)")
    print(f"lg {lg.size} ({(PUBLIC / 'peffle-mascot-lg.png').stat().st_size} bytes)")


if __name__ == "__main__":
    main()
