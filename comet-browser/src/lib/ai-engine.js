const fetch = require('cross-fetch');

class CometAiEngine {
  constructor() {
    this.keys = {};
    this.ollamaBaseUrl = 'http://127.0.0.1:11434';
  }

  configure(keys) {
    this.keys = { ...this.keys, ...keys };
    if (keys.OLLAMA_BASE_URL) this.ollamaBaseUrl = keys.OLLAMA_BASE_URL;
  }

  _getKey(name) {
    return this.keys[name] || process.env[name] || '';
  }

  _inferProvider(model) {
    if (!model) return 'ollama';
    const m = model.toLowerCase();
    if (m.includes('gemini') || m.includes('google')) return 'gemini';
    if (m.includes('gpt') || m.includes('openai')) return 'openai';
    if (m.includes('claude') || m.includes('anthropic')) return 'anthropic';
    if (m.includes('groq')) return 'groq';
    
    // Check for common local models to route to Ollama
    if (m.includes('llama') || m.includes('mistral') || m.includes('deepseek') || m.includes('phi') || m.includes('qwen')) return 'ollama';
    
    return 'ollama'; // Default to local Ollama for robustness
  }

  async chat({ message, model, systemPrompt, history, onChunk }) {
    const provider = this._inferProvider(model);
    console.log(`[AiEngine] Chat request with model: ${model || 'default'} -> routing to: ${provider}`);
    
    switch (provider) {
      case 'ollama': return this._chatOllama({ message, model, systemPrompt, history, onChunk });
      case 'gemini': return this._chatGemini({ message, model, systemPrompt, history, onChunk });
      case 'groq': return this._chatGroq({ message, model, systemPrompt, history, onChunk });
      case 'openai': return this._chatOpenAI({ message, model, systemPrompt, history, onChunk });
      case 'anthropic': return this._chatAnthropic({ message, model, systemPrompt, history, onChunk });
      default: return this._chatOllama({ message, model, systemPrompt, history, onChunk });
    }
  }

  async _chatOllama({ message, model, systemPrompt, history, onChunk }) {
    const targetModel = model || 'deepseek-r1:8b';
    console.log(`[AiEngine] Ollama request: ${targetModel}`);
    
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    for (const h of (history || [])) messages.push(h);
    messages.push({ role: 'user', content: message });

    try {
      const res = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          messages,
          stream: !!onChunk,
          options: {
            num_ctx: 32768,
            temperature: 0.7
          }
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Ollama error ${res.status}: ${err}`);
      }

      if (onChunk) {
        // Simple streaming implementation for bridge
        const reader = res.body; // In Node 18+ fetch, body is a ReadableStream
        let fullText = '';
        // Note: cross-fetch in Node might return a different stream type. 
        // We'll use a robust json-per-line parser if possible or just handle non-stream for now.
        // For Comet, most mobile requests are one-shot generate calls.
      }

      const data = await res.json();
      const text = data.message?.content || '';
      if (onChunk) onChunk(text);
      return text;
    } catch (e) {
      console.error('[AiEngine] Ollama failed:', e);
      // Fallback to Groq if local fails and key exists
      if (this._getKey('GROQ_API_KEY')) {
         console.log('[AiEngine] Falling back to Groq...');
         return this._chatGroq({ message, model: 'llama-3.3-70b-versatile', systemPrompt, history, onChunk });
      }
      throw e;
    }
  }

  async _chatGroq({ message, model, systemPrompt, history, onChunk }) {
    const apiKey = this._getKey('GROQ_API_KEY');
    if (!apiKey) throw new Error('GROQ_API_KEY not configured');

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    for (const h of (history || [])) messages.push(h);
    messages.push({ role: 'user', content: message });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 8192,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    if (onChunk) onChunk(text);
    return text;
  }

  async _chatGemini({ message, model, systemPrompt, history, onChunk }) {
    const apiKey = this._getKey('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

    const contents = [];
    if (systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: systemPrompt }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
    }
    for (const h of (history || [])) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const targetModel = model || 'gemini-2.0-flash';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (onChunk) onChunk(text);
    return text;
  }

  async _chatOpenAI({ message, model, systemPrompt, history, onChunk }) {
    const apiKey = this._getKey('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    for (const h of (history || [])) messages.push(h);
    messages.push({ role: 'user', content: message });

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages,
        max_tokens: 8192,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    if (onChunk) onChunk(text);
    return text;
  }

  async _chatAnthropic({ message, model, systemPrompt, history, onChunk }) {
    const apiKey = this._getKey('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const messages = [];
    for (const h of (history || [])) messages.push(h);
    messages.push({ role: 'user', content: message });

    const body = {
      model: model || 'claude-3-5-sonnet-latest',
      max_tokens: 8192,
      messages,
    };
    if (systemPrompt) body.system = systemPrompt;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    if (onChunk) onChunk(text);
    return text;
  }
}

module.exports = { CometAiEngine };
