import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useChat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [sessions, setSessions] = useState([]);
    const [mode, setMode] = useState('advanced');
    const [provider, setProvider] = useState('local');
    const [customModel, setCustomModel] = useState('');
    const [useRag, setUseRag] = useState(true);
    const [availableModels, setAvailableModels] = useState([]);
    const [thinkingStatus, setThinkingStatus] = useState(null);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState({ system: 'checking', ollama: 'checking' });
    
    // Ref for aborting the stream
    const abortControllerRef = useRef(null);

    // Health Check
    useEffect(() => {
        const checkHealth = async () => {
             try {
                 const res = await fetch('http://localhost:8000/health');
                 if (res.ok) {
                     const data = await res.json();
                     setStatus({ 
                         system: 'online', 
                         ollama: data.ollama || 'offline' 
                     });
                 } else {
                     setStatus({ system: 'offline', ollama: 'offline' });
                 }
             } catch (e) {
                 setStatus({ system: 'offline', ollama: 'offline' });
             }
         };
         checkHealth();
         const interval = setInterval(checkHealth, 30000);
         return () => clearInterval(interval);
    }, []);
    
    // Fetch available models
    const fetchModels = useCallback(async () => {
        try {
           const res = await fetch('http://localhost:8000/models');
           if (res.ok) {
               const data = await res.json();
               if (data.models) {
                   setAvailableModels(data.models);
               }
           }
        } catch (err) {
            console.error("Failed to fetch models", err);
        }
    }, []);

    // Fetch sessions
    const fetchSessions = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:8000/sessions');
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions.reverse());
            }
        } catch (err) {
            console.error("Failed to fetch sessions", err);
        }
    }, []);

    // Load history
    const loadSessionHistory = useCallback(async (sid) => {
        setLoading(true);
        // Abort any ongoing request when switching sessions
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        try {
            const res = await fetch(`http://localhost:8000/sessions/${sid}`);
            if (res.ok) {
                const data = await res.json();
                if (data.history) {
                    const formatted = data.history.map((turn, idx) => ({
                        id: `hist_${sid}_${idx}`,
                        role: turn.role,
                        content: turn.content,
                        citations: [],
                        latency: 0,
                        source: 'History'
                    }));
                    setMessages(formatted);
                }
            } else {
                setMessages([]);
            }
        } catch (err) {
            console.error("Failed to load history", err);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Create new session
    const createNewSession = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        
        const newId = uuidv4();
        setSessionId(newId);
        localStorage.setItem('rag_session_id', newId);
        setMessages([]);
        
        // Optimistically add new session to list so it appears immediately
        setSessions(prev => [newId, ...prev]);
        // Do NOT fetchSessions() here, as backend doesn't know about this empty session yet
    }, []);

    // Switch session
    const switchSession = useCallback((sid) => {
        if (sid === sessionId) return;
        setSessionId(sid);
        localStorage.setItem('rag_session_id', sid);
        loadSessionHistory(sid);
    }, [sessionId, loadSessionHistory]);

    // Initialize
    useEffect(() => {
        fetchSessions();
        fetchModels();
        const storedSession = localStorage.getItem('rag_session_id');
        if (storedSession) {
            setSessionId(storedSession);
            loadSessionHistory(storedSession);
        } else {
            createNewSession();
        }
    }, [fetchSessions, loadSessionHistory, createNewSession, fetchModels]);

    // Stop Generation
    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setLoading(false);
        }
    }, []);

    // Handle Submit
    const submitMessage = async (e, isRegenerate = false) => {
        if (e && e.preventDefault) e.preventDefault();
        
        let contentToSubmit = input;
        
        if (isRegenerate) {
            // Find last user message
            const lastUserMsg = messages[messages.length - 2]; // Assuming last was AI, so 2nd last is user
            if (!lastUserMsg) return;
            contentToSubmit = lastUserMsg.content;
            
            // Remove last AI message (failed or old one) 
            setMessages(prev => prev.slice(0, -1));
        } else {
            if (!input.trim() || loading) return;
            const userMsg = { role: 'user', content: input, id: Date.now().toString() };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
        }

        setLoading(true);
        setError(null);

        // Create new AbortController
        abortControllerRef.current = new AbortController();

        const aiMsgId = Date.now().toString() + '_ai';
        const initialAiMsg = {
            role: 'assistant',
            content: '',
            id: aiMsgId,
            citations: [],
            latency: 0,
            source: ''
        };
        setMessages(prev => [...prev, initialAiMsg]);

        // Need to rebuild messages for context, excluding the one we are generating now
        // If regenerate, current 'messages' state still has the old AI message until next render? 
        // No, setMessages is async but we need to construct payload from 'messages' state.
        
        // Wait, 'messages' in scope is the old state.
        // Payload construction:
        let contextMessages = [];
        if (isRegenerate) {
             // For payload, we want everything up to the last User message
             contextMessages = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
        } else {
             // Normal case: current messages + new user message
             // We already cleared input, but we have 'contentToSubmit'
             contextMessages = [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: contentToSubmit }];
        }

        const startTime = Date.now();

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    session_id: sessionId,
                    messages: contextMessages,
                    mode: mode,
                    provider: provider,
                    model: customModel,
                    use_rag: useRag,
                    stream: true
                }),
                signal: abortControllerRef.current.signal
            });
            
            setThinkingStatus("Initializing...");

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (done) break;
                
                const chunkValue = decoder.decode(value, { stream: true });

                setMessages(prev => {
                    const newMessages = [...prev];
                    const msgIndex = newMessages.findIndex(m => m.id === aiMsgId);
                    if (msgIndex !== -1) {
                         let fullContent = newMessages[msgIndex].content + chunkValue;
                         
                         // Check for status updates
                         const statusMatch = fullContent.match(/__STATUS__: (.*?)(?:\n|$)/);
                         if (statusMatch) {
                             setThinkingStatus(statusMatch[1]);
                             fullContent = fullContent.replace(/__STATUS__: .*?(?:\n|$)/g, '');
                         }

                         let citations = newMessages[msgIndex].citations || [];
                         
                         if (fullContent.includes("__METADATA__")) {
                            const parts = fullContent.split("__METADATA__");
                            if (parts.length > 1) {
                                const potentialContent = parts[0]; 
                                const metadataJson = parts[1];
                                
                                try {
                                    if (metadataJson.trim().endsWith("]")) {
                                        citations = JSON.parse(metadataJson.trim());
                                        // Only strip metadata from content if we successfully parsed it
                                        fullContent = potentialContent;
                                        setThinkingStatus(null); // Clear status when done
                                    }
                                } catch (e) {
                                    // ignore incomplete json, keep fullContent as is (with METADATA) for now
                                }
                            }
                         }
                         
                         newMessages[msgIndex] = {
                             ...newMessages[msgIndex],
                             content: fullContent,
                             citations: citations
                         };
                    }
                    return newMessages;
                });
            }

            // Finalize
            const latency = (Date.now() - startTime) / 1000;
            setMessages(prev => {
                const newMessages = [...prev];
                const msgIndex = newMessages.findIndex(m => m.id === aiMsgId);
                if (msgIndex !== -1) {
                    newMessages[msgIndex] = {
                        ...newMessages[msgIndex],
                        latency: latency,
                        source: `Streaming (${provider})`
                    };
                }
                return newMessages;
            });
            
            fetchSessions();
            abortControllerRef.current = null;

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Generation stopped by user');
                // Optional: visual indicator that message was stopped?
            } else {
                setError("Failed to stream response. Please ensure backend is running.");
                console.error(err);
            }
        } finally {
            setLoading(false);
            setThinkingStatus(null);
        }
    };

    return {
        messages,
        input,
        setInput,
        loading,
        error,
        sessionId,
        sessions,
        mode,
        setMode,
        provider,
        setProvider,
        customModel,
        setCustomModel,
        useRag,
        setUseRag,
        thinkingStatus,
        switchSession,
        createNewSession,
        submitMessage,
        stopGeneration,
        refreshSessions: fetchSessions,
        availableModels,
        refreshModels: fetchModels,
        status,
        error,
        input,
        setInput
    };
};

