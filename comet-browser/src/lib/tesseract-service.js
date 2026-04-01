const { desktopCapturer, screen } = require('electron');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const os = require('os');

let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('[TesseractService] sharp not available, preprocessing disabled:', e.message);
}

class TesseractOcrService {
  constructor() {
    this.worker = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized && this.worker) return;
    try {
      this.worker = await createWorker('eng');
      this.initialized = true;
      console.log('[TesseractService] Worker initialized');
    } catch (e) {
      console.error('[TesseractService] Failed to init worker:', e.message);
      this.worker = null;
      this.initialized = false;
      throw e;
    }
  }

  async terminate() {
    if (this.worker) {
      try { await this.worker.terminate(); } catch (e) {}
      this.worker = null;
      this.initialized = false;
    }
  }

  async captureScreen(displayId) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const scaleFactor = primaryDisplay.scaleFactor || 1;
    const { width, height } = primaryDisplay.size;
    const thumbnailSize = {
      width: Math.min(4096, Math.round(width * scaleFactor)),
      height: Math.min(4096, Math.round(height * scaleFactor)),
    };

    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize });
    const source = displayId
      ? sources.find(s => s.display_id === String(displayId)) || sources[0]
      : sources[0];

    if (!source || !source.thumbnail) {
      throw new Error('Could not capture screen');
    }

    return {
      png: source.thumbnail.toPNG(),
      scaleFactor,
      captureWidth: thumbnailSize.width,
      captureHeight: thumbnailSize.height,
      screenWidth: width,
      screenHeight: height,
    };
  }

  async preprocessImage(pngBuffer) {
    if (!sharp) return pngBuffer;

    try {
      return await sharp(pngBuffer)
        .grayscale()
        .normalize()
        .sharpen({ sigma: 1.5 })
        .resize({ width: 3840, kernel: 'lanczos3' })
        .png()
        .toBuffer();
    } catch (e) {
      console.warn('[TesseractService] Preprocessing failed, using raw image:', e.message);
      return pngBuffer;
    }
  }

  async captureAndOcr(displayId) {
    await this.init();

    const capture = await this.captureScreen(displayId);
    const processed = await this.preprocessImage(capture.png);

    const tempPath = path.join(os.tmpdir(), `comet-ocr-${Date.now()}.png`);
    fs.writeFileSync(tempPath, processed);

    let data;
    try {
      const result = await this.worker.recognize(tempPath);
      data = result.data;
    } catch (e) {
      console.error('[TesseractService] OCR failed:', e.message);
      try { await this.terminate(); } catch (_) {}
      throw e;
    } finally {
      try { fs.unlinkSync(tempPath); } catch (_) {}
    }

    const scaleX = capture.screenWidth / capture.captureWidth;
    const scaleY = capture.screenHeight / capture.captureHeight;
    const preprocessScale = sharp ? 3840 / capture.captureWidth : 1;

    const transformBbox = (bbox) => ({
      x0: Math.round((bbox.x0 / preprocessScale) * scaleX),
      y0: Math.round((bbox.y0 / preprocessScale) * scaleY),
      x1: Math.round((bbox.x1 / preprocessScale) * scaleX),
      y1: Math.round((bbox.y1 / preprocessScale) * scaleY),
    });

    const getCenter = (bbox) => ({
      x: Math.round(((bbox.x0 + bbox.x1) / 2 / preprocessScale) * scaleX),
      y: Math.round(((bbox.y0 + bbox.y1) / 2 / preprocessScale) * scaleY),
    });

    const words = (data.words || [])
      .filter(w => w.confidence > 60 && (w.text || '').trim().length > 0)
      .map(w => {
        const center = getCenter(w.bbox);
        return {
          text: w.text.trim(),
          confidence: w.confidence,
          bbox: transformBbox(w.bbox),
          centerX: center.x,
          centerY: center.y,
        };
      });

    const lines = (data.lines || [])
      .filter(l => l.confidence > 50 && (l.text || '').trim().length > 0)
      .map(l => {
        const center = getCenter(l.bbox);
        return {
          text: l.text.trim(),
          confidence: l.confidence,
          bbox: transformBbox(l.bbox),
          centerX: center.x,
          centerY: center.y,
        };
      });

    return { words, lines };
  }

  async ocrClick(targetDescription, aiEngine, robotService, permissionStore) {
    const { words, lines } = await this.captureAndOcr();

    if (words.length === 0 && lines.length === 0) {
      return { success: false, error: 'No text found on screen' };
    }

    const searchLower = targetDescription.toLowerCase().trim();

    // 1. First try direct matching on reconstructed lines (ideal for multi-word phrases)
    const lineMatch = lines.find(l =>
      l.text.toLowerCase().includes(searchLower) ||
      searchLower.includes(l.text.toLowerCase())
    );

    if (lineMatch) {
      // If we found a line match, we should try to find where IN the line the text is
      // but clicking the line center is usually a good enough approximation for a button.
      await robotService.execute({
        type: 'click',
        x: lineMatch.centerX,
        y: lineMatch.centerY,
        reason: `OCR line match: "${lineMatch.text}" (target: "${targetDescription}")`,
      });
      return { success: true, clickedText: lineMatch.text, method: 'line-match' };
    }

    // 2. Fallback to word-level matching
    const wordMatch = words.find(w =>
      w.text.toLowerCase().includes(searchLower) ||
      searchLower.includes(w.text.toLowerCase())
    );

    if (wordMatch) {
      await robotService.execute({
        type: 'click',
        x: wordMatch.centerX,
        y: wordMatch.centerY,
        reason: `OCR word match: "${wordMatch.text}" (target: "${targetDescription}")`,
      });
      return { success: true, clickedText: wordMatch.text, method: 'word-match' };
    }

    if (!aiEngine) {
      return { success: false, error: `Text "${targetDescription}" not found on screen (no AI fallback)` };
    }

    const lineList = lines
      .slice(0, 80)
      .map((l, i) => `[${i}] "${l.text}" at (${l.centerX}, ${l.centerY})`)
      .join('\n');

    try {
      const response = await aiEngine.chat({
        model: 'llama-3.1-8b-instant',
        systemPrompt: 'You resolve UI click targets from OCR data. Focus on multi-word matches if the target has spaces. Respond with ONLY a JSON object: {"index": N, "text": "matched text"} or {"index": -1} if not found. No other text.',
        message: `Target: "${targetDescription}"\n\nOCR lines:\n${lineList}`,
      });

      const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const result = JSON.parse(cleaned);

      if (result.index < 0 || result.index >= lines.length) {
        return { success: false, error: `AI could not find "${targetDescription}" on screen` };
      }

      const target = lines[result.index];
      await robotService.execute({
        type: 'click',
        x: target.centerX,
        y: target.centerY,
        reason: `OCR AI click: "${target.text}" (target: "${targetDescription}")`,
      });

      return { success: true, clickedText: target.text, method: 'ai-resolved' };
    } catch (e) {
      return { success: false, error: `AI resolution failed: ${e.message}` };
    }
  }

  async getScreenText(displayId) {
    const { lines } = await this.captureAndOcr(displayId);
    return lines.map(l => l.text).join('\n');
  }
}

module.exports = { TesseractOcrService };
