"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Cloud, Cpu, Shield, Key, 
  ChevronRight, ChevronLeft, ExternalLink, 
  Check, Wifi, Info, Globe, AlertCircle, Download, X
} from 'lucide-react';

interface AISetupGuideProps {
  onClose: () => void;
  onComplete: () => void;
}

const AISetupGuide: React.FC<AISetupGuideProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const providers = [
    { name: 'Google AI Studio', url: 'https://aistudio.google.com/app/apikey', icon: <Sparkles size={16} className="text-deep-space-accent-neon" />, desc: 'Get your free Gemini API key' },
    { name: 'Groq Cloud', url: 'https://console.groq.com/keys', icon: <Cpu size={16} className="text-orange-400" />, desc: 'Ultra-fast LPU inference keys' },
    { name: 'Ollama (Local AI)', url: 'https://ollama.com/download/', icon: <Download size={16} className="text-sky-400" />, desc: 'Download for private offline AI' },
    { name: 'OpenAI (GPT-4)', url: 'https://platform.openai.com/api-keys', icon: <Cloud size={16} className="text-emerald-400" />, desc: 'Standard reasoning model keys' },
    { name: 'Anthropic Claude', url: 'https://console.anthropic.com/settings/keys', icon: <Shield size={16} className="text-amber-400" />, desc: 'Superior coding & reasoning keys' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 z-[100] bg-[#0d0d1a]/98 backdrop-blur-3xl p-8 flex flex-col border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
    >
      {/* Abstract Background Decor */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-deep-space-accent-neon/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Progress Header */}
      <div className="flex items-center justify-between mb-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-deep-space-accent-neon/20 to-transparent border border-deep-space-accent-neon/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,242,0.1)]">
            <Key size={24} className="text-deep-space-accent-neon" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-[0.2em] text-white">Neural Setup</h2>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-black">NODE INITIALIZATION {step}/{totalSteps}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/5 text-white/20 hover:text-white transition-all border border-white/5 flex items-center justify-center">
          <X size={20} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto modern-scrollbar pr-2 relative z-10">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-sm font-black text-sky-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
                  <Info size={16} /> Galactic Intelligence
                </h3>
                <p className="text-xs text-white/50 leading-relaxed font-medium">
                  Welcome to Comet AI. To begin your journey, you must bridge a cognitive engine. 
                  We support high-latency <span className="text-white">Cloud Nodes</span> for maximum IQ and 
                  low-latency <span className="text-white">Local Clusters</span> for total privacy.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-deep-space-accent-neon/30 transition-all group flex items-start gap-4 cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-deep-space-accent-neon/10 flex items-center justify-center text-deep-space-accent-neon">
                    <Cloud size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Cloud Intelligence</h4>
                    <p className="text-[10px] text-white/30 leading-relaxed uppercase tracking-tighter">Fast, highly accurate, requires external API keys from verified providers.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-sky-400/30 transition-all group flex items-start gap-4 cursor-default">
                  <div className="w-10 h-10 rounded-xl bg-sky-400/10 flex items-center justify-center text-sky-400">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Local Edge Engine</h4>
                    <p className="text-[10px] text-white/30 leading-relaxed uppercase tracking-tighter">100% Private, zero cost. Uses your hardware with Ollama. No keys required.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Acquire Security Keys</p>
                <span className="text-[8px] font-black text-deep-space-accent-neon uppercase tracking-widest px-2 py-0.5 rounded-full bg-deep-space-accent-neon/5 border border-deep-space-accent-neon/20">External Links</span>
              </div>
              
              <div className="space-y-3">
                {providers.map((p, idx) => (
                  <motion.a 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={p.name} 
                    href={p.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/20 transition-all group no-underline"
                  >
                    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5 shadow-inner">
                      {p.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] font-black text-white group-hover:text-deep-space-accent-neon transition-colors uppercase tracking-widest">{p.name}</div>
                      <div className="text-[9px] text-white/20 font-medium uppercase tracking-tighter">{p.desc}</div>
                    </div>
                    <ExternalLink size={14} className="text-white/10 group-hover:text-white/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </motion.a>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
                <Shield size={18} className="text-amber-500/60 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-500/60 leading-relaxed font-bold uppercase tracking-tight">
                  Comet vault secures your keys locally with 256-bit encryption. Your keys never leave this machine.
                </p>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl mb-2">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                  <Wifi size={20} className="text-sky-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Ollama Network Tunnel</h3>
                  <p className="text-[9px] text-sky-400/60 font-black uppercase tracking-widest">Configuration required</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 group hover:border-sky-400/20 transition-all">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center justify-between">
                    <span>1. Expose to Network</span>
                    <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded-full">Terminal</span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                    To allow Comet to communicate with Ollama, set the host to 0.0.0.0:
                  </p>
                  <div className="bg-black/60 p-3 rounded-xl font-mono text-[10px] text-sky-300 border border-white/10 shadow-inner select-all">
                    export OLLAMA_HOST=0.0.0.0
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 group hover:border-sky-400/20 transition-all">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center justify-between">
                    <span>2. Bypass Origins</span>
                    <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded-full">Security</span>
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed font-medium">
                    Permit browser access by relaxing the origin constraints:
                  </p>
                  <div className="bg-black/60 p-3 rounded-xl font-mono text-[10px] text-sky-300 border border-white/10 shadow-inner select-all">
                    export OLLAMA_ORIGINS="*"
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
                  <Info size={18} className="text-blue-400/60 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-400/60 leading-relaxed font-bold uppercase tracking-tight">
                    Restart Ollama service after updating these environment variables to finalize the link.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center space-y-8 py-10"
            >
              <div className="relative">
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-deep-space-accent-neon/20 blur-[40px] rounded-full"
                />
                <div className="w-24 h-24 rounded-full bg-deep-space-accent-neon/10 border-2 border-deep-space-accent-neon/30 flex items-center justify-center relative z-10 shadow-[0_0_50px_rgba(0,255,242,0.2)]">
                  <Sparkles size={48} className="text-deep-space-accent-neon" />
                </div>
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-xl font-black text-white uppercase tracking-[0.3em]">Synapse Ready</h3>
                <p className="text-xs text-white/30 max-w-[280px] leading-relaxed mx-auto font-medium uppercase tracking-tighter">
                  Initialization complete. Enter your credentials in the cockpit to awaken the agent.
                </p>
              </div>

              <button 
                onClick={onComplete}
                className="group relative px-10 py-4 rounded-2xl bg-deep-space-accent-neon text-black text-[11px] font-black uppercase tracking-[0.3em] overflow-hidden transition-all shadow-[0_10px_40px_rgba(0,255,242,0.2)] hover:shadow-[0_15px_60px_rgba(0,255,242,0.4)] hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <span className="relative z-10">Wake Agent</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="pt-8 flex items-center justify-between gap-6 relative z-10 border-t border-white/5">
        <button 
          onClick={prevStep}
          disabled={step === 1}
          className={`group flex items-center gap-3 px-6 py-3 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest transition-all ${step === 1 ? 'opacity-0 cursor-default' : 'hover:bg-white/5 text-white/40 hover:text-white'}`}
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
        </button>
        
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${step === i ? 'w-8 bg-deep-space-accent-neon shadow-[0_0_10px_rgba(0,255,242,0.5)]' : 'w-2 bg-white/10'}`} 
            />
          ))}
        </div>

        <button 
          onClick={nextStep}
          disabled={step === totalSteps}
          className={`group flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all ${step === totalSteps ? 'opacity-0 cursor-default' : 'hover:bg-white/10 text-white'}`}
        >
          Next <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

export default AISetupGuide;
