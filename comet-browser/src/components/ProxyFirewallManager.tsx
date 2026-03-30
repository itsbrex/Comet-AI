import React, { useState, useEffect } from 'react';
import { Shield, Globe, Lock, AlertTriangle, CheckCircle, Server, Activity, Power, RefreshCw, Zap } from 'lucide-react';

export default function ProxyFirewallManager() {
    const [proxyEnabled, setProxyEnabled] = useState(false);
    const [firewallLevel, setFirewallLevel] = useState<'standard' | 'strict' | 'paranoid'>('standard');
    const [selectedServer, setSelectedServer] = useState('us-east-1');
    const [isConnecting, setIsConnecting] = useState(false);

    const servers = [
        { id: 'us-east-1', name: 'USA - Virginia', ping: '24ms', load: '12%' },
        { id: 'in-west-1', name: 'India - Mumbai', ping: '5ms', load: '45%' },
        { id: 'de-frank-1', name: 'Germany - Frankfurt', ping: '110ms', load: '8%' },
        { id: 'sg-core-1', name: 'Singapore - Azure', ping: '65ms', load: '22%' },
    ];

    const toggleProxy = () => {
        setIsConnecting(true);
        setTimeout(() => {
            setProxyEnabled(!proxyEnabled);
            setIsConnecting(false);
            if (window.electronAPI) {
                // In a real app, this would call chrome.proxy or electron setProxy
                window.electronAPI.setProxy(!proxyEnabled ? { mode: 'fixed_servers', proxyServer: 'http://' + selectedServer } : null);
            }
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--primary-bg)] text-[var(--primary-text)] p-6 gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

            <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <Shield className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-widest italic text-[var(--primary-text)]">Nexus Shield</h2>
                        <p className="text-[10px] text-[var(--secondary-text)]/50 font-bold tracking-tighter">ADVANCED PROXY & FIREWALL ORCHESTRATOR</p>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all ${proxyEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${proxyEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{proxyEnabled ? 'Encrypted Tunnel Active' : 'Unprotected Connection'}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 flex-1 z-10">
                {/* Proxy Configuration */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col gap-6 group hover:border-[var(--border-color)] transition-all shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Server size={18} className="text-blue-400" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary-text)]">Global Relay Network</h3>
                        </div>
                        <button onClick={toggleProxy} className={`p-2 rounded-xl transition-all ${proxyEnabled ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-[var(--primary-bg)]/10 text-[var(--secondary-text)]/40'}`}>
                            {isConnecting ? <RefreshCw className="animate-spin" size={20} /> : <Power size={20} />}
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar pr-2">
                        <div className="grid grid-cols-1 gap-2">
                            {servers.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedServer(s.id)}
                                    className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${selectedServer === s.id ? 'bg-blue-500/10 border-blue-500/30' : 'bg-[var(--primary-bg)]/5 border-transparent hover:bg-[var(--primary-bg)]/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${parseInt(s.ping) < 30 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                        <span className="text-sm font-bold text-[var(--primary-text)]">{s.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-mono text-[var(--secondary-text)]/40">{s.ping}</span>
                                        <span className="text-[10px] font-black uppercase text-blue-400/60 ">{s.load}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-center gap-3">
                        <Activity size={16} className="text-blue-400" />
                        <div className="flex-1">
                            <p className="text-[9px] font-black uppercase text-[var(--secondary-text)]/40">Relay Speed</p>
                            <p className="text-xs font-bold text-blue-400">1.2 Gbps Ultra-Low Latency</p>
                        </div>
                    </div>
                </div>

                {/* Firewall Configuration */}
                <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col gap-6 group hover:border-[var(--border-color)] transition-all shadow-sm">
                    <div className="flex items-center gap-2">
                        <Lock size={18} className="text-emerald-400" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-[var(--primary-text)]">Protocol Guard</h3>
                    </div>

                    <div className="flex flex-col gap-3">
                        {[
                            { id: 'standard', label: 'Adaptive Intelligence', desc: 'Balanced security with AI threat detection', icon: <Zap size={14} /> },
                            { id: 'strict', label: 'Heavy Duty encryption', desc: 'Force HTTPS & block all trackers/scripts', icon: <Shield size={14} /> },
                            { id: 'paranoid', label: 'Dark Mode Protocol', desc: 'No-log, no-cache, random fingerprinting', icon: <AlertTriangle size={14} /> },
                        ].map((level) => (
                            <div
                                key={level.id}
                                onClick={() => setFirewallLevel(level.id as any)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${firewallLevel === level.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--primary-bg)]/5 border-transparent hover:bg-[var(--primary-bg)]/10'}`}
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <div className={`${firewallLevel === level.id ? 'text-emerald-400' : 'text-[var(--secondary-text)]/40'}`}>{level.icon}</div>
                                    <span className="text-sm font-black text-[var(--primary-text)]">{level.label}</span>
                                </div>
                                <p className="text-[10px] text-[var(--secondary-text)]/50 font-medium ml-6">{level.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex items-center gap-3 mt-auto">
                        <CheckCircle size={16} className="text-emerald-400" />
                        <div className="flex-1">
                            <p className="text-[9px] font-black uppercase text-gray-500">Security Index</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= (firewallLevel === 'paranoid' ? 5 : firewallLevel === 'strict' ? 4 : 3) ? 'bg-emerald-400' : 'bg-white/5'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-4 z-10">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                    <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] font-black uppercase text-amber-500/80">Regional Policy Detected</p>
                    <p className="text-xs text-[var(--secondary-text)]/60 font-medium">Auto-routing through India/Mumbai node for optimized regional access</p>
                </div>
                <button className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-600 transition-colors">Adjust Rules</button>
            </div>
        </div>
    );
}
