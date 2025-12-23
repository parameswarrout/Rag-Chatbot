import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { useChat } from './hooks/useChat';

import SettingsPage from './components/SettingsPage';

function App() {
  const [messages, setMessages] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const {
    submitMessage,
    isLoading,
    messages: chatMessages,
    clearHistory,
    currentSessionId,
    sessions,
    switchSession,
    createNewSession,
    refreshSessions,
    status: thinkingStatus,
    provider,
    setProvider,
    mode,
    setMode,
    customModel,
    setCustomModel,
    useRag,
    setUseRag,
    availableModels,
    refreshModels,
    status,
    input,
    setInput
  } = useChat();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden font-sans selection:bg-primary/30 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900/30 via-black/50 to-black"></div>

      <Sidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSwitchSession={switchSession}
          onNewChat={createNewSession}
          refreshSessions={refreshSessions}
          mode={mode}
          setMode={setMode}
          provider={provider}
          setProvider={setProvider}
          useRag={useRag}
          setUseRag={setUseRag}
          customModel={customModel}
          setCustomModel={setCustomModel}
          availableModels={availableModels}
          refreshModels={refreshModels}
          onOpenSettings={() => setShowSettings(true)}
       />

       <main className="flex-1 relative flex flex-col h-full min-w-0 bg-gradient-to-b from-black/80 via-black to-black/90 backdrop-blur-sm">
          <ChatArea
            messages={chatMessages}
            loading={isLoading}
            onSend={submitMessage}
            status={thinkingStatus}
            provider={provider}
            modelName={customModel}
            input={input}
            setInput={setInput}
          />

          {showSettings && (
            <SettingsPage
              onClose={() => setShowSettings(false)}
              availableModels={availableModels}
              refreshModels={refreshModels}
              systemStatus={status} // Passing the status object from useChat
            />
          )}

       </main>
    </div>
  );
}

export default App;
