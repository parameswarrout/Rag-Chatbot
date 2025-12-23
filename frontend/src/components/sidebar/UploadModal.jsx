import React, { useState } from 'react';
import { Upload, X, File, FileText, FileType } from 'lucide-react';
import { api } from '../../services/api';

const UploadModal = ({ isOpen, onClose, onUploadSuccess, showNotification }) => {
    const [uploadType, setUploadType] = useState('pdf');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            await api.uploadFile(selectedFile, uploadType, setUploadProgress);
            setSelectedFile(null);
            setUploadProgress(0);
            onUploadSuccess(); // Notify parent
            onClose(); // Close modal
        } catch (e) {
            console.error(e);
            showNotification('Failed to upload file.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Upload className="w-5 h-5 text-primary" />
                        Upload Knowledge
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-1 rounded-lg hover:bg-white/10">
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
    );
};

export default UploadModal;
