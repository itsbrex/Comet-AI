import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Check,
  ChevronLeft,
  Cloud,
  ExternalLink,
  Monitor,
  MoonStar,
  Palette,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Wifi,
} from 'lucide-react';

import { useAppVersion } from '@/lib/useAppVersion';
import { useAppStore } from '@/store/useAppStore';

type ThemeChoice = 'system' | 'light' | 'dark' | 'vibrant';

const themeOptions: Array<{
  id: ThemeChoice;
  title: string;
  description: string;
  preview: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'system',
    title: 'System',
    description: 'Follow the look of your operating system automatically.',
    preview: 'linear-gradient(135deg, #111827 0%, #f8fafc 100%)',
    icon: <Monitor size={16} />,
  },
  {
    id: 'light',
    title: 'Light',
    description: 'A bright, polished workspace for daytime research and docs.',
    preview: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
    icon: <SunMedium size={16} />,
  },
  {
    id: 'dark',
    title: 'Dark',
    description: 'Minimal contrast-first theme for long sessions and focus.',
    preview: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
    icon: <MoonStar size={16} />,
  },
  {
    id: 'vibrant',
    title: 'Vibrant',
    description: 'A richer gradient look that still keeps the UI disciplined.',
    preview: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
    icon: <Sparkles size={16} />,
  },
];

const providerCards = [
  {
    id: 'ollama',
    title: 'Local Ollama',
    description: 'Keep prompts and responses on your machine with local models.',
    cta: 'Use Ollama',
    accent: 'from-sky-400/20 to-sky-400/5',
    link: 'https://ollama.com/download',
  },
  {
    id: 'google',
    title: 'Gemini API',
    description: 'Quick cloud setup if you want Comet AI chat working right away.',
    cta: 'Use Gemini',
    accent: 'from-emerald-400/18 to-emerald-400/5',
    link: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'openai',
    title: 'OpenAI API',
    description: 'Connect GPT models for strong general chat and coding help.',
    cta: 'Use OpenAI',
    accent: 'from-violet-400/18 to-violet-400/5',
    link: 'https://platform.openai.com/api-keys',
  },
];

const copilotProviderCard = {
  id: 'copilot',
  title: 'Microsoft Copilot',
  description: 'Windows companion path with no Comet API key required.',
  cta: 'Use Copilot',
  accent: 'from-sky-300/18 to-cyan-300/5',
  link: 'https://www.microsoft.com/en-us/microsoft-copilot/for-individuals/copilot-app',
};

