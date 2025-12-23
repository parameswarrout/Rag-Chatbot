import React, { useState } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useModelDownload } from '../../hooks/useModelDownload';

const LocalModelConfig = ({ customModel, setCustomModel, availableModels, onRefreshModels, showNotification }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [downloadModelName, setDownloadModelName] = useState('');

    const { downloadModel, isDownloading, progress, status, resetStatus } = useModelDownload(
        (modelName) => {
            showNotification(`Model ${modelName} downloaded successfully!`, 'success');
            setDownloadModelName('');
            if (onRefreshModels) onRefreshModels();
            setTimeout(() => {
                setIsDownloadOpen(false);
                resetStatus();
            }, 2000);
        },
        (error) => {
            showNotification(`Failed to download model: ${error}`, 'error');
        }
    );

    return (
        <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-1.5 border border-white/10 mx-1 mt-2 backdrop-blur-sm">
             <div className="pt-1 px-1 pb-1 space-y-2">
                <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Local Model</label>
                
                <div className="flex gap-1">
                    <div className="relative flex-1">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-gray-300 hover:border-primary/30 transition-all focus:outline-none focus:border-primary/50"
                        >
                            <span className="truncate">{customModel || 'Default (llama3.2)'}</span>
                            <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-40" 
                                    onClick={() => setIsDropdownOpen(false)} 
                                />
                                <div className="absolute top-full left-0 w-full mt-1 z-50 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => {
                                            setCustomModel('');
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 text-[10px] hover:bg-white/5 flex items-center justify-between ${!customModel ? 'text-primary font-bold bg-primary/5' : 'text-gray-400'}`}
                                    >
                                        <span>Default (llama3.2)</span>
                                        {!customModel && <Check className="w-3 h-3" />}
                                    </button>
                                    {availableModels.map((m) => (
                                        <button
                                            key={m.name}
                                            onClick={() => {
                                                setCustomModel(m.name);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-2 py-1.5 text-[10px] hover:bg-white/5 flex items-center justify-between ${customModel === m.name ? 'text-primary font-bold bg-primary/5' : 'text-gray-300'}`}
                                        >
                                            <span className="truncate">{m.name}</span>
                                            {customModel === m.name && <Check className="w-3 h-3" />}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <button 
                        onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                        className={`p-1.5 rounded-lg border transition-all ${isDownloadOpen 
                            ? 'bg-primary/20 text-primary border-primary/20' 
                            : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                        title="Download New Model"
                    >
                        <Plus className={`w-3.5 h-3.5 ${isDownloadOpen ? 'rotate-45' : ''} transition-transform`} />
                    </button>
                </div>

                {/* Download Model UI */}
                {isDownloadOpen && (
                    <div className="bg-black/40 rounded-lg p-2 border border-white/10 space-y-2 animate-in slide-in-from-top-2">
                        <div className="space-y-1">
                            <input 
                                type="text"
                                value={downloadModelName}
                                onChange={(e) => setDownloadModelName(e.target.value)}
                                placeholder="Model name (e.g. mistral)"
                                className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-primary/50 outline-none"
                            />
                            <button 
                                onClick={() => downloadModel(downloadModelName)}
                                disabled={!downloadModelName || isDownloading}
                                className="w-full bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-bold py-1 rounded transition-colors disabled:opacity-50"
                            >
                                {isDownloading ? 'Pulling...' : 'Pull Model'}
                            </button>
                        </div>
                        
                        {/* Download Progress */}
                        {status && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-gray-400">
                                    <span className="truncate max-w-[100px]">{status}</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocalModelConfig;
