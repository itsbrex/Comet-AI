# Comet-AI Project - Agent Tasks & Status

## Project Overview
**Comet-AI** is a cross-platform AI-powered browser with advanced automation capabilities.

### Components
| Component | Technology | Path |
|-----------|-----------|------|
| Desktop Browser | Electron | `comet-browser/` |
| Mobile App | Flutter | `flutter_browser_app/` |
| Backend Services | FastAPI | `presenton/servers/fastapi/` |

---

## 📋 ACTIVE TASKS

### 1. Background Automation Service (HIGH PRIORITY)

**Status:** ✅ IMPLEMENTED

**Description:** Create a background service that runs scheduled tasks even when browser is closed. Runs as OS-level service (SYSTEM on Windows, LaunchDaemon on macOS).

**Requirements:**
- ✅ Run when user asks AI to schedule tasks (e.g., "generate PDF at 8am")
- ✅ Run even when no user logged in (SYSTEM user)
- ✅ Default storage: `~/Documents/Comet-AI/`
- ✅ AI asks user where to save files
- ✅ Notifications to both desktop and mobile
- ✅ PDF viewing on mobile
- ✅ Model selection via popup/modal
- ✅ Both browser and service can handle tasks simultaneously

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│  comet-ai-service.exe (Background Service)                      │
│  • Runs as SYSTEM user                                         │
│  • System tray icon only                                       │
│  • Executes scheduled tasks                                     │
│  • ~30-50MB RAM                                                │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation Phases:**
| Phase | Task | Status |
|-------|------|--------|
| 1.1 | Service entry point (`src/service/service-main.js`) | ✅ Complete |
| 1.2 | Tray manager (`src/service/tray-manager.js`) | ✅ Complete |
| 1.3 | Windows service installer (`scripts/install-service.js`) | ✅ Complete |
| 1.4 | macOS LaunchDaemon setup (`scripts/install-service.sh`) | ✅ Complete |
| 2.1 | Scheduler with node-cron (`src/service/scheduler.js`) | ✅ Complete |
| 2.2 | Task queue with retry (`src/service/task-queue.js`) | ✅ Complete |
| 2.3 | Storage management (`src/service/storage.js`) | ✅ Complete |
| 3.1 | Model selector popup (`src/components/ai/SchedulingModal.tsx`) | ✅ Complete |
| 3.2 | Ollama integration (`src/service/ollama-manager.js`) | ✅ Complete |
| 4.1 | Desktop notifications (`src/service/notifications.js`) | ✅ Complete |
| 4.2 | Mobile push notifications (`src/service/mobile-notifier.js`) | ✅ Complete |
| 5.1 | PDF sync for mobile (`src/service/pdf-sync.js`) | ✅ Complete |
| 5.2 | Mobile PDF viewer (`lib/pages/pdf_viewer_page.dart`) | ✅ Complete |
| 6.1 | Mobile automation page (`lib/pages/automation_page.dart`) | ✅ Complete |
| 6.2 | Remote settings page (`lib/pages/remote_settings_page.dart`) | ✅ Complete |
| 6.3 | IPC bridge (`src/service/ipc-service.js`) | ✅ Complete |
| 6.4 | Sleep handler (`src/service/sleep-handler.js`) | ✅ Complete |

**Files Created:**
```
comet-browser/
├── src/service/
│   ├── service-main.js           # ✅ Entry point (245 lines)
│   ├── tray-manager.js           # ✅ System tray (190 lines)
│   ├── scheduler.js              # ✅ Cron scheduler (280 lines)
│   ├── task-queue.js            # ✅ Priority queue (420 lines)
│   ├── storage.js               # ✅ File management (200 lines)
│   ├── model-selector.js        # ✅ Model picker (280 lines)
│   ├── ollama-manager.js        # ✅ Ollama integration (180 lines)
│   ├── notifications.js          # ✅ Desktop notifications (200 lines)
│   ├── mobile-notifier.js        # ✅ Mobile push (120 lines)
│   ├── sleep-handler.js         # ✅ Sleep/wake recovery (100 lines)
│   ├── ipc-service.js          # ✅ Browser ↔ Service IPC (250 lines)
│   └── pdf-sync.js             # ✅ PDF sync server (330 lines)
├── scripts/
│   ├── install-service.js        # ✅ Windows installer (200 lines)
│   └── install-service.sh        # ✅ macOS installer (250 lines)
├── src/components/ai/
│   └── SchedulingModal.tsx       # ✅ Scheduling confirmation modal (380 lines)
flutter_browser_app/
├── lib/pages/
│   ├── automation_page.dart      # ✅ Mobile automation (460 lines)
│   ├── pdf_viewer_page.dart    # ✅ PDF viewer (320 lines)
│   ├── remote_settings_page.dart # ✅ Remote settings (400 lines)
│   └── desktop_control_page.dart # ✅ Desktop control (700 lines)
```

