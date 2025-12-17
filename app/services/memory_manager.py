from typing import List, Dict
from collections import defaultdict

class MemoryManager:
    """
    Simple in-memory conversation history manager.
    Stores last N turns for each session.
    """
    def __init__(self, history_limit: int = 5):
        self.history: Dict[str, List[Dict[str, str]]] = defaultdict(list)
        self.limit = history_limit

    def add_turn(self, session_id: str, user_query: str, ai_response: str):
        if not session_id:
            return
            
        self.history[session_id].append({"role": "user", "content": user_query})
        self.history[session_id].append({"role": "assistant", "content": ai_response})
        
        # Trim history
        if len(self.history[session_id]) > self.limit * 2:
            self.history[session_id] = self.history[session_id][-(self.limit * 2):]

    def get_history(self, session_id: str) -> str:
        if not session_id or session_id not in self.history:
            return ""
            
        formatted_history = []
        for turn in self.history[session_id]:
            role = "User" if turn["role"] == "user" else "Assistant"
            formatted_history.append(f"{role}: {turn['content']}")
            
        return "\n".join(formatted_history)

    def get_raw_history(self, session_id: str) -> List[Dict[str, str]]:
        return self.history.get(session_id, [])

    def clear_history(self, session_id: str):
        if session_id in self.history:
            del self.history[session_id]
