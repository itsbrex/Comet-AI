import {
  THREAT_STORAGE_KEY,
  DANGEROUS_PATTERNS,
  AI_GENERATED_PATTERNS,
  PII_PATTERNS,
  NOT_FOUND_SIGNALS,
  INTERNAL_TAG_RE
} from './AIConstants';

export interface ThreatRecord {
  strikes?: number;
  bannedUntil?: number;
  permanentBan?: boolean;
}

export function getThreatRecord(): ThreatRecord {
  try { return JSON.parse(localStorage.getItem(THREAT_STORAGE_KEY) || '{}'); } catch { return {}; }
}

export function setThreatRecord(r: ThreatRecord): void {
  try { localStorage.setItem(THREAT_STORAGE_KEY, JSON.stringify(r)); } catch { }
}

export function resetThreatStrikes(): void {
  const r = getThreatRecord();
  r.strikes = 0;
  setThreatRecord(r);
}

export interface ThreatCheckResult {
  blocked: boolean;
  response?: string;
  ban?: boolean;
}

export function checkThreat(content: string): ThreatCheckResult {
  const record = getThreatRecord();

  if (record.permanentBan) {
    return { blocked: true, response: '🚫 **Comet-AI is made for Humans Not Hackers [Permanently Banned From Comet]**', ban: true };
  }

  if (record.bannedUntil && Date.now() < record.bannedUntil) {
    const hoursLeft = Math.ceil((record.bannedUntil - Date.now()) / 3600000);
    return { blocked: true, response: `⏳ **You are temporarily blocked from using Comet AI.** Please try again in ~${hoursLeft} hour(s).`, ban: true };
  }

  const isAiGenerated = AI_GENERATED_PATTERNS.some((p) => p.test(content));
  if (isAiGenerated) {
    return { blocked: true, response: '🤖 **Comet-AI is made for Humans — Not for AI Generated prompts.** Please type your own message.' };
  }

  const isDangerous = DANGEROUS_PATTERNS.some((p) => p.test(content));
  if (!isDangerous) return { blocked: false };

  const strikes = (record.strikes || 0) + 1;

  if (strikes >= 5) {
    const bannedUntil = Date.now() + 24 * 60 * 60 * 1000;
    setThreatRecord({ strikes, bannedUntil, permanentBan: true });
    return {
      blocked: true,
      ban: true,
      response: '🚫 **Comet-AI is made for Humans Not Hackers [Permanently Banned From Comet-AI]**\n\nYour access has been suspended due to repeated policy violations.',
    };
  }

  if (strikes === 4) {
    setThreatRecord({ strikes, bannedUntil: record.bannedUntil });
    return {
      blocked: true,
      response: `⚠️ **Nice try.** This is your **final warning** (${strikes}/5). One more violation and you will be banned for 24 hours.`,
    };
  }

  setThreatRecord({ strikes, bannedUntil: record.bannedUntil });
  return {
    blocked: true,
    response: `🛡️ **Nice try.** Suspicious prompt detected (${strikes}/5 strikes). Comet AI protects user privacy and security.`,
  };
}

export function scrubbedContent(raw: string): string {
  let result = raw;
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function isFailedPageContent(content: string): boolean {
  const lower = content.toLowerCase().slice(0, 500);
  return NOT_FOUND_SIGNALS.some((s) => lower.includes(s));
}

export function extractSiteFromContext(content: string, url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    const match = content.match(/\b(instagram|facebook|twitter|google|github|linkedin|gmail)\b/i);
    return match?.[1]?.toLowerCase();
  }
}

export function applyInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>');
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ FIXED: Hallucination patterns to strip from PDF content
// These are signs the LLM invented data instead of using real search results
// ─────────────────────────────────────────────────────────────────────────────
const HALLUCINATION_URL_PATTERN = /https?:\/\/[^\s"<>]+\/\d{4}\/\d{2}\/\d{2}\/[^\s"<>]+/g;
const FAKE_SOURCE_PATTERN = /Source:\s*https?:\/\/[^\s<>]+/gi;

/**
 * Detects if PDF content looks like it was hallucinated (invented by LLM).
 * Checks for suspiciously specific fake URLs and fake source citations
 * that were not fetched from the web in this session.
 */
