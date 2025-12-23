import React from 'react';
import { Settings, Database, MessageSquare } from 'lucide-react';
import ProviderSelector from './ProviderSelector';
import LocalModelConfig from './LocalModelConfig';
import ModeSelector from './ModeSelector';

const ConfigurationSection = ({
    onOpenSettings,
    useRag,
    setUseRag,
    provider,
    setProvider,
    customModel,
    setCustomModel,
    availableModels,
    refreshModels,
    mode,
    setMode,
    showNotification
}) => {
    return (
        <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5 text-gray-400" />
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gradient-to-r from-gray-400 to-gray-500 bg-clip-text text-transparent">
                        Configuration
                    </label>
                </div>
                <button
                    onClick={onOpenSettings}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10 hover:border-white/20 shadow-sm"
                    title="Open Full Settings"
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            {/* RAG / General Toggle */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-1.5 border border-white/10 mx-1 mb-2 backdrop-blur-sm">
                <div className="flex gap-1">
                    <button
                        onClick={() => setUseRag(true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            useRag
                                ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary shadow-sm border border-primary/30'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                        }`}
                    >
                        <Database className="w-4 h-4" />
                        <span>Knowledge Base</span>
                    </button>
                    <button
                        onClick={() => setUseRag(false)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            !useRag
                                ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 shadow-sm border border-blue-500/30'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>General Chat</span>
                    </button>
                </div>
            </div>

            <ProviderSelector provider={provider} setProvider={setProvider} />

            {provider === 'local' && (
                <LocalModelConfig 
                    customModel={customModel} 
                    setCustomModel={setCustomModel} 
                    availableModels={availableModels} 
                    onRefreshModels={refreshModels}
                    showNotification={showNotification}
                />
            )}

            <ModeSelector mode={mode} setMode={setMode} />
        </div>
    );
};

export default ConfigurationSection;
