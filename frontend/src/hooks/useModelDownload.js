import { useState, useRef, useEffect } from 'react';

export const useModelDownload = (onSuccess, onError) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const abortControllerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const downloadModel = async (modelName) => {
        if (!modelName) return;

        setIsDownloading(true);
        setProgress(0);
        setStatus('Starting...');
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('http://localhost:8000/models/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) throw new Error('Failed to start download');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                // Keep the last partial chunk in the buffer
                buffer = events.pop(); 

                for (const event of events) {
                    if (!event.startsWith('data:')) continue;
                    
                    const json = event.replace(/^data:\s*/, '').trim();
                     if (!json) continue;
                    
                    try {
                        const data = JSON.parse(json);
                        
                        if (data.error) throw new Error(data.error);

                        if (data.status) setStatus(data.status);
                        
                        if (data.total && data.completed) {
                            setProgress((data.completed / data.total) * 100);
                        }
                        
                        if (data.status === 'success') {
                            setProgress(100);
                            setStatus('Completed');
                        }
                    } catch (e) {
                        // Ignore parse errors
                    }
                }
            }

            if (onSuccess) onSuccess(modelName);

        } catch (e) {
            if (e.name !== 'AbortError') {
                 console.error(e);
                 if (onError) onError(e.message);
                 setStatus('Failed');
            }
        } finally {
            setIsDownloading(false);
            abortControllerRef.current = null;
        }
    };

    const cancelDownload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsDownloading(false);
            setStatus('Cancelled');
        }
    };

    return {
        downloadModel,
        cancelDownload,
        isDownloading,
        progress,
        status,
        resetStatus: () => { setProgress(0); setStatus(''); }
    };
};
