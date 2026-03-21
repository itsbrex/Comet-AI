/**
 * Robust AI Command Parser
 * Handles extraction and validation of AI commands from LLM responses
 */

export interface ParsedCommand {
    type: string;
    value: string;
    originalMatch: string;
    index: number;
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
    GENERATE_PDF: { desc: 'Create a branded PDF document', example: '[GENERATE_PDF: Report | Content...]' },
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
} as const;

export const SUPPORTED_COMMANDS = Object.keys(COMMAND_REGISTRY) as Array<keyof typeof COMMAND_REGISTRY>;
export type CommandType = keyof typeof COMMAND_REGISTRY;

// Non-executable commands (handled by LLM only or displayed in text)
export const META_COMMANDS = [
    'PLACEHOLDER_META',
] as const;

/**
 * Parse AI response and extract commands
 * Skips commands inside markdown code blocks or tables
 */
export function parseAICommands(content: string): CommandParseResult {
    const commands: ParsedCommand[] = [];
    const commandsSet = new Set(SUPPORTED_COMMANDS);
    const metaCommandsSet = new Set(META_COMMANDS);

    // 1. Create a mask of the content to skip parsing inside sensitive blocks
    // Replace content inside ```...``` and `...` with spaces to preserve indices
    let mask = content;
    
    // Mask code blocks
    mask = mask.replace(/```[\s\S]*?```/g, (match) => ' '.repeat(match.length));
    
    // Mask inline code
    mask = mask.replace(/`.*?`/g, (match) => ' '.repeat(match.length));
    
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
    const commandRegex = new RegExp(`\\[(${commandPattern})(?::\\s*([^\\]]+?))?\\]`, 'gi');

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

        commands.push({
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

        // Commands that don't require values
        case 'RELOAD':
        case 'GO_BACK':
        case 'GO_FORWARD':
        case 'SCREENSHOT_AND_ANALYZE':
        case 'READ_PAGE_CONTENT':
        case 'LIST_OPEN_TABS':
        case 'GMAIL_AUTHORIZE':
        case 'EXPLAIN_CAPABILITIES':
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
        GENERATE_PDF: (v) => `Generate PDF: ${v.split('|')[0]}`,
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
