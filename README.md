# VanaTok

Desktop app concept combining:
- virtual camera / live effects like VanaCam
- TikTok publishing workflows and creator tools
- live preview, overlays, presets, and export pipeline

## MVP Scope
- Camera source selection (front/back/virtual)
- Real-time effects and filters
- Text, stickers, overlays
- Recording and export
- Preset management
- TikTok posting flow integration
- Desktop-first experience for Windows

## Recommended Stack
- Electron + JavaScript
- Media capture APIs
- FFmpeg or browser media pipeline
- OBS Virtual Camera integration for desktop testing
- Optional native bridge for Windows-specific camera layers

## Project Layout
- `src/main.js` — Electron app bootstrap
- `src/preload.js` — secure bridge for frontend access
- `src/renderer/` — UI screens and styling
- `docs/architecture.md` — product and system architecture

## Getting Started
```
npm install
npm start
```

## Notes
This is a starter scaffold for a desktop creator tool. The virtual-camera and TikTok live integration layers will be implemented in the next iteration after the core UI and capture flow are stabilized.
