# Comet AI Browser - Release Notes

## v0.2.7 (2026-04-04)

### Authentication Hardening
- **Deep-Link Protocol Intercept**: Re-engineered Electron auth handling to properly catch custom `comet-browser://` deep links using `did-fail-load`
- **Multi-layered Redirect Fixes**: Added Next.js `did-navigate-in-page` fallback and console message intercept from the landing page
- **Landing Page Synchronization**: Updated `browser.ponsrischool.in` authentication signaling with `comet-auth-success` console payload

### Core Stability
- **IPC Handler Cleanup**: Stripped out extensive redundant IPC handlers in `main.js` resolving terminal startup crashes
- **Memory Leak Prevention**: Resolved `MaxListenersExceededWarning` by removing unbound process listeners
- **Automation Service Locks**: Implemented concurrency lock around `initializeAutomationService()`

### Documentation
- Added comprehensive documentation website at `/docs/*`
- New pages: AI Commands, Automation, Native API, Plugins, Deep Links, Document Generation

---

## v0.2.6 (2026-03-30)

### Native Authentication
- **Native Google Sign-In** via `google_sign_in` package
- **Firebase Auth Integration** for unified identity
- **Secure Token Storage** via Android Keystore / iOS Keychain
- **Cloud Sync Ready** with cross-device features

### Mobile Sync
- **Reliable Mobile Reconnect** with `shared_preferences`
- **Auto-Relay for Generated Files** to mobile instantly
- **Firebase Persistence Hygiene** cleanup routines

### Document Generation
- **DOCX page config** with proper Header/Footer blocks
- **JSON command parser** accepts `commands` and infers `pptx` from `slides`
- **Inline images** within analysis content
- **Watermark fixes** on thumbnails

### Bug Fixes
- IPC Scoping Resolution in `desktop-control` handler
- DOCX table mapping syntax error
- CloudSync Initialization property access errors

---

## v0.2.5 (2026-03-26)

### Automation & Scheduling
- **AI scheduling intent detection** for natural language
- **Scheduling modal** with cron presets
- **Mobile push notifications** for task completion
- **PDF sync for mobile** viewing
- **Automation panel** with Raycast hooks

### macOS Polish
- **Native top menus** (Comet AI, File, Edit, View, Window, Help)
- **SwiftUI translucent AI chat sidebar**
- **Charm-themed setup guide** with theme selection
- **QR verifier modal** for mid-risk commands

### Human-in-the-Loop
- Low/mid-risk commands now show QR verifier modal for self-authorization
- Automation state visible to AI

---

## v0.2.4 (2026-03-20)

### Background Service
- Core automation engine with scheduling
- Task queue with priority and retry logic
- System tray for background service
- Mobile automation dashboard

### Document System
- 5 PDF templates (professional, executive, academic, minimalist, dark)
- Screenshot embedding in PDFs
- JSON format for AI commands
- Ollama integration for local AI

### Notifications
- Desktop notifications
- Mobile push notifications
- Task completion alerts

---

## v0.2.3 (2026-03-15)

### WiFi Sync
- Mobile-desktop pairing via QR code
- Desktop control from mobile (AI Chat, Shell, Control tabs)
- Shell command approval via QR
- PDF viewer on mobile
- Automation dashboard on mobile

### Clipboard Sync
- Real-time clipboard sharing
- Echo prevention with `_lastReceivedClipboard`

---

## v0.2.2 (2026-03-10)

### Permission System
- Permission settings panel
- Auto-run toggles for low/mid risk commands
- Command risk categorization
- `isAutoExecutable()` method

### Downloads
- Fixed download panel crash
- Proper `{name, path}` objects for downloads

---

## v0.2.1 (2026-03-05)

### AI Agent
- Multi-step autonomous task execution
- RAG with local vector memory
- Thinking transparency with `ThinkingPanel`
- `<think>` tag parsing for chain-of-thought

### Commands
- `[EXPLAIN_CAPABILITIES]` real-time demo
- CLICK, FILL_FORM, SCROLL, COORDINATE interaction
- Command deduplication
- Multi-format parsing (JSON, brackets, HTML comments)

---

## v0.2.0 (2026-02-25)

### Core Browser
- Chromium BrowserView engine
- Tab management with groups
- Built-in ad blocker
- Secure DOM extraction

### AI Vision
- OCR-based screen reading (Tesseract.js)
- Screenshot capture with visual analysis
- Robot service for automation

### Security
- Triple-Lock Architecture
- Visual Sandbox, Syntactic Firewall, HITL

---

## v0.1.0 (2026-02-01)

Initial release with core browsing capabilities.
