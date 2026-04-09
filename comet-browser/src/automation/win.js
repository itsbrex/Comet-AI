const { execSync, spawn } = require('child_process');
const path = require('path');

let isInitialized = false;

async function initialize() {
  if (isInitialized) return true;
  
  try {
    const automationBinary = path.join(__dirname, '..', '..', 'bin', 'comet-automation.exe');
    
    try {
      execSync(`where "${automationBinary}"`, { stdio: 'ignore' });
      console.log('[Automation/Win] Found native Windows automation binary');
    } catch {
      console.log('[Automation/Win] Using PowerShell automation fallback');
    }
    
    isInitialized = true;
    return true;
  } catch (err) {
    console.error('[Automation/Win] Init failed:', err.message);
    return false;
  }
}

function moveMouse(x, y) {
  const script = `
    Add-Type -MemberDefinition @"
[DllImport("user32.dll")]
public static extern bool SetCursorPos(int X, int Y);
"@ -Name "Win32" -Namespace "Win32Functions" -PassThru | Out-Null
[Win32.Win32Functions]::SetCursorPos(${x}, ${y})
  `;
  
  try {
    execSync(`powershell -ExecutionPolicy Bypass -Command "${script.replace(/\n/g, ';')}"`, { 
      stdio: 'ignore',
      windowsHide: true 
    });
  } catch {
    execSync(`powershell -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = [System.Drawing.Point]::new(${x}, ${y})"`, {
      stdio: 'ignore',
      windowsHide: true
    });
  }
}

function click(x, y, button = 'left', double = false) {
  moveMouse(x, y);
  
  const mouseDown = button === 'right' ? 'RightDown' : (button === 'middle' ? 'MiddleDown' : 'LeftDown');
  const mouseUp = button === 'right' ? 'RightUp' : (button === 'middle' ? 'MiddleUp' : 'LeftUp');
  
  const clickCount = double ? 2 : 1;
  
  for (let i = 0; i < clickCount; i++) {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -MemberDefinition @"
[DllImport("user32.dll", CharSet=CharSet.Auto, CallingConvention=CallingConvention.StdCall)]
public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);
[DllImport("user32.dll")]
public static extern bool SetCursorPos(int X, int Y);
private const uint MOUSEEVENTF_LEFTDOWN = 0x02;
private const uint MOUSEEVENTF_LEFTUP = 0x04;
private const uint MOUSEEVENTF_RIGHTDOWN = 0x08;
private const uint MOUSEEVENTF_RIGHTUP = 0x10;
private const uint MOUSEEVENTF_MIDDLEDOWN = 0x20;
private const uint MOUSEEVENTF_MIDDLEUP = 0x40;
"@ -Name "Mouse" -Namespace "Win32" -PassThru | Out-Null

[Win32.Mouse]::SetCursorPos(${x}, ${y})
Start-Sleep -Milliseconds 10
[Win32.Mouse]::mouse_event(${button === 'right' ? '0x08' : (button === 'middle' ? '0x20' : '0x02')}, 0, 0, 0, 0)
Start-Sleep -Milliseconds 10
[Win32.Mouse]::mouse_event(${button === 'right' ? '0x10' : (button === 'middle' ? '0x40' : '0x04')}, 0, 0, 0, 0)
    `;
    
    try {
      execSync(`powershell -ExecutionPolicy Bypass -Command "${script.replace(/\n/g, ' ')}"`, {
        stdio: 'ignore',
        windowsHide: true
      });
    } catch {
      const pyautoguiScript = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = [System.Drawing.Point]::new(${x}, ${y}); Start-Sleep -Milliseconds 10; [System.Windows.Forms.SendKeys]::SendWait('{${button === 'right' ? '{RIGHT}' : '{LEFT}'}}')`;
      execSync(`powershell -ExecutionPolicy Bypass -Command "${pyautoguiScript}"`, {
        stdio: 'ignore',
        windowsHide: true
      });
    }
  }
}

function typeText(text) {
  const sanitized = text
    .replace(/'/g, "''")
    .replace(/"/g, '`"')
    .replace(/\{/g, '{{}')
    .replace(/\}/g, '{{}');
  
  const script = `
    Add-Type -AssemblyName System.Windows.Forms
    Start-Sleep -Milliseconds 50
    [System.Windows.Forms.SendKeys]::SendWait("${sanitized}")
  `;
  
  try {
    execSync(`powershell -ExecutionPolicy Bypass -Command "${script.replace(/\n/g, ' ')}"`, {
      stdio: 'ignore',
      windowsHide: true
    });
  } catch (err) {
    console.warn('[Automation/Win] TypeText failed:', err.message);
  }
}

function keyTap(key, modifiers = []) {
  const keyMap = {
    'return': '{ENTER}',
    'enter': '{ENTER}',
    'tab': '{TAB}',
    'escape': '{ESC}',
    'esc': '{ESC}',
    'delete': '{DELETE}',
    'backspace': '{BACKSPACE}',
    'up': '{UP}',
    'down': '{DOWN}',
    'left': '{LEFT}',
    'right': '{RIGHT}',
    'home': '{HOME}',
    'end': '{END}',
    'pageup': '{PGUP}',
    'pagedown': '{PGDN}',
    'space': ' ',
    'add': '+',
    'subtract': '-'
  };
  
  let keyStr = keyMap[key.toLowerCase()] || key.toUpperCase();
  
  const modPrefix = {
    'command': '^',
    'control': '^',
    'ctrl': '^',
    'alt': '%',
    'shift': '+'
  };
  
  let prefix = modifiers.map(m => modPrefix[m.toLowerCase()]).filter(Boolean).join('');
  
  const script = `
    Add-Type -AssemblyName System.Windows.Forms
    Start-Sleep -Milliseconds 50
    [System.Windows.Forms.SendKeys]::SendWait("${prefix}${keyStr}")
  `;
  
  try {
    execSync(`powershell -ExecutionPolicy Bypass -Command "${script.replace(/\n/g, ' ')}"`, {
      stdio: 'ignore',
      windowsHide: true
    });
  } catch (err) {
    console.warn('[Automation/Win] KeyTap failed:', err.message);
  }
}

function scroll(x, y, direction, amount = 3) {
  moveMouse(x, y);
  
  const dirMap = {
    'up': -120,
    'down': 120,
    'left': -120,
    'right': 120
  };
  
  const delta = (dirMap[direction] || -120) * amount;
  
  const script = `
    Add-Type -MemberDefinition @"
[DllImport("user32.dll")]
public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
"@ -Name "Mouse" -Namespace "Win32" -PassThru | Out-Null
[Win32.Mouse]::mouse_event(0x0800, 0, 0, ${delta}, 0)
  `;
  
  try {
    execSync(`powershell -ExecutionPolicy Bypass -Command "${script.replace(/\n/g, ' ')}"`, {
      stdio: 'ignore',
      windowsHide: true
    });
  } catch {
    execSync(`powershell -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('{PGUP}')"`, {
      stdio: 'ignore',
      windowsHide: true
    });
  }
}

function getMousePos() {
  try {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      $pos = [System.Windows.Forms.Cursor]::Position
      Write-Output "$($pos.X),$($pos.Y)"
    `;
    const output = execSync(`powershell -ExecutionPolicy Bypass -Command "${script.replace(/\n/g, ' ')}"`, {
      encoding: 'utf8',
      windowsHide: true
    });
    const [x, y] = output.trim().split(',').map(Number);
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
