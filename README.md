# Velocity Reader

A mobile-first speed-reading (RSVP) app built with React + Vite + Tailwind CSS.
Import a PDF or paste text, set a reading purpose, then read word-by-word at an
adjustable WPM. Documents and stats are saved locally in your browser.

> **Design source of truth:** [`docs/DESIGN.md`](docs/DESIGN.md). Read it before
> making changes (enforced by `.windsurf/rules/read-design-first.md`).

## Features
- RSVP reader with adjustable WPM, play/pause/reset, and pivot-letter highlighting
- Client-side PDF text extraction (pdf.js)
- Paste-text import
- Reading-purpose prompt before each session
- Persistent library/archive (rename, delete) + reading stats — all in `localStorage`

## Getting started
```bash
npm install
npm run dev
```
Then open the printed local URL.

## Scripts
- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the production build

## Tech
React 18, React Router, Vite, Tailwind CSS, pdfjs-dist.

## Project structure
```
src/
  components/   TopAppBar, BottomNav, Icon
  hooks/        useLibrary (localStorage CRUD + stats)
  lib/          pdf.js (extraction), rsvp.js (tokenize/pacing)
  pages/        Splash, Home, Import, Purpose, Reader, Archive, Drills, Settings
docs/DESIGN.md  Design system + spec (source of truth)
```
