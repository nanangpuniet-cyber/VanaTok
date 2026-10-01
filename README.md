# VanaTok

VanaTok is a Windows-first Electron creator studio prototype combining camera effects, screen capture, recording, local presets, and a TikTok draft workflow.

## Current release: 0.2.0

### Included
- Webcam and microphone preview
- Front/back camera switching
- Screen capture source
- Brightness, contrast, and saturation preview controls
- WebM recording with audio
- Local preset save/load
- Caption and comment settings
- Local TikTok draft metadata
- Windows NSIS packaging configuration
- Secure Electron preload, context isolation, sandbox, and permission handling

## Run locally

```bash
npm install
npm start
```

Build a Windows installer:

```bash
npm run dist
```

The installer is generated in `dist/`.

## Important platform limitation

This release does **not** create an Android-style or native Windows virtual-camera driver. The app records and previews media locally. A real camera device that appears in TikTok Live Studio requires a separately signed native Windows camera implementation (for example, a Media Foundation/DirectShow or OBS-based bridge). That component cannot be safely replaced by Electron renderer code alone.

Direct TikTok upload is also not enabled. The draft panel stores local metadata; production posting requires TikTok OAuth and approved Content Posting API access.

## Roadmap for production

1. Add a signed Windows virtual-camera bridge and frame transport.
2. Render filters/overlays into a canvas/encoder pipeline rather than preview-only CSS.
3. Add FFmpeg MP4 export and thumbnail generation.
4. Add TikTok OAuth/API integration after developer approval.
5. Add installer signing, device testing, crash reporting, and automated tests.
