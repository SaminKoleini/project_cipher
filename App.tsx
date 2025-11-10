


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, PhishingChallenge, Mission } from './types';
import { cases, SUPERVISOR_NAME } from './constants';
import { getTutorResponse, generatePhishingChallenge, validatePasswordStrength, validateChallengeResponse, generateDynamicTextChallenge } from './services/geminiService';
import { SendIcon, LoadingSpinner, ShieldCheckIcon, CheckCircleIcon, TargetIcon, UserCircleIcon, ArrowLeftIcon, CaseIcon, TerminalIcon, IntelIcon, DocumentTextIcon, SkipIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, CloseIcon } from './components/icons';
import HelpChat from './components/HelpChat';
import NoteTaker from './components/NoteTaker';

type GameState = 'intake' | 'welcome' | 'briefing' | 'training' | 'challenge' | 'challenge-complete' | 'case-summary' | 'all-missions-complete';
type View = 'dashboard' | 'profile';

// --- Audio Utility ---
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

const playSound = (type: 'click' | 'type' | 'success' | 'fail' | 'hover' | 'notification') => {
    if (!audioContext || audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);

    let duration = 0.2;
    let rampTime = 0.01;
    let startGain = 0.2;

    switch (type) {
        case 'click':
            startGain = 0.2;
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            break;
        case 'type':
            // Typewriter sound effect
            startGain = 0.03;
            rampTime = 0; // Instant attack
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.05);
            duration = 0.05;
            break;
        case 'success':
            startGain = 0.3;
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.linearRampToValueAtTime(1046.50, audioContext.currentTime + 0.2); // C6
            break;
        case 'fail':
             startGain = 0.3;
             oscillator.type = 'square';
             oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
             oscillator.frequency.linearRampToValueAtTime(110, audioContext.currentTime + 0.2);
             break;
        case 'hover':
            startGain = 0.05;
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            break;
        case 'notification':
            startGain = 0.4;
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(1500, audioContext.currentTime + 0.1);
            duration = 0.15;
            break;
    }

    if (rampTime > 0) {
        gainNode.gain.linearRampToValueAtTime(startGain, audioContext.currentTime + rampTime);
    } else {
        gainNode.gain.setValueAtTime(startGain, audioContext.currentTime);
    }

    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
};

const FormattedMessage = ({ text }: { text: string }) => {
  const renderWithBold = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-cyan-300 font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listType && listItems.length > 0) {
      const ListComponent = listType === 'ul' ? 'ul' : 'ol';
      const listClass = listType === 'ul' ? 'list-disc' : 'ol';
      elements.push(
        <ListComponent key={elements.length} className={`${listClass} list-inside pl-4 my-2 space-y-1 text-left`}>
          {listItems.map((item, i) => <li key={i}>{renderWithBold(item)}</li>)}
        </ListComponent>
      );
    }
    listItems = [];
    listType = null;
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    const isUnordered = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ');
    const isOrdered = /^\d+\.\s/.test(trimmedLine);

    if (isUnordered) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(trimmedLine.substring(2));
    } else if (isOrdered) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(trimmedLine.replace(/^\d+\.\s/, ''));
    } else {
      flushList();
      if (trimmedLine) {
        elements.push(<div key={elements.length}>{renderWithBold(line)}</div>);
      }
    }
  });

  flushList();

  return <>{elements}</>;
};


const CommsScreen = ({ messages, isLoading }: { messages: Message[], isLoading: boolean }) => {
    const [typedMessage, setTypedMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const typingIntervalRef = useRef<number | null>(null);
    const isTyping = typingIntervalRef.current !== null;

    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    const skipTyping = useCallback(() => {
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }
        if (lastMessage && lastMessage.sender === 'supervisor') {
            setTypedMessage(lastMessage.text);
        }
    }, [lastMessage]);

    useEffect(() => {
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }

        if (lastMessage && lastMessage.sender === 'supervisor') {
            const textToType = lastMessage.text;
            if (!textToType) return;

            setTypedMessage('');
            let i = 0;
            
            playSound('type');

            typingIntervalRef.current = window.setInterval(() => {
                i++;
                const currentText = textToType.substring(0, i)
                setTypedMessage(currentText);
                if (i >= textToType.length) {
                    if (typingIntervalRef.current) {
                        clearInterval(typingIntervalRef.current);
                        typingIntervalRef.current = null;
                        // Force a re-render to hide the button
                        setTypedMessage(textToType);
                    }
                }
            }, 20);

            return () => {
                if (typingIntervalRef.current) {
                    clearInterval(typingIntervalRef.current);
                    typingIntervalRef.current = null;
                }
            };
        }
    }, [lastMessage]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [typedMessage, messages]);

    const messagesToRender = lastMessage?.sender === 'supervisor' ? messages.slice(0, -1) : messages;

    return (
        <div className="font-mono text-base text-gray-300 h-full overflow-y-auto p-4 flex flex-col relative">
            <div className="flex-grow space-y-4">
                {messagesToRender.map((msg, index) => (
                    <div key={index} className="leading-relaxed">
                        {msg.sender === 'supervisor' ? (
                            <div><span className="text-cyan-400 select-none">{SUPERVISOR_NAME}&gt; </span><FormattedMessage text={msg.text} /></div>
                        ) : (
                            <p><span className="text-green-400 select-none">Recruit&gt;</span> {msg.text}</p>
                        )}
                    </div>
                ))}
                {lastMessage?.sender === 'supervisor' && typedMessage && (
                     <div className="leading-relaxed">
                        <div><span className="text-cyan-400 select-none">{SUPERVISOR_NAME}&gt; </span><FormattedMessage text={typedMessage} />{isTyping && <span className="animate-pulse">_</span>}</div>
                    </div>
                )}
                {isLoading && messages[messages.length-1]?.sender === 'user' && (
                    <div>
                         <span className="text-cyan-400 select-none">{SUPERVISOR_NAME}&gt;</span> <span className="text-gray-500 animate-pulse">...</span>
                    </div>
                )}
            </div>
             {isTyping && (
                <button 
                    onClick={skipTyping} 
                    className="absolute bottom-4 right-4 bg-cyan-800/70 hover:bg-cyan-700 rounded-full p-2 text-white transition-all animate-pulse"
                    aria-label="Skip typing animation"
                >
                    <SkipIcon />
                </button>
            )}
            <div ref={chatEndRef} />
        </div>
    );
};

