import logging

import ollama

logger = logging.getLogger(__name__)


class DisputeClassifier:
    """
    Uses LLM to classify legal disputes in labor law using Ollama natively.
    """

    def __init__(self, model: str = "tinyllama"):
        self.model = model

    async def classify(self, details: str) -> str:
        """
        Classify a dispute based on text details.
        """
        try:
            if not details:
                return "Non spécifié"

            prompt = (
                "Tu es un expert en droit du travail béninois. Ta mission est de classifier le type de litige en fonction des détails fournis.\n\n"
                f"Détails du dossier: {details}\n\n"
                "Classifie ce litige en une catégorie courte (ex: Licenciement abusif, Rupture conventionnelle, Démission sous contrainte). "
                "Réponds uniquement par le nom de la catégorie."
            )

            response = ollama.generate(model=self.model, prompt=prompt)
            return response["response"].strip()
        except Exception as e:
            logger.error(f"Error classifying dispute: {str(e)}")
            return "Indéterminé"


classifier = DisputeClassifier()
