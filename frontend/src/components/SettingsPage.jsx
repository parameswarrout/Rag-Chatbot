import React, { useEffect, useRef, useState } from 'react';
import {
    X,
    Cpu,
    Server,
    Trash2,
    Download,
    Activity,
    AlertCircle,
    CheckCircle,
    HardDrive,
    Zap,
    Wifi,
    Settings,
    Database
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const SettingsPage = ({
    onClose,
    availableModels = [],
    refreshModels,
    systemStatus
}) => {
    const [downloadModelName, setDownloadModelName] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState('');
    const [notification, setNotification] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);

    const abortControllerRef = useRef(null);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);


    const handleDownloadModel = async () => {
        if (!downloadModelName || isDownloading) return;

        abortControllerRef.current = new AbortController();

        setIsDownloading(true);
        setDownloadProgress(0);
        setDownloadStatus('Starting...');

        try {
            const response = await fetch(`${API_BASE}/models/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: downloadModelName }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok || !response.body) {
                throw new Error('Failed to start download');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop();

                for (const event of events) {
                    if (!event.startsWith('data:')) continue;

                    const json = event.replace(/^data:\s*/, '').trim();
                    if (!json) continue;

                    const data = JSON.parse(json);

                    if (data.error) {
                        throw new Error(data.error);
                    }

                    if (data.status) {
                        setDownloadStatus(data.status);
                    }

                    if (data.total && data.completed) {
                        setDownloadProgress(
                            Math.min(100, (data.completed / data.total) * 100)
                        );
                    }

                    if (data.status === 'success') {
                        setDownloadProgress(100);
                        setDownloadStatus('Completed');
                    }
                }
            }

            showNotification(`Model ${downloadModelName} downloaded successfully`);
            setDownloadModelName('');
            refreshModels?.();

        } catch (e) {
            if (e.name !== 'AbortError') {
                showNotification(`Failed to download model: ${e.message}`, 'error');
                setDownloadStatus('Failed');
            }
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDeleteModel = async (modelName) => {
        if (isDownloading) return;

        if (!window.confirm(`Delete model ${modelName}?`)) return;

        try {
            const res = await fetch(`${API_BASE}/models`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName })
            });

            if (!res.ok) {
                throw new Error('Delete failed');
            }

            showNotification(`Model ${modelName} deleted`);
            refreshModels?.();

        } catch (e) {
            showNotification(e.message, 'error');
        }
    };

    const formatSize = (bytes) => {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    };

    const formatDate = (date) =>
        date ? new Date(date).toLocaleDateString() : 'Unknown';

    const getStatusColor = (status) => {
        if (status === 'online' || status === 'success') return 'text-green-400';
        if (status === 'offline' || status === 'failed') return 'text-red-400';
        return 'text-yellow-400';
    };

    const getStatusIcon = (status) => {
        if (status === 'online' || status === 'success') return <CheckCircle size={16} className="text-green-400" />;
        if (status === 'offline' || status === 'failed') return <X size={16} className="text-red-400" />;
        return <Activity size={16} className="text-yellow-400 animate-spin" />;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-lg flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col relative shadow-2xl shadow-black/50 overflow-hidden">

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 z-0"></div>

                {/* Notification */}
                {notification && (
                    <div
                        className={`absolute top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-sm ${
                            notification.type === 'success'
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                    >
                        {notification.type === 'success'
                            ? <CheckCircle size={18} />
                            : <AlertCircle size={18} />}
                        <span className="text-sm font-medium">
                            {notification.message}
                        </span>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-700 relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Settings className="text-primary" size={28} />
                            System Configuration
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Manage your local Ollama models and system status
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            abortControllerRef.current?.abort();
                            onClose();
                        }}
                        className="p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400 hover:text-white" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">

                    {/* System Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-xl p-5 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <Server className="text-blue-400" size={24} />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wider">Backend Service</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`font-bold ${getStatusColor(systemStatus?.system)}`}>
                                            {systemStatus?.system || 'Unknown'}
                                        </span>
                                        {getStatusIcon(systemStatus?.system)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-xl p-5 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/10 rounded-lg">
                                    <Cpu className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wider">Ollama Service</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`font-bold ${getStatusColor(systemStatus?.ollama)}`}>
                                            {systemStatus?.ollama || 'Unknown'}
                                        </span>
                                        {getStatusIcon(systemStatus?.ollama)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pull Model Card */}
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
                                    value={downloadModelName}
                                    onChange={e => setDownloadModelName(e.target.value)}
                                    placeholder="Enter model name (e.g., llama3:latest)"
                                    className="flex-1 bg-gray-800/70 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                />
                                <button
                                    disabled={!downloadModelName || isDownloading}
                                    onClick={handleDownloadModel}
                                    className="px-6 py-3 bg-gradient-to-r from-primary to-primary/90 rounded-xl text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:from-primary/90 hover:to-primary/80 transition-all font-medium"
                                >
                                    {isDownloading
                                        ? <Activity className="animate-spin" size={18} />
                                        : <Download size={18} />}
                                    {isDownloading ? 'Pulling...' : 'Pull Model'}
                                </button>
                            </div>

                            {isDownloading && (
                                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-300">{downloadStatus}</span>
                                        <span className="text-primary font-medium">{Math.round(downloadProgress)}%</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-primary/90 transition-all duration-300 ease-out"
                                            style={{ width: `${downloadProgress}%` }}
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

                    {/* Installed Models Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg">
                                    <HardDrive className="text-green-400" size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Installed Models</h3>
                            </div>
                            <span className="px-3 py-1 bg-gray-700/50 text-gray-300 text-sm rounded-full">
                                {availableModels.length} {availableModels.length === 1 ? 'model' : 'models'}
                            </span>
                        </div>

                        {availableModels.length === 0 ? (
                            <div className="bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-dashed border-gray-700 rounded-2xl p-8 text-center backdrop-blur-sm">
                                <div className="flex justify-center mb-4">
                                    <Database className="text-gray-500" size={40} />
                                </div>
                                <h4 className="text-lg font-medium text-white mb-2">No models installed</h4>
                                <p className="text-gray-400 max-w-md mx-auto">
                                    You haven't downloaded any models yet. Pull a model from the section above to get started.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableModels.map(model => (
                                    <div
                                        key={model.name}
                                        className="bg-gradient-to-r from-gray-800/50 to-gray-800/30 border border-gray-700 rounded-xl p-5 backdrop-blur-sm hover:border-gray-600 transition-all cursor-pointer"
                                        onClick={() => {
                                            // Show model details modal with GPU info and other metrics
                                            setSelectedModel(model);
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="text-white font-semibold truncate max-w-[70%]">
                                                {model.name.split(':')[0]}
                                                <span className="text-xs text-gray-400 ml-1">
                                                    {model.name.includes(':') && `:${model.name.split(':')[1]}`}
                                                </span>
                                            </h4>
                                            <button
                                                disabled={isDownloading}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent triggering the parent click
                                                    handleDeleteModel(model.name);
                                                }}
                                                className="p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete model"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Size:</span>
                                                <span className="text-white font-medium">{formatSize(model.size)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Updated:</span>
                                                <span className="text-white">{formatDate(model.modified_at)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Model ID</span>
                                            <span className="text-xs text-gray-400 truncate ml-2 max-w-[60%]">
                                                {model.digest?.substring(0, 8) || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-700 text-center text-xs text-gray-500 relative z-10">
                    System Configuration Panel • Ollama Integration
                </div>

                {/* Model Details Modal */}
                {selectedModel && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl shadow-black/50">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <HardDrive className="text-primary" size={20} />
                                    Model Details: {selectedModel.name.split(':')[0]}
                                    <span className="text-sm text-gray-400">
                                        {selectedModel.name.includes(':') && `:${selectedModel.name.split(':')[1]}`}
                                    </span>
                                </h3>
                                <button
                                    onClick={() => setSelectedModel(null)}
                                    className="p-1 rounded-lg hover:bg-gray-700/50 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400 hover:text-white" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                                        <div className="text-xs text-gray-400 mb-1">Model Size</div>
                                        <div className="text-white font-bold text-lg">{formatSize(selectedModel.size)}</div>
                                    </div>
                                    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                                        <div className="text-xs text-gray-400 mb-1">Updated</div>
                                        <div className="text-white font-bold text-lg">{formatDate(selectedModel.modified_at)}</div>
                                    </div>
                                </div>

                                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                                    <div className="text-xs text-gray-400 mb-2">Model Digest</div>
                                    <div className="text-sm font-mono text-gray-300 break-all">{selectedModel.digest || 'N/A'}</div>
                                </div>

                                {/* Model Information */}
                                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                        <HardDrive className="text-primary" size={16} />
                                        Model Information
                                    </h4>

                                    <div className="space-y-3">
                                        <div className="bg-gray-700/50 rounded-lg p-3">
                                            <div className="text-xs text-gray-400">Model Name</div>
                                            <div className="text-white font-medium break-all">{selectedModel.name}</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-700/50 rounded-lg p-3">
                                                <div className="text-xs text-gray-400">Size</div>
                                                <div className="text-white font-medium">{formatSize(selectedModel.size)}</div>
                                            </div>
                                            <div className="bg-gray-700/50 rounded-lg p-3">
                                                <div className="text-xs text-gray-400">Modified</div>
                                                <div className="text-white font-medium">{formatDate(selectedModel.modified_at)}</div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-700/50 rounded-lg p-3">
                                            <div className="text-xs text-gray-400">Digest</div>
                                            <div className="text-white font-mono text-xs break-all">{selectedModel.digest || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setSelectedModel(null)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        handleDeleteModel(selectedModel.name);
                                        setSelectedModel(null);
                                    }}
                                    disabled={isDownloading}
                                    className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Trash2 size={16} />
                                    Delete Model
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