**Total: 18 new files, ~4,500 lines of code**

---

### 2. Clipboard Sync Fix (HIGH PRIORITY)

**Status:** ✅ Fixed

**Completed:**
- ✅ Desktop WiFiSyncService now has `_lastReceivedClipboard` for echo prevention
- ✅ Added `clipboard-sync-request` handler for initial sync
- ✅ Both desktop and mobile now prevent clipboard echo loops

**Files Modified:**
- `comet-browser/src/lib/WiFiSyncService.ts`

---

### 3. Auto-Reconnect to Saved Devices (MEDIUM PRIORITY)

**Status:** 🟡 In Progress

**Requirements:**
- Save paired devices permanently
- Auto-connect when device detected
- Retry logic on disconnect

**Data Model:**
```typescript
interface SavedDevice {
    deviceId: string;
    deviceName: string;
    deviceType: 'mobile' | 'desktop';
    ip: string;
    port: number;
    lastConnected: Date;
    autoConnect: boolean;
    trustLevel: 'trusted' | 'ask_once' | 'blocked';
}
```

**Files to Modify:**
- `flutter_browser_app/lib/sync_service.dart` - Add SharedPreferences storage
- `comet-browser/src/lib/WiFiSyncService.ts` - Add electron-store storage
- `comet-browser/main.js` - Add IPC handlers

---

### 4. Remote Settings from Mobile (MEDIUM PRIORITY)

**Status:** ✅ Implemented

**Completed:**
- ✅ `flutter_browser_app/lib/pages/remote_settings_page.dart` - Full settings UI
- ✅ Settings categories: LLM, Security, Appearance, Browser, Automation
- ✅ Toggle, dropdown, slider, and text inputs
- ✅ Danger zone with restart/clear options

**Files Created:**
- `flutter_browser_app/lib/pages/remote_settings_page.dart`

---

## ✅ COMPLETED TASKS

### Desktop Control from Mobile
**Status:** ✅ Complete

**Completed:**
- ✅ WiFiSyncService desktop-control handler
- ✅ sync_service.dart enhanced with AI streaming
- ✅ DesktopControlPage with 3 tabs (AI Chat, Shell, Control)
- ✅ Shell QR approval for dangerous commands on Mac
- ✅ `/desktop-control` route in Flutter

**Files Modified:**
- `comet-browser/src/lib/WiFiSyncService.ts`
- `comet-browser/main.js`
- `flutter_browser_app/lib/sync_service.dart`
- `flutter_browser_app/lib/pages/desktop_control_page.dart` (NEW)
- `flutter_browser_app/lib/main.dart`

### Mobile Automation Page
**Status:** ✅ Complete

**Completed:**
- ✅ `flutter_browser_app/lib/pages/automation_page.dart` - Full automation UI
- ✅ Task list with filter (All/Active/Paused)
- ✅ Toggle, Run Now, Pause, Delete actions
- ✅ Real-time updates via WiFi sync
- ✅ `/automation` route in Flutter

**Files Created:**
- `flutter_browser_app/lib/pages/automation_page.dart`

### Mobile PDF Viewer
**Status:** ✅ Complete

**Completed:**
- ✅ `flutter_browser_app/lib/pages/pdf_viewer_page.dart` - PDF viewer UI
- ✅ Load from local file or URL
- ✅ Save, Share, Open in external app
- ✅ `/pdf-viewer` route in Flutter

**Files Created:**
- `flutter_browser_app/lib/pages/pdf_viewer_page.dart`

### Scheduling Modal (Desktop)
**Status:** ✅ Complete

**Completed:**
- ✅ `comet-browser/src/components/ai/SchedulingModal.tsx` - Full UI
- ✅ Schedule presets (daily, hourly, weekdays, etc.)
- ✅ Model selector with Ollama, Gemini, OpenAI, Anthropic options
- ✅ Output location picker
- ✅ Notification toggles

**Files Created:**
- `comet-browser/src/components/ai/SchedulingModal.tsx`

### PDF Generation System
**Status:** ✅ Complete

**Completed:**
- ✅ 5 PDF templates (professional, executive, academic, minimalist, dark)
- ✅ JSON format for AI commands
- ✅ Robust malformed input handling
- ✅ Template parsing with `parseMarkdownTables()`
- ✅ Layout overflow fixes

