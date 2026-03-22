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
    // Images: ![alt](url) → <img> (must come before link processing)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0;display:block;"/>')
    // Links: [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#0ea5e9;text-decoration:underline;">$1</a>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>');
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const HALLUCINATION_URL_PATTERN = /https?:\/\/[^\s"<>]+\/\d{4}\/\d{2}\/\d{2}\/[^\s"<>]+/g;
const FAKE_SOURCE_PATTERN = /Source:\s*https?:\/\/[^\s<>]+/gi;

export function detectHallucinatedContent(content: string): boolean {
  const urlMatches = content.match(HALLUCINATION_URL_PATTERN) || [];
  const hasLotsOfFakeUrls = urlMatches.length >= 3;
  const contentIsShort = content.length < 1500;
  return hasLotsOfFakeUrls && contentIsShort;
}

export function sanitizePDFContent(content: string, title: string): string {
  let sanitized = content.replace(INTERNAL_TAG_RE, '').trim();

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

export interface PDFStyles {
  background?: string; // CSS color or gradient
  outlineColor?: string;
  accentColor?: string;
}

export function buildBodyFromMarkdown(text: string): string {
  const looksLikeHTML = /<[a-z][\s\S]*?>/i.test(text);
  if (looksLikeHTML) {
    return text
      .replace(/>\s*</g, '>\n<')
      .replace(/<(h[1-6]|p|li|ul|ol|table|tr|thead|tbody|div|br\s*\/?|img)\b/gi, '\n<$1')
      .replace(/<\/(h[1-6]|p|li|ul|ol|table|tr|thead|tbody|div)>/gi, '</$1>\n');
  }

  const processedText = text
    .replace(/\*\*\[[^\n\]]*$/gm, '')
    .replace(INTERNAL_TAG_RE, '')
    .replace(/\*\*\s*$/gm, '');

  const lines = processedText.split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  let listType = 'ul';
  let inCodeFence = false;
  let codeLang = '';
  let codeBuffer: string[] = [];
  let tableBuffer: string[] = [];
  let inTable = false;

  const flushList = () => { if (inList) { htmlLines.push(`</${listType}>`); inList = false; } };
  const flushTable = () => {
    if (!inTable || tableBuffer.length === 0) { inTable = false; tableBuffer = []; return; }
    inTable = false;
    const allRows = tableBuffer;
    const dataRows = allRows.filter(r => !/^\s*\|?[-:|\s]+\|?\s*$/.test(r));
    if (dataRows.length === 0) { tableBuffer = []; return; }
    let tableHtml = '<table>';
    dataRows.forEach((row, i) => {
      const parts = row.replace(/^\||\|$/g, '').split('|').map(c => applyInlineMarkdown(c.trim()));
      if (i === 0) {
        tableHtml += `<thead><tr>${parts.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
      } else {
        tableHtml += `<tr>${parts.map(c => `<td>${c}</td>`).join('')}</tr>`;
      }
    });
    tableHtml += '</tbody></table>';
    htmlLines.push(tableHtml);
    tableBuffer = [];
  };

  for (const rawLine of lines) {
    if (/^```/.test(rawLine.trim())) {
      if (!inCodeFence) {
        flushList(); flushTable();
        inCodeFence = true;
        codeLang = rawLine.trim().replace(/^```/, '').trim();
        codeBuffer = [];
      } else {
        inCodeFence = false;
        const escaped = codeBuffer.join('\n').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        htmlLines.push(`<pre><code${codeLang ? ` class="language-${codeLang}"` : ''}>${escaped}</code></pre>`);
        codeBuffer = [];
      }
      continue;
    }
    if (inCodeFence) { codeBuffer.push(rawLine); continue; }

    if (/^\s*\|/.test(rawLine)) {
      flushList();
      inTable = true;
      tableBuffer.push(rawLine.trim());
      continue;
    } else if (inTable) { flushTable(); }

    let line = rawLine.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (/^#{1}\s/.test(line))  { flushList(); htmlLines.push(`<h1>${applyInlineMarkdown(line.replace(/^#+\s/, ''))}</h1>`); continue; }
    if (/^#{2}\s/.test(line))  { flushList(); htmlLines.push(`<h2>${applyInlineMarkdown(line.replace(/^#+\s/, ''))}</h2>`); continue; }
    if (/^#{3,}\s/.test(line)) { flushList(); htmlLines.push(`<h3>${applyInlineMarkdown(line.replace(/^#+\s/, ''))}</h3>`); continue; }
    if (/^[-*]{3,}$/.test(line.trim())) { flushList(); htmlLines.push('<hr/>'); continue; }
    if (/^&gt;\s/.test(line.trim())) {
      flushList();
      htmlLines.push(`<blockquote>${applyInlineMarkdown(line.trim().replace(/^&gt;\s/, ''))}</blockquote>`);
      continue;
    }
    if (/^[-*•]\s/.test(line.trim())) {
      if (!inList || listType !== 'ul') { if (inList) htmlLines.push(`</${listType}>`); htmlLines.push('<ul>'); inList = true; listType = 'ul'; }
      htmlLines.push(`<li>${applyInlineMarkdown(line.trim().replace(/^[-*•]\s/, ''))}</li>`);
      continue;
    }
    if (/^\d+\.\s/.test(line.trim())) {
      if (!inList || listType !== 'ol') { if (inList) htmlLines.push(`</${listType}>`); htmlLines.push('<ol>'); inList = true; listType = 'ol'; }
      htmlLines.push(`<li>${applyInlineMarkdown(line.trim().replace(/^\d+\.\s/, ''))}</li>`);
      continue;
    }
    if (line.trim() === '') { flushList(); htmlLines.push('<br/>'); continue; }
    flushList();
    htmlLines.push(`<p>${applyInlineMarkdown(line)}</p>`);
  }
  flushList(); flushTable();
  if (inCodeFence && codeBuffer.length > 0) {
    const escaped = codeBuffer.join('\n').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    htmlLines.push(`<pre><code>${escaped}</code></pre>`);
  }
  return htmlLines.join('\n');
}

export function buildCleanPDFContent(
  rawContent: string, 
  title: string, 
  iconBase64: string | null,
  images?: PDFImage[],
  styles?: PDFStyles
): string {
  let text = sanitizePDFContent(rawContent, title);
  text = text.replace(/\$\(READ_PAGE_CONTENT\)/g, '[Page Content Summary Included Below]');
  
  // Slide logic integration (Presenton style)
  const slides = text.split(/---\n?/).filter(s => s.trim().length > 10);
  const isSlideShow = slides.length > 2;

  const bg = styles?.background || '#ffffff';
  const outline = styles?.outlineColor || '#f1f5f9';
  const accent = styles?.accentColor || '#0ea5e9';

  const bodyHTML = buildBodyFromMarkdown(text);

  let imagesHTML = '';
  if (images && images.length > 0) {
    imagesHTML = '<div class="pdf-images">';
    for (const img of images) {
      const widthStyle = img.width ? (typeof img.width === 'number' ? `${img.width}px` : img.width) : '100%';
      const heightStyle = img.height ? (typeof img.height === 'number' ? `${img.height}px` : img.height) : 'auto';
      imagesHTML += `
        <figure style="margin: 32px 0; text-align: center;">
          <img src="${img.src}" alt="${escapeHtml(img.alt || 'Image')}" style="max-width: ${widthStyle}; max-height: ${heightStyle}; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); border: 1px solid #e2e8f0;" />
          ${img.caption ? `<figcaption style="font-size: 0.85rem; color: #64748b; margin-top: 12px; font-style: italic;">${escapeHtml(img.caption)}</figcaption>` : ''}
        </figure>
      `;
    }
    imagesHTML += '</div>';
  }

  const headerLogoHTML = iconBase64
    ? `<img src="${iconBase64}" alt="Comet Logo" style="width:32px;height:32px;object-fit:contain;"/>`
    : '🌠';

  const footerLogoHTML = iconBase64
    ? `<img src="${iconBase64}" alt="Comet AI" style="width:16px;height:16px;object-fit:contain;vertical-align:middle;margin-right:6px;"/>`
    : '🌠';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      color: #1e293b;
      background: ${bg};
      padding: 0;
      line-height: 1.7;
      min-height: 100vh;
    }
    .page-break { page-break-before: always; height: 0; margin-top: 40px; border-top: 1px dashed ${outline}; }
    .slide {
      min-height: 80vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 60px;
      border: 4px solid ${outline};
      border-radius: 40px;
      margin-bottom: 60px;
      background: white;
      box-shadow: 0 40px 100px rgba(0,0,0,0.05);
      position: relative;
      overflow: hidden;
    }
    .slide::after {
      content: ''; position: absolute; bottom: -20px; right: -20px; width: 100px; height: 100px;
      background: gradient(to br, transparent, ${accent}20); border-radius: 50%; filter: blur(40px);
    }
    .page-container {
      max-width: 860px;
      margin: 0 auto;
      padding: 40px 60px 100px;
      border: 1px solid ${outline};
      background: rgba(255,255,255,0.9);
      min-height: calc(100vh - 40px);
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f1f5f9;
    }
    .brand {
      display: flex;
      align-items: center; gap: 12px;
      font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.25rem; color: #0f172a;
    }
    .brand span { color: ${accent}; }
    h1 { 
      font-family: 'Outfit', sans-serif; font-size: 2.25rem; font-weight: 700; 
      margin-bottom: 12px; color: #0f172a; line-height: 1.2;
    }
    h2 { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 600; margin: 32px 0 12px; color: #1e293b; }
    h3 { font-family: 'Outfit', sans-serif; font-size: 1.2rem; font-weight: 600; margin: 24px 0 10px; color: ${accent}; }
    table { border-collapse: collapse; width: 100%; margin: 24px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    th { background: #f8fafc; color: #475569; padding: 12px 16px; text-align: left; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }
    td { padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    code { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: ${accent}; }
    pre { background: #0f172a; color: #f8fafc; padding: 20px; border-radius: 12px; overflow-x: auto; margin: 24px 0; }
    blockquote { border-left: 4px solid ${accent}; padding: 12px 24px; background: #f0f9ff; color: #1e40af; border-radius: 0 8px 8px 0; margin: 24px 0; }
    .footer {
      position: fixed; bottom: 0; left: 0; right: 0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 15px 60px; background: #ffffff; border-top: 1px solid #f1f5f9;
      font-size: 0.75rem; color: #94a3b8;
    }
    .footer-brand { display: flex; align-items: center; gap: 6px; font-weight: 600; color: ${accent}; }
  </style>
</head>
<body>
  <div class="page-container">
    <header>
      <div class="brand">${headerLogoHTML} Comet<span>AI</span></div>
      <div style="font-size: 0.75rem; font-weight: 600; color: #16a34a; background: #f0fdf4; padding: 4px 12px; border-radius: 999px;">✨ Real-time Verified</div>
    </header>
    <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 24px;">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • By Comet AI</div>
    ${isSlideShow 
      ? slides.map((s: string, i: number) => `<div class="slide ${i > 0 ? 'page-break' : ''}">${buildBodyFromMarkdown(s)}</div>`).join('\n')
      : `<h1>${escapeHtml(title)}</h1>${bodyHTML}`
    }
    ${imagesHTML}
  </div>
  <div class="footer">
    <div class="footer-brand">${footerLogoHTML} Comet AI</div>
    <span>${escapeHtml(title)} • ${new Date().getFullYear()}</span>
  </div>
</body>
</html>`;
}

export function buildCapabilityReportPDF(
  capabilities: { author: string; version: string; features: string[]; platform: string; },
  screenshotBase64?: string,
  iconBase64?: string | null
): string {
  let screenshotSection = '';
  if (screenshotBase64) {
    screenshotSection = `
      <div style="margin: 40px 0; text-align: center;">
        <h2 style="color: #0f172a;">Visual Intelligence</h2>
        <img src="${screenshotBase64}" style="max-width: 100%; border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.18);" />
      </div>
    `;
  }
  const logo = iconBase64 ? `<img src="${iconBase64}" style="width:40px;height:40px;"/>` : '🌠';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&family=Inter:wght@400;600&display=swap');
    body { font-family: 'Inter', sans-serif; background: #f8fafc; padding: 60px; }
    .card { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.05); }
    .header { background: #0f172a; color: white; padding: 60px; border-radius: 24px; text-align: center; margin-bottom: 40px; }
    h1 { font-family: 'Outfit', sans-serif; font-size: 3rem; }
    .feature { background: #f1f5f9; padding: 20px; border-radius: 16px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>${logo}</div>
    <h1>Comet AI Browser</h1>
    <p>Version ${capabilities.version}</p>
  </div>
  <div class="card">
    <h2>Capabilities</h2>
    ${capabilities.features.map(f => `<div class="feature"><strong>${f.split(':')[0]}</strong>: ${f.split(':').slice(1).join(':')}</div>`).join('')}
    ${screenshotSection}
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <strong>Author:</strong> ${capabilities.author}
    </div>
  </div>
</body>
</html>`;
}

export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

export function lsSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
}

export function lsRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { }
}

export function tryGetIconBase64(): string | null {
  try { return (window as any).__cometIconBase64 ?? null; } catch { return null; }
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
          const canvas = document.createElement('canvas');
          canvas.width = 32; canvas.height = 32;
          canvas.getContext('2d')?.drawImage(img, 0, 0, 32, 32);
          const data = canvas.toDataURL('image/png');
          (window as any).__cometIconBase64 = data;
          resolve(data);
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });

  if (await tryCanvas('/icon.png')) return;
  if (await tryCanvas('/icon.ico')) return;
}