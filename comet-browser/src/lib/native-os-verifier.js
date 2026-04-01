const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const util = require('util');

const execFileAsync = util.promisify(execFile);

function hasNativeDeviceUnlockSupport() {
  if (process.platform !== 'darwin') {
    return false;
  }

  const bundledBinary = path.join(process.resourcesPath || '', 'bin', 'comet-device-unlock-macos');
  const localBinary = path.join(__dirname, 'bin', 'comet-device-unlock-macos');
  const swiftScript = path.join(__dirname, 'macos-device-unlock.swift');

  return fs.existsSync(bundledBinary) || fs.existsSync(localBinary) || fs.existsSync(swiftScript);
}

async function runHelper(command, args, mode) {
  try {
    const { stdout } = await execFileAsync(command, args, {
      timeout: 120000,
      maxBuffer: 1024 * 1024,
    });
    const trimmed = `${stdout || ''}`.trim();
    if (!trimmed) {
      return { supported: true, approved: false, mode, error: 'Verifier returned no output.' };
    }

    const parsed = JSON.parse(trimmed);
    return {
      supported: parsed.supported !== false,
      approved: !!parsed.approved,
      mode: parsed.mode || mode,
      error: parsed.error || null,
    };
  } catch (error) {
    return {
      supported: true,
      approved: false,
      mode,
      error: error.stderr || error.message || 'Native verification failed.',
    };
  }
}

async function verifyMacDeviceUnlock({ reason, actionText, riskLevel = 'medium' }) {
  const promptReason = reason || `Approve a protected ${riskLevel} risk action in Comet-AI.`;
  const args = ['--reason', promptReason, '--command', actionText || promptReason, '--risk', riskLevel];

  const bundledBinary = path.join(process.resourcesPath || '', 'bin', 'comet-device-unlock-macos');
  if (fs.existsSync(bundledBinary)) {
    return runHelper(bundledBinary, args, 'macos-device-owner-auth');
  }

  const localBinary = path.join(__dirname, 'bin', 'comet-device-unlock-macos');
  if (fs.existsSync(localBinary)) {
    return runHelper(localBinary, args, 'macos-device-owner-auth');
  }

  const swiftScript = path.join(__dirname, 'macos-device-unlock.swift');
  if (fs.existsSync(swiftScript)) {
    return runHelper('swift', [swiftScript, ...args], 'macos-device-owner-auth');
  }

  return {
    supported: false,
    approved: false,
    mode: 'macos-device-owner-auth',
    error: 'No macOS native verifier helper is available in this build.',
  };
}

async function verifyNativeDeviceAccess({ reason, actionText, riskLevel = 'medium' }) {
  if (process.platform === 'darwin') {
    return verifyMacDeviceUnlock({ reason, actionText, riskLevel });
  }

  if (process.platform === 'win32') {
    return {
      supported: false,
      approved: false,
      mode: 'windows-hello-unavailable',
      error: 'Windows Hello verifier helper is not installed in this build yet.',
    };
  }

  return {
    supported: false,
    approved: false,
    mode: 'unsupported-platform',
    error: 'Native device unlock verification is unavailable on this platform.',
  };
}

async function verifyNativeCommandApproval({ command, riskLevel = 'medium' }) {
  return verifyNativeDeviceAccess({
    reason: `Approve running a ${riskLevel} risk shell command in Comet-AI.`,
    actionText: command,
    riskLevel,
  });
}

module.exports = {
  hasNativeDeviceUnlockSupport,
  verifyNativeDeviceAccess,
  verifyNativeCommandApproval,
};
