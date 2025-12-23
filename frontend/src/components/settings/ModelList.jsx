import React from 'react';
import { HardDrive, Trash2, Database } from 'lucide-react';
import { formatSize, formatDate } from '../../utils/formatters';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const ModelList = ({ models = [], onSelectModel, onDeleteModel }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <HardDrive className="text-green-400" size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Installed Models</h3>
                </div>
                <Badge className="bg-gray-700/50 text-gray-300 text-sm">
                    {models.length} {models.length === 1 ? 'model' : 'models'}
                </Badge>
            </div>

            {models.length === 0 ? (
                <Card className="border-dashed border-gray-700 p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <Database className="text-gray-500" size={40} />
                    </div>
                    <h4 className="text-lg font-medium text-white mb-2">No models installed</h4>
                    <p className="text-gray-400 max-w-md mx-auto">
                        You haven't downloaded any models yet. Pull a model from the section above to get started.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {models.map(model => (
                        <Card
                            key={model.name}
                            className="bg-gradient-to-r from-gray-800/50 to-gray-800/30 hover:border-gray-600 cursor-pointer group"
                            onClick={() => onSelectModel(model)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="text-white font-semibold truncate max-w-[70%]">
                                    {model.name.split(':')[0]}
                                    <span className="text-xs text-gray-400 ml-1">
                                        {model.name.includes(':') && `:${model.name.split(':')[1]}`}
                                    </span>
                                </h4>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteModel(model.name);
                                    }}
                                    className="p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ModelList;
