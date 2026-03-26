/**
 * Robust AI Command Parser
 * Handles extraction and validation of AI commands from LLM responses
 */

export interface ParsedCommand {
    type: string;
    value: string;
    originalMatch: string;
    index: number;
    category?: string;
}

export interface CommandParseResult {
    commands: ParsedCommand[];
    textWithoutCommands: string;
    hasCommands: boolean;
}

// Strict Command Registry with descriptions and examples
export const COMMAND_REGISTRY = {
    NAVIGATE: { desc: 'Go to a specific URL', example: '[NAVIGATE: https://google.com]' },
    SEARCH: { desc: 'Search using default engine', example: '[SEARCH: AI news]' },
    WEB_SEARCH: { desc: 'Real-time web search with RAG', example: '[WEB_SEARCH: today stock prices]' },
    READ_PAGE_CONTENT: { desc: 'Read text from active tab', example: '[READ_PAGE_CONTENT]' },
    LIST_OPEN_TABS: { desc: 'List all open browser tabs', example: '[LIST_OPEN_TABS]' },
    CREATE_PDF_JSON: { desc: 'Create PDF using structured JSON (PREFERRED)', example: '[CREATE_PDF_JSON: {"title":"Report", "pages":[...]}]' },
    GENERATE_PDF: { desc: 'Create PDF from markdown (FALLBACK)', example: '[GENERATE_PDF: Report | Content...]' },
    SHELL_COMMAND: { desc: 'Execute terminal commands (Safe)', example: '[SHELL_COMMAND: ls -la]' },
    SET_THEME: { desc: 'Switch between dark/light mode', example: '[SET_THEME: dark]' },
    SET_VOLUME: { desc: 'Set system audio volume', example: '[SET_VOLUME: 50]' },
    SET_BRIGHTNESS: { desc: 'Set screen brightness level', example: '[SET_BRIGHTNESS: 80]' },
    OPEN_APP: { desc: 'Launch a desktop application', example: '[OPEN_APP: Chrome]' },
    SCREENSHOT_AND_ANALYZE: { desc: 'See the page using Vision/OCR', example: '[SCREENSHOT_AND_ANALYZE]' },
    CLICK_ELEMENT: { desc: 'Click a web element by selector', example: '[CLICK_ELEMENT: #submit-btn | click submit]' },
    FIND_AND_CLICK: { desc: 'Find text on screen and click it', example: '[FIND_AND_CLICK: Login | auth task]' },
    GENERATE_DIAGRAM: { desc: 'Create charts using Mermaid.js', example: '[GENERATE_DIAGRAM: graph TD...]' },
    OPEN_VIEW: { desc: 'Switch browser workspace views', example: '[OPEN_VIEW: coding]' },
    RELOAD: { desc: 'Refresh the active browser tab', example: '[RELOAD]' },
    GO_BACK: { desc: 'Go back in browser history', example: '[GO_BACK]' },
    GO_FORWARD: { desc: 'Go forward in browser history', example: '[GO_FORWARD]' },
    WAIT: { desc: 'Pause execution for duration (ms)', example: '[WAIT: 2000]' },
    THINK: { desc: 'Show AI reasoning steps', example: '[THINK: "Calculating optimal path..."]' },
    PLAN: { desc: 'Show AI future plans', example: '[PLAN: "Step 1: Search, Step 2: Read"]' },
    EXPLAIN_CAPABILITIES: { desc: 'List all available AI features', example: '[EXPLAIN_CAPABILITIES]' },
    DOM_SEARCH: { desc: 'Search within current page DOM', example: '[DOM_SEARCH: search term]' },
    DOM_READ_FILTERED: { desc: 'Read DOM with filtering & injection check', example: '[DOM_READ_FILTERED: optional search term]' },
    OPEN_MCP_SETTINGS: { desc: 'Open MCP servers settings', example: '[OPEN_MCP_SETTINGS]' },
    OPEN_AUTOMATION_SETTINGS: { desc: 'Open automation settings', example: '[OPEN_AUTOMATION_SETTINGS]' },
    OPEN_SCHEDULING_MODAL: { desc: 'Open scheduling modal with optional data (JSON or pipe-separated)', example: '[OPEN_SCHEDULING_MODAL: 0 8 * * *|pdf-generate|Daily Report|Generate PDF]' },
    SCHEDULE_TASK: { desc: 'Schedule a recurring automation task (JSON format)', example: '[SCHEDULE_TASK: {"schedule": "0 8 * * *", "type": "pdf-generate", "name": "Daily Report"}]' },
} as const;

