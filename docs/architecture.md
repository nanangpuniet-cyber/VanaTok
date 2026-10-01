# VanaTok Architecture

## 1. Product Goal
Create a desktop creator studio that combines:
- real-time virtual camera and effect pipeline
- TikTok publishing flow
- screen capture, overlays, and presets
- recording/export for short-form video content

## 2. Core User Journey
1. Open app
2. Select camera source
3. Adjust effects and overlays
4. Preview live output
5. Start virtual camera or record
6. Export video or publish to TikTok

## 3. Recommended Stack
- Electron for desktop shell
- Browser UI for panels and controls
- Media capture APIs for camera and screen
- OBS Virtual Camera bridge for compatibility testing
- FFmpeg for export and processing
- JSON or local DB for presets and project state

## 4. High-Level Modules
### App shell
- window management
- menu and settings
- update lifecycle

### Capture layer
- camera source selection
- screen capture source
- frame pipeline

### Effect pipeline
- beauty filter
- blur / vignettes / lighting
- text and sticker overlays
- chroma key / green screen roadmap

### Recording and export
- MP4 export
- preset save/load
- timeline clips

### Publishing layer
- TikTok draft creation
- social account config
- content upload flow

## 5. MVP Scope
- Camera selection
- Live preview
- Basic filter controls
- Overlay support
- Record button
- Preset save/load
- TikTok publish flow scaffolding

## 6. Stretch Goals
- virtual camera driver for Windows
- AI beauty filters
- face tracking and masks
- advanced green screen
- background replacement
- multi-camera switching

## 7. Risks and Constraints
- TikTok app-level camera integration varies by platform and OS
- Android stock virtual camera is not standard
- Desktop compatibility is more realistic for virtual-camera workflows
- Publishing APIs must respect platform rules and account approvals
