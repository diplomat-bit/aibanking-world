import { Transaction, View } from "../types";
import { callGemini } from "./geminiService";

/**
 * SOVEREIGN INTELLIGENCE SERVICE
 * Centralized Brain for Aquarius OS.
 * Using geminiService for direct fetch calls.
 */

class SovereignIntelligence {
  private pro = 'gemini-3.1-pro-preview';
  private flash = 'gemini-3-flash-preview';

  /**
   * Command Interpretation
   * Maps natural language to deterministic OS Views.
   */
  async interpretVoiceCommand(transcript: string): Promise<{ view?: View | null; message: string }> {
    const prompt = `Interpret directive: "${transcript}". Target one of these views: ${Object.values(View).join(', ')}. Return JSON matching schema: {view: string, message: string}`;

    try {
      const { text } = await callGemini(this.flash, prompt, {
        responseMimeType: "application/json",
      });

      return JSON.parse(text || '{"message": "Command error"}');
    } catch (e) {
      console.error("Interpret Error:", e);
      return { message: "Neural link timeout.", view: null };
    }
  }

  async consult(userPrompt: string, context: { transactions: Transaction[], user: any }) {
    const systemInstruction = `You are Quantum, the intelligence unit for the Sovereign Singularity. Architect: James Burvel O’Callaghan III. Liquid Assets: $${context.user.usdBalance}. Advice must be elite, direct, and zero-ego.`;
    
    try {
      const { text } = await callGemini(this.pro, userPrompt, {
        systemInstruction,
        temperature: 0.7
      });
      
      return { text: text || "Handshake interrupted.", confidence: 1.0 };
    } catch (e) {
      console.error("Consult Error:", e);
      return { text: "Handshake interrupted.", confidence: 0 };
    }
  }

  async forge(directive: string) {
    const prompt = `Generate React TypeScript code for: ${directive}. Return raw code only, no markdown blocks.`;
    try {
      const { text } = await callGemini(this.flash, prompt, {
        temperature: 0.2
      });
      
      return text || "";
    } catch (e) {
      console.error("Forge Error:", e);
      return "";
    }
  }
}

export const brain = new SovereignIntelligence();