export const SUPPORTED_COMMANDS = Object.keys(COMMAND_REGISTRY) as Array<keyof typeof COMMAND_REGISTRY>;
export type CommandType = keyof typeof COMMAND_REGISTRY;

// Non-executable commands (handled by LLM only or displayed in text)
export const META_COMMANDS = [
    'PLACEHOLDER_META',
] as const;

/**
 * Get category for command type
 */
function getCategoryForType(type: string): string {
    const catMap: Record<string, string> = {
        NAVIGATE: 'navigation', SEARCH: 'navigation', WEB_SEARCH: 'navigation',
        READ_PAGE_CONTENT: 'browser', SCREENSHOT_ANALYZE: 'browser', EXTRACT_DATA: 'browser',
        CLICK_ELEMENT: 'automation', FIND_AND_CLICK: 'automation', FILL_FORM: 'automation',
        SHELL_COMMAND: 'system', OPEN_APP: 'system', SET_VOLUME: 'system', SET_BRIGHTNESS: 'system',
        GENERATE_PDF: 'pdf', CREATE_PDF_JSON: 'pdf', GENERATE_DIAGRAM: 'pdf', OPEN_PDF: 'pdf',
        SHOW_IMAGE: 'media', SHOW_VIDEO: 'media',
        WAIT: 'utility', OPEN_VIEW: 'utility', OPEN_MCP_SETTINGS: 'utility', OPEN_AUTOMATION_SETTINGS: 'utility', OPEN_SCHEDULING_MODAL: 'utility', SCHEDULE_TASK: 'utility',
        GMAIL_AUTHORIZE: 'gmail', GMAIL_LIST_MESSAGES: 'gmail', GMAIL_GET_MESSAGE: 'gmail',
        GMAIL_SEND_MESSAGE: 'gmail', GMAIL_ADD_LABEL: 'gmail',
        THINK: 'meta', PLAN: 'meta', EXPLAIN_CAPABILITIES: 'meta',
    };
    return catMap[type] || 'utility';
}

/**
 * Extract commands from JSON format
 * Supports: {"commands": [{"type": "...", "value": "..."}]}
 */
function extractJSONCommands(content: string): ParsedCommand[] {
    const commands: ParsedCommand[] = [];
    
    // Try to find and parse JSON with commands array
    const jsonPatterns = [
        /\{[\s\S]*?"commands"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/g,
    ];
    
    for (const pattern of jsonPatterns) {
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(content)) !== null) {
            try {
                // Sanitize unescaped newlines inside strings before parsing
                let rawJson = match[0];
                rawJson = rawJson.replace(/(?<=:\s*"(?:\\"|[^"])*)\n(?=(?:\\"|[^"])*")/g, '\\n');
                
                const parsed = JSON.parse(rawJson);
                
                if (parsed.commands && Array.isArray(parsed.commands)) {
                    parsed.commands.forEach((cmd: any, _i: number) => {
                        const cmdType = (cmd.type || cmd.command || '').toUpperCase();
                        const cmdValue = cmd.value || cmd.url || cmd.query || '';
                        
                        if (cmdType && SUPPORTED_COMMANDS.includes(cmdType as any)) {
                            commands.push({
                                type: cmdType,
                                value: cmdValue,
                                originalMatch: match![0],
                                index: match!.index,
                            });
                        }
                    });
                }
            } catch (e) {
                // Invalid JSON, fallback to brute-force extraction
                const fbRegex = /"type"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*"([\s\S]*?)"(?=\s*\})/g;
                let fbMatch;
                while ((fbMatch = fbRegex.exec(match[0])) !== null) {
                    const cmdType = fbMatch[1].toUpperCase();
                    const cmdValue = fbMatch[2].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                    if (cmdType && SUPPORTED_COMMANDS.includes(cmdType as any)) {
                        commands.push({
                            type: cmdType,
                            value: cmdValue,
                            originalMatch: match![0],
                            index: match!.index,
                        });
                    }
                }
            }
        }
    }
    
    // Also try markdown code block patterns
    const codeBlockPatterns = [
        /```json\s*\{[\s\S]*?"commands"\s*:\s*\[[\s\S]*?\][\s\S]*?\}\s*```/g,
        /```\s*\{[\s\S]*?"commands"\s*:\s*\[[\s\S]*?\][\s\S]*?\}\s*```/g,
    ];
    
    for (const pattern of codeBlockPatterns) {
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(content)) !== null) {
            try {
                // 1) Strip wrapping backticks and tags
                let rawJson = match[0].replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
                
                // 2) Sanitize unescaped newlines inside the JSON strings 
                // This is a common hallucination where LLMs put real \n inside "value": "..." 
                rawJson = rawJson.replace(/(?<=:\s*"(?:\\"|[^"])*)\n(?=(?:\\"|[^"])*")/g, '\\n');
                
                const parsed = JSON.parse(rawJson);
                
                if (parsed.commands && Array.isArray(parsed.commands)) {
                    parsed.commands.forEach((cmd: any, _i: number) => {
                        const cmdType = (cmd.type || cmd.command || '').toUpperCase();
                        const cmdValue = cmd.value || cmd.url || cmd.query || '';
                        
                        if (cmdType && SUPPORTED_COMMANDS.includes(cmdType as any)) {
                            commands.push({
                                type: cmdType,
                                value: cmdValue,
                                originalMatch: match![0],
                                index: match!.index,
                            });
                        }
                    });
                }
            } catch (e) {
                // Invalid JSON, fallback to brute-force extraction
                const fbRegex = /"type"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*"([\s\S]*?)"(?=\s*\})/g;
                let fbMatch;
                while ((fbMatch = fbRegex.exec(match[0])) !== null) {
                    const cmdType = fbMatch[1].toUpperCase();
                    const cmdValue = fbMatch[2].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                    if (cmdType && SUPPORTED_COMMANDS.includes(cmdType as any)) {
                        commands.push({
                            type: cmdType,
                            value: cmdValue,
                            originalMatch: match![0],
                            index: match!.index,
                        });
                    }
                }
            }
        }
    }
    
    return commands;
}

