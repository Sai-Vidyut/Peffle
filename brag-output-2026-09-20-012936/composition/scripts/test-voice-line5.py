#!/usr/bin/env python3
"""Compare allowed-line phrasing inside one continuous take (writes tests/*.wav)."""
from __future__ import annotations

import asyncio
import re
import subprocess
from pathlib import Path

import edge_tts
from edge_tts import SubMaker

VOICE = "en-US-AvaMultilingualNeural"
RATE = "+3%"
PITCH = "+4Hz"

BASE = [
    "Hey! I'm Peffle. I'll help you keep your AI agent under control.",
    "First, install Peffle.",
    "Let's give it a spending limit.",
    "Now, every action goes through me.",
    None,  # variant slot
    "Whoa. Another thirty would push you over the limit.",
    "And if something goes wrong, you can shut it down.",
    "That's Peffle.",
]

VARIANTS = {
    "a-80-thats-fine": "$80? That's fine.",
    "b-eighty-bucks-sure": "Eighty bucks? Sure.",
    "c-yeah-eighty-is-fine": "Yeah, eighty dollars is fine.",
}


def parts(line: str) -> int:
    return len([p for p in re.split(r"(?<=[.!?])\s+", line.strip()) if p])


async def render_variant(name: str, line5: str, out: Path) -> None:
    lines = BASE.copy()
    lines[4] = line5
    full = " ".join(lines)
    comm = edge_tts.Communicate(full, VOICE, rate=RATE, pitch=PITCH, boundary="SentenceBoundary")
    sub = SubMaker()
    audio = bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "SentenceBoundary":
            sub.feed(chunk)
    tmp = out.with_suffix(".mp3")
    tmp.write_bytes(audio)
    counts = [parts(x) for x in lines]
    idx = sum(counts[:4])
    end = idx + counts[4] - 1
    start_s = sub.cues[idx].start.total_seconds() - 0.04
    end_s = sub.cues[end].end.total_seconds()
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{start_s:.3f}",
            "-to",
            f"{end_s:.3f}",
            "-i",
            str(tmp),
            "-ar",
            "48000",
            "-ac",
            "1",
            str(out),
        ],
        check=True,
        capture_output=True,
    )
    tmp.unlink(missing_ok=True)
    print(name, "->", out.name, line5)


async def main() -> None:
    root = Path(__file__).resolve().parents[1] / "assets" / "voice" / "tests"
    root.mkdir(parents=True, exist_ok=True)
    for name, text in VARIANTS.items():
        await render_variant(name, text, root / f"{name}.wav")


if __name__ == "__main__":
    asyncio.run(main())
