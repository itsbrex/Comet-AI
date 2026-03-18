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

export function buildCleanPDFContent(rawContent: string, title: string, iconBase64: string | null): string {
  let text = rawContent.replace(INTERNAL_TAG_RE, '').trim();
  const looksLikeHTML = /<[a-z][\s\S]*?>/i.test(text);

  let bodyHTML: string;

  if (looksLikeHTML) {
    bodyHTML = text
      .replace(/>\s*</g, '>\n<')
      .replace(/<(h[1-6]|p|li|ul|ol|table|tr|thead|tbody|div|br\s*\/?)\b/gi, '\n<$1')
      .replace(/<\/(h[1-6]|p|li|ul|ol|table|tr|thead|tbody|div)>/gi, '</$1>\n');
  } else {
    const lines = text.split('\n');
    const htmlLines: string[] = [];
    let inList = false;

    for (const rawLine of lines) {
      let line = rawLine
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (/^#{1}\s/.test(line)) { if (inList) { htmlLines.push('</ul>'); inList = false; } htmlLines.push(`<h1>${line.replace(/^#+\s/, '')}</h1>`); continue; }
      if (/^#{2}\s/.test(line)) { if (inList) { htmlLines.push('</ul>'); inList = false; } htmlLines.push(`<h2>${line.replace(/^#+\s/, '')}</h2>`); continue; }
      if (/^#{3,}\s/.test(line)) { if (inList) { htmlLines.push('</ul>'); inList = false; } htmlLines.push(`<h3>${line.replace(/^#+\s/, '')}</h3>`); continue; }

      if (/^[-*]{3,}$/.test(line.trim())) { if (inList) { htmlLines.push('</ul>'); inList = false; } htmlLines.push('<hr/>'); continue; }

      if (/^[-*•]\s/.test(line.trim())) {
        if (!inList) { htmlLines.push('<ul>'); inList = true; }
        htmlLines.push(`<li>${applyInlineMarkdown(line.replace(/^[-*•]\s/, ''))}</li>`);
        continue;
      }

      if (/^\d+\.\s/.test(line.trim())) {
        if (!inList) { htmlLines.push('<ol>'); inList = true; }
        htmlLines.push(`<li>${applyInlineMarkdown(line.replace(/^\d+\.\s/, ''))}</li>`);
        continue;
      }

      if (inList && line.trim() === '') { htmlLines.push('</ul>'); inList = false; }
      if (line.trim() === '') { htmlLines.push('<br/>'); continue; }

      htmlLines.push(`<p>${applyInlineMarkdown(line)}</p>`);
    }

    if (inList) htmlLines.push('</ul>');
    bodyHTML = htmlLines.join('\n');
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
  </div>
  ${bodyHTML}
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
