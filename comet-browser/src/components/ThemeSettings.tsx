"use client";

import React from 'react';

interface ThemeSettingsProps {
  theme: 'dark' | 'light' | 'system' | 'vibrant';
  setTheme: (theme: 'dark' | 'light' | 'system' | 'vibrant') => void;
  backgroundImage: string;
  setBackgroundImage: (imageUrl: string) => void;
}

const THEMES: {
  id: 'dark' | 'light' | 'system' | 'vibrant';
  label: string;
  emoji: string;
  preview: string; // Tailwind-compatible inline style gradient
  accent: string;
  border: string;
  activeBg: string;
  desc: string;
}[] = [
  {
    id: 'dark',
    label: 'Dark',
    emoji: '🌑',
    preview: 'linear-gradient(135deg, #020205 0%, #0a0a10 100%)',
    accent: 'text-sky-400',
    border: 'border-sky-500/40',
    activeBg: 'bg-sky-500/10',
    desc: 'Deep space ink',
  },
  {
    id: 'light',
    label: 'Light',
    emoji: '☀️',
    preview: 'linear-gradient(135deg, #f5f7fb 0%, #ffffff 100%)',
    accent: 'text-blue-500',
    border: 'border-blue-400/40',
    activeBg: 'bg-blue-500/10',
    desc: 'Clean & crisp',
  },
  {
    id: 'vibrant',
    label: 'Vibrant',
    emoji: '🔮',
    preview: 'linear-gradient(135deg, #0D0520 0%, #1a0535 50%, #050a1a 100%)',
    accent: 'text-fuchsia-400',
    border: 'border-fuchsia-500/50',
    activeBg: 'bg-fuchsia-500/10',
    desc: 'Purple nebula',
  },
  {
    id: 'system',
    label: 'System',
    emoji: '🖥️',
    preview: 'linear-gradient(135deg, #1e293b 0%, #f1f5f9 100%)',
    accent: 'text-slate-400',
    border: 'border-slate-400/30',
    activeBg: 'bg-slate-500/10',
    desc: 'Follows OS',
  },
];

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ theme, setTheme, backgroundImage, setBackgroundImage }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <label className="block text-[10px] uppercase font-bold tracking-widest text-white/40">
          Appearance
        </label>

        {/* Theme cards grid */}
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative group flex flex-col gap-2 p-3 rounded-2xl border transition-all duration-200 text-left overflow-hidden
                  ${isActive
                    ? `${t.activeBg} ${t.border} shadow-lg`
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10'
                  }`}
              >
                {/* Mini preview tile */}
                <div
                  className="w-full h-8 rounded-lg shadow-inner"
                  style={{ background: t.preview }}
                >
                  {/* Fake UI dots on preview */}
                  <div className="flex gap-1 p-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    <div className="w-4 h-1.5 rounded bg-white/10" />
                  </div>
                </div>

                {/* Label row */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${isActive ? t.accent : 'text-white/50'}`}>
                      {t.emoji} {t.label}
                    </p>
                    <p className="text-[8px] text-white/25 font-medium mt-0.5">{t.desc}</p>
                  </div>
                  {isActive && (
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${t.activeBg} ${t.border} border`}>
                      <svg className={`w-2.5 h-2.5 ${t.accent}`} fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active theme badge */}
        <p className="text-[9px] text-white/20 italic text-center">
          Active: <span className="text-white/40 font-bold uppercase">{theme}</span>
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] uppercase font-bold tracking-widest text-white/40">
          Canvas Overlay
        </label>
        <input
          type="text"
          placeholder="Image URL..."
          className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/10 focus:border-deep-space-accent-neon/30 outline-none transition-all"
          value={backgroundImage}
          onChange={(e) => setBackgroundImage(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ThemeSettings;
