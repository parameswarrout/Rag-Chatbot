import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

const CitationDisplay = ({ citations }) => {
    if (!citations || citations.length === 0) return null;

    return (
        <div className="w-full mt-2 px-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-black/40 rounded-xl border border-white/10 p-3 shadow-inner">
                <div className="text-xs font-semibold text-gray-400 mb-2 px-1">Retrieved Sources</div>
                <div className="grid gap-2">
                    {citations.map((cit, idx) => (
                        <div key={idx} className="group/item text-xs text-gray-300 bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1.5 bg-black/40 rounded-bl-lg border-b border-l border-white/5 text-[9px] font-mono text-gray-500 font-bold">
                                #{idx + 1}
                            </div>
                            <p className="line-clamp-none mb-2 leading-relaxed opacity-90 pr-6">"{cit.content}"</p>
                            <div className="flex items-center gap-2 opacity-60 group-hover/item:opacity-100 transition-opacity pt-2 border-t border-white/5">
                                <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-bold shrink-0">
                                    P.{cit.metadata?.page_label || '?'}
                                </span>
                                <span className="text-[10px] truncate w-full font-mono" title={cit.metadata?.file_path}>
                                    {cit.metadata?.file_path?.split('/').pop() || 'Unknown File'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CitationDisplay;
