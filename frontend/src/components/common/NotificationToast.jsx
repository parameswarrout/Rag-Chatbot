import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const NotificationToast = ({ notification }) => {
    if (!notification) return null;

    return (
        <div className={`absolute top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-2 fade-in duration-300 ${
            notification.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-xs font-bold">{notification.message}</span>
        </div>
    );
};

export default NotificationToast;
