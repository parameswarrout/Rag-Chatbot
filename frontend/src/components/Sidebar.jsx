import React, { Suspense, lazy } from 'react';
import SidebarHeader from './sidebar/SidebarHeader';
import SessionList from './sidebar/SessionList';
import KnowledgeBaseSection from './sidebar/KnowledgeBaseSection';
import ConfigurationSection from './sidebar/ConfigurationSection';
import StatusFooter from './sidebar/StatusFooter';
import ConfirmationDialog from './common/ConfirmationDialog';
import NotificationToast from './common/NotificationToast';
import { useSidebarLogic } from '../hooks/useSidebarLogic';

const UploadModal = lazy(() => import('./sidebar/UploadModal'));

const Sidebar = ({
    sessions,
    currentSessionId,
    onSwitchSession,
    onNewChat,
    mode,
    setMode,
    provider,
    setProvider,
    refreshSessions,
    useRag,
    setUseRag,
    customModel,
    setCustomModel,
    availableModels,
    refreshModels,
    onOpenSettings
}) => {
    
    const {
        isUploadOpen, setIsUploadOpen,
        isProcessing, processProgress,
        status,
        notification, showNotification,
        confirmation, setConfirmation,
        width, isResizing, setIsResizing,
        handleReset, handleProcess, handleClearHistory
    } = useSidebarLogic(refreshSessions, onNewChat);

    return (
        <div
            style={{ width: `${width}px` }}
            className="hidden md:flex flex-col border-r border-white/10 bg-gradient-to-b from-gray-900/50 to-black/70 backdrop-blur-2xl p-3 h-full shadow-2xl z-20 relative transition-none"
        >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-gray-900/20 via-black/30 to-black pointer-events-none"></div>

            <div
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-gradient-to-b from-primary/50 to-purple-500/50 transition-all z-50 group"
                onMouseDown={() => setIsResizing(true)}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-gradient-to-b from-primary/50 to-purple-500/50 rounded-full group-hover:bg-gradient-to-b from-primary/80 to-purple-500/80 transition-all" />
            </div>
             
             <NotificationToast notification={notification} />

             {confirmation && (
                <ConfirmationDialog 
                    message={confirmation.message} 
                    onConfirm={confirmation.onConfirm} 
                    onCancel={() => setConfirmation(null)} 
                />
             )}

             {isUploadOpen && (
                 <Suspense fallback={null}>
                    <UploadModal 
                        isOpen={isUploadOpen} 
                        onClose={() => setIsUploadOpen(false)} 
                        onUploadSuccess={() => showNotification('File uploaded and ingestion started!', 'success')}
                        showNotification={showNotification}
                    />
                 </Suspense>
             )}
            
            <SidebarHeader onNewChat={onNewChat} />

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                <SessionList 
                    sessions={sessions} 
                    currentSessionId={currentSessionId} 
                    onSwitchSession={onSwitchSession} 
                    onClearHistory={handleClearHistory}
                />

                <KnowledgeBaseSection 
                    onOpenUpload={() => setIsUploadOpen(true)}
                    onProcess={handleProcess}
                    onReset={handleReset}
                    isProcessing={isProcessing}
                    processProgress={processProgress}
                />

                <ConfigurationSection 
                    onOpenSettings={onOpenSettings}
                    useRag={useRag}
                    setUseRag={setUseRag}
                    provider={provider}
                    setProvider={setProvider}
                    customModel={customModel}
                    setCustomModel={setCustomModel}
                    availableModels={availableModels}
                    refreshModels={refreshModels}
                    mode={mode}
                    setMode={setMode}
                    showNotification={showNotification}
                />
            </div>

            <StatusFooter status={status} />
        </div>
    );
};

export default Sidebar;
