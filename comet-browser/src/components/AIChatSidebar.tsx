"use client";

import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Maximize2, Minimize2, FileText, Download, Wifi, WifiOff, X, 
  ChevronLeft, ChevronRight, ChevronDown, Zap, Send, Paperclip, 
  FolderOpen, ScanLine,
  MoreVertical,
  Sparkles,
  Image as ImageIcon,
  Eye, EyeOff, Brain, Search, Loader2, MousePointerClick,
  CheckCircle2, AlertCircle,
  Share2, CopyIcon, Trash2, Printer, Cpu, Rocket, Camera, Terminal, MoreHorizontal
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import dracula from 'react-syntax-highlighter/dist/cjs/styles/prism/dracula';

// Imported modular components
import ThinkingPanel, { type ThinkingStep } from './ai/ThinkingPanel';
import CollapsibleOCRMessage from './ai/CollapsibleOCRMessage';
import MessageActions from './ai/MessageActions';
import ClickPermissionModal from './ai/ClickPermissionModal';
import ConversationHistoryPanel, { type Conversation, type ChatMessage } from './ai/ConversationHistoryPanel';
import AISetupGuide from './ai/AISetupGuide';
import ThinkingIndicator from './ThinkingIndicator';
import LLMProviderSettings from './LLMProviderSettings';
import { AICommandQueue, type AICommand } from './AICommandQueue';
import CapabilitiesPanel from './CapabilitiesPanel';

// Logic & Utils
import { 
  getThreatRecord, setThreatRecord, checkThreat, scrubbedContent, 
  isFailedPageContent, extractSiteFromContext, buildCleanPDFContent, 
  lsGet, lsSet, lsRemove, preloadCometIcon, tryGetIconBase64
} from './ai/AIUtils';
import { 
  COMET_CAPABILITIES, SYSTEM_INSTRUCTIONS, LANGUAGE_MAP, INTERNAL_TAG_RE 
} from './ai/AIConstants';
import { useAppStore } from '@/store/useAppStore';
import { BrowserAI } from '@/lib/BrowserAI';
import { Security } from '@/lib/Security';
import { prepareCommandsForExecution } from '@/lib/AICommandParser';
import { buildFrontendReasoningOptions, type LlmMode } from '@/lib/aiReasoningOptions';
import { getRecommendedGeminiModel } from '@/lib/modelRegistry';
import firebaseService from '@/lib/FirebaseService';

// ---------------------------------------------------------------------------
// Types & Types
// ---------------------------------------------------------------------------

type ExtendedChatMessage = ChatMessage & {
  attachments?: string[];
  isOcr?: boolean;
  ocrLabel?: string;
  thinkingSteps?: ThinkingStep[];
  thinkText?: string;
  actionLogs?: { type: string, output: string, success: boolean }[];
};

interface Attachment {
  type: 'image' | 'pdf';
  data: string;
  ocrText?: string;
  filename: string;
}

type RefusedIntent = 'credential_login' | 'session_export' | 'file_exfiltration';
interface RefusedIntentRecord {
  intent: RefusedIntent;
  site?: string;
  timestamp: number;
}

