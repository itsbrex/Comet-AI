/**
 * Action Tag Parser
 * Dedicated parser for action tags with structured JSON format
 * Separates action execution from main chat but includes in export logs
 */

export type ActionCategory = 
    | 'navigation' 
    | 'browser' 
    | 'system' 
    | 'media' 
    | 'automation' 
    | 'utility'
    | 'gmail'
    | 'meta';

export interface ActionTagOptions {
    [key: string]: string | boolean | number | undefined;
}

export interface ActionTag {
    id: string;
    type: string;
    category: ActionCategory;
    version: '1.0';
    timestamp: number;
    command: string;
    value: string;
    options: ActionTagOptions;
    rawMatch: string;
    index: number;
    confidence: number;
}

export interface ActionParseResult {
    actionTags: ActionTag[];
    cleanedContent: string;
    hasActionTags: boolean;
    metadata: {
        totalActions: number;
        categories: Record<ActionCategory, number>;
    };
}

// Action registry with categories
export const ACTION_REGISTRY: Record<string, { 
    category: ActionCategory; 
    description: string;
    example: string;
    requiresPermission?: 'low' | 'medium' | 'high';
    valueRequired?: boolean;
}> = {
    NAVIGATE: { category: 'navigation', description: 'Navigate to URL', example: '[NAVIGATE: https://example.com]', requiresPermission: 'low' },
    SEARCH: { category: 'browser', description: 'Search using default engine', example: '[SEARCH: query]', requiresPermission: 'low' },
    WEB_SEARCH: { category: 'browser', description: 'Real-time web search', example: '[WEB_SEARCH: query]', requiresPermission: 'low' },
    READ_PAGE_CONTENT: { category: 'browser', description: 'Read page content', example: '[READ_PAGE_CONTENT]', requiresPermission: 'low' },
    LIST_OPEN_TABS: { category: 'browser', description: 'List open tabs', example: '[LIST_OPEN_TABS]', requiresPermission: 'low' },
    RELOAD: { category: 'browser', description: 'Reload current page', example: '[RELOAD]', requiresPermission: 'low' },
    GO_BACK: { category: 'navigation', description: 'Go back in history', example: '[GO_BACK]', requiresPermission: 'low' },
    GO_FORWARD: { category: 'navigation', description: 'Go forward in history', example: '[GO_FORWARD]', requiresPermission: 'low' },
    CLICK_ELEMENT: { category: 'automation', description: 'Click element by selector', example: '[CLICK_ELEMENT: #btn]', requiresPermission: 'medium' },
    FIND_AND_CLICK: { category: 'automation', description: 'Find and click text', example: '[FIND_AND_CLICK: Login]', requiresPermission: 'medium' },
    FILL_FORM: { category: 'automation', description: 'Fill form field', example: '[FILL_FORM: selector | value]', requiresPermission: 'medium' },
    SCROLL_TO: { category: 'automation', description: 'Scroll to element', example: '[SCROLL_TO: selector]', requiresPermission: 'low' },
    DOM_SEARCH: { category: 'browser', description: 'Search page DOM', example: '[DOM_SEARCH: query]', requiresPermission: 'low' },
    DOM_READ_FILTERED: { category: 'browser', description: 'Read DOM with filtering', example: '[DOM_READ_FILTERED]', requiresPermission: 'low' },
    SCREENSHOT_AND_ANALYZE: { category: 'media', description: 'Capture and analyze screen', example: '[SCREENSHOT_AND_ANALYZE]', requiresPermission: 'low' },
    OCR_SCREEN: { category: 'media', description: 'OCR screen text', example: '[OCR_SCREEN]', requiresPermission: 'low' },
    OCR_COORDINATES: { category: 'media', description: 'OCR specific region', example: '[OCR_COORDINATES: x,y,w,h]', requiresPermission: 'low' },
    SHOW_IMAGE: { category: 'media', description: 'Display image in chat', example: '[SHOW_IMAGE: url | caption]', requiresPermission: 'low' },
    SHOW_VIDEO: { category: 'media', description: 'Display video card', example: '[SHOW_VIDEO: url | title]', requiresPermission: 'low' },
    SET_THEME: { category: 'system', description: 'Change theme', example: '[SET_THEME: dark]', requiresPermission: 'low' },
    SET_VOLUME: { category: 'system', description: 'Set system volume', example: '[SET_VOLUME: 50]', requiresPermission: 'medium' },
    SET_BRIGHTNESS: { category: 'system', description: 'Set brightness', example: '[SET_BRIGHTNESS: 80]', requiresPermission: 'medium' },
    SHELL_COMMAND: { category: 'system', description: 'Execute shell command', example: '[SHELL_COMMAND: ls]', requiresPermission: 'high' },
    OPEN_APP: { category: 'system', description: 'Open application', example: '[OPEN_APP: Calculator]', requiresPermission: 'medium' },
    OPEN_VIEW: { category: 'navigation', description: 'Switch workspace view', example: '[OPEN_VIEW: coding]', requiresPermission: 'low' },
    OPEN_PDF: { category: 'utility', description: 'Open PDF file', example: '[OPEN_PDF: path]', requiresPermission: 'low' },
    GENERATE_DIAGRAM: { category: 'utility', description: 'Generate Mermaid diagram', example: '[GENERATE_DIAGRAM: graph TD...]', requiresPermission: 'low' },
    WAIT: { category: 'utility', description: 'Pause execution', example: '[WAIT: 2000]', valueRequired: false },
    THINK: { category: 'meta', description: 'Show AI reasoning', example: '[THINK: reasoning]', valueRequired: false },
    PLAN: { category: 'meta', description: 'Show AI plan', example: '[PLAN: steps]', valueRequired: false },
    EXPLAIN_CAPABILITIES: { category: 'meta', description: 'List capabilities', example: '[EXPLAIN_CAPABILITIES]', valueRequired: false },
    OPEN_MCP_SETTINGS: { category: 'utility', description: 'Open MCP settings', example: '[OPEN_MCP_SETTINGS]', requiresPermission: 'low' },

    EXTRACT_DATA: { category: 'browser', description: 'Extract data from page', example: '[EXTRACT_DATA: selector]', requiresPermission: 'low' },
    GMAIL_AUTHORIZE: { category: 'gmail', description: 'Authorize Gmail', example: '[GMAIL_AUTHORIZE]', requiresPermission: 'medium' },
    GMAIL_LIST_MESSAGES: { category: 'gmail', description: 'List Gmail messages', example: '[GMAIL_LIST_MESSAGES: count]', requiresPermission: 'low' },
    GMAIL_GET_MESSAGE: { category: 'gmail', description: 'Get Gmail message', example: '[GMAIL_GET_MESSAGE: id]', requiresPermission: 'low' },
    GMAIL_SEND_MESSAGE: { category: 'gmail', description: 'Send email', example: '[GMAIL_SEND_MESSAGE: to | subject | body]', requiresPermission: 'medium' },
    GMAIL_ADD_LABEL: { category: 'gmail', description: 'Add label to email', example: '[GMAIL_ADD_LABEL: id | label]', requiresPermission: 'medium' },
};

