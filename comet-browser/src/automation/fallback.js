let robot = null;

async function initialize() {
  if (robot !== null) return robot !== null;
  
  const attempts = [
    () => { robot = require('robotjs'); return true; },
    () => { robot = require('@jitsi/robotjs'); return true; },
    () => { robot = require('robotjs-simulate'); return true; }
  ];
  
  for (const attempt of attempts) {
    try {
      if (attempt()) {
        robot.setMouseDelay(2);
        robot.setKeyboardDelay(2);
        console.log('[Automation/Fallback] robotjs loaded successfully');
        return true;
      }
    } catch (e) {
      continue;
    }
  }
  
  console.warn('[Automation/Fallback] robotjs not available');
  return false;
}

function moveMouse(x, y) {
  if (!robot) throw new Error('robotjs not available');
  robot.moveMouse(x, y);
}

function click(x, y, button = 'left', double = false) {
  if (!robot) throw new Error('robotjs not available');
  
  const currentPos = robot.getMousePos();
  if (currentPos.x !== x || currentPos.y !== y) {
    robot.moveMouse(x, y);
  }
  
  if (double) {
    robot.doubleClick(button);
  } else {
    robot.mouseClick(button);
  }
}

function typeText(text) {
  if (!robot) throw new Error('robotjs not available');
  robot.typeString(text);
}

function keyTap(key, modifiers = []) {
  if (!robot) throw new Error('robotjs not available');
  robot.keyTap(key, modifiers);
}

function scroll(x, y, direction, amount = 3) {
  if (!robot) throw new Error('robotjs not available');
  
  robot.moveMouse(x, y);
  robot.scrollMouse(amount, direction);
}

function getMousePos() {
  if (!robot) return { x: 0, y: 0 };
  return robot.getMousePos();
}

module.exports = {
  initialize,
  moveMouse,
  click,
  typeText,
  keyTap,
  scroll,
  getMousePos,
  isAvailable() { return robot !== null; }
};
