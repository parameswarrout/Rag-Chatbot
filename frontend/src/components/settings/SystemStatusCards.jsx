import React from 'react';
import { Server, Cpu, CheckCircle, Activity, X } from 'lucide-react';

const SystemStatusCards = ({ systemStatus }) => {
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
    );
};

export default SystemStatusCards;
