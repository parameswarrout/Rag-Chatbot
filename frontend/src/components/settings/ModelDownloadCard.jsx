import React, { useState } from 'react';
import { Download, Activity } from 'lucide-react';
import { useModelDownload } from '../../hooks/useModelDownload';

const ModelDownloadCard = ({ refreshModels, showNotification }) => {
    const [modelName, setModelName] = useState('');

    const { downloadModel, isDownloading, progress, status, resetStatus } = useModelDownload(
        (name) => {
             showNotification(`Model ${name} downloaded successfully`);
             setModelName('');
             if (refreshModels) refreshModels();
             setTimeout(resetStatus, 3000);
        },
        (error) => showNotification(`Failed to download: ${error}`, 'error')
    );

    return (
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Download className="text-primary" size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Download New Model</h3>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        value={modelName}
                        onChange={e => setModelName(e.target.value)}
                        placeholder="Enter model name (e.g., llama3:latest)"
                        className="flex-1 bg-gray-800/70 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    />
                    <button
                        disabled={!modelName || isDownloading}
                        onClick={() => downloadModel(modelName)}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 rounded-xl text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:from-primary/90 hover:to-primary/80 transition-all font-medium"
                    >
                        {isDownloading
                            ? <Activity className="animate-spin" size={18} />
                            : <Download size={18} />}
                        {isDownloading ? 'Pulling...' : 'Pull Model'}
                    </button>
                </div>

                {status && (
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-300">{status}</span>
                            <span className="text-primary font-medium">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-primary/90 transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="pt-3">
                    <p className="text-sm text-gray-400">
                        Browse the complete list of available models at{' '}
                        <a
                            href="https://ollama.com/library"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            https://ollama.com/library
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ModelDownloadCard;
