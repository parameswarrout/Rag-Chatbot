import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [sessions, setSessions] = useState([]); // List of session IDs
  const [mode, setMode] = useState('advanced');
  const [provider, setProvider] = useState('local');
  const [error, setError] = useState(null);

  // Initialize: Load session list and setup current session
  useEffect(() => {
    fetchSessions();
    const storedSession = localStorage.getItem('rag_session_id');
    if (storedSession) {
      setSessionId(storedSession);
      loadSessionHistory(storedSession);
    } else {
      createNewSession();
    }
  }, []);

  // Fetch all sessions from backend
  const fetchSessions = async () => {
    try {
      const res = await fetch('http://localhost:8000/sessions');
      if (res.ok) {
        const data = await res.json();
        // Since backend dict keys are unordered/hashed, we might want to sort them if we had timestamps.
        // For now just raw list.
        setSessions(data.sessions.reverse()); // Show newest (added last? no dict unordered) hmm with UUIDs order is random.
        // NOTE: MemoryManager persists insertion order in Python 3.7+ if we don't restart?
        // But reloads might shuffle. Ideally backend should return objects with timestamps.
      }
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };

  const loadSessionHistory = async (sid) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/sessions/${sid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.history) {
          // Convert backend history format to frontend messages
          const formatted = data.history.map((turn, idx) => ({
            id: `hist_${sid}_${idx}`,
            role: turn.role,
            content: turn.content,
            // History endpoint currently doesn't return metadata/citations/latency stored separately?
            // app/services/memory_manager.py only stores role/content.
            // So historical messages won't have citations displayed.
            citations: [],
            latency: 0,
            source: 'History'
          }));
          setMessages(formatted);
        }
      } else {
        // Session might not exist on backend (reloaded), but exists in localstorage.
        // Just start empty.
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to load history", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  const createNewSession = () => {
    const newId = uuidv4();
    setSessionId(newId);
    localStorage.setItem('rag_session_id', newId);
    setMessages([]);
    fetchSessions(); // Refresh list (though new session won't be in list until we chat)
  };

  const switchSession = (sid) => {
    if (sid === sessionId) return;
    setSessionId(sid);
    localStorage.setItem('rag_session_id', sid);
    loadSessionHistory(sid);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input, id: Date.now().toString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

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

    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId, // Add session_id here
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userMsg.content }],
          mode: mode,
          provider: provider,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update session list if this is the first message in session
      // But we can't easily detect that here without complexity. 
      // Just refresh sessions after a successful chat start?
      if (messages.length === 0) {
        // fetchSessions(); // Delay slightly?
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });

        setMessages(prev => {
          const newMessages = [...prev];
          const msgIndex = newMessages.findIndex(m => m.id === aiMsgId);
          if (msgIndex !== -1) {
            newMessages[msgIndex] = {
              ...newMessages[msgIndex],
              content: newMessages[msgIndex].content + chunkValue
            };
          }
          return newMessages;
        });
      }

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

      // Refresh list to show this session if new
      fetchSessions();

    } catch (err) {
      setError("Failed to stream response. Please ensure backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      <Sidebar
        sessions={sessions}
        currentSessionId={sessionId}
        onSwitchSession={switchSession}
        onNewChat={createNewSession}
        mode={mode}
        setMode={setMode}
        provider={provider}
        setProvider={setProvider}
      />
      <ChatArea
        messages={messages}
        loading={loading}
        error={error}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        mode={mode}
        setMode={setMode}
        provider={provider}
        setProvider={setProvider}
      />
    </div>
  );
}

export default App;
