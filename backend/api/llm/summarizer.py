import logging

import ollama

logger = logging.getLogger(__name__)


class JurisSummarizer:
    """
    Summarizes legal cases and jurisprudence using Ollama natively.
    """

    def __init__(self, model: str = "tinyllama"):
        self.model = model

    async def summarize(self, content: str) -> str:
        """
        Summarize the given legal content.
        """
        try:
            if not content:
                return ""

            prompt = (
                "Tu es un expert en droit béninois. Ta mission est de résumer une jurisprudence de manière concise et factuelle, "
                "sans inventer de détails (pas d'hallucination).\n\n"
                f"Jurisprudence: {content}\n\n"
                "Résumé (maximum 150 mots):"
            )

            response = ollama.generate(model=self.model, prompt=prompt)
            return response["response"].strip()
        except Exception as e:
            logger.error(f"Error summarizing jurisprudence: {str(e)}")
            return "Résumé indisponible."


summarizer = JurisSummarizer()
