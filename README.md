# 🌟 Comet AI Browser

<div align="center">

![Comet AI Browser](https://raw.githubusercontent.com/Preet3627/Comet-AI/main/icon.ico)

**An open-source, AI-native browser with permission-gated OS automation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android-blue)]()
[![Version](https://img.shields.io/badge/Version-0.2.5--stable-blue)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()
[![Built by 16yo](https://img.shields.io/badge/Developer-16_Year_Old_Student-FF69B4?style=for-the-badge&logo=github)](https://github.com/Preet3627)
[![Low Spec](https://img.shields.io/badge/Tested_On-i5--U_|_8GB_RAM-orange)]()

[Features](#-features) • [Download](#-download) • [Quick Start](#-quick-start) • [Security](#-security) • [Contributing](#-contributing)

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

---

## ✨ Features (v0.2.5-stable)

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
- **Model Selection** — Choose AI model per task (Gemini, Claude, local Ollama)

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

### 📱 Mobile App (Flutter)
- **WiFi Sync** — Connect mobile to desktop instantly
- **Remote Desktop Control** — Control desktop from phone
- **Push Notifications** — Get task completion alerts on mobile
- **PDF Viewer** — View generated PDFs on mobile
- **Automation Dashboard** — Manage scheduled tasks from mobile

### 🛡️ Security Model
- **Triple-Lock Architecture** (see [Security](#-security) section)
- **Prompt injection detection** with strike-based banning
- **PII scrubbing** before content reaches the LLM
- **Injection pattern detection** in DOM reading
- All shell commands and native clicks require explicit user approval
- Read-only DOM mode with automatic security filtering

### 🤖 AI Provider Support
| Provider | Type | Notes |
|----------|------|-------|
| Google Gemini | Cloud | Default recommended |
| OpenAI GPT | Cloud | GPT-4 and above |
| Anthropic Claude | Cloud | Strong for long context |
| Groq | Cloud | Fastest inference |
| Ollama | Local | Full privacy, no API key |

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
The agent perceives pages via **screenshots + OCR only**. It never parses or executes raw HTML or JavaScript. This prevents hidden prompt injection via DOM manipulation.

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

### Mobile (Android)

```bash
cd flutter_browser_app
flutter pub get
flutter run
```

📖 Full documentation: **https://browser.ponsrischool.in**

---

## ⬇️ Downloads

**Latest Release: v0.2.5-stable** | [View All Releases](https://github.com/Preet3627/Comet-AI/releases/latest)

| Platform | Download | Status |
|----------|----------|--------|
| 🪟 Windows (.exe) | [Download](https://github.com/Preet3627/Comet-AI/releases/latest/download/Comet.Browser.Setup.0.2.5.exe) | ✅ Stable |
| 🍎 macOS (.dmg) | [Download](https://github.com/Preet3627/Comet-AI/releases/latest/download/Comet.Browser-0.2.5-arm64.dmg) | ✅ Stable |
| 🐧 Linux (.AppImage) | [Download](https://github.com/Preet3627/Comet-AI/releases/latest/download/Comet.Browser-0.2.5.AppImage) | ✅ Stable |
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
git tag v0.2.5-stable
git push origin v0.2.5-stable
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

## 📝 License

[MIT](LICENSE) © 2026 Comet-AI

---

## 📋 Changelog

### v0.2.5 (2026-03-26) - Automation & Panel Updates
#### New Features
- **Automation Panel in Settings** - New "Automation" section in Settings with task management
- **Create Task Button** - Add "+ Create Task" button in Automation panel
- **Translate Panel Scrolling** - Fixed overflow with max-height and scrollable content
- **Panel z-layer Fix** - All panels (Settings, Downloads, Cart, Clipboard, Translate) now use z-[9999]
- **Browser Disable on Panel Open** - Automatically disables browser view when panels open
- **OPEN_AUTOMATION_SETTINGS Command** - AI can now open automation settings via command
- **OPEN_SCHEDULING_MODAL Command** - AI can prefill and open scheduling modal
- **JSON Format for Scheduling** - AI uses JSON format for scheduling tasks
- **PDF Template Markers** - Templates properly passed from AI to PDF generator

#### Bug Fixes
- Fixed duplicate SpotlightSearchOverlay import
- Fixed automation:get-tasks error when service not initialized
- Fixed ClientOnlyPage.tsx parsing errors
- Fixed infinite loop in ClientOnlyPage useEffect

#### Updates
- Removed deprecated GENERATE_PDF format from AI guide
- Updated all version references to v0.2.5

### v0.2.4 (2026-03-XX)
- AI scheduling intent detection
- Scheduling modal with cron presets
- Mobile push notifications
- PDF sync for mobile
