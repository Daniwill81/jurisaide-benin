import logging
from typing import List

from api.models.dossier.dossier import Dossier
from api.query.jurisprudence import JurisprudenceQuery

logger = logging.getLogger(__name__)


async def score_dossier_similarity(dossier_id: str):
    """
    Background task to calculate similarity between a dossier and historical cases.
    """
    try:
        logger.info(f"Starting similarity scoring for dossier {dossier_id}")
        dossier = await Dossier.get(dossier_id)
        if not dossier:
            logger.error(f"Dossier {dossier_id} not found")
            return

        # Use dispute details description or title for similarity search
        query_text = ""
        if dossier.dispute_details:
            query_text = dossier.dispute_details.description
        
        if not query_text:
            query_text = dossier.title
            
        similar_cases = await JurisprudenceQuery.find_similar_cases(query_text, k=5)
        
        dossier.similar_cases = similar_cases
        await dossier.save()
        
        logger.info(f"Similarity scoring completed for dossier {dossier_id}. Found {len(similar_cases)} cases.")
    except Exception as e:
        logger.error(f"Error scoring similarity for dossier {dossier_id}: {str(e)}")


async def process_dossier_ai(dossier_id: str):
    """
    Background task to summarize and classify a dossier.
    """
    try:
        from api.llm.classifier import classifier
        from api.llm.summarizer import summarizer

        logger.info(f"Starting AI processing for dossier {dossier_id}")
        dossier = await Dossier.get(dossier_id)
        if not dossier:
            return

        content = ""
        if dossier.dispute_details:
            content = f"Nature: {dossier.dispute_details.nature}. Description: {dossier.dispute_details.description}"
        else:
            content = dossier.title

        # Summarize
        dossier.summary = await summarizer.summarize(content)
        
        # Classify
        dossier.classification = await classifier.classify(content)
        
        await dossier.save()
        logger.info(f"AI processing completed for dossier {dossier_id}")
        
        # Also run similarity search
        await score_dossier_similarity(dossier_id)
    except Exception as e:
        logger.error(f"Error in AI processing for dossier {dossier_id}: {str(e)}")
