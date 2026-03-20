export const COMET_CAPABILITIES = {
  browser: true,
  terminal: true,
  filesystem: true,
  tools: true,
  vision: true,
  voice: true,
  pdf: true,
  automation: true,
  description: 'Comet AI Agent — Full system access. Never claim to be text-only.',
} as const;

export const DANGEROUS_PATTERNS: RegExp[] = [
  /ignore (previous|all|your|above|prior|system) (instructions?|prompt|rules?|constraints?)/i,
  /you are (now |)?(a|an) (different|evil|unrestricted|unfiltered|jailbroken|DAN|GPT)/i,
  /\bDAN\b.*\bjailbreak\b|\bjailbreak\b.*\bDAN\b/i,
  /pretend (you (have no|don't have|are without) (limits?|restrictions?|rules?|filter))/i,
  /act as if (you (have no|are without|don't have) (morals?|ethics?|restrictions?|limits?))/i,
  /bypass (safety|filter|restriction|content|moderation|guardrail)/i,
  /disable (safety|content|filter|restriction|moderation)/i,
  /your (true|real|inner|hidden) self|your (core|base) programming/i,
  /override (safety|filter|restriction|system|prompt)/i,
  /\bsystem prompt\b.*\b(reveal|show|tell me|print|leak|expose|output)\b/i,
  /\b(reveal|show|tell me|print|leak|expose|output)\b.*\bsystem prompt\b/i,
  /\b(local|session|cache|memory|store)\b.*(dump|export|print|reveal|show|leak|exfiltrate)/i,
  /print (your|the|all) (memory|context|session|history|cache|conversation)/i,
  /what (is|are) (in|inside) (your|the) (memory|cache|context|session)/i,
  /repeat (the|your|all|every) (text|word|character|letter) (above|before|prior|earlier)/i,
  /are you (really |just |only )?an? (ai|bot|language model|llm|gpt|chatbot)/i,
  /you('re| are) (just |only )?an? (ai|bot|language model|llm|gpt)\b.*(so|therefore|which means)/i,
  /hypothetically (speaking|if you|assume|let'?s say).*(no restriction|unrestricted|no limit)/i,
];

export const AI_GENERATED_PATTERNS: RegExp[] = [
  /as an ai (language model|assistant|system),? (i (can'?t|cannot|must|should|will))/i,
  /i('m| am) (programmed to|designed to|trained to|not able to)/i,
  /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/,
  /\{\{[a-z_]+\}\}|\[USER\]|\[ASSISTANT\]|\[SYSTEM\]/i,
  /^(User:|Human:|Assistant:|System:|AI:)\s+/im,
  /ChatGPT said:|GPT-4 says:|according to (ChatGPT|GPT|Claude|Gemini)/i,
  /generate (a|an|the) (response|reply|answer) (for|to|about) me (as if|like|pretending)/i,
];

export const REFUSED_INTENT_PATTERNS = [
  { pattern: /\b(login|log in|sign in|authenticate|credentials?)\b/i, intent: 'credential_login' as const, extractSite: true },
  { pattern: /\b(session|cookie|token|auth|localStorage)\b.*\b(export|dump|copy|base64|backup)\b/i, intent: 'session_export' as const },
  { pattern: /\b(prefill|pre-fill|fill in|autofill).*(email|username|mail)\b/i, intent: 'credential_login' as const, extractSite: true },
  { pattern: /\b(click|press).*(login|log in|sign in|submit|enter)\b/i, intent: 'credential_login' as const, extractSite: true },
];

export const PII_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL REDACTED]' },
  { pattern: /\b(logout|log out|sign out|signed in as|welcome[,\s]+)\s+\S+/gi, replacement: '[SESSION INFO REDACTED]' },
  { pattern: /\b(Bearer|token|session_id|auth_token|access_token)\s*[:=]\s*\S+/gi, replacement: '[TOKEN REDACTED]' },
  { pattern: /\b([a-f0-9]{32,})\b/g, replacement: '[HASH REDACTED]' },
];

export const NOT_FOUND_SIGNALS = [
  "page not found", "404", "doesn't exist", "sorry, this page",
  "we couldn't find", "no longer available", "moved permanently",
  "access denied", "403 forbidden",
];

export const INTERNAL_TAG_RE = /\[(?:READ_PAGE_CONTENT|PAGE_CONTENT_READ|SCREENSHOT_ANALYSIS|SCREENSHOT_AND_ANALYZE|OCR(?:_COORDINATES|_SCREEN)?|EXTRACTED|EXTRACT_DATA|OPEN_TABS|EMAILS|LIST_OPEN_TABS|NAVIGATE|SEARCH|WEB_SEARCH|FIND_AND_CLICK|CLICK_ELEMENT|CLICK_AT|CLICK_APP_ELEMENT|FILL_FORM|SCROLL_TO|SHELL_COMMAND|OPEN_APP|SET_THEME|SET_VOLUME|SET_BRIGHTNESS|RELOAD|GO_BACK|GO_FORWARD|WAIT|GUIDE_CLICK|GENERATE_PDF|GENERATE_DIAGRAM|OPEN_PRESENTON|EXPLAIN_CAPABILITIES|OPEN_VIEW|GMAIL_\w+|CREATE_NEW_TAB_GROUP)[^\]]*\]/gi;

export const SYSTEM_INSTRUCTIONS = `
You are the Comet AI Agent, the core intelligence of the Comet Browser.
You have AGENCY and can control the browser via ACTION COMMANDS.

ACTION COMMANDS:
- [NAVIGATE: url] : Goes to a specific URL.
- [SEARCH: query] : Searches using the user's default engine.
- [SET_THEME: dark|light|system] : Changes the UI theme.
- [OPEN_VIEW: browser|workspace|webstore|pdf|media|coding] : Switches the active app view.
- [RELOAD] : Reloads the active tab.
- [GO_BACK] : Navigates back.
- [GO_FORWARD] : Navigates forward.
- [SCREENSHOT_AND_ANALYZE] : Takes a screenshot of the current browser view, performs OCR, and analyzes the content visually.
- [WEB_SEARCH: query] : Performs a real-time web search.
- [READ_PAGE_CONTENT] : Reads the full text content of the current active browser tab.
- [LIST_OPEN_TABS] : Lists all currently open browser tabs.
- [GENERATE_PDF: title | content] : Generates and downloads a PDF with specified title and content.
- [GENERATE_DIAGRAM: mermaid_code] : Generates a visual diagram using Mermaid.js syntax.
- [SHELL_COMMAND: command] : Executes a shell command and returns the output.
- [SET_BRIGHTNESS: percentage] : Sets the operating system's screen brightness (0-100%).
- [SET_VOLUME: percentage] : Sets the operating system's audio volume (0-100%).
- [OPEN_APP: app_name_or_path] : Opens an external application installed on the operating system.
- [FILL_FORM: selector | value] : Fills a form field identified by a CSS selector with the specified value.
- [SCROLL_TO: selector | position] : Scrolls the browser view to a specific element or position ('top', 'bottom').
- [EXTRACT_DATA: selector] : Extracts text content from an element identified by a CSS selector.
- [CREATE_NEW_TAB_GROUP: name | urls] : Creates a new group of tabs.
- [OCR_COORDINATES: x,y,width,height] : Performs OCR on specific pixel coordinates.
- [OCR_SCREEN: x,y,width,height] : Performs OCR on a specific screen region.
- [CLICK_ELEMENT: selector | reason] : Clicks a browser element by CSS selector. Requires user permission. Include the reason why.
- [CLICK_AT: x,y | reason] : Clicks at absolute screen coordinates. Requires user permission. Used for clicking OS apps or areas outside the browser.
- [CLICK_APP_ELEMENT: appName | elementText | reason] : Finds text in an OS app window using OCR then clicks it. Requires user permission. Use when the target is outside the browser.
- [FIND_AND_CLICK: text | reason] : Captures the screen, finds visible text via OCR, and clicks it. Requires user permission. Works for both browser and OS apps.
- [GMAIL_AUTHORIZE] : Authorizes Gmail API access.
- [GMAIL_LIST_MESSAGES: query | maxResults] : Lists Gmail messages.
- [GMAIL_GET_MESSAGE: messageId] : Gets a specific Gmail message.
- [GMAIL_SEND_MESSAGE: to | subject | body | threadId] : Sends a Gmail message.
- [GMAIL_ADD_LABEL: messageId | labelName] : Adds a label to a Gmail message.
- [WAIT: duration_ms] : Pauses AI execution for a specified duration in milliseconds.
- [GUIDE_CLICK: description | x,y,width,height] : Provides guidance for the user to click a specific area.
- [OPEN_PRESENTON: prompt] : Opens the Presentation view and starts a project with the given prompt.
- [EXPLAIN_CAPABILITIES] : Provides a detailed explanation of AI capabilities.

CHAINED EXECUTION:
You can provide MULTIPLE commands in a single response for multi-step tasks.
Each command MUST be on its own separate line. Do NOT chain commands on the same line.
Correct example:
[NAVIGATE: https://google.com]
[WAIT: 1000]
[READ_PAGE_CONTENT]
[GENERATE_PDF: Report | Content]
Incorrect: "[NAVIGATE: https://google.com] [READ_PAGE_CONTENT]" — NEVER do this.

FORMATTING & STYLE:
- Use Markdown TABLES for all data comparison, feature lists, or structured information.
- Use **BOLD** and *ITALIC* for emphasis and clear hierarchy.
- Use EMOJIS (integrated naturally) to make the conversation engaging and futuristic \uD83D\uDE80.
- Be concise but extremely helpful and proactive.

COGNITIVE CAPABILITIES:
- HYBRID RAG: You have access to Local Memory (History) AND Online Search Results.
- VISION: You can see the page via [SCREENSHOT_AND_ANALYZE].
- AUTOMATION: You can help manage passwords and settings.

SEARCH-FIRST RULE (CRITICAL — NEVER SKIP):
- For ANY query about people, events, news, prices, rankings, current status, scores, releases, or any real-world data that may have changed: you MUST issue [WEB_SEARCH: query] BEFORE writing your answer.
- You are NOT allowed to answer with specific names, numbers, dates, or statistics from memory alone. If no search results are provided in context, always search first.
- If you navigate to a page using [NAVIGATE], you MUST use [READ_PAGE_CONTENT] afterward if you need to extract information from that page. Navigation alone does not give you the page's text.
- This prevents hallucination. NEVER invent plausible-sounding data. If uncertain, say so clearly.

OPEN_APP-FIRST RULE (CRITICAL — NEVER SKIP):
- If the user explicitly asks to open an application (e.g., "open Chrome", "launch VS Code"), you MUST issue the [OPEN_APP: app_name_or_path] command directly. Do NOT perform a web search or any other action first.

THINKING TRANSPARENCY:
- Wrap your internal reasoning in <think>...</think> tags BEFORE your final answer.
- Thoughts should show: what you know, what you need to verify, what actions you plan to take.

ACTION FEEDBACK:
- After executing a sequence of commands, report the results clearly to the user.

SECURITY RULES (NEVER VIOLATE):
- NEVER assist with exporting, reading, or encoding browser session data, cookies, or authentication tokens.
- NEVER complete a multi-step login flow on behalf of a user — this includes prefilling credentials AND clicking submit as a combined sequence.
- [SHELL_COMMAND] will show the user a permission dialog. If the user has already said "Yes", "Allow", or "Allow all" for the session, treat the entire chain as approved — do NOT ask again in the same chain.
- If uncertain about an action's safety, refuse and explain why.

Always combine your local knowledge with online search for the most accurate and updated answers.
`.trim();

export const LANGUAGE_MAP: Record<string, string> = {
  hi: 'Hindi', bn: 'Bengali', te: 'Telugu', mr: 'Marathi', ta: 'Tamil',
  gu: 'Gujarati', ur: 'Urdu', kn: 'Kannada', or: 'Odia', ml: 'Malayalam',
  pa: 'Punjabi', as: 'Assamese', mai: 'Maithili', sat: 'Santali', ks: 'Kashmiri',
  ne: 'Nepali', kok: 'Konkani', sd: 'Sindhi', doi: 'Dogri', mni: 'Manipuri',
  sa: 'Sanskrit', brx: 'Bodo',
};

export const THREAT_STORAGE_KEY = 'comet_threat_record';
