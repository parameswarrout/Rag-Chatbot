import React, { useRef, useEffect } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';

const ChatArea = ({
    messages,
    loading,
    error,
    input,
    setInput,
    handleSubmit,
    mode,
    setMode,
    provider,
    setProvider
}) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, loading]);

    return (
        <div className="flex-1 flex flex-col relative bg-gradient-to-br from-background via-background to-black h-screen overflow-hidden">
            {/* Mobile Header */}
            <div className="md:hidden p-4 border-b border-gray-800 flex items-center justify-between bg-background/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-bold">RAG Gen</span>
                </div>
                <div className="flex gap-2">
                    <select
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        className="bg-secondary text-xs rounded px-2 py-1 border-none focus:ring-1 focus:ring-primary max-w-[80px]"
                    >
                        <option value="local">Local</option>
                        <option value="groq">Groq</option>
                        <option value="gemini">Gemini</option>
                    </select>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="bg-secondary text-xs rounded px-2 py-1 border-none focus:ring-1 focus:ring-primary"
                    >
                        <option value="fast">Fast</option>
                        <option value="simple">Simple</option>
                        <option value="advanced">Advanced</option>
                    </select>
                </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-8">
                        <Bot className="w-16 h-16 text-primary mb-4" />
                        <h2 className="text-xl font-bold mb-2">How can I help you today?</h2>
                        <p className="text-sm max-w-md">I can answer questions using your documents. Try asking about specific topics in your knowledge base.</p>
                    </div>
                )}

                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        msg={msg}
                        loading={loading} // passing loading only strictly needed if we want to show loading state inside bubble? actually bubble just checks msg role.
                    // Wait, ChatArea checked !loading for metadata.
                    // But loading state is global? 
                    // If I'm chatting, only the *last* assistant message might be loading.
                    // Actually the global `loading` is true while streaming.
                    // And we want to hide metadata while streaming?
                    // Yes. So passing `loading` is fine, but strictly it hides metadata for ALL messages if global loading is true?
                    // That was the bug in previous code: `!loading` applied to map.
                    // Ah, `msg.role === 'assistant' && !loading` meant metadata only shows when NOT loading.
                    // If I scroll up while generating, old messages lose metadata? Yes.
                    // Better to check if *this specific message* is done.
                    // But we don't track per-message done state easily without `latency` field check.
                    // If `msg.latency > 0` it implies done?
                    // Let's rely on msg.latency or msg.source being populated.
                    />
                ))}

                {loading && (
                    <div className="flex justify-center my-4">
                        <Loader2 className="w-6 h-6 text-primary animate-spin opacity-50" />
                    </div>
                )}

                {error && (
                    <div className="flex justify-center my-4">
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-background/80 backdrop-blur-md border-t border-gray-800 z-10">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-lg group-hover:blur-xl transition-all opacity-0 group-hover:opacity-100 duration-500"></div>
                    <div className="relative flex items-center gap-2 bg-secondary border border-white/10 rounded-xl p-2 shadow-2xl focus-within:border-primary/50 text-base transition-colors">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={`Ask anything using ${provider}... (${mode} mode)`}
                            className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground focus:ring-0 px-4 py-2 min-w-0"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="p-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? <div className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-600 mt-2">
                        AI responses can be inaccurate. Verify with provided sources.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ChatArea;
