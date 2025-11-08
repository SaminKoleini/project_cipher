import React, { useState, useEffect, useRef } from 'react';
import { Mission, Message } from '../types';
import { getHelpResponse } from '../services/geminiService';
import { SkilletIcon, SendIcon, CloseIcon } from './icons';

const HelpChat: React.FC<{ mission: Mission }> = ({ mission }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setIsLoading(true);
            getHelpResponse([], "Hello!", `Title: ${mission.title}, Objective: ${mission.learningObjective}`)
                .then(response => {
                    setMessages([{ sender: 'ai-assistant', text: response }]);
                })
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, messages.length, mission]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;
        
        const newUserMessage: Message = { sender: 'user', text: userInput };
        const newMessages = [...messages, newUserMessage];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        const history = newMessages.slice(0, -1).map((msg): { role: 'user' | 'model'; parts: { text: string }[] } => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
        }));
        
        const missionContext = `Title: ${mission.title}, Objective: ${mission.learningObjective}`;
        const responseText = await getHelpResponse(history, userInput, missionContext);
        
        const newAssistantMessage: Message = { sender: 'ai-assistant', text: responseText };
        setMessages(prev => [...prev, newAssistantMessage]);
        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-cyan-600 text-white rounded-full p-3 shadow-lg hover:bg-cyan-500 transition-all duration-300 hover:scale-110"
                aria-label="Open help chat"
                style={{ textShadow: 'var(--cyan-glow)'}}
            >
                <SkilletIcon className="w-8 h-8"/>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-end items-end fade-in">
                    <div className="hud-border rounded-lg flex flex-col overflow-hidden relative m-4 w-full max-w-md h-full max-h-[70vh] bg-slate-900/80 backdrop-blur-sm">
                        <header className="flex items-center justify-between p-3 border-b border-slate-700 bg-black/30">
                            <div className="flex items-center gap-3">
                                <SkilletIcon className="text-cyan-400 w-8 h-8"/>
                                <span className="font-orbitron text-gray-300">Your AI Assistant</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1 text-gray-400 hover:text-white hover:bg-slate-700 rounded-md">
                                <CloseIcon />
                            </button>
                        </header>
                        
                        <main className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                    {msg.sender === 'ai-assistant' && <SkilletIcon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1"/>}
                                    <div className={`rounded-lg p-3 max-w-xs md:max-w-sm ${msg.sender === 'user' ? 'bg-cyan-800/50 text-white' : 'bg-slate-800 text-gray-300'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-start gap-2">
                                    <SkilletIcon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1"/>
                                    <div className="rounded-lg p-3 bg-slate-800 text-gray-300">
                                        <span className="animate-pulse">...</span>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </main>

                        <footer className="p-3 border-t border-slate-700">
                            <div className="flex items-center gap-2 bg-gray-950 rounded-sm p-2 border border-slate-700 focus-within:ring-2 focus-within:ring-cyan-500">
                               <input type="text" value={userInput} 
                                   onChange={(e) => setUserInput(e.target.value)} 
                                   onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                   className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none font-mono text-sm"
                                   placeholder="Ask for a hint..."
                               />
                               <button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()} className="bg-cyan-600 text-white p-2 rounded-sm hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                   <SendIcon />
                               </button>
                           </div>
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
};

export default HelpChat;