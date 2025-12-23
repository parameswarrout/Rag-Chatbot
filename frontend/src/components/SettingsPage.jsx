import React from 'react';
import { Settings } from 'lucide-react';
import Modal from './ui/Modal';
import SystemStatusCards from './settings/SystemStatusCards';
import ModelDownloadCard from './settings/ModelDownloadCard';
import ModelList from './settings/ModelList';
import ModelDetailsModal from './settings/ModelDetailsModal';
import ConfirmationDialog from './common/ConfirmationDialog';
import NotificationToast from './common/NotificationToast';
import { useSettingsLogic } from '../hooks/useSettingsLogic';

const SettingsPage = ({ onClose, availableModels, refreshModels, systemStatus }) => {
    
    const {
        notification,
        confirmation, setConfirmation,
        selectedModel, setSelectedModel,
        showNotification,
        handleDeleteModel
    } = useSettingsLogic(refreshModels);

    return (
        <React.Fragment>
            <Modal
                isOpen={true}
                onClose={onClose}
                title={
                    <div className="flex items-center gap-3">
                        <Settings className="text-primary" size={28} />
                        <div>
                            <h2 className="text-2xl font-bold text-white">System Configuration</h2>
                            <p className="text-sm text-gray-400 font-normal mt-1">
                                Manage your local Ollama models and system status
                            </p>
                        </div>
                    </div>
                }
                maxWidth="max-w-4xl"
            >
                <div className="relative">
                     <NotificationToast notification={notification} />

                     <div className="space-y-6">
                        <SystemStatusCards systemStatus={systemStatus} />
                        
                        <ModelDownloadCard 
                            refreshModels={refreshModels} 
                            showNotification={showNotification} 
                        />

                        <ModelList 
                            models={availableModels} 
                            onSelectModel={setSelectedModel} 
                            onDeleteModel={handleDeleteModel}
                        />

                         {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-700/50 text-center text-xs text-gray-500 mt-8">
                            System Configuration Panel • Ollama Integration
                        </div>
                     </div>
                </div>
            </Modal>

            {/* Nested Modal for Details */}
            <ModelDetailsModal 
                model={selectedModel} 
                onClose={() => setSelectedModel(null)} 
                onDelete={handleDeleteModel} 
            />

            {/* Confirmation Dialog */}
            {confirmation && (
                <ConfirmationDialog 
                    message={confirmation.message} 
                    onConfirm={confirmation.onConfirm} 
                    onCancel={() => setConfirmation(null)} 
                />
            )}
        </React.Fragment>
    );
};

export default SettingsPage;
