# Comet AI Sidebar Native Module

## Overview

A native macOS AI sidebar powered by SwiftUI, bridging the best of Thuki's design with Electron's flexibility.

### Features

- **Thuki-Inspired UI**: Minimal, spotlight-style floating interface
- **Native SwiftUI**: Smooth 60fps animations and native macOS integration
- **Multi-Provider LLM**: Ollama, OpenAI, Anthropic, Gemini support
- **Auto-Start**: Login item integration for persistent availability
- **Conversation History**: SQLite-backed chat persistence
- **Command System**: `/screen`, `/think`, `/search`, and more

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              CometAISidebar (Node.js)                   ││
│  │  - EventEmitter for IPC                                ││
│  │  - Bridges to native module                           ││
│  └─────────────────────────────────────────────────────────┘│
│                           │                                   │
│                    N-API (Node.js)                           │
│                           │                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │        comet_sidebar_addon.mm (Objective-C++)          ││
│  │  - N-API bindings                                     ││
│  │  - Type conversions                                   ││
│  └─────────────────────────────────────────────────────────┘│
│                           │                                   │
│                    SwiftBridge.mm                            │
│                           │                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │             CometSidebar.swift (Swift)                  ││
│  │  - CometSidebarController                              ││
│  │  - SidebarViewModel                                   ││
│  │  - SwiftUI Views                                      ││
│  └─────────────────────────────────────────────────────────┘│
│                           │                                   │
│                    AppKit/SwiftUI                            │
│                           │                                   │
│              ┌────────────────────────┐                     │
│              │   Native macOS Window   │                     │
│              │   with Thuki-Style UI   │                     │
│              └────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- macOS 13.0+ (Ventura or later)
- Xcode 15.0+
- Node.js 22+
- npm

### Build from Source

```bash
cd native-modules/comet-ai-sidebar
npm install
npm run build
```

### Usage in Electron

```javascript
const CometAISidebar = require('./native-modules/comet-ai-sidebar');

// Create instance
const sidebar = new CometAISidebar();

// Initialize
await sidebar.initialize();

// Configure LLM (reads from Electron's settings)
await sidebar.configureLLM({
  endpoint: 'http://127.0.0.1:11434',
  model: 'gemma4:e2b',
  apiKey: '',
  provider: 'ollama'
});

// Show the native window
await sidebar.showWindow();

// Set auto-start
await sidebar.setAutoStart(true);

// Clean up on quit
await sidebar.destroy();
```

## API Reference

### `CometAISidebar`

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `initialize()` | - | `Promise<void>` | Initialize the native module |
| `showWindow()` | - | `Promise<void>` | Show the sidebar window |
| `hideWindow()` | - | `Promise<void>` | Hide the sidebar window |
| `toggleWindow()` | - | `Promise<void>` | Toggle window visibility |
| `configureLLM(config)` | `{endpoint, model, apiKey, provider}` | `Promise<string>` | Configure LLM provider |
| `loadLLMConfig()` | - | `Promise<string>` | Load saved LLM config |
| `getLLMConfig()` | - | `Promise<LLMConfig>` | Get current LLM config |
| `setSidebarVersion(version)` | `string` | `Promise<string>` | Set sidebar version (electron/thuki) |
| `getSidebarVersion()` | - | `Promise<string>` | Get current sidebar version |
| `setAutoStart(enabled)` | `boolean` | `Promise<string>` | Enable/disable auto-start |
| `getAutoStart()` | - | `Promise<boolean>` | Check auto-start status |
| `getVersion()` | - | `string` | Get module version |
| `getPlatform()` | - | `string` | Get platform (darwin) |
| `destroy()` | - | `Promise<void>` | Destroy the module |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ready` | - | Module is ready |
| `window:shown` | - | Window was shown |
| `window:hidden` | - | Window was hidden |
| `window:toggled` | - | Window visibility toggled |
| `destroyed` | - | Module was destroyed |

## Thuki Integration

This module is inspired by [Thuki](https://github.com/quiet-node/thuki) by Logan Nguyen, licensed under Apache 2.0.

### Features Derived from Thuki

1. **Morphing Container**: Spotlight-style input bar transforms to full chat
2. **Command Suggestions**: Real-time filtering with arrow key navigation
3. **Context-Aware Quotes**: Selected text pre-fills as quoted context
4. **Smart Auto-Scroll**: Follows content unless user scrolls up
5. **Typing Indicator**: Pulsing dots animation during AI response
6. **Conversation History**: Date-grouped organization (Today, Yesterday, Earlier)

### License Compliance

- Apache License 2.0 applied per Thuki's license
- Attribution included in `ACKNOWLEDGMENTS.md`
- Substantial modifications and extensions for Comet-AI integration

## Auto-Start Configuration

The sidebar can be configured to start automatically on login using macOS Login Items:

```javascript
// Enable auto-start
await sidebar.setAutoStart(true);

// Check status
const isAutoStart = await sidebar.getAutoStart();
```

This uses Electron's `app.setLoginItemSettings()` under the hood, configured via the native module.

## LLM Provider Configuration

### Ollama (Local)

```javascript
await sidebar.configureLLM({
  endpoint: 'http://127.0.0.1:11434',
  model: 'gemma4:e2b',
  provider: 'ollama'
});
```

### OpenAI Compatible

```javascript
await sidebar.configureLLM({
  endpoint: 'https://api.openai.com/v1',
  model: 'gpt-4',
  apiKey: 'sk-...',
  provider: 'openai'
});
```

### Anthropic

```javascript
await sidebar.configureLLM({
  endpoint: 'https://api.anthropic.com',
  model: 'claude-3-sonnet-20240229',
  apiKey: 'sk-ant-...',
  provider: 'anthropic'
});
```

### Google Gemini

```javascript
await sidebar.configureLLM({
  endpoint: 'https://generativelanguage.googleapis.com',
  model: 'gemini-pro',
  apiKey: 'AIza...',
  provider: 'gemini'
});
```

## Building

### Debug Build

```bash
npm run build
```

### Clean and Rebuild

```bash
npm run rebuild
```

### Output

Built module will be in `build/Release/comet_ai_sidebar.node`

## Troubleshooting

### Module fails to load

```bash
# Install dependencies
npm install

# Rebuild
npm run rebuild
```

### Swift compilation errors

Ensure Xcode Command Line Tools are installed:

```bash
xcode-select --install
```

### Runtime crashes

Check the native module was built with the correct deployment target:

```bash
otool -L build/Release/comet_ai_sidebar.node
```

## License

Copyright 2026 Latestinssan. Licensed under Apache License 2.0.

This project includes code derived from Thuki, Copyright 2026 Logan Nguyen, licensed under Apache License 2.0.

See `ACKNOWLEDGMENTS.md` for full license details.
