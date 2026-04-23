import logging
from typing import List, Optional

from api.llm.vector_store import cases_store
from api.models.jurisprudence.cas_similaire import CasSimilaire

logger = logging.getLogger(__name__)


class JurisprudenceQuery:
    """
    Handles queries for legal cases and similarity search.
    """

    @staticmethod
    async def find_similar_cases(query_text: str, k: int = 5) -> List[dict]:
        """
        Perform vector search to find similar cases.
        """
        try:
            logger.info(f"Searching for cases similar to: {query_text[:50]}...")
            
            # Search in vector store
            docs = cases_store.similarity_search(query_text, k=k)
            
            similar_cases = []
            for doc in docs:
                # We expect the vector store metadata to have the case ID
                case_id = doc.metadata.get("case_id")
                
                # In a real scenario, we'd fetch the full case from MongoDB
                # For now, we use the content from vector store
                similar_cases.append({
                    "id": case_id,
                    "title": doc.metadata.get("case_title", "Cas similaire"),
                    "score": 0.85,  # Dummy score
                    "summary": doc.page_content[:200] + "...",
                    "metadata": doc.metadata
                })
                
            return similar_cases
        except Exception as e:
            logger.error(f"Error finding similar cases: {str(e)}")
            return []

    @staticmethod
    async def get_all_cases() -> List[CasSimilaire]:
        """
        Get all historical cases from the database.
        """
        return await CasSimilaire.find_all().to_list()
