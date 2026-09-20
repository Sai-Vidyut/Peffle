# Brag Plan: Peffle

## What is this app?
A local kill switch, spend cap, and human-approval gate for **tool calls**. No SaaS. No telemetry. One `npm install`. Peffle runs inside your agent process.

## The angle
README positioning, played straight: **Prompt instructions are not enforcement.** Side effects must run inside `peffle.guard()`. The hero beat is the real `examples/blocked-spend.ts` / README `spend-cap.mjs` flow — **CHARGED $8**, then **BLOCKED Budget exceeded: spent 13 would exceed limit 10** on a **$10** daily cap, then **`npx peffle kill shopper`**.

## Hook (first 2-3 seconds)
Full-screen terminal card: **Prompt instructions are not enforcement.** Peffle wordmark + “execution-time boundaries” subcopy. Penguin VO introduces runtime guardrails (not prompt hope).

## Key moments (the middle)
- `npm install peffle` → `npx peffle init`
- Policy editor: daily budget **limit 10**
- `peffle.guard` with **amount 8** → **CHARGED $8**
- Flow diagram: agent → Peffle → tool
- Second charge **$5** → **BLOCKED Budget exceeded: spent 13 would exceed limit 10** (verbatim)
- `npx peffle kill shopper` → **Killed agent shopper**

## Outro / punchline
**Peffle.** Tagline verbatim: **Stop an AI agent before it spends your money.**

## User flow worth showing
Install → init → cap → guard → allow → guard → block at execution time → kill switch.

## Tone
- Preset: polished + deadpan terminal
- Creative direction: macOS terminal aesthetic, sparse conversational VO, subtle SFX only (no music bed in final cut)
- Interpretation: product-accurate numbers and error strings; mascot supports, does not replace, the terminal proof

## Format: landscape — 1920x1080
## Duration: 32 seconds

## Visual identity
- Background: `#0C0F0D` / grid glow
- Accent allow: `#3DDC84` · block: `#FF5A4A` · Peffle cyan on flow box
- Fonts: IBM Plex Sans + IBM Plex Mono (system fallbacks in comp)
- Hero read: **BLOCKED Budget exceeded: spent 13 would exceed limit 10**

## Share copy (draft)
See `share-copy.txt`.

## Audio direction
- Narration: Edge TTS (`generate-voice.py`), 8 sparse lines aligned to scenes
- SFX: keyboard typing, allow confirm, error on block, switch on kill
- Music: **none** in shipped render (composition assets may retain unused track; not mixed in timeline)

## Storyboard (32s)

| Scene | Time | Beat |
|-------|------|------|
| 1 Meet | 0–3 | Hook line + Peffle intro |
| 2 Install | 3–6 | `npm install peffle` |
| 3 Init | 6–10 | `npx peffle init` checklist |
| 4 Cap | 10–14 | daily limit **10** in policy |
| 5 Guard | 14–16 | highlight `peffle.guard`, amount **8** |
| 6 Flow | 16–18 | agent → PEFFLE → tool (border highlights) |
| 7 Allowed | 18–22 | **CHARGED $8** on $10 cap |
| 8 Blocked | 22–26 | **$5** request → verbatim BLOCKED line |
| 9 Kill | 26–29 | kill CLI + **Killed agent shopper** |
| 10 Outro | 29–32 | wordmark + README tagline + install CTA |

Scene durations sum to **32.0s**.
