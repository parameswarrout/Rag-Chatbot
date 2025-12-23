import React, { useState, useEffect } from 'react';
import { Cpu, Cloud, Zap, Box, Hexagon } from 'lucide-react';

const ProviderSelector = ({ provider, setProvider }) => {
    // Determine initial type based on current provider
    const isLocal = provider === 'local';
    const [lastCloud, setLastCloud] = useState(isLocal ? 'groq' : provider);

    // Update lastCloud whenever a cloud provider is selected
    useEffect(() => {
        if (provider !== 'local') {
            setLastCloud(provider);
        }
    }, [provider]);

    const handleTypeSelect = (type) => {
        if (type === 'local') {
            setProvider('local');
        } else {
            setProvider(lastCloud);
        }
    };

    return (
        <div className="space-y-2">
            {/* Level 1: Service Type (Local vs Cloud) */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-1.5 border border-white/10 mx-1 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-1">
                    <button
                        onClick={() => handleTypeSelect('local')}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            isLocal
                                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 shadow-sm border border-emerald-500/30'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                        }`}
                    >
                        <Cpu className="w-4 h-4" />
                        <span>Local</span>
                    </button>
                    <button
                        onClick={() => handleTypeSelect('cloud')}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            !isLocal
                                ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-blue-400 shadow-sm border border-blue-500/30'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                        }`}
                    >
                        <Cloud className="w-4 h-4" />
                        <span>Cloud</span>
                    </button>
                </div>
            </div>

            {/* Level 2: Cloud Providers (Only visible if Cloud is selected) */}
            {!isLocal && (
                <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-1.5 border border-white/10 mx-1 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200 fade-in">
                    <div className="grid grid-cols-3 gap-1">
                        {[
                            { id: 'groq', name: 'Groq', Icon: Zap },
                            { id: 'gemini', name: 'Gemini', Icon: Box },
                            { id: 'openai', name: 'OpenAI', Icon: Hexagon }
                        ].map(({ id, name, Icon }) => (
                            <button
                                key={id}
                                onClick={() => setProvider(id)}
                                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium transition-all ${
                                    provider === id
                                        ? 'bg-gradient-to-br from-white/20 to-white/10 text-white shadow-sm border border-white/20'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-xs">{name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderSelector;