### AI Command Format
**Status:** ✅ Complete

**Completed:**
- ✅ JSON format as preferred command output
- ✅ Bracket format as fallback only
- ✅ Updated AIConstants.ts with JSON-first instructions
- ✅ CREATE_PDF_JSON command handler

### Smithery API Removal
**Status:** ✅ Complete

**Completed:**
- ✅ Removed @smithery/api dependency
- ✅ Kept official Google APIs (@googleapis/gmail)
- ✅ Using built-in scraper for web search

### Permission Settings
**Status:** ✅ Complete

**Completed:**
- ✅ Auto-run toggles for low/mid risk commands
- ✅ Lists of safe, medium, high risk commands
- ✅ `isAutoExecutable()` method

### Download Panel Fix
**Status:** ✅ Complete

**Fixed:**
- ✅ Send proper `{name, path}` objects instead of raw strings
- ✅ Fixed crash showing "[object Object]"

---

## 📁 PROJECT STRUCTURE

```
Comet-AI/
├── comet-browser/                 # Electron Desktop App
│   ├── main.js                   # Main process
│   ├── preload.js                # Preload scripts
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   │   ├── AIChatSidebar.tsx     # AI chat UI
│   │   │   ├── AIConstants.ts        # AI instructions
│   │   │   ├── PermissionSettings.tsx # Permission UI
│   │   │   └── settings/
│   │   ├── lib/
│   │   │   ├── WiFiSyncService.ts    # Mobile sync
│   │   │   ├── AICommandParser.ts    # Command parsing
│   │   │   ├── ShellCommandParser.ts # Shell validation
│   │   │   └── robot-service.js     # Desktop automation
│   │   └── service/                  # (TO CREATE) Background service
│   └── scripts/                     # (TO CREATE) Install scripts
│
├── flutter_browser_app/           # Flutter Mobile App
│   ├── lib/
│   │   ├── main.dart
│   │   ├── sync_service.dart         # WiFi sync
│   │   ├── clipboard_monitor.dart    # Clipboard monitoring
│   │   └── pages/
│   │       ├── desktop_control_page.dart  # Desktop control UI
│   │       ├── connect_desktop_page.dart # QR scanner
│   │       └── automation_page.dart       # (TO CREATE) Automation
│   └── pubspec.yaml
│
├── presenton/                    # Backend Services
│   └── servers/fastapi/          # FastAPI server
│
└── README.md
```

---

## 🔧 CURRENT SETUP

### Desktop (comet-browser)
- **Port:** 3004 (WiFi Sync WebSocket)
- **Discovery:** UDP port 3005
- **Pairing:** 6-digit code
- **Tray:** System tray icon

### Mobile (flutter_browser_app)
- **Discovery:** UDP port 3005
- **Connection:** WebSocket to desktop
- **Clipboard:** Polls every 2 seconds

### Supported Commands
| Command | Description |
|---------|-------------|
| SHELL_COMMAND | Execute terminal command |
| NAVIGATE | Open URL in browser |
| CREATE_PDF_JSON | Generate PDF |
| SET_VOLUME | Set system volume |
| OPEN_APP | Launch application |
| CLICK_ELEMENT | Click on screen element |
| FIND_AND_CLICK | Find text and click |

---

## 📅 SCHEDULE

### This Week (Days 1-5)
| Day | Task |
|-----|------|
| 1 | Background Service Core (entry point, tray, IPC) |
| 2 | Windows/macOS Service Installation |
| 3 | Automation Engine (scheduler, task queue) |
| 4 | Model Selection System |
| 5 | Clipboard Fix + Auto-Reconnect |

### Next Week (Days 6-10)
| Day | Task |
|-----|------|
| 6 | Notification System |
| 7 | PDF Mobile Sync |
| 8 | Mobile Automation UI |
| 9 | WiFi Task Protocol |
| 10 | Testing & Polish |

---

## 🐛 KNOWN ISSUES

| Issue | Status | Fix |
|-------|--------|-----|
| Monitor icon not imported | ✅ Fixed | Added to lucide-react import |
| Template tags in PDF | ✅ Fixed | Use cleanContent variable |
| `[GENERATE_PDF: ]` malformed | ✅ Fixed | Robust parsing |
| Clipboard echo loop | ✅ Fixed | Add _lastReceivedClipboard |
| Auto-reconnect | 🔴 Pending | Implement device storage |
| Service file syncing | 🔴 Pending | Add PDF sync for mobile access |

