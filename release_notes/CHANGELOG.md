# Changelog

All notable changes to the **Comet-AI** project will be documented in this file.

## [0.2.9] - 2026-04-13
### Added
- **Context-Aware View Virtualization**: BrowserView now intelligently detaches when not in use (Settings, Landing Page, initial setup) to save CPU/GPU.
- **Event-Driven Resize Gating**: Window resize listeners are only active when the browser view is enabled.
- **Native PDF Table of Contents**: Automated structural analysis generates clickable TOCs for all PDF exports.
- **Native Header/Footer Orchestration**: PDF internal page numbering and branding now use Electron's native printing templates for zero-fragmentation.
- **Get Started Flow**: Refined the landing page CTA to lead directly into the Startup Setup UI.

### Changed
- **Header Height Standard**: Compacted the AI Sidebar and URL bar headers to a consistent `56px` to match modern desktop HIG.
- **UI Stabilization**: Purged all "Idle Auto-Minimize" logic from the sidebar to ensure a static, dependable workspace.
- **Branding Consistency**: Window icons now use `nativeImage` to ensure transparency across all macOS/Windows package variations.

### Fixed
- **React Hook Mismatch**: Resolved a critical `useEffect` error caused by state dependency changes in `AIChatSidebar.tsx`.
- **Top-Level Padding**: Unified `TitleBar` and main workspace spacing to eliminate the "duplicate header" gap.

## [0.2.8] - 2026-04-05
### Added
- **Advanced Document Generation Engine**: Programmatic creation of PDFs, Excel (XLSX), and PowerPoint (PPTX).
- **Mermaid support**: Convert flowcharts and sequence diagrams directly to documents.
- **Official Model Catalogs**: Real-time model fetching for Gemini, OpenAI, Claude, and xAI.

## [0.2.7] - 2026-04-04
### Fixed
- **Deep-Link Protocol Intercept**: Hardened Google Sign-In redirect handling.
- **Memory Leak Fixes**: Purged redundant IPC handlers causing `MaxListenersExceededWarning`.

## [0.2.6] - 2026-03-30
### Added
- **Native Google Sign-In**: Switched from web redirects to native Android/iOS sign-in packages for the mobile client.
- **Firebase Auth Integration**: Synchronized user identity across all devices.
