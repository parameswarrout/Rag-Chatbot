import React, { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

const ChatInput = ({ input, setInput, onSubmit, loading, modelName }) => {
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e);
        }
    };

    return (
        <div className="p-4 md:p-6 bg-gradient-to-b from-black/50 to-black/90 backdrop-blur-xl border-t border-white/10 z-10 shadow-2xl">
            <form onSubmit={onSubmit} className="max-w-3xl mx-auto relative group">
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
    );
};

export default ChatInput;
