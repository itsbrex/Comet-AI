"use client";
import React, { useState } from 'react';
import { Server, Plus, Trash2, Globe, Activity, Shield, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

const McpSettings = () => {
    const store = useAppStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newServer, setNewServer] = useState({ name: '', url: '' });

    const handleAdd = () => {
        if (newServer.name && newServer.url) {
            store.addMcpServer(newServer);
            setNewServer({ name: '', url: '' });
            setIsAdding(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">MCP Servers</h3>
                    <p className="text-xs text-white/30">Connect to Model Context Protocol servers to provide the AI with extra tools and resources.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { name: 'GitHub', desc: 'Manage repos, issues & PRs', url: 'mcp://github.com/mcp-server' },
                    { name: 'Google Drive', desc: 'Search & read documents', url: 'mcp://drive.google.com/mcp-server' },
                    { name: 'Dropbox', desc: 'Analyze cloud storage files', url: 'mcp://dropbox.com/mcp-server' }
                ].map((preset) => (
                    <button
                        key={preset.name}
                        onClick={() => {
                            setNewServer({ name: preset.name, url: preset.url });
                            setIsAdding(true);
                        }}
                        className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-deep-space-accent-neon/30 hover:bg-deep-space-accent-neon/5 transition-all text-left flex flex-col gap-2 group relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-white font-bold text-sm tracking-tight">{preset.name}</span>
                            <div className="p-1 px-2 rounded-lg bg-deep-space-accent-neon/10 text-deep-space-accent-neon text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Connect
                            </div>
                        </div>
                        <p className="text-white/30 text-[11px] leading-relaxed line-clamp-2">{preset.desc}</p>
                    </button>
                ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Connected Servers</h4>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (window.electronAPI) {
                                for (const server of store.mcpServers) {
                                    const res = await window.electronAPI.mcpGetTools(server.id);
                                    if (res.success) {
                                        store.updateMcpServerTools(server.id, res.tools);
                                    }
                                }
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 transition-all"
                    >
                        <Activity size={14} /> Refresh All
                    </button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-deep-space-accent-neon/20 hover:bg-deep-space-accent-neon/30 border border-deep-space-accent-neon/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-deep-space-accent-neon transition-all"
                    >
                        <Plus size={14} /> Custom Server
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Server Name</label>
                                    <input
                                        type="text"
                                        value={newServer.name}
                                        onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                                        placeholder="e.g. Local Database"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-deep-space-accent-neon/50 transition-all placeholder:text-white/10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Server URL (SSE or stdio)</label>
                                    <input
                                        type="text"
                                        value={newServer.url}
                                        onChange={(e) => setNewServer({ ...newServer, url: e.target.value })}
                                        placeholder="http://localhost:3000/sse"
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-deep-space-accent-neon/50 transition-all placeholder:text-white/10"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAdd}
                                    className="px-6 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-deep-space-accent-neon hover:text-black transition-all shadow-xl"
                                >
                                    Connect Server
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4">
                {store.mcpServers.length === 0 ? (
                    <div className="py-20 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem]">
                        <Server size={48} className="mx-auto mb-4 text-white/10" />
                        <p className="text-xs text-white/20">No MCP servers connected.</p>
                        <p className="text-[10px] text-white/10 uppercase font-black mt-2 tracking-widest">Connect your first server to expand AI capabilities</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {store.mcpServers.map((server) => (
                            <motion.div
                                key={server.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col gap-4 group hover:bg-white/[0.04] transition-all relative overflow-hidden"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${server.status === 'online' ? 'bg-green-500/10 text-green-500' :
                                        server.status === 'connecting' ? 'bg-sky-500/10 text-sky-500 animate-pulse' :
                                            'bg-red-500/10 text-red-500'
                                        }`}>
                                        <Server size={24} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-white text-base truncate">{server.name}</h4>
                                            <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${server.status === 'online' ? 'bg-green-500/10 text-green-500' :
                                                server.status === 'connecting' ? 'bg-sky-500/10 text-sky-500' :
                                                    'bg-red-500/10 text-red-500'
                                                }`}>
                                                {server.status}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-white/30 truncate">
                                            <LinkIcon size={12} />
                                            <span className="text-[11px] font-medium truncate">{server.url}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={async () => {
                                                if (window.electronAPI) {
                                                    const res = await window.electronAPI.mcpGetTools(server.id);
                                                    if (res.success) {
                                                        store.updateMcpServerTools(server.id, res.tools);
                                                    }
                                                }
                                            }}
                                            className="p-3 rounded-2xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                                            title="Refresh Tools"
                                        >
                                            <Activity size={18} />
                                        </button>
                                        <button
                                            onClick={() => store.removeMcpServer(server.id)}
                                            className="p-3 rounded-2xl bg-red-500/5 text-red-500/40 hover:bg-red-500/20 hover:text-red-400 transition-all border border-red-500/10"
                                            title="Disconnect Server"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {server.tools && server.tools.length > 0 && (
                                    <div className="pt-4 border-t border-white/5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 ml-1">Available Tools ({server.tools.length})</p>
                                        <div className="flex flex-wrap gap-2">
                                            {server.tools.map((tool: any) => (
                                                <div key={tool.name} className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[10px] text-white/50 hover:bg-white/5 hover:text-white transition-all cursor-help" title={tool.description}>
                                                    <span className="font-bold">{tool.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="p-6 rounded-3xl bg-sky-500/5 border border-sky-500/10 space-y-3">
                    <div className="flex items-center gap-3 text-sky-400">
                        <Activity size={20} />
                        <span className="text-xs font-bold uppercase tracking-tight">Real-time Context</span>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                        MCP allows the AI to query your local environment, databases, and third-party APIs in real-time without leaving the browser.
                    </p>
                </div>
                <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10 space-y-3">
                    <div className="flex items-center gap-3 text-purple-400">
                        <Shield size={20} />
                        <span className="text-xs font-bold uppercase tracking-tight">Granular Consent</span>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed">
                        Every tool provided by an MCP server requires manual authorization when the AI attempts to use it for the first time.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default McpSettings;
