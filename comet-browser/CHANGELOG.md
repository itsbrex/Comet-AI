# Comet Browser - Recent Changes

## Version 0.1.9 - Browser Enhancements & Bug Fixes

### 🔧 Major Fixes

#### 1. **Google Login Removed**
- Removed Google OAuth integration from main process (`main.js`)
- Updated authentication to use landing page web-auth flow
- Renamed `googleToken` → `authToken` for generic auth handling
- Updated UI to show "Authorize Workspace" instead of "Authorize via Google"
- Removed `google-oauth-login` IPC handler

#### 2. **Persistent LLM Cache Implemented**
- Added persistent cache storage to `llm_cache.json` in user data directory
- Cache survives app restarts, saving tokens and improving response times
- Automatic cache loading on startup
- Cache persists after each LLM generation

#### 3. **Enhanced External App Opening (Windows)**
- Improved `open-external-app` handler for Windows
- Now uses `start ""` command for better app discovery
- Supports both absolute paths and app names in PATH
- Fallback mechanisms for macOS and Linux

#### 4. **Screen Capture Handler Consolidation**
- Removed duplicate `capture-screen-region` handlers
- Consolidated to single implementation using `captureScreenRegion` helper
- Cleaner error handling and logging

#### 5. **Tesseract.js Initialization Fix**
- Fixed "Cannot read properties of null (reading 'host')" error
- Added explicit CDN paths for worker, language data, and core WASM
- Improved error logging for Tesseract initialization failures
- Uses jsdelivr and tessdata CDNs for reliable loading

#### 6. **Enhanced Calculator Functionality**
- Supports advanced math operations: `^` (power), `%`, bitwise operators
- Supports Math functions: `Math.sin()`, `Math.sqrt()`, `Math.PI`, etc.
- Safer evaluation using `new Function()` instead of `eval()`
- Better validation for mathematical expressions

#### 7. **Parallel AI Command Execution**
- AI can now execute multiple non-sequential commands simultaneously
- Sequential commands (navigation, form filling, clicks) run in order
- Parallel commands (volume, brightness, app opening) run immediately
- Improved command queue processing with better error handling

### 🎨 UI/UX Improvements

- Updated Settings Panel to use generic "Authorize Workspace" button
- Removed Google branding from authentication flows
- Improved login prompt messaging
- Better error messages for auth failures

### 🔒 Security Enhancements

- Shell command permission system remains in place
- User authorization required for new shell commands
- Improved command validation and sanitization

### 📝 Code Quality

- Removed dangling code from screen capture refactoring
- Fixed TypeScript lint errors for renamed auth properties
- Improved code organization in main process
- Better separation of concerns for auth handling

### 🐛 Bug Fixes

- Fixed profile photo visibility issues
- Resolved app path resolution on Windows
- Fixed cache persistence across sessions
- Corrected IPC handler naming conflicts

### 🚀 Performance

- LLM cache reduces redundant API calls
- Parallel command execution improves AI responsiveness
- Optimized screen capture workflow

### 🔐 Code Signing Setup

- **Windows**: Added code signing configuration for electron-builder
  - Supports `.pfx` certificates from trusted CAs
  - Automatic signing of executables and DLLs
  - GitHub Actions integration with secrets
  - See `CODE_SIGNING.md` for complete setup guide

- **Configuration Added**:
  - Certificate file path: `certs/comet-browser.pfx`
  - SHA256 signing algorithm
  - RFC3161 timestamping for long-term validity
  - Environment variable support (`CSC_LINK`, `CSC_KEY_PASSWORD`)

- **GitHub Secrets Required**:
  - `WINDOWS_CERTIFICATE`: Base64-encoded PFX file
  - `WINDOWS_CERTIFICATE_PASSWORD`: Certificate password

**Note**: Code signing certificate must be purchased separately (~$100-$400/year). See `CODE_SIGNING.md` for provider recommendations and setup instructions.

### 🐛 Crash Fix: Duplicate IPC Handler

**Issue**: "Attempted to register a second handler for 'capture-screen-region'"

**Cause**: Multiple app instances or hot reload during development

**Solutions**:
1. Close all app instances and restart
2. Kill lingering processes in Task Manager
3. Clear app cache if issue persists
4. Use `npm run check-dups` to verify no duplicate handlers

See `CRASH_FIX.md` for detailed troubleshooting guide.

---

## MCP Integration & AI Agency (Current)

### 🔗 Model Context Protocol (MCP) Support
- **Full MCP Integration**: Connect external Model Context Protocol (MCP) servers to gain new tools and access remote data.
- **Preset Servers**: Out-of-the-box support for GitHub, Google Drive, Dropbox, and more.
- **Centralized MCP Panel**: New dedicated settings section to manage all connected servers.
- **"Refresh All" Functionality**: One-click tool list synchronization for all active servers.
- **Dynamic Tool Discovery**: Automatic detection and display of available tools for each server.

### 🤖 AI Agency Improvements
- **New AI Command**: Added `[OPEN_MCP_SETTINGS]` to allow the AI to programmatically open the integration panel.
- **Permission-Gated Execution**: AI can only execute MCP tools from servers authorized by the user.
- **Smart Integration Prompts**: AI now recognizes when to ask for a new server connection to fulfill a user request.
- **Refined System Instructions**: Enhanced AI's understanding of external file fetching and repository access.

### 🎨 UI/UX Enhancements
- **Deep-Linked Settings**: Programmatic navigation to specific settings sections (e.g., straight to MCP).
- **Responsive Server Cards**: Premium UI for managing server status, tools, and connections.
- **Improved Information Hierarchy**: Better visibility for active tools and server states.

---

## Migration Notes

### For Developers

1. **Auth Token Changes**: If you're using `googleToken` in your code, update to `authToken`
2. **Client ID**: `googleClientId` → `clientId`, `googleRedirectUri` → `redirectUri`
3. **Login Handlers**: `handleGoogleLogin` → `handleLogin`, `handleGoogleSignOut` → `handleSignOut`

### For Users

- Authentication now goes through the landing page exclusively
- Existing sessions should continue working
- Cache will start building automatically on first use

---

## Known Issues

- `.exe` signing still pending (shows "unknown developer" warning)
- `robotjs` availability varies by platform (affects "Find & Click")
- Some Tesseract initialization may still fail on slow connections

## Next Steps

1. Implement code signing for Windows executables
2. Add alternative to `robotjs` for cross-platform click simulation
3. Implement offline Tesseract language data bundling
4. Add more comprehensive error recovery for AI commands
5. Implement request queuing for rate-limited APIs
