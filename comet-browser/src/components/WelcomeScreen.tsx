"use client";

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogIn, User, Sparkles, Shield, Cpu, 
  Zap, Globe, ChevronRight, Rocket, Terminal, Layers
} from 'lucide-react';

const FeatureCard = ({ icon, title, desc, delay }: { icon: React.ReactNode, title: string, desc: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.8, ease: "easeOut" }}
        className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 hover:border-deep-space-accent-neon/30 hover:bg-white/[0.05] transition-all group relative overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-deep-space-accent-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="w-12 h-12 rounded-2xl bg-deep-space-accent-neon/10 border border-deep-space-accent-neon/20 flex items-center justify-center text-deep-space-accent-neon mb-4 shadow-[0_0_20px_rgba(0,255,242,0.1)] group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-2">{title}</h3>
        <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase tracking-tighter">{desc}</p>
    </motion.div>
);

const WelcomeScreen = () => {
    const { setHasSeenWelcomePage, setGuestMode } = useAppStore();

    const handleSignIn = () => {
        setHasSeenWelcomePage(true);
    };

    const handleGuestMode = () => {
        setGuestMode(true);
        setHasSeenWelcomePage(true);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#020205] overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.05)_0%,transparent_50%)]" />
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-deep-space-accent-neon/10 blur-[150px] rounded-full"
                />
            </div>

            <div className="w-full max-w-6xl px-12 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                
                {/* Left Side: Branding & Hero */}
                <div className="space-y-10">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-deep-space-accent-neon to-purple-600 p-3 border border-white/20 shadow-[0_0_50px_rgba(0,255,242,0.3)]">
                                <img src="icon.png" alt="Comet" className="w-full h-full object-contain filter brightness-0 invert" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white tracking-[0.2em] uppercase">Comet</h1>
                                <p className="text-xs font-black text-deep-space-accent-neon tracking-[0.5em] uppercase opacity-60">Neural Workspace v0.2.1.2 Patched</p>
                            </div>
                        </div>

                        <h2 className="text-6xl font-black text-white leading-[1.1] tracking-tighter">
                            The Web. <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-deep-space-accent-neon to-purple-400">Orchestrated.</span>
                        </h2>
                        
                        <p className="text-sm text-white/40 leading-relaxed max-w-md font-bold uppercase tracking-tight">
                            Experience the next evolution of browsing. Native AI agents, hardware-isolated sessions, and decentralized synchronization. 
                            Built for those who demand total performance.
                        </p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 pt-4"
                    >
                        <button
                            onClick={handleSignIn}
                            className="group relative px-10 py-5 bg-deep-space-accent-neon text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] overflow-hidden transition-all shadow-[0_10px_40px_rgba(0,255,242,0.2)] hover:shadow-[0_15px_60px_rgba(0,255,242,0.4)] hover:scale-105 active:scale-95"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                Initialize Core <Rocket size={18} />
                            </span>
                        </button>
                        
                        <button
                            onClick={handleGuestMode}
                            className="px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            Guest Mode <ChevronRight size={18} />
                        </button>
                    </motion.div>

                    <div className="pt-8 flex items-center gap-12 border-t border-white/5">
                        <div>
                            <div className="text-2xl font-black text-white">4GB</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest font-black">Min Specs</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">Native</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest font-black">Local AI</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-white">256-bit</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest font-black">Encryption</div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FeatureCard 
                        icon={<Sparkles size={24}/>} 
                        title="AI Orchestration" 
                        desc="Switch between Gemini, OpenAI, Claude, and local Ollama nodes instantly. Try the GPT-OSS 120B model for elite reasoning." 
                        delay={0.2}
                    />
                    <FeatureCard 
                        icon={<Layers size={24}/>} 
                        title="Neural Memory" 
                        desc="RAG-powered session recovery. Your browser remembers context, including the current date and your browsing history." 
                        delay={0.3}
                    />
                    <FeatureCard 
                        icon={<Shield size={24}/>} 
                        title="Isolated Nodes" 
                        desc="Hardware-level sandboxing. For local AI, use OLLAMA_HOST=0.0.0.0 to bridge external networks securely." 
                        delay={0.4}
                    />
                    <FeatureCard 
                        icon={<Rocket size={24}/>} 
                        title="Quick AI Overview" 
                        desc="Type / in any page or chat directly with Comet AI to automate navigation, search, and system tasks." 
                        delay={0.5}
                    />
                </div>

            </div>

            {/* Corner Version Info */}
            <div className="absolute bottom-8 right-12 text-[9px] font-black text-white/10 uppercase tracking-[1em] select-none">
                System Status: NOMINAL
            </div>
        </div>
    );
};

export default WelcomeScreen;
