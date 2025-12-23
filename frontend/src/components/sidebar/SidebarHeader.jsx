import React from 'react';
import { Sparkles, Plus } from 'lucide-react';

const SidebarHeader = ({ onNewChat }) => {
    return (
        <div className="mb-4">
            {/* Logo/Title */}
            <div className="flex items-center gap-3 mb-4 px-2 py-2 relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-2xl shadow-primary/30 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
                    <Sparkles className="w-5 h-5 text-white z-10" />
                    <div className="absolute inset-0 rounded-2xl bg-white/10 blur-sm animate-pulse"></div>
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">RAG Gen</h1>
                    <p className="text-[9px] text-transparent bg-gradient-to-r from-primary/80 to-purple-400 bg-clip-text font-bold tracking-widest">ENTERPRISE EDITION</p>
                </div>
            </div>

            {/* New Chat Button */}
            <button
                onClick={onNewChat}
                className="group relative flex items-center justify-center gap-2 w-full bg-gradient-to-r from-white/5 to-white/10 hover:from-primary/20 hover:to-purple-500/20 hover:border-primary/50 border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-300 font-medium text-sm overflow-hidden shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-primary/10"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                <div className="absolute inset-0 bg-white/5 hover:bg-white/10 transition-opacity rounded-2xl"></div>
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                <span className="relative z-10">New Chat</span>
            </button>
        </div>
    );
};

export default SidebarHeader;
