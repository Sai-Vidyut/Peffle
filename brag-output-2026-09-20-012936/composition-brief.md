# Hyperframes Composition Brief: Peffle

## Objective
32s mascot-assisted product demo aligned with current README and `examples/blocked-spend.ts`.

## Output
- Composition: `brag-output-2026-09-20-012936/composition/`
- Video: `brag-output-2026-09-20-012936/brag.mp4`
- Poster: `brag-output-2026-09-20-012936/brag.jpg` (hero block frame ~23.8s, baked as frame 0)
- Format: 1920×1080 landscape

## Source material (current)
- `README.md` — positioning, spend-cap example, enforcement rule, CLI
- `examples/blocked-spend.ts` — $8 allow, $5 block, limit 10
- `src/cli/bin.ts` — `Killed agent ${agentId}`

## Copy that must appear verbatim
- Prompt instructions are not enforcement.
- CHARGED $8
- BLOCKED Budget exceeded: spent 13 would exceed limit 10
- Killed agent shopper
- Stop an AI agent before it spends your money.

## Numbers (non-negotiable)
- Daily cap: **$10**
- First charge: **$8**
- Second charge: **$5** (spent 13 exceeds limit 10)

## Creative direction
macOS terminal windows, penguin mascot with speech bubbles above, no prop overlays, no background music in render. VO via `scripts/generate-voice.py`.

## Hyperframes gate
```bash
cd brag-output-2026-09-20-012936/composition && npx hyperframes check
```

## Render
```bash
npx hyperframes render --quality looks --output ../brag.mp4
```

Storyboard detail: `brag-plan.md`.
