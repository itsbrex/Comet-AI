//
//  comet_sidebar_addon.mm
//  comet-ai-sidebar
//
//  N-API layer to expose Swift addon to Node.js/Electron
//

#include <napi.h>
#include <string>
#include <memory>

// Forward declarations
extern "C" {
    void *CreateSwiftBridge();
    void SwiftBridgeShowWindow(void *bridge);
    void SwiftBridgeHideWindow(void *bridge);
    void SwiftBridgeToggleWindow(void *bridge);
    void SwiftBridgeConfigureLLM(void *bridge, const char *endpoint, const char *model, const char *apiKey, const char *provider);
    void SwiftBridgeLoadLLMConfig(void *bridge);
    const char *SwiftBridgeGetLLMEndpoint(void *bridge);
    const char *SwiftBridgeGetLLMModel(void *bridge);
    const char *SwiftBridgeGetLLMProvider(void *bridge);
    void SwiftBridgeSetSidebarVersion(void *bridge, const char *version);
    const char *SwiftBridgeGetSidebarVersion(void *bridge);
    void SwiftBridgeSetAutoStart(void *bridge, bool enabled);
    bool SwiftBridgeGetAutoStart(void *bridge);
    void DestroySwiftBridge(void *bridge);
}

namespace CometSidebarAddon {
    
    struct BridgeContext {
        void *bridge;
        
        BridgeContext() : bridge(nullptr) {}
        ~BridgeContext() {
            if (bridge) {
                DestroySwiftBridge(bridge);
                bridge = nullptr;
            }
        }
    };
    
    Napi::String ShowWindow(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        auto *ctx = reinterpret_cast<BridgeContext*>(info.Data());
        
        if (ctx->bridge) {
            SwiftBridgeShowWindow(ctx->bridge);
            return Napi::String::New(env, "Window shown");
        }
        return Napi::String::New(env, "Bridge not initialized");
    }
    
