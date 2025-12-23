import os
from typing import List
from langchain_community.document_loaders import PyPDFLoader, CSVLoader, Docx2txtLoader
from langchain_core.documents import Document
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import partial

logger = logging.getLogger(__name__)

class DocumentLoader:
    def __init__(self, data_dir: str = "data", max_workers: int = 4):
        self.data_dir = data_dir
        self.max_workers = max_workers

    def _load_single_file(self, file_path: str) -> List[Document]:
        """Load a single file and return its documents"""
        try:
            logger.debug(f"Loading file: {file_path}")
            file_ext = os.path.splitext(file_path)[1].lower()

            if file_ext == ".pdf":
                loader = PyPDFLoader(file_path)
                docs = loader.load()
                logger.debug(f"Loaded {len(docs)} pages from PDF: {os.path.basename(file_path)}")
                return docs
            elif file_ext == ".csv":
                loader = CSVLoader(file_path)
                docs = loader.load()
                logger.debug(f"Loaded {len(docs)} rows from CSV: {os.path.basename(file_path)}")
                return docs
            elif file_ext in [".docx", ".doc"]:
                loader = Docx2txtLoader(file_path)
                docs = loader.load()
                logger.debug(f"Loaded content from Docx: {os.path.basename(file_path)}")
                return docs
            else:
                logger.warning(f"Unsupported file type: {file_path}")
                return []
        except Exception as e:
            logger.error(f"Error loading {file_path}: {e}")
            return []

    def load_documents(self) -> List[Document]:
        logger.info(f"Starting document loading from: {self.data_dir} with {self.max_workers} workers")

        # Collect all file paths first
        file_paths = []
        for root, _, files in os.walk(self.data_dir):
            for file in files:
                file_path = os.path.join(root, file)
                file_ext = os.path.splitext(file)[1].lower()
                if file_ext in [".pdf", ".csv", ".docx", ".doc"]:
                    file_paths.append(file_path)

        logger.info(f"Found {len(file_paths)} files to process")

        # Process files concurrently
        documents = []
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_path = {
                executor.submit(self._load_single_file, file_path): file_path
                for file_path in file_paths
            }

            # Collect results as they complete
            for future in as_completed(future_to_path):
                file_path = future_to_path[future]
                try:
                    docs = future.result()
                    documents.extend(docs)
                except Exception as e:
                    logger.error(f"Error processing {file_path}: {e}")

        logger.info(f"Total documents loaded: {len(documents)}")
        return documents
