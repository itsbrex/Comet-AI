"use client";

import React from 'react';
import { motion } from 'framer-motion';

const ThinkingIndicator = () => {
  return (
    <div className="relative flex items-center gap-4 py-4 px-6 self-start group rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.82),rgba(8,47,73,0.54),rgba(88,28,135,0.38))] shadow-[0_22px_60px_rgba(14,165,233,0.18)] backdrop-blur-2xl overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_48%)]"
        animate={{ opacity: [0.65, 1, 0.72] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex items-center justify-center w-8 h-8">
        <motion.div
          className="absolute inset-0 rounded-full border border-sky-300/25"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-1 rounded-full border border-fuchsia-300/20"
          animate={{ rotate: -360, scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="w-3 h-3 bg-sky-300 rounded-full z-10 shadow-[0_0_20px_rgba(56,189,248,0.95)]"
          animate={{
            scale: [1, 1.35, 0.95, 1],
            opacity: [0.7, 1, 0.82, 0.7],
          }}
          transition={{
            duration: 1.35,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="absolute inset-0 rounded-full border border-sky-300/35"
            initial={{ scale: 0.85, opacity: 0.55 }}
            animate={{ scale: 1.9 + index * 0.25, opacity: 0 }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeOut",
              delay: index * 0.35,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.32em] text-white">
            Neural Flow
          </span>
          <div className="flex gap-1">
            {[0, 0.18, 0.36].map((delay) => (
              <motion.div
                key={delay}
                animate={{ y: [0, -3, 0], opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 0.95, repeat: Infinity, delay }}
                className="w-1.5 h-1.5 rounded-full bg-sky-300"
              />
            ))}
          </div>
        </div>
        <p className="text-[8px] font-bold uppercase tracking-[0.24em] text-white/45 whitespace-nowrap">
          Streaming thoughts through the live workspace
        </p>
      </div>
    </div>
  );
};

export default ThinkingIndicator;
