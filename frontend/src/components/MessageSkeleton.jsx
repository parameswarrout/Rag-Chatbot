import React from 'react';
import { Bot } from 'lucide-react';

const MessageSkeleton = ({ text }) => {
    return (
        <div className="flex gap-4 max-w-3xl mx-auto animate-pulse">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-1 ring-1 ring-white/10">
                <Bot className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-2 max-w-[85%] md:max-w-[75%] w-full">
                <div className="p-4 rounded-2xl rounded-bl-none border border-white/5 bg-secondary/50 shadow-xl space-y-3">
                    {text ? (
                        <div className="flex items-center gap-3 text-sm text-gray-400 font-mono">
                           <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce"></span>
                           </div>
                           <span className="animate-pulse">{text}</span>
                        </div>
                    ) : (
                        <>
                            <div className="h-4 bg-white/10 rounded w-3/4"></div>
                            <div className="h-4 bg-white/10 rounded w-1/2"></div>
                            <div className="h-4 bg-white/10 rounded w-5/6"></div>
                        </>
                    )}
                </div>
                {!text && (
                    <div className="flex gap-2">
                        <div className="h-3 w-16 bg-white/5 rounded"></div>
                        <div className="h-3 w-24 bg-white/5 rounded"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageSkeleton;
