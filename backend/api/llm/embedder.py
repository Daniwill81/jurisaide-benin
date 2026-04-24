import logging
from typing import List
import ollama

logger = logging.getLogger(__name__)


class Embedder:
    """
    Utility class to handle text embeddings using Ollama natively.
    """

    def __init__(self, model: str = "nomic-embed-text"):
        self.model = model
        logger.info(f"Initializing Embedder with Ollama model: {self.model}")

    def _check_model(self):
        """Check if the model is available in Ollama."""
        try:
            ollama.show(self.model)
            return True
        except ollama.ResponseError:
            logger.warning(f"Ollama model '{self.model}' not found. Please run 'ollama pull {self.model}'")
            return False

    def embed_query(self, text: str) -> List[float]:
        """
        Embed a single query string.
        """
        try:
            if not self._check_model():
                return []
            response = ollama.embeddings(model=self.model, prompt=text)
            return response["embedding"]
        except Exception as e:
            logger.error(f"Error embedding query: {str(e)}")
            raise

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Embed a list of document strings.
        """
        try:
            if not self._check_model():
                return []
            embeddings = []
            for text in texts:
                response = ollama.embeddings(model=self.model, prompt=text)
                embeddings.append(response["embedding"])
            return embeddings
        except Exception as e:
            logger.error(f"Error embedding documents: {str(e)}")
            raise


# Global instance
embedder = Embedder()
