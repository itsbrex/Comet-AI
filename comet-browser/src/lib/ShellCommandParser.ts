/**
 * Shell Command Parser
 * Robust parsing, validation, and execution of shell commands
 * Includes comprehensive security checks and safe alternatives
 */

export type ShellPlatform = 'darwin' | 'windows' | 'linux';

export interface ShellParseResult {
    commands: ShellCommand[];
    cleanedContent: string;
    hasShellCommands: boolean;
}

export interface ShellCommand {
    id: string;
    type: 'SHELL';
    version: '1.0';
    timestamp: number;
    rawCommand: string;
    command: string;
    args: string[];
    flags: Record<string, string | boolean>;
    platform: ShellPlatform;
    safe: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskReasons: string[];
    requiresPermission: boolean;
    timeout: number;
    workingDirectory?: string;
    environment?: Record<string, string>;
    index: number;
}

export interface ShellValidationResult {
    valid: boolean;
    error?: string;
    warning?: string;
    sanitizedCommand?: string;
}

// Dangerous command patterns
const DANGEROUS_PATTERNS: Array<{ pattern: RegExp; risk: 'critical' | 'high' | 'medium' | 'low'; reason: string }> = [
    { pattern: /rm\s+-rf\s+\/(?:\s|$)/, risk: 'critical', reason: 'Recursive delete from root' },
    { pattern: /rm\s+-rf\s+\/.*?(?:\s|$)/, risk: 'critical', reason: 'Recursive delete from system path' },
    { pattern: /:\(\)\{[^}]*:\|[^}]*&[^}]*\};:/, risk: 'critical', reason: 'Fork bomb detected' },
    { pattern: />\s*\/dev\/sda/, risk: 'critical', reason: 'Direct write to disk device' },
    { pattern: /dd\s+if=.*of=\/dev\/(?:sd|hd|nvme)/i, risk: 'critical', reason: 'Direct disk write' },
    { pattern: /mkfs/i, risk: 'critical', reason: 'Format filesystem command' },
    { pattern: /shutdown|halt|reboot|init\s+0|init\s+6/i, risk: 'critical', reason: 'System shutdown/restart' },
    { pattern: /sudo\s+su/i, risk: 'high', reason: 'Privilege escalation' },
    { pattern: /chmod\s+777\s+\/(?:\s|$)/, risk: 'high', reason: 'Full permissions on root' },
    { pattern: /curl\s*\|\s*sh|wget\s*\|\s*sh|fetch\s*\|\s*sh/i, risk: 'high', reason: 'Pipe download to shell' },
    { pattern: /nc\s+-[el].*\/bin\/(?:sh|bash)/i, risk: 'high', reason: 'Netcat reverse shell pattern' },
    { pattern: /eval\s+\$/i, risk: 'high', reason: 'Eval with variable substitution' },
    { pattern: /source\s+\$\(/i, risk: 'high', reason: 'Variable substitution in source' },
    { pattern: /\|\s*grep\s+-E\s+"\$\(/i, risk: 'high', reason: 'Command substitution in pipe' },
    { pattern: /\|\s*awk\s+'\{system\(/i, risk: 'high', reason: 'System call in awk' },
    { pattern: /base64\s+-d\s+\|\s*bash/i, risk: 'high', reason: 'Encoded command execution' },
    { pattern: /mv\s+\/\w+\s+\/dev\/null/i, risk: 'high', reason: 'Move to /dev/null' },
    { pattern: />\s*\/etc\/(?:passwd|shadow|group|sudoers)/i, risk: 'high', reason: 'Write to system files' },
    { pattern: /useradd|userdel|usermod|groupadd|groupdel/i, risk: 'high', reason: 'User/group modification' },
    { pattern: /passwd\s+root/i, risk: 'high', reason: 'Root password change attempt' },
];

// Blocked commands (completely denied)
const BLOCKED_COMMANDS = new Set([
    'rm', 'del', 'format', 'fdisk', 'parted',
    'shutdown', 'halt', 'poweroff', 'reboot', 'init',
    'sudo', 'su', 'pkexec', 'chroot',
    'dd', 'dc3dd', 'dcfldd',
    'nc', 'netcat', 'ncat', 'socat',
    'msfvenom', 'msfconsole', 'meterpreter',
    'john', 'hashcat', 'crack',
    'hydra', 'medusa', 'ncrack',
]);

// Commands that need safe alternatives
const NEEDS_SAFE_ALTERNATIVE: Record<string, string> = {
    'ls -la': 'ls',
    'ls -l': 'ls',
    'ls -A': 'ls',
    'dir': 'ls',
    'type': 'which',
    'cat': 'head',
    'more': 'head',
    'less': 'head',
};

// Shell command regex patterns
const SHELL_COMMAND_PATTERN = /\[SHELL_COMMAND\s*:\s*([^\]]+)\]/gi;
const RAW_SHELL_PATTERN = /(?:^|\n)\$\s+(.+)$/gm;
const BACKTICK_PATTERN = /`([^`]+)`/g;

function detectPlatform(): ShellPlatform {
    if (typeof process !== 'undefined' && process.platform) {
        if (process.platform === 'win32') return 'windows';
        if (process.platform === 'darwin') return 'darwin';
    }
    return 'linux';
}

function generateShellId(): string {
    return `shell-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function parseCommandString(cmdStr: string): { command: string; args: string[]; flags: Record<string, string | boolean> } {
    const parts = cmdStr.trim().split(/\s+/);
    const command = parts[0] || '';
    const args: string[] = [];
    const flags: Record<string, string | boolean> = {};
    
    let i = 1;
    while (i < parts.length) {
        const part = parts[i];
        
        if (part.startsWith('-')) {
            const flag = part.replace(/^-+/, '');
            
            if (i + 1 < parts.length && !parts[i + 1].startsWith('-')) {
                flags[flag] = parts[i + 1];
                i += 2;
            } else {
                flags[flag] = true;
                i++;
            }
        } else {
            args.push(part);
            i++;
        }
    }
    
    return { command, args, flags };
}

