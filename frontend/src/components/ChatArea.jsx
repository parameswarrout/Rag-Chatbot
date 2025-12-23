import React, { useRef, useEffect } from 'react';
import { Bot, Loader2, Send } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageSkeleton from './MessageSkeleton';

const ChatArea = ({
    messages,
    loading,
    onSend,
    status,
    provider,
    modelName,
    input,
    setInput
}) => {
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, loading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleSubmit = (e, isRegenerate = false) => {
        onSend(e, isRegenerate);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex-1 flex flex-col relative bg-gradient-to-br from-gray-900/50 via-black/80 to-gray-900/50 h-screen overflow-hidden">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 backdrop-blur-sm border border-white/10">
                             <div className="relative">
                                <Bot className="w-12 h-12 text-primary" />
                                <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse"></div>
                             </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">How can I help you today?</h2>
                        <p className="text-sm text-gray-400 max-w-md leading-relaxed">I can answer questions using your documents. Try asking about specific topics in your knowledge base.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <MessageBubble
                        key={msg.id}
                        msg={msg}
                        loading={loading}
                        onRegenerate={
                            (msg.role === 'assistant' && idx === messages.length - 1 && !loading)
                            ? () => handleSubmit({ preventDefault: () => {} }, true)
                            : null
                        }
                    />
                ))}

                {loading && (
                    <div className="w-full">
                        <MessageSkeleton text={status} />
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-gradient-to-b from-black/50 to-black/90 backdrop-blur-xl border-t border-white/10 z-10 shadow-2xl">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-all duration-700"></div>
                    <div className="relative flex items-end gap-2 bg-black/60 border border-white/20 rounded-2xl p-3 shadow-2xl shadow-black/50 focus-within:border-primary/50 focus-within:shadow-primary/10 transition-all duration-300 backdrop-blur-xl">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Ask anything${modelName ? ` using ${modelName}` : ''}...`}
                            className="flex-1 bg-transparent border-none text-white placeholder:text-gray-400 focus:ring-0 px-4 py-3 min-h-[44px] max-h-[200px] resize-none overflow-y-auto text-sm leading-relaxed rounded-xl focus:outline-none"
                            disabled={loading}
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="p-3 mb-0.5 bg-gradient-to-r from-primary to-purple-500 text-white rounded-xl hover:from-primary/90 hover:to-purple-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-center text-[9px] text-gray-500 mt-2 font-light tracking-wide">
                        AI responses can be inaccurate. Verify with provided sources.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ChatArea;
