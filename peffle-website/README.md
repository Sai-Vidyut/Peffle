# Peffle marketing site

Next.js App Router site for the Peffle npm package (guard, CLI, MCP). It is **not** published to npm; the CLI library lives at the repository root.

## Local development

From this directory:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm run start
```

## Deploy on Vercel

Import the [Peffle](https://github.com/Sai-Vidyut/Peffle) repository and set:

| Setting | Value |
|---------|--------|
| **Root Directory** | `peffle-website` |
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` (default) |

No environment variables are required for the current static marketing pages.

Update `metadataBase` in `app/layout.tsx` when a production domain is available.
