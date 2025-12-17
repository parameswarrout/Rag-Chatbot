from typing import List, Dict
from collections import defaultdict

class MemoryManager:
    """
    Simple in-memory conversation history manager.
    Stores last N turns for each session.
    """
    def __init__(self, history_limit: int = 10, persistence_file: str = "data/chat_history.json"):
        self.history: Dict[str, List[Dict[str, str]]] = defaultdict(list)
        self.limit = history_limit
        self.persistence_file = persistence_file
        self.load_history()

    def load_history(self):
        import json
        import os
        if os.path.exists(self.persistence_file):
            try:
                with open(self.persistence_file, "r") as f:
                    data = json.load(f)
                    # Convert to defaultdict
                    self.history = defaultdict(list, data)
            except Exception as e:
                print(f"Error loading history: {e}")

    def save_history(self):
        import json
        import os
        
        # ensure directory exists
        os.makedirs(os.path.dirname(self.persistence_file), exist_ok=True)
        
        try:
            with open(self.persistence_file, "w") as f:
                json.dump(self.history, f)
        except Exception as e:
            print(f"Error saving history: {e}")

    def add_turn(self, session_id: str, user_query: str, ai_response: str):
        if not session_id:
            return
            
        self.history[session_id].append({"role": "user", "content": user_query})
        self.history[session_id].append({"role": "assistant", "content": ai_response})
        
        # Trim history
        if len(self.history[session_id]) > self.limit * 2:
            self.history[session_id] = self.history[session_id][-(self.limit * 2):]
            
        self.save_history()

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

    def get_all_sessions(self) -> List[str]:
        return list(self.history.keys())

    def clear_history(self, session_id: str):
        if session_id in self.history:
            del self.history[session_id]
            self.save_history()