/**
 * Parse AI response and extract commands
 * Skips commands inside markdown code blocks or tables
 * Also supports JSON format: {"commands": [{"type": "...", "value": "..."}]}
 */
export function parseAICommands(content: string): CommandParseResult {
    const commands: ParsedCommand[] = [];
    const commandsSet = new Set(SUPPORTED_COMMANDS);
    const metaCommandsSet = new Set(META_COMMANDS);
    
    // Deduplication set - tracks "type:value" to avoid duplicates
    const seenCommands = new Set<string>();

    // Helper to add unique commands only
    const addUniqueCommand = (cmd: ParsedCommand) => {
        const key = `${cmd.type}:${cmd.value}`;
        if (!seenCommands.has(key)) {
            seenCommands.add(key);
            commands.push(cmd);
        }
    };

    // 0. FIRST: Check for JSON format (faster parsing)
    const jsonCommands = extractJSONCommands(content);
    if (jsonCommands.length > 0) {
        // Deduplicate JSON commands
        jsonCommands.forEach(addUniqueCommand);
        
        if (commands.length > 0) {
            // Remove JSON from content for display
            const jsonPatterns = [
                /\{"commands"\s*:\s*\[[\s\S]*?\]\}/g,
                /```json\s*\{[\s\S]*?\}\s*```/g,
                /```\s*\{[\s\S]*?\}\s*```/g,
            ];
            let cleanedContent = content;
            for (const pattern of jsonPatterns) {
                cleanedContent = cleanedContent.replace(pattern, '');
            }
            return {
                commands,
                textWithoutCommands: cleanedContent.trim(),
                hasCommands: true,
            };
        }
    }

    // 0b. Also extract from HTML comment format <!-- AI_COMMANDS_START -->...<!-- AI_COMMANDS_END -->
    const htmlCommentPattern = /<!--\s*AI_COMMANDS_START\s*-->[\s\S]*?<!--\s*AI_COMMANDS_END\s*-->/gi;
    let htmlMatch;
    while ((htmlMatch = htmlCommentPattern.exec(content)) !== null) {
        const commandsSection = htmlMatch[0].replace(/<!--\s*AI_COMMANDS_START\s*-->/gi, '').replace(/<!--\s*AI_COMMANDS_END\s*-->/gi, '');
        const lines = commandsSection.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            // Parse [COMMAND]:value format from HTML comments
            const match = trimmed.match(/^\[([A-Z_]+)\]:(.*)$/);
            if (match) {
                const cmdType = match[1].toUpperCase();
                const cmdValue = match[2] || '';
                if (cmdType && commandsSet.has(cmdType as CommandType) && !metaCommandsSet.has(cmdType as any)) {
                    addUniqueCommand({
                        type: cmdType,
                        value: cmdValue,
                        originalMatch: trimmed,
                        index: htmlMatch.index + htmlMatch[0].indexOf(trimmed),
                    });
                }
            }
        }
    }

    // 1. Create a mask of the content to skip parsing inside sensitive blocks
    // Replace content inside ```...``` and `...` with spaces to preserve indices
    let mask = content;
    
    // Mask code blocks
    mask = mask.replace(/```[\s\S]*?```/g, (match) => ' '.repeat(match.length));
    
    // Mask inline code
    mask = mask.replace(/`.*?`/g, (match) => ' '.repeat(match.length));
    
    // Mask thinking blocks (<think>, <thinking>, <thought>)
    mask = mask.replace(/<(think|thinking|thought)>[\s\S]*?<\/\1>/gi, (match) => ' '.repeat(match.length));
    
    // Mask markdown tables (lines with at least 3 '|' characters)
    const lines = mask.split('\n');
    mask = lines.map(line => {
        if ((line.match(/\|/g) || []).length >= 3) {
            return ' '.repeat(line.length);
        }
        return line;
    }).join('\n');

    // 2. Build regex dynamically from supported commands
    const commandPattern = SUPPORTED_COMMANDS.join('|');
    // Allow spaces inside brackets: e.g., [ WEB_SEARCH: google ]
    const commandRegex = new RegExp(`\\[\\s*(${commandPattern})\\s*(?::\\s*([^\\]]+?))?\\s*\\]`, 'gi');

    let match;
    commandRegex.lastIndex = 0;

    while ((match = commandRegex.exec(mask)) !== null) {
        const [fullMatch, commandType, commandValue = ''] = match;
        const type = commandType.toUpperCase();

        // Validate command type (only if it's in the master list)
        if (!commandsSet.has(type as CommandType)) continue;

        // SKIP Meta Commands - they should NOT go into the execution queue
        if (metaCommandsSet.has(type as any)) continue;

        // Clean up command value: trim and strip surrounding quotes
        let value = (match[2] || '').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1).trim();
        }

        addUniqueCommand({
            type,
            value,
            originalMatch: content.substring(match.index, match.index + fullMatch.length),
            index: match.index,
        });
    }

    // 3. Prepare response text by removing EXECUTED commands (keep meta commands)
    let textWithoutCommands = content;
    // Remove from bottom to top to preserve string indices
    const sortedCmds = [...commands].sort((a, b) => b.index - a.index);
    for (const cmd of sortedCmds) {
        textWithoutCommands = textWithoutCommands.substring(0, cmd.index) + 
                            textWithoutCommands.substring(cmd.index + cmd.originalMatch.length);
    }

    return {
        commands,
        textWithoutCommands: textWithoutCommands.trim(),
        hasCommands: commands.length > 0,
    };
}

