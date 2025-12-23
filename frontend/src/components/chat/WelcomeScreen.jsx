import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

const WelcomeScreen = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 backdrop-blur-sm border border-white/10 animate-fade-in-up">
                 <div className="relative group">
                    <Bot className="w-12 h-12 text-primary relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    <Sparkles className="w-6 h-6 text-purple-400 absolute -top-4 -right-4 animate-pulse z-0" />
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-md animate-pulse"></div>
                 </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent animate-fade-in-up delay-100">
                How can I help you today?
            </h2>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed animate-fade-in-up delay-200">
                I can answer questions using your documents. Try asking about specific topics in your knowledge base.
            </p>
        </div>
    );
};

export default WelcomeScreen;
