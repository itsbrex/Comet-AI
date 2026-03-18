/**
 * Simple On-Device Chatbot
 * Offline-capable, rule-based responses for general queries
 */

interface Intent {
    name: string;
    keywords: string[];
    responses: string[];
}

export class OfflineChatbot {
    private intents: Intent[] = [];

    constructor() {
        this.initializeIntents();
    }

    private initializeIntents() {
        this.intents = [
            {
                name: 'greeting',
                keywords: ['hi', 'hello', 'hey', 'greetings', 'morning', 'evening'],
                responses: [
                    "Hello! I'm your offline assistant. How can I help you today?",
                    "Hi there! I'm here to help, even without internet.",
                    "Hey! What can I do for you?"
                ]
            },
            {
                name: 'help',
                keywords: ['help', 'support', 'what', 'can', 'do', 'features'],
                responses: [
                    "I can help with:\n• Browser navigation\n• Tab management\n• Settings configuration\n• General questions\n\nJust ask me anything!",
                    "I'm your offline assistant. I can guide you through browser features, manage tabs, or answer general questions."
                ]
            },
            {
                name: 'tabs',
                keywords: ['tab', 'tabs', 'window', 'windows', 'close'],
                responses: [
                    "To manage tabs, click the tab icon or use Ctrl+T for new tab, Ctrl+W to close.",
                    "You can view all tabs in Settings > Tab Management."
                ]
            },
            {
                name: 'settings',
                keywords: ['setting', 'settings', 'config', 'preferences', 'option'],
                responses: [
                    "Access settings by clicking the Settings icon in the toolbar.",
                    "Settings include Appearance, Privacy, Vault, Extensions, and more!"
                ]
            }
        ];
    }

    private calculateSimilarity(message: string, keywords: string[]): number {
        const words = message.toLowerCase().split(/\W+/).filter(Boolean);
        if (words.length === 0) return 0;
        
        let matches = 0;
        keywords.forEach(kw => {
            if (words.includes(kw.toLowerCase())) matches++;
        });
        
        return matches / Math.sqrt(keywords.length * words.length);
    }

    public chat(message: string): string {
        const msg = message.toLowerCase().trim();
        if (!msg) return "I'm listening...";

        let bestIntent: Intent | null = null;
        let highestScore = 0;

        for (const intent of this.intents) {
            const score = this.calculateSimilarity(msg, intent.keywords);
            if (score > highestScore) {
                highestScore = score;
                bestIntent = intent;
            }
        }

        if (bestIntent && highestScore > 0.2) {
            return this.getRandomResponse(bestIntent.responses);
        }

        // Hardcoded fallbacks for very common phrases
        if (msg.includes('how are you')) return "I'm functioning perfectly! How can I assist you?";
        if (msg.includes('thank')) return "You're welcome! Happy to help.";

        return this.getRandomResponse([
            "I'm not sure about that, but I'm learning! Try asking about browser features.",
            "Hmm, I don't have an answer for that offline. Try connecting to use cloud AI.",
            "That's beyond my offline knowledge. Connect to the internet for advanced AI assistance."
        ]);
    }

    private getRandomResponse(options: string[]): string {
        return options[Math.floor(Math.random() * options.length)];
    }
}

export const offlineChatbot = new OfflineChatbot();
