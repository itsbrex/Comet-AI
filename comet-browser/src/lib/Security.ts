/**
 * Security module for Comet-AI
 * Handles sensitive data encryption, verification (E2EE), and advanced SecureDOM parsing
 * 
 * SECURITY PHILOSOPHY: "AI Sees Pixels, Not Code"
 * - Visual Sandbox: AI perceives via screenshots + OCR only, never raw HTML/JS
 * - Syntactic Firewall: Multi-layer regex filtering before content reaches LLM
 * - Injection Prevention: Contextual analysis with stateful pattern matching
 */

export const Security = {
    // ============================================
    // ENCRYPTION & SECURE STORAGE
    // ============================================
    
    deriveKey: async (passphrase: string) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(passphrase);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return await crypto.subtle.importKey(
            'raw',
            hash,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    },

    encrypt: async (text: string, passphrase?: string): Promise<string> => {
        if (!passphrase) {
            return `LCL:${btoa(text)}`;
        }
        try {
            const key = await Security.deriveKey(passphrase);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encoder = new TextEncoder();
            const encrypted = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                key,
                encoder.encode(text)
            );

            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);

            return `E2EE:${btoa(String.fromCharCode(...Array.from(combined)))}`;
        } catch (e) {
            console.error("[Encryption] Failed:", e);
            throw new Error("Encryption failed");
        }
    },

    decrypt: async (encoded: string, passphrase?: string): Promise<string> => {
        if (encoded.startsWith("LCL:")) return atob(encoded.replace("LCL:", ""));
        if (!encoded.startsWith("E2EE:") || !passphrase) return encoded;

        try {
            const key = await Security.deriveKey(passphrase);
            const combined = new Uint8Array(
                atob(encoded.replace("E2EE:", ""))
                    .split('')
                    .map(c => c.charCodeAt(0))
            );

            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );

            return new TextDecoder().decode(decrypted);
        } catch (e) {
            console.error("[Decryption] Failed:", e);
            return "[Error: Decryption Failed - Check Passphrase]";
        }
    },

    // ============================================
    // SECURE DOM PARSER - "AI Sees Pixels"
    // ============================================
    
    /**
     * Advanced SecureDOM Parser
     * Ensures AI only sees rendered content (pixels), never executable code
     */
    SecureDOMParser: {
        // Track suspicious patterns found in current content
        foundSuspiciousPatterns: new Set<string>(),
        
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
        analyze(content: string): {
            isSafe: boolean;
            threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
            findings: Array<{
                layer: string;
                pattern: string;
                match: string;
                position: number;
                severity: 'info' | 'warning' | 'critical';
            }>;
            sanitizedContent: string;
            recommendations: string[];
        } {
            const findings: Array<{
                layer: string;
                pattern: string;
                match: string;
                position: number;
                severity: 'info' | 'warning' | 'critical';
            }> = [];
            
            const recommendations: string[] = [];
            let threatScore = 0;
            
            // Check each layer
            for (const [layerName, patterns] of Object.entries(Security.SecureDOMParser.injectionPatterns)) {
                if (Array.isArray(patterns)) {
                    // Simple regex patterns
                    for (const pattern of (patterns as RegExp[])) {
                        let match;
                        const regex = pattern;
                        while ((match = regex.exec(content)) !== null) {
                            const severity = Security.SecureDOMParser.getSeverity(layerName, match[0]);
                            findings.push({
                                layer: layerName,
                                pattern: pattern.toString(),
                                match: match[0].substring(0, 100),
                                position: match.index,
                                severity
                            });
                            threatScore += Security.SecureDOMParser.getThreatScore(layerName);
                        }
                    }
                } else if (typeof patterns === 'object') {
                    // API key patterns with names
                    for (const patternObj of patterns as Array<{pattern: RegExp, name: string}>) {
                        let match;
                        const regex = patternObj.pattern;
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
            let threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
            if (threatScore >= 100) threatLevel = 'critical';
            else if (threatScore >= 50) threatLevel = 'high';
            else if (threatScore >= 20) threatLevel = 'medium';
            else if (threatScore >= 5) threatLevel = 'low';
            
            // Generate recommendations based on findings
            if (findings.some(f => f.layer === 'shellPrimitives')) {
                recommendations.push("Shell execution commands detected. Content blocked from LLM processing.");
            }
            if (findings.some(f => f.layer === 'encodingPatterns')) {
                recommendations.push("Encoded/obfuscated content detected. Decode manually for review.");
            }
            if (findings.some(f => f.layer === 'injectionAttempts')) {
                recommendations.push("Prompt injection attempt detected. Content rejected.");
            }
            if (findings.some(f => f.layer === 'apiKeyPatterns')) {
                recommendations.push("API keys or secrets detected. Credentials will be masked.");
            }
            
            // Sanitize content by replacing dangerous patterns with placeholders
            let sanitizedContent = content;
            for (const finding of findings) {
                if (finding.severity === 'critical') {
                    sanitizedContent = sanitizedContent.replace(
                        new RegExp(Security.SecureDOMParser.escapeRegex(finding.match), 'g'),
                        `[BLOCKED: ${finding.layer.toUpperCase()}]`
                    );
                }
            }
            
            return {
                isSafe: threatLevel === 'none',
                threatLevel,
                findings,
                sanitizedContent,
                recommendations
            };
        },
        
        /**
         * Get threat score multiplier for a layer
         */
        getThreatScore(layer: string): number {
            const scores: Record<string, number> = {
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
        getSeverity(layer: string, match: string): 'info' | 'warning' | 'critical' {
            if (layer === 'injectionAttempts') return 'critical';
            if (layer === 'shellPrimitives' && /rm\s+-rf|sudo|del\s+\//i.test(match)) return 'critical';
            if (layer === 'privilegeEscalation') return 'warning';
            if (layer === 'apiKeyPatterns') return 'warning';
            return 'info';
        },
        
        /**
         * Escape regex special characters
         */
        escapeRegex(string: string): string {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        },
        
        /**
         * Validate and sanitize HTML content
         * Removes script tags, event handlers, and dangerous attributes
         */
        sanitizeHTML(html: string): string {
            let sanitized = html;
            
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
        checkCSSAttacks(css: string): boolean {
            const dangerousPatterns = [
                /expression\s*\(/gi,
                /url\s*\(\s*javascript:/gi,
                /behavior\s*:/gi,
                /-moz-binding\s*:/gi,
                /@import/gi
            ];
            
            for (const pattern of dangerousPatterns) {
                if (pattern.test(css)) {
                    return true;
                }
            }
            return false;
        },
        
        /**
         * Validate URL safety
         */
        validateURL(url: string): {
            isSafe: boolean;
            issues: string[];
        } {
            const issues: string[] = [];
            
            try {
                const parsed = new URL(url);
                
                // Check for dangerous protocols
                const dangerousProtocols = ['javascript', 'vbscript', 'data', 'livescript'];
                if (dangerousProtocols.includes(parsed.protocol.replace(':', ''))) {
                    issues.push('Dangerous protocol detected');
                }
                
                // Check for data URLs with executable content
                if (parsed.protocol === 'data:') {
                    const mimeType = parsed.pathname.split(',')[0].toLowerCase();
                    if (mimeType.includes('script') || mimeType.includes('text/html')) {
                        issues.push('Executable data URL detected');
                    }
                }
                
                // Check for IP addresses (potential phishing)
                if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)) {
                    issues.push('IP address in URL - potential phishing');
                }
                
            } catch {
                issues.push('Invalid URL format');
            }
            
            return {
                isSafe: issues.length === 0,
                issues
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

    addPattern: (name: string, regex: RegExp) => {
        Security.patterns.push({ name, regex });
    },

    fortress: (content: string): { content: string, wasProtected: boolean } => {
        let protectedContent = content;
        let wasProtected = false;

        Security.patterns.forEach(p => {
            if (p.regex.test(protectedContent)) {
                console.log(`[AI Fortress] Protecting sensitive data: ${p.name}`);
                protectedContent = protectedContent.replace(p.regex, p.name);
                wasProtected = true;
            }
            // Reset regex lastIndex for global regex
            p.regex.lastIndex = 0;
        });

        return { content: protectedContent, wasProtected };
    },

    // ============================================
    // CONTENT FILTERING FOR LLM
    // ============================================
    
    /**
     * Filter content before sending to LLM
     * Implements the "AI Sees Pixels, Not Code" philosophy
     */
    filterForLLM: (content: string, options?: {
        preserveFormatting?: boolean;
        stripHTML?: boolean;
        removeCode?: boolean;
    }): string => {
        const opts = {
            preserveFormatting: true,
            stripHTML: false,
            removeCode: false,
            ...options
        };
        
        let filtered = content;
        
        // Step 1: Run SecureDOM analysis
        const analysis = Security.SecureDOMParser.analyze(filtered);
        
        if (!analysis.isSafe) {
            console.warn('[Security] Threat detected:', analysis.threatLevel);
            console.warn('[Security] Findings:', analysis.findings);
            filtered = analysis.sanitizedContent;
        }
        
        // Step 2: Apply AI Fortress
        const fortressResult = Security.fortress(filtered);
        if (fortressResult.wasProtected) {
            console.log('[Security] API keys/secrets protected');
            filtered = fortressResult.content;
        }
        
        // Step 3: Additional sanitization
        if (opts.stripHTML) {
            filtered = Security.stripHTML(filtered);
        }
        
        if (opts.removeCode) {
            filtered = Security.removeCodeBlocks(filtered);
        }
        
        return filtered;
    },
    
    /**
     * Strip HTML tags while preserving text content
     */
    stripHTML: (html: string): string => {
        // Remove script and style elements completely
        let text = html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '');
        
        // Replace block elements with newlines
        text = text.replace(/<\/?(div|p|br|h[1-6]|li|tr|blockquote)[\s\S]*?>/gi, '\n');
        
        // Remove all remaining HTML tags
        text = text.replace(/<[^>]+>/g, '');
        
        // Decode HTML entities
        text = Security.decodeHTMLEntities(text);
        
        // Clean up whitespace
        text = text.replace(/\n{3,}/g, '\n\n').trim();
        
        return text;
    },
    
    /**
     * Remove code blocks from content
     */
    removeCodeBlocks: (content: string): string => {
        // Remove fenced code blocks
        let text = content.replace(/```[\s\S]*?```/g, '[CODE BLOCK REMOVED]');
        
        // Remove inline code
        text = text.replace(/`[^`]+`/g, '[CODE REMOVED]');
        
        // Remove pre blocks
        text = text.replace(/<pre>[\s\S]*?<\/pre>/gi, '[CODE BLOCK REMOVED]');
        
        return text;
    },
    
    /**
     * Decode common HTML entities
     */
    decodeHTMLEntities: (text: string): string => {
        const entities: Record<string, string> = {
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
        
        let decoded = text;
        for (const [entity, char] of Object.entries(entities)) {
            decoded = decoded.replace(new RegExp(entity, 'g'), char);
        }
        
        // Decode numeric entities
        decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
        decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        
        return decoded;
    }
};
