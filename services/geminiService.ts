
/**
 * GEMINI SOVEREIGN SERVICE
 * Direct fetch implementation to bypass SDK limitations.
 */

export enum Type {
  TYPE_UNSPECIFIED = "TYPE_UNSPECIFIED",
  STRING = "STRING",
  NUMBER = "NUMBER",
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN",
  ARRAY = "ARRAY",
  OBJECT = "OBJECT",
  NULL = "NULL",
}

export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiContent {
  role?: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseSchema?: any;
  stopSequences?: string[];
  systemInstruction?: string | { parts: GeminiPart[] };
  thinkingConfig?: { thinkingBudget: number };
  tools?: any[];
  toolConfig?: any;
  imageConfig?: any;
  speechConfig?: any;
}

export async function callGemini(model: string, contents: GeminiContent[] | string, config: GeminiConfig = {}) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) throw new Error("GEMINI_API_KEY Missing.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const payload: any = {
    contents: typeof contents === 'string' ? [{ parts: [{ text: contents }] }] : contents,
    generationConfig: {
      temperature: config.temperature,
      topP: config.topP,
      topK: config.topK,
      maxOutputTokens: config.maxOutputTokens,
      responseMimeType: config.responseMimeType,
      responseSchema: config.responseSchema,
      stopSequences: config.stopSequences,
      thinkingConfig: config.thinkingConfig,
    },
    tools: config.tools,
    toolConfig: config.toolConfig,
    imageConfig: config.imageConfig,
    speechConfig: config.speechConfig,
  };

  if (config.systemInstruction) {
    payload.systemInstruction = typeof config.systemInstruction === 'string' 
      ? { parts: [{ text: config.systemInstruction }] } 
      : config.systemInstruction;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Gemini API Error");
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  return {
    text: text || "",
    data: data
  };
}

export async function countTokens(model: string, contents: GeminiContent[] | string) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) throw new Error("GEMINI_API_KEY Missing.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:countTokens?key=${apiKey}`;
  
  const payload: any = {
    contents: typeof contents === 'string' ? [{ parts: [{ text: contents }] }] : contents,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Gemini API Error");
  }

  const data = await response.json();
  return data.totalTokens || 0;
}

/**
 * GEMINI LIVE CLIENT
 * Direct WebSocket implementation for real-time voice/video.
 */

export class GeminiLiveClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private model: string;
  private callbacks: {
    onOpen?: () => void;
    onClose?: () => void;
    onError?: (err: any) => void;
    onMessage?: (msg: any) => void;
  };

  constructor(model: string, callbacks: any) {
    this.apiKey = process.env.GEMINI_API_KEY || "";
    this.model = model;
    this.callbacks = callbacks;
  }

  async connect(config: any) {
    if (!this.apiKey) throw new Error("GEMINI_API_KEY Missing.");

    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService/BiDiGenerateContent?key=${this.apiKey}`;
    
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      // Send initial setup message
      const setupMessage = {
        setup: {
          model: `models/${this.model}`,
          generationConfig: config.generationConfig,
          systemInstruction: config.systemInstruction ? { parts: [{ text: config.systemInstruction }] } : undefined,
        }
      };
      this.ws?.send(JSON.stringify(setupMessage));
      this.callbacks.onOpen?.();
    };

    this.ws.onclose = () => this.callbacks.onClose?.();
    this.ws.onerror = (err) => this.callbacks.onError?.(err);
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.callbacks.onMessage?.(msg);
    };

    return this;
  }

  sendRealtimeInput(input: { audio?: { data: string, mimeType: string }, video?: { data: string, mimeType: string } }) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        realtimeInput: {
          audio: input.audio,
          video: input.video
        }
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  close() {
    this.ws?.close();
  }
}

/**
 * Specialized helpers for common tasks
 */

export async function getRecommendations(contextSummary: string) {
  const prompt = `As Agora AI, an elite marketplace curator, suggest 6 highly personalized products for a high-net-worth individual based on these recent transactions: ${contextSummary}. 
  Respond in valid JSON format. Include: id, name, price, category, description, and aiReason (why it fits their spending profile).`;

  const { text } = await callGemini('gemini-3-flash-preview', prompt, {
    responseMimeType: "application/json",
  });

  return JSON.parse(text || '{"products": []}');
}

export async function getForgeRoadmap(aiPrompt: string) {
  const prompt = `You are the Sovereignty OS Integration Architect. Analyze this integration idea: "${aiPrompt}". 
  Provide a high-fidelity technical roadmap in Markdown. Include:
  1. Architectural Design Pattern (e.g. Pub/Sub, Webhook Mesh)
  2. Required Demo Bank API Endpoints
  3. Security & Compliance (e.g. Zero-Knowledge Proofs, ISO20022 mapping)
  4. Performance Vectors (e.g. expected latency, throughput)
  Use professional, executive tone. No fluff.`;

  const { text } = await callGemini('gemini-3-flash-preview', prompt);
  return text;
}
