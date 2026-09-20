#!/usr/bin/env bash
# Grok TTS (xAI) — cute penguin voice: luna @ 1.12x
# Requires: export XAI_API_KEY=... from https://console.x.ai/
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/voice"
mkdir -p "$OUT"
KEY="${XAI_API_KEY:-}"
if [[ -z "$KEY" ]]; then
  echo "Set XAI_API_KEY (Grok/xAI console) and re-run." >&2
  exit 1
fi
gen() {
  local id="$1" text="$2"
  curl -sf -X POST "https://api.x.ai/v1/tts" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$text\",\"voice_id\":\"luna\",\"language\":\"en\",\"speed\":1.12,\"output_format\":{\"codec\":\"wav\",\"sample_rate\":48000}}" \
    -o "$OUT/${id}.wav"
  ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT/${id}.wav"
}
gen vo-1 "Hey! I'm Peffle. I help you control what your AI agents can do."
gen vo-3 "Done! Peffle is ready."
gen vo-4 "Let's give this agent a one hundred dollar daily limit."
gen vo-5 "Every action goes through Peffle."
gen vo-7 "Looks good!"
gen vo-8 "Wait! That would exceed your limit."
gen vo-9 "If something goes wrong, you can kill the agent."
echo "Wrote Grok Luna voice lines to $OUT"
