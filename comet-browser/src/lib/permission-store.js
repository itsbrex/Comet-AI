const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const PERM_LEVELS = ['read', 'interact', 'write', 'execute', 'send'];

class PermissionStore {
  constructor() {
    this.permissions = new Map();
    this.auditLog = [];
    this.storePath = null;
    this.loaded = false;
    this.settings = {
      autoApproveLowRisk: false,
      autoApproveMidRisk: false,
      autoApprovedCommands: [],
    };
    this.autoApprovedCommands = new Set();
  }

  async load() {
    if (this.loaded) return;
    const userDataPath = app.getPath('userData');
    this.storePath = path.join(userDataPath, 'comet-permissions.json');
    this.settingsPath = path.join(userDataPath, 'comet-security-settings.json');
    this.auditPath = path.join(userDataPath, 'comet-audit.jsonl');

    try {
      if (fs.existsSync(this.storePath)) {
        const raw = JSON.parse(fs.readFileSync(this.storePath, 'utf-8'));
        for (const [key, row] of Object.entries(raw)) {
          if (row.expires_at && Date.now() > row.expires_at) continue;
          this.permissions.set(key, row);
        }
      }
      if (fs.existsSync(this.settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(this.settingsPath, 'utf-8'));
        this.settings = { ...this.settings, ...settings };
        this._syncAutoApprovedCommands();
      }
    } catch (e) {
      console.warn('[PermissionStore] Failed to load:', e.message);
    }
    this.loaded = true;
  }

  getSettings() {
    return { ...this.settings };
  }

  _syncAutoApprovedCommands() {
    this.autoApprovedCommands = new Set(
      Array.isArray(this.settings.autoApprovedCommands)
        ? this.settings.autoApprovedCommands.map(cmd => (cmd || '').toLowerCase())
        : []
    );
    this.settings.autoApprovedCommands = [...this.autoApprovedCommands];
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this._saveSettings();
  }

  _saveSettings() {
    if (!this.settingsPath) return;
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (e) {
      console.error('[PermissionStore] Failed to save settings:', e.message);
    }
  }

  setAutoCommand(command, enabled) {
    const key = this._normalizeCommand(command);
    if (!key) return;
    if (enabled) {
      this.autoApprovedCommands.add(key);
    } else {
      this.autoApprovedCommands.delete(key);
    }
    this.settings.autoApprovedCommands = [...this.autoApprovedCommands];
    this._saveSettings();
  }

  getAutoApprovedCommands() {
    return [...this.autoApprovedCommands];
  }

  isAutoExecutable(riskLevel) {
    if (riskLevel === 'low' && this.settings.autoApproveLowRisk) return true;
    if (riskLevel === 'medium' && this.settings.autoApproveMidRisk) return true;
    return false;
  }

  canAutoExecute(command, riskLevel) {
    const key = this._normalizeCommand(command);
    if (this.autoApprovedCommands.has(key)) return true;
    return this.isAutoExecutable(riskLevel);
  }

  _normalizeCommand(command) {
    if (!command) return '';
    return command.trim().split(/\s+/)[0].toLowerCase();
  }

  _save() {
    if (!this.storePath) return;
    try {
      const obj = Object.fromEntries(this.permissions);
      fs.writeFileSync(this.storePath, JSON.stringify(obj, null, 2));
    } catch (e) {
      console.error('[PermissionStore] Failed to save:', e.message);
    }
  }

  grant(key, level, description, sessionOnly = true) {
    if (!PERM_LEVELS.includes(level)) {
      throw new Error(`Invalid permission level: ${level}`);
    }
    const expiresAt = sessionOnly ? Date.now() + (8 * 60 * 60 * 1000) : null;
    this.permissions.set(key, {
      key,
      level,
      granted_at: Date.now(),
      expires_at: expiresAt,
      description,
    });
    this._save();
    this.logAudit(`permission.grant: ${key} (${level}) — ${description}`);
  }

  revoke(key) {
    this.permissions.delete(key);
    this._save();
    this.logAudit(`permission.revoke: ${key}`);
  }

  revokeAll() {
    this.permissions.clear();
    this._save();
    this.logAudit('permission.revokeAll');
  }

  isGranted(key) {
    const row = this.permissions.get(key);
    if (!row) return false;
    if (row.expires_at && Date.now() > row.expires_at) {
      this.permissions.delete(key);
      this._save();
      return false;
    }
    return true;
  }

  getLevel(key) {
    const row = this.permissions.get(key);
    if (!row) return null;
    if (row.expires_at && Date.now() > row.expires_at) {
      this.permissions.delete(key);
      this._save();
      return null;
    }
    return row.level;
  }

  getAll() {
    const result = [];
    for (const [key, row] of this.permissions) {
      if (row.expires_at && Date.now() > row.expires_at) {
        this.permissions.delete(key);
        continue;
      }
      result.push({ ...row });
    }
    return result;
  }

  logAudit(entry) {
    const line = JSON.stringify({ entry, timestamp: Date.now(), date: new Date().toISOString() });
    console.log(`[Audit] ${entry}`);
    if (this.auditPath) {
      try {
        fs.appendFileSync(this.auditPath, line + '\n');
      } catch (e) {
        console.error('[Audit] Write failed:', e.message);
      }
    }
  }

  getAuditLog(limit = 100) {
    if (!this.auditPath || !fs.existsSync(this.auditPath)) return [];
    try {
      const lines = fs.readFileSync(this.auditPath, 'utf-8').trim().split('\n');
      return lines.slice(-limit).map(l => {
        try { return JSON.parse(l); } catch { return { entry: l }; }
      });
    } catch (e) {
      return [];
    }
  }
}

module.exports = { PermissionStore };
