#!/usr/bin/env python3
"""Peffle narration — one continuous Edge TTS take, split by sentence boundaries."""
from __future__ import annotations

import asyncio
import json
import re
import subprocess
from pathlib import Path

import edge_tts
from edge_tts import SubMaker

VOICE = "en-US-AvaMultilingualNeural"
RATE = "+2%"
PITCH = "+0Hz"
VOLUME = "-4%"

# Logical lines (sparse script). Keep $80 phrasing casual, same voice take as neighbors.
LINES: list[str] = [
    "Hey! Peffle here — prompt instructions are not enforcement. I guard tool calls at runtime.",
    "First, npm install peffle.",
    "Set a ten dollar daily spend cap.",
    "Every side effect runs inside peffle.guard.",
    "Eight dollars? Allowed.",
    "Five more would hit thirteen — blocked at the cap.",
    "Run npx peffle kill if you need to stop the agent.",
    "Peffle. Stop an AI agent before it spends your money.",
]


def sentence_parts(line: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+", line.strip())
    return [p for p in parts if p]


def line_sentence_counts() -> list[int]:
    return [len(sentence_parts(line)) for line in LINES]


async def synthesize_full(tmp_mp3: Path) -> SubMaker:
    full = " ".join(LINES)
    comm = edge_tts.Communicate(
        full,
        VOICE,
        rate=RATE,
        pitch=PITCH,
        volume=VOLUME,
        boundary="SentenceBoundary",
    )
    sub = SubMaker()
    audio = bytearray()
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "SentenceBoundary":
            sub.feed(chunk)
    tmp_mp3.write_bytes(audio)
    expected = sum(line_sentence_counts())
    if len(sub.cues) != expected:
        raise RuntimeError(f"Expected {expected} sentence cues, got {len(sub.cues)}")
    return sub


def slice_line(sub: SubMaker, cue_start: int, cue_end: int, src: Path, dest: Path) -> float:
    start_s = sub.cues[cue_start].start.total_seconds()
    end_s = sub.cues[cue_end].end.total_seconds()
    pad_in = 0.02
    pad_out = 0.05
    start_s = max(0.0, start_s - pad_in)
    dur = max(0.08, (end_s - start_s) + pad_out)
    # Plain decode + tiny fades only — no loudnorm/highpass (caused harsh/screechy speech).
    fade_out_start = max(0.0, dur - 0.018)
    af = f"afade=t=in:st=0:d=0.018,afade=t=out:st={fade_out_start:.4f}:d=0.018"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-ss",
            f"{start_s:.3f}",
            "-i",
            str(src),
            "-t",
            f"{dur:.3f}",
            "-af",
            af,
            "-ar",
            "48000",
            "-ac",
            "1",
            str(dest),
        ],
        check=True,
        capture_output=True,
    )
    probe = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(dest),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(json.loads(probe.stdout)["format"]["duration"])


async def main() -> None:
    root = Path(__file__).resolve().parents[1]
    vo = root / "assets" / "voice"
    vo.mkdir(parents=True, exist_ok=True)
    for old in vo.glob("vo-*.wav"):
        old.unlink()

    tmp = vo / "_full_take.mp3"
    sub = await synthesize_full(tmp)
    counts = line_sentence_counts()
    idx = 0
    durations: dict[str, float] = {}
    for n, count in enumerate(counts, start=1):
        end_idx = idx + count - 1
        path = vo / f"vo-{n}.wav"
        d = slice_line(sub, idx, end_idx, tmp, path)
        durations[f"vo-{n}"] = round(d, 3)
        print(f"vo-{n}: {d:.2f}s  ({LINES[n-1]!r})")
        idx = end_idx + 1
    tmp.unlink(missing_ok=True)

    meta = vo / "durations.json"
    meta.write_text(
        json.dumps(
            {
                "voice": VOICE,
                "rate": RATE,
                "pitch": PITCH,
                "mode": "single_take_sentence_split",
                **durations,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    asyncio.run(main())