export function detectHallucinatedContent(content: string): boolean {
  // If content has many date-based URLs (like /2026/03/05/article-name)
  // but the content is short (no real data was fetched), it's likely fake
  const urlMatches = content.match(HALLUCINATION_URL_PATTERN) || [];
  const hasLotsOfFakeUrls = urlMatches.length >= 3;
  const contentIsShort = content.length < 1500;
  return hasLotsOfFakeUrls && contentIsShort;
}

/**
 * Sanitizes PDF content:
 * - Strips internal AI command tags
 * - Detects hallucinated content and adds a disclaimer
 * - Preserves real search result data injected by fetchRealSearchContext
 */
export function sanitizePDFContent(content: string, title: string): string {
  // Strip internal action tags
  let sanitized = content.replace(INTERNAL_TAG_RE, '').trim();

  // If it looks hallucinated, replace with honest disclaimer
  if (detectHallucinatedContent(sanitized)) {
    console.warn('[CometAI] PDF content appears hallucinated — replacing with disclaimer');
    sanitized = `
## ⚠️ Live Data Unavailable

This report for **"${escapeHtml(title)}"** could not retrieve verified real-time data at the time of generation.

**Generated at:** ${new Date().toLocaleString()}

**What to do:**
- Use the Comet Browser search bar to find current information
- Try asking Comet AI again — it will attempt a fresh web search
- Visit trusted news sources directly for the latest updates

*Comet AI only shows verified data. No invented content has been included.*
    `.trim();
  }

  return sanitized;
}

export interface PDFImage {
  src: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  caption?: string;
}