const ProgressBar = ({ progress, segments = 20 }: { progress: number; segments?: number }) => {
    const [animatedSegments, setAnimatedSegments] = useState(0);

    useEffect(() => {
        const targetSegments = Math.floor((progress / 100) * segments);
        setAnimatedSegments(0);

        if (targetSegments > 0) {
            let i = 0;
            const interval = setInterval(() => {
                i++;
                if(i <= targetSegments) {
                   setAnimatedSegments(i);
                   playSound('hover');
                }
                if (i >= targetSegments) {
                    clearInterval(interval);
                }
            }, 50);
            return () => clearInterval(interval);
        }
    }, [progress, segments]);

    return (
        <div className="flex gap-1 h-4 w-full">
            {[...Array(segments)].map((_, i) => {
                const isActive = i < animatedSegments;
                return (
                    <div
                        key={i}
                        className="flex-1 transition-all duration-300"
                        style={{
                            backgroundColor: isActive ? '#06b6d4' : '#1e293b',
                            boxShadow: isActive ? '0 0 3px #06b6d4, 0 0 5px #06b6d4' : 'none',
                            opacity: isActive ? 1 : 0.5,
                        }}
                    />
                );
            })}
        </div>
    );
};

const IntakeScreen = ({ onOpenMessage }: { onOpenMessage: () => void }) => {
    const [status, setStatus] = useState<'connecting' | 'receiving' | 'received'>('connecting');
    const statusText = {
        connecting: 'CONNECTING TO AGENCY SERVER...',
        receiving: 'INCOMING TRANSMISSION...',
        received: 'MESSAGE RECEIVED.'
    }

    useEffect(() => {
        const t1 = setTimeout(() => {
            setStatus('receiving');
        }, 2000);
        const t2 = setTimeout(() => {
            setStatus('received');
            playSound('notification');
        }, 3500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, []);

    return (
        <div className="h-full flex flex-col justify-center items-center text-center p-8">
            <div className="w-full max-w-2xl p-8 bg-black/50 hud-border fade-in">
                <h2 className="font-orbitron text-lg text-cyan-400 tracking-widest">// SECURE MESSAGING CLIENT v3.1 //</h2>
                <hr className="border-slate-700 my-4"/>
                <div className="font-mono text-gray-400 my-8">
                    <p className="animate-pulse">{statusText[status]}</p>
                </div>
                {status === 'received' && (
                    <div 
                        className="p-4 border-2 border-cyan-700 bg-cyan-900/20 hover:bg-cyan-900/40 cursor-pointer text-left transition-all duration-300 animate-pulse hover:animate-none"
                        onClick={onOpenMessage}
                        onMouseEnter={() => playSound('hover')}
                    >
                        <p className="font-mono text-sm text-gray-400">FROM: &gt; UNKNOWN SENDER</p>
                        <p className="font-mono text-lg text-cyan-300">SUBJECT: &gt; URGENT: FOR YOUR EYES ONLY</p>
                        <p className="font-mono text-xs text-yellow-400 mt-2">[ Click to Decrypt and Open ]</p>
                    </div>
                )}
            </div>
        </div>
    )
}


const WelcomeScreen = ({ onStart }: { onStart: () => void }) => {
    const [typedHeader, setTypedHeader] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        const targetText = "// CONFIDENTIAL //";
        let i = 0;
        
        const interval = setInterval(() => {
            if (i < targetText.length) {
                setTypedHeader(targetText.substring(0, i + 1));
                playSound('type');
                i++;
            } else {
                clearInterval(interval);
                setIsTyping(false);
            }
        }, 120);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-full flex flex-col justify-center items-center text-center p-8">
            <div className="w-full max-w-3xl p-8 bg-black/50 hud-border fade-in">
                 <h2 className="font-orbitron text-2xl text-red-500 tracking-widest min-h-[32px]">
                    {typedHeader}
                    {isTyping && <span className="animate-pulse">_</span>}
                 </h2>
                 <hr className="border-slate-700 my-4"/>
                 <h1 className="text-3xl font-orbitron text-cyan-400 tracking-widest uppercase text-glow mb-4">
                    SUBJECT: PROJECT CIPHER
                </h1>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto text-left font-mono leading-relaxed">
                    You are receiving this transmission because you have been selected. The digital world is the new battlefield, a constant, silent war fought in shadows and light.
                    <br/><br/>
                    We are the agency on the front lines of this war, and we need operatives with your potential.
                    <br/><br/>
                    Your mission, should you choose to accept, is to become an elite agent, trained in the arts of digital espionage, defense, and deception. The stakes are higher than you can imagine. Do not fail.
                </p>
                <button onClick={onStart} className="btn-primary text-xl" onMouseEnter={() => playSound('hover')}>
                    [ Accept Mission ]
                </button>
            </div>
        </div>
    );
};

const BriefingScreen = ({ mission, onProceed }: { mission: Mission, onProceed: () => void }) => {
    return (
        <div className="h-full flex flex-col justify-center items-center text-center p-4 md:p-8">
            <div className="w-full max-w-3xl p-6 md:p-8 bg-black/50 hud-border fade-in">
                <DocumentTextIcon />
                <h2 className="font-orbitron text-2xl text-cyan-400 tracking-widest uppercase text-glow mb-2">
                    Mission Briefing
                </h2>
                <p className="text-lg font-semibold text-gray-300 mb-4">{mission.title}</p>
                <hr className="border-slate-700 my-4"/>
                <div className="text-left font-mono text-gray-300 leading-relaxed max-h-64 overflow-y-auto pr-4">
                    <p>{mission.briefing}</p>
                </div>
                <div className="mt-8">
                    <button onClick={onProceed} className="btn-primary text-lg" onMouseEnter={() => playSound('hover')}>
                        [ Acknowledge & Proceed ]
                    </button>
                </div>
            </div>
        </div>
    );
};

interface MissionBriefingModalProps {
  mission: Mission;
  onClose: () => void;
  gameState: GameState;
  challengeData: any;
  messages: Message[];
}

const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({ mission, onClose, gameState, challengeData, messages }) => {
    const lastSupervisorMessage = messages.filter(m => m.sender === 'supervisor').pop();

    let challengePrompt = '';
    if ((gameState === 'challenge' || gameState === 'challenge-complete') && challengeData) {
        if (mission.challenge.type === 'spot-the-phish' && challengeData.body) {
            challengePrompt = `From: ${challengeData.sender_name} <${challengeData.sender_email}>\nSubject: ${challengeData.subject}\n\n${challengeData.body}`;
        } else if (mission.challenge.type === 'password-strength') {
            challengePrompt = `Construct a secure password that meets agency standards for security.`;
        } else if (mission.challenge.type === 'text-response' && challengeData.question) {
            challengePrompt = challengeData.question;
        }
    }
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 fade-in">
            <div className="w-full max-w-3xl hud-border p-6 md:p-8 bg-slate-900/80 backdrop-blur-sm relative text-center">
                <button onClick={onClose} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
                    <CloseIcon />
                </button>
                <DocumentTextIcon />
                <h2 className="font-orbitron text-2xl text-cyan-400 tracking-widest uppercase text-glow mb-2">
                    Mission Intel
                </h2>
                <p className="text-lg font-semibold text-gray-300 mb-4">{mission.title}</p>
                <hr className="border-slate-700 my-4"/>
                <div className="text-left font-mono text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-4 space-y-6">
                    <div>
                        <h3 className="font-orbitron text-lg text-cyan-400 mb-2">// BRIEFING //</h3>
                        <p>{mission.briefing}</p>
                    </div>

                    {lastSupervisorMessage && (
                        <div>
                            <h3 className="font-orbitron text-lg text-cyan-400 mb-2">// SUPERVISOR DIRECTIVE //</h3>
                            <div className="p-3 bg-black/30 border border-slate-700 rounded-md">
                                <FormattedMessage text={lastSupervisorMessage.text} />
                            </div>
                        </div>
                    )}

                    {challengePrompt && (
                         <div>
                            <h3 className="font-orbitron text-lg text-cyan-400 mb-2">// CURRENT OBJECTIVE //</h3>
                             <div className="p-3 bg-black/30 border border-slate-700 rounded-md whitespace-pre-wrap">
                                 <FormattedMessage text={challengePrompt} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default function App() {
    const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
    const [currentMissionIndex, setCurrentMissionIndex] = useState(0);
    const [completedMissionIds, setCompletedMissionIds] = useState<Set<number>>(new Set());
    const [gameState, setGameState] = useState<GameState>('intake');
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAwaitingChallenge, setIsAwaitingChallenge] = useState(false);
    const [view, setView] = useState<View>('dashboard');
    const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
    
    const [challengeData, setChallengeData] = useState<any>(null);
    const [challengeFeedback, setChallengeFeedback] = useState<{isCorrect: boolean, text: string} | null>(null);

    const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
    const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

    const currentCase = cases[currentCaseIndex];
    const currentMission = currentCase.missions[currentMissionIndex];

    const startTraining = useCallback(() => {
        playSound('click');
        setMessages([]);
        setChallengeData(null);
        setChallengeFeedback(null);
        setIsAwaitingChallenge(false);
        setGameState('training');
        setIsLoading(true);
        getTutorResponse(currentMission.supervisorPrompt, [], "Begin training.")
            .then(response => {
                const newSupervisorMessage: Message = { sender: 'supervisor', text: response };
                setMessages([newSupervisorMessage]);
                if (response.includes(currentMission.challengeTriggerPhrase)) {
                    setIsAwaitingChallenge(true);
                }
            })
            .finally(() => setIsLoading(false));
    }, [currentMission]);
    
    const handleMissionSelect = (caseIdx: number, missionIdx: number) => {
        playSound('click');
        setCurrentCaseIndex(caseIdx);
        setCurrentMissionIndex(missionIdx);
        setGameState('briefing');
        setMessages([]);
        setChallengeData(null);
        setChallengeFeedback(null);
        setIsAwaitingChallenge(false);
    };

    const handleSendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;
        playSound('click');
        const newUserMessage: Message = { sender: 'user', text: messageText };
        const newMessages = [...messages, newUserMessage];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        const history = newMessages.slice(0, -1).map((msg): { role: 'user' | 'model'; parts: { text: string }[] } => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
        }));

        const responseText = await getTutorResponse(currentMission.supervisorPrompt, history, messageText);
        
        const newSupervisorMessage: Message = { sender: 'supervisor', text: responseText };
        setMessages(prev => [...prev, newSupervisorMessage]);

        if (responseText.includes(currentMission.challengeTriggerPhrase)) {
            setIsAwaitingChallenge(true);
        }

        setIsLoading(false);
    };
    
    const startChallenge = async () => {
        playSound('fail'); // Challenge issued sound
        setGameState('challenge');
        setIsLoading(true);
        try {
            if (currentMission.challenge.type === 'spot-the-phish') {
                const email = await generatePhishingChallenge(currentMission.challenge.prompt);
                setChallengeData(email);
            }
            else if (currentMission.challenge.type === 'text-response') {
                if (currentMission.challenge.promptGenerator) {
                    const dynamicChallenge = await generateDynamicTextChallenge(currentMission.challenge.promptGenerator);
                    setChallengeData(dynamicChallenge); // { question, answer, explanation }
                } else {
                    // Static text challenge
                    setChallengeData({ question: currentMission.challenge.prompt });
                }
            }
            else {
                // For password strength, etc.
                setChallengeData({});
            }
        } catch (error) {
            console.error(error);
             setMessages(prev => [...prev, { sender: 'supervisor', text: "Error generating challenge data. Please try again." }]);
             setGameState('training');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePhishingClassification = (isPhishingGuess: boolean) => {
        const email = challengeData as PhishingChallenge;
        if (!email) return;

        const isCorrect = email.is_phishing === isPhishingGuess;
        playSound(isCorrect ? 'success' : 'fail');
        setChallengeFeedback({ 
            isCorrect, 
            text: isCorrect ? `CORRECT. ${email.explanation}` : `INCORRECT. ${email.explanation}` 
        });

        if (isCorrect) {
            setCompletedMissionIds(prev => new Set(prev).add(currentMission.id));
        }
        setGameState('challenge-complete');
    };

    const handlePasswordSubmit = async (password: string) => {
        setIsLoading(true);
        playSound('click');
        const result = await validatePasswordStrength(currentMission.challenge.validatorPrompt, password);
        const isCorrect = result.score >= 4;
        playSound(isCorrect ? 'success' : 'fail');
        setChallengeFeedback({ isCorrect, text: `Score: ${result.score}/4. ${result.feedback}` });
        if(isCorrect) {
            setCompletedMissionIds(prev => new Set(prev).add(currentMission.id));
        }
        setGameState('challenge-complete');
        setIsLoading(false);
    };

    const handleTextChallengeSubmit = async (plan: string) => {
        setIsLoading(true);
        playSound('click');
        
        let finalValidatorPrompt = currentMission.challenge.validatorPrompt;

        // If it was a dynamic challenge, inject the correct answer and explanation.
        if (currentMission.challenge.promptGenerator && challengeData?.answer && challengeData?.explanation) {
            finalValidatorPrompt = finalValidatorPrompt
                .replace('[CORRECT_ANSWER]', challengeData.answer)
                .replace('[EXPLANATION]', challengeData.explanation);
        }

        const result = await validateChallengeResponse(finalValidatorPrompt, plan);
        playSound(result.is_correct ? 'success' : 'fail');
        setChallengeFeedback({ isCorrect: result.is_correct, text: result.explanation });

        if (result.is_correct) {
            setCompletedMissionIds(prev => new Set(prev).add(currentMission.id));
        }

        setGameState('challenge-complete');
        setIsLoading(false);
    };

    const goToNext = () => {
        playSound('click');
        setChallengeFeedback(null);
        setChallengeData(null);
        
        const isLastMissionInCase = currentMissionIndex === currentCase.missions.length - 1;
        const isLastCase = currentCaseIndex === cases.length - 1;

        if (isLastMissionInCase && isLastCase) {
             setGameState('all-missions-complete');
             return;
        }
        
        if (isLastMissionInCase) {
             setCurrentCaseIndex(prev => prev + 1);
             setCurrentMissionIndex(0);
             setGameState('briefing');
        } else {
            setCurrentMissionIndex(prev => prev + 1);
            setGameState('briefing');
        }
    };

    const handleProceedFromCompletion = () => {
        playSound('click');
        const isLastMissionInCase = currentMissionIndex === currentCase.missions.length - 1;
        if (isLastMissionInCase) {
            setGameState('case-summary');
        } else {
            goToNext();
        }
    };

     const renderContent = () => {
        let content;
        switch(gameState) {
            case 'intake':
                content = <IntakeScreen onOpenMessage={() => { playSound('click'); setGameState('welcome'); }} />;
                break;
            case 'welcome':
                content = <WelcomeScreen onStart={() => { playSound('click'); setGameState('briefing'); }} />;
                break;
            case 'briefing':
                content = <BriefingScreen mission={currentMission} onProceed={startTraining} />;
                break;
            case 'training':
                content = (
                    <div className="w-full h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                           <CommsScreen messages={messages} isLoading={isLoading}/>
                        </div>
                        <div className="p-4 border-t border-cyan-900/50">
                        {isAwaitingChallenge ? (
                            <div className="text-center">
                                <button 
                                    onClick={() => { playSound('click'); setIsAwaitingChallenge(false); startChallenge(); }} 
                                    className="btn-primary"
                                    onMouseEnter={() => playSound('hover')}
                                >
                                    [ Begin Assessment ]
                                </button>
                            </div>
                           ) : (
                               <div className="flex items-center gap-2 bg-gray-950 rounded-sm p-2 border border-slate-700 focus-within:ring-2 focus-within:ring-cyan-500">
                                   <span className="pl-2 font-mono text-green-400 select-none">&gt;</span>
                                   <input type="text" value={userInput} 
                                       onChange={(e) => setUserInput(e.target.value)} 
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(userInput)}
                                       className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none font-mono"/>
                                   <button onClick={() => handleSendMessage(userInput)} disabled={isLoading || !userInput.trim()} className="bg-cyan-600 text-white p-2 rounded-sm hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed" onMouseEnter={() => playSound('hover')}>
                                       <SendIcon />
                                   </button>
                               </div>
                           )}
                        </div>
                    </div>
                );
                break;
            case 'challenge':
                 content = (
                    <div className="p-4 md:p-6 h-full overflow-y-auto">
                      <h2 className="font-orbitron text-2xl text-cyan-400 mb-4 text-center text-glow uppercase tracking-widest">// LIVE OPERATION //</h2>
                      {isLoading ? <div className="flex justify-center items-center h-64"><LoadingSpinner/></div> : (
                        <>
                          {currentMission.challenge.type === 'spot-the-phish' && <PhishingChallengeComponent email={challengeData} onClassify={handlePhishingClassification} />}
                          {currentMission.challenge.type === 'password-strength' && <PasswordChallengeComponent onSubmit={handlePasswordSubmit} feedback={challengeFeedback} isLoading={isLoading}/>}
                          {currentMission.challenge.type === 'text-response' && <TextChallengeComponent challengeData={challengeData} onSubmit={handleTextChallengeSubmit} isLoading={isLoading} />}
                        </>
                      )}
                    </div>
                 );
                 break;
            case 'challenge-complete':
                const isSuccess = challengeFeedback?.isCorrect;
                content = (
                    <div className="text-center p-8 flex flex-col justify-center items-center h-full">
                        <h2 className={`font-orbitron text-3xl mb-4 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
                            {isSuccess ? "Mission Objective Met" : "Objective Failed"}
                        </h2>
                        <p className="text-lg mb-6 max-w-xl">{challengeFeedback?.text}</p>
                        {isSuccess ? (
                            <div className="flex flex-col items-center">
                                <p className="text-xl mb-4 font-orbitron text-cyan-300">Proceed to next objective?</p>
                                <div className="flex gap-4">
                                    <button onClick={handleProceedFromCompletion} className="btn-primary" onMouseEnter={() => playSound('hover')}>
                                        [ Yes ]
                                    </button>
                                    <button onClick={() => { playSound('click'); setView('dashboard'); }} className="btn-secondary" onMouseEnter={() => playSound('hover')}>
                                        [ No ]
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={startTraining} className="btn-secondary" onMouseEnter={() => playSound('hover')}>
                                [ Retry Mission ]
                            </button>
                        )}
                    </div>
                );
                break;
            case 'case-summary':
                 content = (
                    <div className="text-center p-8 flex flex-col justify-center items-center h-full">
                        <ShieldCheckIcon/>
                        <h2 className="font-orbitron text-3xl text-green-400 mb-2">Case File Closed</h2>
                        <p className="font-bold text-lg mb-4">{currentCase.title}</p>
                        <p className="font-mono text-cyan-300 text-md bg-gray-900/50 p-4 rounded-md mb-6 max-w-2xl mx-auto">{currentCase.summary}</p>
                         <button onClick={goToNext} className="btn-primary" onMouseEnter={() => playSound('hover')}>
                            {currentCaseIndex === cases.length - 1 ? 'End Training' : 'Begin Next Case File' }
                        </button>
                    </div>
                 );
                 break;
            case 'all-missions-complete':
                 content = (
                    <div className="text-center p-8 flex flex-col justify-center items-center h-full">
                        <ShieldCheckIcon/>
                        <h2 className="font-orbitron text-3xl text-green-400 mb-2">Congratulations, Agent!</h2>
                        <p className="text-lg mb-6 max-w-2xl mx-auto">You have successfully completed all training protocols. Your skills in cybersecurity are now certified. Welcome to Project Cipher.</p>
                    </div>
                 );
                 break;
        }
        return <div key={gameState} className="h-full w-full fade-in">{content}</div>;
    }
    
    const totalMissions = cases.reduce((acc, c) => acc + c.missions.length, 0);

    let leftColClass, mainColClass, rightColClass;
    if (isLeftSidebarCollapsed && isRightSidebarCollapsed) {
        leftColClass = 'md:col-span-1';
        mainColClass = 'md:col-span-10';
        rightColClass = 'md:col-span-1';
    } else if (isLeftSidebarCollapsed) {
        leftColClass = 'md:col-span-1';
        mainColClass = 'md:col-span-8';
        rightColClass = 'md:col-span-3';
    } else if (isRightSidebarCollapsed) {
        leftColClass = 'md:col-span-3';
        mainColClass = 'md:col-span-8';
        rightColClass = 'md:col-span-1';
    } else {
        leftColClass = 'md:col-span-3';
        mainColClass = 'md:col-span-6';
        rightColClass = 'md:col-span-3';
    }

    return (
        <div className="w-full h-screen bg-black text-gray-300 flex flex-col p-4 gap-4" onClick={() => audioContext.state === 'suspended' && audioContext.resume()}>
            {gameState !== 'intake' && gameState !== 'welcome' && (
                <header className="w-full flex items-center justify-between border-b-2 border-cyan-800/50 pb-2 fade-in">
                    <h1 className="text-3xl md:text-4xl font-orbitron text-cyan-400 tracking-widest uppercase text-glow">Project Cipher</h1>
                    <button onClick={() => { playSound('click'); setView('profile'); }} className="text-cyan-400 hover:text-cyan-200 transition-colors">
                        <UserCircleIcon className="w-8 h-8"/>
                    </button>
                </header>
            )}

            {gameState === 'intake' || gameState === 'welcome' ? (
                <main className="w-full flex-grow flex flex-col overflow-hidden relative">
                    {renderContent()}
                </main>
            ) : view === 'dashboard' ? (
                <div className="w-full flex-grow grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0 fade-in">
                    <aside className={`hud-border rounded-lg p-4 overflow-y-auto flex flex-col transition-all duration-300 ${leftColClass}`}>
                        <div className="flex items-center justify-between text-cyan-400 font-orbitron text-xl border-b border-slate-700 pb-2 mb-4">
                            {!isLeftSidebarCollapsed && (
                                <div className="flex items-center gap-2">
                                    <CaseIcon />
                                    <h2 className="uppercase tracking-wider">Case Files</h2>
                                </div>
                            )}
                            <button onClick={() => { playSound('click'); setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed); }} className="ml-auto p-1 hover:bg-cyan-900/50 rounded-md">
                                {isLeftSidebarCollapsed ? <ChevronDoubleRightIcon/> : <ChevronDoubleLeftIcon/>}
                            </button>
                        </div>
                        <div className={`space-y-4 overflow-y-auto flex-grow ${isLeftSidebarCollapsed ? 'hidden' : ''}`}>
                            {cases.map((c, caseIndex) => {
                                const isCaseOpen = caseIndex <= currentCaseIndex;
                                return (
                                    <details key={c.id} open={isCaseOpen} className="transition-all duration-300">
                                        <summary className="font-orbitron text-lg text-cyan-400 cursor-pointer list-none flex items-center gap-2" onMouseEnter={() => playSound('hover')} onClick={(e) => { e.preventDefault(); (e.currentTarget.parentElement as HTMLDetailsElement).open = !(e.currentTarget.parentElement as HTMLDetailsElement).open; playSound('click');}}>
                                            <span className="transform transition-transform duration-200 details-arrow">&#9654;</span> {c.title}
                                        </summary>
                                        <ul className="space-y-2 mt-2 ml-4 border-l border-cyan-900/50 pl-4">
                                            {c.missions.map((mission, missionIndex) => {
                                                const isCompleted = completedMissionIds.has(mission.id);
                                                const isCurrent = caseIndex === currentCaseIndex && missionIndex === currentMissionIndex;

                                                return (
                                                    <li 
                                                        key={mission.id} 
                                                        className={`flex items-center gap-3 p-2 rounded-md transition-colors cursor-pointer hover:bg-cyan-900/50 ${isCurrent ? 'bg-cyan-900/30' : ''}`}
                                                        onClick={() => handleMissionSelect(caseIndex, missionIndex)}
                                                        onMouseEnter={() => playSound('hover')}
                                                    >
                                                        <div className="flex-shrink-0">
                                                            {isCompleted ? <CheckCircleIcon /> : <TargetIcon/>}
                                                        </div>
                                                        <div className="flex-grow">
                                                            <h3 className="font-semibold text-gray-300">{mission.title}</h3>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </details>
                                );
                            })}
                        </div>
                    </aside>

                    <main className={`hud-border rounded-lg flex flex-col overflow-hidden relative transition-all duration-300 ${mainColClass}`}>
                        <div className="flex items-center justify-between p-2 px-4 border-b border-slate-700 bg-black font-mono text-xs text-cyan-300/70">
                            <div className="flex items-center gap-2"><TerminalIcon/><span>// COMMS_CHANNEL: ENCRYPTED</span></div>
                            <span>// STATUS: ACTIVE</span>
                        </div>
                        {(gameState === 'training' || gameState === 'challenge') && (
                            <button
                                title="Review Mission Briefing"
                                onClick={() => { playSound('click'); setIsBriefingModalOpen(true); }}
                                onMouseEnter={() => playSound('hover')}
                                className="absolute bottom-4 left-4 z-20 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 rounded-full p-2 text-cyan-400 transition-all"
                            >
                                <IntelIcon />
                            </button>
                        )}
                        {renderContent()}
                    </main>

                    <aside className={`hud-border rounded-lg p-4 overflow-y-auto flex flex-col gap-4 transition-all duration-300 ${rightColClass}`}>
                        <div className="flex items-center justify-between text-cyan-400 font-orbitron text-xl border-b border-slate-700 pb-2">
                            {!isRightSidebarCollapsed && (
                                <div className="flex items-center gap-2">
                                    <IntelIcon />
                                    <h2 className="uppercase tracking-wider">Objective Intel</h2>
                                </div>
                            )}
                             <button onClick={() => { playSound('click'); setIsRightSidebarCollapsed(!isRightSidebarCollapsed); }} className="ml-auto p-1 hover:bg-cyan-900/50 rounded-md">
                                {isRightSidebarCollapsed ? <ChevronDoubleLeftIcon/> : <ChevronDoubleRightIcon/>}
                            </button>
                        </div>
                        <div className={`space-y-4 ${isRightSidebarCollapsed ? 'hidden' : ''}`}>
                            <div className="bg-gray-900/50 p-4">
                                <h3 className="font-bold text-gray-400 mb-1 text-sm uppercase tracking-wider">Current Case File</h3>
                                <p className="text-cyan-400 font-semibold">{currentCase.title}</p>
                                <p className="text-gray-400 text-sm mt-1">{currentCase.description}</p>
                            </div>
                            <div className="bg-gray-900/50 p-4">
                                <h3 className="font-bold text-gray-400 mb-1 text-sm uppercase tracking-wider">Current Mission</h3>
                                <p className="text-cyan-400 font-semibold">{currentMission.title}</p>
                                <p className="text-gray-400 text-sm mt-1">{currentMission.learningObjective}</p>
                            </div>
                        </div>
                    </aside>
                </div>
             ) : (
                <ProfilePage 
                    completedMissionsCount={completedMissionIds.size} 
                    totalMissions={totalMissions} 
                    onBack={() => { playSound('click'); setView('dashboard'); }}
                />
             )}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
                <NoteTaker />
                <HelpChat mission={currentMission} />
            </div>
            {isBriefingModalOpen && (
                <MissionBriefingModal 
                    mission={currentMission} 
                    onClose={() => { playSound('click'); setIsBriefingModalOpen(false); }} 
                    gameState={gameState}
                    challengeData={challengeData}
                    messages={messages}
                />
            )}
        </div>
    );
}

const SPY_RANKS = [
    { name: 'Recruit', minMissions: 0 },
    { name: 'Beginner Agent', minMissions: 1 },
    { name: 'Field Agent', minMissions: 3 },
    { name: 'Senior Agent', minMissions: 6 },
    { name: 'Specialist', minMissions: 9 },
    { name: 'Elite Spy', minMissions: 12 },
    { name: 'Master Spy', minMissions: 15 },
    { name: 'Cyber Ghost', minMissions: 18 },
    { name: 'Shadow Broker', minMissions: 22 },
];

const ProfilePage: React.FC<{ 
    completedMissionsCount: number; 
    totalMissions: number; 
    onBack: () => void; 
}> = ({ completedMissionsCount, totalMissions, onBack }) => {
    const currentRank = [...SPY_RANKS].reverse().find(r => completedMissionsCount >= r.minMissions) || SPY_RANKS[0];
    const nextRankIndex = SPY_RANKS.findIndex(r => r.name === currentRank.name) + 1;
    const nextRank = nextRankIndex < SPY_RANKS.length ? SPY_RANKS[nextRankIndex] : null;

    const progress = nextRank ? ((completedMissionsCount - currentRank.minMissions) / (nextRank.minMissions - currentRank.minMissions)) * 100 : 100;

    return (
        <div className="w-full flex-grow hud-border rounded-lg p-4 md:p-8 flex flex-col items-center justify-center relative fade-in">
            <button onClick={onBack} className="absolute top-4 left-4 text-cyan-400 hover:text-cyan-200 transition-colors flex items-center gap-2 font-orbitron" onMouseEnter={() => playSound('hover')}>
                <ArrowLeftIcon/>
                Dashboard
            </button>
            <UserCircleIcon className="w-32 h-32 text-cyan-500" />
            <h2 className="font-orbitron text-4xl text-cyan-400 mt-4 uppercase text-glow tracking-widest">{currentRank.name}</h2>
            <p className="font-mono text-gray-400">Agent Profile</p>
            
            <div className="w-full max-w-2xl mt-8">
                <div className="flex justify-between items-center text-sm font-mono text-gray-400 mb-2">
                   <span>PROGRESS TO NEXT RANK</span>
                   {nextRank ? <span>{nextRank.name}</span> : <span>MAX RANK ACHIEVED</span>}
                </div>
                <ProgressBar progress={progress} />
                 <p className="text-lg text-gray-300 mt-4 font-mono text-center">
                    <span className="text-cyan-400">{completedMissionsCount}</span> / <span className="">{totalMissions}</span> Missions Completed
                </p>
            </div>
        </div>
    );
};


// Challenge Components
const PhishingChallengeComponent: React.FC<{email: PhishingChallenge | null, onClassify: (isPhishingGuess: boolean) => void}> = ({email, onClassify}) => {
    if (!email) return <div className="flex justify-center items-center h-full"><LoadingSpinner/></div>;
    return (
      <div>
        <p className="text-center mb-6 text-lg text-cyan-300">Analyze the following transmission. Is it a hostile phishing attempt?</p>
        <div className="bg-gray-950 p-4 border-2 border-slate-700 mb-6 max-w-2xl mx-auto">
            <p className="font-bold text-gray-400 font-mono text-sm">From: {email.sender_name} &lt;{email.sender_email}&gt;</p>
            <p className="font-bold my-1 text-gray-200">Subject: {email.subject}</p>
            <hr className="border-slate-600 my-2"/>
            <p className="text-sm whitespace-pre-wrap text-gray-300">{email.body}</p>
        </div>
        <div className="flex justify-center gap-4">
            <button onClick={() => onClassify(true)} className="btn-secondary" onMouseEnter={() => playSound('hover')}>
                [ Hostile (Phishing) ]
            </button>
            <button onClick={() => onClassify(false)} className="btn-primary" onMouseEnter={() => playSound('hover')}>
                [ Legitimate ]
            </button>
        </div>
      </div>
    );
}

const PasswordChallengeComponent: React.FC<{
  onSubmit: (password: string) => void,
  feedback: {isCorrect: boolean, text: string} | null,
  isLoading: boolean
}> = ({ onSubmit, feedback, isLoading }) => {
    const [password, setPassword] = useState('');
    const score = feedback ? parseInt(feedback.text.match(/(\d)\/4/)?.[1] || '0') : 0;
    const progress = (score / 4) * 100;

    return (
        <div className="max-w-md mx-auto mt-8">
            <p className="text-center mb-4 text-lg text-cyan-300">Construct a secure password. It must meet agency standards for strength.</p>
            <div className="flex gap-2">
              <input type="text" value={password} onChange={e => setPassword(e.target.value)}
                  className="flex-1 bg-gray-950 border-2 border-slate-700 rounded-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"/>
              <button onClick={() => onSubmit(password)} disabled={isLoading} className="btn-primary py-2 px-4" onMouseEnter={() => playSound('hover')}>
                  {isLoading ? <LoadingSpinner/> : "Analyze"}
              </button>
            </div>
            {feedback && (
                <div className="mt-4 p-4 bg-gray-950/50 rounded-md border border-slate-700">
                    <p className="text-center text-gray-300 mb-3">{feedback.text}</p>
                    <ProgressBar progress={progress} segments={4} />
                </div>
            )}
        </div>
    )
}

const TextChallengeComponent: React.FC<{challengeData: any, onSubmit: (plan: string) => void, isLoading: boolean}> = ({ challengeData, onSubmit, isLoading }) => {
    const [text, setText] = useState('');
    const prompt = challengeData?.question || "Review the final transmission from Control. Formulate your response.";
    
    return (
         <div className="max-w-lg mx-auto mt-8">
            <div className="text-left mb-4 text-lg text-cyan-300 whitespace-pre-wrap font-mono">
                <FormattedMessage text={prompt} />
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={5}
                className="w-full bg-gray-950 border-2 border-slate-700 rounded-sm p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
                placeholder="Enter your response..."
            ></textarea>
            <div className="text-center mt-4">
               <button onClick={() => onSubmit(text)} disabled={isLoading || !text.trim()} className="btn-primary" onMouseEnter={() => playSound('hover')}>
                   {isLoading ? <LoadingSpinner/> : "Execute"}
               </button>
            </div>
         </div>
    )
}