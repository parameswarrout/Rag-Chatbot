import { useState } from 'react';
import { api } from '../services/api';

export const useSettingsLogic = (refreshModels) => {
    const [notification, setNotification] = useState(null);
    const [selectedModel, setSelectedModel] = useState(null);
    const [confirmation, setConfirmation] = useState(null);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleDeleteModel = (modelName) => {
        setConfirmation({
            message: `Are you sure you want to delete the model "${modelName}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await api.deleteModel(modelName);
                    showNotification(`Model ${modelName} deleted`, 'success');
                    if (refreshModels) refreshModels();
                    if (selectedModel?.name === modelName) setSelectedModel(null);
                } catch (e) {
                    showNotification(e.message, 'error');
                }
                setConfirmation(null);
            }
        });
    };

    return {
        notification,
        confirmation, setConfirmation,
        selectedModel, setSelectedModel,
        showNotification,
        handleDeleteModel
    };
};