function checkForDangerousPatterns(command: string): { risk: 'low' | 'medium' | 'high' | 'critical'; reasons: string[] } {
    const reasons: string[] = [];
    let highestRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    const riskLevels: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
        'critical': 'critical',
        'high': 'high',
        'medium': 'medium',
        'low': 'low',
    };
    
    for (const { pattern, risk, reason } of DANGEROUS_PATTERNS) {
        if (pattern.test(command)) {
            reasons.push(reason);
            const level = riskLevels[risk];
            if (level === 'critical') highestRisk = 'critical';
            else if (level === 'high' && highestRisk !== 'critical') highestRisk = 'high';
            else if (level === 'medium' && highestRisk === 'low') highestRisk = 'medium';
        }
    }
    
    return { risk: highestRisk, reasons };
}

function checkForBlockedCommands(command: string): boolean {
    const parts = command.trim().split(/\s+/);
    const baseCmd = parts[0]?.toLowerCase();
    
    if (BLOCKED_COMMANDS.has(baseCmd)) {
        return true;
    }
    
    for (const blocked of BLOCKED_COMMANDS) {
        if (command.startsWith(blocked + ' ')) {
            return true;
        }
    }
    
    return false;
}

function provideSafeAlternative(command: string): string | null {
    const trimmed = command.trim().toLowerCase();
    
    for (const [pattern, alternative] of Object.entries(NEEDS_SAFE_ALTERNATIVE)) {
        if (trimmed === pattern.toLowerCase()) {
            return alternative;
        }
    }
    
    if (/^rm\s+/.test(trimmed) && !/-rf/.test(trimmed)) {
        return 'ls';
    }
    
    return null;
}

