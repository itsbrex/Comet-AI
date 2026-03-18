"use client";

import React from 'react';
import { motion } from 'framer-motion';

const ThinkingIndicator = () => {
  return (
    <div className="flex items-center gap-4 py-4 px-6 self-start group bg-sky-500/[0.03] border border-sky-500/10 rounded-[2rem] shadow-xl backdrop-blur-sm">
      <div className="relative flex items-center justify-center w-6 h-6">
        {/* Animated Scan Ring */}
        <motion.div
           className="absolute inset-0 rounded-full border-2 border-sky-400/20"
           animate={{ rotate: 360 }}
           transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Pulsing Core */}
        <motion.div
          className="w-2.5 h-2.5 bg-sky-400 rounded-full z-10 shadow-[0_0_15px_rgba(56,189,248,0.8)]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Expanding Wave Rings */}
        {[0.5, 1, 1.5].map((delay, index) => (
            <motion.div
                key={index}
                className="absolute inset-0 rounded-full border border-sky-400/40"
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 1.8 + index * 0.4, opacity: 0 }}
                transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: delay,
                }}
            />
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white transition-colors duration-300">
                Neural Sync
            </span>
            <div className="flex gap-1">
                {[0, 0.2, 0.4].map(d => (
                    <motion.div 
                        key={d}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d }}
                        className="w-1 h-1 rounded-full bg-sky-400"
                    />
                ))}
            </div>
        </div>
        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest whitespace-nowrap">Synthesizing semantic nodes...</p>
      </div>
    </div>
  );
};

export default ThinkingIndicator;
