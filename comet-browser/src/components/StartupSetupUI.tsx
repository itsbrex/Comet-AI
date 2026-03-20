import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Cpu, Globe, Key, Settings2, ShieldCheck, ArrowRight, Check, Play, DownloadCloud, Sparkles } from 'lucide-react';

export const StartupSetupUI = ({ onComplete }: { onComplete: () => void }) => {
  const store = useAppStore();
  const [step, setStep] = useState(1);
  const [wantsAI, setWantsAI] = useState<boolean | null>(null);

  const finishSetup = () => {
    store.setHasCompletedStartupSetup(true);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020205]/90 backdrop-blur-3xl flex items-center justify-center p-6 text-primary-text font-sans">
      <div className="absolute inset-0 bg-nebula pointer-events-none opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-400/20 text-sky-400">
            <Settings2 size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Comet Initialization</h2>
            <p className="text-secondary-text text-sm font-medium tracking-widest uppercase">System Setup Wizard</p>
          </div>
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h3 className="text-xl font-bold text-white">Would you like to enable the Comet Neural Agent?</h3>
            <p className="text-secondary-text leading-relaxed">
              Comet's core superpower is its autonomous AI agent capable of browsing alongside you, assisting with research, and providing deep workspace integration.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { setWantsAI(true); store.setEnableAIAssist(true); setStep(2); }}
                className="p-6 rounded-2xl border border-sky-400/30 bg-sky-500/5 hover:bg-sky-500/20 text-left transition-all group relative overflow-hidden flex flex-col items-center justify-center gap-4 text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="p-4 bg-sky-400/20 rounded-full text-sky-400 group-hover:scale-110 transition-transform">
                  <Cpu size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Enable AI</h4>
                  <p className="text-xs text-sky-400/60 mt-1 uppercase tracking-widest font-black">Full Automation</p>
                </div>
              </button>
              
              <button
                onClick={() => { setWantsAI(false); store.setEnableAIAssist(false); finishSetup(); }}
                className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left transition-all group flex flex-col items-center justify-center gap-4 text-center"
              >
                <div className="p-4 bg-white/10 rounded-full text-white/40 group-hover:text-white group-hover:scale-110 transition-all">
                  <Globe size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">Skip AI</h4>
                  <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-black">Traditional Browser</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && wantsAI && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold text-white">Configure Your Engine</h3>
              <button onClick={() => setStep(1)} className="text-xs text-secondary-text hover:text-white uppercase tracking-widest font-bold">Back</button>
            </div>
            
            <p className="text-secondary-text text-sm mb-6">Connect your preferred API provider or use local models via Ollama. You can always change this later in settings.</p>

            <div className="space-y-4 max-h-[350px] overflow-y-auto modern-scrollbar pr-2">
              {/* Ollama Setup */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <img src="https://ollama.com/public/icon-64x64.png" className="w-8 h-8 rounded-lg grayscale invert opacity-80" alt="Ollama" />
                    <div>
                      <h4 className="font-bold text-white mb-1">Local Ollama (Free, Private)</h4>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-black leading-relaxed">
                        Local models (No advanced reasoning)
                      </p>
                       <p className="text-[10px] text-amber-500 mt-1 uppercase tracking-widest font-black leading-relaxed">
                        ⚠️ Choose Ollama Only if You have at Least enough hardware to run LLM
                      </p>
                      <button 
                        onClick={async () => {
                          try {
                            const res = await fetch(`${store.ollamaBaseUrl}/api/tags`);
                            if (res.ok) alert("Connection Successful! AI Node active.");
                            else alert("Ollama node unreachable. Ensure export OLLAMA_HOST=0.0.0.0 is set.");
                          } catch (e) {
                            alert("Connection Failed. Check if Ollama is running and OLLAMA_HOST=0.0.0.0 is set.");
                          }
                        }}
                        className="mt-1 text-[9px] text-sky-400/60 hover:text-sky-400 font-bold uppercase tracking-widest transition-all"
                      >
                         [ Verify Local Bridge ]
                      </button>
                    </div>
                  </div>
                  <a href="https://ollama.com/download" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold uppercase tracking-widest mt-1">
                    <DownloadCloud size={14} /> Download
                  </a>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={store.ollamaBaseUrl}
                    onChange={(e) => store.setOllamaBaseUrl(e.target.value)}
                    placeholder="http://127.0.0.1:11434"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-sky-400/50"
                  />
                  <button onClick={() => { store.setAIProvider('ollama'); finishSetup(); }} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2">
                    Use Ollama <ArrowRight size={14} />
                  </button>
                </div>
                <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                   <p className="text-[9px] text-purple-400/80 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={10} /> Pro Tip: Try GPT-OSS 120B
                   </p>
                   <p className="text-[8px] text-white/30 mt-1">Run <code className="text-purple-300/60">ollama run gpt-oss-cloud:120b</code> for enterprise-grade reasoning.</p>
                </div>
              </div>

              {/* Providers with links */}
              {[
                { id: 'google', name: 'Google Gemini API', subtitle: 'Cloud Model • Advanced Reasoning', val: store.geminiApiKey, set: store.setGeminiApiKey, link: 'https://aistudio.google.com/app/apikey', icon: '✨' },
                { id: 'openai', name: 'OpenAI API', subtitle: 'Cloud Model • Advanced Reasoning', val: store.openaiApiKey, set: store.setOpenaiApiKey, link: 'https://platform.openai.com/api-keys', icon: '🟢' },
                { id: 'groq', name: 'Groq API', subtitle: 'Cloud Model • Lightning Fast', val: store.groqApiKey, set: store.setGroqApiKey, link: 'https://console.groq.com/keys', icon: '⚡' },
              ].map(provider => (
                <div key={provider.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{provider.icon}</span>
                      <div>
                        <h4 className="font-bold text-white">{provider.name}</h4>
                        <p className="text-[10px] text-sky-400 mt-1 uppercase tracking-widest font-black">{provider.subtitle}</p>
                      </div>
                    </div>
                    <a href={provider.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold uppercase tracking-widest mt-1">
                      <Key size={14} /> Get Key
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      value={provider.val}
                      onChange={(e) => provider.set(e.target.value)}
                      placeholder={`Enter ${provider.name} Key...`}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-sky-400/50"
                    />
                    <button 
                      onClick={() => { store.setAIProvider(provider.id); finishSetup(); }} 
                      disabled={!provider.val}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 transition-all"
                    >
                      Connect <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
              <button onClick={() => finishSetup()} className="text-xs text-white/40 hover:text-white uppercase tracking-widest font-bold p-2">
                Skip for now
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
