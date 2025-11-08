import React, { useState, useEffect, useRef } from 'react';
import { NoteIcon, CloseIcon } from './icons';

const NoteTaker: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // Load notes from localStorage on initial render
        const savedNotes = localStorage.getItem('project-cipher-notes');
        if (savedNotes) {
            setNotes(savedNotes);
        }
    }, []);

    useEffect(() => {
        // Save notes to localStorage whenever they change
        const handler = setTimeout(() => {
            localStorage.setItem('project-cipher-notes', notes);
        }, 500); // Debounce saving to avoid excessive writes

        return () => {
            clearTimeout(handler);
        };
    }, [notes]);
    
    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-yellow-600 text-white rounded-full p-3 shadow-lg hover:bg-yellow-500 transition-all duration-300 hover:scale-110"
                aria-label="Open field notes"
            >
                <NoteIcon className="w-8 h-8"/>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-end items-end fade-in">
                    <div className="hud-border rounded-lg flex flex-col overflow-hidden relative m-4 w-full max-w-md h-full max-h-[70vh] bg-slate-900/80 backdrop-blur-sm">
                        <header className="flex items-center justify-between p-3 border-b border-slate-700 bg-black/30">
                            <div className="flex items-center gap-3">
                                <NoteIcon className="text-yellow-400 w-8 h-8"/>
                                <span className="font-orbitron text-gray-300">Field Notes</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1 text-gray-400 hover:text-white hover:bg-slate-700 rounded-md">
                                <CloseIcon />
                            </button>
                        </header>
                        
                        <main className="flex-1 p-2">
                           <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full h-full bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none font-mono resize-none p-2"
                                placeholder="Start typing your notes here..."
                           />
                        </main>

                        <footer className="p-2 border-t border-slate-700 text-center text-xs text-gray-500 font-mono">
                           Notes are saved automatically.
                        </footer>
                    </div>
                </div>
            )}
        </>
    );
};

export default NoteTaker;