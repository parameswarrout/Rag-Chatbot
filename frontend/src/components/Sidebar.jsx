import React from 'react';
import { Sparkles, Plus, MessageSquare, Settings, Cpu, Zap, Box } from 'lucide-react';

const Sidebar = ({
    sessions,
    currentSessionId,
    onSwitchSession,
    onNewChat,
    mode,
    setMode,
    provider,
    setProvider
}) => {
    return (
        <div className="hidden md:flex flex-col w-72 border-r border-white/10 bg-black/40 backdrop-blur-2xl p-4 h-full shadow-2xl z-20">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 px-2 py-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-white leading-tight">RAG Gen</h1>
                    <p className="text-[10px] text-gray-400 font-medium tracking-wider">ENTERPRISE EDITION</p>
                </div>
            </div>

            {/* New Chat Button */}
            <button
                onClick={onNewChat}
                className="group relative flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-primary/20 hover:border-primary/50 border border-white/5 text-gray-200 px-4 py-3 rounded-xl mb-8 transition-all duration-300 font-medium text-sm overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span>New Chat</span>
            </button>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                {/* Session List */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 mb-3">
                        <MessageSquare className="w-3 h-3 text-gray-500" />
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            History
                        </label>
                    </div>

                    <div className="space-y-1">
                        {sessions.length === 0 && (
                            <div className="px-4 py-8 text-center border border-dashed border-white/10 rounded-xl">
                                <p className="text-xs text-gray-500">No chat history found.</p>
                            </div>
                        )}
                        {sessions.map((sid) => (
                            <button
                                key={sid}
                                onClick={() => onSwitchSession(sid)}
                                className={`group w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-200 flex items-center gap-3 border border-transparent ${currentSessionId === sid
                                        ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${currentSessionId === sid ? 'bg-primary' : 'bg-gray-700 group-hover:bg-gray-500'}`} />
                                <span className="truncate font-medium opacity-90">{sid.slice(0, 18)}...</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Settings Configuration */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 px-3">
                        <Settings className="w-3 h-3 text-gray-500" />
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            Configuration
                        </label>
                    </div>

                    {/* Provider Select */}
                    <div className="bg-black/20 rounded-xl p-1 border border-white/5 mx-1">
                        <div className="grid grid-cols-3 gap-1">
                            {['local', 'groq', 'gemini'].map((p) => {
                                const Icons = { local: Cpu, groq: Zap, gemini: Box };
                                const Icon = Icons[p];
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setProvider(p)}
                                        className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-medium transition-all ${provider === p
                                                ? 'bg-white/10 text-white shadow-sm'
                                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mode Select */}
                    <div className="px-1 space-y-1">
                        {['fast', 'simple', 'advanced'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all border ${mode === m
                                        ? 'bg-primary/10 border-primary/20 text-primary font-medium'
                                        : 'border-transparent text-gray-500 hover:bg-white/5'
                                    }`}
                            >
                                <span>{m.charAt(0).toUpperCase() + m.slice(1)} Mode</span>
                                {mode === m && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow-sm" />}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 px-2">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-gray-400">System Online</p>
                        <p className="text-[9px] text-gray-600 truncate font-mono">{currentSessionId.split('-')[0]}...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
