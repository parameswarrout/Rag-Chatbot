import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useSidebarLogic = (refreshSessions, onNewChat) => {
    // UI State
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [status, setStatus] = useState({ system: 'checking', ollama: 'checking' });
    
    // Notification & Confirmation State
    const [notification, setNotification] = useState(null);
    const [confirmation, setConfirmation] = useState(null);

    // Sidebar Resize State
    const [width, setWidth] = useState(430);
    const [isResizing, setIsResizing] = useState(false);

    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    // Health Check Polling
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const data = await api.checkHealth();
                setStatus({ 
                    system: 'online', 
                    ollama: data.ollama || 'offline' 
                });
            } catch (e) {
                setStatus({ system: 'offline', ollama: 'offline' });
            }
        };
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handlers
    const handleReset = useCallback(() => {
        setConfirmation({
            message: "Are you sure you want to clear the entire knowledge base? This cannot be undone.",
            onConfirm: async () => {
                try {
                    await api.resetKnowledgeBase();
                    showNotification("Knowledge Base Cleared.", 'success');
                } catch (e) {
                    console.error(e);
                    showNotification("Failed to clear knowledge base.", 'error');
                }
                setConfirmation(null);
            }
        });
    }, [showNotification]);

    const handleProcess = useCallback(async () => {
        setIsProcessing(true);
        setProcessProgress(0);
        
        const interval = setInterval(() => {
            setProcessProgress(prev => (prev >= 90 ? prev : prev + 10));
        }, 300);

        try {
            await api.startIngestion();
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
    }, [showNotification]);

    const handleClearHistory = useCallback(() => {
        setConfirmation({
             message: "Are you sure you want to delete all chat history? This cannot be undone.",
             onConfirm: async () => {
                try {
                    await api.clearSessions();
                    showNotification("History cleared.", 'success');
                    if (refreshSessions) refreshSessions();
                    if (onNewChat) onNewChat(); 
                } catch (e) {
                    console.error(e);
                    showNotification("Failed to clear history.", 'error');
                }
                setConfirmation(null);
             }
        });
    }, [showNotification, refreshSessions, onNewChat]);

    // Resize Logic
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;
            const newWidth = e.clientX;
            if (newWidth >= 300 && newWidth <= 600) setWidth(newWidth);
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

    return {
        isUploadOpen, setIsUploadOpen,
        isProcessing, processProgress,
        status,
        notification, showNotification,
        confirmation, setConfirmation,
        width, isResizing, setIsResizing,
        handleReset, handleProcess, handleClearHistory
    };
};
