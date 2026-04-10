const fs = require('fs');
const path = require('path');
const { spawn, execFile } = require('child_process');
const util = require('util');

const execFileAsync = util.promisify(execFile);
const PANEL_BINARY_NAME = 'Comet-AI-NativePanels';

function getMacNativePanelPaths() {
  const sourceDir = path.join(__dirname, 'native-panels');
  const sourceFile = path.join(__dirname, 'macos-native-panels.swift');
  
  return {
    bundledBinary: path.join(process.resourcesPath || '', 'bin', PANEL_BINARY_NAME),
    localBinary: path.join(__dirname, '..', '..', 'bin', PANEL_BINARY_NAME),
    swiftSource: fs.existsSync(sourceDir) ? sourceDir : sourceFile,
  };
}

async function ensureLocalMacNativePanelBinary(swiftSource, localBinary) {
  if (!fs.existsSync(swiftSource)) {
    return false;
  }

  const isDirectory = fs.statSync(swiftSource).isDirectory();
  let scriptStat;
  let swiftFiles = [];

  if (isDirectory) {
    // Collect all .swift files in the directory
    const getAllSwiftFiles = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
          results = results.concat(getAllSwiftFiles(file));
        } else if (file.endsWith('.swift')) {
          results.push(file);
        }
      });
      return results;
    };
    swiftFiles = getAllSwiftFiles(swiftSource);
    // Use the latest mtime of all files
    scriptStat = { mtimeMs: Math.max(...swiftFiles.map(f => fs.statSync(f).mtimeMs)) };
  } else {
    swiftFiles = [swiftSource];
    scriptStat = fs.statSync(swiftSource);
  }

  const binaryExists = fs.existsSync(localBinary);
  const binaryIsFresh = binaryExists && fs.statSync(localBinary).mtimeMs >= scriptStat.mtimeMs;

  if (binaryIsFresh) {
    return true;
  }

  fs.mkdirSync(path.dirname(localBinary), { recursive: true });
  
  // Prepare compiler arguments
  const args = ['-parse-as-library', ...swiftFiles, '-o', localBinary];
  
  console.log('[MacNativePanels] Compiling native binary from:', isDirectory ? `${swiftFiles.length} files` : swiftSource);
  
  await execFileAsync('swiftc', args, {
    timeout: 120000,
    maxBuffer: 1024 * 1024,
  });
  fs.chmodSync(localBinary, 0o755);
  return true;
}

async function resolveNativePanelLaunchTarget() {
  const { bundledBinary, localBinary, swiftSource } = getMacNativePanelPaths();

  if (fs.existsSync(bundledBinary)) {
    return { command: bundledBinary, argsPrefix: [] };
  }

  try {
    await ensureLocalMacNativePanelBinary(swiftSource, localBinary);
  } catch (error) {
    console.warn('[MacNativePanels] Failed to compile local SwiftUI panel binary:', error.message);
  }

  if (fs.existsSync(localBinary)) {
    return { command: localBinary, argsPrefix: [] };
  }

  throw new Error('SwiftUI panel source was not found.');
}

class MacNativePanelManager {
  constructor({ bridgeUrlProvider, tokenProvider, iconPathProvider, appName = 'Comet-AI' } = {}) {
    this.bridgeUrlProvider = bridgeUrlProvider;
    this.tokenProvider = tokenProvider;
    this.iconPathProvider = iconPathProvider;
    this.appName = appName;
    this.processes = new Map();
  }

  getAvailability() {
    const { bundledBinary, localBinary, swiftSource } = getMacNativePanelPaths();
    return fs.existsSync(bundledBinary) || fs.existsSync(localBinary) || fs.existsSync(swiftSource);
  }

  isRunning(mode) {
    const child = this.processes.get(mode);
    return !!child && !child.killed && child.exitCode === null;
  }

  async show(mode, options = {}) {
    if (process.platform !== 'darwin') {
      throw new Error('Native macOS panels are only available on macOS.');
    }

    if (this.isRunning(mode)) {
      if (options.relaunchIfRunning) {
        this.close(mode);
        await new Promise((resolve) => setTimeout(resolve, 120));
      } else {
        return { success: true, reused: true };
      }
    }

    const target = await resolveNativePanelLaunchTarget();
    const args = [
      ...target.argsPrefix,
      '--mode',
      mode,
      '--bridge-url',
      this.bridgeUrlProvider(),
      '--token',
      this.tokenProvider(),
      '--app-name',
      this.appName,
    ];

    const iconPath = this.iconPathProvider ? this.iconPathProvider() : null;
    if (iconPath) {
      args.push('--icon-path', iconPath);
    }

    const child = spawn(target.command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    child.stdout?.on('data', (data) => console.log(`[MacNativePanels:${mode}] ${data}`));
    child.stderr?.on('data', (data) => console.error(`[MacNativePanels:${mode}] ${data}`));

    child.on('error', (error) => {
      console.error(`[MacNativePanels] Failed to launch ${mode}:`, error);
      this.processes.delete(mode);
    });

    child.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.warn(`[MacNativePanels] Panel ${mode} exited with code ${code}`);
      }
      this.processes.delete(mode);
    });

    this.processes.set(mode, child);
    return { success: true, reused: false };
  }

  close(mode) {
    const child = this.processes.get(mode);
    if (!child) {
      return { success: true, closed: false };
    }

    try {
      child.kill('SIGTERM');
    } catch (error) {
      console.warn(`[MacNativePanels] Failed to stop ${mode}:`, error.message);
    }

    this.processes.delete(mode);
    return { success: true, closed: true };
  }

  async toggle(mode) {
    if (this.isRunning(mode)) {
      return this.close(mode);
    }

    return this.show(mode);
  }

  closeAll() {
    for (const mode of Array.from(this.processes.keys())) {
      this.close(mode);
    }
  }
}

module.exports = {
  MacNativePanelManager,
  getMacNativePanelPaths,
  ensureLocalMacNativePanelBinary,
};
