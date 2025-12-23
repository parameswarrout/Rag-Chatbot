import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { User, Bot, Server, FileText, ChevronDown, ChevronUp, Copy, RefreshCw } from 'lucide-react';
import CitationDisplay from './CitationDisplay';

const MessageBubble = ({ msg, loading, onRegenerate }) => {
    const [showSources, setShowSources] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(msg.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className={`flex gap-4 max-w-3xl mx-auto group ${msg.role === 'user' ? 'justify-end' : ''}`}
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
                                {msg.content.split('__METADATA__')[0]}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    )}
                </div>

                {msg.role === 'assistant' && !loading && (
                    <div className="space-y-2 px-1 w-full opacity-90 transition-opacity">
                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium uppercase tracking-wider select-none relative h-5">
                            {msg.latency > 0 && (
                                <span className="flex items-center gap-1 text-cyan-400">
                                    <Server className="w-3 h-3" />
                                    {msg.latency.toFixed(2)}s
                                </span>
                            )}

                            {msg.source && <span className="text-blue-400 opacity-90">• {msg.source}</span>}

                            {/* Action Buttons (Visible on Hover) */}
                            <div className="flex items-center gap-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={handleCopy}
                                    className="p-1 hover:text-white transition-colors"
                                    title="Copy"
                                >
                                    {copied ? <span className="text-green-400 font-bold">✓</span> : <Copy className="w-3 h-3" />}
                                </button>
                                {onRegenerate && (
                                    <button 
                                        onClick={onRegenerate}
                                        className="p-1 hover:text-white transition-colors"
                                        title="Regenerate Response"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* Click Sources Toggle */}
                            {msg.citations && msg.citations.length > 0 && (
                                <button
                                    onClick={() => setShowSources(!showSources)}
                                    className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full transition-all border cursor-pointer select-none ${showSources
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

                        {/* Expanded List - Now below the Flex Row */}
                        {showSources && msg.citations && (
                            <CitationDisplay citations={msg.citations} />
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
