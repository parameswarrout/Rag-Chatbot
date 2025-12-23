import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import MessageSkeleton from './MessageSkeleton';
import WelcomeScreen from './WelcomeScreen';

const MessageList = ({ messages, loading, onRegenerate, status, onScrollToBottom }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    if (messages.length === 0) {
        return <WelcomeScreen />;
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar">
            {messages.map((msg, idx) => (
                <MessageBubble
                    key={msg.id}
                    msg={msg}
                    loading={loading}
                    onRegenerate={
                        (msg.role === 'assistant' && idx === messages.length - 1 && !loading)
                        ? onRegenerate
                        : null
                    }
                />
            ))}

            {loading && (
                <div className="w-full">
                    <MessageSkeleton text={status} />
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
