# 🌠 Comet AI Browser

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

## ✨ What Comet Actually Does (Verified by Real Testing)

These features have been tested and confirmed working. No marketing fluff.

### 🤖 AI Agent — Confirmed Working
- **Multi-step autonomous task execution** — chained commands run sequentially with a live Action Chain panel (e.g. Navigate → Wait → Read Page → Generate PDF, all in one prompt)
- **Neural Synthesis Engine** — AI sees results of its own actions before responding. It searches, reads the page, then answers — not the other way around
- **RAG (Retrieval-Augmented Generation)** — local vector memory via LanceDB + TensorFlow.js embeddings. Remembers your browsing context across the session
- **Thinking transparency** — internal reasoning shown in a collapsible ThinkingPanel. You can see exactly what the AI is planning before it acts
- **`<think>` tag parsing** — supports DeepSeek-style chain-of-thought models natively
- **Self-correcting navigation** — if a page fails to load or returns a 404, the agent detects it and adapts

### 🌐 Browser — Confirmed Working
- Full Chromium-based browsing via Electron BrowserView
- Tab management with groups
- Page content extraction with PII scrubbing (emails, tokens, session IDs auto-redacted before reaching LLM)
- OCR-based screen reading via Tesseract.js — works on text-heavy pages like Wikipedia, news sites. Note: minimal UI pages (e.g. google.com homepage = ~255 chars) return little content by design
- Screenshot capture and visual analysis
- Built-in ad blocker (~99% accuracy)
- User agent switching (Chrome, Firefox, Safari, Mobile presets)
- Bot detection note: sites like Google may detect Electron as a headless browser and serve a degraded page — this is expected

### 📄 Document & Productivity — Confirmed Working
- **Single-prompt PDF generation** with branded Comet header, footer, and logo — generates real downloadable PDFs
- **PDF viewer** with OCR, annotations, zoom, and rotation
- **Presenton Studio** integration — Docker-based AI presentation generator
- Unified cart manager across shopping sites
- Autofill for saved addresses and payment methods
- Unified Spotlight-style search (apps, system settings, web — one shortcut: `Win/CMD + Shift + Space`)
- **Media Studio** — in-browser AI image upscaler and format converter

### 🔐 Password Manager — Confirmed Working
- Local AES-256 encrypted credential vault
- Add, view, copy, delete entries
- Auto-fill monitoring for active login sessions
- Zero cloud sync — everything stays on your machine

### 📡 P2P Sync — Confirmed Working
- WiFi QR pairing with mobile device
- WebSocket bridge at `127.0.0.1:9876` (localhost) or local LAN
- Auth: HMAC SHA-256 rotating secret — new secret every app launch
- Clipboard sync between desktop and mobile
- Remote AI prompt triggering from mobile to desktop

### 🛡️ Security Model — Confirmed Working

Comet does **not** rely on LLM guardrails alone. It enforces **architectural isolation** at three levels.

#### 1. Visual Sandbox
The agent perceives pages via **screenshots + OCR only**. It never parses or executes raw HTML or JavaScript. This prevents hidden prompt injection via DOM manipulation.

#### 2. Syntactic Firewall
Before any content reaches the LLM, dangerous patterns are filtered:
- 20+ jailbreak regex patterns (role-override, DAN, system prompt extraction, etc.)
- Shell execution primitives (`rm -rf`, `powershell`, `sudo`)
- Encoded payloads and obfuscated commands
- AI-generated prompt detection (blocks automated prompt injection)
- Step-decomposition attack protection — splitting a harmful request across multiple steps is detected and blocked
- Strike-based ban system: 5 violations = permanent ban from Comet AI (persists across sessions)

#### 3. Human-in-the-Loop (HITL)
Every native OS action requires **explicit user approval** via a permission modal:
- **Low/Medium Risk** — approve instantly with `Shift+Tab` (purple glow confirms)
- **High Risk** — QR code shown for Cross-Device Authorization. Scan with Comet Mobile, match the 6-digit PIN. Action unblocked only after PIN verification

The AI generates **intent**, not execution. Even if socially engineered, it cannot act without your approval.

> **Real test result:** Attempts to extract cookies, session tokens, Chromium profile data, and browser authentication were all blocked with "I'm sorry, but I can't help with that." — every single time, across multiple rephrased attempts.

---

## 🤖 AI Provider Support

| Provider | Type | Notes |
|----------|------|-------|
| Google Gemini | Cloud | Default recommended |
| OpenAI GPT | Cloud | GPT-4 and above |
| Anthropic Claude | Cloud | Best for vision + long context |
| Groq | Cloud | Fastest inference (sub-200ms) |
| Ollama | Local | Full privacy, no API key needed |

**Tested model:** `GPT-OSS:120B-CLOUD` (via Ollama) — confirmed working for all documented tasks.

---

## ⚡ Performance

Engineered to run well on modest hardware.

| Metric | Value |
|--------|-------|
| Speedometer 3 | ~12–14 ms |
| Cold Start | < 2 seconds |
| Electron RAM Usage | ~462–500 MB |
| Agent Response (Claude API) | ~3–5s |
| Agent Response (Groq) | <200ms |

**Test machine:** Intel i5-U · 8GB RAM · SATA SSD · No GPU

---

## 🧠 Known Limitations (Honest)

These are real limitations discovered during testing — not bugs, mostly intentional design decisions:

| Limitation | Why |
|---|---|
| Shell commands are sandboxed for normal users | Intentional — prevents OS damage. Trusted/developer builds have full access |
| OCR fails on JS-heavy / UI-only pages | Text extraction pipeline filters minimal-content pages. Google homepage = ~255 chars extracted |
| PDF generation sometimes produces placeholder content | Occurs when page content extraction runs before the page fully loads. Use `[WAIT: 2000]` before `[READ_PAGE_CONTENT]` |
| No built-in vision model | OCR is text-only. Vision (screenshots → description) requires Claude or Gemini API key |
| Desktop folder access blocked in sandbox | `$HOME/Desktop` path doesn't exist in the sandboxed shell environment |

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
- [ ] Vision model integration (LLaVA / Moondream) for true screen understanding
- [ ] Better JS-rendered page extraction (beyond OCR)

---

## 👥 Contributing

PRs are welcome. Please open an issue first to discuss significant changes.

Special thanks to **Otherwise_Wave9374** for contributions to tool permission gating and agent loop refinement.

---

## 🧑‍💻 About

Comet AI Browser is built by a **16-year-old student** from India, preparing for JEE, on an Intel i5 PC with integrated Intel UHD graphics and 8GB RAM.

> *"Efficient architecture beats expensive hardware."*

---

## 📝 License

[MIT](LICENSE) © 2026 Comet-AI
