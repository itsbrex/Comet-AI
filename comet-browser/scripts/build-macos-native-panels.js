const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

if (process.platform !== 'darwin') {
  console.log('[build-macos-native-panels] Skipping: not running on macOS.');
  process.exit(0);
}

const rootDir = path.resolve(__dirname, '..');
const swiftSourceDir = path.join(rootDir, 'src', 'lib', 'native-panels');
const legacySwiftSource = path.join(rootDir, 'src', 'lib', 'macos-native-panels.swift');
const outputDir = path.join(rootDir, 'bin');
const outputBinary = path.join(outputDir, 'Comet-AI-NativePanels');

const collectSwiftFiles = (dir) => {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  return items.flatMap((item) => {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) return collectSwiftFiles(fullPath);
    return item.name.endsWith('.swift') ? [fullPath] : [];
  });
};

const swiftFiles = fs.existsSync(swiftSourceDir)
  ? collectSwiftFiles(swiftSourceDir)
  : (fs.existsSync(legacySwiftSource) ? [legacySwiftSource] : []);

if (swiftFiles.length === 0) {
  console.log('[build-macos-native-panels] Skipping: Swift source not found.');
  process.exit(0);
}

fs.mkdirSync(outputDir, { recursive: true });
execFileSync('swiftc', ['-parse-as-library', ...swiftFiles, '-o', outputBinary], { stdio: 'inherit' });
fs.chmodSync(outputBinary, 0o755);
console.log(`[build-macos-native-panels] Built ${outputBinary}`);
