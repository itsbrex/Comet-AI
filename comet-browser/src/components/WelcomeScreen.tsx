"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import {
    Sparkles, Shield, Cpu, Zap, Globe, ChevronRight, Rocket,
    Terminal, Layers, ArrowRight, Activity, Brain, Lock,
    Search, FileText, Eye, Wifi, ScanLine, Command, Star,
    LogIn, User, Download, Github, ExternalLink, Play, X
} from 'lucide-react';
import { firebaseConfigStorage } from '@/lib/firebaseConfigStorage';
import { useAppVersion } from '@/lib/useAppVersion';

/* ─── Floating Particle ────────────────────────────────────────────── */
const Particle = ({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) => (
    <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
        animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1.4, 0],
            y: [0, -40, -80],
        }}
        transition={{ duration: 4 + Math.random() * 3, delay, repeat: Infinity, ease: 'easeOut' }}
    >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 blur-[1px]" />
    </motion.div>
);

/* ─── Animated Grid Line ────────────────────────────────────────────── */
const GridScan = () => (
    <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
    />
);

/* ─── Feature Chip ──────────────────────────────────────────────────── */
const Chip = ({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) => (
    <motion.div
        whileHover={{ scale: 1.06, y: -2 }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest cursor-default ${color}`}
    >
        <span className="opacity-80">{icon}</span>
        <span>{label}</span>
    </motion.div>
);

/* ─── Feature Card ──────────────────────────────────────────────────── */
interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    desc: string;
    accent: string;
    delay: number;
    badge?: string;
}
const FeatureCard = ({ icon, title, desc, accent, delay, badge }: FeatureCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ y: -4, scale: 1.02 }}
        className="relative group p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-500 overflow-hidden cursor-default"
    >
        {/* Hover glow */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${accent.replace('text-', 'bg-').replace('400', '500')}/5`} />
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />

        <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-black/30 border border-white/[0.06] ${accent} group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                {badge && (
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        {badge}
                    </span>
                )}
            </div>
            <h3 className={`text-[11px] font-black uppercase tracking-[0.18em] mb-1.5 ${accent}`}>{title}</h3>
            <p className="text-[10px] text-white/40 leading-relaxed font-medium">{desc}</p>
        </div>

        {/* Corner decor */}
        <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-white/[0.03] to-transparent" />
    </motion.div>
);

/* ─── Stat Block ────────────────────────────────────────────────────── */
const Stat = ({ val, label, color }: { val: string; label: string; color: string }) => (
    <div className="flex flex-col items-center gap-1">
        <span className={`text-2xl font-black tracking-tighter ${color}`}>{val}</span>
        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/25">{label}</span>
    </div>
);

/* ─── MAIN COMPONENT ────────────────────────────────────────────────── */
export default function WelcomeScreen() {
    const { setHasSeenWelcomePage, setGuestMode } = useAppStore();
    const [mouseX, setMouseX] = useState(0);
    const [mouseY, setMouseY] = useState(0);
    const [activeFeature, setActiveFeature] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const versionLabel = `v${useAppVersion()}`;

    const motionX = useMotionValue(0);
    const motionY = useMotionValue(0);
    const springX = useSpring(motionX, { stiffness: 80, damping: 30 });
    const springY = useSpring(motionY, { stiffness: 80, damping: 30 });
    const rotateX = useTransform(springY, [-300, 300], [6, -6]);
    const rotateY = useTransform(springX, [-400, 400], [-8, 8]);

    useEffect(() => {
        const handleMouse = (e: MouseEvent) => {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            motionX.set(e.clientX - cx);
            motionY.set(e.clientY - cy);
            setMouseX((e.clientX / window.innerWidth) * 100);
            setMouseY((e.clientY / window.innerHeight) * 100);
        };
        window.addEventListener('mousemove', handleMouse);
        return () => window.removeEventListener('mousemove', handleMouse);
    }, []);

    // Feature cycling for hero text
    const featureLines = [
        'Autonomous AI Agent',
        'Neural RAG Memory',
        'Hardware Isolation',
        'Real-Time Web Search',
        'PDF Generation',
    ];
    useEffect(() => {
        const t = setInterval(() => setActiveFeature(p => (p + 1) % featureLines.length), 2200);
        return () => clearInterval(t);
    }, []);

    const getFirebaseConfigFromEnv = () => ({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    });

    const handleGoogleSignIn = async () => {
        if (window.electronAPI) {
            const config = firebaseConfigStorage.load() || getFirebaseConfigFromEnv();
            const authUrl = `https://browser.ponsrischool.in/auth?client_id=desktop-app&redirect_uri=comet-browser%3A%2F%2Fauth&firebase_config=${btoa(JSON.stringify(config))}`;
            window.electronAPI.openAuthWindow(authUrl);
            setHasSeenWelcomePage(true);
        } else {
            const url = `https://browser.ponsrischool.in/auth?client_id=web-app&redirect_uri=${encodeURIComponent(window.location.origin + '/auth')}`;
            window.open(url, '_blank');
            setHasSeenWelcomePage(true);
        }
    };

    const handleCloseAuthPopup = () => {
        if (window.electronAPI?.closeAuthWindow) {
            window.electronAPI.closeAuthWindow();
        }
    };

    const handleGuestMode = () => {
        setGuestMode(true);
        setHasSeenWelcomePage(true);
    };

    const handleContinue = () => setHasSeenWelcomePage(true);

    // Particles
    const particles = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 6,
    }));

    const features = [
        { icon: <Brain size={16} />, title: 'Neural Agent', desc: 'Autonomous multi-step task execution — navigates, searches, clicks, fills forms & more without you lifting a finger.', accent: 'text-cyan-400', delay: 0.5, badge: 'LIVE' },
        { icon: <Layers size={16} />, title: 'RAG Memory', desc: 'Vector-indexed session memory. The browser recalls your context semantically — like a co-pilot that never forgets.', accent: 'text-violet-400', delay: 0.6 },
        { icon: <Shield size={16} />, title: 'Triple-Lock Security', desc: 'Visual Sandbox + Syntactic Firewall + Human-in-the-Loop. Every OS action requires your explicit approval.', accent: 'text-emerald-400', delay: 0.7 },
        { icon: <Search size={16} />, title: 'Live Web Search', desc: 'Pre-flight real-time search before every AI answer. Zero hallucination — only verified data feeds the LLM.', accent: 'text-amber-400', delay: 0.8 },
        { icon: <FileText size={16} />, title: 'PDF Generation', desc: 'One-shot branded reports with embedded screenshots, tables, charts — streamed live as they generate.', accent: 'text-pink-400', delay: 0.9 },
        { icon: <Wifi size={16} />, title: 'WiFi Sync', desc: 'P2P cross-device sync with AES-256 encryption. Control your desktop from Comet Mobile via QR pairing.', accent: 'text-sky-400', delay: 1.0 },
        { icon: <Cpu size={16} />, title: 'Multi-LLM Engine', desc: 'Switch between Gemini, GPT-4, Claude, Groq, and local Ollama models — including GPT-OSS 120B.', accent: 'text-orange-400', delay: 1.1, badge: 'NEW' },
        { icon: <ScanLine size={16} />, title: 'DOM + OCR Vision', desc: 'Secure DOM reading with PII scrubbing, injection detection, and Tesseract OCR for full visual awareness.', accent: 'text-teal-400', delay: 1.2 },
    ];

    const featureDescriptions = [
        { title: 'Autonomous AI Orchestration', body: 'Chained commands, reasoning transparency, and deliberate automation let the AI plan, pause for approvals, and execute safely across browsing, shell, and system actions.' },
        { title: 'Triple-Lock Security', body: 'Visual sandboxing, PII scrubbing, and human-in-the-loop approvals ensure nothing executes without your consent, even for high-risk automation.' },
        { title: 'Local + Cloud LLM Access', body: 'Switch between Ollama, Gemini, Claude, Groq, and OpenAI models with a single click while the browser remembers your preferred provider per task.' },
        { title: 'Productivity + Reports', body: 'Branded PDF exports, action logs, clipboard sync, and AI scheduling put research, automation, and sharing in one workspace.' },
    ];

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[200] overflow-hidden bg-[#020208] pt-10"
            style={{ fontFamily: "'Syne', 'DM Sans', system-ui, sans-serif" }}
        >
            {/* ── Layered Background ── */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Deep space gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18)_0%,transparent_65%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_100%_100%,rgba(6,182,212,0.1)_0%,transparent_55%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_0%_80%,rgba(139,92,246,0.1)_0%,transparent_60%)]" />

                {/* Dynamic cursor light */}
                <motion.div
                    className="absolute w-[700px] h-[700px] rounded-full blur-[120px] pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)',
                        left: `${mouseX}%`,
                        top: `${mouseY}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    transition={{ type: 'spring', damping: 40, stiffness: 60 }}
                />

                {/* Grid texture */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '72px 72px',
                    }}
                />

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(2,2,8,0.7)_100%)]" />

                {/* Grid scan line */}
                <div className="absolute inset-0 overflow-hidden">
                    <GridScan />
                </div>

                {/* Particles */}
                {particles.map(p => <Particle key={p.id} x={p.x} y={p.y} size={p.size} delay={p.delay} />)}
            </div>

            {/* ── Main Layout ── */}
            <div className="relative z-10 h-full flex flex-col">

                {/* ── TOP STATUS BAR ── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="flex items-center justify-between px-8 py-4 border-b border-white/[0.04]"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            <motion.div
                                className="absolute inset-0 rounded-full bg-emerald-400"
                                animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/30">Neural Core Online</span>
                    </div>

                    <div className="flex items-center gap-6">
                        {[
                            { label: versionLabel, icon: <Star size={10} /> },
                            { label: 'India', icon: <Globe size={10} /> },
                            { label: 'MIT License', icon: <Lock size={10} /> },
                        ].map(item => (
                            <div key={item.label} className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/20">
                                {item.icon}
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ── HERO + FEATURES SCROLLABLE BODY ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-7xl mx-auto px-8 py-10">

                        {/* ── HERO SECTION ── */}
                        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">

                            {/* Left: Branding & CTAs */}
                            <div className="space-y-8">
                                {/* Logo + Name */}
                                <motion.div
                                    initial={{ opacity: 0, x: -40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex items-center gap-5"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.08, rotate: 8 }}
                                        transition={{ type: 'spring', stiffness: 300 }}
                                        className="relative"
                                    >
                                        <div className="w-20 h-20 rounded-[1.6rem] bg-gradient-to-br from-cyan-400/20 via-violet-500/20 to-fuchsia-500/20 p-[1.5px] shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                                            <div className="w-full h-full bg-[#070713] rounded-[1.5rem] flex items-center justify-center">
                                                <img src="icon.png" alt="Comet" className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
                                            </div>
                                        </div>
                                        <div className="absolute -inset-2 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 rounded-[2rem] blur-xl -z-10" />
                                    </motion.div>

                                    <div>
                                        <motion.h1
                                            className="text-5xl font-black text-white tracking-[-0.04em] leading-none"
                                            style={{ fontFamily: "'Syne', sans-serif" }}
                                        >
                                            COMET
                                        </motion.h1>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20">
                                                <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em]">AI Browser</span>
                                            </div>
                                            <span className="text-[9px] font-black text-white/15 uppercase tracking-widest">NEURAL WORKSPACE</span>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Hero headline */}
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                                    className="space-y-2"
                                >
                                    <h2
                                        className="text-6xl md:text-7xl font-black text-white leading-[0.92] tracking-[-0.05em]"
                                        style={{ fontFamily: "'Syne', sans-serif" }}
                                    >
                                        The Web.<br />
                                        <span className="relative inline-block">
                                            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                                                Redefined.
                                            </span>
                                            <motion.div
                                                className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-cyan-400/60 to-violet-400/60"
                                                initial={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                                transition={{ delay: 0.8, duration: 0.8 }}
                                            />
                                        </span>
                                    </h2>

                                    {/* Cycling feature line */}
                                    <div className="h-7 overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeFeature}
                                                initial={{ y: 28, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: -28, opacity: 0 }}
                                                transition={{ duration: 0.45, ease: 'easeInOut' }}
                                                className="flex items-center gap-2"
                                            >
                                                <Zap size={14} className="text-cyan-400" />
                                                <span className="text-sm font-black text-white/50 uppercase tracking-widest">
                                                    {featureLines[activeFeature]}
                                                </span>
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    <p className="text-sm text-white/35 leading-relaxed max-w-lg font-medium">
                                        A Chromium-based browser built by a 16-year-old student from India. Hardware-isolated, AI-infinite, and optimized for 4GB RAM machines.
                                    </p>
                                </motion.div>

                                {/* Feature chips */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.45 }}
                                    className="flex flex-wrap gap-2"
                                >
                                    <Chip icon={<Brain size={10} />} label="Autonomous Agent" color="border-cyan-500/20 text-cyan-400 bg-cyan-500/5" />
                                    <Chip icon={<Shield size={10} />} label="Triple-Lock Security" color="border-emerald-500/20 text-emerald-400 bg-emerald-500/5" />
                                    <Chip icon={<Cpu size={10} />} label="Local LLM" color="border-violet-500/20 text-violet-400 bg-violet-500/5" />
                                    <Chip icon={<Activity size={10} />} label="Ad Blocker" color="border-orange-500/20 text-orange-400 bg-orange-500/5" />
                                    <Chip icon={<Globe size={10} />} label="Open Source" color="border-sky-500/20 text-sky-400 bg-sky-500/5" />
                                </motion.div>

                                {/* CTA buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.55, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex flex-col gap-3 max-w-sm"
                                >
                                    {/* Primary CTA */}
                                    <motion.button
                                        onClick={handleGoogleSignIn}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="group relative w-full py-4 px-8 rounded-2xl overflow-hidden bg-white text-black font-black text-[11px] uppercase tracking-[0.35em] shadow-[0_20px_60px_rgba(255,255,255,0.12)] transition-all"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-200 via-white to-white translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
                                        <span className="relative flex items-center justify-center gap-3">
                                            <LogIn size={16} />
                                            Sign in with Google
                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                </motion.button>

                                {/* Secondary CTAs */}
                                <div className="grid grid-cols-2 gap-2">
                                    <motion.button
                                            onClick={handleContinue}
                                            whileHover={{ scale: 1.03, backgroundColor: 'rgba(99,102,241,0.12)' }}
                                            whileTap={{ scale: 0.97 }}
                                            className="py-3.5 px-6 bg-violet-500/8 border border-violet-500/20 text-violet-300 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2"
                                        >
                                            <Rocket size={12} />
                                            Initialize
                                        </motion.button>
                                    <motion.button
                                        onClick={handleGuestMode}
                                        whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.06)' }}
                                            whileTap={{ scale: 0.97 }}
                                            className="py-3.5 px-6 bg-white/[0.03] border border-white/10 text-white/50 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2"
                                        >
                                            <User size={12} />
                                        Guest Mode
                                    </motion.button>
                                    <motion.button
                                        onClick={handleCloseAuthPopup}
                                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                                        whileTap={{ scale: 0.97 }}
                                        className="col-span-2 py-3.5 px-6 bg-white/[0.06] border border-white/10 text-white/60 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2"
                                    >
                                        <X size={12} />
                                        Close Sign-in Popup
                                    </motion.button>
                                </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.75, duration: 0.9 }}
                                    className="mt-8 space-y-4"
                                >
                                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/40">Comet Feature Overview</h3>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {featureDescriptions.map(item => (
                                            <div key={item.title} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-[11px] text-white/70">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">{item.title}</p>
                                                <p className="leading-relaxed">{item.body}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Stats */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    className="flex items-center gap-8 pt-4 border-t border-white/[0.05]"
                                >
                                    <Stat val="4GB+" label="Min Specs" color="text-cyan-400" />
                                    <div className="w-px h-8 bg-white/[0.06]" />
                                    <Stat val="120B" label="GPT-OSS Model" color="text-violet-400" />
                                    <div className="w-px h-8 bg-white/[0.06]" />
                                    <Stat val="AES-256" label="Encryption" color="text-emerald-400" />
                                    <div className="w-px h-8 bg-white/[0.06]" />
                                    <Stat val="4.5+" label="AI Providers" color="text-amber-400" />
                                </motion.div>
                            </div>

                            {/* Right: 3D Terminal Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 50, filter: 'blur(20px)' }}
                                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                transition={{ delay: 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: '1200px' }}
                                className="hidden lg:block"
                            >
                                <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_40px_120px_rgba(0,0,0,0.8)] bg-[#070713]/90 backdrop-blur-2xl">
                                    {/* Terminal header */}
                                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05] bg-white/[0.02]">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                                                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                                                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                                            </div>
                                            <div className="ml-3 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/25">
                                                <Terminal size={10} />
                                                <span>Comet Neural Terminal</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Active</span>
                                        </div>
                                    </div>

                                    {/* Terminal content */}
                                    <div className="p-6 font-mono space-y-3 min-h-[340px]">
                                        {[
                                            { prompt: '>', text: 'Initializing Comet Neural Core...', color: 'text-cyan-400', delay: 0.5 },
                                            { prompt: '✓', text: 'RAG Vector Memory — 2,000 chunks loaded', color: 'text-emerald-400', delay: 0.9 },
                                            { prompt: '✓', text: 'AI Provider: Gemini 3.1 Pro (cloud)', color: 'text-violet-400', delay: 1.3 },
                                            { prompt: '✓', text: 'Triple-Lock Security Active', color: 'text-amber-400', delay: 1.7 },
                                            { prompt: '>', text: 'Launching autonomous browser agent...', color: 'text-cyan-400', delay: 2.1 },
                                            { prompt: '✓', text: 'Tab Manager: 50 max tabs, memory-safe', color: 'text-emerald-400', delay: 2.5 },
                                            { prompt: '>', text: 'WiFi Sync beacon broadcasting...', color: 'text-sky-400', delay: 2.9 },
                                        ].map((line, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: line.delay, duration: 0.5 }}
                                                className="flex items-start gap-3 text-[11px]"
                                            >
                                                <span className={`${line.color} font-black mt-0.5`}>{line.prompt}</span>
                                                <span className="text-white/55 leading-relaxed">{line.text}</span>
                                            </motion.div>
                                        ))}

                                        {/* Blinking cursor */}
                                        <motion.div
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.8, repeat: Infinity }}
                                            className="flex items-center gap-3"
                                        >
                                            <span className="text-cyan-400 font-black text-[11px]">›</span>
                                            <div className="w-2 h-4 bg-cyan-400/70 rounded-[1px]" />
                                        </motion.div>
                                    </div>

                                    {/* Bottom status strip */}
                                    <div className="px-6 py-3 border-t border-white/[0.04] bg-black/20 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {[
                                                { label: 'CPU', val: '12%', color: 'text-emerald-400' },
                                                { label: 'RAM', val: '462MB', color: 'text-cyan-400' },
                                                { label: 'PING', val: '3ms', color: 'text-violet-400' },
                                            ].map(s => (
                                                <div key={s.label} className="flex items-center gap-1.5">
                                                    <span className="text-[8px] font-black uppercase text-white/25">{s.label}</span>
                                                    <span className={`text-[10px] font-black ${s.color}`}>{s.val}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-[8px] font-black uppercase tracking-widest text-white/15">
                                            INDIA · {versionLabel}
                                        </div>
                                    </div>

                                    {/* Glow reflection */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-violet-500/[0.03] pointer-events-none" />
                                </div>

                                {/* Floating badge */}
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                                    className="absolute -bottom-6 -right-6 px-4 py-3 rounded-2xl bg-[#070713] border border-white/10 shadow-2xl"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/50">All Systems Nominal</span>
                                    </div>
                                    <div className="text-[8px] font-medium text-white/20 mt-0.5">Built by a 16yo. 🇮🇳</div>
                                </motion.div>

                                {/* Second badge */}
                                <motion.div
                                    animate={{ y: [0, 6, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                                    className="absolute -top-4 -left-6 px-3.5 py-2.5 rounded-xl bg-[#070713] border border-violet-500/20 shadow-2xl"
                                >
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={12} className="text-violet-400" />
                                        <span className="text-[9px] font-black text-violet-300 uppercase tracking-widest">GPT-OSS 120B</span>
                                    </div>
                                    <div className="text-[8px] text-white/20 mt-0.5">Local model ready</div>
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* ── SECTION DIVIDER ── */}
                        <motion.div
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ delay: 1, duration: 1 }}
                            className="relative mb-12"
                        >
                            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            <div className="absolute left-1/2 -translate-x-1/2 -top-3 px-5 py-1.5 rounded-full bg-[#020208] border border-white/[0.06]">
                                <span className="text-[9px] font-black uppercase tracking-[0.35em] text-white/25">Feature Matrix</span>
                            </div>
                        </motion.div>

                        {/* ── FEATURES GRID ── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
                            {features.map((f, i) => (
                                <FeatureCard key={i} {...f} />
                            ))}
                        </div>

                        {/* ── PROVIDERS SECTION ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 0.8 }}
                            className="mb-14"
                        >
                            <div className="text-center mb-8">
                                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/25 mb-2">AI Provider Ecosystem</p>
                                <h3 className="text-2xl font-black text-white tracking-tight">Plug in any intelligence.</h3>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {[
                                    { name: 'Google Gemini', sub: 'Cloud · Free Tier', icon: '/ai-logos/gemini.svg', color: 'border-cyan-500/20 hover:border-cyan-500/40' },
                                    { name: 'GPT-4o', sub: 'OpenAI Cloud', icon: '/ai-logos/chatgpt.png', color: 'border-emerald-500/20 hover:border-emerald-500/40' },
                                    { name: 'Claude 3.5', sub: 'Anthropic Cloud', icon: '/ai-logos/claude.webp', color: 'border-amber-500/20 hover:border-amber-500/40' },
                                    { name: 'Groq LPU', sub: 'Fastest Inference', icon: '/ai-logos/Grok.png', color: 'border-violet-500/20 hover:border-violet-500/40' },
                                    { name: 'Ollama Local', sub: 'Full Privacy', icon: '/ai-logos/ollama.png', color: 'border-pink-500/20 hover:border-pink-500/40' },
                                ].map((p, i) => (
                                    <motion.div
                                        key={p.name}
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 1.3 + i * 0.08 }}
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border ${p.color} transition-all cursor-default`}
                                    >
                                        <div className="w-7 h-7 rounded-lg bg-black/40 flex items-center justify-center border border-white/[0.05] overflow-hidden">
                                            <img src={p.icon} className="w-5 h-5 object-contain" alt={p.name} />
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black text-white leading-none">{p.name}</div>
                                            <div className="text-[9px] text-white/30 mt-0.5 uppercase tracking-wide">{p.sub}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* ── SECURITY SECTION ── */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4, duration: 0.8 }}
                            className="mb-12 p-8 rounded-3xl bg-gradient-to-br from-emerald-500/[0.04] to-transparent border border-emerald-500/[0.08] relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/[0.04] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4" />
                            <div className="relative grid md:grid-cols-3 gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Eye size={18} className="text-emerald-400" />
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Visual Sandbox</span>
                                    </div>
                                    <p className="text-[11px] text-white/40 leading-relaxed">
                                        Agent perceives pages via screenshots + OCR only. Never executes raw HTML or JS. Zero DOM injection attack surface.
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Command size={18} className="text-cyan-400" />
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Syntactic Firewall</span>
                                    </div>
                                    <p className="text-[11px] text-white/40 leading-relaxed">
                                        Blocks shell primitives, jailbreak patterns, encoded payloads, and PII before any content reaches the LLM.
                                    </p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield size={18} className="text-violet-400" />
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Human-in-the-Loop</span>
                                    </div>
                                    <p className="text-[11px] text-white/40 leading-relaxed">
                                        Every OS action requires explicit user approval. High-risk actions use QR-based cross-device authorization with a 6-digit PIN.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>

                {/* ── BOTTOM ACTION BAR ── */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="border-t border-white/[0.04] bg-[#020208]/80 backdrop-blur-xl px-8 py-4"
                >
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
                                <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-violet-400 rounded-full" />
                                <span>Comet AI Browser</span>
                            </div>
                            <span className="text-[8px] text-white/10 font-black uppercase tracking-widest">Built in India 🇮🇳 · MIT License</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <motion.a
                                href="https://github.com/Preet3627/Comet-AI"
                                target="_blank"
                                rel="noreferrer"
                                whileHover={{ scale: 1.05 }}
                                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white hover:border-white/15 transition-all"
                            >
                                <Github size={14} />
                            </motion.a>
                            <motion.a
                                href="https://browser.ponsrischool.in"
                                target="_blank"
                                rel="noreferrer"
                                whileHover={{ scale: 1.05 }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white hover:border-white/15 transition-all text-[9px] font-black uppercase tracking-widest"
                            >
                                <ExternalLink size={11} />
                                Official Site
                            </motion.a>
                            <motion.button
                                onClick={handleGuestMode}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-violet-500/15 border border-cyan-500/20 text-cyan-300 text-[9px] font-black uppercase tracking-[0.25em] transition-all hover:border-cyan-400/40"
                            >
                                <Play size={11} />
                                Quick Start
                                <ChevronRight size={11} />
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* ── Corner metadata ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="absolute bottom-16 left-8 text-[8px] font-black uppercase tracking-[0.8em] text-white/[0.07] select-none pointer-events-none"
            >
                EST. 2026
            </motion.div>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700;900&display=swap');
      `}</style>
        </div>
    );
}
