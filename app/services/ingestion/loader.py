import os
from typing import List
from langchain_community.document_loaders import PyPDFLoader, CSVLoader, Docx2txtLoader
from langchain_core.documents import Document

class DocumentLoader:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir

    def load_documents(self) -> List[Document]:
        documents = []
        for root, _, files in os.walk(self.data_dir):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    if file.endswith(".pdf"):
                        loader = PyPDFLoader(file_path)
                        documents.extend(loader.load())
                    elif file.endswith(".csv"):
                        loader = CSVLoader(file_path)
                        documents.extend(loader.load())
                    elif file.endswith(".docx") or file.endswith(".doc"):
                        loader = Docx2txtLoader(file_path)
                        documents.extend(loader.load())
                except Exception as e:
                    print(f"Error loading {file_path}: {e}")
        return documents
