import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Cpu, Globe, Key, Settings2, ShieldCheck, ArrowRight, Check, Play, DownloadCloud, Sparkles, ChevronLeft, Terminal, Activity, Zap } from 'lucide-react';

export const StartupSetupUI = ({ onComplete }: { onComplete: () => void }) => {
  const store = useAppStore();
  const [step, setStep] = useState(1);
  const [wantsAI, setWantsAI] = useState<boolean | null>(null);

  const finishSetup = () => {
    store.setHasCompletedStartupSetup(true);
    onComplete();
  };

  const steps = [
    { title: 'Intelligence', icon: <Cpu size={14} /> },
    { title: 'Neural Core', icon: <Zap size={14} /> },
    { title: 'Synchronization', icon: <Globe size={14} /> }
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020205]/95 backdrop-blur-3xl flex items-center justify-center p-6 text-primary-text font-sans selection:bg-sky-500/30">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.1)_0%,transparent_70%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/5 blur-[150px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-black/40 border border-white/5 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Header with Step Indicator */}
        <div className="px-10 pt-10 pb-6 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.1)]">
                <Settings2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-white italic">Comet Initializer</h2>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Protocol Sequence {step}/3</p>
                </div>
              </div>
            </div>
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="p-3 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all flex items-center gap-2 group"
              >
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Return</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-2 transition-all duration-500 ${step > i ? 'opacity-100' : 'opacity-20'}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${step > i ? 'bg-sky-500 text-black' : 'bg-white/10 text-white'}`}>
                    {step > i + 1 ? <Check size={12} /> : s.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white hidden sm:inline">{s.title}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-[2px] rounded-full mx-2 transition-all duration-700 ${step > i + 1 ? 'bg-sky-500' : 'bg-white/5'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Cognitive Integration</h3>
                  <p className="text-white/40 text-sm leading-relaxed font-medium">
                    Activate the Comet Neural Agent to enable autonomous research, workspace automation, and proactive assistance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <button
                    onClick={() => { setWantsAI(true); store.setEnableAIAssist(true); setStep(2); }}
                    className="group relative p-8 rounded-[2rem] border border-sky-400/20 bg-sky-500/[0.03] hover:bg-sky-500/[0.08] hover:border-sky-400/50 transition-all duration-500 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                      <Sparkles size={64} />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div className="w-14 h-14 rounded-2xl bg-sky-400/20 flex items-center justify-center text-sky-400 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                        <Cpu size={32} />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-lg uppercase tracking-tight italic">Evolve Workspace</h4>
                        <p className="text-[10px] text-sky-400/60 mt-1 uppercase tracking-[0.2em] font-black underline decoration-2 underline-offset-4">Full Neural Link</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => { setWantsAI(false); store.setEnableAIAssist(false); finishSetup(); }}
                    className="group relative p-8 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all duration-500 text-left overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Globe size={64} />
                    </div>
                    <div className="relative z-10 space-y-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-white/60 group-hover:bg-white/10 transition-all duration-500">
                        <Globe size={32} />
                      </div>
                      <div>
                        <h4 className="font-black text-white text-lg uppercase tracking-tight italic">Classic Only</h4>
                        <p className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.2em] font-black">Traditional Node</p>
                      </div>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && wantsAI && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">Engine Configuration</h3>
                  <p className="text-white/40 text-sm leading-relaxed font-medium">
                    Bridge your neural link via secure cloud endpoints or deploy a local Ollama node for maximum privacy.
                  </p>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-4 custom-scrollbar">
                  {/* Ollama Section */}
                  <div className="p-6 rounded-[2rem] bg-indigo-500/[0.03] border border-indigo-500/10 hover:border-indigo-500/30 transition-all group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 p-2 border border-white/10">
                          <img src="/ai-logos/ollama.png" className="w-full h-full object-contain filter invert opacity-60" alt="Ollama" />
                        </div>
                        <div>
                          <h4 className="font-black text-white uppercase italic tracking-tight">Local Ollama</h4>
                          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Zero-Trust Privacy</p>
                        </div>
                      </div>
                      <a href="https://ollama.com" target="_blank" rel="noreferrer" className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-[10px] font-black text-indigo-400 uppercase tracking-widest transition-all">
                        Deploy Node
                      </a>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="relative flex-1 group/input">
                         <Terminal size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-indigo-400 transition-colors" />
                         <input 
                            type="text" 
                            value={store.ollamaBaseUrl}
                            onChange={(e) => store.setOllamaBaseUrl(e.target.value)}
                            placeholder="http://127.0.0.1:11434"
                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-12 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                          />
                      </div>
                      <button 
                        onClick={() => { store.setAIProvider('ollama'); finishSetup(); }}
                        className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-black font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                      >
                        Mount
                      </button>
                    </div>
                  </div>

                  {/* Provider List */}
                  {[
                    { id: 'google', name: 'Gemini Pro', icon: '/ai-logos/gemini.svg', color: 'sky' },
                    { id: 'openai', name: 'GPT-4o', icon: '/ai-logos/chatgpt.png', color: 'emerald' },
                    { id: 'groq', name: 'Groq LPU', icon: '/ai-logos/Grok.png', color: 'amber' },
                  ].map(provider => (
                    <div key={provider.id} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <img src={provider.icon} className="w-8 h-8 object-contain opacity-40 group-hover:opacity-100 transition-opacity" alt={provider.name} />
                          <h4 className="font-black text-white uppercase italic tracking-tight">{provider.name}</h4>
                        </div>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Cloud Node</span>
                      </div>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                           <Key size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                           <input 
                              type="password" 
                              value={provider.id === 'google' ? store.geminiApiKey : provider.id === 'openai' ? store.openaiApiKey : store.groqApiKey}
                              onChange={(e) => {
                                if (provider.id === 'google') store.setGeminiApiKey(e.target.value);
                                if (provider.id === 'openai') store.setOpenaiApiKey(e.target.value);
                                if (provider.id === 'groq') store.setGroqApiKey(e.target.value);
                              }}
                              placeholder="Access Token..."
                              className="w-full bg-black/20 border border-white/5 rounded-2xl px-12 py-3 text-sm focus:outline-none focus:border-white/20 transition-all font-mono"
                            />
                        </div>
                        <button 
                          onClick={() => { store.setAIProvider(provider.id); finishSetup(); }}
                          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10 transition-all active:scale-95"
                        >
                          Link
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <Activity size={12} className="text-emerald-400" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Nodes Active</span>
                  </div>
                  <button onClick={() => finishSetup()} className="text-[10px] font-black text-white/20 hover:text-white uppercase tracking-[0.3em] transition-colors">
                    Skip Link Protocol
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="px-10 py-6 bg-white/[0.01] border-t border-white/5 flex items-center justify-between">
          <div className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">COMET SYSTEM v0.2.5</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-sky-500" />
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-purple-500" />
              <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Neural</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

