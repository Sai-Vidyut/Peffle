#!/usr/bin/env python3
"""Pixel Peffle from reference art (chunky 8-bit, white dot eyes)."""
PX = 12
C = {
    "B": "#4a6178",
    "D": "#3a5068",
    "W": "#dce3eb",
    "O": "#e8942f",
    "G": "#50fa7b",
    "L": "#6b7888",
    "H": "#8a97a8",
}
ROWS = [
    "......BBBBBB......",
    "....BBBBBBBBBB....",
    "...BBBBWWWWBBBB...",
    "..BBBBWWWWWWBBBB..",
    "..BBBWWeeWWWWBBB..",
    "..BBBWWOOOWWWWBB..",
    "..BBBWWWWWWWWWBB..",
    "..BBWWWWWWWWWWBB..",
    "..BBWWWWWWWWWWBB..",
    "..BBWWWWWWWWWWBB..",
    "..BBWWWWWWWWWWBB..",
    "...BBWWWWWWWWBB...",
    "....BBBBBBBBBB....",
    "...DD........DD...",
    "...DD........DD...",
    "...DD....LLGGDD...",
    "...DD....LGGGDD...",
    "...DD....LLLLDD...",
    "....OO......OO....",
    "................",
]

def px(ch):
    return C.get(ch)

def emit():
    w, h = len(ROWS[0]) * PX, len(ROWS) * PX
    lines = [f'<svg viewBox="0 0 {w} {h}" width="{w}" height="{h}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">']
    lines.append('<g id="flipper-l">')
    for y, row in enumerate(ROWS):
        for x, ch in enumerate(row):
            if ch == "D" and x <= 2:
                lines.append(f'<rect x="{x*PX}" y="{y*PX}" width="{PX}" height="{PX}" fill="{C["D"]}"/>')
    lines.append("</g><g id=\"flipper-r\">")
    for y, row in enumerate(ROWS):
        for x, ch in enumerate(row):
            if ch == "D" and x >= len(row) - 3:
                lines.append(f'<rect x="{x*PX}" y="{y*PX}" width="{PX}" height="{PX}" fill="{C["D"]}"/>')
    lines.append("</g><g id=\"body\">")
    for y, row in enumerate(ROWS):
        for x, ch in enumerate(row):
            if ch in "BWO" and ch != "e":
                if ch in "GLH":
                    continue
                lines.append(f'<rect x="{x*PX}" y="{y*PX}" width="{PX}" height="{PX}" fill="{px(ch)}"/>')
            elif ch == "e":
                lines.append(f'<rect x="{x*PX}" y="{y*PX}" width="{PX}" height="{PX}" fill="#ffffff"/>')
            elif ch == "O":
                lines.append(f'<rect x="{x*PX}" y="{y*PX}" width="{PX}" height="{PX}" fill="{C["O"]}"/>')
    lines.append("</g>")
    lines.append('<g id="prop-device">')
    for y, row in enumerate(ROWS):
        for x, ch in enumerate(row):
            if ch == "L":
                lines.append(f'<rect x="{x*PX}" y="{y*PX}" width="{PX}" height="{PX}" fill="{C["L"]}"/>')
            elif ch == "G":
                lines.append(f'<rect x="{x*PX}" y="{y*PX}" width="{PX}" height="{PX}" fill="{C["G"]}"/>')
            elif ch == "H":
                lines.append(f'<rect x="{x*PX}" y="{y*PX}" width="{PX}" height="{PX}" fill="{C["H"]}"/>')
    lines.append("</g>")
    lines.append('<g id="eye-l"><rect x="72" y="48" width="12" height="12" fill="#ffffff"/><rect x="84" y="48" width="12" height="12" fill="#ffffff"/></g>')
    lines.append('<g id="eye-r"></g>')
    lines.append('<g id="lid-l" opacity="0"><rect x="72" y="48" width="24" height="12" fill="#4a6178"/></g>')
    lines.append('<g id="lid-r" opacity="0"></g>')
    lines.append('<g id="brow-l" opacity="0"><rect x="72" y="36" width="24" height="12" fill="#141820"/></g>')
    lines.append('<g id="brow-r" opacity="0"><rect x="120" y="36" width="24" height="12" fill="#141820"/></g>')
    lines.append('<g id="prop-laptop" opacity="0"><rect x="72" y="132" width="96" height="12" fill="#9aa7b5"/><rect x="60" y="144" width="120" height="36" fill="#c5ccd3"/><rect x="72" y="156" width="96" height="24" fill="#1a2830"/></g>')
    lines.append('<g id="prop-glasses" opacity="0"><rect x="72" y="48" width="24" height="12" fill="#101014"/><rect x="108" y="48" width="24" height="12" fill="#101014"/><rect x="96" y="54" width="12" height="6" fill="#101014"/></g>')
    lines.append("</svg>")
    return "\n".join(lines)

if __name__ == "__main__":
    print(emit())
