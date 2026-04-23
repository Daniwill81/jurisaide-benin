import logging
from typing import List

from langchain_mistralai import MistralAIEmbeddings

from AppMain.settings import AppSettings

logger = logging.getLogger(__name__)


class Embedder:
    """
    Utility class to handle text embeddings using Mistral.
    """

    def __init__(self):
        api_key = AppSettings.MISTRAL_API_KEY or AppSettings.OPENAI_API_KEY
        if not api_key:
            logger.warning("MISTRAL_API_KEY is not set correctly in .env")

        self.embeddings = MistralAIEmbeddings(mistral_api_key=api_key, model="mistral-embed")

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
