import logging
from typing import List

from langchain_openai import OpenAIEmbeddings

from AppMain.settings import AppSettings

logger = logging.getLogger(__name__)


class Embedder:
    """
    Utility class to handle text embeddings using OpenAI.
    """

    def __init__(self):
        if not AppSettings.OPENAI_API_KEY or AppSettings.OPENAI_API_KEY == "your_openai_api_key_here":
            logger.warning("OPENAI_API_KEY is not set correctly in .env")
        
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=AppSettings.OPENAI_API_KEY,
            model="text-embedding-3-small"
        )

    def embed_query(self, text: str) -> List[float]:
        """
        Embed a single query string.
        """
        try:
            return self.embeddings.embed_query(text)
        except Exception as e:
            logger.error(f"Error embedding query: {str(e)}")
            raise

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embed a list of document strings.
        """
        try:
            return self.embeddings.embed_documents(texts)
        except Exception as e:
            logger.error(f"Error embedding documents: {str(e)}")
            raise


# Global instance
embedder = Embedder()