/**
 * Validate command value based on command type
 */
export function validateCommand(command: ParsedCommand): { valid: boolean; error?: string } {
    const { type, value } = command;

    switch (type) {
        case 'NAVIGATE':
        case 'SEARCH':
        case 'WEB_SEARCH':
            if (!value) {
                return { valid: false, error: `${type} requires a value` };
            }
            break;

        case 'SET_VOLUME':
        case 'SET_BRIGHTNESS':
            const percentage = parseInt(value, 10);
            if (isNaN(percentage) || percentage < 0 || percentage > 100) {
                return { valid: false, error: `${type} requires a percentage between 0-100` };
            }
            break;

        case 'WAIT':
            const duration = parseInt(value, 10);
            if (isNaN(duration) || duration < 0) {
                return { valid: false, error: 'WAIT requires a positive duration in milliseconds' };
            }
            break;

        case 'FILL_FORM':
            if (!value.includes('|')) {
                return { valid: false, error: 'FILL_FORM requires format: selector | value' };
            }
            break;

        case 'GENERATE_PDF':
            if (!value.includes('|')) {
                return { valid: false, error: 'GENERATE_PDF requires format: title | content' };
            }
            break;

        case 'CREATE_PDF_JSON':
            // JSON commands should have valid JSON structure
            // Validation is done at execution time
            break;

        // Commands that don't require values
        case 'RELOAD':
        case 'GO_BACK':
        case 'GO_FORWARD':
        case 'SCREENSHOT_AND_ANALYZE':
        case 'READ_PAGE_CONTENT':
        case 'LIST_OPEN_TABS':
        case 'GMAIL_AUTHORIZE':
        case 'EXPLAIN_CAPABILITIES':
        case 'OPEN_MCP_SETTINGS':
        case 'OPEN_AUTOMATION_SETTINGS':
        case 'OPEN_SCHEDULING_MODAL':
            // These are valid without values
            break;

        default:
            // For other commands, just check if value exists when needed
            if (!value && type !== 'OCR_SCREEN') {
                return { valid: false, error: `${type} requires a value` };
            }
    }

    return { valid: true };
}

/**
 * Extract commands and prepare for execution
 */
