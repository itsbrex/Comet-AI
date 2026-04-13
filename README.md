# 🌟 Comet AI Browser

<div align="center">

![Comet AI Browser](https://raw.githubusercontent.com/Preet3627/Comet-AI/main/icon.ico)

**An open-source, AI-native browser with permission-gated OS automation.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-cyan.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android-blue)]()
[![Version](https://img.shields.io/badge/Version-0.2.9-blue)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()
[![Built by 16yo](https://img.shields.io/badge/Developer-16_Year_Old_Student-FF69B4?style=for-the-badge&logo=github)](https://github.com/Preet3627)
[![Low Spec](https://img.shields.io/badge/Tested_On-i5--U_|_8GB_RAM-orange)]()

[Features](#-features) • [Documentation](#-documentation) • [Download](#-download) • [Quick Start](#-quick-start) • [Security](#-security) • [Contributing](#-contributing)

</div>

---
🆕 **Agentic Power** | **Background Scheduling** | **Cross-Device Sync**

## Why Comet?

Most browsers are built for monetization. Comet is built for **control**.

- 🧠 Autonomous AI agent that can browse, search, and act on your behalf
- 🔒 Privacy-first — local LLM support via Ollama, no cloud required
- 💻 OS-level automation with explicit human approval for every action
- ⚡ Optimized for low-spec hardware — tested on Intel i5-U, 8GB RAM, no GPU
- 📸 **Screenshot embedding in PDFs** — AI can capture and include screen images in reports
- 🔍 **Secure DOM Reading** — Filtered page extraction with injection detection
- 🌐 **In-page DOM Search** — AI can search within current page content
- ⏰ **Background Scheduling** — Schedule tasks like "generate PDF at 8am daily"
- 🔄 **Automatic latest-model fetching** — Official live model catalogs for Gemini, OpenAI, Claude, Groq, and xAI
- 🍎 **Apple Intelligence support on macOS** — Native Swift bridge with readiness checks, local summaries, and image generation

---

## 📚 Documentation

Full documentation is available at [browser.ponsrischool.in](https://browser.ponsrischool.in):

| Page | Description |
|------|-------------|
| [/docs/ai-commands](https://browser.ponsrischool.in/docs/ai-commands) | Complete guide to AI commands and JSON format |
| [/docs/automation](https://browser.ponsrischool.in/docs/automation) | Background scheduling and task automation |
| [/docs/native-api](https://browser.ponsrischool.in/docs/native-api) | System-level APIs for control |
| [/docs/plugins](https://browser.ponsrischool.in/docs/plugins) | Plugin marketplace and SDK |
| [/docs/deep-links](https://browser.ponsrischool.in/docs/deep-links) | URL schemes and routing |
| [/docs/document-generation](https://browser.ponsrischool.in/docs/document-generation) | PDF, PPTX, DOCX generation |

---

## ✨ Features (v0.2.9)

### 🤖 AI Agent
- Multi-step autonomous task execution via chained commands
- Real-time action queue with live progress tracking UI
- RAG (Retrieval-Augmented Generation) using local vector memory
- Hybrid context: browser history + live web search results
- Thinking transparency — reasoning shown in collapsible "ThinkingPanel"
- `<think>` tag parsing for DeepSeek-style chain-of-thought models
- **[EXPLAIN_CAPABILITIES]** — Real-time demo: searches news, adjusts volume, opens apps, captures screenshots, generates PDF reports
- **Full Agentic Control** — CLICK, FILL_FORM, SCROLL, and COORDINATE-based interaction
- **Accelerated Action Chains** — Optimized search-to-navigation loop with minimal latency
- **No Duplicate Commands** — Fixed command parsing to prevent duplicate executions
- **Multi-format Support** — Parses commands from JSON, brackets `[CMD]:`, and HTML comments

### ⏰ Background Scheduling & Automation
- **Natural Language Scheduling** — "Schedule PDF generation at 8am daily"
- **Smart Intent Detection** — Automatically detects scheduling keywords
- **Multiple Task Types:**
  - PDF Generation (daily reports, newsletters, weekly summaries)
  - Web Scraping (price monitoring, news aggregation)
  - AI Prompts (morning briefings, daily updates)
  - Workflow Automation (custom chained actions)
- **Cron Expression Support** — Daily, hourly, weekdays, custom intervals
- **Background Service** — Tasks run even when browser is closed
- **Mobile Notifications** — Get notified on desktop or mobile when tasks complete
- **Model Selection** — Choose AI model per task (Gemini, Claude, Azure OpenAI, local Ollama)

### 🌐 Browser Capabilities
- Full Chromium-based browsing via Electron BrowserView
- Tab management with groups
- **Secure DOM extraction** with PII scrubbing and injection detection
- **In-page DOM search** — AI can search text within current page
- **OCR-based screen reading (Tesseract.js)** with image preprocessing (sharp)
- **Screenshot capture** with visual analysis via Claude/Gemini AI
- **Error-proof browser** — Handles network failures, SSL errors, page crashes gracefully
- **Navigation retry logic** — Automatic retry with friendly error pages
- Built-in ad blocker (~99% accuracy)

### 📄 Document & Productivity
- **Live PDF Streaming** — Watch reports being generated in real-time
- **Slide-based Generation** — Use `---` in markdown to create multi-page slides (Presenton logic)
- **Enhanced PDF generation** with native tables, bold fonts, and custom branding
- **Screenshot embedding in PDFs** — AI captures and includes screen images in reports
- **Single-prompt branded reports** — Custom headers/footers with Comet icon
- **JSON-based PDF Generation** — AI can generate structured multi-page PDFs with icons
- **Page Detail Control** — AI controls content density per page (brief/standard/detailed)
- **70+ Icon Library** — Use icons in PDF sections (document, chart, brain, rocket, etc.)
- **Table of Contents** — Auto-generated for multi-page PDFs
- **Unified search & cart manager** — Search apps, settings, and web in one shortcut
- **One-Click Tab Group Closure** — Instantly close all AI-opened tabs
- **Download Panel** — Click to open completed downloads directly

### 📄 Document & Productivity (v0.2.9+)
- **Advanced Document Generation** — Generate PDFs, Excel (XLSX), PowerPoint (PPTX) programmatically
- **Mermaid Diagrams** — Convert flowcharts, sequence diagrams, class diagrams to PDF/PNG
- **Charts & Watermarks** — Add bar/line/pie charts and custom watermarks to documents
- **Typing Animations** — Character-by-character streaming with configurable cursor styles

### 🔌 Extensibility (v0.2.9+)
- **Raycast Extension** — Control Comet from macOS Spotlight (chat, browse, OCR, PDF, automation)
- **Plugin System** — Dynamic plugin loading with marketplace support
- **MCP Integration** — Model Context Protocol for external tools

### 📱 Mobile App (Flutter)
- **WiFi Sync** — Connect mobile to desktop instantly
- **Remote Desktop Control** — Control desktop from phone (AI Chat, Shell, Click, Type, Screenshot)
- **Push Notifications** — Get task completion alerts on mobile
- **PDF Viewer** — View generated PDFs on mobile
- **Automation Dashboard** — Manage scheduled tasks from mobile
- **Remote Settings** — Control desktop settings from mobile
- **Persistent Device Memory** — Auto-reconnect to saved devices
- **Native Google Sign-In** — Fast, secure authentication via `google_sign_in` + Firebase Auth
- **Cloud Sync** — Authenticated sessions sync across mobile and desktop via Firebase

### 🛡️ Security Model
- **Triple-Lock Architecture** (see [Security](#-security) section)
- **Prompt injection detection** with strike-based banning
- **PII scrubbing** before content reaches the LLM
- **Injection pattern detection** in DOM reading
- All shell commands and native clicks require explicit user approval
- Read-only DOM mode with automatic security filtering

### 📝 Document Generation
- **PDF Generation** - Professional PDFs with templates (professional, executive, dark, minimalist)
- **PowerPoint (PPTX)** - Slide presentations with charts, images, and animations
- **Word Documents (DOCX)** - Rich formatting with tables, lists, and styles
- **Screenshot Embedding** - AI captures and includes screen images in reports
- **Live Streaming** - Watch reports being generated in real-time
- **Branding** - Custom headers, footers, and company logos

### 🤖 AI Provider Support
| Provider | Type | Notes |
|----------|------|-------|
| Google Gemini | Cloud | Official model catalog fetch + auto-latest recommendation |
| OpenAI GPT | Cloud | Official model catalog fetch + auto-latest recommendation |
| Microsoft Azure OpenAI | Cloud | Official Microsoft backend, cross-platform |
| Anthropic Claude | Cloud | Official model catalog fetch + auto-latest recommendation |
| Groq | Cloud | Official model catalog fetch + auto-latest recommendation |
| xAI Grok | Cloud | Official model catalog fetch + auto-latest recommendation |
| Ollama | Local | Full privacy, no API key |
| Apple Intelligence | Native macOS | Swift bridge with readiness checks, summary + image generation on supported Macs |
| Microsoft Copilot | Companion (Windows) | Launchable from setup/welcome, no Comet API key required |

Azure OpenAI setup note:
- Use your Azure OpenAI v1 base URL, for example `https://YOUR-RESOURCE.openai.azure.com/openai/v1`
- Enter your Azure API key and your model/deployment name in Comet settings

### 🍎 Apple Intelligence on macOS

Comet now includes a **native Swift Apple Intelligence bridge** for macOS, built in the same spirit as the existing Swift native panel system.

What is included now:
- **Foundation Models summary bridge** for summarizing current page text or pasted text from inside Comet settings
- **Image Playground / ImageCreator bridge** for macOS-only local image generation
- **GUI readiness checks** that detect unsupported Macs, disabled Apple Intelligence, and not-ready model states before use
- **Packaged helper build step** so macOS distributions can ship the Apple helper in `bin/`
- **Apple Intelligence Lab** in settings for quick testing and validation

Why this uses Swift:
- Apple Intelligence APIs are native Apple frameworks, so Comet talks to them through a small Swift helper instead of trying to force them through the web runtime.
- This matches Comet's existing native macOS architecture for Swift UI panels and helpers.

Current status:
- The helper compiles and the bridge is integrated into Electron.
- **Runtime availability still depends on the Mac, macOS version, Apple Intelligence enablement, and Apple's framework/runtime state.**
- Comet now checks readiness before use and shows clear GUI states when Apple Intelligence is unsupported, disabled, or still getting ready.
- On unsupported Macs, or when Apple Intelligence/image creation is not available at runtime, Comet fails gracefully and keeps cloud/local providers available.

Advanced Apple-native paths we can build on:
- **Writing Tools** for editor-native summarization and rewrite flows in custom text surfaces
- **App Intents assistant schemas** for exposing Comet actions/content to Siri and Apple Intelligence
- **ImagePlaygroundViewController** when we want Apple-controlled system image UI instead of only helper-driven generation

Official Apple references:
- [Apple Intelligence](https://developer.apple.com/apple-intelligence/)
- [Foundation Models](https://developer.apple.com/documentation/FoundationModels)
- [Generating content and performing tasks with Foundation Models](https://developer.apple.com/documentation/FoundationModels/generating-content-and-performing-tasks-with-foundation-models)
- [Image Playground](https://developer.apple.com/documentation/ImagePlayground)
- [App intent domains](https://developer.apple.com/documentation/appintents/app-intent-domains)

### 🪟 Microsoft Copilot on Windows

Comet now surfaces a **Windows Copilot companion path** in the welcome flow and setup flow so Windows users can get to Microsoft Copilot quickly without pasting an API key into Comet first.

Important:
- **Supported today:** launch the official Microsoft Copilot experience from Comet on Windows and use it alongside Comet.
- **Native Microsoft backend now available:** Comet's own AI sidebar can also use **Microsoft Azure OpenAI** directly.
- **Not fully native yet for Copilot itself:** the Microsoft Copilot app/service is still a separate path from Comet's sidebar provider pipeline.
- **Why:** this repo now ships a first-party Microsoft backend through Azure OpenAI, but it does **not** yet ship a first-party Microsoft Copilot app provider wired directly into Comet's sidebar request pipeline.

If you want Comet's built-in sidebar AI to answer directly inside Comet right now, configure one of the supported providers above, including Azure OpenAI. If you want a **no-key Windows assistant**, use the Copilot companion flow below.

#### What Microsoft says

These official Microsoft resources are the best starting point:
- Microsoft Support: [Getting started with Microsoft Copilot](https://support.microsoft.com/en-us/topic/getting-started-with-microsoft-copilot-8fde147f-726e-4790-9503-70790ddcac73)
- Microsoft Windows Developer Blog: [Unlock a new era of innovation with Windows Copilot Runtime and Copilot+ PCs](https://blogs.windows.com/windowsdeveloper/2024/05/21/unlock-a-new-era-of-innovation-with-windows-copilot-runtime-and-copilot-pcs/)
- Microsoft Developer: [Microsoft Foundry on Windows / Windows AI APIs](https://developer.microsoft.com/windows/ai/)

Microsoft Support says the Copilot app is already present on many Windows 11 PCs, and if it is missing, users can install it for free from the Microsoft Store.

#### Option A: Use Copilot on Windows with no Comet API key

This is the easiest setup for Windows users.

1. Install or open Comet AI on Windows.
2. Open the **Welcome Screen** or go to **Settings → About** and relaunch onboarding.
3. Open **Setup Guide**.
4. Go to the **AI Access** step.
5. Use the **Open Copilot** button.
6. If Copilot is not already installed, install it from Microsoft's official flow.
7. Keep using Comet for browsing, downloads, search, permissions, and automation approval.
8. Use Microsoft Copilot as your companion assistant on the same machine with no Comet-side API key.

This mode is best for users who want:
- zero API-key setup
- official Microsoft Copilot on Windows
- Comet for browser control, tabs, downloads, automation, and gated actions

#### Option B: Use Comet's AI sidebar directly

If you want responses to appear **inside Comet's sidebar chat**, you currently need to configure one of Comet's native providers:
- Ollama
- Gemini
- OpenAI
- Azure OpenAI
- Anthropic
- Groq

This is because the sidebar currently calls Comet's internal provider system, including Azure OpenAI, not the Microsoft Copilot desktop app.

#### Current limitation for "Copilot inside the sidebar"

At the moment, the following is **not implemented**:
- sending sidebar prompts directly to the Microsoft Copilot app
- using the Microsoft Copilot Windows app as a drop-in `aiProvider` inside Comet
- claiming full in-sidebar Copilot support without a Microsoft-supported API/runtime bridge

That limitation is intentional in the docs so we do not mislead users.

#### Recommended user-facing wording

If you are documenting this feature elsewhere in the app or website, use wording like:

> "Comet can launch Microsoft Copilot on Windows as a companion, and Comet's built-in sidebar continues to use supported providers such as Ollama, Gemini, OpenAI, Azure OpenAI, Anthropic, or Groq."

#### Future direction

A true "Copilot in Comet sidebar" integration would likely require one of these paths:
- an official Microsoft API or SDK that allows app-to-app Copilot prompting
- a supported Windows AI / Copilot Runtime bridge for third-party apps
- a provider implementation in Comet that Microsoft explicitly permits and documents

Until that exists, the safest and most honest experience is:
- **Companion mode for Microsoft Copilot on Windows**
- **Native sidebar mode for Comet-supported providers**

### 🔧 Real Capabilities Demo

When you use `[EXPLAIN_CAPABILITIES]`, Comet AI demonstrates:

1. **Web Search** — Fetches latest news in real-time
2. **Shell Commands** — Retrieves WiFi/network information
3. **System Control** — Adjusts volume and brightness
4. **App Launching** — Opens Calculator (macOS/Windows/Linux)
5. **Screenshot Capture** — Takes and embeds screen images
6. **PDF Generation** — Creates branded reports with screenshots
7. **Scheduling** — Set up recurring tasks like "daily news at 8am"

---

## 🛡️ Security

Comet does **not** rely on LLM guardrails alone. It enforces **architectural isolation** at three levels.

### 1. Visual Sandbox
The agent perceives pages via **screenshots + OCR, SecureDOM reader, and in-page DOM search**. It never executes raw HTML or JavaScript directly. This prevents hidden prompt injection via DOM manipulation while still providing structured content access.

### 2. Syntactic Firewall
Before any content reaches the LLM, dangerous patterns are filtered:
- Shell execution primitives (`rm -rf`, `powershell`, `sudo`)
- Encoded payloads and obfuscated commands
- Prompt injection attempts (jailbreak patterns, role-Override attempts)

### 3. Human-in-the-Loop (HITL)
Every native OS action — clicking outside the browser, running shell commands, opening apps — requires **explicit user approval** via a permission modal. 
- **Low/Medium Risk:** Can be approved instantly with `Shift+Tab`.
- **High Risk:** Shows a QR code for secure **Cross-Device Authorization**. Scan it with Comet Mobile app to view and match a 6-digit PIN before the action is unblocked.

The AI generates **intent**, not execution. Even if socially engineered, it cannot act without your approval.

---

## ⏰ Background Scheduling

Comet AI can schedule tasks to run automatically, even when the browser is closed.

### Supported Schedule Types
- **Daily** — Run at a specific time every day
- **Hourly** — Run every hour
- **Weekdays** — Run Monday through Friday
- **Weekly** — Run on specific days
- **Custom Cron** — Advanced scheduling with cron expressions

### Example Commands
```
"Generate a daily news summary at 8am"
"Check my emails every morning at 7:30"
"Create a weekly report every Monday"
"Remind me to take breaks every hour"
```

### Background Service
The Comet Background Service runs tasks even when the browser is closed:
- Windows: Uses Task Scheduler (runs as SYSTEM user)
- macOS: Uses LaunchDaemon
- ~30-50MB RAM footprint

---

## ⚡ Performance

Engineered to run well on modest hardware.

| Metric | Value |
|--------|-------|
| Speedometer 3 | ~12–14 ms |
| Cold Start | < 2 seconds |
| Electron RAM Usage | ~462–500 MB |
| Agent Response (Claude API) | ~3–5s |

**Test machine:** Intel i5-U · 8GB RAM · SATA SSD · No GPU

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- (Optional) [Ollama](https://ollama.com) for local AI

### Desktop (Windows / macOS / Linux)

```bash
git clone https://github.com/Preet3627/Comet-AI.git
cd Comet-AI/comet-browser
npm install
npm run dev          # Next.js frontend
npm run electron-start  # Electron shell
```

macOS native note:
- Comet can build native Swift helpers for macOS features such as native panels and Apple Intelligence.
- For distributable macOS builds, the Apple helper is included through the `build-macos-apple-intelligence-helper` step used by `electron:build:mac` and `dist:mac`.

### Mobile (Android)

```bash
cd flutter_browser_app
flutter pub get
flutter run
```

📖 Full documentation: **https://browser.ponsrischool.in**

---

## ⬇️ Downloads

**Latest Release: v0.2.9** | [View All Releases](https://github.com/Preet3627/Comet-AI/releases/latest)

| Platform | Download | Status |
|----------|----------|--------|
| 🪟 Windows (.exe) | [Download](https://github.com/Preet3627/Comet-AI/releases/latest/download/Comet.Browser.Setup.0.2.9.exe) | ✅ Stable |
| 🍎 macOS (.dmg) | [Download](https://github.com/Preet3627/Comet-AI/releases/latest/download/Comet.Browser-0.2.9-arm64.dmg) | ✅ Stable |
| 🐧 Linux (.AppImage) | [Download](https://github.com/Preet3627/Comet-AI/releases/latest/download/Comet.Browser-0.2.9.AppImage) | ✅ Stable |
| 📱 Android (.apk) | [Download](https://github.com/Preet3627/Comet-AI/releases/latest/download/app-release.apk) | ✅ Stable |
| 🍎 iOS (.ipa) | [Download](https://github.com/Preet3627/Comet-AI/releases/latest/download/Comet-AI.ipa) | 🧪 Beta |

---

## 🚀 Development Status

| Platform | Status |
|----------|--------|
| Windows | ✅ Production Ready |
| macOS | ✅ Production Ready |
| Linux | ✅ Production Ready |
| Android | ✅ Production Ready |
| iOS | 🧪 Testing Phase |

---

## 📝 v0.2.9 Highlights
- **Comprehensive Documentation Website** - Added 6 new documentation pages covering AI Commands, Automation, Native API, Plugins, Deep Links, and Document Generation
- **Document Generation Guide** - Detailed PDF, PPTX, and DOCX generation with templates, features, and code examples
- **Native API Reference** - Complete guide to 50+ system-level APIs for window management, file system, network, and media control
- **Plugin System Documentation** - Plugin marketplace with SDK, manifest format, security verification, and development guides
- **Deep Links Reference** - URL schemes (`comet-ai://`), web URLs, route reference, and cross-platform support
- **Structured Changelog** - Created proper CHANGELOG.md and RELEASE_NOTES.md files
- **Official live model catalogs** - Comet now fetches current models directly from Gemini, OpenAI, Anthropic, Groq, and xAI instead of relying only on hardcoded model strings
- **Apple Intelligence bridge for macOS** - Added a Swift helper path for native on-device summaries and image generation experiments on supported Macs, with GUI readiness/error states before use

## 📝 v0.2.7 Highlights
- **Hardened Authentication Flow**: Re-engineered Electron auth handling to properly catch custom `comet-browser://` deep links using `did-fail-load` for robust auto-closing during Google/Firebase sign-in.
- **Main Process De-duplication**: Cleaned up extensive redundant IPC handlers in `main.js`, resolving terminal startup crashes and `MaxListenersExceededWarning` memory leaks.
- **Automation Service Stability**: Implemented a concurrency lock around `initializeAutomationService()` guarding against duplicate startup spin-ups.
- **Multi-layered Redirect Fixes**: Added Next.js `did-navigate-in-page` fallback and console message intercept from the landing page.

## 📝 v0.2.6 Highlights
- **Native Google Sign-In** – Replaced web OAuth with native `google_sign_in` package for faster, more reliable authentication
- **Firebase Auth Integration** – Unified user identity across mobile and desktop via Firebase Authentication
- **Secure Token Storage** – Auth tokens stored in Android Keystore / iOS Keychain using `FlutterSecureStorage`
- **Cloud Sync Ready** – Mobile sign-in enables cross-device features via shared Firebase UID

## 📝 v0.2.6-patch Highlights
- **Hardened Mobile Sync** – Implemented reliable auto-reconnection for mobile devices using `shared_preferences`. The mobile app now remembers the last connected desktop and recovers connections automatically.
- **Auto-Relay for Generated Files** – AI-generated reports (PDF/DOCX/PPTX) are now automatically synced to the local relay directory and instantly pushed to the mobile app for immediate viewing.
- **Firebase Hygiene & Cleanup** – Automated routines now periodically purge orphaned relay files from Firebase Storage and clean up old `temp_` database entries, maintaining system performance and privacy.
- **Unified versioning** – All UI surfaces now consistently report v0.2.6, pulling directly from context-aware versioning logic.

## 🗺️ Roadmap

- [ ] Native Chromium core (replace Electron BrowserView)
- [ ] Fully offline LLM (1.5B–3B parameter models)
- [ ] Extension marketplace
- [ ] Multi-agent collaborative workspace
- [ ] Granular OS tool permission profiles

---

## 🔄 Release Workflow

### Auto Release (Recommended)

**Option 1: Push a Tag**
```bash
# Create and push a version tag
git tag v0.2.7-stable
git push origin v0.2.7-stable
```
This automatically triggers the `auto-release-tag.yml` workflow which:
- Builds all platforms (Windows, macOS, Linux, Android, iOS)
- Creates a GitHub release with all assets
- Updates Firebase config with download links

**Option 2: Manual Workflow Dispatch**
1. Go to **Actions** tab on GitHub
2. Select **Release Build (Landing Page Optimized)** or **Publish Release**
3. Click **Run workflow**
4. Fill in version and options

### Landing Page Integration

The landing page automatically detects the latest release via GitHub API:
```
https://api.github.com/repos/Preet3627/Comet-AI/releases/latest
```

Downloads are parsed from release assets by filename patterns:
- Windows: `.exe`, `setup`
- macOS: `.dmg`, `mac`
- Linux: `.appimage`, `linux`
- Android: `.apk`, `android`
- iOS: `.ipa`, `ios`

### Required Secrets

For Firebase updates, set these in GitHub Secrets:
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_ADMIN_TOKEN` - Admin auth token for Realtime Database

---

## 👥 Contributing

PRs are welcome. Please open an issue first to discuss significant changes.

Special thanks to **Otherwise_Wave9374** for contributions to tool permission gating and agent loop refinement.

---

## 🧑‍💻 About

Comet AI Browser is built by a **16-year-old student** from India, preparing for JEE, on a intel i5 pc with integrated intel UHD graphics 8GB ram.

> Efficient architecture beats expensive hardware.

---
## 📋 Changelog

### v0.2.9 (2026-04-05) - Documentation Website & Structured Changelog
#### New Features
- **Documentation Website** - Comprehensive docs at [browser.ponsrischool.in](https://browser.ponsrischool.in)
  - `/docs/ai-commands` - Complete AI command reference
  - `/docs/automation` - Background scheduling guide
  - `/docs/native-api` - System APIs documentation
  - `/docs/plugins` - Plugin marketplace and SDK
  - `/docs/deep-links` - URL schemes and routing
  - `/docs/document-generation` - PDF/PPTX/DOCX generation
- **CHANGELOG.md** - Structured changelog following Keep a Changelog format
- **RELEASE_NOTES.md** - Comprehensive release notes

### v0.2.7 (2026-04-04) - Auth Hardening & System Stability
#### New Features & Fixes
- **Deep-Link Protocol Intercept**: Re-engineered Electron auth handling to properly catch custom `comet-browser://` deep links using `did-fail-load`.
- **Multi-layered Redirect Fixes**: Added a Next.js `did-navigate-in-page` fallback and console message intercept from the landing page.
- **IPC Handler Cleanup**: Stripped out extensive redundant IPC handlers in `main.js` resolving terminal startup crashes.
- **Memory Leak Prevention**: Resolved `MaxListenersExceededWarning` memory leaks by removing unbound process listeners.
- **Automation Service Locks**: Implemented a concurrency lock around `initializeAutomationService()`.

### v0.2.6 (2026-03-30) - Native Google Sign-In & Sync Hardening
#### New Features
- **Native Google Sign-In** - Uses `google_sign_in` package instead of web OAuth redirect
- **Firebase Auth Integration** - Unified identity across mobile and desktop
- **Secure Token Storage** - Android Keystore / iOS Keychain via `FlutterSecureStorage`
- **Cloud Sync Ready** - Mobile auth enables cross-device features
- **Hardened Mobile Sync** – Reliable auto-reconnection for mobile devices
- **Auto-Relay for Generated Files** – Instant file sync to mobile

#### Technical Changes
- `auth_service.dart` - Complete rewrite with native sign-in + Firebase Auth
- `auth_page.dart` - Simplified to use `AuthService().signInWithGoogle()`
- `main.dart` - Simplified auth deep link handling
- `AndroidManifest.xml` - Added Google Sign-In metadata
#### New Features
- **Reliable Mobile Reconnect** – Integrated `shared_preferences` into the Flutter client. Mobile devices now persist pair data and auto-reconnect to the desktop shell upon app launch or connection loss.
- **Instant Result Relay** – Desktop-generated files are now automatically mirrored to the `Comet-AI/public` sync path. Mobile clients receive instant notifications via `file-generated` events to view results immediately.
- **Firebase Persistence Hygiene** – Added a background cleanup task in `CloudSyncService` to purge orphaned relay data and old `temp_` prefixed entries from Firebase Realtime Database and Storage after 24 hours.
- **Runtime versioning everywhere** – All UI surfaces (welcome screen, settings, capability panel, AI sidebars, mac SwiftUI sheet) now read the installed version from `package.json` via `useAppVersion`, eliminating manual string updates.
- **Branded document outputs** – PPTX thumbnails no longer show watermarks; custom backgrounds/palettes, inline images/tables/styling, and watermark-on-inner-slides defaults were refreshed.
- **Parser flexibility** – JSON command parser now accepts top-level `commands`, infers `pptx` when `slides` are provided, and supports image slots inside pages/analysis.

#### Bug Fixes
- **IPC Scoping Resolution** – Fixed a `ReferenceError` in `main.js` within the `desktop-control` handler where arguments were incorrectly scoped.
- **DOCX generation** – Header/footer creation uses proper docx `Header`/`Footer` blocks; table mapping syntax error resolved, preventing `Cannot read properties of undefined (reading 'children')`.
- **AI file generation** – PDF/PPTX/Docx generators now allow inline images within analysis content and avoid double-watermarking on thumbnails.
- **CloudSync Initialization** – Fixed property access errors where `firebaseService` was expected to have a `database` member; now correctly uses `getDatabase` for real-time sync.

### v0.2.5 (2026-03-26) - Automation, mac polish & schedule UX
#### New Features
- **Automation panel & Raycast hooks** – Settings now features an automation dashboard with a “+ Create Task” button, while Raycast-native hooks let the AI list or delete the same automations directly from the desktop client.
- **macOS-native polish** – Added native top menus (Comet AI, File, Edit, View, Window, Help) with clearer spacing/descriptions and introduced a SwiftUI-only translucent AI chat sidebar that mirrors macOS aesthetics.
- **Automation-aware AI approval** – Low/mid-risk commands that are not auto-approved now show the existing QR verifier modal so the agent can self-authorize instead of being blocked, and automation state is visible to the AI (inspect/remove flows).
- **Charm-themed setup guide** – The welcome/setup screens now highlight the Charm light theme, offer theme selection, auto-detect the system timezone, and refuse to close until API keys and mandatory steps are completed.
- **Panel focus & scheduling UX** – Download, clipboard, cart, and ecosystem panels close when clicking outside and the scheduling automation modal stays scrollable/height-limited so longer flows remain usable.

#### Bug Fixes
- Fixed duplicate `SpotlightSearchOverlay` import.
- Fixed `automation:get-tasks` errors when the automation service is uninitialized.
- Eliminated previous JSX parsing errors in `ClientOnlyPage.tsx`.
- Resolved the infinite loop in the `ClientOnlyPage` `useEffect`.

#### Updates
- Removed the legacy `GENERATE_PDF` format from the AI guide and normalized AI scheduling commands to JSON.
- Updated every textual reference to the current v0.2.5 release.

### v0.2.4 (2026-03-XX)
- AI scheduling intent detection
- Scheduling modal with cron presets
- Mobile push notifications
- PDF sync for mobile
---

## 📝 License

[Apache 2.0](LICENSE) © 2026 Comet-AI

---