const ACTION_CATEGORIES = Object.entries(ACTION_REGISTRY).reduce((acc, [type, config]) => {
    acc[type] = config.category;
    return acc;
}, {} as Record<string, ActionCategory>);

const ACTION_PATTERN = new RegExp(
    `\\[\\s*(${Object.keys(ACTION_REGISTRY).join('|')})\\s*(?::\\s*([^\\]]+?))?\\s*\\]`,
    'gi'
);

function generateActionId(): string {
    return `action-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function parseValueWithOptions(value: string): { value: string; options: ActionTagOptions } {
    const options: ActionTagOptions = {};
    let parsedValue = value;
    
    const pipeParts = value.split('|').map(p => p.trim());
    if (pipeParts.length > 1) {
        for (const part of pipeParts) {
            const kvMatch = part.match(/^(\w+)\s*:\s*(.+)$/);
            if (kvMatch) {
                const [, key, val] = kvMatch;
                const lowerVal = val.toLowerCase();
                if (lowerVal === 'true' || lowerVal === 'yes') {
                    options[key] = true;
                } else if (lowerVal === 'false' || lowerVal === 'no') {
                    options[key] = false;
                } else if (/^\d+$/.test(val)) {
                    options[key] = parseInt(val, 10);
                } else {
                    options[key] = val;
                }
            }
        }
        parsedValue = pipeParts.filter(p => !/^\w+\s*:\s*/.test(p)).join(' | ');
    }
    
    return { value: parsedValue.trim(), options };
}

function calculateConfidence(actionType: string, value: string): number {
    let confidence = 1.0;
    
    if (!value || value.trim() === '') {
        const config = ACTION_REGISTRY[actionType];
        if (config?.valueRequired === false) {
            confidence = 0.9;
        } else {
            confidence = 0.5;
        }
    }
    
    const dangerousPatterns = /[;&|`$<>{}[\]]/;
    if (dangerousPatterns.test(value)) {
        confidence *= 0.8;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
}