function sanitizeCommand(command: string): string {
    return command
        .replace(/[;&|`$<>{}[\]()\\!#*?"' \t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseShellCommand(
    rawCommand: string, 
    index: number, 
    platform: ShellPlatform = detectPlatform()
): ShellCommand {
    const cleaned = rawCommand.trim();
    const { command, args, flags } = parseCommandString(cleaned);
    const { risk, reasons } = checkForDangerousPatterns(cleaned);
    const isBlocked = checkForBlockedCommands(cleaned);
    const safe = !isBlocked && risk === 'low';
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (isBlocked) riskLevel = 'critical';
    else if (reasons.length > 0) riskLevel = risk;
    
    return {
        id: generateShellId(),
        type: 'SHELL',
        version: '1.0',
        timestamp: Date.now(),
        rawCommand: cleaned,
        command,
        args,
        flags,
        platform,
        safe,
        riskLevel,
        riskReasons: reasons,
        requiresPermission: riskLevel !== 'low' || isBlocked,
        timeout: riskLevel === 'critical' ? 0 : riskLevel === 'high' ? 5000 : 30000,
        index,
    };
}

export function parseShellCommands(content: string): ShellParseResult {
    const commands: ShellCommand[] = [];
    const matches: Array<{ match: string; index: number; length: number }> = [];
    
    let match;
    SHELL_COMMAND_PATTERN.lastIndex = 0;
    
    while ((match = SHELL_COMMAND_PATTERN.exec(content)) !== null) {
        const shellValue = match[1].trim();
        matches.push({
            match: match[0],
            index: match.index,
            length: match[0].length,
        });
        commands.push(parseShellCommand(shellValue, match.index));
    }
    
    let cleanedContent = content;
    const sortedMatches = matches.sort((a, b) => b.index - a.index);
    
    for (const m of sortedMatches) {
        cleanedContent = cleanedContent.substring(0, m.index) + 
                        cleanedContent.substring(m.index + m.length);
    }
    
    return {
        commands,
        cleanedContent: cleanedContent.trim(),
        hasShellCommands: commands.length > 0,
    };
}

export function validateShellCommand(command: string): ShellValidationResult {
    const trimmed = command.trim();
    
    if (!trimmed) {
        return { valid: false, error: 'Empty command' };
    }
    
    if (trimmed.length > 1000) {
        return { valid: false, error: 'Command too long (max 1000 characters)' };
    }
    
    if (checkForBlockedCommands(trimmed)) {
        return { 
            valid: false, 
            error: 'This command is blocked for security reasons',
            warning: 'Contact administrator if you need this functionality',
        };
    }
    
    const { risk, reasons } = checkForDangerousPatterns(trimmed);
    
    if (risk === 'critical') {
        return {
            valid: false,
            error: 'Command blocked: extremely dangerous operation detected',
            warning: reasons.join(', '),
        };
    }
    
    if (risk === 'high') {
        const alternative = provideSafeAlternative(trimmed);
        return {
            valid: false,
            error: 'Command requires elevated review',
            warning: `${reasons.join(', ')}${alternative ? `. Consider: ${alternative}` : ''}`,
        };
    }
    
    const sanitized = sanitizeCommand(trimmed);
    if (sanitized !== trimmed) {
        return {
            valid: true,
            warning: 'Command was sanitized',
            sanitizedCommand: sanitized,
        };
    }
    
    return { valid: true };
}

export function formatShellCommandForExport(shellCommands: ShellCommand[]): string {
    if (shellCommands.length === 0) return '';
    
    const exportObj = {
        type: 'SHELL_COMMANDS_EXPORT',
        version: '1.0',
        exportTimestamp: Date.now(),
        exportDate: new Date().toISOString(),
        summary: {
            totalCommands: shellCommands.length,
            safe: shellCommands.filter(c => c.safe).length,
            requiresReview: shellCommands.filter(c => !c.safe).length,
        },
        commands: shellCommands.map(cmd => ({
            id: cmd.id,
            command: cmd.command,
            args: cmd.args,
            flags: cmd.flags,
            platform: cmd.platform,
            riskLevel: cmd.riskLevel,
            riskReasons: cmd.riskReasons,
            requiresPermission: cmd.requiresPermission,
            timeout: cmd.timeout,
            executedAt: new Date(cmd.timestamp).toISOString(),
        })),
    };
    
    return `\n[SHELL_COMMANDS_LOG]\n${JSON.stringify(exportObj, null, 2)}\n[/SHELL_COMMANDS_LOG]\n`;
}

export function buildShellCommandJSON(command: string, options?: {
    timeout?: number;
    workingDirectory?: string;
    environment?: Record<string, string>;
}): string {
    const parsed = parseShellCommand(command, 0);
    
    if (options) {
        if (options.timeout) parsed.timeout = options.timeout;
        if (options.workingDirectory) parsed.workingDirectory = options.workingDirectory;
        if (options.environment) parsed.environment = options.environment;
    }
    
    return JSON.stringify(parsed, null, 2);
}

export function getPlatformSafeCommand(
    command: string, 
    platform: ShellPlatform
): { command: string; args: string[] } {
    const { command: cmd, args } = parseCommandString(command);
    
    const platformCommands: Record<string, Record<ShellPlatform, { command: string; args: string[] }>> = {
        'wifi': {
            darwin: { command: '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport', args: ['-I'] },
            windows: { command: 'netsh', args: ['wlan', 'show', 'interfaces'] },
            linux: { command: 'iwgetid', args: [] },
        },
        'brightness': {
            darwin: { command: 'brightness', args: [] },
            windows: { command: 'powershell', args: ['-Command', '(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1,PARAMS)'] },
            linux: { command: 'xrandr', args: ['--output', 'eDP-1', '--brightness'] },
        },
        'volume': {
            darwin: { command: 'osascript', args: ['-e', 'set volume OUTPUT_VOLUME'] },
            windows: { command: 'nircmd', args: ['setsysvolume'] },
            linux: { command: 'amixer', args: ['sset', 'Master'] },
        },
    };
    
    return { command: cmd, args };
}

export function estimateCommandRiskLevel(command: string): 'low' | 'medium' | 'high' | 'critical' {
    if (checkForBlockedCommands(command)) return 'critical';
    const { risk } = checkForDangerousPatterns(command);
    return risk;
}
