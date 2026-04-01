"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Terminal, Lock, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Zap, Settings2, Monitor } from 'lucide-react';

const SAFE_COMMANDS = [
  { cmd: 'ls', desc: 'Lists directory contents', category: 'Navigation' },
  { cmd: 'cat', desc: 'Displays file contents', category: 'Navigation' },
  { cmd: 'head', desc: 'Shows first lines of a file', category: 'Navigation' },
  { cmd: 'tail', desc: 'Shows last lines of a file', category: 'Navigation' },
  { cmd: 'pwd', desc: 'Prints current working directory', category: 'Navigation' },
  { cmd: 'cd', desc: 'Changes current directory', category: 'Navigation' },
  { cmd: 'cp', desc: 'Copies files or directories', category: 'File Ops' },
  { cmd: 'mv', desc: 'Moves or renames files', category: 'File Ops' },
  { cmd: 'mkdir', desc: 'Creates new directories', category: 'File Ops' },
  { cmd: 'touch', desc: 'Creates empty files', category: 'File Ops' },
  { cmd: 'rmdir', desc: 'Removes empty directories', category: 'File Ops' },
  { cmd: 'find', desc: 'Searches for files', category: 'Search' },
  { cmd: 'grep', desc: 'Searches for patterns', category: 'Search' },
  { cmd: 'which', desc: 'Locates program executables', category: 'Search' },
  { cmd: 'tar', desc: 'Archives files', category: 'Compression' },
  { cmd: 'zip', desc: 'Compresses files', category: 'Compression' },
  { cmd: 'unzip', desc: 'Extracts ZIP archives', category: 'Compression' },
  { cmd: 'git', desc: 'Version control operations', category: 'Development' },
  { cmd: 'npm', desc: 'Node package manager', category: 'Development' },
  { cmd: 'node', desc: 'Runs JavaScript code', category: 'Development' },
  { cmd: 'python', desc: 'Runs Python scripts', category: 'Development' },
  { cmd: 'pip', desc: 'Python package installer', category: 'Development' },
  { cmd: 'curl', desc: 'Downloads from URLs', category: 'Network' },
  { cmd: 'wget', desc: 'Downloads from URLs', category: 'Network' },
  { cmd: 'chmod', desc: 'Changes file permissions', category: 'System' },
  { cmd: 'du', desc: 'Shows disk usage', category: 'System' },
  { cmd: 'df', desc: 'Shows disk space', category: 'System' },
  { cmd: 'open', desc: 'Opens files with default app', category: 'System' },
];

const MEDIUM_RISK_COMMANDS = [
  { cmd: 'kill', desc: 'Stops running processes', warning: 'Can terminate programs' },
  { cmd: 'pkill', desc: 'Kills processes by name', warning: 'Can terminate programs' },
  { cmd: 'launchctl', desc: 'Manages system services', warning: 'Affects system services' },
  { cmd: 'systemsetup', desc: 'System configuration', warning: 'Modifies system settings' },
  { cmd: 'networksetup', desc: 'Network configuration', warning: 'Modifies network settings' },
];

const HIGH_RISK_COMMANDS = [
  { cmd: 'sudo', desc: 'Admin privileges', warning: '⚠️ Requires authentication, grants root access', blocked: true },
  { cmd: 'rm', desc: 'Remove files', warning: '⚠️ Permanently deletes files', blocked: true },
  { cmd: 'rm -rf', desc: 'Recursive delete', warning: '⚠️ Can wipe entire filesystem', blocked: true },
  { cmd: 'shutdown', desc: 'Shutdown system', warning: '⚠️ Will power off computer', blocked: true },
  { cmd: 'reboot', desc: 'Restart system', warning: '⚠️ Will restart computer', blocked: true },
  { cmd: 'dd', desc: 'Low-level disk ops', warning: '⚠️ Extremely dangerous', blocked: true },
  { cmd: 'mkfs', desc: 'Format disk', warning: '⚠️ Destroys all data', blocked: true },
  { cmd: 'fdisk', desc: 'Partition disk', warning: '⚠️ Modifies partitions', blocked: true },
];