---

## 📊 METRICS

| Metric | Value |
|--------|-------|
| Total Commands | ~50+ |
| PDF Templates | 5 |
| Supported Models | 10+ |
| Task Types Planned | 6 |
| Background Service Files | 12 |
| Flutter Pages Created | 4 |
| Lines of Code Added | ~4,500+ |
| Installer Scripts | 2 (Windows + macOS) |

---

## 🎯 NEXT ACTIONS

1. **Auto-Reconnect:** Implement device storage and auto-connect logic
2. **Test Background Service:** Test that tasks run when browser is closed
3. **Mobile App Updates:** Update Flutter app with new routes for automation
4. **Integration Testing:** Test full flow from AI scheduling to notification

---

## ✅ COMPLETED THIS SESSION

### AI Scheduling Intent Detection + UI Update (2026-03-26)

**Files Created/Modified:**
- `src/components/ai/SchedulingIntentDetector.ts` - Natural language scheduling detection
- `src/components/ai/SchedulingModal.tsx` - Integrated into AIChatSidebar
- `src/components/AIChatSidebar.tsx` - Added scheduling detection and modal trigger
- `src/components/ai/AIConstants.ts` - Added SCHEDULE_TASK command and scheduling workflow
- `preload.js` - Added IPC handlers for automation
- `main.js` - Added automation IPC handlers
- `globals.css` - Beautiful fonts (Outfit, JetBrains Mono, Space Grotesk)
- `README.md` - Updated with scheduling features and v0.2.5

**Features:**
- Detects scheduling keywords: "at 8am", "daily", "every hour", "weekdays", etc.
- Extracts cron expressions from natural language
- Detects task types: PDF, web scrape, AI prompt, daily brief, workflow
- High confidence detection triggers scheduling modal automatically
- Full integration with IPC service for task scheduling
- AI knows about scheduling via `SCHEDULE_TASK` command in AIConstants
- Beautiful typography with Google Fonts

---

## ✅ COMPLETED THIS SESSION (2026-04-05)

### Swift UI Improvements + OCR Fixes

**Files Modified:**
- `src/lib/tesseract-service.js` - Fixed OCR JSON parsing with regex fallback, added robotJS direct click
- `src/lib/macos-native-panels.swift` - THINK UI, hidden title bar, rich markdown, Mermaid, Liquid Glass, macOS menu, Electron settings
- `src/components/ai/AIConstants.ts` - Added cross-app OCR/click documentation

**Completed Tasks:**
- ✅ Fix OCR click JSON parsing
- ✅ Add robotJS for external app clicking
- ✅ Fix THINK UI in Swift (animated indicator)
- ✅ Remove Swift title bar (`.windowStyle(.hiddenTitleBar)`)
- ✅ Fix AI message rendering on Swift (br, bold, math via WKWebView)
- ✅ Add MermaidView for Swift (MermaidJS via WKWebView)
- ✅ Add Liquid Glass Theme (`liquidGlass` gradient preset)
- ✅ Add macOS menu with direct settings access
- ✅ Add Electron Settings to Swift (quick access buttons for API Keys, Appearance, Automation, etc.)
- ✅ Update AI guide for cross-app OCR and click

**Views Added to Swift:**
- `ThinkingIndicatorView` - Animated thinking indicator
- `RichMarkdownView` - WKWebView with KaTeX/math/markdown
- `MarkdownMessageText` - Smart markdown detection
- `MermaidView` - Mermaid diagram rendering via WKWebView
- `ElectronSettingsButton` - Quick access to Electron settings

**macOS Menu:**
- Comet Settings menu with AI Providers, Appearance, Automation, Sync sections
- Direct shortcuts to OpenAI/Gemini/Anthropic/Ollama settings
- Keyboard shortcut: ⌘,

**NativeSettingsPanelView Updates:**
- Added "Open Electron Settings" section with 8 quick-access buttons
- Added Electron settings buttons: API Keys, Appearance, Automation, Permissions, WiFi Sync, Privacy, Extensions
- Added "All Settings" button for full Electron settings panel
- Native macOS settings now organized in clear sections
- Liquid Glass theme added to gradient presets

**AI Guide (Cross-App OCR/Click):**
- Documented OCR_COORDINATES and OCR_SCREEN for external apps
- Documented CLICK_APP_ELEMENT for external app clicking
- Explained JSON response parsing with regex fallback
- Documented coordinate handling and translation

---

*Last Updated: 2026-04-05*
*Status: Swift UI Improvements - ALL COMPLETED*
