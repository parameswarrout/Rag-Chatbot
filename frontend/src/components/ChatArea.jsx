import React from 'react';
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';

const ChatArea = ({
    messages,
    loading,
    onSend,
    status,
    provider,
    modelName,
    input,
    setInput
}) => {
    
    const handleSubmit = (e, isRegenerate = false) => {
        onSend(e, isRegenerate);
    };

    return (
        <div className="flex-1 flex flex-col relative bg-gradient-to-br from-gray-900/50 via-black/80 to-gray-900/50 h-screen overflow-hidden">
            <MessageList 
                messages={messages} 
                loading={loading} 
                onRegenerate={() => handleSubmit({ preventDefault: () => {} }, true)}
                status={status}
            />

            <ChatInput 
                input={input} 
                setInput={setInput} 
                onSubmit={handleSubmit} 
                loading={loading} 
                modelName={modelName}
            />
        </div>
    );
};

export default ChatArea;
