import React from 'react';
import { Database, Upload, RefreshCw, Trash2 } from 'lucide-react';

const KnowledgeBaseSection = ({ 
    onOpenUpload, 
    onProcess, 
    onReset, 
    isProcessing, 
    processProgress 
}) => {
    return (
        <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 px-3">
                <Database className="w-3.5 h-3.5 text-gray-400" />
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gradient-to-r from-gray-400 to-gray-500 bg-clip-text text-transparent">
                    Knowledge Base
                </label>
            </div>

            <div className="space-y-1.5 px-1">
                <button
                    onClick={onOpenUpload}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all border border-transparent text-gray-300 hover:bg-white/5 hover:text-white shadow-sm"
                >
                    <span className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>Add Knowledge</span>
                    </span>
                </button>

                <div className="space-y-1">
                    <button
                        onClick={onProcess}
                        disabled={isProcessing}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all border ${isProcessing
                                ? 'bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 text-primary shadow-sm shadow-primary/10'
                                : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white shadow-sm'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                            <span>Process Data</span>
                        </span>
                    </button>
                    {isProcessing && (
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mx-1">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-300"
                                style={{ width: `${processProgress}%` }}
                            />
                        </div>
                    )}
                </div>

                 <button
                    onClick={onReset}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 shadow-sm"
                >
                    <Trash2 className="w-4 h-4" />
                    <span>Reset Memory</span>
                </button>
            </div>
        </div>
    );
};

export default KnowledgeBaseSection;
