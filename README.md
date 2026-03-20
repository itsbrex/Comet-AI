# 🌟 Comet AI Browser

<div align="center">

![Comet AI Browser](https://raw.githubusercontent.com/Preet3627/Comet-AI/main/icon.ico)

**An open-source, AI-native browser with permission-gated OS automation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android-blue)]()
[![Version](https://img.shields.io/badge/Version-0.2.1.1-green)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()
[![Built by 16yo](https://img.shields.io/badge/Developer-16_Year_Old_Student-FF69B4?style=for-the-badge&logo=github)](https://github.com/Preet3627)
[![Low Spec](https://img.shields.io/badge/Tested_On-i5--U_|_8GB_RAM-orange)]()

[Features](#-features) • [Download](#-download) • [Quick Start](#-quick-start) • [Security](#-security) • [Contributing](#-contributing)

</div>

---

## Why Comet?

Most browsers are built for monetization. Comet is built for **control**.

- 🧠 Autonomous AI agent that can browse, search, and act on your behalf
- 🔒 Privacy-first — local LLM support via Ollama, no cloud required
- 💻 OS-level automation with explicit human approval for every action
- ⚡ Optimized for low-spec hardware — tested on Intel i5-U, 8GB RAM, no GPU

---

## ✨ Features

### 🤖 AI Agent
- Multi-step autonomous task execution via chained commands
- Real-time action queue with live progress tracking UI
- RAG (Retrieval-Augmented Generation) using local vector memory
- Hybrid context: browser history + live web search results
- Thinking transparency — reasoning shown in collapsible "ThinkingPanel"
- `<think>` tag parsing for DeepSeek-style chain-of-thought models

### 🌐 Browser Capabilities
- Full Chromium-based browsing via Electron BrowserView
- Tab management with groups
- Page content extraction with PII scrubbing
- OCR-based screen reading (Tesseract.js)
- Screenshot capture and visual analysis
- Built-in ad blocker (~99% accuracy)

### 📄 Document & Productivity
- Single-prompt PDF generation with branded styling
- PDF viewer with OCR, annotations, zoom, and rotation
- Unified cart manager across shopping sites
- Autofill for saved addresses and payment methods
- Unified search (apps, settings, web — one shortcut)

### 🛡️ Security Model
- **Triple-Lock Architecture** (see [Security](#-security) section)
- Prompt injection detection with strike-based banning
- PII scrubbing before content reaches the LLM
- All shell commands and native clicks require explicit user approval

### 🤖 AI Provider Support
| Provider | Type | Notes |
|----------|------|-------|
| Google Gemini | Cloud | Default recommended |
| OpenAI GPT | Cloud | GPT-4 and above |
| Anthropic Claude | Cloud | Strong for long context |
| Groq | Cloud | Fastest inference |
| Ollama | Local | Full privacy, no API key |

---

## 🛡️ Security

Comet does **not** rely on LLM guardrails alone. It enforces **architectural isolation** at three levels.

### 1. Visual Sandbox
The agent perceives pages via **screenshots + OCR only**. It never parses or executes raw HTML or JavaScript. This prevents hidden prompt injection via DOM manipulation.

### 2. Syntactic Firewall
Before any content reaches the LLM, dangerous patterns are filtered:
- Shell execution primitives (`rm -rf`, `powershell`, `sudo`)
- Encoded payloads and obfuscated commands
- Prompt injection attempts (jailbreak patterns, role-override attempts)

### 3. Human-in-the-Loop (HITL)
Every native OS action — clicking outside the browser, running shell commands, opening apps — requires **explicit user approval** via a permission modal. 
- **Low/Medium Risk:** Can be approved instantly with `Shift+Tab`.
- **High Risk:** Shows a QR code for secure **Cross-Device Authorization**. Scan it with Comet Mobile app to view and match a 6-digit PIN before the action is unblocked.

The AI generates **intent**, not execution. Even if socially engineered, it cannot act without your approval.

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

Production APK builds are available on the [Releases](https://github.com/Preet3627/Comet-AI/releases) page.

📖 Full documentation: **https://browser.ponsrischool.in**

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
