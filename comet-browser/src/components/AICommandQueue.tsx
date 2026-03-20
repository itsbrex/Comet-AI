"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Loader2, AlertCircle, ChevronRight, Zap, Target, Search, Globe, FileText, Camera, ScanLine, MousePointer2, Volume2, Sun, Terminal, Rocket, Languages, Hourglass, Shield, Brain } from 'lucide-react';

export interface AICommand {
    id: string;
    type: string;
    value: string;
    status: 'pending' | 'executing' | 'completed' | 'failed' | 'awaiting_permission';
    output?: string;
    error?: string;
    timestamp: number;
}

interface AICommandQueueProps {
    commands: AICommand[];
    currentCommandIndex: number;
    onCancel?: () => void;
}

const getCommandIcon = (type: string) => {
    switch (type) {
        case 'NAVIGATE': return <Globe size={16} />;
        case 'SEARCH': return <Search size={16} />;
        case 'READ_PAGE_CONTENT': return <FileText size={16} />;
        case 'SCREENSHOT_AND_ANALYZE': return <Camera size={16} />;
        case 'OCR_SCREEN': return <ScanLine size={16} />;
        case 'FIND_AND_CLICK': return <MousePointer2 size={16} />;
        case 'SET_VOLUME': return <Volume2 size={16} />;
        case 'SET_BRIGHTNESS': return <Sun size={16} />;
        case 'SHELL_COMMAND': return <Terminal size={16} />;
        case 'OPEN_APP': return <Rocket size={16} />;
        case 'TRANSLATE': return <Languages size={16} />;
        case 'WEB_SEARCH': return <Globe size={16} />;
        case 'EXPLAIN_CAPABILITIES': return <Zap size={16} />;
        case 'WAIT': return <Hourglass size={16} />;
        case 'THINK': return <Brain size={16} />;
        default: return <Zap size={16} />;
    }
};

const getCommandLabel = (type: string, value: string) => {
    const labels: Record<string, (v: string) => string> = {
        NAVIGATE: (v) => `Navigating to ${new URL(v.startsWith('http') ? v : 'https://' + v).hostname}`,
        SEARCH: (v) => `Searching "${v}"`,
        READ_PAGE_CONTENT: () => 'Analyzing page content',
        SCREENSHOT_AND_ANALYZE: () => 'Capturing workspace',
        OCR_SCREEN: (v) => v ? `OCR: ${v}` : 'Optical Character Recognition',
        FIND_AND_CLICK: (v) => `Interacting with "${v}"`,
        SET_VOLUME: (v) => `System Audio: ${v}%`,
        SET_BRIGHTNESS: (v) => `Display Brightness: ${v}%`,
        SHELL_COMMAND: (v) => `Running terminal task`,
        OPEN_APP: (v) => `Launching ${v}`,
        TRANSLATE: (v) => `Translating context`,
        WEB_SEARCH: (v) => `Deep Web Search: "${v}"`,
        EXPLAIN_CAPABILITIES: () => 'Orchestrating capabilities',
        WAIT: (v) => `Pausing for ${parseInt(v) / 1000}s`,
        THINK: (v) => `Cognitive Processing: ${v}`,
    };
    try {
        return labels[type] ? labels[type](value) : `${type}: ${value}`;
    } catch {
        return `${type}: ${value}`;
    }
};

export const AICommandQueue: React.FC<AICommandQueueProps> = ({
    commands,
    currentCommandIndex,
    onCancel
}) => {
    if (commands.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className="absolute bottom-6 left-4 right-4 z-[100] bg-[#0a0a0f]/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
        >
            {/* Glossy Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-sky-500/10 to-transparent border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 bg-sky-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
                        <motion.div 
                            className="absolute inset-0 bg-sky-400/50 rounded-full"
                            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Action Chain</h3>
                </div>
                <div className="px-2 py-0.5 bg-white/5 rounded-full text-[9px] text-white/40 font-mono border border-white/5">
                    {currentCommandIndex + 1} OF {commands.length}
                </div>
            </div>

            {/* Command List */}
            <div className="max-h-72 overflow-y-auto modern-scrollbar p-1">
                <AnimatePresence mode="popLayout">
                    {commands.map((command, index) => {
                        const isActive = index === currentCommandIndex;
                        const isPast = index < currentCommandIndex;

                        return (
                            <motion.div
                                key={command.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group px-4 py-3.5 rounded-2xl mb-1 transition-all duration-300 border ${
                                    isActive 
                                    ? 'bg-sky-500/10 border-sky-500/30' 
                                    : isPast 
                                        ? 'bg-transparent border-transparent opacity-40' 
                                        : 'bg-transparent border-transparent opacity-60'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon Column */}
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${
                                        isActive 
                                        ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)]' 
                                        : isPast 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : 'bg-white/5 text-white/40'
                                    }`}>
                                        {command.status === 'completed' ? <CheckCircle2 size={16} /> 
                                         : command.status === 'failed' ? <AlertCircle size={16} className="text-red-400" />
                                         : command.status === 'awaiting_permission' ? <Shield size={16} className="text-amber-400 animate-pulse" />
                                         : getCommandIcon(command.type)}
                                    </div>

                                    {/* Info Column */}
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-[11px] font-bold leading-tight truncate transition-colors ${
                                            isActive ? 'text-white' : 'text-white/40'
                                        }`}>
                                            {getCommandLabel(command.type, command.value)}
                                        </div>
                                        
                                        {/* Command Output / Results */}
                                        {command.output && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                className={`mt-2 p-2 rounded-lg bg-black/40 border border-white/5 text-[9px] font-mono leading-relaxed overflow-hidden ${
                                                    isActive ? 'text-sky-300' : 'text-sky-300/40'
                                                }`}
                                            >
                                                {command.output.length > 150 
                                                    ? `${command.output.substring(0, 150)}...` 
                                                    : command.output}
                                            </motion.div>
                                        )}

                                        {isActive && !command.output && (
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        className="h-full bg-sky-400"
                                                        initial={{ width: '0%' }}
                                                        animate={{ width: '100%' }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {command.error && isActive && (
                                            <div className="text-[9px] text-red-400 font-medium mt-1">
                                                Interrupted: {command.error}
                                            </div>
                                        )}
                                    </div>

                                    {/* Status Orb for past items */}
                                    {isPast && !command.output && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Glassy Footer */}
            {onCancel && (
                <div className="p-4 bg-gradient-to-t from-white/5 to-transparent border-t border-white/5">
                    <button
                        onClick={onCancel}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 active:scale-95"
                    >
                        Abort Sequence
                    </button>
                </div>
            )}
        </motion.div>
    );
};
