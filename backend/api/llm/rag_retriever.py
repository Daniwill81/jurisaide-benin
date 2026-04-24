import logging
from typing import List

from api.llm.vector_store import articles_store
from api.models.calcul import CalculationRequest

logger = logging.getLogger(__name__)


class RAGRetriever:
    """
    Handles Retrieval Augmented Generation for legal citations.
    """

    @staticmethod
    async def get_citations(calculation: CalculationRequest) -> List[dict]:
        """
        Retrieve relevant legal citations based on calculation details.
        """
        try:
            # Construct a query string from calculation details
            query_parts = [
                f"Licenciement d'un {calculation.category.value}",
                f"Contrat {calculation.contract_type.value}",
            ]

            if calculation.termination_reason:
                query_parts.append(f"Motif: {calculation.termination_reason.value}")

            query_parts.append(f"Ancienneté: {calculation.seniority_years} ans")

            query = " ".join(query_parts)
            logger.info(f"RAG Query: {query}")

            # Search in vector store
            docs = articles_store.similarity_search(query, k=3)

            citations = []
            for doc in docs:
                metadata = doc.get("metadata", {})
                citations.append(
                    {
                        "law": metadata.get("law_name", "Loi 98-004"),
                        "article": metadata.get("article_number", "Inconnu"),
                        "content": doc.get("page_content", ""),
                        "relevance_score": 0.95,
                    }
                )

            return citations
        except Exception as e:
            logger.error(f"Error retrieving citations: {str(e)}")
            return []


rag_retriever = RAGRetriever()
