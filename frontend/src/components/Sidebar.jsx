import { Sparkles, Plus, MessageSquare, Settings, Cpu, Zap, Box, Upload, X, File, FileType, FileText, Trash2, RefreshCw, Database, AlertCircle, CheckCircle, ChevronDown, Check } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const Sidebar = ({
    sessions,
    currentSessionId,
    onSwitchSession,
    onNewChat,
    mode,
    setMode,
    provider,
    setProvider,
    refreshSessions,
    useRag,
    setUseRag,
    customModel,
    setCustomModel,
    availableModels,
    refreshModels,
    onOpenSettings
}) => {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploadType, setUploadType] = useState('pdf');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // Model Download State
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [downloadModelName, setDownloadModelName] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadStatus, setDownloadStatus] = useState('');

    const handleDownloadModel = async () => {
        if (!downloadModelName) return;
        
        setIsDownloading(true);
        setDownloadProgress(0);
        setDownloadStatus('Starting...');
        
        try {
            const response = await fetch('http://localhost:8000/models/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: downloadModelName })
            });
            
            if (!response.ok) throw new Error('Failed to start download');
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.status) setDownloadStatus(data.status);
                        
                        // Ollama pull progress logic
                        if (data.total && data.completed) {
                            const progress = (data.completed / data.total) * 100;
                            setDownloadProgress(progress);
                        }
                        
                        if (data.status === 'success') {
                            setDownloadProgress(100);
                            setDownloadStatus('Completed');
                        }
                    } catch (e) {
                         // ignore parse errors for partial chunks
                    }
                }
            }
            
            showNotification(`Model ${downloadModelName} downloaded successfully!`, 'success');
            setDownloadModelName('');
            if (refreshModels) refreshModels();
            setTimeout(() => {
                 setIsDownloadOpen(false);
                 setDownloadStatus('');
                 setDownloadProgress(0);
            }, 2000);
            
        } catch (e) {
            console.error(e);
            showNotification(`Failed to download model: ${e.message}`, 'error');
            setDownloadStatus('Failed');
        } finally {
            setIsDownloading(false);
        }
    };

    // Knowledge Base State
    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);

    // System Status State
    const [status, setStatus] = useState({ system: 'checking', ollama: 'checking' });

    const modeDescriptions = {
        fast: "Single query, top result. Fastest response.",
        simple: "Standard search (Top 3). Good for general queries.",
        advanced: "Deep research with query expansion & reranking."
    };

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch('http://localhost:8000/health');
                if (res.ok) {
                    const data = await res.json();
                    setStatus({ 
                        system: 'online', 
                        ollama: data.ollama || 'offline' 
                    });
                } else {
                    setStatus({ system: 'offline', ollama: 'offline' });
                }
            } catch (e) {
                setStatus({ system: 'offline', ollama: 'offline' });
            }
        };

        // Initial check
        checkHealth();

        // Poll every 30 seconds
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    // Notification & Confirmation State
    const [notification, setNotification] = useState(null); // { message, type: 'success'|'error' }
    const [confirmation, setConfirmation] = useState(null); // { message, onConfirm }

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleUpload = () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadProgress(0);
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('file_type', uploadType);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:8000/upload');

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                setUploadProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                setSelectedFile(null);
                setIsUploadOpen(false);
                setUploadProgress(0);
                showNotification('File uploaded and ingestion started!', 'success');
            } else {
                console.error('Upload failed with status', xhr.status);
                showNotification('Failed to upload file.', 'error');
            }
            setIsUploading(false);
        };

        xhr.onerror = () => {
            console.error('XHR Error');
            showNotification('Failed to upload file due to network error.', 'error');
            setIsUploading(false);
        };

        xhr.send(formData);
    };

    const handleReset = async () => {
        setConfirmation({
            message: "Are you sure you want to clear the entire knowledge base? This cannot be undone.",
            onConfirm: async () => {
                try {
                    const res = await fetch('http://localhost:8000/reset', { method: 'POST' });
                    if (!res.ok) throw new Error("Reset failed");
                    showNotification("Knowledge Base Cleared.", 'success');
                } catch (e) {
                    console.error(e);
                    showNotification("Failed to clear knowledge base.", 'error');
                }
                setConfirmation(null);
            }
        });
    };

    const handleProcess = async () => {
        setIsProcessing(true);
        setProcessProgress(0);
        
        // Simulate progress for UX since /ingest is async background task
        const interval = setInterval(() => {
            setProcessProgress(prev => {
                if (prev >= 90) return prev;
                return prev + 10;
            });
        }, 300);

        try {
            const res = await fetch('http://localhost:8000/ingest', { method: 'POST' });
            if (!res.ok) throw new Error("Ingest failed");
            
            clearInterval(interval);
            setProcessProgress(100);
            setTimeout(() => {
                setIsProcessing(false);
                setProcessProgress(0);
                showNotification("Data processing started.", 'success');
            }, 500);
            
        } catch (e) {
            clearInterval(interval);
            setIsProcessing(false);
            showNotification("Failed to start processing.", 'error');
        }
    };

    const handleClearHistory = async () => {
        if (!window.confirm("Are you sure you want to delete all chat history? This cannot be undone.")) return;

        try {
            const res = await fetch('http://localhost:8000/sessions', { method: 'DELETE' });
            if (res.ok) {
                showNotification("History cleared.", 'success');
                if (refreshSessions) refreshSessions();
                if (onNewChat) onNewChat(); 
            } else {
                showNotification("Failed to clear history.", 'error');
            }
        } catch (e) {
            console.error(e);
            showNotification("Failed to connect to server.", 'error');
        }
    };

    // Sidebar Resize State
    const [width, setWidth] = useState(430); // Default 430
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            if (newWidth >= 430 && newWidth <= 550) { // Min 430px, Max 550px
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div
            style={{ width: `${width}px` }}
            className="hidden md:flex flex-col border-r border-white/10 bg-gradient-to-b from-gray-900/50 to-black/70 backdrop-blur-2xl p-3 h-full shadow-2xl z-20 relative transition-none"
        >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-gray-900/20 via-black/30 to-black pointer-events-none"></div>

            {/* Resize Handle */}
            <div
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gradient-to-b from-primary/50 to-purple-500/50 transition-all z-50 group"
                onMouseDown={() => setIsResizing(true)}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gradient-to-b from-primary/50 to-purple-500/50 rounded-full group-hover:bg-gradient-to-b from-primary/80 to-purple-500/80 transition-all" />
            </div>
             
             {/* Notification & Modals... (unchanged logic, just context) */}
             {notification && (
                <div className={`absolute top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-300 ${
                    notification.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-xs font-bold">{notification.message}</span>
                </div>
             )}

             {confirmation && (
                <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full p-4 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 text-red-400 mb-2">
                             <AlertCircle className="w-5 h-5" />
                             <h3 className="text-sm font-bold text-white">Confirm Action</h3>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            {confirmation.message}
                        </p>
                        <div className="flex gap-2 pt-2">
                            <button 
                                onClick={() => setConfirmation(null)}
                                className="flex-1 py-2 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmation.onConfirm}
                                className="flex-1 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
             )}

             {isUploadOpen && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                        {/* ... Upload modal content (keeping mostly same but ensuring fit) ... */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Upload className="w-5 h-5 text-primary" />
                                Upload Knowledge
                            </h3>
                            <button onClick={() => setIsUploadOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-1 rounded-lg hover:bg-white/10">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">File Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['pdf', 'word', 'text'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setUploadType(type)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${uploadType === type 
                                            ? 'bg-primary/20 border-primary/50 text-primary' 
                                            : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300'}`}
                                    >
                                        {type === 'pdf' && <FileText className="w-6 h-6" />}
                                        {type === 'word' && <FileType className="w-6 h-6" />}
                                        {type === 'text' && <File className="w-6 h-6" />}
                                        <span className="text-[10px] uppercase font-bold">{type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select File</label>
                            <div className="relative group">
                                <input 
                                    type="file" 
                                    onChange={(e) => setSelectedFile(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${selectedFile ? 'border-primary/50 bg-primary/5' : 'border-white/10 hover:border-white/20 bg-white/5'}`}>
                                    {selectedFile ? (
                                        <div className="flex flex-col items-center gap-2 text-primary">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                                <File className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                                            <span className="text-[10px] text-primary/70">Click to change</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 flex flex-col items-center">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Upload className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-medium text-gray-300">Click to browse</p>
                                                <p className="text-[10px] text-gray-500">Supports PDF, DOCX, TXT</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isUploading && (
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-gray-400">
                                    <span>Uploading...</span>
                                    <span>{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-primary to-green-400 transition-all duration-300 ease-out"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${!selectedFile || isUploading 
                                ? 'bg-white/5 text-gray-600 cursor-not-allowed' 
                                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110 hover:translate-y-[-1px]'}`}
                        >
                            {isUploading ? 'Uploading...' : 'Confirm Upload'}
                        </button>
                    </div>
                </div>
             )}
            
            {/* Header */}
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
            <div className="mb-4">
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

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {/* Session List */}
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
                                onClick={handleClearHistory}
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

                {/* Knowledge Base Management */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 px-3">
                        <Database className="w-3.5 h-3.5 text-gray-400" />
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gradient-to-r from-gray-400 to-gray-500 bg-clip-text text-transparent">
                            Knowledge Base
                        </label>
                    </div>

                    <div className="space-y-1.5 px-1">
                        <button
                            onClick={() => setIsUploadOpen(true)}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all border border-transparent text-gray-300 hover:bg-white/5 hover:text-white shadow-sm"
                        >
                            <span className="flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                <span>Add Knowledge</span>
                            </span>
                        </button>

                        <div className="space-y-1">
                            <button
                                onClick={handleProcess}
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
                            onClick={handleReset}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/20 shadow-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Reset Memory</span>
                        </button>
                    </div>
                </div>

                {/* Settings Configuration */}
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

                    <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-1.5 border border-white/10 mx-1 backdrop-blur-sm">
                        <div className="grid grid-cols-3 gap-1">
                            {['local', 'groq', 'gemini'].map((p) => {
                                const Icons = { local: Cpu, groq: Zap, gemini: Box };
                                const Icon = Icons[p];
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setProvider(p)}
                                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium transition-all ${
                                            provider === p
                                                ? 'bg-gradient-to-br from-white/20 to-white/10 text-white shadow-sm border border-white/20'
                                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/10'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-xs">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* Custom Model Selection for Local Provider */}
                        {provider === 'local' && (
                            <div className="mt-1 pt-1 border-t border-white/5 px-1 pb-1 space-y-2">
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
                                                onClick={handleDownloadModel}
                                                disabled={!downloadModelName || isDownloading}
                                                className="w-full bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-bold py-1 rounded transition-colors disabled:opacity-50"
                                            >
                                                {isDownloading ? 'Pulling...' : 'Pull Model'}
                                            </button>
                                        </div>
                                        
                                        {/* Download Progress */}
                                        {downloadStatus && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[9px] text-gray-400">
                                                    <span className="truncate max-w-[100px]">{downloadStatus}</span>
                                                    <span>{Math.round(downloadProgress)}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-primary transition-all duration-300"
                                                        style={{ width: `${downloadProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

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
                    </div>

                    <div className="px-3 pt-1 pb-2">
                        <p className="text-xs text-gray-400 font-light leading-relaxed opacity-80">
                            {modeDescriptions[mode]}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Status Panel */}
            <div className="mt-auto pt-3 px-1">
                <div className="bg-gradient-to-b from-white/5 to-white/10 border border-white/10 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-2xl shadow-black/30 relative overflow-hidden group">

                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-r from-primary/10 to-purple-500/10 blur-2xl rounded-full pointer-events-none group-hover:blur-3xl transition-all duration-1000 opacity-70" />

                    {/* Header */}
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                {[1,2,3].map(i => (
                                    <div key={i} className={`w-1 h-4 rounded-full ${i===1 ? 'bg-gradient-to-t from-green-400 to-green-300' : 'bg-white/20'} animate-pulse`} style={{animationDelay: `${i*0.15}s`}} />
                                ))}
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono bg-gradient-to-r from-gray-400 to-gray-500 bg-clip-text text-transparent">System Status</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm">V1.2</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        {/* Server Status */}
                        <div className={`col-span-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-500 relative overflow-hidden ${
                            status.system === 'online'
                            ? 'bg-gradient-to-br from-green-500/10 to-emerald-900/10 border-green-500/30 shadow-lg shadow-green-500/10'
                            : status.system === 'offline'
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-yellow-500/10 border-yellow-500/30'
                        }`}>
                            <div className="relative">
                                <Box className={`w-5 h-5 transition-colors duration-500 ${
                                    status.system === 'online' ? 'text-green-400' :
                                    status.system === 'offline' ? 'text-red-400' : 'text-yellow-400'
                                }`} />
                                {status.system === 'online' && (
                                    <>
                                        <div className="absolute inset-0 bg-green-400 blur-md opacity-20 animate-pulse" />
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.6)] animate-pulse" />
                                    </>
                                )}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className={`text-[10px] font-bold tracking-tight ${
                                    status.system === 'online' ? 'text-green-300' :
                                    status.system === 'offline' ? 'text-red-300' : 'text-yellow-300'
                                }`}>
                                    {status.system === 'online' ? 'BACKEND' : 'OFFLINE'}
                                </span>
                            </div>
                        </div>

                        {/* LLM Status */}
                        <div className={`col-span-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-500 relative overflow-hidden ${
                             status.ollama === 'online'
                             ? 'bg-gradient-to-br from-blue-500/10 to-indigo-900/10 border-blue-500/30 shadow-lg shadow-blue-500/10'
                             : status.ollama === 'offline'
                             ? 'bg-red-500/10 border-red-500/30'
                             : 'bg-yellow-500/10 border-yellow-500/30'
                        }`}>
                            <div className="relative">
                                <Cpu className={`w-5 h-5 transition-colors duration-500 ${
                                    status.ollama === 'online' ? 'text-blue-400' :
                                    status.ollama === 'offline' ? 'text-red-400' : 'text-yellow-400'
                                }`} />
                                {status.ollama === 'online' && (
                                    <>
                                        <div className="absolute inset-0 bg-blue-400 blur-md opacity-20 animate-pulse" />
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.6)] animate-pulse" />
                                    </>
                                )}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className={`text-[10px] font-bold tracking-tight ${
                                    status.ollama === 'online' ? 'text-blue-300' :
                                    status.ollama === 'offline' ? 'text-red-300' : 'checking...'
                                }`}>
                                    {status.ollama === 'online' ? 'LLM ENGINE' : 'NO MODEL'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
