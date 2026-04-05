# Changelog

All notable changes to Comet AI Browser will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.2.7] - 2026-04-04

### Changed
- Updated version to v0.2.7
- Updated README with comprehensive documentation links

### Fixed
- Deep-link protocol intercept using `did-fail-load` for `comet-browser://` URLs
- Multi-layered redirect fixes for landing page authentication
- IPC handler cleanup to resolve terminal startup crashes
- `MaxListenersExceededWarning` memory leaks by removing unbound process listeners
- Automation service concurrency lock to prevent duplicate spin-ups

### Security
- Re-engineered Electron auth handling for robust deep link catching
- Landing page synchronization for `comet-auth-success` console payload

---

## [0.2.6] - 2026-03-30

### Added
- Native Google Sign-In via `google_sign_in` package
- Firebase Auth Integration for unified identity across platforms
- Secure Token Storage (Android Keystore / iOS Keychain)
- Cloud Sync Ready infrastructure
- Reliable Mobile Reconnect with `shared_preferences`
- Auto-Relay for Generated Files (PDF/DOCX/PPTX)
- Firebase Persistence Hygiene (cleanup routines)

### Changed
- Complete rewrite of `auth_service.dart` with native sign-in
- Runtime versioning from `package.json` via `useAppVersion`
- DOCX generation now uses proper `Header`/`Footer` blocks
- JSON command parser accepts top-level `commands` and infers `pptx` from `slides`

### Fixed
- IPC Scoping Resolution in `desktop-control` handler
- DOCX table mapping syntax error
- AI file generation with inline images and double-watermarking
- CloudSync Initialization property access errors

---

## [0.2.5] - 2026-03-26

### Added
- AI scheduling intent detection
- Scheduling modal with cron presets
- Mobile push notifications
- PDF sync for mobile
- Automation panel with Raycast hooks
- macOS-native top menus (Comet AI, File, Edit, View, Window, Help)
- SwiftUI-only translucent AI chat sidebar
- Charm-themed setup guide with theme selection
- QR verifier modal for mid-risk commands

### Changed
- Updated AI guide to JSON-first commands
- Normalized scheduling commands to JSON format

### Fixed
- Duplicate `SpotlightSearchOverlay` import
- `automation:get-tasks` errors when service uninitialized
- JSX parsing errors in `ClientOnlyPage.tsx`
- Infinite loop in `ClientOnlyPage` useEffect

---

## [0.2.4] - 2026-03-20

### Added
- Background automation service core
- Scheduling modal with natural language support
- Task queue with priority and retry logic
- System tray for background service
- Mobile automation page
- Remote settings page

### Features
- PDF generation system with multiple templates
- 5 PDF templates (professional, executive, academic, minimalist, dark)
- JSON format for AI commands
- Ollama integration
- Desktop notifications
- Mobile push notifications

---

## [0.2.3] - 2026-03-15

### Added
- WiFi Sync service for mobile-desktop pairing
- Desktop control from mobile (AI Chat, Shell, Control tabs)
- Shell command approval via QR code
- PDF viewer on mobile
- Automation dashboard on mobile

### Changed
- WiFiSyncService now tracks `_lastReceivedClipboard` for echo prevention
- Added `clipboard-sync-request` handler for initial sync

### Fixed
- Clipboard echo loop between desktop and mobile
- WiFi discovery timeout handling

---

## [0.2.2] - 2026-03-10

### Added
- Permission settings panel
- Auto-run toggles for low/mid risk commands
- Command risk categorization (safe, medium, high)
- `isAutoExecutable()` method

### Changed
- Updated AIConstants with command risk levels
- Improved permission modal UI

### Fixed
- Download panel crash showing "[object Object]"
- Monitor icon import in components

---

## [0.2.1] - 2026-03-05

### Added
- AI chat sidebar with command parsing
- Multi-step autonomous task execution
- RAG (Retrieval-Augmented Generation) with local vector memory
- Thinking transparency with collapsible "ThinkingPanel"
- `<think>` tag parsing for chain-of-thought models

### Features
- `[EXPLAIN_CAPABILITIES]` real-time demo command
- CLICK, FILL_FORM, SCROLL, COORDINATE-based interaction
- Command deduplication
- Multi-format command parsing (JSON, brackets, HTML comments)

---

## [0.2.0] - 2026-02-25

### Added
- Core browser engine with Chromium BrowserView
- Tab management with groups
- Built-in ad blocker
- Secure DOM extraction with PII scrubbing
- OCR-based screen reading (Tesseract.js)
- Screenshot capture with visual analysis
- Robot service for click and type automation

### Security
- Triple-Lock Architecture
- Visual Sandbox (screenshots + OCR only)
- Syntactic Firewall (dangerous pattern filtering)
- Human-in-the-Loop (HITL) for all OS actions

---

## [0.1.0] - 2026-02-01

### Added
- Initial release
- Basic browsing capabilities
- Electron shell setup
- Landing page with feature showcase