export function prepareCommandsForExecution(content: string): {
    commands: ParsedCommand[];
    responseText: string;
    invalidCommands: Array<{ command: ParsedCommand; error: string }>;
} {
    const parseResult = parseAICommands(content);
    const invalidCommands: Array<{ command: ParsedCommand; error: string }> = [];
    const validCommands: ParsedCommand[] = [];

    for (const command of parseResult.commands) {
        const validation = validateCommand(command);
        if (validation.valid) {
            validCommands.push(command);
        } else {
            invalidCommands.push({ command, error: validation.error || 'Unknown error' });
        }
    }

    return {
        commands: validCommands,
        responseText: parseResult.textWithoutCommands,
        invalidCommands,
    };
}

/**
 * Generate user-friendly command description
 */
export function getCommandDescription(command: ParsedCommand): string {
    const { type, value } = command;

    const descriptions: Record<string, (v: string) => string> = {
        NAVIGATE: (v) => `Navigate to ${v}`,
        SEARCH: (v) => `Search for "${v}"`,
        SET_THEME: (v) => `Change theme to ${v}`,
        OPEN_VIEW: (v) => `Open ${v} view`,
        RELOAD: () => 'Reload page',
        GO_BACK: () => 'Go back',
        GO_FORWARD: () => 'Go forward',
        SCREENSHOT_AND_ANALYZE: () => 'Capture and analyze screenshot',
        WEB_SEARCH: (v) => `Search web for "${v}"`,
        READ_PAGE_CONTENT: () => 'Read current page content',
        LIST_OPEN_TABS: () => 'List all open tabs',
        GENERATE_PDF: (v) => `Generate PDF (markdown): ${v.split('|')[0]}`,
        CREATE_PDF_JSON: (v) => 'Generate PDF (JSON structured)',
        GENERATE_DIAGRAM: (v) => 'Generate diagram',
        SHELL_COMMAND: (v) => `Execute: ${v.substring(0, 40)}...`,
        SET_BRIGHTNESS: (v) => `Set brightness to ${v}%`,
        SET_VOLUME: (v) => `Set volume to ${v}%`,
        OPEN_APP: (v) => `Open ${v}`,
        FILL_FORM: (v) => `Fill form field: ${v.split('|')[0]}`,
        SCROLL_TO: (v) => `Scroll to ${v}`,
        EXTRACT_DATA: (v) => `Extract data from ${v}`,
        CREATE_NEW_TAB_GROUP: (v) => `Create tab group: ${v.split('|')[0]}`,
        OCR_COORDINATES: (v) => `OCR region: ${v}`,
        OCR_SCREEN: (v) => v ? `OCR screen region: ${v}` : 'OCR full screen',
        CLICK_ELEMENT: (v) => `Click element: ${v}`,
        FIND_AND_CLICK: (v) => `Find and click "${v}"`,
        GMAIL_AUTHORIZE: () => 'Authorize Gmail',
        GMAIL_LIST_MESSAGES: (v) => `List Gmail messages: ${v.split('|')[0]}`,
        GMAIL_GET_MESSAGE: (v) => `Get Gmail message: ${v}`,
        GMAIL_SEND_MESSAGE: (v) => `Send email to ${v.split('|')[0]}`,
        GMAIL_ADD_LABEL: (v) => `Add Gmail label: ${v.split('|')[1]}`,
        WAIT: (v) => `Wait ${parseInt(v) / 1000} seconds`,
        GUIDE_CLICK: (v) => `Guide click: ${v.split('|')[0]}`,
        EXPLAIN_CAPABILITIES: () => 'Explain AI capabilities',
        DOM_SEARCH: (v) => `Search DOM for: ${v}`,
        DOM_READ_FILTERED: (v) => v ? `Read filtered DOM matching: ${v}` : 'Read filtered DOM (full)',
    };

    const descFn = descriptions[type];
    return descFn ? descFn(value) : `${type}: ${value}`;
}

/**
 * Format commands for export (legacy compatibility)
 */
export function formatCommandsForExport(commands: ParsedCommand[]): string {
    return commands.map(c => `[${c.type}]:${c.value}`).join('\n');
}

/**
 * Parse unified commands (legacy compatibility)
 */
export function parseUnifiedCommands(content: string): any {
    const result = parseAICommands(content);
    return {
        actionTags: result.commands,
        textWithoutCommands: result.textWithoutCommands,
        hasCommands: result.hasCommands,
    };
}

/**
 * Strip all command tags from text for display
 */
export function stripAllCommands(content: string): string {
    const result = parseAICommands(content);
    return result.textWithoutCommands;
}
