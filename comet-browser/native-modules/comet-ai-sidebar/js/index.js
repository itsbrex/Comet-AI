"use strict";

const EventEmitter = require("node:events");

class CometAISidebar extends EventEmitter {
  constructor() {
    super();

    if (process.platform !== "darwin") {
      throw new Error("Comet AI Sidebar is only available on macOS");
    }

    let native;
    try {
      native = require("bindings")("comet_ai_sidebar");
    } catch (err) {
      console.error("Failed to load native module:", err);
      throw new Error(
        "Failed to load Comet AI Sidebar native module. Make sure to build it first with: cd native-modules/comet-ai-sidebar && npm run build"
      );
    }

    this.addon = native;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    await this.addon.initialize();
    this.isInitialized = true;
    this.emit("ready");
  }

  async showWindow() {
    await this.addon.showWindow();
    this.emit("window:shown");
  }

  async hideWindow() {
    await this.addon.hideWindow();
    this.emit("window:hidden");
  }

  async toggleWindow() {
    await this.addon.toggleWindow();
    this.emit("window:toggled");
  }

  async configureLLM({ endpoint, model, apiKey, provider }) {
    return await this.addon.configureLLM(
      endpoint,
      model,
      apiKey || "",
      provider || "ollama"
    );
  }

  async loadLLMConfig() {
    return await this.addon.loadLLMConfig();
  }

  async getLLMConfig() {
    return await this.addon.getLLMConfig();
  }

  async setSidebarVersion(version) {
    return await this.addon.setSidebarVersion(version);
  }

  async getSidebarVersion() {
    return await this.addon.getSidebarVersion();
  }

  async setAutoStart(enabled) {
    return await this.addon.setAutoStart(enabled);
  }

  async getAutoStart() {
    return await this.addon.getAutoStart();
  }

  getVersion() {
    return this.addon.getVersion();
  }

  getPlatform() {
    return this.addon.getPlatform();
  }

  async destroy() {
    if (this.addon && this.addon.destroy) {
      await this.addon.destroy();
    }
    this.emit("destroyed");
    this.removeAllListeners();
  }
}

module.exports = CometAISidebar;