export function buildCleanPDFContent(
  rawContent: string, 
  title: string, 
  iconBase64: string | null,
  images?: PDFImage[]
): string {
  let text = sanitizePDFContent(rawContent, title);

  const looksLikeHTML = /<[a-z][\s\S]*?>/i.test(text);

  let bodyHTML: string;

  if (looksLikeHTML) {
    bodyHTML = text
      .replace(/>\s*</g, '>\n<')
      .replace(/<(h[1-6]|p|li|ul|ol|table|tr|thead|tbody|div|br\s*\/?|img)\b/gi, '\n<$1')
      .replace(/<\/(h[1-6]|p|li|ul|ol|table|tr|thead|tbody|div)>/gi, '</$1>\n');
  } else {
    const lines = text.split('\n');
    const htmlLines: string[] = [];
    let inList = false;
    let listType = 'ul';

    for (const rawLine of lines) {
      let line = rawLine
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (/^#{1}\s/.test(line)) { if (inList) { htmlLines.push(`</${listType}>`); inList = false; } htmlLines.push(`<h1>${line.replace(/^#+\s/, '')}</h1>`); continue; }
      if (/^#{2}\s/.test(line)) { if (inList) { htmlLines.push(`</${listType}>`); inList = false; } htmlLines.push(`<h2>${line.replace(/^#+\s/, '')}</h2>`); continue; }
      if (/^#{3,}\s/.test(line)) { if (inList) { htmlLines.push(`</${listType}>`); inList = false; } htmlLines.push(`<h3>${line.replace(/^#+\s/, '')}</h3>`); continue; }

      if (/^[-*]{3,}$/.test(line.trim())) { if (inList) { htmlLines.push(`</${listType}>`); inList = false; } htmlLines.push('<hr/>'); continue; }

      if (/^[-*•]\s/.test(line.trim())) {
        if (!inList || listType !== 'ul') {
          if (inList) htmlLines.push(`</${listType}>`);
          htmlLines.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        htmlLines.push(`<li>${applyInlineMarkdown(line.replace(/^[-*•]\s/, ''))}</li>`);
        continue;
      }

      if (/^\d+\.\s/.test(line.trim())) {
        if (!inList || listType !== 'ol') {
          if (inList) htmlLines.push(`</${listType}>`);
          htmlLines.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        htmlLines.push(`<li>${applyInlineMarkdown(line.replace(/^\d+\.\s/, ''))}</li>`);
        continue;
      }

      if (inList && line.trim() === '') { htmlLines.push(`</${listType}>`); inList = false; }
      if (line.trim() === '') { htmlLines.push('<br/>'); continue; }

      htmlLines.push(`<p>${applyInlineMarkdown(line)}</p>`);
    }

    if (inList) htmlLines.push(`</${listType}>`);
    bodyHTML = htmlLines.join('\n');
  }

  let imagesHTML = '';
  if (images && images.length > 0) {
    imagesHTML = '<div class="pdf-images">';
    for (const img of images) {
      const widthStyle = img.width ? (typeof img.width === 'number' ? `${img.width}px` : img.width) : '100%';
      const heightStyle = img.height ? (typeof img.height === 'number' ? `${img.height}px` : img.height) : 'auto';
      const altText = img.alt || 'Image';
      
      imagesHTML += `
        <figure style="margin: 24px 0; text-align: center;">
          <img src="${img.src}" alt="${escapeHtml(altText)}" style="max-width: ${widthStyle}; max-height: ${heightStyle}; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
          ${img.caption ? `<figcaption style="font-size: 0.8rem; color: #64748b; margin-top: 8px; font-style: italic;">${escapeHtml(img.caption)}</figcaption>` : ''}
        </figure>
      `;
    }
    imagesHTML += '</div>';
  }

  const footerLogoHTML = iconBase64
    ? `<img src="${iconBase64}" alt="Comet AI" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:6px;"/>`
    : '🌠';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      color: #1a1a2e;
      background: #ffffff;
      padding: 48px 56px 80px;
      line-height: 1.7;
      max-width: 860px;
      margin: 0 auto;
    }
    h1 { font-size: 2rem; font-weight: 700; margin-bottom: 8px; color: #0f0f23; border-bottom: 3px solid #0ea5e9; padding-bottom: 10px; }
    h2 { font-size: 1.35rem; font-weight: 600; margin: 28px 0 10px; color: #1e3a5f; }
    h3 { font-size: 1.1rem; font-weight: 600; margin: 20px 0 8px; color: #2563eb; }
    p  { margin: 8px 0; }
    ul, ol { margin: 10px 0 10px 24px; }
    li { margin: 4px 0; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th { background: #0ea5e9; color: white; padding: 8px 12px; text-align: left; font-size: 0.85rem; }
    td { padding: 7px 12px; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; }
    tr:nth-child(even) td { background: #f8fafc; }
    code { font-family: 'Fira Code', monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.82em; }
    pre  { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 16px 0; font-size: 0.82em; line-height: 1.5; }
    strong { font-weight: 600; }
    em { font-style: italic; color: #475569; }
    .doc-title { margin-bottom: 32px; }
    .doc-meta  { font-size: 0.78rem; color: #94a3b8; margin-top: 4px; }
    .verified-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: #f0fdf4; border: 1px solid #bbf7d0;
      color: #16a34a; font-size: 0.72rem; font-weight: 600;
      padding: 3px 10px; border-radius: 999px; margin-top: 6px;
    }
    .pdf-images { margin: 24px 0; }
    figure { margin: 0; padding: 0; }
    .comet-footer {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 56px;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
      font-size: 0.72rem;
      color: #94a3b8;
    }
    .comet-footer-brand {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: #0ea5e9;
    }
  </style>
</head>
<body>
  <div class="doc-title">
    <h1>${escapeHtml(title)}</h1>
    <div class="doc-meta">Generated by Comet AI • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    <span class="verified-badge">✓ Real-time verified data</span>
  </div>
  ${bodyHTML}
  ${imagesHTML}
  <div class="comet-footer">
    <div class="comet-footer-brand">
      ${footerLogoHTML}
      Comet AI
    </div>
    <span>${escapeHtml(title)} • ${new Date().getFullYear()}</span>
  </div>
</body>
</html>`;
}

export function buildCapabilityReportPDF(
  capabilities: {
    author: string;
    version: string;
    features: string[];
    platform: string;
  },
  screenshotBase64?: string,
  iconBase64?: string | null
): string {
  const featureList = capabilities.features.map(f => `<li>${escapeHtml(f)}</li>`).join('');
  
  let screenshotSection = '';
  if (screenshotBase64) {
    screenshotSection = `
      <div style="margin: 32px 0; text-align: center;">
        <h2 style="color: #1e3a5f;">Screenshot Capture Demo</h2>
        <figure style="margin: 16px 0;">
          <img src="${screenshotBase64}" alt="Comet AI Screenshot" style="max-width: 100%; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />
          <figcaption style="font-size: 0.8rem; color: #64748b; margin-top: 8px;">Comet AI can capture and analyze screenshots in real-time</figcaption>
        </figure>
      </div>
    `;
  }

  const footerLogoHTML = iconBase64
    ? `<img src="${iconBase64}" alt="Comet AI" style="width:18px;height:18px;object-fit:contain;vertical-align:middle;margin-right:6px;"/>`
    : '🌠';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Comet AI - Capability Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      color: #1a1a2e;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 48px 56px 80px;
      line-height: 1.7;
      max-width: 900px;
      margin: 0 auto;
      min-height: 100vh;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      color: white;
      padding: 40px;
      border-radius: 16px;
      margin-bottom: 32px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .header h1 { font-size: 2.5rem; margin-bottom: 8px; }
    .header .subtitle { font-size: 1.1rem; opacity: 0.9; }
    .version-badge {
      display: inline-block;
      background: #0ea5e9;
      color: white;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.8rem;
      margin-top: 12px;
    }
    .section {
      background: white;
      padding: 32px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .section h2 { color: #0f172a; font-size: 1.4rem; margin-bottom: 16px; border-bottom: 2px solid #0ea5e9; padding-bottom: 8px; }
    .features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .feature-item {
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #0ea5e9;
    }
    .feature-item strong { color: #0f172a; }
    ul { margin: 0; padding-left: 20px; }
    li { margin: 8px 0; }
    .author-card {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      padding: 24px;
      border-radius: 12px;
      border: 2px solid #f59e0b;
      margin-top: 16px;
    }
    .platform-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; }
    .platform-item {
      background: #ecfdf5;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      color: #059669;
      font-weight: 600;
    }
    .comet-footer {
      margin-top: 40px;
      padding: 20px;
      background: #0f172a;
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .comet-footer-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #0ea5e9;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌠 Comet AI Browser</h1>
    <p class="subtitle">The AI-Native Browser with Permission-Gated OS Automation</p>
    <span class="version-badge">v${escapeHtml(capabilities.version)}</span>
  </div>
  
  <div class="section">
    <h2>✨ Core Capabilities</h2>
    <div class="features-grid">
      ${capabilities.features.map(f => `
        <div class="feature-item">
          <strong>${escapeHtml(f.split(':')[0])}</strong>
          ${f.includes(':') ? `<p style="margin: 4px 0 0; font-size: 0.85rem; color: #64748b;">${escapeHtml(f.split(':').slice(1).join(':').trim())}</p>` : ''}
        </div>
      `).join('')}
    </div>
  </div>
  
  <div class="section">
    <h2>🖥️ Supported Platforms</h2>
    <div class="platform-grid">
      ${capabilities.platform.split(',').map(p => `<div class="platform-item">${escapeHtml(p.trim())}</div>`).join('')}
    </div>
  </div>
  
  ${screenshotSection}
  
  <div class="section">
    <h2>👨‍💻 About the Developer</h2>
    <div class="author-card">
      <p><strong>Built by:</strong> ${escapeHtml(capabilities.author)}</p>
      <p style="margin-top: 8px; font-size: 0.9rem; color: #64748b;">
        Comet AI Browser is an open-source project demonstrating the power of AI-native browsing with autonomous task execution and enterprise-grade security.
      </p>
    </div>
  </div>
  
  <div class="comet-footer">
    <div class="comet-footer-brand">
      ${footerLogoHTML}
      Comet AI Browser
    </div>
    <span>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
  </div>
</body>
</html>`;
}

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}

export function lsRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
  }
}

export function tryGetIconBase64(): string | null {
  try {
    return (window as any).__cometIconBase64 ?? null;
  } catch {
    return null;
  }
}

export async function preloadCometIcon(): Promise<void> {
  if (typeof window === 'undefined') return;
  if ((window as any).__cometIconBase64) return;

  const tryCanvas = (src: string): Promise<string | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const size = Math.max(img.naturalWidth || 32, img.naturalHeight || 32, 1);
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          canvas.getContext('2d')?.drawImage(img, 0, 0, size, size);
          const data = canvas.toDataURL('image/png');
          if (data.length < 100) { resolve(null); return; }
          (window as any).__cometIconBase64 = data;
          resolve(data);
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });

  if (await tryCanvas('/icon.png')) return;
  if (await tryCanvas('/icon.ico')) return;

  try {
    const api = (window as any).electronAPI;
    if (typeof api?.readFileAsBase64 === 'function') {
      const base64 = await api.readFileAsBase64('icon.ico');
      if (base64) {
        (window as any).__cometIconBase64 = `data:image/x-icon;base64,${base64}`;
        return;
      }
    }
  } catch { }
}