/**
 * Fast IPC Bridge for Electron-Swift Communication
 * Pre-loaded native modules for instant panel access
 */

const { app, ipcMain } = require('electron');
const path = require('path');
const os = require('os');

class SwiftPanelManager {
  constructor() {
    this.panels = new Map();
    this.isReady = false;
    this.platform = process.platform;
    this.isMac = this.platform === 'darwin';
  }
  
  // Pre-initialize all panels on app ready
  async preInitialize() {
    if (this.isReady) return;
    
    console.log('[SwiftPanel] Pre-initializing panels...');
    
    // Register all panel IPC handlers synchronously
    this.registerPanelHandlers();
    
    this.isReady = true;
    console.log('[SwiftPanel] Pre-initialization complete');
  }
  
  registerPanelHandlers() {
    const panelHandlers = {
      'open-sidebar': this.handleOpenSidebar,
      'open-apple-ai': this.handleOpenAppleAI,
      'open-settings': this.handleOpenSettings,
      'open-command-center': this.handleOpenCommandCenter,
      'open-action-chain': this.handleOpenActionChain,
      'get-panel-state': this.handleGetState
    };
    
    for (const [channel, handler] of Object.entries(panelHandlers)) {
      ipcMain.handle(channel, handler.bind(this));
    }
  }
  
  async handleOpenSidebar(event, ...args) {
    return this.openPanel('sidebar');
  }
  
  async handleOpenAppleAI(event, ...args) {
    return this.openPanel('apple-ai');
  }
  
  async handleOpenSettings(event, ...args) {
    return this.openPanel('settings');
  }
  
  async handleOpenCommandCenter(event, ...args) {
    return this.openPanel('menu');
  }
  
  async handleOpenActionChain(event, ...args) {
    return this.openPanel('action-chain');
  }
  
  async handleGetState(event, ...args) {
    return {
      panels: Array.from(this.panels.keys()),
      ready: this.isReady
    };
  }
  
  async openPanel(name) {
    const startTime = Date.now();
    
    // Check if already open
    if (this.panels.has(name)) {
      const elapsed = Date.now() - startTime;
      console.log(`[SwiftPanel] Panel "${name}" already open (${elapsed}ms)`);
      return { success: true, cached: true };
    }
    
    this.panels.set(name, { opened: Date.now() });
    
    // Use native macOS UI
    try {
      const result = await this.callNativePanel(name);
      const elapsed = Date.now() - startTime;
      console.log(`[SwiftPanel] Opened "${name}" in ${elapsed}ms`);
      return { success: true, time: elapsed };
    } catch (e) {
      console.error(`[SwiftPanel] Error opening ${name}:`, e.message);
      return { success: false, error: e.message };
    }
  }
  
  async callNativePanel(name) {
    // Use HTTP to call native panel (already running)
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: 46203,
        path: `/native-mac-ui/panels/open`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        timeout: 2000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ success: true });
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Timeout')));
      
      req.write(JSON.stringify({ mode: name, relaunchIfRunning: true }));
      req.end();
    });
  }
  
  closePanel(name) {
    if (this.panels.has(name)) {
      this.panels.delete(name);
      console.log(`[SwiftPanel] Closed panel: ${name}`);
    }
  }
  
  closeAll() {
    this.panels.clear();
    console.log('[SwiftPanel] Closed all panels');
  }
  
  isPanelOpen(name) {
    return this.panels.has(name);
  }
  
  getOpenPanels() {
    return Array.from(this.panels.keys());
  }
}

/**
 * Native Menu that stays in memory for instant access
 */
class NativeMenuManager {
  constructor() {
    this.menus = new Map();
    this.lastMenu = null;
  }
  
  prebuildMenus() {
    if (process.platform !== 'darwin') return;
    
    // Pre-build all context menus
    this.menus.set('default', this.buildDefaultMenu());
    this.menus.set('link', this.buildLinkMenu());
    this.menus.set('image', this.buildImageMenu());
    this.menus.set('selection', this.buildSelectionMenu());
    this.menus.set('input', this.buildInputMenu());
    
    console.log('[NativeMenu] Pre-built', this.menus.size, 'menus');
  }
  
  buildDefaultMenu() {
    return [
      { label: 'Cut', accelerator: 'Cmd+X', role: 'cut' },
      { label: 'Copy', accelerator: 'Cmd+C', role: 'copy' },
      { label: 'Paste', accelerator: 'Cmd+V', role: 'paste' },
      { type: 'separator' },
      { label: 'Select All', accelerator: 'Cmd+A', role: 'selectAll' }
    ];
  }
  
  buildLinkMenu() {
    return [
      { label: 'Open Link in New Tab', click: () => {} },
      { label: 'Open Link in New Window', click: () => {} },
      { type: 'separator' },
      { label: 'Copy Link', role: 'copy' },
      { type: 'separator' },
      ...this.buildDefaultMenu()
    ];
  }
  
  buildImageMenu() {
    return [
      { label: 'Save Image As...', click: () => {} },
      { label: 'Copy Image', role: 'copy' },
      { label: 'Inspect', click: () => {} },
      { type: 'separator' },
      ...this.buildDefaultMenu()
    ];
  }
  
  buildSelectionMenu() {
    return [
      { label: 'Search with Google', click: () => {} },
      { label: 'Translate', click: () => {} },
      { label: 'Look Up', click: () => {} },
      { type: 'separator' },
      { label: 'Inspect', click: () => {} },
      { type: 'separator' },
      ...this.buildDefaultMenu()
    ];
  }
  
  buildInputMenu() {
    return [
      { label: 'Undo', accelerator: 'Cmd+Z', role: 'undo' },
      { label: 'Redo', accelerator: 'Cmd+Shift+Z', role: 'redo' },
      { type: 'separator' },
      ...this.buildDefaultMenu()
    ];
  }
  
  getMenu(type = 'default') {
    const menu = this.menus.get(type) || this.menus.get('default');
    this.lastMenu = menu;
    return menu;
  }
}

// Create singleton instances
const swiftPanelManager = new SwiftPanelManager();
const nativeMenuManager = new NativeMenuManager();

// Initialize on app ready
app.whenReady().then(async () => {
  console.log('[SwiftPanel] Initializing...');
  
  // Pre-build menus
  nativeMenuManager.prebuildMenus();
  
  // Pre-initialize panels
  await swiftPanelManager.preInitialize();
  
  console.log('[SwiftPanel] Ready for instant access');
});

// Export for use in main process
module.exports = {
  SwiftPanelManager,
  swiftPanelManager,
  NativeMenuManager,
  nativeMenuManager
};