"use client";

import React from 'react';
import { Shield, Monitor, Globe, Terminal, Lock, Unlock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const PermissionSettings = () => {
    const [permissions, setPermissions] = React.useState({
        shellCommands: false,
    });

    React.useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        if (window.electronAPI?.getSecuritySettings) {
            try {
                const settings = await window.electronAPI.getSecuritySettings();
                setPermissions(prev => ({
                    ...prev,
                    shellCommands: settings.autoApproveLowRisk || false,
                }));
            } catch (e) {
                console.log('Could not get security settings');
            }
        }
    };

    const openSystemSettings = (type: string) => {
        const urls: Record<string, string> = {
            screen: 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
            accessibility: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
            automation: 'x-apple.systempreferences:com.apple.preference.security?Privacy_Automation',
        };
        if (window.electronAPI?.openSystemSettings) {
            window.electronAPI.openSystemSettings(urls[type] || '');
        }
    };

    const getPlatform = (): string => {
        if (typeof window !== 'undefined' && window.electronAPI?.getPlatform) {
            return window.electronAPI.getPlatform();
        }
        return 'darwin';
    };

    const platform = getPlatform();
    const isMac = platform === 'darwin';

    if (!isMac) {
        return (
            <div className="space-y-8">
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                            <Terminal size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Shell Commands</h3>
                            <p className="text-white/40 text-sm">Configure shell command execution</p>
                        </div>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">
                        Shell commands are automatically enabled on Windows and Linux. 
                        No additional permissions required.
                    </p>
                    <div className="mt-6 flex items-center gap-3 text-green-400">
                        <CheckCircle size={18} />
                        <span className="text-sm font-medium">All permissions granted</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-3xl p-8 border border-cyan-500/20">
                <div className="flex items-center gap-4 mb-4">
                    <Shield size={32} className="text-cyan-400" />
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-wide">macOS Permissions</h3>
                        <p className="text-white/50 text-sm">Configure system access for Comet Browser features</p>
                    </div>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                    Comet Browser requires certain macOS permissions to enable automation, shell commands, and screen capture features.
                    Grant permissions in System Settings to unlock full functionality.
                </p>
            </div>

            {/* Permission Cards */}
            <div className="grid gap-4">
                {/* Screen Recording */}
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
                                <Monitor size={24} className="text-red-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">Screen Recording</h4>
                                <p className="text-white/40 text-xs">Required for screenshot capture and OCR</p>
                            </div>
                        </div>
                        <button
                            onClick={() => openSystemSettings('screen')}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white transition-all"
                        >
                            Open Settings
                        </button>
                    </div>
                </div>

                {/* Accessibility */}
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                <Lock size={24} className="text-purple-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">Accessibility</h4>
                                <p className="text-white/40 text-xs">Required for mouse/keyboard automation</p>
                            </div>
                        </div>
                        <button
                            onClick={() => openSystemSettings('accessibility')}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white transition-all"
                        >
                            Open Settings
                        </button>
                    </div>
                </div>

                {/* Automation */}
                <div className="bg-white/5 rounded-3xl p-6 border border-white/10 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                                <Terminal size={24} className="text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white">Automation (Terminal)</h4>
                                <p className="text-white/40 text-xs">Required for shell command execution</p>
                            </div>
                        </div>
                        <button
                            onClick={() => openSystemSettings('automation')}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium text-white transition-all"
                        >
                            Open Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Shell Commands Section */}
            <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                        <Terminal size={24} className="text-green-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white">Shell Commands</h4>
                        <p className="text-white/40 text-xs">Terminal command execution status</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={18} className="text-green-400" />
                            <span className="text-white/80 text-sm">Safe commands (ls, cp, mv, mkdir, cat, pwd)</span>
                        </div>
                        <span className="text-green-400 text-xs font-medium px-3 py-1 bg-green-500/20 rounded-full">Auto-approved</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl">
                        <div className="flex items-center gap-3">
                            {permissions.shellCommands ? (
                                <CheckCircle size={18} className="text-green-400" />
                            ) : (
                                <AlertTriangle size={18} className="text-yellow-400" />
                            )}
                            <span className="text-white/80 text-sm">Dangerous commands (rm, sudo, chmod)</span>
                        </div>
                        <span className={permissions.shellCommands ? "text-green-400 text-xs font-medium px-3 py-1 bg-green-500/20 rounded-full" : "text-yellow-400 text-xs font-medium px-3 py-1 bg-yellow-500/20 rounded-full"}>
                            {permissions.shellCommands ? 'Approved' : 'Requires approval'}
                        </span>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <p className="text-blue-300 text-sm leading-relaxed">
                        <strong>How it works:</strong> Safe shell commands are automatically executed. 
                        Dangerous commands show a permission dialog once, then remember your choice. 
                        Use "Always Allow" for commands you trust.
                    </p>
                </div>
            </div>

            {/* Quick Guide */}
            <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                <h4 className="text-lg font-bold text-white mb-4">Quick Guide</h4>
                <div className="space-y-3 text-sm text-white/60">
                    <p>1. Click "Open Settings" for each permission above</p>
                    <p>2. Enable the toggle/switch in System Settings</p>
                    <p>3. Add "Comet Browser" to the allowed apps list</p>
                    <p>4. Restart Comet Browser for changes to take effect</p>
                </div>
            </div>
        </div>
    );
};

export default PermissionSettings;