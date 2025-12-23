import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';

const SessionList = React.memo(({ sessions, currentSessionId, onSwitchSession, onClearHistory }) => {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between px-3 mb-2">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gradient-to-r from-gray-400 to-gray-500 bg-clip-text text-transparent">
                        History
                    </label>
                </div>
                {sessions.length > 0 && (
                    <button
                        onClick={onClearHistory}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                        title="Clear History"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="space-y-0.5">
                {sessions.length === 0 && (
                    <div className="px-4 py-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                        <p className="text-xs text-gray-500 font-light">No chat history found.</p>
                    </div>
                )}
                {sessions.map((sid) => (
                    <button
                        key={sid}
                        onClick={() => onSwitchSession(sid)}
                        className={`group w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 border border-transparent hover:bg-white/5 ${currentSessionId === sid
                                ? 'bg-gradient-to-r from-primary/10 to-purple-500/10 text-primary border border-primary/20 shadow-sm shadow-primary/10'
                                : 'text-gray-300 hover:text-gray-100'
                            }`}
                    >
                        <div className={`w-2 h-2 rounded-full transition-all ${currentSessionId === sid ? 'bg-primary' : 'bg-gray-600 group-hover:bg-gray-400'}`} />
                        <span className="truncate font-medium">{sid.slice(0, 18)}...</span>
                    </button>
                ))}
            </div>
        </div>
    );
});

export default SessionList;