const openExternal = async (url: string) => {
  if (window.electronAPI?.openExternalUrl) {
    await window.electronAPI.openExternalUrl(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

export const StartupSetupUI = ({ onComplete }: { onComplete: () => void }) => {
  const store = useAppStore();
  const versionLabel = `v${useAppVersion()}`;
  const [step, setStep] = useState(1);
  const [wantsAI, setWantsAI] = useState(true);
  const isWindows = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /win/i.test(navigator.userAgent) || navigator.platform.toLowerCase().includes('win');
  }, []);

  const finishSetup = () => {
    store.setHasCompletedStartupSetup(true);
    onComplete();
  };

  const goNext = () => setStep((current) => Math.min(current + 1, 4));
  const goBack = () => setStep((current) => Math.max(current - 1, 1));
  const availableProviderCards = isWindows ? [...providerCards, copilotProviderCard] : providerCards;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#061019]/94 p-6 text-white backdrop-blur-3xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_38%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.08),transparent_24%)]" />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-10 w-full max-w-4xl overflow-hidden rounded-[36px] border border-white/10 bg-[#0a1720]/92 shadow-[0_40px_140px_rgba(0,0,0,0.35)]"
      >
        <div className="border-b border-white/10 bg-white/[0.03] px-8 py-7">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-sky-100/85">
                <Palette size={14} />
                Setup guide
              </div>
              <h2 className="text-3xl font-semibold tracking-[-0.03em]">Make Comet feel ready before the first tab opens.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/55">
                Choose how much AI you want, pick a theme, review Windows Copilot and provider options, then finish with sync and security basics.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">Build</p>
              <p className="mt-1 text-sm font-semibold text-white/80">{versionLabel}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {['Workspace', 'Theme', 'AI Access', 'Sync'].map((label, index) => {
              const stepNumber = index + 1;
              const active = step === stepNumber;
              const done = step > stepNumber;

              return (
                <div
                  key={label}
                  className={`rounded-2xl border px-4 py-3 transition ${active ? 'border-sky-300/30 bg-sky-300/10' : 'border-white/10 bg-white/[0.03]'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">{label}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${done || active ? 'bg-white text-slate-900' : 'bg-white/8 text-white/55'}`}>
                      {done ? <Check size={14} /> : stepNumber}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-8 py-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                className="space-y-6"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWantsAI(true);
                      store.setEnableAIAssist(true);
                    }}
                    className={`rounded-[28px] border p-6 text-left transition ${wantsAI ? 'border-sky-300/35 bg-sky-300/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'}`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-sky-200">
                      <Bot size={22} />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Use Comet AI</h3>
                    <p className="mt-2 text-sm leading-7 text-white/58">
                      Turn on the in-browser assistant so setup can point you to Ollama or provider keys next.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWantsAI(false);
                      store.setEnableAIAssist(false);
                    }}
                    className={`rounded-[28px] border p-6 text-left transition ${!wantsAI ? 'border-white/20 bg-white/[0.08]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'}`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white/75">
                      <ShieldCheck size={22} />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold tracking-[-0.02em]">Start simple</h3>
                    <p className="mt-2 text-sm leading-7 text-white/58">
                      Skip built-in AI for now and keep Comet as a focused browser while you finish the rest of onboarding.
                    </p>
                  </button>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">What changes</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {[
                      'The theme selector now lives in setup instead of only settings.',
                      'Windows users get an official Copilot companion path with no Comet API key needed.',
                      'You can still finish setup even if you want to connect AI later.',
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-white/62">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="theme"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                className="space-y-6"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">Pick your theme</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Choose the look you want before you land in the app.</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {themeOptions.map((option) => {
                    const active = store.theme === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => store.setTheme(option.id)}
                        className={`rounded-[26px] border p-5 text-left transition ${active ? 'border-sky-300/35 bg-sky-300/10 shadow-[0_20px_60px_rgba(56,189,248,0.15)]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'}`}
                      >
                        <div
                          className="h-24 rounded-2xl border border-white/10"
                          style={{ background: option.preview }}
                        />
                        <div className="mt-4 flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-semibold text-white">
                            {option.icon}
                            {option.title}
                          </span>
                          {active && <Check size={16} className="text-sky-200" />}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/56">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="ai-access"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                className="space-y-6"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">AI access</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Choose how you want to power the assistant.</h3>
                  </div>
                  <div className="rounded-2xl border border-amber-300/18 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50/82">
                    Comet still needs Ollama or provider keys for its built-in chat. Windows Copilot below is a companion path today.
                  </div>
                </div>

                {wantsAI ? (
                  <div className="grid gap-4 lg:grid-cols-3">
                    {availableProviderCards.map((provider) => (
                      <div key={provider.id} className={`rounded-[28px] border border-white/10 bg-gradient-to-br ${provider.accent} p-5`}>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/10 text-white">
                          {provider.id === 'ollama' || provider.id === 'copilot' ? <Monitor size={20} /> : <Cloud size={20} />}
                        </div>
                        <h4 className="mt-5 text-lg font-semibold">{provider.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-white/62">{provider.description}</p>
                        <div className="mt-5 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              store.setAIProvider(provider.id);
                              if (provider.id === 'ollama' && !store.ollamaBaseUrl) {
                                store.setOllamaBaseUrl('http://127.0.0.1:11434');
                              }
                            }}
                            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                          >
                            {provider.cta}
                          </button>
                          <button
                            type="button"
                            onClick={() => openExternal(provider.link)}
                            className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/8 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/12"
                          >
                            Open link
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-sm leading-7 text-white/62">
                    Built-in AI is off for now. You can still finish setup and configure Ollama, cloud providers, or the Windows Copilot companion later from settings.
                  </div>
                )}

                {isWindows && (
                  <div className="rounded-[30px] border border-sky-300/20 bg-sky-300/10 p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-50/70">Windows companion</p>
                        <h4 className="mt-2 text-xl font-semibold tracking-[-0.02em]">Use Microsoft Copilot on Windows without adding a Comet API key.</h4>
                        <p className="mt-2 text-sm leading-7 text-sky-50/80">
                          Microsoft says the Copilot app is already installed on many Windows 11 PCs, and if not, it can be installed free from the Microsoft Store. We also link the official Copilot Runtime developer docs for Windows AI work.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => openExternal('https://www.microsoft.com/en-us/microsoft-copilot/for-individuals/copilot-app')}
                          className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                        >
                          Open Copilot
                        </button>
                        <button
                          type="button"
                          onClick={() => openExternal('https://blogs.windows.com/windowsdeveloper/2024/05/21/unlock-a-new-era-of-innovation-with-windows-copilot-runtime-and-copilot-pcs/')}
                          className="rounded-2xl border border-white/14 bg-white/8 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/14"
                        >
                          Copilot Runtime docs
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="sync"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                className="space-y-6"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/42">Final checks</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">You are ready to open Comet.</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    {
                      icon: <Wifi size={18} />,
                      title: 'WiFi sync',
                      body: 'Pair with mobile later for clipboard sync, remote control, and automation follow-up.',
                    },
                    {
                      icon: <ShieldCheck size={18} />,
                      title: 'Permission manager',
                      body: 'Low, medium, and high-risk actions now route through a single approval flow.',
                    },
                    {
                      icon: <Palette size={18} />,
                      title: 'Theme saved',
                      body: `Current theme: ${store.theme}. You can change it anytime in Appearance settings.`,
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-sky-200">
                        {item.icon}
                      </div>
                      <h4 className="mt-4 text-lg font-semibold">{item.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-white/58">{item.body}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={finishSetup}
                  className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Finish setup
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-8 py-5">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition ${step === 1 ? 'cursor-default text-white/20' : 'text-white/65 hover:bg-white/6 hover:text-white'}`}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className={`h-2 rounded-full transition-all ${step === item ? 'w-10 bg-white' : 'w-2 bg-white/18'}`}
              />
            ))}
          </div>

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="w-[88px]" />
          )}
        </div>
      </motion.div>
    </div>
  );
};
