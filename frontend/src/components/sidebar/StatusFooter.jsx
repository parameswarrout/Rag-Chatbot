import React from 'react';
import { Box, Cpu } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const StatusFooter = ({ status }) => {
    return (
        <div className="mt-auto pt-3 px-1">
            <Card className="relative overflow-hidden group shadow-2xl shadow-black/30 bg-gradient-to-b from-white/5 to-white/10">
                {/* Ambient Glow */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-r from-primary/10 to-purple-500/10 blur-2xl rounded-full pointer-events-none group-hover:blur-3xl transition-all duration-1000 opacity-70" />

                {/* Header */}
                <div className="flex items-center justify-between relative z-10 mb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-1 h-4 rounded-full ${i === 1 ? 'bg-gradient-to-t from-green-400 to-green-300' : 'bg-white/20'} animate-pulse`} style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono bg-gradient-to-r from-gray-400 to-gray-500 bg-clip-text text-transparent">System Status</span>
                    </div>
                    <Badge variant="default" className="text-[9px] font-mono px-2 py-1 backdrop-blur-sm">V1.2</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 relative z-10">
                    {/* Server Status */}
                    <StatusItem 
                        icon={Box} 
                        label="API" 
                        status={status.system} 
                    />

                    {/* Ollama Status */}
                    <StatusItem 
                        icon={Cpu} 
                        label="OLLAMA" 
                        status={status.ollama} 
                    />
                </div>
            </Card>
        </div>
    );
};

const StatusItem = ({ icon: Icon, label, status }) => {
    const isOnline = status === 'online';
    const variant = isOnline ? 'success' : status === 'offline' ? 'danger' : 'warning';
    
    return (
        <div className={`col-span-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-500 relative overflow-hidden ${
            isOnline
            ? 'bg-gradient-to-br from-green-500/10 to-emerald-900/10 border-green-500/30'
            : status === 'offline'
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-yellow-500/10 border-yellow-500/30'
        }`}>
            <Icon className={`w-5 h-5 transition-colors duration-500 ${
                isOnline ? 'text-green-400' : status === 'offline' ? 'text-red-400' : 'text-yellow-400'
            }`} />
            <span className={`text-[10px] font-bold tracking-tight ${
                 isOnline ? 'text-green-300' : status === 'offline' ? 'text-red-300' : 'text-yellow-300'
            }`}>
                {label} {status.toUpperCase()}
            </span>
        </div>
    );
};

export default StatusFooter;