    Napi::String HideWindow(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Data()) {
            auto *ctx = reinterpret_cast<BridgeContext*>(info.Data());
            if (ctx->bridge) {
                SwiftBridgeHideWindow(ctx->bridge);
                return Napi::String::New(env, "Window hidden");
            }
        }
        return Napi::String::New(env, "Bridge not initialized");
    }
    
    Napi::String ToggleWindow(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Data()) {
            auto *ctx = reinterpret_cast<BridgeContext*>(info.Data());
            if (ctx->bridge) {
                SwiftBridgeToggleWindow(ctx->bridge);
                return Napi::String::New(env, "Window toggled");
            }
        }
        return Napi::String::New(env, "Bridge not initialized");
    }
    
    Napi::String ConfigureLLM(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Data()) {
            auto *ctx = reinterpret_cast<BridgeContext*>(info.Data());
            if (ctx->bridge && info.Length() >= 4) {
                std::string endpoint = info[0].As<Napi::String>().Utf8Value();
                std::string model = info[1].As<Napi::String>().Utf8Value();
                std::string apiKey = info[2].As<Napi::String>().Utf8Value();
                std::string provider = info[3].As<Napi::String>().Utf8Value();
                
                SwiftBridgeConfigureLLM(ctx->bridge, endpoint.c_str(), model.c_str(), apiKey.c_str(), provider.c_str());
                return Napi::String::New(env, "LLM configured");
            }
        }
        return Napi::String::New(env, "Bridge not initialized or invalid arguments");
    }
    
    Napi::String LoadLLMConfig(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Data()) {
            auto *ctx = reinterpret_cast<BridgeContext*>(info.Data());
            if (ctx->bridge) {
                SwiftBridgeLoadLLMConfig(ctx->bridge);
                return Napi::String::New(env, "LLM config loaded");
            }
        }
        return Napi::String::New(env, "Bridge not initialized");
    }
    
    Napi::Object GetLLMConfig(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        Napi::Object config = Napi::Object::New(env);
        
        if (info.Data()) {
            auto *ctx = reinterpret_cast<BridgeContext*>(info.Data());
            if (ctx->bridge) {
                config.Set("endpoint", Napi::String::New(env, SwiftBridgeGetLLMEndpoint(ctx->bridge)));
                config.Set("model", Napi::String::New(env, SwiftBridgeGetLLMModel(ctx->bridge)));
                config.Set("provider", Napi::String::New(env, SwiftBridgeGetLLMProvider(ctx->bridge)));
                return config;
            }
        }
        
        config.Set("endpoint", Napi::String::New(env, ""));
        config.Set("model", Napi::String::New(env, ""));
        config.Set("provider", Napi::String::New(env, ""));
        return config;
    }
    
    Napi::String SetSidebarVersion(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Data() && info.Length() >= 1) {
            auto *ctx = reinterpret_cast<BridgeContext*>(info.Data());
            if (ctx->bridge) {
                std::string version = info[0].As<Napi::String>().Utf8Value();
                SwiftBridgeSetSidebarVersion(ctx->bridge, version.c_str());
                return Napi::String::New(env, "Sidebar version set");
            }
        }
        return Napi::String::New(env, "Bridge not initialized or invalid arguments");
    }
    
    Napi::String GetSidebarVersion(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Data()) {
            auto *ctx = reinterpret_cast<BridgeContext*>(info.Data());
            if (ctx->bridge) {
                return Napi::String::New(env, SwiftBridgeGetSidebarVersion(ctx->bridge));
            }
        }
        return Napi::String::New(env, "electron");
    }
    
    Napi::String SetAutoStart(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Data() && info.Length() >= 1) {
            auto *ctx = reinterpret_cast<BridgeContext*>(info.Data());
            if (ctx->bridge) {
                bool enabled = info[0].As<Napi::Boolean>().Value();
                SwiftBridgeSetAutoStart(ctx->bridge, enabled);
                return Napi::String::New(env, enabled ? "Auto-start enabled" : "Auto-start disabled");
            }
        }
        return Napi::String::New(env, "Bridge not initialized or invalid arguments");
    }
    
    Napi::Boolean GetAutoStart(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        
        if (info.Data()) {
            auto *ctx = reinterpret_cast<BridgeContext*>(info.Data());
            if (ctx->bridge) {
                return Napi::Boolean::New(env, SwiftBridgeGetAutoStart(ctx->bridge));
            }
        }
        return Napi::Boolean::New(env, false);
    }
    
    Napi::String GetVersion(const Napi::CallbackInfo& info) {
        return Napi::String::New(info.Env(), "1.0.0");
    }
    
    Napi::String GetPlatform(const Napi::CallbackInfo& info) {
        return Napi::String::New(info.Env(), "darwin");
    }
    
    Napi::String Initialize(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        return Napi::String::New(env, "Comet AI Sidebar initialized");
    }
    
    Napi::Object Init(Napi::Env env, Napi::Object exports) {
        // Check platform
        #ifndef __APPLE__
        Napi::Error::New(env, "Comet AI Sidebar is only available on macOS").ThrowAsJavaScriptException();
        return exports;
        #endif
        
        // Allocate bridge context
        auto *ctx = new BridgeContext();
        ctx->bridge = CreateSwiftBridge();
        
        // Set up exports with data pointer for context
        exports.Set("showWindow", Napi::Function::New(env, ShowWindow, "", ctx));
        exports.Set("hideWindow", Napi::Function::New(env, HideWindow, "", ctx));
        exports.Set("toggleWindow", Napi::Function::New(env, ToggleWindow, "", ctx));
        exports.Set("configureLLM", Napi::Function::New(env, ConfigureLLM, "", ctx));
        exports.Set("loadLLMConfig", Napi::Function::New(env, LoadLLMConfig, "", ctx));
        exports.Set("getLLMConfig", Napi::Function::New(env, GetLLMConfig, "", ctx));
        exports.Set("setSidebarVersion", Napi::Function::New(env, SetSidebarVersion, "", ctx));
        exports.Set("getSidebarVersion", Napi::Function::New(env, GetSidebarVersion, "", ctx));
        exports.Set("setAutoStart", Napi::Function::New(env, SetAutoStart, "", ctx));
        exports.Set("getAutoStart", Napi::Function::New(env, GetAutoStart, "", ctx));
        exports.Set("getVersion", Napi::Function::New(env, GetVersion));
        exports.Set("getPlatform", Napi::Function::New(env, GetPlatform));
        
        return exports;
    }
    
    void Destroy(Napi::Env env, void *data) {
        if (data) {
            delete reinterpret_cast<BridgeContext*>(data);
        }
    }
}

NODE_API_MODULE(comet_ai_sidebar, CometSidebarAddon::Init)
