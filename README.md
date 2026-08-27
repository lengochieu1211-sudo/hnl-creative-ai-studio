# HNL Creative AI Studio v1.1.0

Web creative studio for image, design, mixed-media video, document-to-storyboard and Gemini-powered generation/editing.

This source is intentionally **local-first**: normal editing does not upload user media. AI calls happen only when the user explicitly runs an AI feature.

## Current verified architecture

- React + TypeScript + Vite.
- Universal Asset Library with original binary files persisted in IndexedDB.
- Project autosave/recovery; transient `blob:` URLs are not written into project backups.
- Canvas editor with selection, drag, resize, rotate, layers, basic filters and undo/redo.
- Multi-track timeline with clip move, cross-track move, trim, split, lock/hide/mute and zoom.
- Browser compositor for image + video + audio + text timeline clips.
- Local WebM video export (when MediaRecorder/WebM is available).
- PNG/JPG canvas export and multi-page PDF export.
- Full ZIP project backup containing `project.json`, manifest and original asset binaries.
- Real parsers for XLS/XLSX/CSV, PDF, DOCX, PPTX, TXT/MD/JSON. Legacy `.doc`/`.ppt` must be converted first.
- Creative Director / storyboard with local fallback and optional Gemini AI.
- Image generation/editing adapter and Fashion/Product workflows; no fake generated preview is shown when a provider returns no image.
- Gemini Omni Flash video generation/editing flow with image/video references.
- Capability registry separates Veo generation from Gemini Omni existing-video editing.
- Runtime Golden Test dashboard uses real assertions and `SKIPPED` for missing fixtures instead of hard-coded PASS.

## AI deployment modes

### A. GitHub Pages / static hosting — BYOK

Build only the frontend. The user enters their own Gemini API key in **AI Settings**.

- The key is never committed to GitHub.
- If the user chooses “Remember”, it is stored only in that browser's `localStorage`.
- The key is excluded from `project.json` and ZIP backups.
- AI requests are sent from that browser to the Gemini API.

```bash
npm install
npm run typecheck
npm test
npm run build:web
```

The Vite build uses relative asset URLs (`base: './'`) so it can run under a GitHub Pages repository sub-path.

A Pages workflow is included at `.github/workflows/pages.yml`.

### B. Secure backend mode

Use this when you do not want end users to enter their own API key.

Create `.env` from `.env.example` and set the server-side secret:

```env
GEMINI_API_KEY=your_server_secret
```

Then:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend detects the local HNL backend on port 3000 and uses the server proxy.

Production build:

```bash
npm run build
npm start
```

For a separately hosted frontend/backend, set `VITE_AI_API_BASE` at frontend build time to the secure API origin and add the frontend origin to backend `HNL_ALLOWED_ORIGINS`. The backend stays same-origin-only by default.

## Dependency lockfile note

A committed `package-lock.json` is required before treating a release as dependency-locked. This source was repaired in an offline container where `registry.npmjs.org` could not be resolved, so a trustworthy lockfile could not be generated locally without inventing dependency metadata.

The repository includes `.github/workflows/generate-lockfile.yml`. Run it manually once after pushing the source, download the `hnl-package-lock` artifact, place `package-lock.json` at repository root, commit it, then subsequent CI installs automatically switch from `npm install` to `npm ci`.

Do not hand-write or use a partial lockfile.

## Main commands

```bash
npm run dev          # Express + Vite development server on port 3000
npm run dev:web      # Static/BYOK Vite development only
npm run typecheck    # TypeScript validation
npm test             # Vitest unit tests
npm run build:web    # Static GitHub Pages build
npm run build        # Web + bundled Express server
npm start            # Run production server bundle
npm run preview      # Preview static Vite build
npm run clean
```

## AI model routing

The registry is intentionally conservative and must be updated when provider APIs change.

- `gemini-3.7-flash`: Creative Director / multimodal text reasoning.
- `gemini-3.1-flash-image`: image generation/editing.
- `veo-3.1-generate-preview` / Lite: generation capabilities exposed only where HNL implements them.
- `gemini-omni-flash-preview`: natural-language video generation/editing and image/video references through the Interactions API.

Do not mark a provider capability as supported unless the adapter implements it and a Golden Test can exercise it.

## Media persistence

Uploaded/generated binary assets are stored separately from editable project metadata:

```text
IndexedDB
├── projects       editable project metadata
├── assets         searchable asset metadata
└── assetBlobs     original image/video/audio/document Blob data
```

On reload, HNL recreates fresh runtime object URLs from `assetBlobs`. This prevents the old failure mode where a saved project contained expired `blob:` URLs.

## Export behavior

Implemented locally:

- PNG
- JPG
- multi-page PDF
- WebM video where the browser supports MediaRecorder/WebM
- Full project ZIP backup with original binary assets

Not falsely advertised:

- Browser MP4 is **not** labeled as available when no MP4 encoder/backend exists.
- Large/server-grade renders should use a backend renderer in a future release.

## Document parsing

- XLS/XLSX/CSV: SheetJS.
- PDF: PDF.js, with page markers retained in extracted text.
- DOCX: OOXML (`word/document.xml`) extraction.
- PPTX: per-slide OOXML extraction.
- TXT/MD/JSON: text parser.
- `.doc` / `.ppt`: explicitly reported as legacy formats requiring conversion; HNL does not pretend they parsed successfully.

## Video AI notes

The GitHub Pages BYOK adapter uses the Gemini Interactions REST API. For REST responses, video data is read from the interaction `steps` content; the SDK-only convenience field `output_video` is used only by the secure backend SDK route.

Small inline video references can be used by the current adapter. Large production video uploads should move to a secure backend/File API workflow rather than loading huge files into browser base64 memory.

## Golden verification

Open **Golden Tests** in the app. Results are one of:

- `PASS`: assertion actually ran and passed.
- `FAIL`: assertion ran and failed.
- `SKIPPED`: a real fixture/capability was not available; this is never converted into a fake PASS.

Current checks include asset binary persistence, project recovery, real canvas PNG render, timeline/asset reference integrity, real XLSX parsing, real PDF/DOCX/PPTX parsing when uploaded, AI capability routing, and browser WebM capability.

## GitHub Pages

1. Push this project to `main`.
2. In GitHub repository **Settings → Pages**, select **GitHub Actions** as the source.
3. The included workflow installs dependencies, runs TypeScript checks, unit tests and a production web build before deployment.
4. Do not add a shared Gemini secret to static frontend source. Use BYOK or a separate secure backend.

## Known boundaries in v1.1.0

This release hardens the core source but it is not claiming every item in the long-term HNL master specification is complete. Advanced items such as server MP4/4K rendering, large-file File API orchestration, speech transcription, active-speaker reframing, motion masks, full PWA/offline media packaging and batch production remain capability-gated/future work unless a real provider/engine is connected.

The project should prefer a truthful `unsupported / backend required / skipped` state over placeholder output.
