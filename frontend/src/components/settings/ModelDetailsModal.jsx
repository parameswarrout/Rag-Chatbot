import React from 'react';
import { HardDrive, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { formatSize, formatDate } from '../../utils/formatters';

const ModelDetailsModal = ({ model, onClose, onDelete }) => {
    if (!model) return null;

    return (
        <Modal 
            isOpen={!!model} 
            onClose={onClose} 
            title={
                <span className="flex items-center gap-2">
                    <HardDrive className="text-primary" size={20} />
                    Model Details: {model.name}
                </span>
            }
            maxWidth="max-w-2xl"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gray-800/50">
                        <div className="text-xs text-gray-400 mb-1">Model Size</div>
                        <div className="text-white font-bold text-lg">{formatSize(model.size)}</div>
                    </Card>
                    <Card className="bg-gray-800/50">
                        <div className="text-xs text-gray-400 mb-1">Updated</div>
                        <div className="text-white font-bold text-lg">{formatDate(model.modified_at)}</div>
                    </Card>
                </div>

                <Card className="bg-gray-800/50">
                    <div className="text-xs text-gray-400 mb-2">Model Digest</div>
                    <div className="text-sm font-mono text-gray-300 break-all">{model.digest || 'N/A'}</div>
                </Card>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                    <Button 
                        variant="danger" 
                        onClick={() => onDelete(model.name)}
                    >
                        <Trash2 size={16} className="mr-2" />
                        Delete Model
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ModelDetailsModal;
