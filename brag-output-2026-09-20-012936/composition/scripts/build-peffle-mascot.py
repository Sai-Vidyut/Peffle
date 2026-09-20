#!/usr/bin/env python3
"""Install Peffle mascot PNG from image-to-html export."""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = Path.home() / "Downloads" / "image-to-html.zip"
PNG_IN_ZIP = Path("/tmp/image-to-html-peffle/images/image.png")
DEST = ROOT / "assets" / "peffle-mascot.png"

DEFAULT_ZIP_PNG = Path.home() / "Downloads" / "image-to-html" / "images" / "image.png"


def main() -> None:
    if PNG_IN_ZIP.is_file():
        src = PNG_IN_ZIP
    elif DEFAULT_ZIP_PNG.is_file():
        src = DEFAULT_ZIP_PNG
    elif (ROOT / "assets" / "peffle-mascot.png").is_file():
        print("already installed", DEST)
        return
    else:
        raise SystemExit(f"Extract {SRC} first or place image at {DEST}")
    shutil.copy2(src, DEST)
    import subprocess
    subprocess.run([__import__("sys").executable, str(ROOT / "scripts" / "crop-peffle-mascot.py")], check=True)
    (ROOT / "compositions" / "components" / "peffle-mascot-inner.html").write_text(
        '<!-- PeffleMascot: assets/peffle-mascot.png from image-to-html -->\n'
        f'<img id="peffle-mascot" src="assets/peffle-mascot.png" width="438" height="380" alt="" aria-hidden="true" />\n',
        encoding="utf-8",
    )
    print("installed", DEST)


if __name__ == "__main__":
    main()
