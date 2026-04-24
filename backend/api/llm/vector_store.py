import logging
import os
from typing import Any, List, Optional

import chromadb
from api.llm.embedder import embedder
from AppMain.settings import AppSettings

logger = logging.getLogger(__name__)


class VectorStoreManager:
    """
    Manages the ChromaDB vector store for legal articles and cases using native chromadb client.
    """

    def __init__(self, collection_name: str = "jurisprudence"):
        self.collection_name = collection_name
        self.persist_directory = AppSettings.model_dump().get("VECTOR_DB_PATH", "./data/vector_db")

        # Ensure directory exists
        os.makedirs(self.persist_directory, exist_ok=True)

        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=chromadb.Settings(anonymized_telemetry=False)
        )
        self.collection = self.client.get_or_create_collection(name=collection_name)

    def add_documents(self, texts: List[str], metadatas: List[dict], ids: Optional[List[str]] = None):
        """
        Add documents to the vector store.
        """
        try:
            if ids is None:
                ids = [f"id_{i}" for i in range(len(texts))]
            
            # Generate embeddings using our embedder
            embeddings = embedder.embed_documents(texts)
            
            if not embeddings:
                logger.warning("No embeddings generated. Skipping document addition.")
                return
            
            self.collection.add(
                documents=texts,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings
            )
            logger.info(f"Added {len(texts)} documents to collection {self.collection_name}")
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {str(e)}")
            raise

    def similarity_search(self, query: str, k: int = 3) -> List[Any]:
        """
        Search for similar documents. Returns a list of results.
        """
        try:
            # Generate embedding for the query
            query_embedding = embedder.embed_query(query)
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=k
            )
            
            # Transform results into a more usable format (list of dicts)
            formatted_results = []
            if results["documents"]:
                for i in range(len(results["documents"][0])):
                    formatted_results.append({
                        "page_content": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "id": results["ids"][0][i]
                    })
            
            return formatted_results
        except Exception as e:
            logger.error(f"Error performing similarity search: {str(e)}")
            raise


    def is_empty(self) -> bool:
        """Check if the collection is empty."""
        return self.collection.count() == 0

    async def initialize_from_pdf(self, pdf_path: str):
        """Index documents from a PDF if the collection is empty."""
        if not self.is_empty():
            logger.info(f"Collection {self.collection_name} already contains data. Skipping auto-initialization.")
            return

        if not os.path.exists(pdf_path):
            logger.warning(f"PDF file not found for auto-initialization: {pdf_path}")
            return

        logger.info(f"Auto-initializing collection {self.collection_name} from {pdf_path}...")
        try:
            from pypdf import PdfReader
            import re
            
            reader = PdfReader(pdf_path)
            full_text = ""
            for page in reader.pages:
                full_text += page.extract_text() + "\n"

            articles = re.split(r'(Article\s+\d+[\s\.\-]+)', full_text)
            
            texts = []
            metadatas = []
            
            for i in range(1, len(articles), 2):
                article_header = articles[i].strip()
                article_content = articles[i+1].strip()
                
                match = re.search(r'Article\s+(\d+)', article_header)
                article_num = match.group(1) if match else "Inconnu"
                
                texts.append(f"{article_header} {article_content}")
                metadatas.append({
                    "law_name": "Loi 98-004 (Code du Travail)",
                    "article_number": article_num,
                    "source": pdf_path
                })

            if texts:
                self.add_documents(texts=texts, metadatas=metadatas)
                logger.info(f"Auto-initialization complete. Indexed {len(texts)} articles.")
        except Exception as e:
            logger.error(f"Error during auto-initialization: {str(e)}")


# Global instances for different use cases
articles_store = VectorStoreManager(collection_name="legal_articles")
cases_store = VectorStoreManager(collection_name="legal_cases")
