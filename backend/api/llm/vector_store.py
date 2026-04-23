import logging
import os
from typing import List, Optional

import chromadb
from chromadb.config import Settings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

from api.llm.embedder import embedder
from AppMain.settings import AppSettings

logger = logging.getLogger(__name__)


class VectorStoreManager:
    """
    Manages the ChromaDB vector store for legal articles and cases.
    """

    def __init__(self, collection_name: str = "jurisprudence"):
        self.collection_name = collection_name
        self.persist_directory = AppSettings.model_dump().get("VECTOR_DB_PATH", "./data/vector_db")

        # Ensure directory exists
        os.makedirs(self.persist_directory, exist_ok=True)

        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.vector_store = Chroma(
            client=self.client,
            collection_name=collection_name,
            embedding_function=embedder.embeddings,
            persist_directory=self.persist_directory,
        )

    def add_documents(self, texts: List[str], metadatas: List[dict], ids: Optional[List[str]] = None):
        """
        Add documents to the vector store.
        """
        try:
            self.vector_store.add_texts(texts=texts, metadatas=metadatas, ids=ids)
            logger.info(f"Added {len(texts)} documents to collection {self.collection_name}")
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {str(e)}")
            raise

    def similarity_search(self, query: str, k: int = 3) -> List[Document]:
        """
        Search for similar documents.
        """
        try:
            return self.vector_store.similarity_search(query, k=k)
        except Exception as e:
            logger.error(f"Error performing similarity search: {str(e)}")
            raise

    def as_retriever(self, search_kwargs: Optional[dict] = None):
        """
        Return the vector store as a LangChain retriever.
        """
        return self.vector_store.as_retriever(search_kwargs=search_kwargs or {"k": 3})


# Global instances for different use cases
articles_store = VectorStoreManager(collection_name="legal_articles")
cases_store = VectorStoreManager(collection_name="legal_cases")
