import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConfirmationDialog = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full p-4 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 text-red-400 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="text-sm font-bold text-white">Confirm Action</h3>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                    {message}
                </p>
                <div className="flex gap-2 pt-2">
                    <button 
                        onClick={onCancel}
                        className="flex-1 py-2 rounded-lg text-xs font-bold bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationDialog;
