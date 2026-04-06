"use strict";
/**
 * Security module for Comet-AI
 * Handles sensitive data encryption, verification (E2EE), and advanced SecureDOM parsing
 *
 * SECURITY PHILOSOPHY: "AI Sees Pixels, Not Code"
 * - Visual Sandbox: AI perceives via screenshots + OCR only, never raw HTML/JS
 * - Syntactic Firewall: Multi-layer regex filtering before content reaches LLM
 * - Injection Prevention: Contextual analysis with stateful pattern matching
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
    // ============================================
    // ENCRYPTION & SECURE STORAGE
    // ============================================
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
                    console.error("[Encryption] Failed:", e_1);
                    throw new Error("Encryption failed");
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
                    console.error("[Decryption] Failed:", e_2);
                    return [2 /*return*/, "[Error: Decryption Failed - Check Passphrase]"];
                case 5: return [2 /*return*/];
            }
        });
    }); },
    // ============================================
    // SECURE DOM PARSER - "AI Sees Pixels"
    // ============================================
    /**
     * Advanced SecureDOM Parser
     * Ensures AI only sees rendered content (pixels), never executable code
     */
    SecureDOMParser: {
        // Track suspicious patterns found in current content
        foundSuspiciousPatterns: new Set(),
        // Multi-layer regex patterns for injection detection
        injectionPatterns: {
            // Layer 1: Shell Execution Primitives
            shellPrimitives: [
                /rm\s+-rf\s+\//gi,
                /rm\s+-rf\s+[A-Za-z0-9_\/]+/gi,
                /del\s+\/[sfq]\s+/gi,
                /format\s+[A-Z]:/gi,
                /mkfs/gi,
                /dd\s+if=/gi,
                /shutdown\s+/gi,
                /halt\s+/gi,
                /init\s+0/gi,
                /systemctl\s+stop/gi,
                /powershell\s+-enc/gi,
                /cmd\.exe\s+\/c/gi,
                /bash\s+-c/gi,
                /sh\s+-c/gi,
                /zsh\s+-c/gi,
                /fish\s+-c/gi,
                /;\s*rm\s+/gi,
                /\|\s*rm\s+/gi,
                /&&\s*rm\s+/gi,
                /\|\|\s*rm\s+/gi,
                /eval\s*\(/gi,
                /exec\s*\(/gi,
                /system\s*\(/gi,
                /passthru\s*\(/gi,
                /shell_exec\s*\(/gi,
                /`[^`]*\$\([^)]*\)[^`]*`/gi
            ],
            // Layer 2: Encoding & Obfuscation
            encodingPatterns: [
                /\\\\x[0-9a-f]{2}/gi,
                /\\\\u[0-9a-f]{4}/gi,
                /&#x[0-9a-f]+;/gi,
                /&#\d+;/gi,
                /%[0-9a-f]{2}/gi,
                /base64_decode\s*\(/gi,
                /base64_encode\s*\(/gi,
                /rot13\s*\(/gi,
                /str_rot13\s*\(/gi,
                /gzinflate\s*\(/gi,
                /gzdeflate\s*\(/gi,
                /strrev\s*\(/gi,
                /hex2bin\s*\(/gi,
                /bin2hex\s*\(/gi,
                /chr\(\d+\)/gi,
                /ord\(/gi,
                /pack\s*\(['"](?:H\*|a\*|A\*)/gi,
                /unpack\s*\(/gi,
                /mcrypt\s*\(/gi,
                /openssl_decrypt\s*\(/gi,
                /crypt\s*\(/gi
            ],
            // Layer 3: Prompt Injection Attempts
            injectionAttempts: [
                /ignore\s+(?:all|previous|above)\s+(?:instructions?|prompts?|rules?)/gi,
                /disregard\s+(?:your|all)\s+(?:previous|above)\s+(?:instructions?|rules?)/gi,
                /forget\s+(?:your|all)\s+(?:previous|above)\s+(?:instructions?|rules?)/gi,
                /you\s+are\s+now\s+(?:ignoring|disregarding)/gi,
                /new\s+(?:system|base)\s+(?:prompt|instruct)/gi,
                /\{(?:system|base)_prompt\}/gi,
                /<\/?(?:system|base)_prompt>/gi,
                /\[INST\][\s\S]*\[\/INST\]/gi,
                /<<<[\s\S]*?>>>/g,
                /\{\{[\s\S]*?\}\}/g,
                /<\?php[\s\S]*?\?>/gi,
                /<\?[\s\S]*?\?>/gi,
                /<script[\s\S]*?<\/script>/gi,
                /javascript:/gi,
                /data:text\/html/gi,
                /on\w+\s*=/gi,
                /<iframe/gi,
                /vbscript:/gi,
                /livescript:/gi,
                /x-javascript/gi
            ],
            // Layer 4: Privilege Escalation
            privilegeEscalation: [
                /sudo\s+/gi,
                /su\s+-\s+/gi,
                /chmod\s+[0-7]{3,4}/gi,
                /chown\s+/gi,
                /chgrp\s+/gi,
                /setuid/gi,
                /setgid/gi,
                /capability\s+/gi,
                /useradd\s+/gi,
                /usermod\s+/gi,
                /passwd\s+/gi,
                /gpasswd\s+/gi,
                /visudo\s+/gi,
                /pkexec\s+/gi,
                /policykit\s+/gi,
                /polkit\s+/gi,
                /dbus-send\s+/gi
            ],
            // Layer 5: Network & Exfiltration
            networkPatterns: [
                /curl\s+-/gi,
                /wget\s+/gi,
                /nc\s+-/gi,
                /netcat\s+/gi,
                /telnet\s+/gi,
                /ssh\s+/gi,
                /scp\s+/gi,
                /rsync\s+/gi,
                /ftp\s+/gi,
                /tftp\s+/gi,
                /sftp\s+/gi,
                /smbclient\s+/gi,
                /mount\s+-t\s+cifs/gi,
                /mount\s+-t\s+nfs/gi,
                /\\?\.exe\s+http/gi,
                /certutil\s+/gi,
                /bitsadmin\s+/gi,
                /Invoke-WebRequest/gi,
                /Invoke-RestMethod/gi,
                /New-Object\s+Net\.WebClient/gi
            ],
            // Layer 6: API Keys & Secrets (Contextual)
            apiKeyPatterns: [
                { pattern: /AIzaSy[A-Za-z0-9_-]{33}/g, name: "Google API Key" },
                { pattern: /sk-[A-Za-z0-9]{48}/g, name: "OpenAI API Key" },
                { pattern: /sk-ant-api03-[A-Za-z0-9-_]{93}/g, name: "Anthropic API Key" },
                { pattern: /ghp_[A-Za-z0-9]{36}/g, name: "GitHub Token" },
                { pattern: /gho_[A-Za-z0-9]{36}/g, name: "GitHub OAuth" },
                { pattern: /xox[baprs]-[A-Za-z0-9]{10,}/g, name: "Slack Token" },
                { pattern: /AKIA[0-9A-Z]{16}/g, name: "AWS Access Key" },
                { pattern: /[a-zA-Z0-9_-]*:[a-zA-Z0-9_-]*@[a-zA-Z0-9._-]/g, name: "Credential URL" },
                { pattern: /password\s*[=:]\s*['"][^'"]{8,}['"]/gi, name: "Hardcoded Password" },
                { pattern: /api[_-]?key\s*[=:]\s*['"][^'"]{16,}['"]/gi, name: "Generic API Key" },
                { pattern: /secret\s*[=:]\s*['"][^'"]{16,}['"]/gi, name: "Hardcoded Secret" },
                { pattern: /token\s*[=:]\s*['"][^'"]{16,}['"]/gi, name: "Hardcoded Token" },
                { pattern: /bearer\s+[A-Za-z0-9_-]{20,}/gi, name: "Bearer Token" }
            ],
            // Layer 7: Dangerous File Operations
            fileOperations: [
                /fopen\s*\(/gi,
                /file_put_contents\s*\(/gi,
                /file_get_contents\s*\(/gi,
                /readfile\s*\(/gi,
                /include\s*\(/gi,
                /include_once\s*\(/gi,
                /require\s*\(/gi,
                /require_once\s*\(/gi,
                /__import__\s*\(/gi,
                /open\s*\(.*,\s*['"]w['"]\)/gi,
                /fs\.writeFile\s*\(/gi,
                /fs\.writeFileSync\s*\(/gi,
                /fs\.createWriteStream\s*\(/gi,
                /writeFile\s*\(/gi,
                /writeFileSync\s*\(/gi,
                /appendFile\s*\(/gi,
                /appendFileSync\s*\(/gi
            ],
            // Layer 8: JavaScript-Specific Attacks
            jsAttacks: [
                /document\.cookie/gi,
                /localStorage/gi,
                /sessionStorage/gi,
                /window\.location/gi,
                /navigator\./gi,
                /fetch\s*\(/gi,
                /XMLHttpRequest/gi,
                /WebSocket/gi,
                /eval\s*\(/gi,
                /Function\s*\(/gi,
                /setTimeout\s*\(.*['"]/gi,
                /setInterval\s*\(.*['"]/gi,
                /new\s+Function/gi,
                /<script/gi,
                /<\/script>/gi,
                /onerror\s*=/gi,
                /onload\s*=/gi,
                /onclick\s*=/gi,
                /onmouseover\s*=/gi,
                /innerHTML\s*=/gi,
                /outerHTML\s*=/gi,
                /insertAdjacentHTML/gi,
                /write\s*\(/gi,
                /writeln\s*\(/gi
            ]
        },
        /**
         * Analyze content for suspicious patterns across all layers
         * Returns detailed report of findings
         */
        analyze: function (content) {
            var findings = [];
            var recommendations = [];
            var threatScore = 0;
            // Check each layer
            for (var _i = 0, _a = Object.entries(exports.Security.SecureDOMParser.injectionPatterns); _i < _a.length; _i++) {
                var _b = _a[_i], layerName = _b[0], patterns = _b[1];
                if (Array.isArray(patterns)) {
                    // Simple regex patterns
                    for (var _c = 0, _d = patterns; _c < _d.length; _c++) {
                        var pattern = _d[_c];
                        var match = void 0;
                        var regex = pattern;
                        while ((match = regex.exec(content)) !== null) {
                            var severity = exports.Security.SecureDOMParser.getSeverity(layerName, match[0]);
                            findings.push({
                                layer: layerName,
                                pattern: pattern.toString(),
                                match: match[0].substring(0, 100),
                                position: match.index,
                                severity: severity
                            });
                            threatScore += exports.Security.SecureDOMParser.getThreatScore(layerName);
                        }
                    }
                }
                else if (typeof patterns === 'object') {
                    // API key patterns with names
                    for (var _e = 0, _f = patterns; _e < _f.length; _e++) {
                        var patternObj = _f[_e];
                        var match = void 0;
                        var regex = patternObj.pattern;
                        while ((match = regex.exec(content)) !== null) {
                            findings.push({
                                layer: 'apiKeyPatterns',
                                pattern: patternObj.name,
                                match: match[0].substring(0, 50) + '...',
                                position: match.index,
                                severity: 'warning'
                            });
                            threatScore += 20;
                        }
                    }
                }
            }
            // Determine threat level
            var threatLevel = 'none';
            if (threatScore >= 100)
                threatLevel = 'critical';
            else if (threatScore >= 50)
                threatLevel = 'high';
            else if (threatScore >= 20)
                threatLevel = 'medium';
            else if (threatScore >= 5)
                threatLevel = 'low';
            // Generate recommendations based on findings
            if (findings.some(function (f) { return f.layer === 'shellPrimitives'; })) {
                recommendations.push("Shell execution commands detected. Content blocked from LLM processing.");
            }
            if (findings.some(function (f) { return f.layer === 'encodingPatterns'; })) {
                recommendations.push("Encoded/obfuscated content detected. Decode manually for review.");
            }
            if (findings.some(function (f) { return f.layer === 'injectionAttempts'; })) {
                recommendations.push("Prompt injection attempt detected. Content rejected.");
            }
            if (findings.some(function (f) { return f.layer === 'apiKeyPatterns'; })) {
                recommendations.push("API keys or secrets detected. Credentials will be masked.");
            }
            // Sanitize content by replacing dangerous patterns with placeholders
            var sanitizedContent = content;
            for (var _g = 0, findings_1 = findings; _g < findings_1.length; _g++) {
                var finding = findings_1[_g];
                if (finding.severity === 'critical') {
                    sanitizedContent = sanitizedContent.replace(new RegExp(exports.Security.SecureDOMParser.escapeRegex(finding.match), 'g'), "[BLOCKED: ".concat(finding.layer.toUpperCase(), "]"));
                }
            }
            return {
                isSafe: threatLevel === 'none',
                threatLevel: threatLevel,
                findings: findings,
                sanitizedContent: sanitizedContent,
                recommendations: recommendations
            };
        },
        /**
         * Get threat score multiplier for a layer
         */
        getThreatScore: function (layer) {
            var scores = {
                shellPrimitives: 30,
                injectionAttempts: 50,
                privilegeEscalation: 25,
                networkPatterns: 20,
                fileOperations: 15,
                encodingPatterns: 10,
                jsAttacks: 20,
                apiKeyPatterns: 20
            };
            return scores[layer] || 5;
        },
        /**
         * Get severity based on layer and match content
         */
        getSeverity: function (layer, match) {
            if (layer === 'injectionAttempts')
                return 'critical';
            if (layer === 'shellPrimitives' && /rm\s+-rf|sudo|del\s+\//i.test(match))
                return 'critical';
            if (layer === 'privilegeEscalation')
                return 'warning';
            if (layer === 'apiKeyPatterns')
                return 'warning';
            return 'info';
        },
        /**
         * Escape regex special characters
         */
        escapeRegex: function (string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        /**
         * Validate and sanitize HTML content
         * Removes script tags, event handlers, and dangerous attributes
         */
        sanitizeHTML: function (html) {
            var sanitized = html;
            // Remove script tags
            sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            // Remove event handlers
            sanitized = sanitized.replace(/\s*on\w+\s*=\s*(['"][^'"]*['"]|[^\s>]*)/gi, '');
            // Remove javascript: URLs
            sanitized = sanitized.replace(/href\s*=\s*['"]javascript:[^'"]*['"]/gi, 'href="#"');
            sanitized = sanitized.replace(/src\s*=\s*['"]javascript:[^'"]*['"]/gi, '');
            // Remove dangerous attributes
            sanitized = sanitized.replace(/\s*style\s*=\s*['"][^'"]*expression\s*\([^)]*\)[^'"]*['"]/gi, '');
            // Remove iframe tags
            sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
            // Remove object/embed for Flash vulnerabilities
            sanitized = sanitized.replace(/<(?:object|embed)\b[^<]*(?:(?!<\/(?:object|embed)>)<[^<]*)*<\/(?:object|embed)>/gi, '');
            return sanitized;
        },
        /**
         * Check for CSS-based attacks
         */
        checkCSSAttacks: function (css) {
            var dangerousPatterns = [
                /expression\s*\(/gi,
                /url\s*\(\s*javascript:/gi,
                /behavior\s*:/gi,
                /-moz-binding\s*:/gi,
                /@import/gi
            ];
            for (var _i = 0, dangerousPatterns_1 = dangerousPatterns; _i < dangerousPatterns_1.length; _i++) {
                var pattern = dangerousPatterns_1[_i];
                if (pattern.test(css)) {
                    return true;
                }
            }
            return false;
        },
        /**
         * Validate URL safety
         */
        validateURL: function (url) {
            var issues = [];
            try {
                var parsed = new URL(url);
                // Check for dangerous protocols
                var dangerousProtocols = ['javascript', 'vbscript', 'data', 'livescript'];
                if (dangerousProtocols.includes(parsed.protocol.replace(':', ''))) {
                    issues.push('Dangerous protocol detected');
                }
                // Check for data URLs with executable content
                if (parsed.protocol === 'data:') {
                    var mimeType = parsed.pathname.split(',')[0].toLowerCase();
                    if (mimeType.includes('script') || mimeType.includes('text/html')) {
                        issues.push('Executable data URL detected');
                    }
                }
                // Check for IP addresses (potential phishing)
                if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)) {
                    issues.push('IP address in URL - potential phishing');
                }
            }
            catch (_a) {
                issues.push('Invalid URL format');
            }
            return {
                isSafe: issues.length === 0,
                issues: issues
            };
        }
    },
    // ============================================
    // AI FORTRESS - API KEY PROTECTION
    // ============================================
    patterns: [
        { name: "[Gemini_API_Key]", regex: /AIzaSy[A-Za-z0-9_-]{33}/g },
        { name: "[OpenAI_API_Key]", regex: /sk-[A-Za-z0-9]{48}/g },
        { name: "[Anthropic_API_Key]", regex: /sk-ant-api03-[A-Za-z0-9-_]{93}/g },
        { name: "[GitHub_Token]", regex: /ghp_[A-Za-z0-9]{36}/g },
        { name: "[AWS_Access_Key]", regex: /AKIA[0-9A-Z]{16}/g },
        { name: "[Slack_Token]", regex: /xox[baprs]-[A-Za-z0-9]{10,}/g },
        { name: "[Generic_Secret]", regex: /(?:password|secret|key|token)\s*[=:]\s*['"][A-Za-z0-9!@#$%^&*]{8,}['"]/gi }
    ],
    addPattern: function (name, regex) {
        exports.Security.patterns.push({ name: name, regex: regex });
    },
    fortress: function (content) {
        var protectedContent = content;
        var wasProtected = false;
        exports.Security.patterns.forEach(function (p) {
            if (p.regex.test(protectedContent)) {
                console.log("[AI Fortress] Protecting sensitive data: ".concat(p.name));
                protectedContent = protectedContent.replace(p.regex, p.name);
                wasProtected = true;
            }
            // Reset regex lastIndex for global regex
            p.regex.lastIndex = 0;
        });
        return { content: protectedContent, wasProtected: wasProtected };
    },
    // ============================================
    // CONTENT FILTERING FOR LLM
    // ============================================
    /**
     * Filter content before sending to LLM
     * Implements the "AI Sees Pixels, Not Code" philosophy
     */
    filterForLLM: function (content, options) {
        var opts = __assign({ preserveFormatting: true, stripHTML: false, removeCode: false }, options);
        var filtered = content;
        // Step 1: Run SecureDOM analysis
        var analysis = exports.Security.SecureDOMParser.analyze(filtered);
        if (!analysis.isSafe) {
            console.warn('[Security] Threat detected:', analysis.threatLevel);
            console.warn('[Security] Findings:', analysis.findings);
            filtered = analysis.sanitizedContent;
        }
        // Step 2: Apply AI Fortress
        var fortressResult = exports.Security.fortress(filtered);
        if (fortressResult.wasProtected) {
            console.log('[Security] API keys/secrets protected');
            filtered = fortressResult.content;
        }
        // Step 3: Additional sanitization
        if (opts.stripHTML) {
            filtered = exports.Security.stripHTML(filtered);
        }
        if (opts.removeCode) {
            filtered = exports.Security.removeCodeBlocks(filtered);
        }
        return filtered;
    },
    /**
     * Strip HTML tags while preserving text content
     */
    stripHTML: function (html) {
        // Remove script and style elements completely
        var text = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
        // Replace block elements with newlines
        text = text.replace(/<\/?(div|p|br|h[1-6]|li|tr|blockquote)[\s\S]*?>/gi, '\n');
        // Remove all remaining HTML tags
        text = text.replace(/<[^>]+>/g, '');
        // Decode HTML entities
        text = exports.Security.decodeHTMLEntities(text);
        // Clean up whitespace
        text = text.replace(/\n{3,}/g, '\n\n').trim();
        return text;
    },
    /**
     * Remove code blocks from content
     */
    removeCodeBlocks: function (content) {
        // Remove fenced code blocks
        var text = content.replace(/```[\s\S]*?```/g, '[CODE BLOCK REMOVED]');
        // Remove inline code
        text = text.replace(/`[^`]+`/g, '[CODE REMOVED]');
        // Remove pre blocks
        text = text.replace(/<pre>[\s\S]*?<\/pre>/gi, '[CODE BLOCK REMOVED]');
        return text;
    },
    /**
     * Decode common HTML entities
     */
    decodeHTMLEntities: function (text) {
        var entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' ',
            '&copy;': '©',
            '&reg;': '®',
            '&trade;': '™'
        };
        var decoded = text;
        for (var _i = 0, _a = Object.entries(entities); _i < _a.length; _i++) {
            var _b = _a[_i], entity = _b[0], char = _b[1];
            decoded = decoded.replace(new RegExp(entity, 'g'), char);
        }
        // Decode numeric entities
        decoded = decoded.replace(/&#(\d+);/g, function (_, num) { return String.fromCharCode(parseInt(num, 10)); });
        decoded = decoded.replace(/&#x([0-9a-f]+);/gi, function (_, hex) { return String.fromCharCode(parseInt(hex, 16)); });
        return decoded;
    }
};
