import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Server, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const MessageBubble = ({ msg, loading }) => {
    const [showSources, setShowSources] = useState(false);

    return (
        <div
            className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : ''}`}
        >
            {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1 shadow-glow ring-1 ring-primary/20">
                    <Bot className="w-5 h-5 text-primary" />
                </div>
            )}

            <div className={`space-y-2 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-none shadow-primary/20 bg-gradient-to-br from-primary to-primary/80'
                        : 'bg-secondary text-secondary-foreground rounded-bl-none border border-white/5 backdrop-blur-sm shadow-xl'
                    }`}>
                    {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none text-gray-200">
                            <ReactMarkdown
                                components={{
                                    code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '')
                                        return !inline && match ? (
                                            <SyntaxHighlighter
                                                style={dracula}
                                                language={match[1]}
                                                PreTag="div"
                                                className="rounded-lg !bg-black/50 !p-4 border border-white/10 my-4 shadow-inner"
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={`${className} bg-black/30 px-1 py-0.5 rounded font-mono text-xs text-accent-foreground border border-white/5`} {...props}>
                                                {children}
                                            </code>
                                        )
                                    }
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                </div>

                {/* Metadata / Citations for AI */}
                {msg.role === 'assistant' && !loading && (
                    <div className="space-y-2 px-1 w-full opacity-90 transition-opacity">
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium uppercase tracking-wider select-none">
                            {msg.latency > 0 && (
                                <span className="flex items-center gap-1">
                                    <Server className="w-3 h-3" />
                                    {msg.latency.toFixed(2)}s
                                </span>
                            )}

                            {msg.source && <span className="opacity-75">• {msg.source}</span>}

                            {/* Clickable Sources Toggle */}
                            {msg.citations && msg.citations.length > 0 && (
                                <button
                                    onClick={() => setShowSources(!showSources)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all border ${showSources
                                            ? 'bg-primary/20 text-primary border-primary/20'
                                            : 'bg-white/5 text-gray-400 hover:text-white border-transparent hover:bg-white/10'
                                        }`}
                                >
                                    <FileText className="w-3 h-3" />
                                    <span>{msg.citations.length} Sources</span>
                                    {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                            )}
                        </div>

                        {/* Collapsible Citations Area */}
                        {showSources && msg.citations && msg.citations.length > 0 && (
                            <div className="bg-black/40 rounded-xl p-3 border border-white/10 mt-1 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                    {msg.citations.map((cit, idx) => (
                                        <div key={idx} className="group text-xs text-gray-400 bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/5">
                                            <p className="line-clamp-2 italic text-gray-300 mb-1 group-hover:text-white transition-colors">"{cit.content}"</p>
                                            <div className="flex items-center gap-2 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">
                                                    Page {cit.metadata?.page_label || '?'}
                                                </span>
                                                <span className="text-[9px] truncate">
                                                    {cit.metadata?.file_path?.split('/').pop() || 'Unknown File'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-accent/50 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-5 h-5 text-gray-300" />
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
