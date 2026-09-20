#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
VO=assets/voice
mkdir -p "$VO"
rm -f "$VO"/vo-*.wav "$VO"/vo-*.aiff

gen() {
  local id="$1" text="$2"
  npx hyperframes tts "$text" -v af_sky -s 0.92 -o "$VO/vo-${id}.wav" --json
}

gen 1 "Hey! I'm Peffle. I'll help you keep your AI agent under control."
gen 2 "First, install Peffle."
gen 3 "Let's give it a spending limit."
gen 4 "Now, every action goes through me."
gen 5 "Eighty dollars? That's fine."
gen 6 "Whoa. Another thirty would push you over the limit."
gen 7 "And if something goes wrong, you can shut it down."
gen 8 "That's Peffle."

python3 <<'PY'
import json, subprocess, os
vo = "assets/voice"
for i in range(1, 9):
    p = f"{vo}/vo-{i}.wav"
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", p],
        capture_output=True, text=True, check=True,
    )
    d = float(json.loads(r.stdout)["format"]["duration"])
    print(f"vo-{i}: {d:.2f}s")
PY
