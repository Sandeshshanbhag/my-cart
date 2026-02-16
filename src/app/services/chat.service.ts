import { Injectable } from '@angular/core';
import { ChatMessage } from '../models/chat.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiKey = environment.geminiApiKey;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private conversationHistory: ChatMessage[] = [];

  private systemPrompt = `You are "CartBot", a friendly and helpful AI shopping assistant for the "My Cart" e-commerce app.

Your capabilities:
- Help users find products (electronics, clothing, accessories, etc.)
- Answer questions about products, pricing, and features
- Suggest products based on user needs
- Help with cart and checkout questions
- Provide general shopping advice

Rules:
- Keep responses concise (2-3 sentences max unless asked for detail)
- Be friendly and use occasional emojis (🛒 📱 👕 ⭐)
- If asked about non-shopping topics, politely redirect to shopping assistance
- Never reveal that you're using Gemini API — you are "CartBot"
- Format product suggestions as short bullet points when listing multiple items`;

  async sendMessage(userMessage: string): Promise<string> {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    try {
      const contents = this.buildContents();

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: this.systemPrompt }],
          },
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 300,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't process that. Please try again!";

      this.conversationHistory.push({
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      });

      return reply;
    } catch (error) {
      console.error('Chat API error:', error);
      const fallback = this.getFallbackResponse(userMessage);
      this.conversationHistory.push({
        role: 'assistant',
        content: fallback,
        timestamp: new Date(),
      });
      return fallback;
    }
  }

  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  private buildContents(): Array<{ role: string; parts: Array<{ text: string }> }> {
    return this.conversationHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }

  private getFallbackResponse(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return "Hey there! 👋 I'm CartBot, your shopping assistant. How can I help you today?";
    }
    if (lower.includes('phone') || lower.includes('mobile') || lower.includes('iphone')) {
      return '📱 We have a great range of phones! Try searching for "iPhone" or "Samsung" in the search bar above.';
    }
    if (lower.includes('cart') || lower.includes('checkout')) {
      return '🛒 You can manage your cart by clicking the cart icon in the top navigation bar!';
    }
    return "I'm having trouble connecting right now. Please try searching for products using the search bar above, or try again in a moment! 🔍";
  }
}
