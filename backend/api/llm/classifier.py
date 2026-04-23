import logging
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from AppMain.settings import AppSettings

logger = logging.getLogger(__name__)


class DisputeClassifier:
    """
    Uses LLM to classify legal disputes in labor law.
    """

    def __init__(self):
        self.llm = ChatOpenAI(
            openai_api_key=AppSettings.OPENAI_API_KEY,
            model="gpt-4o-mini",
            temperature=0
        )
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", "Tu es un expert en droit du travail béninois. Ta mission est de classifier le type de litige en fonction des détails fournis."),
            ("user", "Détails du dossier: {details}\n\nClassifie ce litige en une catégorie courte (ex: Licenciement abusif, Rupture conventionnelle, Démission sous contrainte). Réponds uniquement par le nom de la catégorie.")
        ])
        
        self.chain = self.prompt | self.llm | StrOutputParser()

    async def classify(self, details: str) -> str:
        """
        Classify a dispute based on text details.
        """
        try:
            if not details:
                return "Non spécifié"
            
            result = await self.chain.ainvoke({"details": details})
            return result.strip()
        except Exception as e:
            logger.error(f"Error classifying dispute: {str(e)}")
            return "Indéterminé"


classifier = DisputeClassifier()