const PermissionSettings = () => {
  const [settings, setSettings] = useState({
    autoApproveLowRisk: false,
    autoApproveMidRisk: false,
    requireDeviceUnlockForManualApproval: true,
    requireDeviceUnlockForVaultAccess: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSafeCommands, setShowSafeCommands] = useState(false);
  const [showMediumCommands, setShowMediumCommands] = useState(false);
  const [showHighCommands, setShowHighCommands] = useState(false);
  const [autoCommands, setAutoCommands] = useState<string[]>([]);

  const normalizeCommandKey = (cmd: string) => {
    if (!cmd) return '';
    return cmd.trim().split(/\s+/)[0].toLowerCase();
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (window.electronAPI?.getSecuritySettings) {
      try {
        const result = await window.electronAPI.getSecuritySettings();
        setSettings({
          autoApproveLowRisk: result.autoApproveLowRisk || false,
          autoApproveMidRisk: result.autoApproveMidRisk || false,
          requireDeviceUnlockForManualApproval:
            result.requireDeviceUnlockForManualApproval !== false,
          requireDeviceUnlockForVaultAccess:
            result.requireDeviceUnlockForVaultAccess !== false,
        });
        const list = Array.isArray(result.autoApprovedCommands) ? result.autoApprovedCommands : [];
        setAutoCommands(list.map((cmd: string) => normalizeCommandKey(cmd)));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    setLoading(false);
  };

  const updateSetting = async (key: string, value: boolean) => {
    setSaving(true);
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    if (window.electronAPI?.updateSecuritySettings) {
      try {
        await window.electronAPI.updateSecuritySettings({ [key]: value });
      } catch (e) {
        console.error('Failed to save settings:', e);
        setSettings(settings);
      }
    }
    setSaving(false);
  };

  const handleAutoCommandToggle = async (cmd: string) => {
    const key = normalizeCommandKey(cmd);
    if (!key) return;
    const enabled = !autoCommands.includes(key);
    setAutoCommands((prev) =>
      enabled ? [...prev, key] : prev.filter((item) => item !== key)
    );
    if (window.electronAPI?.setAutoApprovalCommand) {
      try {
        await window.electronAPI.setAutoApprovalCommand({ command: key, enabled });
      } catch (e) {
        console.error('Failed to update auto command:', e);
      }
    }
  };

  const openSystemSettings = (type: string) => {
    const urls: Record<string, string> = {
      screen: 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
      accessibility: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
      automation: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Automation',
    };
    if (window.electronAPI?.openSystemSettings) {
      window.electronAPI.openSystemSettings(urls[type] || '');
    }
  };

  const getPlatform = (): string => {
    if (typeof window !== 'undefined' && window.electronAPI?.getPlatform) {
      return window.electronAPI.getPlatform();
    }
    return 'darwin';
  };

  const platform = getPlatform();
  const isMac = platform === 'darwin';
  const commandCandidates = [...SAFE_COMMANDS, ...MEDIUM_RISK_COMMANDS];
  const isCommandAuto = (cmd: string) => autoCommands.includes(normalizeCommandKey(cmd));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-3xl p-6 border border-sky-500/20">
        <div className="flex items-center gap-4 mb-3">
          <Shield size={28} className="text-sky-400" />
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wide">Command Auto-Approval</h3>
            <p className="text-white/50 text-sm">Configure which commands run automatically</p>
          </div>
        </div>
      </div>

      {/* Auto-Run Settings */}
      <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Zap size={20} className="text-yellow-400" />
          <h4 className="text-lg font-bold text-white">Auto-Run Commands</h4>
          {saving && <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin ml-2" />}
        </div>

        {/* Low Risk Toggle */}
        <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/20 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle size={20} className="text-green-400" />
              </div>
              <div>
                <h5 className="text-white font-bold">Low Risk Commands</h5>
                <p className="text-white/50 text-xs">Read-only & file viewing (ls, cat, grep, etc.)</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('autoApproveLowRisk', !settings.autoApproveLowRisk)}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                settings.autoApproveLowRisk ? 'bg-green-500' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 ${
                  settings.autoApproveLowRisk ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Medium Risk Toggle */}
        <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/20 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-yellow-400" />
              </div>
              <div>
                <h5 className="text-white font-bold">Medium Risk Commands</h5>
                <p className="text-white/50 text-xs">Process & network commands (kill, curl, etc.)</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('autoApproveMidRisk', !settings.autoApproveMidRisk)}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                settings.autoApproveMidRisk ? 'bg-yellow-500' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 ${
                  settings.autoApproveMidRisk ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* High Risk Info */}
        <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <XCircle size={20} className="text-red-400" />
            </div>
            <div>
              <h5 className="text-white font-bold">High Risk Commands</h5>
              <p className="text-white/50 text-xs">Always requires confirmation (sudo, rm, shutdown, etc.)</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-sky-500/5 rounded-2xl border border-sky-500/20 mt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                <Lock size={20} className="text-sky-400" />
              </div>
              <div>
                <h5 className="text-white font-bold">Device Unlock For Manual Approval</h5>
                <p className="text-white/50 text-xs">When a shell command is not auto-approved, require a native OS unlock prompt before it runs.</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('requireDeviceUnlockForManualApproval', !settings.requireDeviceUnlockForManualApproval)}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                settings.requireDeviceUnlockForManualApproval ? 'bg-sky-500' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 ${
                  settings.requireDeviceUnlockForManualApproval ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="p-4 bg-violet-500/5 rounded-2xl border border-violet-500/20 mt-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Lock size={20} className="text-violet-400" />
              </div>
              <div>
                <h5 className="text-white font-bold">Device Unlock For Neural Vault</h5>
                <p className="text-white/50 text-xs">Require a native OS unlock prompt before revealing, copying, or autofilling saved login credentials.</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('requireDeviceUnlockForVaultAccess', !settings.requireDeviceUnlockForVaultAccess)}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                settings.requireDeviceUnlockForVaultAccess ? 'bg-violet-500' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-300 ${
                  settings.requireDeviceUnlockForVaultAccess ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-white">Auto-approved commands</h4>
            <p className="text-xs text-white/40">Commands the AI can execute without asking again.</p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.4em] text-white/40">
            {autoCommands.length} total
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {autoCommands.length === 0 && (
            <span className="text-[10px] text-white/60">No commands yet — toggle one below.</span>
          )}
          {autoCommands.map((cmd) => (
            <span key={cmd} className="px-3 py-1 rounded-full border border-white/10 text-[10px] uppercase tracking-[0.35em] text-white/60">
              {cmd}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-white">Select commands to auto-run</h4>
            <p className="text-xs text-white/40">Toggle individual commands for auto-approval.</p>
          </div>
          <span className="text-[11px] uppercase tracking-[0.4em] text-white/40">Safe + medium risks</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {commandCandidates.map((command) => {
            const enabled = isCommandAuto(command.cmd);
            return (
              <div key={command.cmd} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.4em] text-white/40">
                    {'category' in command ? command.category : 'Medium Risk'}
                  </div>
                  <p className="text-sm font-bold text-white">{command.cmd}</p>
                  <p className="text-[11px] text-white/60">{command.desc}</p>
                </div>
                <button
                  onClick={() => handleAutoCommandToggle(command.cmd)}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.4em] transition-all ${
                    enabled ? 'bg-green-500/80 text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  {enabled ? 'Auto ON' : 'Auto OFF'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Command Lists */}
      <div className="space-y-4">
        {/* Low Risk Commands */}
        <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setShowSafeCommands(!showSafeCommands)}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-white font-bold">Low Risk Commands</span>
              <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">{SAFE_COMMANDS.length} commands</span>
            </div>
            {showSafeCommands ? <ChevronUp size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-white/40" />}
          </button>
          {showSafeCommands && (
            <div className="p-4 border-t border-white/10">
              <div className="grid gap-2">
                {SAFE_COMMANDS.map((cmd) => (
                  <div key={cmd.cmd} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                    <code className="text-sky-400 font-mono text-sm bg-black/30 px-2 py-1 rounded">{cmd.cmd}</code>
                    <span className="text-white/60 text-sm flex-1">{cmd.desc}</span>
                    <span className="text-xs text-green-400/60 bg-green-500/10 px-2 py-1 rounded-full">{cmd.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Medium Risk Commands */}
        <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setShowMediumCommands(!showMediumCommands)}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-yellow-400" />
              <span className="text-white font-bold">Medium Risk Commands</span>
              <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">{MEDIUM_RISK_COMMANDS.length} commands</span>
            </div>
            {showMediumCommands ? <ChevronUp size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-white/40" />}
          </button>
          {showMediumCommands && (
            <div className="p-4 border-t border-white/10">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4">
                <p className="text-yellow-300 text-sm">
                  ⚠️ These commands can affect running processes and network. Enable auto-run only if you understand the risks.
                </p>
              </div>
              <div className="grid gap-2">
                {MEDIUM_RISK_COMMANDS.map((cmd) => (
                  <div key={cmd.cmd} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                    <code className="text-sky-400 font-mono text-sm bg-black/30 px-2 py-1 rounded">{cmd.cmd}</code>
                    <span className="text-white/60 text-sm flex-1">{cmd.desc}</span>
                    <span className="text-xs text-yellow-400/80 bg-yellow-500/10 px-2 py-1 rounded-full">{cmd.warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* High Risk Commands */}
        <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setShowHighCommands(!showHighCommands)}
            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all"
          >
            <div className="flex items-center gap-3">
              <XCircle size={18} className="text-red-400" />
              <span className="text-white font-bold">High Risk Commands</span>
              <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded-full">{HIGH_RISK_COMMANDS.length} commands</span>
            </div>
            {showHighCommands ? <ChevronUp size={18} className="text-white/40" /> : <ChevronDown size={18} className="text-white/40" />}
          </button>
          {showHighCommands && (
            <div className="p-4 border-t border-white/10">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <p className="text-red-300 text-sm">
                  🚫 These commands are always blocked and require explicit user confirmation. They can cause data loss or system changes.
                </p>
              </div>
              <div className="grid gap-2">
                {HIGH_RISK_COMMANDS.map((cmd) => (
                  <div key={cmd.cmd} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl">
                    <code className="text-red-400 font-mono text-sm bg-black/30 px-2 py-1 rounded">{cmd.cmd}</code>
                    <span className="text-white/60 text-sm flex-1">{cmd.desc}</span>
                    <span className="text-xs text-red-400/80 bg-red-500/10 px-2 py-1 rounded-full">Always blocked</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <Settings2 size={18} className="text-blue-400 mt-0.5" />
          <div>
            <h5 className="text-blue-300 font-bold mb-1">How Auto-Run Works</h5>
            <ul className="text-blue-200/70 text-sm space-y-1">
              <li>• <strong>Low Risk:</strong> Read-only commands (viewing files, navigation) - safe to auto-run</li>
              <li>• <strong>Medium Risk:</strong> Commands that affect processes/network - enable if you trust the AI</li>
              <li>• <strong>High Risk:</strong> Dangerous commands (delete, shutdown) - always require confirmation</li>
              <li>• <strong>Manual Approvals:</strong> When device unlock is enabled, approved shell commands also trigger a native OS verification prompt before execution</li>
            </ul>
          </div>
        </div>
      </div>

      {/* macOS Permissions Section */}
      {isMac && (
        <>
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Lock size={18} className="text-white/60" />
              System Permissions
            </h4>
            <div className="grid gap-3">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor size={20} className="text-red-400" />
                  <div>
                    <span className="text-white font-medium">Screen Recording</span>
                    <p className="text-white/40 text-xs">Screenshot & OCR</p>
                  </div>
                </div>
                <button
                  onClick={() => openSystemSettings('screen')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white transition-all"
                >
                  Configure
                </button>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Terminal size={20} className="text-purple-400" />
                  <div>
                    <span className="text-white font-medium">Automation</span>
                    <p className="text-white/40 text-xs">Shell commands</p>
                  </div>
                </div>
                <button
                  onClick={() => openSystemSettings('automation')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white transition-all"
                >
                  Configure
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PermissionSettings;
