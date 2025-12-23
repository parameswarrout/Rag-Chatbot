const API_BASE = 'http://localhost:8000';

export const api = {
    checkHealth: async () => {
        try {
            const res = await fetch(`${API_BASE}/health`);
            if (res.ok) return await res.json();
            throw new Error('Health check failed');
        } catch (e) {
            throw e;
        }
    },

    uploadFile: (file, type, onProgress) => {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('file_type', type);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_BASE}/upload`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    onProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error('Network Error'));
            xhr.send(formData);
        });
    },

    resetKnowledgeBase: async () => {
        const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
        if (!res.ok) throw new Error("Reset failed");
        return await res.json();
    },

    startIngestion: async () => {
        const res = await fetch(`${API_BASE}/ingest`, { method: 'POST' });
        if (!res.ok) throw new Error("Ingest failed");
        return await res.json();
    },

    deleteModel: async (modelName) => {
         const res = await fetch(`${API_BASE}/models`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: modelName })
        });
        if (!res.ok) throw new Error("Delete failed");
        return await res.json();
    },

    clearSessions: async () => {
        const res = await fetch(`${API_BASE}/sessions`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to clear sessions");
        return await res.json();
    }
};
