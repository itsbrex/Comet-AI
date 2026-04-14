"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Clock,
  Camera,
  ArrowUp,
  Square,
  Plus,
  Bookmark,
  ChevronLeft,
  X,
  Image as ImageIcon,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quotedText?: string;
  imagePaths?: string[];
  timestamp: Date;
}

interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: Date;
}

interface CommandItem {
  trigger: string;
  description: string;
}

const COMMANDS: CommandItem[] = [
  { trigger: '/screen', description: 'Capture screen and attach' },
  { trigger: '/think', description: 'Enable thinking mode' },
  { trigger: '/search', description: 'Search the web' },
  { trigger: '/summarize', description: 'Summarize content' },
  { trigger: '/translate', description: 'Translate text' },
  { trigger: '/explain', description: 'Explain code/concept' },
  { trigger: '/rewrite', description: 'Rewrite selected text' },
];

const MAX_IMAGES = 3;

interface ThukiV2PanelProps {
  onSendMessage?: (message: string, context?: string) => void;
  onClose?: () => void;
  initialContext?: string;
}

export default function ThukiV2Panel({
  onSendMessage,
  onClose,
  initialContext,
}: ThukiV2PanelProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [highlightedCommandIndex, setHighlightedCommandIndex] = useState(0);
  const [commandPrefix, setCommandPrefix] = useState('');
  const [selectedContext, setSelectedContext] = useState<string | undefined>(initialContext);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [attachedImages, setAttachedImages] = useState<{ id: string; url: string; file?: File }[]>([]);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isChatMode = messages.length > 0 || isGenerating;

  const filteredCommands = useMemo(() => {
    if (!commandPrefix) return [];
    return COMMANDS.filter(cmd =>
      cmd.trigger.toLowerCase().startsWith(commandPrefix.toLowerCase())
    );
  }, [commandPrefix]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    
    const words = value.trim().split(/\s+/);
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('/')) {
      setCommandPrefix(lastWord);
      setShowCommandSuggestions(true);
      setHighlightedCommandIndex(0);
    } else {
      setShowCommandSuggestions(false);
      setCommandPrefix('');
    }
  }, []);

  const selectCommand = useCallback((trigger: string) => {
    const words = query.split(/\s+/);
    words[words.length - 1] = trigger + ' ';
    setQuery(words.join(' '));
    setShowCommandSuggestions(false);
    setCommandPrefix('');
    inputRef.current?.focus();
  }, [query]);

  const submitQuery = useCallback(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery && attachedImages.length === 0) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedQuery,
      quotedText: selectedContext,
      imagePaths: attachedImages.map(img => img.url),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setSelectedContext(undefined);
    setAttachedImages([]);
    setShowCommandSuggestions(false);
    setIsGenerating(true);

    onSendMessage?.(trimmedQuery, selectedContext);

    setTimeout(() => {
      setIsGenerating(false);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `I received your message: "${trimmedQuery}". This is Comet AI Sidebar V2 - Thuki-inspired minimal interface.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1500);
  }, [query, selectedContext, attachedImages, onSendMessage]);

  const cancelGeneration = useCallback(() => {
    setIsGenerating(false);
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setQuery('');
    setAttachedImages([]);
    setSelectedContext(undefined);
  }, []);

  const saveConversation = useCallback(() => {
    console.log('Saving conversation:', messages);
  }, [messages]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showCommandSuggestions && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedCommandIndex(prev =>
          (prev + 1) % filteredCommands.length
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedCommandIndex(prev =>
          (prev - 1 + filteredCommands.length) % filteredCommands.length
        );
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && highlightedCommandIndex < filteredCommands.length)) {
        e.preventDefault();
        selectCommand(filteredCommands[highlightedCommandIndex].trigger);
        return;
      }
      if (e.key === 'Escape') {
        setShowCommandSuggestions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuery();
    }
  }, [showCommandSuggestions, filteredCommands, highlightedCommandIndex, selectCommand, submitQuery]);

  const handleScreenshot = useCallback(() => {
    console.log('Screenshot capture triggered');
  }, []);

  const handleImageAttach = useCallback((files: FileList | null) => {
    if (!files || attachedImages.length >= MAX_IMAGES) return;
    
    const remaining = MAX_IMAGES - attachedImages.length;
    const newImages: { id: string; url: string; file?: File }[] = [];
    
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newImages.push({
          id: `img-${Date.now()}-${i}`,
          url: URL.createObjectURL(file),
          file,
        });
      }
    }
    
    setAttachedImages(prev => [...prev, ...newImages]);
  }, [attachedImages.length]);

  const removeImage = useCallback((id: string) => {
    setAttachedImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img?.url) URL.revokeObjectURL(img.url);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  useEffect(() => {
    if (isChatMode && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isChatMode]);

  return (
    <div className="flex flex-col h-full bg-[var(--primary-bg)] rounded-2xl overflow-hidden">
      {!isChatMode ? (
        <AskBarMode
          query={query}
          setQuery={handleQueryChange}
          selectedContext={selectedContext}
          attachedImages={attachedImages}
          showCommandSuggestions={showCommandSuggestions}
          filteredCommands={filteredCommands}
          highlightedCommandIndex={highlightedCommandIndex}
          isGenerating={isGenerating}
          onKeyDown={handleKeyDown}
          onSubmit={submitQuery}
          onCancel={cancelGeneration}
          onHistoryToggle={() => setIsHistoryOpen(!isHistoryOpen)}
          onScreenshot={handleScreenshot}
          onImageAttach={handleImageAttach}
          onImageRemove={removeImage}
          onSelectCommand={selectCommand}
          inputRef={inputRef}
        />
      ) : (
        <ChatMode
          messages={messages}
          isGenerating={isGenerating}
          isHistoryOpen={isHistoryOpen}
          onClose={onClose}
          onNewConversation={startNewConversation}
          onSaveConversation={saveConversation}
          onHistoryToggle={() => setIsHistoryOpen(!isHistoryOpen)}
          onSubmit={submitQuery}
          onCancel={cancelGeneration}
          onQueryChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onScreenshot={handleScreenshot}
          query={query}
          inputRef={inputRef}
          scrollRef={scrollRef}
        />
      )}
    </div>
  );
}

interface AskBarModeProps {
  query: string;
  setQuery: (value: string) => void;
  selectedContext?: string;
  attachedImages: { id: string; url: string; file?: File }[];
  showCommandSuggestions: boolean;
  filteredCommands: CommandItem[];
  highlightedCommandIndex: number;
  isGenerating: boolean;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onHistoryToggle: () => void;
  onScreenshot: () => void;
  onImageAttach: (files: FileList | null) => void;
  onImageRemove: (id: string) => void;
  onSelectCommand: (trigger: string) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

function AskBarMode({
  query,
  setQuery,
  selectedContext,
  attachedImages,
  showCommandSuggestions,
  filteredCommands,
  highlightedCommandIndex,
  isGenerating,
  onKeyDown,
  onSubmit,
  onCancel,
  onHistoryToggle,
  onScreenshot,
  onImageAttach,
  onImageRemove,
  onSelectCommand,
  inputRef,
}: AskBarModeProps) {
  const canSubmit = query.trim().length > 0 || attachedImages.length > 0;

  return (
    <div className="flex-1 flex flex-col justify-end p-4">
      <div className="max-w-md mx-auto w-full space-y-3">
        {selectedContext && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 bg-white/5 rounded-xl text-sm italic text-white/60"
          >
            &ldquo;{selectedContext.slice(0, 200)}&rdquo;
          </motion.div>
        )}

        {attachedImages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {attachedImages.map(img => (
              <div key={img.id} className="relative shrink-0">
                <img
                  src={img.url}
                  alt="Attached"
                  className="w-14 h-14 object-cover rounded-lg"
                />
                <button
                  onClick={() => onImageRemove(img.id)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showCommandSuggestions && filteredCommands.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 rounded-xl overflow-hidden"
            >
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.trigger}
                  onClick={() => onSelectCommand(cmd.trigger)}
                  className={`w-full px-4 py-2 flex items-center gap-3 text-left transition-colors ${
                    index === highlightedCommandIndex ? 'bg-white/10' : ''
                  }`}
                >
                  <span className="font-mono text-sm text-white">{cmd.trigger}</span>
                  <span className="text-sm text-white/50">{cmd.description}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Sparkles size={18} className="text-accent" />
          </div>

          <button
            onClick={onHistoryToggle}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Clock size={14} />
          </button>

          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask Comet anything..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 resize-none"
            style={{ caretColor: 'var(--accent)' }}
          />

          <button
            onClick={onScreenshot}
            disabled={attachedImages.length >= MAX_IMAGES}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <Camera size={14} />
          </button>

          <motion.button
            onClick={isGenerating ? onCancel : onSubmit}
            disabled={!canSubmit && !isGenerating}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              isGenerating
                ? 'bg-red-500/10 text-red-400'
                : canSubmit
                ? 'bg-accent text-white'
                : 'bg-white/10 text-white/40'
            }`}
          >
            {isGenerating ? <Square size={14} /> : <ArrowUp size={14} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

interface ChatModeProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  isHistoryOpen: boolean;
  onClose?: () => void;
  onNewConversation: () => void;
  onSaveConversation: () => void;
  onHistoryToggle: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  onQueryChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onScreenshot: () => void;
  query: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

function ChatMode({
  messages,
  isGenerating,
  isHistoryOpen,
  onClose,
  onNewConversation,
  onSaveConversation,
  onHistoryToggle,
  onSubmit,
  onCancel,
  onQueryChange,
  onKeyDown,
  onScreenshot,
  query,
  inputRef,
  scrollRef,
}: ChatModeProps) {
  const canSubmit = query.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={16} className="text-white/60" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onHistoryToggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <Clock size={14} className="text-white/60" />
          </button>
          <button
            onClick={onNewConversation}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <Plus size={14} className="text-white/60" />
          </button>
          <button
            onClick={onSaveConversation}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <Bookmark size={14} className="text-white/60" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {isGenerating && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-white/40 rounded-full"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span>Comet is thinking...</span>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Sparkles size={16} className="text-accent" />
          </div>

          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Reply..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40 resize-none"
            style={{ caretColor: 'var(--accent)' }}
          />

          <button
            onClick={onScreenshot}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Camera size={14} />
          </button>

          <button
            onClick={isGenerating ? onCancel : onSubmit}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
              isGenerating ? 'bg-red-500' : 'bg-accent'
            }`}
          >
            {isGenerating ? <Square size={12} /> : <ArrowUp size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChatBubbleProps {
  message: ChatMessage;
}

function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-accent" />
        </div>
      )}

      <div className={`max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {message.quotedText && (
          <div className="px-3 py-1.5 bg-white/5 rounded-lg text-xs italic text-white/50">
            &ldquo;{message.quotedText}&rdquo;
          </div>
        )}

        {message.imagePaths && message.imagePaths.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {message.imagePaths.map((path, i) => (
              <img
                key={i}
                src={path}
                alt="Attachment"
                className="max-w-24 max-h-24 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <div
          className={`px-4 py-2.5 rounded-2xl text-sm ${
            isUser
              ? 'bg-accent text-white rounded-br-md'
              : 'bg-white/10 text-white rounded-bl-md'
          }`}
        >
          {message.content}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <ImageIcon size={14} className="text-white/60" />
        </div>
      )}
    </motion.div>
  );
}
