class Plugin {
  constructor(options = {}) {
    this.id = options.id || 'unknown-plugin';
    this.name = options.name || 'Unknown Plugin';
    this.version = options.version || '1.0.0';
    this.description = options.description || '';
    this.author = options.author || 'Unknown';
    this.enabled = false;
    this.config = {};
    this.manifest = {};
    this.logger = {
      info: (...args) => console.log(`[${this.id}]`, ...args),
      warn: (...args) => console.warn(`[${this.id}]`, ...args),
      error: (...args) => console.error(`[${this.id}]`, ...args),
      debug: (...args) => console.debug(`[${this.id}]`, ...args)
    };
  }

  async onLoad() {
    this.logger.info(`${this.name} loaded`);
  }

  async onUnload() {
    this.logger.info(`${this.name} unloaded`);
  }

  getCommands() {
    return {};
  }

  getHooks() {
    return {};
  }

  getSettingsUI() {
    return null;
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    return this.config;
  }

  async requestPermission(permission) {
    this.logger.info(`Requesting permission: ${permission}`);
    return true;
  }

  async callAPI(apiName, ...args) {
    const ipcRenderer = window.require?.('electron')?.ipcRenderer;
    if (!ipcRenderer) {
      throw new Error('Cannot access Electron APIs from renderer');
    }
    return ipcRenderer.invoke(`plugin-api:${apiName}`, ...args);
  }

  async emit(event, data) {
    return this.callAPI('emit', event, data);
  }

  async request(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    const mergedOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, mergedOptions);
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      this.logger.error(`Request failed: ${error.message}`);
      throw error;
    }
  }

  async readFile(filePath) {
    return this.callAPI('read-file', filePath);
  }

  async writeFile(filePath, content) {
    return this.callAPI('write-file', filePath, content);
  }

  async showNotification(title, body, options = {}) {
    return this.callAPI('notification', { title, body, options });
  }

  async log(message, level = 'info') {
    return this.callAPI('log', { pluginId: this.id, message, level });
  }
}

class CommandContext {
  constructor(plugin, params) {
    this.plugin = plugin;
    this.params = params;
    this.logger = plugin.logger;
  }

  success(result) {
    return { success: true, result };
  }

  error(message) {
    return { success: false, error: message };
  }
}

class AICommandBuilder {
  constructor() {
    this.command = {
      type: 'ai_command',
      parameters: {}
    };
  }

  setName(name) {
    this.command.name = name;
    return this;
  }

  setDescription(description) {
    this.command.description = description;
    return this;
  }

  addParameter(name, type, required = false, description = '') {
    this.command.parameters[name] = { type, required, description };
    return this;
  }

  setHandler(handler) {
    this.command.handler = handler;
    return this;
  }

  build() {
    return this.command;
  }
}

const createPlugin = (options) => {
  return new Plugin(options);
};

const createCommand = () => {
  return new AICommandBuilder();
};

const createContext = (plugin, params) => {
  return new CommandContext(plugin, params);
};

module.exports = {
  Plugin,
  CommandContext,
  AICommandBuilder,
  createPlugin,
  createCommand,
  createContext
};
