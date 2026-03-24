/**
 * PDF Command Parser
 * Dedicated parser for PDF generation commands with structured JSON format
 * Separates PDF generation from main chat but includes in export logs
 */

export interface PDFCommandOptions {
    title?: string;
    subtitle?: string;
    author?: string;
    filename?: string;
    screenshot?: boolean;
    attachments?: boolean;
    content?: string;
    liveData?: boolean;
    slides?: boolean;
}

export interface PDFCommand {
    type: 'PDF';
    version: '1.0';
    timestamp: number;
    command: string;
    options: PDFCommandOptions;
    rawInput: string;
}

export interface PDFParseResult {
    commands: PDFCommand[];
    cleanedContent: string;
    hasPDFCommands: boolean;
}

// Regex patterns for PDF commands
const PDF_TAG_PATTERN = /\[GENERATE_PDF\s*:\s*([^\]]+)\]/gi;
const PDF_JSON_PATTERN = /```json\s*\n?\s*(\{[\s\S]*?"type"\s*:\s*"PDF"[\s\S]*?\})\s*\n?\s*```/gi;

const OPTION_PATTERNS = {
    title: /^title\s*:\s*(.+)$/i,
    subtitle: /^subtitle\s*:\s*(.+)$/i,
    author: /^author\s*:\s*(.+)$/i,
    filename: /^filename\s*:\s*(.+)$/i,
    screenshot: /^screenshot\s*:\s*(yes|true|no|false)$/i,
    attachments: /^attachments\s*:\s*(yes|true|no|false)$/i,
    liveData: /^liveData\s*:\s*(yes|true|no|false)$/i,
    slides: /^slides\s*:\s*(yes|true|no|false)$/i,
};

function parseOptions(input: string): PDFCommandOptions {
    const options: PDFCommandOptions = {};
    const parts = input.split('|').map(p => p.trim());

    for (const part of parts) {
        for (const [key, pattern] of Object.entries(OPTION_PATTERNS)) {
            const match = part.match(pattern);
            if (match) {
                const value = match[1].trim();
                switch (key) {
                    case 'screenshot':
                    case 'attachments':
                    case 'liveData':
                    case 'slides':
                        options[key] = value === 'yes' || value === 'true';
                        break;
                    default:
                        (options as Record<string, string>)[key] = value;
                }
                break;
            }
        }
    }

    // Extract content (non-key:value parts)
    const contentParts = parts.filter(p => {
        const isOption = Object.values(OPTION_PATTERNS).some(pat => pat.test(p));
        return !isOption;
    });

    if (contentParts.length > 0) {
        options.content = contentParts.join(' | ').trim();
    }

    return options;
}

function extractTitle(input: string): string {
    const parts = input.split('|').map(p => p.trim());
    
    for (const part of parts) {
        if (/^title\s*:/i.test(part)) continue;
        if (/^(subtitle|author|filename|screenshot|attachments|liveData|slides)\s*:/i.test(part)) continue;
        const title = part.replace(/^title\s*:?\s*/i, '').trim();
        if (title && title.length > 0 && title.length < 200) {
            return title;
        }
    }
    
    return 'Document';
}

function parsePDFCommand(input: string, timestamp: number): PDFCommand {
    const options = parseOptions(input);
    const title = options.title || extractTitle(input);
    
    return {
        type: 'PDF',
        version: '1.0',
        timestamp,
        command: 'GENERATE_PDF',
        options: {
            title,
            ...options,
        },
        rawInput: input,
    };
}

export function parsePDFCommands(content: string): PDFParseResult {
    const commands: PDFCommand[] = [];
    let cleanedContent = content;
    const matches: Array<{ match: string; index: number; length: number }> = [];

    // Find all PDF tag matches
    let match;
    PDF_TAG_PATTERN.lastIndex = 0;
    
    while ((match = PDF_TAG_PATTERN.exec(content)) !== null) {
        matches.push({
            match: match[0],
            index: match.index,
            length: match[0].length,
        });
    }

    // Find all PDF JSON matches
    PDF_JSON_PATTERN.lastIndex = 0;
    while ((match = PDF_JSON_PATTERN.exec(content)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed.type === 'PDF') {
                matches.push({
                    match: match[0],
                    index: match.index,
                    length: match[0].length,
                });
                commands.push({
                    ...parsed,
                    timestamp: parsed.timestamp || Date.now(),
                    command: parsed.command || 'GENERATE_PDF',
                });
            }
        } catch (e) {
            console.warn('[PDFCommandParser] Invalid JSON block:', e);
        }
    }

    // Parse tag-style commands
    for (const m of matches) {
        const tagMatch = m.match.match(/\[GENERATE_PDF\s*:\s*([^\]]+)\]/i);
        if (tagMatch) {
            const existingCmd = commands.find(c => 
                c.rawInput === tagMatch[1] && 
                Math.abs(c.timestamp - m.index) < 10
            );
            if (!existingCmd) {
                commands.push(parsePDFCommand(tagMatch[1], Date.now()));
            }
        }
        
        cleanedContent = cleanedContent.substring(0, m.index) + 
                         cleanedContent.substring(m.index + m.length);
    }

    return {
        commands,
        cleanedContent: cleanedContent.trim(),
        hasPDFCommands: commands.length > 0,
    };
}

export function buildPDFCommandJSON(options: PDFCommandOptions): string {
    const cmd: Omit<PDFCommand, 'rawInput'> = {
        type: 'PDF',
        version: '1.0',
        timestamp: Date.now(),
        command: 'GENERATE_PDF',
        options,
    };
    return JSON.stringify(cmd, null, 2);
}

export function validatePDFCommand(cmd: PDFCommand): { valid: boolean; error?: string } {
    if (!cmd.options?.title && !cmd.options?.content) {
        return { valid: false, error: 'PDF command requires either title or content' };
    }
    return { valid: true };
}

export function isDataPDF(title: string): boolean {
    const dataKeywords = /news|update|report|today|latest|tech|market|sports|daily|weather|price|stock|forecast/i;
    return dataKeywords.test(title);
}

export function needsLiveData(content: string, title: string): boolean {
    if (isDataPDF(title)) return true;
    const placeholderPatterns = /\[content\]|placeholder|lorem ipsum|your content here/i;
    return placeholderPatterns.test(content) || placeholderPatterns.test(title);
}

export function formatPDFForExport(pdfCommands: PDFCommand[]): string {
    if (pdfCommands.length === 0) return '';
    
    const exportObj = {
        type: 'PDF_EXPORT',
        version: '1.0',
        exportTimestamp: Date.now(),
        exportDate: new Date().toISOString(),
        commands: pdfCommands.map(cmd => ({
            title: cmd.options.title,
            subtitle: cmd.options.subtitle,
            author: cmd.options.author,
            filename: cmd.options.filename,
            screenshot: cmd.options.screenshot,
            liveData: cmd.options.liveData,
            generatedAt: new Date(cmd.timestamp).toISOString(),
        })),
    };
    
    return `\n[PDF_GENERATION_LOG]\n${JSON.stringify(exportObj, null, 2)}\n[/PDF_GENERATION_LOG]\n`;
}
