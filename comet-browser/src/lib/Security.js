"use strict";
/**
 * Security module for Comet-AI
 * Handles sensitive data encryption and verification (E2EE)
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Security = void 0;
exports.Security = {
    // deriveKey could be more complex, but for E2EE we need a consistent way to turn a passphrase into a key
    deriveKey: function (passphrase) { return __awaiter(void 0, void 0, void 0, function () {
        var encoder, data, hash;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    encoder = new TextEncoder();
                    data = encoder.encode(passphrase);
                    return [4 /*yield*/, crypto.subtle.digest('SHA-256', data)];
                case 1:
                    hash = _a.sent();
                    return [4 /*yield*/, crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    }); },
    encrypt: function (text, passphrase) { return __awaiter(void 0, void 0, void 0, function () {
        var key, iv, encoder, encrypted, combined, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!passphrase) {
                        // Fallback for non-E2EE data
                        return [2 /*return*/, "LCL:".concat(btoa(text))];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, exports.Security.deriveKey(passphrase)];
                case 2:
                    key = _a.sent();
                    iv = crypto.getRandomValues(new Uint8Array(12));
                    encoder = new TextEncoder();
                    return [4 /*yield*/, crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, encoder.encode(text))];
                case 3:
                    encrypted = _a.sent();
                    combined = new Uint8Array(iv.length + encrypted.byteLength);
                    combined.set(iv);
                    combined.set(new Uint8Array(encrypted), iv.length);
                    return [2 /*return*/, "E2EE:".concat(btoa(String.fromCharCode.apply(String, Array.from(combined))))];
                case 4:
                    e_1 = _a.sent();
                    console.error("Encryption failed:", e_1);
                    throw new Error("Encryption failed"); // Mandatory throw on failure
                case 5: return [2 /*return*/];
            }
        });
    }); },
    decrypt: function (encoded, passphrase) { return __awaiter(void 0, void 0, void 0, function () {
        var key, combined, iv, data, decrypted, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (encoded.startsWith("LCL:"))
                        return [2 /*return*/, atob(encoded.replace("LCL:", ""))];
                    if (!encoded.startsWith("E2EE:") || !passphrase)
                        return [2 /*return*/, encoded];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, exports.Security.deriveKey(passphrase)];
                case 2:
                    key = _a.sent();
                    combined = new Uint8Array(atob(encoded.replace("E2EE:", ""))
                        .split('')
                        .map(function (c) { return c.charCodeAt(0); }));
                    iv = combined.slice(0, 12);
                    data = combined.slice(12);
                    return [4 /*yield*/, crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data)];
                case 3:
                    decrypted = _a.sent();
                    return [2 /*return*/, new TextDecoder().decode(decrypted)];
                case 4:
                    e_2 = _a.sent();
                    console.error("Decryption failed:", e_2);
                    return [2 /*return*/, "[Error: Decryption Failed - Check Passphrase]"];
                case 5: return [2 /*return*/];
            }
        });
    }); },
    /**
     * AI Fortress System
     * Detects and protects sensitive patterns (API Keys, Secrets)
     */
    patterns: [
        { name: "[Gemini_API_Key]", regex: /AIzaSy[A-Za-z0-9_-]{33}/g },
        { name: "[OpenAI_API_Key]", regex: /sk-[A-Za-z0-9]{48}/g },
        { name: "[Anthropic_API_Key]", regex: /sk-ant-api03-[A-Za-z0-9-_]{93}/g },
        { name: "[Generic_Secret]", regex: /(password|secret|key|token)[=: ]+['"][A-Za-z0-9!@#$%^&*]{8,}['"]/gi }
    ],
    addPattern: function (name, regex) {
        exports.Security.patterns.push({ name: name, regex: regex });
    },
    fortress: function (content) {
        var protectedContent = content;
        var wasProtected = false;
        exports.Security.patterns.forEach(function (p) {
            if (p.regex.test(protectedContent)) {
                console.log("[AI Fortress] Protecting sensitive data: ".concat(p.name)); // Added logging
                protectedContent = protectedContent.replace(p.regex, p.name);
                wasProtected = true;
            }
        });
        return { content: protectedContent, wasProtected: wasProtected };
    }
};