interface AIChatSidebarProps {
  studentMode: boolean;
  toggleStudentMode: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  selectedEngine: string;
  setSelectedEngine: (engine: string) => void;
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  backgroundImage: string;
  setBackgroundImage: (imageUrl: string) => void;
  backend: 'firebase' | 'mysql';
  setBackend: (backend: 'firebase' | 'mysql') => void;
  mysqlConfig: any;
  setMysqlConfig: (config: any) => void;
  side?: 'left' | 'right';
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const AIChatSidebar: React.FC<AIChatSidebarProps> = (props) => {
  const router = useRouter();
  const store = useAppStore();
  const {
    aiProvider, ollamaBaseUrl, ollamaModel, openaiApiKey, localLLMBaseUrl,
    localLLMModel, geminiApiKey, anthropicApiKey, groqApiKey,
    hasSeenAiMistakeWarning, askForAiPermission, aiSafetyMode,
    additionalAIInstructions, selectedLanguage, history, tabs, activeTabId,
    currentUrl, sidebarWidth,
    setShowAiMistakeWarning, setActiveView,
    setCurrentUrl, setSidebarWidth, setGeminiModel,
    localLlmMode, autoGeminiModelUpdates, geminiModel,
    setTheme: storeSetTheme,
    ollamaModelsList, setOllamaModelsList, setOllamaModel, geminiModel: storeGeminiModel,
  } = store;

  // Core state
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  // Command queue
  const [commandQueue, setCommandQueue] = useState<AICommand[]>([]);
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const processingQueueRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  // true after user approves any high-risk action in the current chain
  const chainApprovedRef = useRef(false);

  // Reasoning steps
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [thinkingText, setThinkingText] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const thinkingIdCounter = useRef(0);

  // Refs & Workers
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tesseractWorkerRef = useRef<Tesseract.Worker | null>(null);
  const refusedIntentsRef = useRef<RefusedIntentRecord[]>([]);

  // UI state
  const [showRagPanel, setShowRagPanel] = useState(false);
  const [ragContextItems, setRagContextItems] = useState<any[]>([]);
  const [showLLMProviderSettings, setShowLLMProviderSettings] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [isReadingPage, setIsReadingPage] = useState(false);
  const [isMermaidLoaded, setIsMermaidLoaded] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [ollamaModels, setOllamaModels] = useState<{ name: string; modified_at: string }[]>([]);
  const [groqSpeed, setGroqSpeed] = useState<string | null>(null);

  const [permissionPending, setPermissionPending] = useState<any | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  // Purple glow effect on chatbox when Shift+Tab is pressed to quick-allow
  const [shiftTabGlow, setShiftTabGlow] = useState(false);
  // Terminal log state
  const [terminalLogs, setTerminalLogs] = useState<Array<{ id: string; command: string; output: string; success: boolean; timestamp: number }>>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Helper Logic
  // ---------------------------------------------------------------------------

  const addThinkingStep = useCallback((label: string, detail?: string): string => {
    const id = `think-${Date.now()}-${thinkingIdCounter.current++}`;
    setThinkingSteps((prev) => [...prev, { id, label, status: 'running', detail, timestamp: Date.now() }]);
    return id;
  }, []);

  const resolveThinkingStep = useCallback((id: string, status: 'done' | 'error', detail?: string) => {
    setThinkingSteps((prev) => prev.map((s) => s.id === id ? { ...s, status, detail: detail ?? s.detail } : s));
  }, []);

  const requestActionPermission = useCallback(async (
    actionType: string, action: string, target: string, what: string, reason: string,
    risk: 'low' | 'medium' | 'high' = 'low'
  ): Promise<boolean> => {
    // Low risk (web search, PDF, navigate, screenshot, etc.) — auto-approve silently
    if (risk === 'low') return true;

    let highRiskQr = null;
    if (risk === 'high' && window.electronAPI?.generateHighRiskQr) {
      highRiskQr = await window.electronAPI.generateHighRiskQr(Math.random().toString(36).substring(7));
    }
    return new Promise((resolve) => {
      setPermissionPending({ resolve, context: { actionType, action, target, what, reason, risk, highRiskQr } });
    });
  }, []);

  const preloadCometIcon = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    if ((window as any).__cometIconBase64) return;
    try {
      const api = (window as any).electronAPI;
      if (typeof api?.getAppIcon === 'function') {
        const b64 = await api.getAppIcon();
        if (b64) (window as any).__cometIconBase64 = b64;
      }
    } catch {}
  }, []);

  const isAiSetup = useCallback(() => {
    if (aiProvider === 'ollama' && ollamaBaseUrl) return true;
    if (aiProvider === 'gemini' && geminiApiKey) return true;
    if (aiProvider === 'google' && geminiApiKey) return true;
    if (aiProvider === 'openai' && openaiApiKey) return true;
    if (aiProvider === 'anthropic' && anthropicApiKey) return true;
    if (aiProvider === 'groq' && groqApiKey) return true;
    return false;
  }, [aiProvider, ollamaBaseUrl, geminiApiKey, openaiApiKey, anthropicApiKey, groqApiKey]);

  // ---------------------------------------------------------------------------
  // AI Logic Bridge
  // ---------------------------------------------------------------------------

  const reasoningOptions = useMemo(() => buildFrontendReasoningOptions(
    (localLlmMode || 'normal') as LlmMode,
    aiProvider,
    {
      model: aiProvider === 'ollama' ? (ollamaModel || 'llama3')
           : aiProvider === 'gemini' || aiProvider === 'google' ? (geminiModel || 'gemini-2.0-flash')
           : undefined,
      baseUrl: aiProvider === 'ollama' ? ollamaBaseUrl : undefined,
    }
  ), [localLlmMode, aiProvider, ollamaModel, ollamaBaseUrl, geminiModel]);

  const getStreamingResponse = useCallback(async (history: ChatMessage[]): Promise<any> => {
    return new Promise((resolve) => {
      let fullText = '';
      let fullThought = '';
      
      const cleanup = window.electronAPI.onChatStreamPart((part: any) => {
        if (part.type === 'text-delta') {
          fullText += (part.textDelta || '');
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'model') {
              const updated = [...prev];
              updated[prev.length - 1] = { ...lastMessage, content: fullText };
              return updated;
            }
            return prev;
          });
        } else if (part.type === 'reasoning-delta') {
          fullThought += (part.reasoningDelta || '');
          setThinkingText(fullThought.trim());
        } else if (part.type === 'error') {
          cleanup();
          resolve({ error: part.error });
        } else if (part.type === 'finish') {
          cleanup();
          resolve({ text: fullText, thought: fullThought });
        }
      });
      window.electronAPI.streamChatContent(history, reasoningOptions);
    });
  }, [reasoningOptions]);

  // ---------------------------------------------------------------------------
  // Message Sending & Task Centralization
  // ---------------------------------------------------------------------------

  const handleSendMessage = useCallback(async (customContent?: string) => {
    const rawContent = (customContent ?? inputMessage).trim();
    if (!rawContent && attachments.length === 0) return;

    // Check if AI is setup
    if (!isAiSetup()) {
      setShowSetupGuide(true);
      return;
    }

    // 1. Initial State
    if (!customContent) { setInputMessage(''); setAttachments([]); }
    setIsLoading(true);
    setIsThinking(true);
    setThinkingSteps([]);
    setThinkingText('');
    setError(null);
    chainApprovedRef.current = false; // Reset per-chain approval

    // 2. Security Checks
    const threatCheck = checkThreat(rawContent);
    if (threatCheck.blocked) {
      setMessages(prev => [...prev, { role: 'user', content: rawContent }, { role: 'model', content: threatCheck.response ?? '' }] as ExtendedChatMessage[]);
      setIsLoading(false); setIsThinking(false); return;
    }

    const { content: protectedContent, wasProtected } = Security.fortress(rawContent);
    const userMessage: ExtendedChatMessage = {
      role: 'user',
      content: protectedContent + (attachments.length > 0 ? `\n[Attached ${attachments.length} files]` : ''),
      attachments: attachments.map(a => a.data)
    };

    if (rawContent.includes('[EXPLAIN_CAPABILITIES]')) {
      setShowCapabilities(true);
      const capCmd: AICommand = {
        id: `cmd-${Date.now()}-cap`,
        type: 'EXPLAIN_CAPABILITIES',
        value: '',
        status: 'pending',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, userMessage, { role: 'model', content: '✨ **Unlocking Neural Potential...**' }]);
      setCommandQueue([capCmd]);
      setCurrentCommandIndex(0);
      setIsLoading(false);
      setIsThinking(false);
      return;
    }

    setMessages(prev => [...prev, userMessage]);
    if (wasProtected) setMessages(prev => [...prev, { role: 'model', content: '🛡️ **AI Fortress Active**: Sensitive data protected.' }]);

    try {
      if (!window.electronAPI) throw new Error('AI Engine disconnected.');

      // 3. RAG & Live Data (Pre-retrieval)
      const ragId = addThinkingStep('Neural Retrieval...');
      const contextItems = await BrowserAI.retrieveContext(protectedContent);
      setRagContextItems(contextItems);
      if (contextItems.length > 0) setShowRagPanel(true);
      resolveThinkingStep(ragId, 'done', `${contextItems.length} memories recovered`);

      // 4. LLM Request — Build history locally to avoid state lag
      const aiId = addThinkingStep('LLM Processing...');
      const initialHistory: ChatMessage[] = [
        { role: 'system', content: `${SYSTEM_INSTRUCTIONS}\n\n[CONTEXT: CURRENT_TIME]\n${new Date().toLocaleString()}\n[LOCATION]\nIndia/Search Results Mode` },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: `${userMessage.content}\n\n[CONTEXT]\n${contextItems.map(c => c.text).join('\n')}` }
      ];

      setMessages(prev => [...prev, { role: 'model', content: '' }] as ExtendedChatMessage[]);
      const response = await getStreamingResponse(initialHistory);
      resolveThinkingStep(aiId, response.error ? 'error' : 'done');

      if (response.error) throw new Error(response.error);

      // 5. Action Execution (Synthesis Pattern)
      const { commands, responseText } = prepareCommandsForExecution(response.text);
      if (commands.length > 0) {
        const cmdId = addThinkingStep('Executing Actions...');
        const aiCommands: AICommand[] = commands.map((c, i) => ({
          id: `cmd-${Date.now()}-${i}`,
          type: c.type,
          value: c.value,
          status: 'pending',
          timestamp: Date.now()
        }));
        setCommandQueue(aiCommands);
        setCurrentCommandIndex(0);
        
        // Wait for all commands to complete
        const finalCommands = await new Promise<AICommand[]>((resolve) => {
          const timeout = setTimeout(() => resolve([]), 300000); // 5 minutes max to allow for manual user permission
          let isResolved = false;
          const checkStatus = () => {
            if (isResolved) return;
            setCommandQueue(q => {
              const allDone = q.length === 0 || q.every(c => c.status === 'completed' || c.status === 'failed');
              if (allDone && !isResolved) {
                isResolved = true;
                clearTimeout(timeout);
                resolve(q);
              } else if (!isResolved) {
                setTimeout(checkStatus, 500);
              }
              return q;
            });
          };
          checkStatus();
        });
        
        resolveThinkingStep(cmdId, 'done');

        // 6. Synthesis (Follow-up)
        const synthId = addThinkingStep('Synthesizing Results...');
        const actionResults = finalCommands.map(c => 
          `[Action ${c.type}]: ${c.status === 'completed' ? (c.output || 'Success') : ('Error: ' + (c.error || 'Failed'))}`
        ).join('\n');
        
        const synthHistory: ChatMessage[] = [
          ...initialHistory,
          { role: 'assistant', content: response.text },
          { role: 'user', content: `Action outputs for the steps above:\n${actionResults}\n\nPlease analyze these and provide the COMPREHENSIVE FINAL ANSWER to the original request now. If any step failed, explain why and suggest an alternative if possible.` }
        ];

        setMessages(prev => [...prev, { role: 'model', content: '' }] as ExtendedChatMessage[]);
        const synthResponse = await getStreamingResponse(synthHistory);
        resolveThinkingStep(synthId, synthResponse.error ? 'error' : 'done');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
    }
  }, [inputMessage, attachments, messages, aiProvider, currentUrl, addThinkingStep, resolveThinkingStep, getStreamingResponse, isAiSetup]);

  const processNextCommand = useCallback(async () => {
    if (processingQueueRef.current || currentCommandIndex >= commandQueue.length) return;
    
    processingQueueRef.current = true;
    const command = commandQueue[currentCommandIndex];
    
    setCommandQueue(prev => prev.map((cmd, i) => i === currentCommandIndex ? { ...cmd, status: 'executing' } : cmd));
    
    try {
      let output = '';
      
      switch (command.type) {
        case 'WAIT': {
          const ms = parseInt(command.value) || 2000;
          output = `Waiting for ${ms}ms...`;
          await new Promise(resolve => setTimeout(resolve, ms));
          break;
        }

        case 'THINK': {
          const thinkId = addThinkingStep(command.value || 'AI Reasoning...');
          await new Promise(resolve => setTimeout(resolve, 1500)); // Visual delay for logic steps
          resolveThinkingStep(thinkId, 'done', 'Reasoning complete');
          output = `Reasoning step: ${command.value}`;
          break;
        }

        case 'PLAN': {
          output = `Executing plan: ${command.value}`;
          setMessages(prev => [...prev, { role: 'model', content: `🎯 **STRATEGIC PLAN:** ${command.value}` }]);
          break;
        }

        case 'NAVIGATE': {
          const targetUrl = command.value.trim() || 'https://www.google.com';
          if (targetUrl.startsWith('comet://')) {
            const page = targetUrl.replace('comet://', '');
            router.push(`/${page}`);
            setActiveView('browser');
            output = `Navigated to internal page: ${page}`;
          } else {
            setActiveView('browser');
            const tabToUse = (activeTabId && activeTabId !== 'default') ? activeTabId : 'default';
            await window.electronAPI.navigateBrowserView({ tabId: tabToUse, url: targetUrl });
            output = `Navigated to ${targetUrl}`;
          }
          break;
        }

        case 'SEARCH':
        case 'WEB_SEARCH': {
          const query = command.value.trim().replace(/^["'](.*)["']$/, '$1') || 'Comet AI Browser';
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
          setActiveView('browser');
          
          if (!activeTabId || activeTabId === 'default') {
             store.addTab(searchUrl);
             output = `Opening search in new tab: "${query}"`;
          } else {
             await window.electronAPI.navigateBrowserView({ tabId: activeTabId, url: searchUrl });
             output = `Searching for "${query}" in current tab.`;
          }

          // Also run RAG for the AI
          const results = await window.electronAPI.webSearchRag(query);
          if (results && results.length > 0) {
             const snippets = results.map((r: string) => r.trim()).filter(Boolean).slice(0, 3);
             output += `\nResults: ${snippets.join(' | ')}`;
          } else {
             output += "\nNo instant results found.";
          }
          break;
        }


        case 'READ_PAGE_CONTENT': {
          // 2s delay to allow page to fully load before extracting
          await new Promise(resolve => setTimeout(resolve, 2000));
          const res = await window.electronAPI.extractPageContent();
          if (res.content) {
            const scrubbed = scrubbedContent(res.content);
            output = `Page content read successfully (${scrubbed.length} chars).`;
            // Add to session RAG for future turns
            await BrowserAI.addToVectorMemory(scrubbed, { type: 'page_content', url: currentUrl });
          } else {
            output = `Error reading page: ${res.error}`;
          }
          break;
        }

        case 'SET_THEME':
          storeSetTheme(command.value as any);
          output = `Theme set to ${command.value}`;
          break;

        case 'OPEN_VIEW':
          setActiveView(command.value as any);
          output = `Switched to ${command.value} view`;
          break;

        case 'SET_VOLUME':
          await window.electronAPI.setVolume(parseInt(command.value));
          output = `System volume adjusted to ${command.value}%`;
          break;

        case 'SET_BRIGHTNESS':
          await window.electronAPI.setBrightness(parseInt(command.value));
          output = `Screen brightness adjusted to ${command.value}%`;
          break;

        case 'SHELL_COMMAND': {
          let confirmed = chainApprovedRef.current; // Skip prompt if chain already approved
          if (!confirmed) {
            setCommandQueue(prev => prev.map((cmd, i) => i === currentCommandIndex ? { ...cmd, status: 'awaiting_permission' } : cmd));
            confirmed = await requestActionPermission(
              'SHELL_COMMAND', 'Execute Shell Command', 'Terminal', command.value,
              'The AI needs to run this command to complete your task.', 'high'
            );
            if (confirmed) chainApprovedRef.current = true;
          }
          setCommandQueue(prev => prev.map((cmd, i) => i === currentCommandIndex ? { ...cmd, status: 'executing' } : cmd));
          const logId = `term-${Date.now()}`;
          const logEntry = { id: logId, command: command.value, output: '', success: false, timestamp: Date.now() };
          if (confirmed) {
            // Show terminal and add a pending entry
            setShowTerminal(true);
            setTerminalLogs(prev => [...prev, { ...logEntry, output: '⏳ Running...' }]);
            const res = await window.electronAPI.executeShellCommand(command.value);
            const cmdOutput = res.success ? (res.output || '(no output)') : `Error: ${res.error}`;
            // Update the terminal log with actual output
            setTerminalLogs(prev => prev.map(l => l.id === logId
              ? { ...l, output: cmdOutput, success: !!res.success }
              : l
            ));
            output = `$ ${command.value}\n${cmdOutput}`;
          } else {
            setTerminalLogs(prev => [...prev, { ...logEntry, output: '⛔ Denied by user.', success: false }]);
            output = 'Command execution denied by user.';
          }
          break;
        }

        case 'OPEN_APP': {
          setCommandQueue(prev => prev.map((cmd, i) => i === currentCommandIndex ? { ...cmd, status: 'awaiting_permission' } : cmd));
          const confirmed = await requestActionPermission(
            'OPEN_APP', 'Open Application', command.value, command.value,
            'The AI wants to launch an external application.', 'medium'
          );
          setCommandQueue(prev => prev.map((cmd, i) => i === currentCommandIndex ? { ...cmd, status: 'executing' } : cmd));
          if (confirmed) {
            await window.electronAPI.openExternalApp(command.value);
            output = `Application ${command.value} launched.`;
          } else {
            output = 'App launch denied by user.';
          }
          break;
        }

        case 'GENERATE_PDF': {
          const [title, ...contentParts] = command.value.split('|');
          const pdfTitle = title?.trim() || 'Document';
          const pdfContent = contentParts.join('|').trim();
          await preloadCometIcon();
          const iconSource = (window as any).__cometIconBase64 || null;
          const cleanHTML = buildCleanPDFContent(pdfContent, pdfTitle, iconSource);
          const res = await window.electronAPI.generatePDF(pdfTitle, cleanHTML);
          output = res.success ? `PDF "${pdfTitle}" generated and saved.` : `Error: ${res.error}`;
          break;
        }

        case 'EXPLAIN_CAPABILITIES': {
          setShowCapabilities(true);
          const demoMessages = [
            "🚀 **Initiating Neural Capability Demonstration...**",
            "📄 **1. Autonomous Document Synthesis:** I can generate professional PDF reports dynamically from any analyzed content.",
            "⚙️ **2. Ecosystem Orchestration:** I can launch desktop applications and interact with your OS directly.",
            "🧠 **3. Contextual RAG Memory:** I learn from your browsing sessions to provide deep, personalized insights.",
            "🎯 **4. Multi-Step Agency:** Watch me execute this demo sequence autonomously!"
          ];

          for (const msg of demoMessages) {
            setMessages(prev => [...prev, { role: 'model', content: msg }]);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Trigger demo actions: 1. Generate Branded PDF
          const pdfTitle = "Comet_Capability_Demo";
          const pdfBody = `
            <div style="padding: 20px; background: #f0f9ff; border-radius: 12px; border: 1px solid #bae6fd;">
              <h2 style="color: #0369a1; margin-top: 0;">Comet AI Capability Report</h2>
              <p>This document was generated automatically by the Comet AI Agent. It demonstrates the platform's ability to synthesize and export data in professional formats.</p>
              <ul>
                <li><strong>PDF Generation:</strong> Branded, styled, and ready for distribution.</li>
                <li><strong>Cross-Platform:</strong> Works seamlessly on Windows, macOS, and Linux.</li>
              </ul>
            </div>
          `;
          await preloadCometIcon();
          const iconSource = (window as any).__cometIconBase64 || null;
          const cleanHTML = buildCleanPDFContent(pdfBody, pdfTitle, iconSource);
          await window.electronAPI.generatePDF(pdfTitle, cleanHTML);

          // 2. Launch App (Calculator) - No permission required for demo internal flow usually, 
          // but we'll use the API directly to skip the UI prompt for this hardcoded demo
          if (window.electronAPI.openExternalApp) {
            const calcApp = process.platform === 'darwin' ? 'Calculator' : 'calc';
            await window.electronAPI.openExternalApp(calcApp);
          }
          
          setMessages(prev => [...prev, { role: 'model', content: "✅ **DEMO COMPLETE:** I have saved a 'Comet_Capability_Demo.pdf' to your Downloads, launched your calculator, and demonstrated my core agency." }]);
          
          output = 'Capability demonstration executed successfully with branded PDF and app orchestration.';
          break;
        }

        case 'RELOAD':
          await window.electronAPI.reload();
          output = 'Active page reloaded.';
          break;

        case 'GO_BACK':
          await window.electronAPI.goBack();
          output = 'Navigated back in history.';
          break;

        case 'GO_FORWARD':
          await window.electronAPI.goForward();
          output = 'Navigated forward in history.';
          break;

        case 'SCREENSHOT_AND_ANALYZE': {
          const stepId = addThinkingStep('Capturing screenshot...', 'Taking screenshot and running OCR');
          // 2s delay to allow the page to fully render before OCR
          await new Promise(resolve => setTimeout(resolve, 2000));
          try {
            // Use vision describe if available, else fall back to OCR text
            let ocrText = '';
            if (window.electronAPI.visionDescribe) {
              const visionRes = await window.electronAPI.visionDescribe('What is on this screen? Extract all visible text.');
              ocrText = typeof visionRes === 'string' ? visionRes : ((visionRes as any)?.description || '');
            } else if (window.electronAPI.ocrScreenText) {
              const ocrRes = await window.electronAPI.ocrScreenText();
              ocrText = typeof ocrRes === 'string' ? ocrRes : ((ocrRes as any)?.text || '');
            }
            resolveThinkingStep(stepId, 'done', 'Screenshot captured');
            if (ocrText) {
              output = `Screenshot analyzed. OCR text (${ocrText.length} chars): ${ocrText.substring(0, 200)}...`;
              await BrowserAI.addToVectorMemory(ocrText, { type: 'screenshot_ocr', url: currentUrl });
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'model') {
                  const updated = [...prev];
                  updated[prev.length - 1] = { ...last, isOcr: true, ocrLabel: 'SCREENSHOT_ANALYSIS', content: ocrText };
                  return updated;
                }
                return [...prev, { role: 'model', content: ocrText, isOcr: true, ocrLabel: 'SCREENSHOT_ANALYSIS' } as ExtendedChatMessage];
              });
            } else {
              output = 'Screenshot captured but no text detected.';
            }
          } catch (e: any) {
            resolveThinkingStep(stepId, 'error', e.message);
            output = `Screenshot failed: ${e.message}`;
          }
          break;
        }

        case 'EXTRACT_DATA': {
          const selector = command.value.split('|')[0].trim();
          try {
            const res = await window.electronAPI.extractPageContent();
            if (res && res.content) {
              const scrubbed = scrubbedContent(res.content);
              output = `Extracted data from page (${scrubbed.length} chars).`;
              await BrowserAI.addToVectorMemory(scrubbed, { type: 'extracted_data', selector, url: currentUrl });
            } else {
              output = `No data found for selector: ${selector}.`;
            }
          } catch (e: any) {
            output = `Extract failed: ${e.message}`;
          }
          break;
        }

        default:
          output = `Operation ${command.type} completed.`;
      }
      
      setCommandQueue(prev => prev.map((cmd, i) => i === currentCommandIndex ? { ...cmd, status: 'completed', output } : cmd));
      
      // Update chat with progress action log
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'model') {
          const updated = [...prev];
          const actionLogs = last.actionLogs || [];
          updated[prev.length - 1] = { 
             ...last, 
             actionLogs: [...actionLogs, { type: command.type, output, success: true }]
          };
          return updated;
        }
        return prev;
      });

    } catch (err: any) {
      setCommandQueue(prev => prev.map((cmd, i) => i === currentCommandIndex ? { ...cmd, status: 'failed', error: err.message } : cmd));
      
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'model') {
          const updated = [...prev];
          const actionLogs = last.actionLogs || [];
          updated[prev.length - 1] = { 
             ...last, 
             actionLogs: [...actionLogs, { type: command.type, output: err.message, success: false }]
          };
          return updated;
        }
        return prev;
      });
    } finally {
      // Default 2-second delay between chain steps as requested
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      processingQueueRef.current = false;
      setCurrentCommandIndex(prev => prev + 1);
    }
  }, [commandQueue, currentCommandIndex, activeTabId, router, storeSetTheme, setActiveView, currentUrl, requestActionPermission, preloadCometIcon]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setThinkingSteps([]);
    setThinkingText('');
    setShowActionsMenu(false);
  }, []);

  const exportChat = useCallback(async (format: 'text' | 'pdf') => {
    if (messages.length === 0) return;
    setShowActionsMenu(false);
    if (window.electronAPI) {
      if (format === 'text') {
        const success = await window.electronAPI.exportChatAsTxt(messages);
        if (success) {
          // Notify or animation?
        }
      } else {
        await window.electronAPI.exportChatAsPdf(messages);
      }
    }
  }, [messages]);

  const copyChatToClipboard = useCallback(() => {
    const chatData = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(chatData);
    setShowActionsMenu(false);
  }, [messages]);

  useEffect(() => {
    if (commandQueue.length > 0 && currentCommandIndex < commandQueue.length && !processingQueueRef.current) {
      processNextCommand();
    }
  }, [commandQueue, currentCommandIndex, processNextCommand]);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const mermaid = (window as any).mermaid;
    if (mermaid) mermaid.initialize({ theme: 'dark' });
    setIsMermaidLoaded(true);
    
    const hOnline = () => setIsOnline(true);
    const hOffline = () => setIsOnline(false);
    window.addEventListener('online', hOnline);
    window.addEventListener('offline', hOffline);
    
    setConversations(lsGet<Conversation[]>('conversations_list', []));
    
    return () => {
      window.removeEventListener('online', hOnline);
      window.removeEventListener('offline', hOffline);
    };
  }, []);

  // Shift + Tab Auto Accept
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'Tab' && permissionPending) {
        const { risk } = permissionPending.context;
        if (risk === 'low' || risk === 'medium') {
          e.preventDefault();
          // Flash the purple chatbox glow
          setShiftTabGlow(true);
          setTimeout(() => setShiftTabGlow(false), 900);
          permissionPending.resolve(true);
          setPermissionPending(null);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [permissionPending]);

  // Listen for mobile high-risk approval
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onMobileApproveHighRisk) {
      const unsub = window.electronAPI.onMobileApproveHighRisk((data: { pin: string, id: string }) => {
        setPermissionPending((currentPending: any) => {
          if (currentPending && currentPending.context.risk === 'high') {
            try {
              const qrData = JSON.parse(currentPending.context.highRiskQr || '{}');
              // Validate both PIN and action Token to prevent cross-action hijacking
              if (qrData.pin === data.pin && qrData.token === data.id) {
                currentPending.resolve(true);
                return null;
              }
            } catch (e) {
              console.error("Failed to parse high risk QR data for PIN validation", e);
            }
          }
          return currentPending;
        });
      });
      return () => unsub();
    }
  }, []);

  // Fetch Ollama models
  useEffect(() => {
    if (aiProvider === 'ollama') {
      setIsFetchingModels(true);
      fetch(`${ollamaBaseUrl}/api/tags`)
        .then(res => res.json())
        .then(data => {
          if (data && data.models) {
            setOllamaModelsList(data.models);
            // Default to the first available model if current is empty or not in the list
            if (data.models.length > 0 && (!ollamaModel || !data.models.find((m: any) => m.name === ollamaModel))) {
              setOllamaModel(data.models[0].name);
            }
          }
        })
        .catch(err => console.error("Failed to fetch Ollama models", err))
        .finally(() => setIsFetchingModels(false));
    }
  }, [aiProvider, ollamaBaseUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // ---------------------------------------------------------------------------
  // Sub-Renderers
  // ---------------------------------------------------------------------------

  if (props.isCollapsed) {
    return (
      <div className="flex flex-col items-center h-full py-6 space-y-6 bg-[#020205] border-l border-white/5">
        <button onClick={props.toggleCollapse} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 transition-all">
          {props.side === 'right' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    );
  }

  const currentActiveModel = aiProvider === 'ollama' ? ollamaModel : 
                            aiProvider === 'gemini' ? geminiModel : 
                            aiProvider === 'openai' ? store.openaiModel :
                            aiProvider === 'anthropic' ? store.anthropicModel :
                            aiProvider === 'groq' ? store.groqModel : aiProvider;

  return (
    <div 
      className={`flex flex-col h-full bg-[#020205] border-l border-white/10 overflow-hidden relative ${isFullScreen ? 'fixed inset-0 z-[9999]' : ''}`}
      style={{ width: isFullScreen ? '100%' : sidebarWidth }}
    >
      {/* ── Overlays ── */}
      <ConversationHistoryPanel 
        show={showConversationHistory} conversations={conversations} activeId={activeConversationId}
        onClose={() => setShowConversationHistory(false)} onLoad={(id) => {}} onDelete={(id) => {}} onNew={() => {}} 
      />
      
      <CapabilitiesPanel 
        isOpen={showCapabilities} 
        onClose={() => setShowCapabilities(false)} 
      />
      
      <AnimatePresence>
        {showSetupGuide && <AISetupGuide onClose={() => setShowSetupGuide(false)} onComplete={() => { setShowSetupGuide(false); setShowLLMProviderSettings(true); }} />}
      </AnimatePresence>

      <AnimatePresence>
        {commandQueue.length > 0 && currentCommandIndex < commandQueue.length && (
          <AICommandQueue 
            commands={commandQueue} 
            currentCommandIndex={currentCommandIndex} 
            onCancel={() => setCommandQueue([])} 
          />
        )}
      </AnimatePresence>

      {/* ── Terminal Panel ── */}
      <AnimatePresence>
        {showTerminal && terminalLogs.length > 0 && (
          <motion.div
            key="terminal"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.97 }}
            className="absolute bottom-[180px] left-4 right-4 z-[9000] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] bg-[#09090f]"
            style={{ maxHeight: '220px' }}
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#111118] border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <span className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest ml-2">Comet Terminal</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTerminalLogs([])}
                  className="text-[9px] text-white/20 hover:text-white/50 font-mono uppercase tracking-widest transition-colors"
                >clear</button>
                <button
                  onClick={() => setShowTerminal(false)}
                  className="text-white/20 hover:text-white/60 transition-colors"
                ><X size={12} /></button>
              </div>
            </div>
            {/* Terminal Body */}
            <div className="overflow-y-auto modern-scrollbar p-3 space-y-2 font-mono text-[11px]" style={{ maxHeight: '170px' }}>
              {terminalLogs.map(log => (
                <div key={log.id} className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400/70">❯</span>
                    <span className="text-sky-300/80">{log.command}</span>
                  </div>
                  <pre className={`ml-4 whitespace-pre-wrap break-all leading-relaxed ${
                    log.success ? 'text-white/60' : 'text-red-400/80'
                  }`}>{log.output}</pre>
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {permissionPending && (
          <div className="absolute inset-0 z-[10001] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <ClickPermissionModal 
              context={permissionPending.context} 
              onAllow={() => { permissionPending.resolve(true); setPermissionPending(null); }}
              onDeny={() => { permissionPending.resolve(false); setPermissionPending(null); }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <header className="p-5 flex flex-col gap-3 border-b border-white/5 bg-[#020205]/80 backdrop-blur-xl sticky top-0 z-[50]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-white/10 to-transparent p-1.5 border border-white/10">
              <img src="icon.png" alt="Comet" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white">Comet AI</h2>
              <div className="flex items-center gap-2 mt-1">
                 <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                 <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Autonomous</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowTerminal(v => !v)}
              className={`p-2.5 rounded-xl transition-all relative ${showTerminal ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/5 text-white/30 hover:text-white'}`}
              title="Toggle Terminal"
            >
              <Terminal size={18} />
              {terminalLogs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 text-[8px] font-bold text-black flex items-center justify-center">
                  {terminalLogs.length > 9 ? '9+' : terminalLogs.length}
                </span>
              )}
            </button>
            <button onClick={() => setShowCapabilities(!showCapabilities)} className={`p-2.5 rounded-xl transition-all ${showCapabilities ? 'bg-sky-500/20 text-sky-400' : 'hover:bg-white/5 text-white/30 hover:text-white'}`} title="View AI Capabilities">
              <Sparkles size={18} />
            </button>
            <button onClick={() => setShowLLMProviderSettings(!showLLMProviderSettings)} className="p-2.5 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all">
              <MoreVertical size={18} />
            </button>
            <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2.5 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all">
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button onClick={props.toggleCollapse} className="p-2.5 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all">
              <X size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Chat Messages ── */}
      <div className="flex-1 overflow-y-auto modern-scrollbar p-5 space-y-8">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center space-y-4">
               <div className="w-16 h-16 rounded-[2rem] bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10 shadow-2xl">
                  <Brain size={32} className="text-white/20" />
               </div>
               <div>
                  <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">How can I assist your workflow?</h3>
                  <p className="text-[10px] text-white/20 uppercase tracking-tighter mt-1 font-bold">I can navigate, browse, and execute tasks across Comet.</p> 
               </div>
            </motion.div>
          )}
          {messages.map((msg, i) => {
            let displayContent = msg.content;
            let displayThought = msg.thinkText;
            
            // Extract <think> tags from content if present
            const thinkMatch = displayContent.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
            if (thinkMatch) {
              displayThought = thinkMatch[1].trim();
              displayContent = displayContent.replace(/<think>[\s\S]*?(?:<\/think>|$)/i, '').trim();
            }

            // Clean up raw AI internal commands like [NAVIGATE: ...] from chat display
            displayContent = displayContent.replace(/\[(NAVIGATE|SEARCH|WEB_SEARCH|READ_PAGE_CONTENT|LIST_OPEN_TABS|GENERATE_PDF|SHELL_COMMAND|SET_THEME|SET_VOLUME|SET_BRIGHTNESS|OPEN_APP|SCREENSHOT_AND_ANALYZE|CLICK_ELEMENT|FIND_AND_CLICK|GENERATE_DIAGRAM|OPEN_VIEW|RELOAD|GO_BACK|GO_FORWARD|WAIT|THINK|PLAN|EXPLAIN_CAPABILITIES)(?::\s*[^\]]+?)?\]/gi, '').trim();

            return (
            <motion.div 
              key={i} 
              layout 
              initial={{ opacity: 0, y: 20, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'model' && (msg.thinkingSteps || displayThought) && (
                <div className="w-full max-w-[90%] mb-2">
                  <ThinkingPanel steps={msg.thinkingSteps} thinkText={displayThought} initialOpen={false} />
                </div>
              )}
              
              <div className={`group relative max-w-[90%] p-5 rounded-[2.5rem] text-[13px] leading-relaxed transition-all duration-500 hover:shadow-2xl ${
                msg.role === 'user' 
                ? 'bg-[#12121e] text-white border border-white/10 rounded-tr-none shadow-xl' 
                : 'bg-gradient-to-br from-sky-500/10 to-sky-500/[0.02] text-slate-200 border border-sky-500/20 rounded-tl-none'
              }`}>
                {msg.role === 'model' && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 border border-sky-500/20">
                      <Sparkles size={12} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-sky-400/60">Comet Response</span>
                  </div>
                )}
                {msg.isOcr ? (
                  <CollapsibleOCRMessage label={msg.ocrLabel || 'EXTRACTED_DATA'} content={displayContent} />
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={{
                    code({ node, className, children, ...rest }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <div className="my-5 rounded-3xl overflow-hidden border border-white/5 shadow-2xl"><SyntaxHighlighter style={dracula as any} language={match[1]} PreTag="div" customStyle={{ margin: 0, padding: '1.5rem', fontSize: '11px' }}>{String(children)}</SyntaxHighlighter></div>
                      ) : <code className="bg-white/10 px-2 py-0.5 rounded-lg text-[12px] font-mono text-sky-300" {...rest}>{children}</code>;
                    }
                  }}>
                    {displayContent}
                  </ReactMarkdown>
                )}
                {msg.actionLogs && msg.actionLogs.length > 0 && (
                   <div className="mt-5 flex flex-wrap gap-2">
                     {msg.actionLogs.map((log, idx) => {
                       const isSearch = log.type.includes('SEARCH');
                       const isRead = log.type.includes('READ');
                       
                       return (
                         <div key={idx} className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 hover:scale-105 shadow-sm active:scale-95 cursor-default ${
                           log.success 
                           ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' 
                           : 'bg-red-500/10 border-red-500/30 text-red-400'
                         }`} title={log.output}>
                            {isSearch && <Search size={12} />}
                            {isRead && <FileText size={12} />}
                            {!isSearch && !isRead && (log.success ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />)}
                            <span>{log.type.replace(/_/g, ' ')}</span>
                         </div>
                       );
                     })}
                   </div>
                )}
                
                {msg.role === 'model' && (
                  <MessageActions content={displayContent} index={i} copiedIndex={copiedMessageIndex} onCopy={() => {}} onShare={() => {}} />
                )}
              </div>
            </motion.div>
          )})}
          {isLoading && <ThinkingIndicator />}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ── */}
      <footer className="p-6 pt-0 bg-gradient-to-t from-[#020205] via-[#020205] to-transparent sticky bottom-0">
        <div className={`p-4 rounded-[2.5rem] bg-[#0d0d15] border transition-all shadow-2xl relative group ${
          shiftTabGlow
            ? 'border-purple-500/80 shadow-[0_0_24px_4px_rgba(168,85,247,0.35)] focus-within:border-purple-500/80'
            : 'border-white/10 focus-within:border-sky-500/30'
        }`}>
          
          {/* Active Model Indicator inside Chatbox */}
          <div className="absolute -top-10 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
             <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
             <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{currentActiveModel}</span>
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {attachments.map((a, i) => (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={i} className="flex items-center gap-2 px-3 py-2 bg-sky-500/10 rounded-2xl text-[10px] text-sky-400 border border-sky-500/20">
                   {a.type === 'image' ? <ImageIcon size={12} /> : <FileText size={12} />}
                   <span className="max-w-[100px] truncate font-bold uppercase tracking-tight">{a.filename}</span>
                   <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400 transition-colors"><X size={12} /></button>
                </motion.div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {showActionsMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute bottom-28 left-4 z-[60] w-52 bg-[#0a0a10]/98 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden p-1.5"
              >
                 <button onClick={clearChat} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-red-500/70 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"><Trash2 size={14}/> Clear Thread</button>
                 <div className="h-px bg-white/5 my-1 mx-2"/>
                 <button onClick={() => exportChat('text')} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><FileText size={14}/> Export text</button>
                 <button onClick={() => exportChat('pdf')} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><Download size={14}/> Export PDF</button>
                 <button onClick={copyChatToClipboard} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all"><CopyIcon size={14}/> Copy Context</button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            placeholder="Command your workspace..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/10 outline-none resize-none h-24 py-2 modern-scrollbar font-medium"
          />
          
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
            <div className="flex items-center gap-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-2xl hover:bg-white/5 text-white/20 hover:text-white transition-all"><Paperclip size={20} /></button>
              <button onClick={() => setShowConversationHistory(true)} className="p-3 rounded-2xl hover:bg-white/5 text-white/20 hover:text-white transition-all"><FolderOpen size={20} /></button>
              <button onClick={() => setShowActionsMenu(!showActionsMenu)} className={`p-3 rounded-2xl transition-all ${showActionsMenu ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/20 hover:text-white'}`}><MoreHorizontal size={20} /></button>
            </div>
            <button 
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputMessage.trim() && attachments.length === 0)}
              className="group flex items-center justify-center w-12 h-12 rounded-[1.5rem] bg-sky-500 text-black shadow-[0_10px_20px_rgba(56,189,248,0.3)] transition-all hover:scale-105 active:scale-95 disabled:opacity-10 disabled:grayscale"
            >
              <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
        <p className="text-[8px] text-center text-white/5 mt-5 uppercase tracking-[0.5em] font-black">Neural Engine Active • v0.2.2 Experimental</p>
      </footer>
      
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => {}} />
      <LLMProviderSettings 
        {...props} 
        showSettings={showLLMProviderSettings} 
        setShowSettings={setShowLLMProviderSettings} 
        ollamaModels={ollamaModelsList.map(m => ({ name: m.name, modified_at: (m as any).modified_at || 'Recently' }))} 
        setOllamaModels={setOllamaModelsList} 
        setError={setError} 
      />
    </div>
  );
};

export default memo(AIChatSidebar);
