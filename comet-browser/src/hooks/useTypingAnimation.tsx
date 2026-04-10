"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TypingAnimationOptions {
  enabled?: boolean;
  speed?: 'fast' | 'normal' | 'slow';
  showCursor?: boolean;
  cursorStyle?: 'block' | 'line' | 'blink';
  chunkSize?: number;
  minDelay?: number;
  maxDelay?: number;
}

interface UseTypingAnimationResult {
  displayedContent: string;
  isAnimating: boolean;
  progress: number;
  showCursor: boolean;
}

const DEFAULT_OPTIONS: Required<TypingAnimationOptions> = {
  enabled: true,
  speed: 'normal',
  showCursor: true,
  cursorStyle: 'blink',
  chunkSize: 3,
  minDelay: 8,
  maxDelay: 25,
};

const SPEED_MULTIPLIERS = {
  fast: 0.5,
  normal: 1,
  slow: 2,
};

export function useTypingAnimation(
  content: string,
  isStreaming: boolean,
  options: TypingAnimationOptions = {}
): UseTypingAnimationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [displayedContent, setDisplayedContent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  
  const lastContentRef = useRef('');
  const animationFrameRef = useRef<number | null>(null);
  const chunkQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!opts.enabled) {
      setDisplayedContent(content);
      setProgress(100);
      setShowCursor(false);
      setIsAnimating(false);
      return;
    }

    if (isStreaming) {
      setIsAnimating(true);
      setShowCursor(true);
      
      if (content !== lastContentRef.current) {
        const newContent = content.slice(lastContentRef.current.length);
        lastContentRef.current = content;
        
        const chunks: string[] = [];
        for (let i = 0; i < newContent.length; i += opts.chunkSize) {
          chunks.push(newContent.slice(i, i + opts.chunkSize));
        }
        chunkQueueRef.current.push(...chunks);
        
        if (!isProcessingRef.current) {
          processChunks();
        }
      }
    } else {
      setIsAnimating(false);
      setShowCursor(false);
      lastContentRef.current = content;
      setDisplayedContent(content);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [content, isStreaming, opts.enabled, opts.chunkSize]);

  const processChunks = useCallback(() => {
    if (chunkQueueRef.current.length === 0) {
      isProcessingRef.current = false;
      return;
    }

    isProcessingRef.current = true;
    const chunk = chunkQueueRef.current.shift();
    
    if (chunk) {
      setDisplayedContent(prev => prev + chunk);
      
      const newProgress = Math.round(((displayedContent.length + chunk.length) / Math.max(content.length, 1)) * 100);
      setProgress(Math.min(newProgress, 99));
    }

    const delay = opts.minDelay + Math.random() * (opts.maxDelay - opts.minDelay);
    const adjustedDelay = delay * SPEED_MULTIPLIERS[opts.speed];

    animationFrameRef.current = window.setTimeout(processChunks, adjustedDelay);
  }, [content.length, opts.minDelay, opts.maxDelay, opts.speed, displayedContent.length]);

  useEffect(() => {
    if (!isStreaming && displayedContent !== content) {
      setDisplayedContent(content);
      setProgress(100);
    }
  }, [isStreaming, content, displayedContent]);

  return { displayedContent, isAnimating, progress, showCursor };
}

export function TypingCursor({ 
  style = 'blink',
  color = '#38bdf8',
  glowColor = 'rgba(56, 189, 248, 0.45)'
}: { 
  style?: 'block' | 'line' | 'blink';
  color?: string;
  glowColor?: string;
}) {
  if (style === 'block') {
    return (
      <motion.span
        aria-hidden="true"
        className="inline-block w-2.5 h-5 rounded-sm"
        style={{ backgroundColor: color, boxShadow: `0 0 12px ${glowColor}` }}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      />
    );
  }

  if (style === 'line') {
    return (
      <motion.span
        aria-hidden="true"
        className="inline-block w-0.5 h-5 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${glowColor}` }}
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
      />
    );
  }

  return (
    <motion.span
      aria-hidden="true"
      className="inline-block w-2 h-5"
      animate={{ 
        opacity: [1, 0],
        scaleY: [1, 0]
      }}
      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.3 }}
    >
      <span
        className="inline-block w-0.5 h-full rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${glowColor}` }}
      />
    </motion.span>
  );
}

export interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  options?: TypingAnimationOptions;
  className?: string;
  cursorColor?: string;
  cursorGlowColor?: string;
}

export function StreamingText({
  content,
  isStreaming,
  options = {},
  className = '',
  cursorColor,
  cursorGlowColor,
}: StreamingTextProps) {
  const { displayedContent, showCursor } = useTypingAnimation(content, isStreaming, options);

  return (
    <span className={className}>
      {displayedContent}
      <AnimatePresence>
        {showCursor && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-block ml-0.5"
          >
            <TypingCursor 
              style={options.cursorStyle || 'blink'}
              color={cursorColor}
              glowColor={cursorGlowColor}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export interface WordByWordAnimationOptions extends TypingAnimationOptions {
  wordsPerChunk?: number;
  staggerDelay?: number;
}

export function useWordByWordAnimation(
  content: string,
  isStreaming: boolean,
  options: WordByWordAnimationOptions = {}
): { words: string[]; currentIndex: number; showCursor: boolean } {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  const lastContentRef = useRef('');
  
  const words = useMemo(() => {
    if (!content) return [];
    return content.split(/(\s+)/).filter(Boolean);
  }, [content]);

  useEffect(() => {
    if (isStreaming) {
      setShowCursor(true);
      
      if (content !== lastContentRef.current) {
        const newContent = content.slice(lastContentRef.current.length);
        lastContentRef.current = content;
        
        const newWords = newContent.split(/(\s+)/).filter(Boolean);
        let delay = 0;
        
        newWords.forEach((word, i) => {
          setTimeout(() => {
            setCurrentIndex(prev => {
              const targetIndex = words.findIndex((w, idx) => idx > prev && words.slice(0, idx).join('') === content.slice(0, words.slice(0, idx).join('').length + word.length));
              return Math.min(prev + 1, words.length);
            });
          }, delay);
          delay += options.staggerDelay || 50;
        });
      }
    } else {
      setShowCursor(false);
      setCurrentIndex(words.length);
    }
  }, [content, isStreaming, words, options.staggerDelay]);

  return { words, currentIndex, showCursor };
}

export function WordByWordText({
  content,
  isStreaming,
  options = {},
  className = '',
}: StreamingTextProps & { options?: WordByWordAnimationOptions }) {
  const { words, currentIndex, showCursor } = useWordByWordAnimation(content, isStreaming, options);

  return (
    <span className={className}>
      {words.slice(0, currentIndex).map((word, i) => (
        <motion.span
          key={`${i}-${word}`}
          initial={{ opacity: 0, y: 4, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {word}
        </motion.span>
      ))}
      {showCursor && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="inline-block ml-0.5"
        >
          <TypingCursor style={options.cursorStyle || 'line'} />
        </motion.span>
      )}
    </span>
  );
}

export default useTypingAnimation;
