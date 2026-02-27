import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Sparkles, Loader2, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import {
    sendChatMessage, SUGGESTED_MESSAGES,
    updateMemoryFromConversation, clearMemory,
    type ChatMessage, type AIProvider,
} from '@/services/aiChatService';

// ─── Storage ──────────────────────────────────────────────────────────────────

const CHAT_STORAGE_KEY = 'vibes-arc-coach-chat';
const PROVIDER_KEY = 'vibes-arc-ai-provider';

function loadMessages(): ChatMessage[] {
    try {
        const raw = localStorage.getItem(CHAT_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch {
        return [];
    }
}

function saveMessages(messages: ChatMessage[]) {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
}

function loadProvider(): AIProvider {
    return (localStorage.getItem(PROVIDER_KEY) as AIProvider) || 'gemini';
}

// ─── Component ────────────────────────────────────────────────────────────────

const CoachChat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<AIProvider>(loadProvider);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Persist messages
    useEffect(() => {
        saveMessages(messages);
    }, [messages]);

    // Persist provider
    useEffect(() => {
        localStorage.setItem(PROVIDER_KEY, provider);
    }, [provider]);

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    // ─── Send Message ─────────────────────────────────────────────────────

    const sendMessage = useCallback(async (text?: string) => {
        const content = (text || input).trim();
        if (!content || isLoading) return;

        setError(null);
        setInput('');
        if (inputRef.current) inputRef.current.style.height = 'auto';

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content,
            timestamp: new Date(),
        };

        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            const apiMessages = updatedMessages.map(m => ({
                role: m.role,
                content: m.content,
            }));

            // Keep last 20 messages for context window
            const contextMessages = apiMessages.slice(-20);

            const reply = await sendChatMessage(contextMessages, provider);

            const assistantMsg: ChatMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: reply,
                timestamp: new Date(),
            };

            setMessages(prev => {
                const updated = [...prev, assistantMsg];
                // Sauvegarder la mémoire après chaque échange
                updateMemoryFromConversation(updated);
                return updated;
            });
        } catch (err: any) {
            console.error('Chat error:', err);
            setError(err.message || 'Erreur de connexion au coach IA');
        } finally {
            setIsLoading(false);
        }
    }, [input, messages, isLoading, provider]);

    // Enter to send
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError(null);
        localStorage.removeItem(CHAT_STORAGE_KEY);
        clearMemory();
    };

    // ─── Render ───────────────────────────────────────────────────────────

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Coach Vibes</h2>
                            <p className="text-sm text-slate-500">Tony Robbins × Esther Hicks • IA personnalisée</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Provider Switch */}
                        <div className="hidden sm:flex items-center gap-1 bg-white/70 backdrop-blur-sm rounded-lg border border-slate-200 p-1">
                            <button
                                onClick={() => setProvider('gemini')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'gemini'
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                Gemini
                            </button>
                            <button
                                onClick={() => setProvider('groq')}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'groq'
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                Groq
                            </button>
                        </div>

                        {/* Clear chat */}
                        {messages.length > 0 && (
                            <button
                                onClick={clearChat}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/70 transition"
                                title="Effacer la conversation"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile provider switch */}
                <div className="flex sm:hidden items-center gap-1 mt-3 bg-white/70 backdrop-blur-sm rounded-lg border border-slate-200 p-1">
                    <button
                        onClick={() => setProvider('gemini')}
                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'gemini'
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        ✨ Gemini
                    </button>
                    <button
                        onClick={() => setProvider('groq')}
                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${provider === 'groq'
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        ⚡ Groq
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/70 shadow-soft overflow-hidden">
                {/* Messages */}
                <div className="h-[55vh] sm:h-[60vh] overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
                >
                    {/* Welcome message */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-xl shadow-violet-500/20 mb-6 animate-bounce-gentle">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                Salut champion ! 🔥
                            </h3>
                            <p className="text-slate-500 text-sm max-w-md mb-8">
                                Je suis Coach Vibes, ton coach personnel de transformation.
                                J'ai accès à tes habitudes et tes progrès pour te guider au mieux.
                                Pose-moi n'importe quelle question !
                            </p>

                            {/* Suggested messages */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                                {SUGGESTED_MESSAGES.map((msg, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(msg.text)}
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/80 border border-slate-200 text-left text-sm text-slate-700 hover:border-violet-300 hover:bg-violet-50/50 transition-all group disabled:opacity-50"
                                    >
                                        <span className="text-lg">{msg.emoji}</span>
                                        <span className="group-hover:text-violet-700 transition-colors">{msg.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message bubbles */}
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}
                        >
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${msg.role === 'user'
                                ? 'bg-indigo-100 text-indigo-600'
                                : 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm'
                                }`}>
                                {msg.role === 'user'
                                    ? <User className="w-4 h-4" />
                                    : <Bot className="w-4 h-4" />
                                }
                            </div>

                            {/* Bubble */}
                            <div className={`max-w-[80%] sm:max-w-[70%] ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-md'
                                : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-md shadow-sm'
                                } px-4 py-3`}>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {msg.content}
                                </div>
                                <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                                    }`}>
                                    {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isLoading && (
                        <div className="flex gap-3 animate-slide-up">
                            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-sm">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md shadow-sm px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 animate-slide-up">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">Erreur</p>
                                <p className="text-red-600 text-xs mt-0.5">{error}</p>
                                <button
                                    onClick={() => {
                                        setError(null);
                                        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                                        if (lastUserMsg) sendMessage(lastUserMsg.content);
                                    }}
                                    className="mt-2 px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium transition"
                                >
                                    Réessayer
                                </button>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-slate-200/70 bg-white/80 backdrop-blur-sm p-3 sm:p-4">
                    <div className="flex items-end gap-2 max-w-4xl mx-auto">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Écris un message à Coach Vibes..."
                                rows={1}
                                disabled={isLoading}
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 resize-none transition disabled:opacity-50"
                                style={{ maxHeight: '120px' }}
                            />
                        </div>
                        <button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex items-center justify-center hover:from-violet-700 hover:to-fuchsia-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
                        >
                            {isLoading
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : <Send className="w-5 h-5" />
                            }
                        </button>
                    </div>

                    {/* Provider badge */}
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                        <Zap className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400">
                            Propulsé par {provider === 'gemini' ? 'Google Gemini' : 'Groq (Llama 3.3)'}
                            {' '}• Tes données sont utilisées pour personnaliser les réponses
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoachChat;
