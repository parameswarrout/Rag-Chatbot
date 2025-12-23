import React from 'react';

const ModeSelector = ({ mode, setMode }) => {
    const modeDescriptions = {
        fast: "Single query, top result. Fastest response.",
        simple: "Standard search (Top 3). Good for general queries.",
        advanced: "Deep research with query expansion & reranking."
    };

    return (
        <div className="px-1 space-y-1">
            {['fast', 'simple', 'advanced'].map((m) => (
                <button
                    key={m}
                    onClick={() => setMode(m)}
                    title={modeDescriptions[m]}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all ${
                        mode === m
                            ? 'bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-primary font-bold'
                            : 'border border-transparent text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <span>{m.charAt(0).toUpperCase() + m.slice(1)} Mode</span>
                    {mode === m && (
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-purple-500 shadow-lg shadow-primary/30 flex-shrink-0" />
                    )}
                </button>
            ))}
            
            <div className="px-3 pt-1 pb-2">
                <p className="text-xs text-gray-400 font-light leading-relaxed opacity-80">
                    {modeDescriptions[mode]}
                </p>
            </div>
        </div>
    );
};

export default ModeSelector;
