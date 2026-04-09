const { execSync, spawn } = require('child_process');
const path = require('path');

let isInitialized = false;
let nativeBridge = null;

async function initialize() {
  if (isInitialized) return true;
  
  try {
    const automationBinary = path.join(__dirname, '..', '..', 'bin', 'comet-automation');
    const swiftBridge = path.join(__dirname, '..', '..', 'bin', 'automation-bridge');
    
    try {
      execSync(`test -x "${swiftBridge}"`, { stdio: 'ignore' });
      nativeBridge = swiftBridge;
      isInitialized = true;
      console.log('[Automation/macOS] Using native Swift bridge');
      return true;
    } catch {
      console.log('[Automation/macOS] Swift bridge not found, using applescript fallback');
    }
    
    isInitialized = true;
    return true;
  } catch (err) {
    console.error('[Automation/macOS] Init failed:', err.message);
    return false;
  }
}

function moveMouse(x, y) {
  const script = `
    tell application "System Events"
      set the position of the mouse to {${x}, ${y}}
    end tell
  `;
  execSync(`osascript -e '${script}'`, { stdio: 'ignore' });
}

function click(x, y, button = 'left', double = false) {
  moveMouse(x, y);
  
  const clickScript = double ? 2 : 1;
  
  if (button === 'left') {
    const script = double
      ? `tell application "System Events" to click at {${x}, ${y}}`
      : `tell application "System Events" to click at {${x}, ${y}}`;
    execSync(`osascript -e '${script}'`, { stdio: 'ignore' });
  } else if (button === 'right') {
    const script = `tell application "System Events" to click at {${x}, ${y}}`;
    execSync(`osascript -e '${script}'`, { stdio: 'ignore' });
  } else if (button === 'middle') {
    moveMouse(x, y);
    execSync('cliclick m', { stdio: 'ignore' });
  }
}

function typeText(text) {
  const sanitized = text
    .replace(/'/g, "'\"'\"'")
    .replace(/\n/g, '" & return & "');
  
  const script = `
    tell application "System Events"
      keystroke "${sanitized}"
    end tell
  `;
  execSync(`osascript -e '${script}'`, { stdio: 'ignore' });
}

function keyTap(key, modifiers = []) {
  const modMap = {
    'command': 'command down',
    'control': 'control down',
    'alt': 'option down',
    'shift': 'shift down'
  };
  
  const keyMap = {
    'return': 'return',
    'enter': 'enter',
    'tab': 'tab',
    'escape': 'escape',
    'delete': 'delete',
    'backspace': 'delete',
    'up': 'up arrow',
    'down': 'down arrow',
    'left': 'left arrow',
    'right': 'right arrow',
    'home': 'home',
    'end': 'end',
    'pageup': 'page up',
    'pagedown': 'page down',
    'space': ' '
  };
  
  const keyName = keyMap[key.toLowerCase()] || key;
  const mods = modifiers.map(m => modMap[m]).filter(Boolean);
  
  const script = `
    tell application "System Events"
      ${mods.length ? `key code ${getKeyCode(key)} using ${mods.join(', ')}` : `key code ${getKeyCode(key)}`}
    end tell
  `;
  
  try {
    execSync(`osascript -e '${script}'`, { stdio: 'ignore' });
  } catch {
    execSync(`osascript -e 'tell application "System Events" to ${mods.length ? `keystroke "${key}" using ${mods.join(', ')}` : `keystroke "${key}"`}'`, { stdio: 'ignore' });
  }
}

function getKeyCode(key) {
  const keyCodes = {
    'a': 0, 's': 1, 'd': 2, 'f': 3, 'h': 4, 'g': 5, 'z': 6, 'x': 7, 'c': 8, 'v': 9,
    'b': 11, 'q': 12, 'w': 13, 'e': 14, 'r': 15, 'y': 19, 't': 17, '1': 18, '2': 19,
    '3': 20, '4': 21, '6': 22, '5': 23, '9': 25, '7': 26, '8': 28, '0': 29, 'o': 31,
    'u': 32, 'i': 34, 'p': 35, 'l': 37, 'j': 38, 'k': 40, 'n': 45, 'm': 46, ',' : 43,
    '.': 47, '/': 44, 'return': 36, 'tab': 48, 'space': 49, 'delete': 51, 'escape': 53,
    'right': 124, 'left': 123, 'down': 125, 'up': 126
  };
  return keyCodes[key.toLowerCase()] || 0;
}

function scroll(x, y, direction, amount = 3) {
  moveMouse(x, y);
  
  const dirMap = {
    'up': 1,
    'down': -1,
    'left': 2,
    'right': -2
  };
  
  const dir = dirMap[direction] || 1;
  
  for (let i = 0; i < amount; i++) {
    execSync(`osascript -e 'tell application "System Events" to scroll ${dir} of scroll area 1'`, { stdio: 'ignore' });
  }
}

function getMousePos() {
  try {
    const output = execSync('osascript -e \'tell application "System Events" to get position of mouse\'', { encoding: 'utf8' });
    const [x, y] = output.trim().split(', ').map(Number);
    return { x, y };
  } catch {
    return { x: 0, y: 0 };
  }
}

module.exports = {
  initialize,
  moveMouse,
  click,
  typeText,
  keyTap,
  scroll,
  getMousePos,
  isAvailable: true
};
