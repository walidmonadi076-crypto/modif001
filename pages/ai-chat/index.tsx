import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types';
import SEO from '../../components/SEO';
import { markdownToHtml } from '../../lib/markdown';

const AIChatPage: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        inputRef.current?.focus();
        setMessages([
            { role: 'model', content: 'Hello! I am your G2gaming assistant. How can I help you with games, guides, or gear today?' }
        ]);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        const currentInput = input;
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const history = messages.slice(-10);
            
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history, message: currentInput }),
            });

            if (!response.ok || !response.body) {
                const errData = response.status === 500 ? { error: 'An internal server error occurred.' } : await response.json();
                throw new Error(errData.error || 'Failed to get response from server.');
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiResponseContent = '';

            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                aiResponseContent += decoder.decode(value, { stream: true });
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = aiResponseContent;
                    return newMessages;
                });
            }

        } catch (err) {
            setError((err as Error).message);
            setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };
    
    const UserIcon = () => (
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white flex-shrink-0">
            U
        </div>
    );
    
    const ModelIcon = () => (
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
    );

    return (
        <>
            <SEO title="AI Gaming Assistant" description="Chat with our AI assistant for gaming tips, recommendations, and more." noindex={true} />
            <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                <div className="text-center py-4 border-b border-gray-700 flex-shrink-0">
                    <h1 className="text-2xl font-bold">AI Gaming Assistant</h1>
                    <p className="text-sm text-gray-400">Powered by Gemini. AI can make mistakes.</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                           {msg.role === 'model' && <ModelIcon />}
                           <div className={`max-w-xl p-3 rounded-xl ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-700 text-white rounded-bl-none'}`}>
                               <div className="prose prose-invert prose-sm max-w-none text-white prose-strong:text-white prose-em:text-white" dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }} />
                           </div>
                           {msg.role === 'user' && <UserIcon />}
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role !== 'model' && (
                         <div className="flex items-start gap-3">
                            <ModelIcon />
                            <div className="max-w-xl p-3 rounded-xl bg-gray-700 text-white rounded-bl-none">
                                <div className="flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {error && <p className="text-red-400 text-center text-sm px-4 flex-shrink-0 pb-2">{error}</p>}
                
                <div className="p-4 border-t border-gray-700 flex-shrink-0">
                    <form onSubmit={handleSubmit} className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about games, guides, or gear..."
                            className="flex-1 w-full px-4 py-2 bg-gray-700 rounded-full border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading || !input.trim()} className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors flex-shrink-0">
                             <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.39999 6.32003L15.89 3.49003C19.7 2.22003 21.77 4.30003 20.51 8.11003L17.68 16.6C15.78 22.31 12.66 22.31 10.76 16.6L9.91999 14.08L7.39999 13.24C1.68999 11.34 1.68999 8.23003 7.39999 6.32003Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10.11 13.6501L13.69 10.0601" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AIChatPage;
