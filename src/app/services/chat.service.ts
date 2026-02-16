import { Injectable, inject } from '@angular/core';
import { ChatMessage } from '../models/chat.model';
import { environment } from '../../environments/environment';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiKey = environment.geminiApiKey;
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private conversationHistory: ChatMessage[] = [];
  private firestore = inject(Firestore);
  private productCache: Array<{ title: string; category: string; price: number; rating: number }> = [];
  private geminiAvailable: boolean | null = null;

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
- Never reveal your internal workings — you are "CartBot"
- Format product suggestions as short bullet points when listing multiple items`;

  constructor() {
    this.loadProducts();
  }

  private async loadProducts(): Promise<void> {
    try {
      const snapshot = await getDocs(collection(this.firestore, 'products'));
      this.productCache = snapshot.docs.map((doc) => {
        const d = doc.data();
        return { title: d['title'], category: d['category'], price: d['price'], rating: d['rating'] };
      });
    } catch (_e) { /* ignore */ }
  }

  async sendMessage(userMessage: string): Promise<string> {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    let reply: string;

    // Try Gemini first (if not already known to be unavailable)
    if (this.geminiAvailable !== false) {
      try {
        reply = await this.callGemini();
        this.geminiAvailable = true;
      } catch (_error) {
        this.geminiAvailable = false;
        reply = this.getSmartResponse(userMessage);
      }
    } else {
      reply = this.getSmartResponse(userMessage);
    }

    this.conversationHistory.push({
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    });

    return reply;
  }

  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
    this.geminiAvailable = null; // retry Gemini on next chat
  }

  // ─── Gemini API Call ───
  private async callGemini(): Promise<string> {
    const contents = this.conversationHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: this.systemPrompt }] },
        generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 300 },
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text
      || "Sorry, I couldn't process that. Please try again!";
  }

  // ─── Smart Offline Responses ───
  private getSmartResponse(message: string): string {
    const lower = message.toLowerCase().trim();

    // Greetings
    if (/^(hi|hello|hey|hola|howdy|greetings|good\s*(morning|afternoon|evening))/i.test(lower)) {
      return "Hey there! 👋 I'm CartBot, your shopping assistant. I can help you find products, check prices, or manage your cart. What are you looking for today?";
    }

    // How are you / about bot
    if (lower.includes('how are you') || lower.includes('who are you') || lower.includes('what can you do')) {
      return "I'm CartBot, your AI shopping assistant! 🤖 I can help you:\n• 🔍 Find products by name or category\n• 💰 Check prices and ratings\n• 🛒 Guide you with cart & checkout\n• ⭐ Recommend top-rated items\nJust ask me anything!";
    }

    // Thank you
    if (/thank|thanks|thx/i.test(lower)) {
      return "You're welcome! 😊 Happy shopping! Let me know if you need anything else.";
    }

    // Bye
    if (/^(bye|goodbye|see you|take care)/i.test(lower)) {
      return "Goodbye! 👋 Happy shopping and come back anytime! 🛍️";
    }

    // Cart help
    if (lower.includes('cart') || lower.includes('checkout') || lower.includes('buy') || lower.includes('purchase')) {
      return "🛒 Here's how the cart works:\n• Click the **+ button** on any product to add it\n• Click the **cart icon** in the top navbar to view your cart\n• Use **+/−** to change quantities\n• Click **×** to remove items\nHappy shopping!";
    }

    // Favorites
    if (lower.includes('favorite') || lower.includes('wishlist') || lower.includes('heart') || lower.includes('like')) {
      return "❤️ To add a product to favorites, click the **heart icon** on any product card. Your favorites are saved so you can find them easily!";
    }

    // Search help
    if (lower.includes('search') || lower.includes('find') || lower.includes('looking for') || lower.includes('where')) {
      return "🔍 Use the **search bar** at the top of the page! Just type a product name, brand, or category and results will appear instantly. Try searching for \"iPhone\", \"laptop\", or \"headphones\"!";
    }

    // Product queries — search the cache
    const productResults = this.searchProducts(lower);
    if (productResults.length > 0) {
      const items = productResults.slice(0, 5).map(p =>
        `• **${p.title}** — $${p.price.toFixed(2)} ⭐${p.rating}`
      ).join('\n');
      return `Here's what I found! 🛍️\n${items}\n\nUse the search bar above to see full details and add to cart!`;
    }

    // Category queries
    if (lower.includes('category') || lower.includes('categories') || lower.includes('what do you sell') || lower.includes('what products')) {
      const categories = [...new Set(this.productCache.map(p => p.category))];
      if (categories.length > 0) {
        return `We have products in these categories: ${categories.map(c => `**${c}**`).join(', ')} 🛍️\n\nAsk me about any category or search above!`;
      }
      return "We have a wide range of products! 🛍️ Try searching for electronics, clothing, accessories, and more using the search bar above.";
    }

    // Price queries
    if (lower.includes('cheap') || lower.includes('budget') || lower.includes('affordable') || lower.includes('lowest price')) {
      const sorted = [...this.productCache].sort((a, b) => a.price - b.price);
      if (sorted.length > 0) {
        const items = sorted.slice(0, 5).map(p =>
          `• **${p.title}** — $${p.price.toFixed(2)}`
        ).join('\n');
        return `Here are our most affordable products! 💰\n${items}`;
      }
    }

    if (lower.includes('expensive') || lower.includes('premium') || lower.includes('best') || lower.includes('top')) {
      const sorted = [...this.productCache].sort((a, b) => b.rating - a.rating);
      if (sorted.length > 0) {
        const items = sorted.slice(0, 5).map(p =>
          `• **${p.title}** — $${p.price.toFixed(2)} ⭐${p.rating}`
        ).join('\n');
        return `Here are our top-rated products! ⭐\n${items}`;
      }
    }

    // Recommendation
    if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('popular')) {
      const top = [...this.productCache].sort((a, b) => b.rating - a.rating).slice(0, 4);
      if (top.length > 0) {
        const items = top.map(p => `• **${p.title}** — $${p.price.toFixed(2)} ⭐${p.rating}`).join('\n');
        return `Here are my top recommendations! 🌟\n${items}\n\nScroll down to see more in the \"Recommended for You\" section!`;
      }
    }

    // Admin
    if (lower.includes('admin') || lower.includes('create product') || lower.includes('add product')) {
      return "🔐 Admin features:\n• Click **\"Request Admin Access\"** in the navbar to apply\n• Once approved, you can **create and manage products**\n• Admins see a **shield badge** next to their name";
    }

    // Account
    if (lower.includes('account') || lower.includes('login') || lower.includes('register') || lower.includes('sign')) {
      return "👤 You can register with your email and password. Password must have 8+ characters with uppercase, lowercase, number, and special character. Use the Login/Register pages to get started!";
    }

    // Default — try product search as last resort
    const words = lower.split(/\s+/).filter(w => w.length > 2);
    for (const word of words) {
      const results = this.searchProducts(word);
      if (results.length > 0) {
        const items = results.slice(0, 3).map(p =>
          `• **${p.title}** — $${p.price.toFixed(2)} ⭐${p.rating}`
        ).join('\n');
        return `I found some products that might interest you! 🛍️\n${items}\n\nSearch above for more options!`;
      }
    }

    return "I'd love to help! 🤔 Try asking me about:\n• 🔍 \"Find me a phone\" or \"Show laptops\"\n• 💰 \"What's the cheapest product?\"\n• ⭐ \"Recommend something\"\n• 🛒 \"How does the cart work?\"\nOr just search for any product above!";
  }

  private searchProducts(query: string): Array<{ title: string; category: string; price: number; rating: number }> {
    const terms = query.toLowerCase().split(/\s+/);
    return this.productCache.filter(p => {
      const text = `${p.title} ${p.category}`.toLowerCase();
      return terms.some(t => t.length > 2 && text.includes(t));
    });
  }
}