export function parseActionTags(content: string): ActionParseResult {
    const actionTags: ActionTag[] = [];
    const matches: Array<{ match: string; index: number; length: number }> = [];
    
    let match;
    ACTION_PATTERN.lastIndex = 0;
    
    while ((match = ACTION_PATTERN.exec(content)) !== null) {
        const actionType = match[1].toUpperCase();
        
        if (!ACTION_REGISTRY[actionType]) continue;
        
        const rawValue = (match[2] || '').trim();
        const { value, options } = parseValueWithOptions(rawValue);
        const confidence = calculateConfidence(actionType, value);
        
        matches.push({
            match: match[0],
            index: match.index,
            length: match[0].length,
        });
        
        actionTags.push({
            id: generateActionId(),
            type: actionType,
            category: ACTION_CATEGORIES[actionType],
            version: '1.0',
            timestamp: Date.now(),
            command: actionType,
            value,
            options,
            rawMatch: match[0],
            index: match.index,
            confidence,
        });
    }
    
    let cleanedContent = content;
    const sortedMatches = matches.sort((a, b) => b.index - a.index);
    
    for (const m of sortedMatches) {
        cleanedContent = cleanedContent.substring(0, m.index) + 
                        cleanedContent.substring(m.index + m.length);
    }
    
    const categories = Object.keys(ACTION_REGISTRY).reduce((acc, type) => {
        acc[ACTION_REGISTRY[type].category] = 0;
        return acc;
    }, {} as Record<ActionCategory, number>);
    
    for (const action of actionTags) {
        categories[action.category]++;
    }
    
    return {
        actionTags,
        cleanedContent: cleanedContent.trim(),
        hasActionTags: actionTags.length > 0,
        metadata: {
            totalActions: actionTags.length,
            categories,
        },
    };
}

export function buildActionTagJSON(action: Omit<ActionTag, 'id' | 'version' | 'timestamp' | 'rawMatch' | 'index' | 'confidence'>): string {
    const fullAction: ActionTag = {
        ...action,
        id: generateActionId(),
        version: '1.0',
        timestamp: Date.now(),
        rawMatch: '',
        index: 0,
        confidence: 1.0,
    };
    return JSON.stringify(fullAction, null, 2);
}

export function validateActionTag(action: ActionTag): { valid: boolean; error?: string; warning?: string } {
    const config = ACTION_REGISTRY[action.type];
    
    if (!config) {
        return { valid: false, error: `Unknown action type: ${action.type}` };
    }
    
    if (config.valueRequired !== false && (!action.value || action.value.trim() === '')) {
        return { valid: false, error: `${action.type} requires a value` };
    }
    
    if (action.type === 'SET_VOLUME' || action.type === 'SET_BRIGHTNESS') {
        const num = parseInt(action.value, 10);
        if (isNaN(num) || num < 0 || num > 100) {
            return { valid: false, error: `${action.type} requires a percentage between 0-100` };
        }
    }
    
    if (action.type === 'WAIT') {
        const num = parseInt(action.value, 10);
        if (isNaN(num) || num < 0) {
            return { valid: false, error: 'WAIT requires a positive duration in milliseconds' };
        }
    }
    
    if (action.type === 'FILL_FORM' && !action.value.includes('|')) {
        return { valid: false, error: 'FILL_FORM requires format: selector | value' };
    }
    
    if (action.confidence < 0.5) {
        return { 
            valid: true, 
            warning: `Low confidence (${action.confidence}) for ${action.type} - review recommended` 
        };
    }
    
    return { valid: true };
}

export function formatActionTagsForExport(actionTags: ActionTag[]): string {
    if (actionTags.length === 0) return '';
    
    const exportObj = {
        type: 'ACTION_TAGS_EXPORT',
        version: '1.0',
        exportTimestamp: Date.now(),
        exportDate: new Date().toISOString(),
        summary: {
            totalActions: actionTags.length,
            byCategory: actionTags.reduce((acc, action) => {
                acc[action.category] = (acc[action.category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
        },
        actions: actionTags.map(action => ({
            id: action.id,
            type: action.type,
            category: action.category,
            value: action.value,
            options: action.options,
            permissionRequired: ACTION_REGISTRY[action.type]?.requiresPermission || 'low',
            generatedAt: new Date(action.timestamp).toISOString(),
        })),
    };
    
    return `\n[ACTION_TAGS_LOG]\n${JSON.stringify(exportObj, null, 2)}\n[/ACTION_TAGS_LOG]\n`;
}

export function getActionsRequiringPermission(actionTags: ActionTag[]): ActionTag[] {
    return actionTags.filter(action => {
        const config = ACTION_REGISTRY[action.type];
        return config?.requiresPermission === 'medium' || config?.requiresPermission === 'high';
    });
}

export function groupActionsByCategory(actionTags: ActionTag[]): Record<ActionCategory, ActionTag[]> {
    return actionTags.reduce((groups, action) => {
        if (!groups[action.category]) {
            groups[action.category] = [];
        }
        groups[action.category].push(action);
        return groups;
    }, {} as Record<ActionCategory, ActionTag[]>);
}
